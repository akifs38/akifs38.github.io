using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Dokunmatik Kalibrasyon")]
[assembly: System.Reflection.AssemblyProduct("Dokunmatik Kalibrasyon")]
[assembly: System.Reflection.AssemblyDescription("USB dokunmatik ekranlar için Windows 10 kalibrasyon aracı")]
[assembly: System.Reflection.AssemblyVersion("1.0.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("1.0.0.0")]

namespace DokunmatikKalibrasyon
{
    internal static class Program
    {
        private const int HWND_BROADCAST = 0xFFFF;

        // İkinci kez başlatılınca çalışan pencereyi öne getirmek için.
        public static readonly int ShowMessage = RegisterWindowMessage("DokunmatikKalibrasyon_Goster");

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

            bool startHidden = false;
            foreach (string a in args)
                if (string.Equals(a, "--tepsi", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(a, "--tray", StringComparison.OrdinalIgnoreCase))
                    startHidden = true;

            bool created;
            using (var mutex = new Mutex(true, @"Local\DokunmatikKalibrasyon", out created))
            {
                if (!created)
                {
                    PostMessage(new IntPtr(HWND_BROADCAST), ShowMessage, IntPtr.Zero, IntPtr.Zero);
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new MainForm(startHidden));
                GC.KeepAlive(mutex);
            }
        }
    }
}
