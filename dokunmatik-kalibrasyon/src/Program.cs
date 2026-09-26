using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Dokunmatik Kalibrasyon")]
[assembly: System.Reflection.AssemblyProduct("Dokunmatik Kalibrasyon")]
[assembly: System.Reflection.AssemblyDescription("USB dokunmatik ekranlar için Windows 10 kalibrasyon aracı")]
[assembly: System.Reflection.AssemblyVersion("1.5.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("1.5.0.0")]

namespace DokunmatikKalibrasyon
{
    internal static class Program
    {
        public const string Version = "1.5";

        private const int HWND_BROADCAST = 0xFFFF;
        private const string MutexName = @"Local\DokunmatikKalibrasyon";

        // Aynı exe ikinci kez başlatılınca çalışan pencereyi öne getirir.
        public static readonly int ShowMessage = RegisterWindowMessage("DokunmatikKalibrasyon_Goster");
        // Farklı bir exe (ör. yeni sürüm) başlatılınca çalışan kopyadan kapanmasını ister.
        public static readonly int QuitMessage = RegisterWindowMessage("DokunmatikKalibrasyon_Cik");

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int RegisterWindowMessage(string lpString);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool PostMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

        [STAThread]
        private static void Main(string[] args)
        {
            // Kanca koordinatları fiziksel piksel olduğu için pencereler de öyle olmalı.
            // (Manifest zaten ayarlar; bu yalnızca yedek.)
            try
            {
                if (!NativeMethods.SetProcessDpiAwarenessContext(NativeMethods.DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2))
                    NativeMethods.SetProcessDPIAware();
            }
            catch (EntryPointNotFoundException)
            {
                NativeMethods.SetProcessDPIAware();
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool startHidden = false;
            foreach (string a in args)
                if (string.Equals(a, "--tepsi", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(a, "--tray", StringComparison.OrdinalIgnoreCase))
                    startHidden = true;

            bool created;
            var mutex = new Mutex(true, MutexName, out created);
            bool owned = created;
            try
            {
                if (!created)
                {
                    Process[] others = OtherInstances();
                    if (IsSameExe(others))
                    {
                        // Aynı program zaten çalışıyor (ör. tepside): penceresini göster.
                        PostMessage(new IntPtr(HWND_BROADCAST), ShowMessage, IntPtr.Zero, IntPtr.Zero);
                        return;
                    }

                    // Başka bir exe çalışıyor (genellikle eski sürüm tepside kalmış): onu kapat, yerine geç.
                    owned = ReplaceOtherInstance(mutex, others);
                    if (!owned)
                    {
                        MessageBox.Show(
                            "Dokunmatik Kalibrasyon'un başka bir kopyası çalışıyor ve kapatılamadı.\n\n" +
                            "Görev Yöneticisi'nde (Ctrl+Shift+Esc) \"DokunmatikKalibrasyon\" işlemini sonlandırıp tekrar deneyin.",
                            "Dokunmatik Kalibrasyon", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                }

                Application.Run(new MainForm(startHidden));
            }
            finally
            {
                if (owned)
                {
                    try { mutex.ReleaseMutex(); }
                    catch (ApplicationException) { }
                }
                mutex.Dispose();
            }
        }

        private static Process[] OtherInstances()
        {
            var result = new List<Process>();
            Process me = Process.GetCurrentProcess();
            foreach (Process p in Process.GetProcessesByName(me.ProcessName))
                if (p.Id != me.Id) result.Add(p);
            return result.ToArray();
        }

        private static bool IsSameExe(Process[] others)
        {
            string mine = Path.GetFullPath(Application.ExecutablePath);
            foreach (Process p in others)
            {
                try
                {
                    if (string.Equals(Path.GetFullPath(p.MainModule.FileName), mine, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
                catch
                {
                    // Erişilemeyen işlem (ör. yönetici olarak çalışıyor): farklı kabul et.
                }
            }
            return false;
        }

        private static bool ReplaceOtherInstance(Mutex mutex, Process[] others)
        {
            // 1.3 ve sonrası bu mesajla düzgünce kapanır.
            PostMessage(new IntPtr(HWND_BROADCAST), QuitMessage, IntPtr.Zero, IntPtr.Zero);
            if (TryAcquire(mutex, 3000)) return true;

            // Eski sürümler bu mesajı tanımaz: işlemi sonlandır. Fare kancası Windows
            // tarafından otomatik kaldırılır; ayarlar zaten dosyaya kaydedilmiş durumda.
            foreach (Process p in others)
            {
                try
                {
                    p.Kill();
                    p.WaitForExit(3000);
                }
                catch
                {
                }
            }
            return TryAcquire(mutex, 3000);
        }

        private static bool TryAcquire(Mutex mutex, int milliseconds)
        {
            try
            {
                return mutex.WaitOne(milliseconds);
            }
            catch (AbandonedMutexException)
            {
                // Önceki sahibi kapanmadan sonlandırıldı; sahiplik artık bizde.
                return true;
            }
        }
    }
}
