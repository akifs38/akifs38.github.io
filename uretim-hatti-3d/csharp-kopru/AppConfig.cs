using System;
using System.IO;
using System.Text.Json;

namespace UretimHatti3D;

/// <summary>
/// PLC ve sunucu ayarları. .exe yanında appsettings.json varsa ondan,
/// yoksa buradaki varsayılanlardan yüklenir.
/// </summary>
public sealed class AppConfig
{
    public string PlcIp { get; set; } = "192.168.0.1"; // S7-300 CP/IP adresi
    public int Rack { get; set; } = 0;                 // S7-300 tipik: rack 0
    public int Slot { get; set; } = 2;                 // S7-300 tipik: slot 2
    public int InputBytes { get; set; } = 3;           // okunacak giriş baytı: IB0..IB2 → I0.0..I2.7
    public int OutputBytes { get; set; } = 2;          // okunacak çıkış baytı: QB0..QB1 → Q0.0..Q1.7
    public int Port { get; set; } = 5000;              // gömülü web sunucu portu
    public int PollMs { get; set; } = 150;             // PLC okuma periyodu (ms)

    public static AppConfig Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
        if (File.Exists(path))
        {
            try
            {
                var cfg = JsonSerializer.Deserialize<AppConfig>(
                    File.ReadAllText(path),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (cfg != null) return cfg;
            }
            catch { /* bozuk dosya → varsayılana düş */ }
        }
        return new AppConfig();
    }
}
