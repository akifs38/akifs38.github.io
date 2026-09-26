using System;
using System.Collections.Generic;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    internal enum EngineMode
    {
        PassThrough, // hiçbir şeye dokunma
        Capture,     // kalibrasyon: dokunmaları yakala, imleci oynatma
        Correct      // dokunmaları dönüşümle düzeltip yeniden gönder
    }

    // Dokunmatiğin ürettiği fare olaylarını düşük seviye fare kancası (WH_MOUSE_LL)
    // ile yakalar. Olayın hangi cihazdan geldiğini Raw Input (WM_INPUT) ile anlar;
    // böylece normal fare etkilenmeden yalnızca seçilen dokunmatik düzeltilir.
    //
    // Önemli: Windows fare kancasını, aynı olayın WM_INPUT mesajından ÖNCE çağırır.
    // Bu yüzden kanca anında olayın hangi cihazdan geldiği çoğu zaman henüz bilinmez.
    // Çözüm:
    //  - Son WM_INPUT çok yeniyse (aynı hareketin devamı) o cihaz kabul edilir.
    //  - Değilse (ör. bir süre sonra gelen ilk dokunma) olay bekletilir (yutulur);
    //    hemen ardından gelen WM_INPUT cihazı söyleyince olay ya düzeltilerek ya da
    //    olduğu gibi yeniden gönderilir. Gecikme birkaç milisaniyedir.
    internal sealed class InputEngine : NativeWindow, IDisposable
    {
        // Kendi enjekte ettiğimiz olayları tanımak için işaret ("TCLB").
        private static readonly IntPtr Marker = new IntPtr(0x54434C42);
        private const int RawBufferSize = 1024;
        private const int ContinuityMs = 50;      // bu süre içindeki olaylar aynı cihazın devamı sayılır
        private const int PendingTimeoutMs = 100; // WM_INPUT gelmezse bekleyen olaylar normal fare sayılır

        private struct MouseEvent
        {
            public int Msg;
            public Point Pt;
            public uint MouseData;
            public int Tick;
        }

        private readonly SynchronizationContext ui;
        private readonly NativeMethods.LowLevelMouseProc hookProc;
        private readonly Dictionary<IntPtr, string> deviceNames = new Dictionary<IntPtr, string>();
        private readonly Dictionary<IntPtr, string> deviceKeys = new Dictionary<IntPtr, string>();
        private readonly List<Point> samples = new List<Point>();
        private readonly DeviceRouter<MouseEvent> router = new DeviceRouter<MouseEvent>(ContinuityMs, PendingTimeoutMs);
        private readonly Action<MouseEvent, bool> resolveOne;
        private readonly System.Windows.Forms.Timer pendingTimer = new System.Windows.Forms.Timer();
        private readonly NativeMethods.INPUT[] injectBuffer = new NativeMethods.INPUT[1];
        private readonly int inputSize = Marshal.SizeOf(typeof(NativeMethods.INPUT));
        private readonly uint rawHeaderSize = (uint)Marshal.SizeOf(typeof(NativeMethods.RAWINPUTHEADER));
        private IntPtr rawBuffer;
        private IntPtr hook;

        private EngineMode mode = EngineMode.PassThrough;
        private AffineTransform transform = AffineTransform.Identity;
        private string correctSource;
        private string targetKey;
        private bool capturePressed;
        private string captureHint;
        private int captureDownTick;
        private string lastDownKey;
        private int lastDownTick;
        private string lastAnyKey;
        private bool detecting;
        private Point lastInjected = new Point(int.MinValue, int.MinValue);

        // Kalibrasyon noktası: medyan konum ve dokunmanın kaynağı (InputSource).
        public event Action<Point, string> PointCaptured;
        public event Action TouchDown;
        public event Action<string> DeviceDetected;
        public event Action WindowsTouchDetected;

        public InputEngine()
        {
            ui = SynchronizationContext.Current ?? new WindowsFormsSynchronizationContext();
            hookProc = HookCallback;
            resolveOne = ResolveOne;
            DeviceFilter = true;
            pendingTimer.Interval = 20;
            pendingTimer.Tick += OnPendingTimer;
        }

        public EngineMode Mode
        {
            get { return mode; }
            set
            {
                // Bekleyen olaylar varsa önce eski moda göre sonuçlandır.
                if (router.PendingCount > 0) router.Flush(resolveOne);
                router.Reset();
                mode = value;
                capturePressed = false;
                samples.Clear();
                lastInjected = new Point(int.MinValue, int.MinValue);
            }
        }

        public AffineTransform Transform
        {
            get { return transform; }
            set { transform = value ?? AffineTransform.Identity; }
        }

        // Düzeltilecek kaynak (InputSource): kalibrasyon sırasında öğrenilir.
        // Donanım cihazı VID/PID ile eşleştirilir; başka USB girişine takılsa da tanınır.
        public string CorrectSource
        {
            get { return correctSource; }
            set
            {
                correctSource = value;
                targetKey = InputSource.HardwareKey(value);
            }
        }

        // true: yalnızca CorrectSource kaynağından gelen olaylar düzeltilir.
        public bool DeviceFilter { get; set; }

        public bool FilterActive
        {
            get { return DeviceFilter && !string.IsNullOrEmpty(correctSource); }
        }

        public void Start()
        {
            if (Handle != IntPtr.Zero) return;

            var cp = new CreateParams();
            cp.Caption = "DokunmatikKalibrasyonRawInput";
            cp.ExStyle = 0x00000080; // WS_EX_TOOLWINDOW, görünmez pencere
            CreateHandle(cp);

            rawBuffer = Marshal.AllocHGlobal(RawBufferSize);

            var rid = new NativeMethods.RAWINPUTDEVICE[1];
            rid[0].usUsagePage = 0x01; // Generic Desktop
            rid[0].usUsage = 0x02;     // Mouse
            rid[0].dwFlags = NativeMethods.RIDEV_INPUTSINK;
            rid[0].hwndTarget = Handle;
            NativeMethods.RegisterRawInputDevices(rid, 1, (uint)Marshal.SizeOf(typeof(NativeMethods.RAWINPUTDEVICE)));

            hook = NativeMethods.SetWindowsHookEx(NativeMethods.WH_MOUSE_LL, hookProc,
                NativeMethods.GetModuleHandle(null), 0);
            if (hook == IntPtr.Zero)
                throw new InvalidOperationException("Fare kancası kurulamadı (hata " + Marshal.GetLastWin32Error() + ").");
        }

        public void BeginDetect()
        {
            detecting = true;
        }

        public void CancelDetect()
        {
            detecting = false;
        }

        // ---------------- Raw Input ----------------

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_INPUT)
                ProcessRawInput(m.LParam, NativeMethods.GetMessageTime());
            base.WndProc(ref m);
        }

        // eventTime: olayın kendi zaman damgası (GetTickCount saati). İşlendiği an değil,
        // olduğu an kullanılır; böylece geç işlenen eski bir WM_INPUT yeni sanılmaz.
        private void ProcessRawInput(IntPtr hRawInput, int eventTime)
        {
            uint size = 0;
            NativeMethods.GetRawInputData(hRawInput, NativeMethods.RID_INPUT, IntPtr.Zero, ref size, rawHeaderSize);
            if (size == 0 || size > RawBufferSize) return;
            uint read = NativeMethods.GetRawInputData(hRawInput, NativeMethods.RID_INPUT, rawBuffer, ref size, rawHeaderSize);
            if (read == 0 || read == uint.MaxValue) return;

            if ((uint)Marshal.ReadInt32(rawBuffer, 0) != NativeMethods.RIM_TYPEMOUSE) return;
            IntPtr device = Marshal.ReadIntPtr(rawBuffer, 8);
            if (device == IntPtr.Zero) return; // SendInput ile enjekte edilmiş olay

            int offset = (int)rawHeaderSize;
            ushort usFlags = (ushort)Marshal.ReadInt16(rawBuffer, offset);
            ushort buttonFlags = (ushort)Marshal.ReadInt16(rawBuffer, offset + 4);

            string name = GetCachedName(device);
            string key = GetCachedKey(device, name);
            // Kalibrasyonda: mutlak konum bildiren cihaz (dokunmatik) hedef sayılır, normal fare
            // (göreli hareket) serbest kalır. Düzeltmede: kalibrasyonda öğrenilen cihaz hedeftir.
            bool isTarget = mode == EngineMode.Capture
                ? (usFlags & NativeMethods.MOUSE_MOVE_ABSOLUTE) != 0
                : key != null && targetKey != null && key == targetKey;
            lastAnyKey = key;
            if ((buttonFlags & NativeMethods.RI_MOUSE_LEFT_BUTTON_DOWN) != 0)
            {
                lastDownKey = key;
                lastDownTick = eventTime;
            }

            // Bu WM_INPUT, kancada bekletilen olay(lar)ın hangi cihazdan geldiğini söyler.
            router.OnRaw(isTarget, eventTime, resolveOne);
            if (router.PendingCount == 0) pendingTimer.Stop();

            if (detecting && name != null &&
                ((usFlags & NativeMethods.MOUSE_MOVE_ABSOLUTE) != 0 ||
                 (buttonFlags & NativeMethods.RI_MOUSE_LEFT_BUTTON_DOWN) != 0))
            {
                detecting = false;
                string detected = name;
                Post(delegate { var h = DeviceDetected; if (h != null) h(detected); });
            }
        }

        private string GetCachedName(IntPtr device)
        {
            string name;
            if (!deviceNames.TryGetValue(device, out name))
            {
                name = InputDevices.GetDeviceName(device);
                deviceNames[device] = name;
            }
            return name;
        }

        private string GetCachedKey(IntPtr device, string name)
        {
            string key;
            if (!deviceKeys.TryGetValue(device, out key))
            {
                key = InputDevices.DeviceKey(name);
                deviceKeys[device] = key;
            }
            return key;
        }

        // Kanca çağrısı, kuyrukta bekleyen WM_INPUT mesajlarından önce işlenir.
        // Karar vermeden önce önceki olayların WM_INPUT'larını işleriz.
        private void DrainRawInput()
        {
            NativeMethods.MSG msg;
            int guard = 0;
            while (guard++ < 64 && NativeMethods.PeekMessage(out msg, Handle,
                       NativeMethods.WM_INPUT, NativeMethods.WM_INPUT,
                       NativeMethods.PM_REMOVE | NativeMethods.PM_QS_RAWINPUT))
            {
                ProcessRawInput(msg.lParam, unchecked((int)msg.time));
                NativeMethods.DefWindowProc(msg.hwnd, msg.message, msg.wParam, msg.lParam);
            }
        }

        // ---------------- Fare kancası ----------------

        // Kanca içinde bir hata olursa girdi asla engellenmesin: olay olduğu gibi geçer.
        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            try
            {
                return HookCallbackCore(nCode, wParam, lParam);
            }
            catch
            {
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
            }
        }

        private IntPtr HookCallbackCore(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode != NativeMethods.HC_ACTION || (mode == EngineMode.PassThrough && !detecting))
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            var info = (NativeMethods.MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(NativeMethods.MSLLHOOKSTRUCT));
            int msg = wParam.ToInt32();

            if (info.dwExtraInfo == Marker)
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            uint extra = unchecked((uint)(info.dwExtraInfo.ToInt64() & 0xFFFFFFFF));
            bool windowsTouch = (extra & NativeMethods.MI_WP_SIGNATURE_MASK) == NativeMethods.MI_WP_SIGNATURE;
            bool injected = (info.flags & (NativeMethods.LLMHF_INJECTED | NativeMethods.LLMHF_LOWER_IL_INJECTED)) != 0;

            if (windowsTouch && detecting && msg == NativeMethods.WM_LBUTTONDOWN)
            {
                // Windows bu cihazı zaten gerçek dokunmatik olarak tanıyor.
                detecting = false;
                Post(delegate { var h = WindowsTouchDetected; if (h != null) h(); });
            }
            if (mode == EngineMode.PassThrough)
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            var ev = new MouseEvent
            {
                Msg = msg,
                Pt = new Point(info.pt.X, info.pt.Y),
                MouseData = info.mouseData,
                Tick = unchecked((int)info.time)
            };
            // null = donanım cihazı (hangisi olduğu WM_INPUT ile anlaşılır)
            string hint = windowsTouch ? InputSource.WindowsTouch : injected ? InputSource.Injected : null;

            if (mode == EngineMode.Capture)
            {
                // Kalibrasyon: dokunma hangi yoldan gelirse gelsin yakalanır ve kaynağı kaydedilir.
                // Donanım olaylarında yalnızca mutlak konumlu cihaz (dokunmatik) yakalanır;
                // normal fare çalışmaya devam eder, böylece PC kilitlenmez.
                if (hint == null) return RouteHardware(ev, nCode, wParam, lParam);
                return HandleCapture(ev.Msg, ev.Pt, hint, ev.Tick)
                    ? new IntPtr(1) : NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
            }

            // Düzeltme modu
            bool handled;
            if (!FilterActive)
                handled = HandleCorrect(ev.Msg, ev.Pt, ev.MouseData);
            else if (correctSource == InputSource.WindowsTouch)
                handled = windowsTouch && HandleCorrect(ev.Msg, ev.Pt, ev.MouseData);
            else if (correctSource == InputSource.Injected)
                handled = injected && !windowsTouch && HandleCorrect(ev.Msg, ev.Pt, ev.MouseData);
            else if (hint != null)
                handled = false; // donanım cihazı bekleniyor, bu olay başka yoldan geldi
            else
                return RouteHardware(ev, nCode, wParam, lParam);

            return handled ? new IntPtr(1) : NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
        }

        // Donanım olayını cihazına göre yönlendirir (bkz. DeviceRouter).
        private IntPtr RouteHardware(MouseEvent ev, int nCode, IntPtr wParam, IntPtr lParam)
        {
            DrainRawInput();
            switch (router.OnHook(ev, ev.Tick))
            {
                case Route.Other:
                    return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
                case Route.Target:
                    return Process(ev) ? new IntPtr(1) : NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
                default:
                    // Cihaz henüz belli değil: olay yutuldu, WM_INPUT gelince karar verilecek.
                    if (!pendingTimer.Enabled) pendingTimer.Start();
                    return new IntPtr(1);
            }
        }

        private bool Process(MouseEvent ev)
        {
            switch (mode)
            {
                case EngineMode.Capture: return HandleCapture(ev.Msg, ev.Pt, null, ev.Tick);
                case EngineMode.Correct: return HandleCorrect(ev.Msg, ev.Pt, ev.MouseData);
                default: return false;
            }
        }

        // Bekletilen bir olayı sonuçlandırır: dokunmatiktense düzeltir/yakalar,
        // değilse (normal fare) hiç değiştirmeden yeniden gönderir.
        private void ResolveOne(MouseEvent ev, bool isTarget)
        {
            bool handled = isTarget && Process(ev);
            if (!handled) Reinject(ev);
        }

        private void OnPendingTimer(object sender, EventArgs e)
        {
            DrainRawInput();
            router.OnTimer(Environment.TickCount, resolveOne);
            if (router.PendingCount == 0) pendingTimer.Stop();
        }

        private bool HandleCapture(int msg, Point pt, string hint, int tick)
        {
            switch (msg)
            {
                case NativeMethods.WM_LBUTTONDOWN:
                    capturePressed = true;
                    captureHint = hint;
                    captureDownTick = tick;
                    samples.Clear();
                    samples.Add(pt);
                    Post(delegate { var h = TouchDown; if (h != null) h(); });
                    return true;
                case NativeMethods.WM_MOUSEMOVE:
                    if (capturePressed && samples.Count < 2000) samples.Add(pt);
                    return true;
                case NativeMethods.WM_LBUTTONUP:
                    if (capturePressed)
                    {
                        capturePressed = false;
                        samples.Add(pt);
                        Point p = Median(samples);
                        string source = CaptureSource();
                        Post(delegate { var h = PointCaptured; if (h != null) h(p, source); });
                    }
                    return true;
                case NativeMethods.WM_MOUSEWHEEL:
                case NativeMethods.WM_MOUSEHWHEEL:
                    return false;
                default:
                    return true;
            }
        }

        // Yakalanan basmanın kaynağı. Donanım olayında cihazı, basmayı bildiren WM_INPUT söyler.
        private string CaptureSource()
        {
            if (captureHint != null) return captureHint;
            DrainRawInput();
            if (lastDownKey != null && Math.Abs(unchecked(lastDownTick - captureDownTick)) <= 1000)
                return InputSource.Hardware(lastDownKey);
            return InputSource.Hardware(lastAnyKey);
        }

        private bool HandleCorrect(int msg, Point pt, uint mouseData)
        {
            if (msg == NativeMethods.WM_MOUSEWHEEL || msg == NativeMethods.WM_MOUSEHWHEEL)
                return false; // tekerlek olduğu gibi geçsin
            uint flags, data;
            if (!MouseFlagsFor(msg, mouseData, out flags, out data)) return false;

            Rectangle vs = VirtualScreen();
            Point p = transform.Apply(pt.X, pt.Y);
            p.X = Math.Max(vs.Left, Math.Min(vs.Right - 1, p.X));
            p.Y = Math.Max(vs.Top, Math.Min(vs.Bottom - 1, p.Y));

            if (msg == NativeMethods.WM_MOUSEMOVE && p == lastInjected)
                return true;
            lastInjected = p;
            Inject(p, flags, data);
            return true;
        }

        // Yutulmuş bir olayı hiç değiştirmeden yeniden gönderir.
        private void Reinject(MouseEvent ev)
        {
            uint flags, data;
            if (MouseFlagsFor(ev.Msg, ev.MouseData, out flags, out data))
                Inject(ev.Pt, flags, data);
        }

        private static bool MouseFlagsFor(int msg, uint mouseData, out uint flags, out uint data)
        {
            flags = NativeMethods.MOUSEEVENTF_MOVE | NativeMethods.MOUSEEVENTF_ABSOLUTE |
                    NativeMethods.MOUSEEVENTF_VIRTUALDESK;
            data = 0;
            switch (msg)
            {
                case NativeMethods.WM_MOUSEMOVE: return true;
                case NativeMethods.WM_LBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_LEFTDOWN; return true;
                case NativeMethods.WM_LBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_LEFTUP; return true;
                case NativeMethods.WM_RBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_RIGHTDOWN; return true;
                case NativeMethods.WM_RBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_RIGHTUP; return true;
                case NativeMethods.WM_MBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_MIDDLEDOWN; return true;
                case NativeMethods.WM_MBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_MIDDLEUP; return true;
                case NativeMethods.WM_XBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_XDOWN; data = mouseData >> 16; return true;
                case NativeMethods.WM_XBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_XUP; data = mouseData >> 16; return true;
                case NativeMethods.WM_MOUSEWHEEL:
                    flags = NativeMethods.MOUSEEVENTF_WHEEL;
                    data = unchecked((uint)(int)(short)(mouseData >> 16));
                    return true;
                case NativeMethods.WM_MOUSEHWHEEL:
                    flags = NativeMethods.MOUSEEVENTF_HWHEEL;
                    data = unchecked((uint)(int)(short)(mouseData >> 16));
                    return true;
                default: return false;
            }
        }

        private void Inject(Point p, uint flags, uint data)
        {
            Rectangle vs = VirtualScreen();
            injectBuffer[0].type = NativeMethods.INPUT_MOUSE;
            injectBuffer[0].mi.dx = Normalize(p.X - vs.Left, vs.Width);
            injectBuffer[0].mi.dy = Normalize(p.Y - vs.Top, vs.Height);
            injectBuffer[0].mi.mouseData = data;
            injectBuffer[0].mi.dwFlags = flags;
            injectBuffer[0].mi.time = 0;
            injectBuffer[0].mi.dwExtraInfo = Marker;
            NativeMethods.SendInput(1, injectBuffer, inputSize);
        }

        private static int Normalize(int offset, int extent)
        {
            if (extent <= 1) return 0;
            long v = ((long)offset * 65536 + extent - 1) / extent;
            return (int)Math.Max(0, Math.Min(65535, v));
        }

        public static Rectangle VirtualScreen()
        {
            return new Rectangle(
                NativeMethods.GetSystemMetrics(NativeMethods.SM_XVIRTUALSCREEN),
                NativeMethods.GetSystemMetrics(NativeMethods.SM_YVIRTUALSCREEN),
                Math.Max(1, NativeMethods.GetSystemMetrics(NativeMethods.SM_CXVIRTUALSCREEN)),
                Math.Max(1, NativeMethods.GetSystemMetrics(NativeMethods.SM_CYVIRTUALSCREEN)));
        }

        private static Point Median(List<Point> pts)
        {
            var xs = new int[pts.Count];
            var ys = new int[pts.Count];
            for (int i = 0; i < pts.Count; i++) { xs[i] = pts[i].X; ys[i] = pts[i].Y; }
            Array.Sort(xs);
            Array.Sort(ys);
            return new Point(xs[xs.Length / 2], ys[ys.Length / 2]);
        }

        private void Post(Action action)
        {
            ui.Post(delegate { action(); }, null);
        }

        public void Dispose()
        {
            pendingTimer.Stop();
            pendingTimer.Dispose();
            if (hook != IntPtr.Zero)
            {
                NativeMethods.UnhookWindowsHookEx(hook);
                hook = IntPtr.Zero;
            }
            if (Handle != IntPtr.Zero) DestroyHandle();
            if (rawBuffer != IntPtr.Zero)
            {
                Marshal.FreeHGlobal(rawBuffer);
                rawBuffer = IntPtr.Zero;
            }
        }
    }
}
