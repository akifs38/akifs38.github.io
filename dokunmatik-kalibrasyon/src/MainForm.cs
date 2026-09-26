using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    internal sealed class MainForm : Form
    {
        private const int HotkeyId = 0x4B43;

        private readonly Settings settings;
        private readonly InputEngine engine = new InputEngine();
        private readonly bool startHidden;
        private bool exiting;

        private readonly ListView lvDevices = new ListView();
        private readonly Button btnRefresh = new Button();
        private readonly Button btnDetect = new Button();
        private readonly CheckBox chkFilter = new CheckBox();
        private readonly ComboBox cmbScreen = new ComboBox();
        private readonly Button btnCalibrate = new Button();
        private readonly Button btnReset = new Button();
        private readonly Button btnWindowsCal = new Button();
        private readonly Label lblCalibration = new Label();
        private readonly CheckBox chkCorrection = new CheckBox();
        private readonly CheckBox chkAutoStart = new CheckBox();
        private readonly Label lblStatus = new Label();
        private readonly Timer detectTimer = new Timer();
        private readonly NotifyIcon tray = new NotifyIcon();
        private readonly ToolStripMenuItem trayCorrection = new ToolStripMenuItem("Düzeltme aktif");
        private Icon appIcon;
        private bool loading;
        private bool calibrating;

        public MainForm(bool startHidden)
        {
            this.startHidden = startHidden;
            settings = Settings.Load();
            BuildUi();
            BuildTray();

            engine.DeviceDetected += OnDeviceDetected;
            engine.WindowsTouchDetected += OnWindowsTouchDetected;
            detectTimer.Interval = 15000;
            detectTimer.Tick += OnDetectTimeout;
        }

        // ---------------- Arayüz ----------------

        private void BuildUi()
        {
            Text = "Dokunmatik Kalibrasyon (USB)";
            Font = new Font("Segoe UI", 9f);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(760, 600);
            MinimumSize = new Size(640, 560);
            StartPosition = FormStartPosition.CenterScreen;
            appIcon = CreateAppIcon();
            Icon = appIcon;

            var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, Padding = new Padding(10) };
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            Controls.Add(root);

            // 1. Cihaz
            var grpDevice = new GroupBox { Text = "1. Dokunmatik cihaz", Dock = DockStyle.Fill, Padding = new Padding(8) };
            var devLayout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1 };
            devLayout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            devLayout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            devLayout.RowStyles.Add(new RowStyle(SizeType.AutoSize));

            lvDevices.Dock = DockStyle.Fill;
            lvDevices.View = View.Details;
            lvDevices.FullRowSelect = true;
            lvDevices.HideSelection = false;
            lvDevices.MultiSelect = false;
            lvDevices.Columns.Add("Cihaz", 330);
            lvDevices.Columns.Add("Tür", 230);
            lvDevices.Columns.Add("VID:PID", 90);
            lvDevices.SelectedIndexChanged += OnDeviceSelected;
            devLayout.Controls.Add(lvDevices, 0, 0);

            var devButtons = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, WrapContents = true };
            SetupButton(btnDetect, "Dokunarak bul", OnDetectClick);
            SetupButton(btnRefresh, "Listeyi yenile", delegate { RefreshDevices(); });
            devButtons.Controls.Add(btnDetect);
            devButtons.Controls.Add(btnRefresh);
            devLayout.Controls.Add(devButtons, 0, 1);

            chkFilter.Text = "Düzeltmeyi yalnızca seçili cihaza uygula (normal fare etkilenmez)";
            chkFilter.AutoSize = true;
            chkFilter.CheckedChanged += delegate
            {
                if (loading) return;
                settings.DeviceFilter = chkFilter.Checked;
                ApplyEngineSettings();
                SaveSettings();
            };
            devLayout.Controls.Add(chkFilter, 0, 2);
            grpDevice.Controls.Add(devLayout);
            root.Controls.Add(grpDevice, 0, 0);

            // 2. Kalibrasyon
            var grpCal = new GroupBox { Text = "2. Kalibrasyon", Dock = DockStyle.Fill, AutoSize = true, Padding = new Padding(8) };
            var calLayout = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, AutoSize = true };
            calLayout.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
            calLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

            calLayout.Controls.Add(new Label { Text = "Dokunmatik ekran:", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 0);
            cmbScreen.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbScreen.Dock = DockStyle.Fill;
            cmbScreen.SelectedIndexChanged += delegate
            {
                if (loading || cmbScreen.SelectedIndex < 0) return;
                settings.ScreenName = Screen.AllScreens[cmbScreen.SelectedIndex].DeviceName;
                SaveSettings();
            };
            calLayout.Controls.Add(cmbScreen, 1, 0);
            var calButtons = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, WrapContents = true };
            SetupButton(btnCalibrate, "Kalibrasyonu başlat (4 nokta)", OnCalibrateClick);
            btnCalibrate.Font = new Font(Font, FontStyle.Bold);
            SetupButton(btnReset, "Kalibrasyonu sıfırla", OnResetClick);
            SetupButton(btnWindowsCal, "Windows'un kendi kalibrasyonu", OnWindowsCalibrationClick);
            calButtons.Controls.Add(btnCalibrate);
            calButtons.Controls.Add(btnReset);
            calButtons.Controls.Add(btnWindowsCal);
            calLayout.Controls.Add(calButtons, 0, 1);
            calLayout.SetColumnSpan(calButtons, 2);

            lblCalibration.AutoSize = true;
            lblCalibration.Margin = new Padding(3, 6, 3, 3);
            calLayout.Controls.Add(lblCalibration, 0, 2);
            calLayout.SetColumnSpan(lblCalibration, 2);
            grpCal.Controls.Add(calLayout);
            root.Controls.Add(grpCal, 0, 1);

            // 3. Çalışma
            var grpRun = new GroupBox { Text = "3. Çalışma", Dock = DockStyle.Fill, AutoSize = true, Padding = new Padding(8) };
            var runLayout = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill, AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false
            };
            chkCorrection.Text = "Düzeltme aktif (açma/kapama kısayolu: Ctrl+Alt+K)";
            chkCorrection.AutoSize = true;
            chkCorrection.CheckedChanged += delegate
            {
                if (loading) return;
                SetCorrection(chkCorrection.Checked);
            };
            chkAutoStart.Text = "Windows açılınca otomatik başlat (sistem tepsisinde çalışır)";
            chkAutoStart.AutoSize = true;
            chkAutoStart.CheckedChanged += delegate
            {
                if (loading) return;
                try { Settings.AutoStart = chkAutoStart.Checked; }
                catch (Exception ex) { ShowError("Otomatik başlatma ayarlanamadı: " + ex.Message); }
            };
            runLayout.Controls.Add(chkCorrection);
            runLayout.Controls.Add(chkAutoStart);
            grpRun.Controls.Add(runLayout);
            root.Controls.Add(grpRun, 0, 2);

            lblStatus.AutoSize = true;
            lblStatus.Margin = new Padding(3, 8, 3, 0);
            lblStatus.ForeColor = Color.FromArgb(55, 65, 81);
            root.Controls.Add(lblStatus, 0, 3);

            var hint = new Label
            {
                AutoSize = true,
                ForeColor = Color.Gray,
                Margin = new Padding(3, 4, 3, 0),
                Text = "Pencereyi kapatınca uygulama sistem tepsisinde çalışmaya devam eder. Tamamen kapatmak için tepsi menüsünden \"Çıkış\"."
            };
            root.Controls.Add(hint, 0, 4);
        }

        private static void SetupButton(Button b, string text, EventHandler onClick)
        {
            b.Text = text;
            b.AutoSize = true;
            b.Padding = new Padding(6, 2, 6, 2);
            b.Click += onClick;
        }

        private void BuildTray()
        {
            var menu = new ContextMenuStrip();
            var open = new ToolStripMenuItem("Aç", null, delegate { ShowMainWindow(); });
            open.Font = new Font(open.Font, FontStyle.Bold);
            menu.Items.Add(open);
            menu.Items.Add(new ToolStripMenuItem("Kalibre et", null, delegate { ShowMainWindow(); OnCalibrateClick(this, EventArgs.Empty); }));
            trayCorrection.CheckOnClick = true;
            trayCorrection.Click += delegate { SetCorrection(trayCorrection.Checked); };
            menu.Items.Add(trayCorrection);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(new ToolStripMenuItem("Çıkış", null, delegate { ExitApp(); }));

            tray.Icon = appIcon;
            tray.Text = "Dokunmatik Kalibrasyon";
            tray.ContextMenuStrip = menu;
            tray.DoubleClick += delegate { ShowMainWindow(); };
            tray.Visible = true;
        }

        private static Icon CreateAppIcon()
        {
            using (var bmp = new Bitmap(32, 32))
            {
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = SmoothingMode.AntiAlias;
                    g.Clear(Color.Transparent);
                    using (var bg = new SolidBrush(Color.FromArgb(37, 99, 235)))
                        g.FillEllipse(bg, 1, 1, 30, 30);
                    using (var pen = new Pen(Color.White, 2.5f))
                    {
                        g.DrawEllipse(pen, 9, 9, 14, 14);
                        g.DrawLine(pen, 16, 4, 16, 28);
                        g.DrawLine(pen, 4, 16, 28, 16);
                    }
                }
                IntPtr h = bmp.GetHicon();
                Icon tmp = Icon.FromHandle(h);
                Icon copy = (Icon)tmp.Clone();
                NativeMethods.DestroyIcon(h);
                return copy;
            }
        }

        // ---------------- Yaşam döngüsü ----------------

        protected override void SetVisibleCore(bool value)
        {
            // --tepsi ile açılınca pencereyi göstermeden tepside başla.
            if (startHidden && !IsHandleCreated)
            {
                CreateHandle();
                value = false;
            }
            base.SetVisibleCore(value);
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            if (engine.Handle != IntPtr.Zero) return;

            try
            {
                engine.Start();
            }
            catch (Exception ex)
            {
                ShowError(ex.Message);
            }

            if (!NativeMethods.RegisterHotKey(Handle, HotkeyId,
                    NativeMethods.MOD_CONTROL | NativeMethods.MOD_ALT | NativeMethods.MOD_NOREPEAT, (uint)Keys.K))
                SetStatus("Ctrl+Alt+K kısayolu başka bir uygulama tarafından kullanılıyor.");

            LoadIntoUi();
        }

        private void LoadIntoUi()
        {
            loading = true;
            try
            {
                cmbScreen.Items.Clear();
                Screen[] screens = Screen.AllScreens;
                int selected = -1;
                for (int i = 0; i < screens.Length; i++)
                {
                    Screen s = screens[i];
                    cmbScreen.Items.Add(string.Format("Ekran {0}: {1}×{2}{3}", i + 1, s.Bounds.Width, s.Bounds.Height,
                        s.Primary ? " (birincil)" : ""));
                    if (s.DeviceName == settings.ScreenName) selected = i;
                    if (selected < 0 && s.Primary && string.IsNullOrEmpty(settings.ScreenName)) selected = i;
                }
                cmbScreen.SelectedIndex = selected >= 0 ? selected : (screens.Length > 0 ? 0 : -1);
                chkFilter.Checked = settings.DeviceFilter;
                chkCorrection.Checked = settings.CorrectionEnabled;
                trayCorrection.Checked = settings.CorrectionEnabled;
                try { chkAutoStart.Checked = Settings.AutoStart; } catch { }
            }
            finally
            {
                loading = false;
            }

            RefreshDevices();
            ApplyEngineSettings();
            UpdateCalibrationLabel();
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_HOTKEY && m.WParam.ToInt32() == HotkeyId)
            {
                SetCorrection(!settings.CorrectionEnabled);
                tray.ShowBalloonTip(1500, "Dokunmatik Kalibrasyon",
                    settings.CorrectionEnabled ? "Düzeltme açıldı." : "Düzeltme kapatıldı.", ToolTipIcon.Info);
                return;
            }
            if (m.Msg == Program.ShowMessage)
            {
                ShowMainWindow();
                return;
            }
            base.WndProc(ref m);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!exiting && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                Hide();
                tray.ShowBalloonTip(2000, "Dokunmatik Kalibrasyon",
                    "Uygulama arka planda çalışmaya devam ediyor. Çıkmak için tepsi simgesine sağ tıklayın.",
                    ToolTipIcon.Info);
                return;
            }
            base.OnFormClosing(e);
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            NativeMethods.UnregisterHotKey(Handle, HotkeyId);
            engine.Dispose();
            tray.Visible = false;
            tray.Dispose();
            base.OnFormClosed(e);
        }

        private void ShowMainWindow()
        {
            Show();
            if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
            Activate();
        }

        private void ExitApp()
        {
            exiting = true;
            Close();
        }

        // ---------------- Cihazlar ----------------

        private void RefreshDevices()
        {
            List<InputDeviceInfo> devices;
            try
            {
                devices = InputDevices.Enumerate();
            }
            catch (Exception ex)
            {
                ShowError("Cihazlar listelenemedi: " + ex.Message);
                return;
            }

            loading = true;
            try
            {
                lvDevices.BeginUpdate();
                lvDevices.Items.Clear();
                bool savedFound = false;
                foreach (InputDeviceInfo d in devices)
                {
                    var item = new ListViewItem(new[] { d.Name, d.KindText, d.VidPid });
                    item.Tag = d;
                    if (d.Kind == DeviceKind.TouchDigitizer) item.ForeColor = Color.Gray;
                    if (!d.IsUsb) item.ForeColor = Color.DarkGray;
                    lvDevices.Items.Add(item);
                    if (settings.DevicePath != null &&
                        string.Equals(d.Path, settings.DevicePath, StringComparison.OrdinalIgnoreCase))
                    {
                        item.Selected = true;
                        item.Font = new Font(lvDevices.Font, FontStyle.Bold);
                        savedFound = true;
                    }
                }
                lvDevices.EndUpdate();

                if (!string.IsNullOrEmpty(settings.DevicePath) && !savedFound)
                    SetStatus("Kayıtlı dokunmatik cihaz şu an bağlı değil: " + (settings.DeviceName ?? settings.DevicePath));
                else
                    UpdateStatus();
            }
            finally
            {
                loading = false;
            }
        }

        private void OnDeviceSelected(object sender, EventArgs e)
        {
            if (loading || lvDevices.SelectedItems.Count == 0) return;
            var d = (InputDeviceInfo)lvDevices.SelectedItems[0].Tag;
            if (d.Kind == DeviceKind.TouchDigitizer)
            {
                MessageBox.Show(this,
                    "Bu cihazı Windows zaten gerçek dokunmatik ekran olarak tanıyor.\n\n" +
                    "Bu tür cihazlar için \"Windows'un kendi kalibrasyonu\" düğmesini kullanın " +
                    "(Denetim Masası › Tablet PC Ayarları › Kalibre et).",
                    Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            SelectDevice(d.Path, d.Name);
        }

        private void SelectDevice(string path, string name)
        {
            settings.DevicePath = path;
            settings.DeviceName = name;
            SaveSettings();
            ApplyEngineSettings();
            foreach (ListViewItem item in lvDevices.Items)
            {
                var d = (InputDeviceInfo)item.Tag;
                bool sel = string.Equals(d.Path, path, StringComparison.OrdinalIgnoreCase);
                item.Font = new Font(lvDevices.Font, sel ? FontStyle.Bold : FontStyle.Regular);
            }
            UpdateStatus();
        }

        private void OnDetectClick(object sender, EventArgs e)
        {
            engine.BeginDetect();
            detectTimer.Stop();
            detectTimer.Start();
            btnDetect.Enabled = false;
            SetStatus("Şimdi dokunmatik ekrana parmağınızla dokunun... (15 sn)");
        }

        private void OnDeviceDetected(string path)
        {
            detectTimer.Stop();
            btnDetect.Enabled = true;
            RefreshDevices();
            string name = path;
            foreach (ListViewItem item in lvDevices.Items)
            {
                var d = (InputDeviceInfo)item.Tag;
                if (string.Equals(d.Path, path, StringComparison.OrdinalIgnoreCase))
                {
                    name = d.Name;
                    loading = true;
                    item.Selected = true;
                    item.EnsureVisible();
                    loading = false;
                }
            }
            SelectDevice(path, name);
            SetStatus("Bulunan cihaz: " + name + ". Şimdi \"Kalibrasyonu başlat\"a tıklayın.");
        }

        private void OnWindowsTouchDetected()
        {
            detectTimer.Stop();
            btnDetect.Enabled = true;
            SetStatus("Windows bu ekranı gerçek dokunmatik olarak tanıyor.");
            if (MessageBox.Show(this,
                    "Dokunduğunuz ekranı Windows zaten dokunmatik (HID sayısallaştırıcı) olarak tanıyor.\n\n" +
                    "Bu durumda en doğru sonucu Windows'un kendi kalibrasyon aracı verir. Şimdi açılsın mı?",
                    Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                OnWindowsCalibrationClick(this, EventArgs.Empty);
        }

        private void OnDetectTimeout(object sender, EventArgs e)
        {
            detectTimer.Stop();
            engine.CancelDetect();
            btnDetect.Enabled = true;
            SetStatus("Dokunma algılanmadı. Cihaz takılı mı? Listeden elle de seçebilirsiniz.");
        }

        // ---------------- Kalibrasyon ----------------

        private void OnCalibrateClick(object sender, EventArgs e)
        {
            if (calibrating) return;
            if (string.IsNullOrEmpty(settings.DevicePath) && chkFilter.Checked)
            {
                DialogResult r = MessageBox.Show(this,
                    "Henüz dokunmatik cihaz seçilmedi.\n\n" +
                    "\"Evet\": önce \"Dokunarak bul\" ile cihazı seçin (önerilir).\n" +
                    "\"Hayır\": cihaz seçmeden devam et — sistemde normal bir fare de varsa onun hareketleri de düzeltilir.",
                    Text, MessageBoxButtons.YesNoCancel, MessageBoxIcon.Warning);
                if (r == DialogResult.Yes) { OnDetectClick(this, EventArgs.Empty); return; }
                if (r == DialogResult.Cancel) return;
            }

            Screen[] screens = Screen.AllScreens;
            Screen target = cmbScreen.SelectedIndex >= 0 && cmbScreen.SelectedIndex < screens.Length
                ? screens[cmbScreen.SelectedIndex]
                : Screen.PrimaryScreen;

            bool saved = false;
            calibrating = true;
            try
            {
                using (var form = new CalibrationForm(engine, target))
                {
                    if (form.ShowDialog(this) == DialogResult.OK && form.Result != null)
                    {
                        settings.Transform = form.Result;
                        settings.RmsError = form.RmsError;
                        settings.CorrectionEnabled = true;
                        saved = true;
                    }
                }
            }
            finally
            {
                calibrating = false;
            }

            if (saved)
            {
                SaveSettings();
                loading = true;
                chkCorrection.Checked = true;
                trayCorrection.Checked = true;
                loading = false;
            }
            ApplyEngineSettings();
            UpdateCalibrationLabel();
            SetStatus(saved
                ? "Kalibrasyon kaydedildi ve etkinleştirildi."
                : "Kalibrasyon iptal edildi; önceki ayar korunuyor.");
        }

        private void OnResetClick(object sender, EventArgs e)
        {
            if (MessageBox.Show(this, "Kayıtlı kalibrasyon silinsin mi?", Text,
                    MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
            settings.Transform = null;
            settings.RmsError = double.NaN;
            SaveSettings();
            ApplyEngineSettings();
            UpdateCalibrationLabel();
            SetStatus("Kalibrasyon sıfırlandı.");
        }

        private void OnWindowsCalibrationClick(object sender, EventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo("tabcal.exe") { UseShellExecute = true });
            }
            catch
            {
                try
                {
                    Process.Start("control.exe", "/name Microsoft.TabletPCSettings");
                }
                catch (Exception ex)
                {
                    ShowError("Windows kalibrasyon aracı açılamadı: " + ex.Message +
                              "\n\nBu araç yalnızca Windows'un dokunmatik olarak tanıdığı ekranlarda bulunur.");
                }
            }
        }

        // ---------------- Durum ----------------

        private void SetCorrection(bool enabled)
        {
            settings.CorrectionEnabled = enabled;
            loading = true;
            chkCorrection.Checked = enabled;
            trayCorrection.Checked = enabled;
            loading = false;
            SaveSettings();
            ApplyEngineSettings();
            UpdateStatus();
        }

        private void ApplyEngineSettings()
        {
            engine.TargetDevicePath = settings.DevicePath;
            engine.DeviceFilter = settings.DeviceFilter;
            // Kalibrasyon penceresi açıkken dönüşümü ve modu o yönetir.
            if (!calibrating)
            {
                engine.Transform = settings.Transform;
                engine.Mode = settings.CorrectionEnabled && settings.Transform != null && !settings.Transform.IsIdentity
                    ? EngineMode.Correct
                    : EngineMode.PassThrough;
            }
        }

        private void UpdateCalibrationLabel()
        {
            if (settings.Transform == null)
            {
                lblCalibration.Text = "Kayıtlı kalibrasyon yok.";
                lblCalibration.ForeColor = Color.FromArgb(180, 83, 9);
            }
            else
            {
                lblCalibration.Text = "Kayıtlı kalibrasyon: " + settings.Transform +
                                      (double.IsNaN(settings.RmsError) ? "" : "   (ortalama hata " + settings.RmsError.ToString("0.0") + " px)");
                lblCalibration.ForeColor = Color.FromArgb(21, 128, 61);
            }
            UpdateStatus();
        }

        private void UpdateStatus()
        {
            string state;
            if (settings.Transform == null) state = "Durum: kalibrasyon yok — dokunmatik olduğu gibi çalışıyor.";
            else if (!settings.CorrectionEnabled) state = "Durum: düzeltme KAPALI.";
            else state = "Durum: düzeltme AÇIK.";

            if (!string.IsNullOrEmpty(settings.DevicePath))
                state += "  Cihaz: " + (settings.DeviceName ?? "seçili") + (settings.DeviceFilter ? "" : " (filtre kapalı — tüm fareler düzeltilir)");
            else
                state += "  Cihaz seçilmedi — tüm fare olayları düzeltilir.";
            SetStatus(state);
            tray.Text = TrimTooltip("Dokunmatik Kalibrasyon — " + (engine.Mode == EngineMode.Correct ? "düzeltme açık" : "düzeltme kapalı"));
        }

        private static string TrimTooltip(string s)
        {
            return s.Length > 63 ? s.Substring(0, 63) : s;
        }

        private void SetStatus(string text)
        {
            lblStatus.Text = text;
        }

        private void SaveSettings()
        {
            try { settings.Save(); }
            catch (Exception ex) { ShowError("Ayarlar kaydedilemedi: " + ex.Message); }
        }

        private void ShowError(string message)
        {
            MessageBox.Show(this, message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                detectTimer.Dispose();
                if (appIcon != null) appIcon.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
