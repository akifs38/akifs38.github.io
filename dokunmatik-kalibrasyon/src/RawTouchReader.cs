using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace DokunmatikKalibrasyon
{
    // Dokunmatik kartın ham HID raporlarını (Raw Input, Digitizer sayfası 0x0D / kullanım 0x04)
    // okur ve ilk parmağın X/Y değerlerini çıkarır. Windows'un dokunma işlemesinden bağımsızdır;
    // UPDD'nin yaptığı gibi dokunmayı doğrudan karttan görmeyi sağlar.
    internal sealed class RawTouchReader
    {
        private const uint RIDI_PREPARSEDDATA = 0x20000005;
        private const int HIDP_STATUS_SUCCESS = 0x00110000;
        private const int HidP_Input = 0;
        private const int ValueCapsSize = 72; // sizeof(HIDP_VALUE_CAPS)

        [DllImport("hid.dll")]
        private static extern int HidP_GetCaps(IntPtr preparsed, byte[] caps);

        [DllImport("hid.dll")]
        private static extern int HidP_GetValueCaps(int reportType, byte[] caps, ref ushort length, IntPtr preparsed);

        [DllImport("hid.dll")]
        private static extern int HidP_GetUsageValue(int reportType, ushort usagePage, ushort linkCollection,
            ushort usage, out uint value, IntPtr preparsed, byte[] report, uint reportLength);

        private sealed class Device
        {
            public IntPtr Preparsed;
            public bool Valid;
            public ushort XLink, YLink;
            public int XMax, YMax;
        }

        private readonly Dictionary<IntPtr, Device> devices = new Dictionary<IntPtr, Device>();

        public int ReportCount;
        public int LastX = -1, LastY = -1;
        public int MaxX, MaxY;

        // raw: RAWINPUT tamponu; offset: RAWHID yapısının başlangıcı (başlık boyutu).
        public void Process(IntPtr hDevice, IntPtr raw, int offset)
        {
            Device dev = GetDevice(hDevice);
            if (dev == null || !dev.Valid) return;

            int sizeHid = Marshal.ReadInt32(raw, offset);
            int count = Marshal.ReadInt32(raw, offset + 4);
            if (sizeHid <= 0 || count <= 0 || sizeHid > 4096) return;

            var report = new byte[sizeHid];
            for (int i = 0; i < count; i++)
            {
                Marshal.Copy(new IntPtr(raw.ToInt64() + offset + 8 + (long)i * sizeHid), report, 0, sizeHid);
                uint x, y;
                if (HidP_GetUsageValue(HidP_Input, 0x01, dev.XLink, 0x30, out x, dev.Preparsed, report, (uint)sizeHid) != HIDP_STATUS_SUCCESS)
                    continue;
                if (HidP_GetUsageValue(HidP_Input, 0x01, dev.YLink, 0x31, out y, dev.Preparsed, report, (uint)sizeHid) != HIDP_STATUS_SUCCESS)
                    continue;
                ReportCount++;
                LastX = (int)x;
                LastY = (int)y;
                MaxX = dev.XMax;
                MaxY = dev.YMax;
            }
        }

        private Device GetDevice(IntPtr hDevice)
        {
            Device dev;
            if (devices.TryGetValue(hDevice, out dev)) return dev;
            dev = new Device();
            devices[hDevice] = dev;
            try
            {
                uint size = 0;
                NativeMethods.GetRawInputDeviceInfo(hDevice, RIDI_PREPARSEDDATA, IntPtr.Zero, ref size);
                if (size == 0) return dev;
                dev.Preparsed = Marshal.AllocHGlobal((int)size);
                if (NativeMethods.GetRawInputDeviceInfo(hDevice, RIDI_PREPARSEDDATA, dev.Preparsed, ref size) == uint.MaxValue)
                    return dev;

                var caps = new byte[64];
                if (HidP_GetCaps(dev.Preparsed, caps) != HIDP_STATUS_SUCCESS) return dev;
                ushort valueCount = BitConverter.ToUInt16(caps, 48); // NumberInputValueCaps
                if (valueCount == 0) return dev;

                var vcaps = new byte[valueCount * ValueCapsSize];
                ushort len = valueCount;
                if (HidP_GetValueCaps(HidP_Input, vcaps, ref len, dev.Preparsed) != HIDP_STATUS_SUCCESS) return dev;

                bool hasX = false, hasY = false;
                for (int i = 0; i < len; i++)
                {
                    int o = i * ValueCapsSize;
                    ushort page = BitConverter.ToUInt16(vcaps, o);
                    if (page != 0x01) continue;
                    ushort link = BitConverter.ToUInt16(vcaps, o + 6);
                    bool isRange = vcaps[o + 12] != 0;
                    int logicalMax = BitConverter.ToInt32(vcaps, o + 44);
                    ushort usageMin = BitConverter.ToUInt16(vcaps, o + 56);
                    ushort usageMax = isRange ? BitConverter.ToUInt16(vcaps, o + 58) : usageMin;
                    // İlk bulunan X ve Y (ilk parmak) kullanılır.
                    if (!hasX && usageMin <= 0x30 && 0x30 <= usageMax) { hasX = true; dev.XLink = link; dev.XMax = logicalMax; }
                    if (!hasY && usageMin <= 0x31 && 0x31 <= usageMax) { hasY = true; dev.YLink = link; dev.YMax = logicalMax; }
                }
                dev.Valid = hasX && hasY;
            }
            catch
            {
                dev.Valid = false;
            }
            return dev;
        }
    }
}
