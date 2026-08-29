using System;
using System.Collections.Generic;
using S7.Net;

namespace UretimHatti3D;

/// <summary>
/// S7-300 ile doğrudan haberleşme (S7.NetPlus / S7comm).
/// Giriş (I) ve çıkış (Q) baytlarını okuyup adres→bool sözlüğü üretir.
/// </summary>
public sealed class PlcBridge
{
    private readonly string _ip;
    private readonly short _rack, _slot;
    private readonly int _inBytes, _outBytes;
    private readonly object _lock = new();
    private Plc? _plc;

    public PlcBridge(string ip, short rack, short slot, int inBytes, int outBytes)
    {
        _ip = ip; _rack = rack; _slot = slot;
        _inBytes = Math.Max(0, inBytes);
        _outBytes = Math.Max(0, outBytes);
    }

    public bool Connected => _plc?.IsConnected ?? false;

    private void EnsureConnected()
    {
        if (_plc == null)
            _plc = new Plc(CpuType.S7300, _ip, _rack, _slot);
        if (!_plc.IsConnected)
            _plc.Open();
    }

    /// <summary>
    /// PLC'den I ve Q baytlarını okur; { "I0.0":true, ..., "Q0.0":false, ... } döner.
    /// Bağlantı koparsa yeniden bağlanmayı dener; başarısızsa istisna fırlatır.
    /// </summary>
    public Dictionary<string, bool> Read()
    {
        lock (_lock)
        {
            EnsureConnected();
            var d = new Dictionary<string, bool>();

            if (_inBytes > 0)
                Expand(d, "I", _plc!.ReadBytes(DataType.Input, 0, 0, _inBytes));
            if (_outBytes > 0)
                Expand(d, "Q", _plc!.ReadBytes(DataType.Output, 0, 0, _outBytes));
            return d;
        }
    }

    private static void Expand(Dictionary<string, bool> d, string prefix, byte[] bytes)
    {
        for (int b = 0; b < bytes.Length; b++)
            for (int bit = 0; bit < 8; bit++)
                d[$"{prefix}{b}.{bit}"] = ((bytes[b] >> bit) & 1) == 1;
    }

    public void Reconnect()
    {
        lock (_lock)
        {
            try { _plc?.Close(); } catch { /* yut */ }
            _plc = null;
        }
    }

    public void Close()
    {
        lock (_lock)
        {
            try { _plc?.Close(); } catch { /* yut */ }
            _plc = null;
        }
    }
}
