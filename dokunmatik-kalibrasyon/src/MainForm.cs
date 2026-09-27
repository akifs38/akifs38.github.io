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
        private readonly Button btnRestoreTouch = new Button();
        private readonly Label lblCalibration = new Label();
        private readonly CheckBox chkCorrection = new CheckBox();
        private readonly CheckBox chkAutoStart = new CheckBox();
        private readonly Label lblStatus = new Label();
        private readonly ComboBox cmbTest = new ComboBox();
        private readonly Label lblTest = new Label();
        private readonly Timer testTimer = new Timer();
        private readonly Timer detectTimer = new Timer();
        private readonly NotifyIcon tray = new NotifyIcon();
        private readonly ToolStripMenuItem trayCorrection = new ToolStripMenuItem("Düzeltme aktif");
        private Icon appIcon;
        private bool loading;
        private bool calibrating;
        private bool quitRequested;
        private bool singleScreenWarned;
        private CalibrationForm activeCalibration;
        private readonly Label lblScreenWarning = new Label();

        public MainForm(bool startHidden)
        {
            this.startHidden = startHidden;
            settings = Settings.Load();
            BuildUi();
            BuildTray();

            Microsoft.Win32.SystemEvents.DisplaySettingsChanged += OnDisplaySettingsChanged;
            engine.DeviceDetected += OnDeviceDetected;
            engine.WindowsTouchDetected += OnWindowsTouchDetected;
            detectTimer.Interval = 15000;
            detectTimer.Tick += OnDetectTimeout;
        }

        // ---------------- Arayüz ----------------

        private void BuildUi()
        {
            Text = "Dokunmatik Kalibrasyon (USB) — sürüm " + Program.Version;
            Font = new Font("Segoe UI", 9f);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(820, 760);
            MinimumSize = new Size(700, 700);
            StartPosition = FormStartPosition.CenterScreen;
            appIcon = CreateAppIcon();
            Icon = appIcon;

            var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, Padding = new Padding(10) };
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
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

            chkFilter.Text = "Düzeltmeyi yalnızca kalibrasyonda kullanılan dokunmatiğe uygula (normal fare etkilenmez)";
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

            lblScreenWarning.AutoSize = true;
            lblScreenWarning.ForeColor = Color.FromArgb(180, 83, 9);
            lblScreenWarning.Margin = new Padding(3, 4, 3, 2);
            lblScreenWarning.Visible = false;
            calLayout.Controls.Add(lblScreenWarning, 0, 1);
            calLayout.SetColumnSpan(lblScreenWarning, 2);

            var calButtons = new FlowLayoutPanel { Dock = DockStyle.Fill, AutoSize = true, WrapContents = true };
            SetupButton(btnCalibrate, "Kalibrasyonu başlat (4 nokta)", OnCalibrateClick);
            btnCalibrate.Font = new Font(Font, FontStyle.Bold);
            SetupButton(btnReset, "Kalibrasyonu sıfırla", OnResetClick);
            SetupButton(btnRestoreTouch, "Dokunmatiği eski haline döndür", delegate { RestoreWindowsTouch(); });
            btnRestoreTouch.Visible = false;
            calButtons.Controls.Add(btnCalibrate);
            calButtons.Controls.Add(btnReset);
            calButtons.Controls.Add(btnRestoreTouch);
            calLayout.Controls.Add(calButtons, 0, 2);
            calLayout.SetColumnSpan(calButtons, 2);

            lblCalibration.AutoSize = true;
            lblCalibration.Margin = new Padding(3, 6, 3, 3);
            calLayout.Controls.Add(lblCalibration, 0, 3);
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

            // 4. Test: uygulamanın dokunmaların araya girip giremediğini görmek için
            var grpTest = new GroupBox { Text = "4. Test (araya girebiliyor mu?)", Dock = DockStyle.Fill, AutoSize = true, Padding = new Padding(8) };
            var testLayout = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill, AutoSize = true, FlowDirection = FlowDirection.TopDown, WrapContents = false
            };
            testLayout.Controls.Add(new Label
            {
                AutoSize = true,
                Text = "Paint'i açın, bir test seçin ve hep aynı yere dokunun. Çizgi başka yerde çıkıyorsa uygulama araya girebiliyor.\n" +
                       "Normal fare etkilenmez. Testi kapatmak için \"Kapalı\" seçin ya da Ctrl+Alt+K."
            });
            cmbTest.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbTest.Width = 360;
            cmbTest.Items.AddRange(new object[]
            {
                "Kapalı",
                "1) 300 piksel sağa kaydır",
                "2) 300 piksel aşağı kaydır",
                "3) Sol ↔ sağ ayna",
                "4) Üst ↔ alt ayna",
                "5) Ana ekrandaki dokunuşu kiosk ekranına taşı"
            });
            cmbTest.SelectedIndex = 0;
            cmbTest.SelectedIndexChanged += delegate { OnTestChanged(); };
            testLayout.Controls.Add(cmbTest);
            lblTest.AutoSize = true;
            lblTest.ForeColor = Color.FromArgb(75, 85, 99);
            testLayout.Controls.Add(lblTest);
            grpTest.Controls.Add(testLayout);
            root.Controls.Add(grpTest, 0, 3);
            testTimer.Interval = 500;
            testTimer.Tick += delegate { UpdateTestCounters(); };

            lblStatus.AutoSize = true;
            lblStatus.Margin = new Padding(3, 8, 3, 0);
            lblStatus.ForeColor = Color.FromArgb(55, 65, 81);
            root.Controls.Add(lblStatus, 0, 4);

            var hint = new Label
            {
                AutoSize = true,
                ForeColor = Color.Gray,
                Margin = new Padding(3, 4, 3, 0),
                Text = "Pencereyi kapatınca uygulama sistem tepsisinde çalışmaya devam eder. Tamamen kapatmak için tepsi menüsünden \"Çıkış\"."
            };
            root.Controls.Add(hint, 0, 5);
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

        // Ekran listesini doldurur. Kayıtlı ekran yoksa ve birden fazla ekran varsa
        // Windows ana ekranı olmayan ilk ekran (genellikle kiosk ekranı) seçilir.
        private void RefreshScreens()
        {
            bool wasLoading = loading;
            loading = true;
            try
            {
                cmbScreen.Items.Clear();
                Screen[] screens = Screen.AllScreens;
                int selected = -1, firstSecondary = -1;
                for (int i = 0; i < screens.Length; i++)
                {
                    Screen s = screens[i];
                    cmbScreen.Items.Add(string.Format("Ekran {0}: {1}×{2}, konum {3},{4}{5}", i + 1,
                        s.Bounds.Width, s.Bounds.Height, s.Bounds.X, s.Bounds.Y,
                        s.Primary ? " (Windows ana ekranı)" : ""));
                    if (s.DeviceName == settings.ScreenName) selected = i;
                    if (!s.Primary && firstSecondary < 0) firstSecondary = i;
                }
                if (selected < 0) selected = firstSecondary >= 0 ? firstSecondary : 0;
                cmbScreen.SelectedIndex = screens.Length > 0 ? selected : -1;
                lblScreenWarning.Text = screens.Length == 1
                    ? "⚠ Windows yalnızca 1 ekran görüyor. Kiosk ayrı bir monitörse klavyede Windows+P'ye basıp " +
                      "\"Genişlet\"i seçin; yoksa kalibrasyon yalnızca bu ekranda açılabilir."
                    : "Windows " + screens.Length + " ekran görüyor. Kalibrasyon önce seçili ekranda \"Dokunmatik ekran bu mu?\" diye sorar.";
                lblScreenWarning.ForeColor = screens.Length == 1 ? Color.FromArgb(180, 83, 9) : Color.FromArgb(75, 85, 99);
                lblScreenWarning.Visible = true;
            }
            finally
            {
                loading = wasLoading;
            }
        }

        private int SelectedScreenIndex()
        {
            int count = Screen.AllScreens.Length;
            int i = cmbScreen.SelectedIndex;
            return i >= 0 && i < count ? i : 0;
        }

        private void SetScreen(Screen screen)
        {
            settings.ScreenName = screen.DeviceName;
            SaveSettings();
            RefreshScreens();
        }

        private void OnDisplaySettingsChanged(object sender, EventArgs e)
        {
            if (IsHandleCreated) BeginInvoke(new Action(RefreshScreens));
        }

        private void LoadIntoUi()
        {
            // Windows dokunma girişi için kaydedilmiş düzeltme (1.5 sürümü) desteklenmiyor:
            // bu dokunmatik fare moduna alınıp yeniden kalibre edilir. Eski kaydı kaldır.
            if (settings.Source == InputSource.WindowsTouch && settings.Transform != null)
            {
                settings.Transform = null;
                settings.RmsError = double.NaN;
                settings.Source = null;
                SaveSettings();
            }
            RefreshScreens();
            loading = true;
            try
            {
                chkFilter.Checked = settings.DeviceFilter;
                chkCorrection.Checked = settings.CorrectionEnabled;
                trayCorrection.Checked = settings.CorrectionEnabled;
                try
                {
                    chkAutoStart.Checked = Settings.AutoStart;
                    // Otomatik başlatma eski bir exe yolunu gösteriyorsa bu exe ile güncelle.
                    if (chkAutoStart.Checked) Settings.AutoStart = true;
                }
                catch { }
            }
            finally
            {
                loading = false;
            }

            RefreshDevices();
            ApplyEngineSettings();
            UpdateCalibrationLabel();
            UpdateRestoreButton();
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == NativeMethods.WM_HOTKEY && m.WParam.ToInt32() == HotkeyId)
            {
                if (cmbTest.SelectedIndex > 0)
                {
                    cmbTest.SelectedIndex = 0; // önce testi kapat
                    return;
                }
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
            if (m.Msg == Program.QuitMessage)
            {
                // Programın başka bir exe'si (ör. yeni sürüm) başlatıldı: yerini ona bırak.
                if (activeCalibration != null)
                {
                    quitRequested = true;
                    activeCalibration.Close();
                }
                else
                {
                    ExitApp();
                }
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
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged -= OnDisplaySettingsChanged;
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
                        InputDevices.SameDevice(d.Path, settings.DevicePath))
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
                SwitchToMouseMode();
                return;
            }
            SelectDevice(d.Path, d.Name);
        }

        private void SelectDevice(string path, string name)
        {
            settings.DevicePath = path;
            settings.DeviceName = name;
            // Elle seçilen cihaz, düzeltmenin uygulanacağı kaynak olur.
            settings.Source = InputSource.Hardware(InputDevices.DeviceKey(path));
            SaveSettings();
            ApplyEngineSettings();
            foreach (ListViewItem item in lvDevices.Items)
            {
                var d = (InputDeviceInfo)item.Tag;
                bool sel = InputDevices.SameDevice(d.Path, path);
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
                if (InputDevices.SameDevice(d.Path, path))
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
            SwitchToMouseMode();
        }

        private void OnDetectTimeout(object sender, EventArgs e)
        {
            detectTimer.Stop();
            engine.CancelDetect();
            btnDetect.Enabled = true;
            SetStatus("Cihaz algılanmadı. Sorun değil: doğrudan \"Kalibrasyonu başlat\"a basın, program dokunmanın kaynağını kendisi bulur.");
        }

        // ---------------- Kalibrasyon ----------------

        private void OnCalibrateClick(object sender, EventArgs e)
        {
            if (calibrating) return;
            if (cmbTest.SelectedIndex > 0) cmbTest.SelectedIndex = 0; // test açıksa kapat
            // Cihaz seçmek gerekmez: kalibrasyon, dokunmaların hangi yoldan geldiğini kendisi öğrenir.

            // Kalibrasyon bu ekranda başlar. Birden fazla ekran varsa kalibrasyon penceresi
            // "Dokunmatik ekran bu mu?" diye sorar; dokunulmazsa kendiliğinden sonraki ekrana geçer.
            Screen[] screens = Screen.AllScreens;
            if (screens.Length == 1 && !singleScreenWarned)
            {
                singleScreenWarned = true;
                Rectangle b = screens[0].Bounds;
                if (MessageBox.Show(this,
                        "Windows şu an yalnızca 1 ekran görüyor (" + b.Width + "×" + b.Height + ").\n\n" +
                        "Kalibrasyon bu ekranda açılacak. Kiosk ekranı ayrı bir monitörse ve üzerinde görüntü yoksa " +
                        "önce klavyede Windows+P'ye basıp \"Genişlet\"i seçin, sonra kalibrasyonu yeniden başlatın.\n\n" +
                        "Yine de bu ekranda devam edilsin mi?",
                        Text, MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes)
                {
                    SetStatus("Kalibrasyon başlatılmadı.");
                    return;
                }
            }
            Screen target = screens[Math.Min(SelectedScreenIndex(), screens.Length - 1)];

            bool saved = false;
            bool windowsTouch = false;
            bool anyTouch = false;
            calibrating = true;
            try
            {
                using (var form = new CalibrationForm(engine, target))
                {
                    activeCalibration = form;
                    bool ok = form.ShowDialog(this) == DialogResult.OK && form.Result != null;
                    activeCalibration = null;
                    windowsTouch = form.WindowsTouchDetected;
                    anyTouch = form.AnyTouchSeen;
                    // Dokunarak onaylanan ekranı hatırla; bir dahaki sefere doğrudan orada başlar.
                    if (form.ScreenConfirmed && form.TargetScreen.DeviceName != settings.ScreenName)
                        SetScreen(form.TargetScreen);
                    if (ok)
                    {
                        settings.Transform = form.Result;
                        settings.RmsError = form.RmsError;
                        settings.Source = form.Source;
                        settings.CorrectionEnabled = true;
                        saved = true;
                    }
                }
            }
            finally
            {
                calibrating = false;
                activeCalibration = null;
                // Ne olursa olsun (hata dahil) motoru kayıtlı ayara döndür; fare/dokunma kilitli kalmasın.
                ApplyEngineSettings();
            }

            if (quitRequested)
            {
                ExitApp();
                return;
            }

            if (windowsTouch)
            {
                SwitchToMouseMode();
                return;
            }

            if (!saved && !anyTouch && !string.IsNullOrEmpty(settings.DisabledTouch))
            {
                MessageBox.Show(this,
                    "Kalibrasyon sırasında hiç dokunma algılanmadı.\n\n" +
                    "1) Dokunmatiğin USB kablosunu bilgisayardan çıkarın, 5 saniye bekleyip tekrar takın.\n" +
                    "2) \"Kalibrasyonu başlat\"a yeniden basın.\n\n" +
                    "Yine dokunma algılanmazsa bu kart fare moduna geçmiyor demektir; " +
                    "\"Dokunmatiği eski haline döndür\" ile önceki duruma dönebilirsiniz.",
                    Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
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
            settings.Source = null;
            settings.RmsError = double.NaN;
            SaveSettings();
            ApplyEngineSettings();
            UpdateCalibrationLabel();
            SetStatus("Kalibrasyon sıfırlandı.");
        }

        // Dokunmatik Windows dokunma modunda çalışıyorsa (HID touch screen) dokunuşlar Windows'un
        // dokunma yolundan gelir ve uygulama onları düzeltemez. UPDD gibi kendi kalibrasyonumuzla
        // çalışmak için Windows'un dokunma parçası kapatılır; çift modlu kart fare moduna geçer.
        private void SwitchToMouseMode()
        {
            // Windows dokunma yolu için kaydedilmiş eski düzeltme varsa kaldır.
            if (settings.Source == InputSource.WindowsTouch)
            {
                settings.Transform = null;
                settings.RmsError = double.NaN;
                settings.Source = null;
                SaveSettings();
                ApplyEngineSettings();
                UpdateCalibrationLabel();
            }

            List<InputDeviceInfo> touch;
            try { touch = DeviceControl.FindWindowsTouchScreens(); }
            catch (Exception ex) { ShowError("Cihazlar okunamadı: " + ex.Message); return; }
            if (touch.Count == 0)
            {
                ShowError("Windows'un dokunma parçası (HID-compliant touch screen) bulunamadı.");
                return;
            }

            var names = new List<string>();
            var ids = new List<string>();
            foreach (InputDeviceInfo d in touch)
            {
                names.Add(d.Name);
                ids.Add(DeviceControl.InstanceIdFromPath(d.Path));
            }

            if (MessageBox.Show(this,
                    "Dokunmatiğiniz şu an Windows dokunma modunda çalışıyor. Bu modda dokunuşlar Windows'un " +
                    "kendi yolundan gelir ve bu uygulama onları düzeltemez.\n\n" +
                    "UPDD gibi bu uygulamanın kendi 4 noktalı kalibrasyonuyla çalışabilmesi için dokunmatiği " +
                    "FARE MODUNA alacağım:\n" +
                    "  • Windows'un dokunma parçası kapatılacak: " + string.Join(", ", names.ToArray()) + "\n" +
                    "  • Dokunmatik kart birkaç saniyeliğine yeniden başlatılacak.\n" +
                    "  • Windows \"değişiklik yapılsın mı?\" diye soracak: Evet deyin.\n" +
                    "  • Ardından 4 noktalı kalibrasyon kendiliğinden başlayacak.\n\n" +
                    "İstediğiniz zaman \"Dokunmatiği eski haline döndür\" düğmesiyle geri alınır.\n\n" +
                    "Devam edilsin mi?",
                    Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
                return;

            string idList = string.Join("|", ids.ToArray());
            SetStatus("Dokunmatik fare moduna alınıyor... (Windows izin isterse Evet deyin)");
            RunElevated(DeviceControl.DisableArg, idList, delegate (int code)
            {
                if (code == -1)
                {
                    SetStatus("İzin verilmedi; hiçbir şey değiştirilmedi.");
                    return;
                }
                settings.DisabledTouch = MergeIds(settings.DisabledTouch, idList);
                SaveSettings();
                UpdateRestoreButton();
                if (code != 0)
                {
                    ShowError("Windows'un dokunma parçası kapatılamadı (kod " + code + ").");
                    return;
                }
                SetStatus("Dokunmatik fare moduna alındı. Kalibrasyon birkaç saniye içinde başlıyor...");
                // Kartın yeniden tanınması için biraz bekle, sonra kalibrasyonu başlat.
                var wait = new Timer { Interval = 5000 };
                wait.Tick += delegate
                {
                    wait.Stop();
                    wait.Dispose();
                    RefreshDevices();
                    OnCalibrateClick(this, EventArgs.Empty);
                };
                wait.Start();
            });
        }

        private void RestoreWindowsTouch()
        {
            if (string.IsNullOrEmpty(settings.DisabledTouch)) return;
            if (MessageBox.Show(this,
                    "Dokunmatik eski haline (Windows dokunma modu) döndürülsün mü?\n\n" +
                    "Bu uygulamanın kalibrasyonu o modda uygulanamaz.",
                    Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
                return;
            RunElevated(DeviceControl.EnableArg, settings.DisabledTouch, delegate (int code)
            {
                if (code == -1)
                {
                    SetStatus("İzin verilmedi; hiçbir şey değiştirilmedi.");
                    return;
                }
                if (code != 0)
                {
                    ShowError("Dokunmatik eski haline döndürülemedi (kod " + code + ").");
                    return;
                }
                settings.DisabledTouch = null;
                SaveSettings();
                UpdateRestoreButton();
                SetStatus("Dokunmatik eski haline döndürüldü.");
                RefreshDevices();
            });
        }

        // Uygulamayı yönetici olarak yardımcı modda çalıştırır. Arayüz iş parçacığını (ve fare
        // kancasını) bloke etmemek için beklemez; bitince done(çıkış kodu) çağrılır. -1 = izin verilmedi.
        private void RunElevated(string arg, string idList, Action<int> done)
        {
            Process p;
            try
            {
                var psi = new ProcessStartInfo(Application.ExecutablePath, arg + " \"" + idList + "\"")
                {
                    UseShellExecute = true,
                    Verb = "runas",
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                p = Process.Start(psi);
            }
            catch (System.ComponentModel.Win32Exception)
            {
                done(-1);
                return;
            }
            if (p == null)
            {
                done(2);
                return;
            }
            p.SynchronizingObject = this;
            p.EnableRaisingEvents = true;
            p.Exited += delegate
            {
                int code;
                try { code = p.ExitCode; } catch { code = 2; }
                p.Dispose();
                done(code);
            };
        }

        private static string MergeIds(string a, string b)
        {
            var list = new List<string>();
            foreach (string s in ((a ?? "") + "|" + (b ?? "")).Split('|'))
                if (s.Length > 0 && !list.Contains(s)) list.Add(s);
            return string.Join("|", list.ToArray());
        }

        private void UpdateRestoreButton()
        {
            btnRestoreTouch.Visible = !string.IsNullOrEmpty(settings.DisabledTouch);
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

        // ---------------- Test ----------------

        private void OnTestChanged()
        {
            engine.CountWindowsTouch = engine.CountInjected = engine.CountHardware = 0;
            if (cmbTest.SelectedIndex > 0)
            {
                testTimer.Start();
                SetStatus("TEST AÇIK: " + cmbTest.Text + ". Paint'te aynı yere dokunup çizginin nereye gittiğine bakın.");
            }
            else
            {
                testTimer.Stop();
                lblTest.Text = "";
                SetStatus("Test kapatıldı.");
            }
            ApplyEngineSettings();
            UpdateTestCounters();
        }

        private void UpdateTestCounters()
        {
            if (cmbTest.SelectedIndex <= 0) return;
            lblTest.Text = "Yakalanıp yerine başka yere gönderilen olaylar:  Windows dokunma: " + engine.CountWindowsTouch +
                           "   •   başka program (ör. UPDD): " + engine.CountInjected +
                           "   •   USB cihaz: " + engine.CountHardware;
        }

        private AffineTransform TestTransform(int index)
        {
            Rectangle vs = InputEngine.VirtualScreen();
            switch (index)
            {
                case 1: return new AffineTransform(1, 0, 300, 0, 1, 0);
                case 2: return new AffineTransform(1, 0, 0, 0, 1, 300);
                case 3: return new AffineTransform(-1, 0, vs.Left + vs.Right - 1, 0, 1, 0);
                case 4: return new AffineTransform(1, 0, 0, 0, -1, vs.Top + vs.Bottom - 1);
                default:
                {
                    // Ana ekranın dikdörtgenini kiosk ekranının dikdörtgenine eşle.
                    Rectangle p = Screen.PrimaryScreen.Bounds;
                    Rectangle k = p;
                    Screen[] all = Screen.AllScreens;
                    int sel = SelectedScreenIndex();
                    if (sel < all.Length && !all[sel].Primary) k = all[sel].Bounds;
                    else foreach (Screen sc in all) if (!sc.Primary) { k = sc.Bounds; break; }
                    double a = (double)k.Width / p.Width, e = (double)k.Height / p.Height;
                    return new AffineTransform(a, 0, k.X - p.X * a, 0, e, k.Y - p.Y * e);
                }
            }
        }

        private void ApplyEngineSettings()
        {
            engine.DeviceFilter = settings.DeviceFilter;
            if (!calibrating && cmbTest.SelectedIndex > 0)
            {
                // Test: kayıtlı ayarları değiştirmeden geçici bir düzeltme uygula.
                engine.DeviceFilter = true;
                engine.CorrectSource = InputSource.AnyTouch;
                engine.Transform = TestTransform(cmbTest.SelectedIndex);
                engine.Mode = EngineMode.Correct;
                return;
            }
            // Kalibrasyon penceresi açıkken dönüşümü ve modu o yönetir.
            if (!calibrating)
            {
                // Kaynak kalibrasyondan gelir; eski ayar dosyalarında seçili cihaz kullanılır.
                engine.CorrectSource = settings.Source ??
                                       InputSource.Hardware(InputDevices.DeviceKey(settings.DevicePath));
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
                                      (double.IsNaN(settings.RmsError) ? "" : "   (ortalama hata " + settings.RmsError.ToString("0.0") + " px)") +
                                      "\nDokunma kaynağı: " + InputSource.Describe(engine.CorrectSource);
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

            if (settings.Transform != null && !settings.DeviceFilter)
                state += "  Filtre kapalı — tüm fare olayları düzeltilir.";
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
                testTimer.Dispose();
                if (appIcon != null) appIcon.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
