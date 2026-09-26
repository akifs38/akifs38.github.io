using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.Win32;

namespace DokunmatikKalibrasyon
{
    // Ayarlar %APPDATA%\DokunmatikKalibrasyon\ayarlar.ini dosyasında saklanır.
    internal sealed class Settings
    {
        private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string RunValue = "DokunmatikKalibrasyon";

        public AffineTransform Transform;
        public double RmsError = double.NaN;
        public string DevicePath;
        public string DeviceName;
        public bool DeviceFilter = true;
        public bool CorrectionEnabled = true;
        public int PointCount = 5;
        public string ScreenName;

        public static string Folder
        {
            get
            {
                return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "DokunmatikKalibrasyon");
            }
        }

        public static string FilePath
        {
            get { return Path.Combine(Folder, "ayarlar.ini"); }
        }

        public static Settings Load()
        {
            var s = new Settings();
            try
            {
                if (!File.Exists(FilePath)) return s;
                var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (string line in File.ReadAllLines(FilePath, Encoding.UTF8))
                {
                    int eq = line.IndexOf('=');
                    if (eq <= 0 || line.StartsWith("#")) continue;
                    values[line.Substring(0, eq).Trim()] = line.Substring(eq + 1).Trim();
                }

                string v;
                if (values.TryGetValue("Donusum", out v)) s.Transform = AffineTransform.Parse(v);
                if (values.TryGetValue("RmsHata", out v))
                {
                    double d;
                    if (double.TryParse(v, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out d)) s.RmsError = d;
                }
                if (values.TryGetValue("CihazYolu", out v)) s.DevicePath = v;
                if (values.TryGetValue("CihazAdi", out v)) s.DeviceName = v;
                if (values.TryGetValue("CihazFiltresi", out v)) s.DeviceFilter = v != "0";
                if (values.TryGetValue("DuzeltmeAktif", out v)) s.CorrectionEnabled = v != "0";
                if (values.TryGetValue("NoktaSayisi", out v)) s.PointCount = v == "9" ? 9 : 5;
                if (values.TryGetValue("Ekran", out v)) s.ScreenName = v;
            }
            catch
            {
                // Bozuk ayar dosyası: varsayılanlarla devam et.
            }
            return s;
        }

        public void Save()
        {
            Directory.CreateDirectory(Folder);
            var sb = new StringBuilder();
            sb.AppendLine("# Dokunmatik Kalibrasyon ayarları");
            if (Transform != null) sb.AppendLine("Donusum=" + Transform.Serialize());
            if (!double.IsNaN(RmsError))
                sb.AppendLine("RmsHata=" + RmsError.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture));
            if (!string.IsNullOrEmpty(DevicePath)) sb.AppendLine("CihazYolu=" + DevicePath);
            if (!string.IsNullOrEmpty(DeviceName)) sb.AppendLine("CihazAdi=" + DeviceName);
            sb.AppendLine("CihazFiltresi=" + (DeviceFilter ? "1" : "0"));
            sb.AppendLine("DuzeltmeAktif=" + (CorrectionEnabled ? "1" : "0"));
            sb.AppendLine("NoktaSayisi=" + PointCount);
            if (!string.IsNullOrEmpty(ScreenName)) sb.AppendLine("Ekran=" + ScreenName);
            File.WriteAllText(FilePath, sb.ToString(), Encoding.UTF8);
        }

        public static bool AutoStart
        {
            get
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKey))
                    return key != null && key.GetValue(RunValue) != null;
            }
            set
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RunKey))
                {
                    if (key == null) return;
                    if (value)
                        key.SetValue(RunValue, "\"" + System.Windows.Forms.Application.ExecutablePath + "\" --tepsi");
                    else if (key.GetValue(RunValue) != null)
                        key.DeleteValue(RunValue);
                }
            }
        }
    }
}
