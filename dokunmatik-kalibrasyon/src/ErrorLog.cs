using System;
using System.IO;
using System.Text;

namespace DokunmatikKalibrasyon
{
    // Beklenmeyen hataları uygulamayı çökertmek yerine
    // %APPDATA%\DokunmatikKalibrasyon\hata.log dosyasına yazar.
    internal static class ErrorLog
    {
        private const int MaxEntriesPerSession = 50;
        private static int written;

        public static string FilePath
        {
            get { return Path.Combine(Settings.Folder, "hata.log"); }
        }

        public static void Write(string where, Exception ex)
        {
            if (written >= MaxEntriesPerSession) return;
            written++;
            try
            {
                Directory.CreateDirectory(Settings.Folder);
                var sb = new StringBuilder();
                sb.AppendLine("---- " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  sürüm " + Program.Version + "  [" + where + "]");
                sb.AppendLine(ex != null ? ex.ToString() : "(ayrıntı yok)");
                File.AppendAllText(FilePath, sb.ToString(), Encoding.UTF8);
            }
            catch
            {
                // Günlük yazılamazsa yapılacak bir şey yok.
            }
        }
    }
}
