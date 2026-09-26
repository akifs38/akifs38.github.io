using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Microsoft.Win32;
using Microsoft.Win32.SafeHandles;

namespace DokunmatikKalibrasyon
{
    internal enum DeviceKind
    {
        Mouse,          // Windows cihazı fare olarak görüyor (bu uygulama düzeltebilir)
        TouchDigitizer  // Windows cihazı gerçek dokunmatik olarak görüyor (tabcal kullanılır)
    }

    internal sealed class InputDeviceInfo
    {
        public IntPtr Handle;
        public string Path;
        public DeviceKind Kind;
        public string Name;
        public string VidPid;
        public bool IsUsb;

        public string KindText
        {
            get
            {
                return Kind == DeviceKind.Mouse
                    ? "Fare (mutlak/dokunmatik olabilir)"
                    : "Windows dokunmatik (HID sayısallaştırıcı)";
            }
        }
    }

    internal static class InputDevices
    {
        private static readonly Regex VidPidRegex = new Regex(@"VID_([0-9A-F]{4}).*?PID_([0-9A-F]{4})",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static List<InputDeviceInfo> Enumerate()
        {
            var result = new List<InputDeviceInfo>();
            uint count = 0;
            uint itemSize = (uint)Marshal.SizeOf(typeof(NativeMethods.RAWINPUTDEVICELIST));
            if (NativeMethods.GetRawInputDeviceList(null, ref count, itemSize) != 0 || count == 0)
                return result;

            var list = new NativeMethods.RAWINPUTDEVICELIST[count];
            uint got = NativeMethods.GetRawInputDeviceList(list, ref count, itemSize);
            if (got == uint.MaxValue) return result;

            for (int i = 0; i < got; i++)
            {
                var entry = list[i];
                if (entry.dwType == NativeMethods.RIM_TYPEKEYBOARD) continue;

                DeviceKind kind;
                if (entry.dwType == NativeMethods.RIM_TYPEMOUSE)
                {
                    kind = DeviceKind.Mouse;
                }
                else
                {
                    ushort usagePage, usage;
                    if (!GetHidUsage(entry.hDevice, out usagePage, out usage)) continue;
                    // 0x0D = Digitizer sayfası: 0x02 kalem, 0x04 dokunmatik ekran, 0x05 touchpad
                    if (usagePage != 0x0D || (usage != 0x02 && usage != 0x04)) continue;
                    kind = DeviceKind.TouchDigitizer;
                }

                string path = GetDeviceName(entry.hDevice);
                if (string.IsNullOrEmpty(path)) continue;
                // Uzak masaüstü / sanal "Root" fareyi listelemeye gerek yok.
                if (path.IndexOf("RDP_MOU", StringComparison.OrdinalIgnoreCase) >= 0) continue;

                var info = new InputDeviceInfo();
                info.Handle = entry.hDevice;
                info.Path = path;
                info.Kind = kind;
                Match m = VidPidRegex.Match(path);
                info.VidPid = m.Success ? (m.Groups[1].Value + ":" + m.Groups[2].Value).ToUpperInvariant() : "";
                info.IsUsb = m.Success;
                info.Name = GetFriendlyName(path);
                result.Add(info);
            }
            return result;
        }

        public static string GetDeviceName(IntPtr hDevice)
        {
            uint size = 0;
            NativeMethods.GetRawInputDeviceInfo(hDevice, NativeMethods.RIDI_DEVICENAME, IntPtr.Zero, ref size);
            if (size == 0) return null;
            IntPtr buf = Marshal.AllocHGlobal((int)size * 2 + 2);
            try
            {
                uint res = NativeMethods.GetRawInputDeviceInfo(hDevice, NativeMethods.RIDI_DEVICENAME, buf, ref size);
                if (res == uint.MaxValue) return null;
                return Marshal.PtrToStringUni(buf);
            }
            finally
            {
                Marshal.FreeHGlobal(buf);
            }
        }

        private static bool GetHidUsage(IntPtr hDevice, out ushort usagePage, out ushort usage)
        {
            usagePage = 0; usage = 0;
            uint size = 32; // sizeof(RID_DEVICE_INFO)
            IntPtr buf = Marshal.AllocHGlobal(64);
            try
            {
                Marshal.WriteInt32(buf, 0, (int)size); // cbSize
                uint res = NativeMethods.GetRawInputDeviceInfo(hDevice, NativeMethods.RIDI_DEVICEINFO, buf, ref size);
                if (res == uint.MaxValue || res == 0) return false;
                if ((uint)Marshal.ReadInt32(buf, 4) != NativeMethods.RIM_TYPEHID) return false;
                usagePage = (ushort)Marshal.ReadInt16(buf, 20);
                usage = (ushort)Marshal.ReadInt16(buf, 22);
                return true;
            }
            finally
            {
                Marshal.FreeHGlobal(buf);
            }
        }

        private static string GetFriendlyName(string path)
        {
            string product = GetHidProductString(path);
            string desc = GetRegistryDescription(path);
            if (!string.IsNullOrEmpty(product) && !string.IsNullOrEmpty(desc) &&
                !string.Equals(product, desc, StringComparison.OrdinalIgnoreCase))
                return product + " — " + desc;
            if (!string.IsNullOrEmpty(product)) return product;
            if (!string.IsNullOrEmpty(desc)) return desc;
            return "Bilinmeyen cihaz";
        }

        private static string GetHidProductString(string path)
        {
            try
            {
                using (SafeFileHandle h = NativeMethods.CreateFile(path, 0,
                    NativeMethods.FILE_SHARE_READ | NativeMethods.FILE_SHARE_WRITE,
                    IntPtr.Zero, NativeMethods.OPEN_EXISTING, 0, IntPtr.Zero))
                {
                    if (h.IsInvalid) return null;
                    byte[] buf = new byte[256];
                    string manufacturer = null;
                    if (NativeMethods.HidD_GetManufacturerString(h, buf, (uint)buf.Length))
                        manufacturer = NativeMethods.ReadUnicode(buf);
                    buf = new byte[256];
                    if (!NativeMethods.HidD_GetProductString(h, buf, (uint)buf.Length)) return null;
                    string product = NativeMethods.ReadUnicode(buf);
                    if (string.IsNullOrEmpty(product)) return null;
                    if (!string.IsNullOrEmpty(manufacturer) &&
                        product.IndexOf(manufacturer, StringComparison.OrdinalIgnoreCase) < 0)
                        return manufacturer + " " + product;
                    return product;
                }
            }
            catch
            {
                return null;
            }
        }

        // "\\?\HID#VID_0EEF&PID_0001&Col01#7&abc&0&0000#{guid}" ->
        // HKLM\SYSTEM\CurrentControlSet\Enum\HID\VID_0EEF&PID_0001&Col01\7&abc&0&0000
        private static string GetRegistryDescription(string path)
        {
            try
            {
                string p = path;
                if (p.StartsWith(@"\\?\")) p = p.Substring(4);
                int guid = p.LastIndexOf("#{", StringComparison.Ordinal);
                if (guid > 0) p = p.Substring(0, guid);
                p = p.Replace('#', '\\');
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Enum\" + p))
                {
                    if (key == null) return null;
                    string desc = key.GetValue("FriendlyName") as string ?? key.GetValue("DeviceDesc") as string;
                    if (string.IsNullOrEmpty(desc)) return null;
                    int semi = desc.LastIndexOf(';');
                    if (semi >= 0) desc = desc.Substring(semi + 1);
                    return desc.Trim();
                }
            }
            catch
            {
                return null;
            }
        }
    }
}
