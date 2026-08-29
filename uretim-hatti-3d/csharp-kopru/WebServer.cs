using System;
using System.IO;
using System.Net.WebSockets;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace UretimHatti3D;

/// <summary>
/// Uygulamanın içinde çalışan mini web sunucusu (Kestrel).
///   /            → 3D sayfası (Three.js .exe içine gömülü, çevrimdışı)
///   /ws          → PLC durumunu WebSocket ile yayınlar
///   /plc.json    → anlık durum (yedek, WebSocket kullanılamazsa)
/// </summary>
public sealed class WebServer
{
    private readonly PlcBridge _plc;
    private WebApplication? _app;

    public AppConfig Config { get; }
    public string Url => $"http://127.0.0.1:{Config.Port}/?src=ws";

    // Gömülü kaynaklar (bir kez okunur)
    private readonly string _indexHtml;
    private readonly byte[] _three;
    private readonly byte[] _orbit;

    public WebServer(PlcBridge plc, AppConfig cfg)
    {
        _plc = plc;
        Config = cfg;

        _indexHtml = LoadTextResource("web.index.html")
            // Three.js CDN yollarını yerel (gömülü) yollara çevir → internet gerekmez
            .Replace("https://unpkg.com/three@0.160.0/build/three.module.js", "/vendor/three.module.js")
            .Replace("https://unpkg.com/three@0.160.0/examples/jsm/", "/vendor/addons/");
        _three = LoadBytesResource("web.three.module.js");
        _orbit = LoadBytesResource("web.OrbitControls.js");
    }

    public async Task StartAsync()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls($"http://0.0.0.0:{Config.Port}"); // 0.0.0.0 → aynı ağdaki cihazlar da erişir
        builder.Logging.ClearProviders();
        var app = builder.Build();

        app.UseWebSockets();

        app.Map("/ws", async (HttpContext ctx) => await WebSocketHandler(ctx));

        app.MapGet("/plc.json", () =>
        {
            try { return Results.Json(_plc.Read()); }
            catch { return Results.Json(new { }); }
        });

        app.MapGet("/vendor/three.module.js", () =>
            Results.Bytes(_three, "text/javascript"));
        app.MapGet("/vendor/addons/controls/OrbitControls.js", () =>
            Results.Bytes(_orbit, "text/javascript"));

        // Kök ve index.html → 3D sayfası
        app.MapGet("/", () => Results.Content(_indexHtml, "text/html; charset=utf-8"));
        app.MapGet("/index.html", () => Results.Content(_indexHtml, "text/html; charset=utf-8"));

        _app = app;
        await app.StartAsync();
    }

    public async Task StopAsync()
    {
        if (_app != null) await _app.StopAsync();
    }

    private async Task WebSocketHandler(HttpContext ctx)
    {
        if (!ctx.WebSockets.IsWebSocketRequest)
        {
            ctx.Response.StatusCode = 400;
            return;
        }

        using var sock = await ctx.WebSockets.AcceptWebSocketAsync();
        var token = ctx.RequestAborted;

        while (sock.State == WebSocketState.Open && !token.IsCancellationRequested)
        {
            string json;
            try
            {
                json = JsonSerializer.Serialize(_plc.Read());
            }
            catch
            {
                _plc.Reconnect();      // bağlantı koptu → sonraki turda yeniden dene
                json = "{}";
            }

            try
            {
                var bytes = Encoding.UTF8.GetBytes(json);
                await sock.SendAsync(bytes, WebSocketMessageType.Text, true, token);
                await Task.Delay(Config.PollMs, token);
            }
            catch (OperationCanceledException) { break; }
            catch { break; } // istemci kapandı
        }
    }

    private static string LoadTextResource(string name)
    {
        using var s = OpenResource(name);
        using var r = new StreamReader(s, Encoding.UTF8);
        return r.ReadToEnd();
    }

    private static byte[] LoadBytesResource(string name)
    {
        using var s = OpenResource(name);
        using var ms = new MemoryStream();
        s.CopyTo(ms);
        return ms.ToArray();
    }

    private static Stream OpenResource(string name)
    {
        var asm = Assembly.GetExecutingAssembly();
        return asm.GetManifestResourceStream(name)
            ?? throw new FileNotFoundException($"Gömülü kaynak bulunamadı: {name}");
    }
}
