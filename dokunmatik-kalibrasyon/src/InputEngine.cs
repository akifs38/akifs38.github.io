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
    // ile yakalar. Olayın hangi cihazdan geldiğini Raw Input ile anlar; böylece
    // normal fare etkilenmeden yalnızca seçilen dokunmatik düzeltilir.
    internal sealed class InputEngine : NativeWindow, IDisposable
    {
        // Kendi enjekte ettiğimiz olayları tanımak için işaret ("TCLB").
        private static readonly IntPtr Marker = new IntPtr(0x54434C42);
        private const int RawBufferSize = 1024;
        private const int RawMatchWindowMs = 300;

        private readonly SynchronizationContext ui;
        private readonly NativeMethods.LowLevelMouseProc hookProc;
        private readonly Dictionary<IntPtr, string> deviceNames = new Dictionary<IntPtr, string>();
        private readonly List<Point> samples = new List<Point>();
        private readonly NativeMethods.INPUT[] injectBuffer = new NativeMethods.INPUT[1];
        private readonly int inputSize = Marshal.SizeOf(typeof(NativeMethods.INPUT));
        private readonly uint rawHeaderSize = (uint)Marshal.SizeOf(typeof(NativeMethods.RAWINPUTHEADER));
        private IntPtr rawBuffer;
        private IntPtr hook;

        private EngineMode mode = EngineMode.PassThrough;
        private AffineTransform transform = AffineTransform.Identity;
        private string targetDevicePath;
        private bool capturePressed;
        private bool detecting;
        private bool lastRawFromTarget;
        private int lastRawTick;
        private Point lastInjected = new Point(int.MinValue, int.MinValue);

        public event Action<Point> PointCaptured;
        public event Action TouchDown;
        public event Action<string> DeviceDetected;
        public event Action WindowsTouchDetected;

        public InputEngine()
        {
            ui = SynchronizationContext.Current ?? new WindowsFormsSynchronizationContext();
            hookProc = HookCallback;
            DeviceFilter = true;
        }

        public EngineMode Mode
        {
            get { return mode; }
            set
            {
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

        // Seçili cihazın Raw Input yolu (\\?\HID#VID_...). Boşsa tüm fare olayları işlenir.
        public string TargetDevicePath
        {
            get { return targetDevicePath; }
            set { targetDevicePath = value; }
        }

        // true: yalnızca TargetDevicePath cihazından gelen olaylar işlenir.
        public bool DeviceFilter { get; set; }

        public bool FilterActive
        {
            get { return DeviceFilter && !string.IsNullOrEmpty(targetDevicePath); }
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
                ProcessRawInput(m.LParam);
            base.WndProc(ref m);
        }

        private void ProcessRawInput(IntPtr hRawInput)
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
            lastRawFromTarget = name != null && targetDevicePath != null &&
                                string.Equals(name, targetDevicePath, StringComparison.OrdinalIgnoreCase);
            lastRawTick = Environment.TickCount;

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

        // Kanca çağrısı, kuyruğa daha önce konmuş WM_INPUT mesajlarından önce
        // işlenir. Bu yüzden karar vermeden önce bekleyen WM_INPUT'ları işleriz.
        private void DrainRawInput()
        {
            NativeMethods.MSG msg;
            int guard = 0;
            while (guard++ < 64 && NativeMethods.PeekMessage(out msg, Handle,
                       NativeMethods.WM_INPUT, NativeMethods.WM_INPUT,
                       NativeMethods.PM_REMOVE | NativeMethods.PM_QS_RAWINPUT))
            {
                NativeMethods.DispatchMessage(ref msg);
            }
        }

        private bool IsFromTarget()
        {
            if (!FilterActive) return true;
            DrainRawInput();
            return lastRawFromTarget && unchecked(Environment.TickCount - lastRawTick) < RawMatchWindowMs;
        }

        // ---------------- Fare kancası ----------------

        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode != NativeMethods.HC_ACTION || (mode == EngineMode.PassThrough && !detecting))
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            var info = (NativeMethods.MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(NativeMethods.MSLLHOOKSTRUCT));
            int msg = wParam.ToInt32();

            if (info.dwExtraInfo == Marker)
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            uint extra = unchecked((uint)(info.dwExtraInfo.ToInt64() & 0xFFFFFFFF));
            if ((extra & NativeMethods.MI_WP_SIGNATURE_MASK) == NativeMethods.MI_WP_SIGNATURE)
            {
                // Windows bu cihazı zaten gerçek dokunmatik olarak tanıyor.
                if (detecting && msg == NativeMethods.WM_LBUTTONDOWN)
                {
                    detecting = false;
                    Post(delegate { var h = WindowsTouchDetected; if (h != null) h(); });
                }
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
            }

            if ((info.flags & (NativeMethods.LLMHF_INJECTED | NativeMethods.LLMHF_LOWER_IL_INJECTED)) != 0 ||
                mode == EngineMode.PassThrough || !IsFromTarget())
                return NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);

            bool swallow = mode == EngineMode.Capture
                ? HandleCapture(msg, new Point(info.pt.X, info.pt.Y))
                : HandleCorrect(msg, new Point(info.pt.X, info.pt.Y), info.mouseData);

            return swallow ? new IntPtr(1) : NativeMethods.CallNextHookEx(hook, nCode, wParam, lParam);
        }

        private bool HandleCapture(int msg, Point pt)
        {
            switch (msg)
            {
                case NativeMethods.WM_LBUTTONDOWN:
                    capturePressed = true;
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
                        Post(delegate { var h = PointCaptured; if (h != null) h(p); });
                    }
                    return true;
                case NativeMethods.WM_MOUSEWHEEL:
                case NativeMethods.WM_MOUSEHWHEEL:
                    return false;
                default:
                    return true;
            }
        }

        private bool HandleCorrect(int msg, Point pt, uint mouseData)
        {
            uint flags = NativeMethods.MOUSEEVENTF_MOVE | NativeMethods.MOUSEEVENTF_ABSOLUTE |
                         NativeMethods.MOUSEEVENTF_VIRTUALDESK;
            uint data = 0;

            switch (msg)
            {
                case NativeMethods.WM_MOUSEMOVE: break;
                case NativeMethods.WM_LBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_LEFTDOWN; break;
                case NativeMethods.WM_LBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_LEFTUP; break;
                case NativeMethods.WM_RBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_RIGHTDOWN; break;
                case NativeMethods.WM_RBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_RIGHTUP; break;
                case NativeMethods.WM_MBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_MIDDLEDOWN; break;
                case NativeMethods.WM_MBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_MIDDLEUP; break;
                case NativeMethods.WM_XBUTTONDOWN: flags |= NativeMethods.MOUSEEVENTF_XDOWN; data = mouseData >> 16; break;
                case NativeMethods.WM_XBUTTONUP: flags |= NativeMethods.MOUSEEVENTF_XUP; data = mouseData >> 16; break;
                default: return false; // tekerlek vb. olduğu gibi geçsin
            }

            Rectangle vs = VirtualScreen();
            Point p = transform.Apply(pt.X, pt.Y);
            p.X = Math.Max(vs.Left, Math.Min(vs.Right - 1, p.X));
            p.Y = Math.Max(vs.Top, Math.Min(vs.Bottom - 1, p.Y));

            if (msg == NativeMethods.WM_MOUSEMOVE && p == lastInjected)
                return true;
            lastInjected = p;

            injectBuffer[0].type = NativeMethods.INPUT_MOUSE;
            injectBuffer[0].mi.dx = Normalize(p.X - vs.Left, vs.Width);
            injectBuffer[0].mi.dy = Normalize(p.Y - vs.Top, vs.Height);
            injectBuffer[0].mi.mouseData = data;
            injectBuffer[0].mi.dwFlags = flags;
            injectBuffer[0].mi.time = 0;
            injectBuffer[0].mi.dwExtraInfo = Marker;
            NativeMethods.SendInput(1, injectBuffer, inputSize);
            return true;
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
