using System;
using System.Windows;
using System.Windows.Threading;

namespace UretimHatti3D;

public partial class MainWindow : Window
{
    private WebServer? _server;
    private PlcBridge? _plc;
    private readonly DispatcherTimer _statusTimer = new() { Interval = TimeSpan.FromSeconds(1) };

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        _statusTimer.Tick += (_, _) => UpdateStatus();
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        var cfg = AppConfig.Load();

        _plc = new PlcBridge(cfg.PlcIp, (short)cfg.Rack, (short)cfg.Slot, cfg.InputBytes, cfg.OutputBytes);
        _server = new WebServer(_plc, cfg);

        try
        {
            await _server.StartAsync();
            await web.EnsureCoreWebView2Async();
            web.CoreWebView2.Navigate(_server.Url);
            _statusTimer.Start();
        }
        catch (Exception ex)
        {
            MessageBox.Show("Başlatma hatası:\n" + ex.Message, "Hata",
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void UpdateStatus()
    {
        var cfg = _server?.Config;
        statusText.Text = _plc is { Connected: true }
            ? $"● PLC bağlı  {cfg?.PlcIp}  ·  http://<bu-pc-ip>:{cfg?.Port}"
            : $"○ PLC bağlantısı bekleniyor…  {cfg?.PlcIp}";
        statusText.Foreground = _plc is { Connected: true }
            ? System.Windows.Media.Brushes.LightGreen
            : System.Windows.Media.Brushes.Orange;
    }

    protected override async void OnClosed(EventArgs e)
    {
        base.OnClosed(e);
        _statusTimer.Stop();
        if (_server != null) await _server.StopAsync();
        _plc?.Close();
    }
}
