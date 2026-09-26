namespace DokunmatikKalibrasyon
{
    // Dokunmanın Windows'a hangi yoldan geldiği. Kalibrasyon sırasında öğrenilir ve
    // düzeltme yalnızca bu kaynaktan gelen olaylara uygulanır.
    internal static class InputSource
    {
        // Windows'un kendi dokunma girişi (HID dokunmatik ekran / kalem).
        public const string WindowsTouch = "WT";
        // Başka bir programın ürettiği fare olayları (ör. UPDD ya da üretici sürücüsü).
        public const string Injected = "INJ";
        // Doğrudan USB fare-tipi cihaz: "HW:VID_xxxx&PID_yyyy".
        public const string HardwarePrefix = "HW:";

        public static string Hardware(string deviceKey)
        {
            return string.IsNullOrEmpty(deviceKey) ? null : HardwarePrefix + deviceKey;
        }

        public static string HardwareKey(string source)
        {
            return source != null && source.StartsWith(HardwarePrefix) ? source.Substring(HardwarePrefix.Length) : null;
        }

        public static string Describe(string source)
        {
            if (string.IsNullOrEmpty(source)) return "bilinmiyor";
            if (source == WindowsTouch) return "Windows dokunma girişi (HID dokunmatik ekran)";
            if (source == Injected) return "başka bir programın ürettiği fare olayları (ör. UPDD / üretici sürücüsü)";
            string key = HardwareKey(source);
            if (key != null) return "USB fare-tipi cihaz " + key;
            return source;
        }
    }
}
