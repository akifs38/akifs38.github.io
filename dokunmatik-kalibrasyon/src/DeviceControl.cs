using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

namespace DokunmatikKalibrasyon
{
    // Dokunmatiği UPDD gibi uygulamanın kendi kalibrasyonuyla kullanabilmek için
    // Windows'un dokunma parçasını ("HID-compliant touch screen") kapatır ya da açar.
    // Çift modlu dokunmatik kartlar bu parça kapalıyken "fare modunda" (mutlak konumlu
    // fare) çalışır; o yoldan gelen dokunuşları uygulama yakalayıp düzeltebilir.
    // Yönetici yetkisi gerekir; uygulama bunu kendini yönetici olarak yeniden çalıştırarak yapar.
    internal static class DeviceControl
    {
        public const string DisableArg = "--dokunmatik-kapat";
        public const string EnableArg = "--dokunmatik-ac";

        private const uint DIF_PROPERTYCHANGE = 0x12;
        private const uint DICS_ENABLE = 1;
        private const uint DICS_DISABLE = 2;
        private const uint DICS_PROPCHANGE = 3;
        private const uint DICS_FLAG_GLOBAL = 1;

        [StructLayout(LayoutKind.Sequential)]
        private struct SP_DEVINFO_DATA
        {
            public uint cbSize;
            public Guid ClassGuid;
            public uint DevInst;
            public IntPtr Reserved;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct SP_PROPCHANGE_PARAMS
        {
            public uint HeaderSize;        // SP_CLASSINSTALL_HEADER.cbSize
            public uint InstallFunction;   // SP_CLASSINSTALL_HEADER.InstallFunction
            public uint StateChange;
            public uint Scope;
            public uint HwProfile;
        }

        [DllImport("setupapi.dll", SetLastError = true)]
        private static extern IntPtr SetupDiCreateDeviceInfoList(IntPtr classGuid, IntPtr hwndParent);

        [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetupDiOpenDeviceInfo(IntPtr set, string instanceId, IntPtr hwnd, uint flags, ref SP_DEVINFO_DATA data);

        [DllImport("setupapi.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetupDiSetClassInstallParams(IntPtr set, ref SP_DEVINFO_DATA data, ref SP_PROPCHANGE_PARAMS p, int size);

        [DllImport("setupapi.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetupDiCallClassInstaller(uint function, IntPtr set, ref SP_DEVINFO_DATA data);

        [DllImport("setupapi.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetupDiDestroyDeviceInfoList(IntPtr set);

        [DllImport("cfgmgr32.dll")]
        private static extern int CM_Get_Parent(out uint parent, uint devInst, int flags);

        [DllImport("cfgmgr32.dll", CharSet = CharSet.Unicode)]
        private static extern int CM_Get_Device_ID(uint devInst, StringBuilder buffer, int length, int flags);

        // Raw Input yolundan aygıt örnek kimliği:
        // "\\?\HID#VID_1101&PID_0020&Col01#7&abc&0&0000#{guid}" -> "HID\VID_1101&PID_0020&COL01\7&ABC&0&0000"
        public static string InstanceIdFromPath(string path)
        {
            if (string.IsNullOrEmpty(path)) return null;
            string p = path;
            if (p.StartsWith(@"\\?\")) p = p.Substring(4);
            int guid = p.LastIndexOf("#{", StringComparison.Ordinal);
            if (guid > 0) p = p.Substring(0, guid);
            return p.Replace('#', '\\').ToUpperInvariant();
        }

        // Windows'un gerçek dokunmatik olarak kullandığı dokunma parçaları (HID touch screen).
        // Aynı VID/PID'de bir de fare parçası olanlar (çift modlu kartlar) öne alınır.
        public static List<InputDeviceInfo> FindWindowsTouchScreens()
        {
            List<InputDeviceInfo> all = InputDevices.Enumerate();
            var mouseKeys = new HashSet<string>();
            foreach (InputDeviceInfo d in all)
                if (d.Kind == DeviceKind.Mouse) mouseKeys.Add(InputDevices.DeviceKey(d.Path));

            var dual = new List<InputDeviceInfo>();
            var other = new List<InputDeviceInfo>();
            foreach (InputDeviceInfo d in all)
            {
                if (d.Kind != DeviceKind.TouchDigitizer || !d.IsTouchScreen) continue;
                if (mouseKeys.Contains(InputDevices.DeviceKey(d.Path))) dual.Add(d); else other.Add(d);
            }
            return dual.Count > 0 ? dual : other;
        }

        // Yönetici olarak çalışan kopyada çağrılır. Başarılıysa 0 döner.
        public static int Run(string arg, string idList)
        {
            bool enable = arg == EnableArg;
            int failures = 0;
            var parents = new List<string>();
            foreach (string raw in (idList ?? "").Split('|'))
            {
                string id = raw.Trim();
                if (id.Length == 0) continue;
                // Ebeveyni (USB aygıtı) değişiklikten önce bul; sonra yeniden başlatılacak.
                string parent = ParentId(id);
                if (parent != null && !parents.Contains(parent)) parents.Add(parent);
                if (!ChangeState(id, enable ? DICS_ENABLE : DICS_DISABLE)) failures++;
            }
            // USB aygıtını yeniden başlat: kart yeniden tanınır. Dokunma parçası kapalıysa Windows
            // onu dokunmatik moduna geçirmez ve kart fare modunda açılır.
            foreach (string parent in parents) ChangeState(parent, DICS_PROPCHANGE);
            return failures == 0 ? 0 : 1;
        }

        private static string ParentId(string instanceId)
        {
            IntPtr set = SetupDiCreateDeviceInfoList(IntPtr.Zero, IntPtr.Zero);
            if (set == new IntPtr(-1)) return null;
            try
            {
                var data = new SP_DEVINFO_DATA { cbSize = (uint)Marshal.SizeOf(typeof(SP_DEVINFO_DATA)) };
                if (!SetupDiOpenDeviceInfo(set, instanceId, IntPtr.Zero, 0, ref data)) return null;
                uint parent;
                if (CM_Get_Parent(out parent, data.DevInst, 0) != 0) return null;
                var sb = new StringBuilder(512);
                if (CM_Get_Device_ID(parent, sb, sb.Capacity, 0) != 0) return null;
                return sb.ToString();
            }
            finally
            {
                SetupDiDestroyDeviceInfoList(set);
            }
        }

        private static bool ChangeState(string instanceId, uint state)
        {
            IntPtr set = SetupDiCreateDeviceInfoList(IntPtr.Zero, IntPtr.Zero);
            if (set == new IntPtr(-1)) return false;
            try
            {
                var data = new SP_DEVINFO_DATA { cbSize = (uint)Marshal.SizeOf(typeof(SP_DEVINFO_DATA)) };
                if (!SetupDiOpenDeviceInfo(set, instanceId, IntPtr.Zero, 0, ref data)) return false;
                var p = new SP_PROPCHANGE_PARAMS
                {
                    HeaderSize = 8,
                    InstallFunction = DIF_PROPERTYCHANGE,
                    StateChange = state,
                    Scope = DICS_FLAG_GLOBAL,
                    HwProfile = 0
                };
                if (!SetupDiSetClassInstallParams(set, ref data, ref p, Marshal.SizeOf(typeof(SP_PROPCHANGE_PARAMS))))
                    return false;
                return SetupDiCallClassInstaller(DIF_PROPERTYCHANGE, set, ref data);
            }
            finally
            {
                SetupDiDestroyDeviceInfoList(set);
            }
        }
    }
}
