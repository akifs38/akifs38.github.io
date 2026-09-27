using System;
using System.Runtime.InteropServices;
using System.Text;

namespace DokunmatikKalibrasyon
{
    // Dokunmatik kartın ham HID raporlarını (Raw Input, Digitizer sayfası 0x0D / kullanım 0x04)
    // sayar ve son raporun baytlarını saklar. Veriyi çözmek için yerel HID fonksiyonları
    // kullanılmaz (çökme riski olmasın); amaç yalnızca ham verinin gelip gelmediğini görmek.
    internal sealed class RawTouchReader
    {
        private const int MaxBytes = 32;

        public int ReportCount;
        public int ReportSize;
        public string LastBytes = "";

        // raw: RAWINPUT tamponu; offset: RAWHID yapısının başlangıcı; dataLength: okunan toplam bayt.
        public void Process(IntPtr raw, int offset, int dataLength)
        {
            if (offset + 8 > dataLength) return;
            int sizeHid = Marshal.ReadInt32(raw, offset);
            int count = Marshal.ReadInt32(raw, offset + 4);
            if (sizeHid <= 0 || count <= 0) return;
            // Tamponun dışına asla okuma yapma.
            long needed = offset + 8 + (long)sizeHid * count;
            if (needed > dataLength) return;

            int take = Math.Min(sizeHid, MaxBytes);
            var bytes = new byte[take];
            // Son rapor gösterilir.
            Marshal.Copy(new IntPtr(raw.ToInt64() + offset + 8 + (long)(count - 1) * sizeHid), bytes, 0, take);

            var sb = new StringBuilder(take * 3);
            for (int i = 0; i < take; i++)
            {
                if (i > 0) sb.Append(' ');
                sb.Append(bytes[i].ToString("X2"));
            }
            ReportCount += count;
            ReportSize = sizeHid;
            LastBytes = sb.ToString();
        }
    }
}
