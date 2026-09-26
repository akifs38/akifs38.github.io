using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    // Tam ekran kalibrasyon penceresi. Üç aşaması vardır:
    //  1. Ekran tanıma (birden fazla ekran varsa): "Dokunmatik ekran bu mu?" diye sorar.
    //     Dokunulursa bu ekran seçilir; dokunulmazsa birkaç saniye sonra kendiliğinden
    //     sonraki ekrana geçer (UPDD / Windows "Tablet PC Ayarları" yöntemi). Fare ya da
    //     klavye gerekmez. Dokunmanın koordinatına bakılmaz, çünkü kalibrasyondan önce
    //     Windows kiosk dokunuşlarını genellikle ana (PC) ekrana eşler.
    //  2. 4 köşe hedefine dokunma ve dönüşümün hesaplanması.
    //  3. Kaydetmeden önce test.
    internal sealed class CalibrationForm : Form
    {
        private enum Phase { Identify, Capture, Verify }

        private const int IdentifySecondsPerScreen = 8;
        private const int IdentifyRounds = 3;
        private const int IdleLimitSeconds = 30;
        private const int VerifyLimitSeconds = 45;

        private static readonly Color IdentifyBack = Color.FromArgb(29, 78, 216);

        private readonly InputEngine engine;
        private Screen screen;
        private readonly EngineMode previousMode;
        private readonly AffineTransform previousTransform;
        private readonly PointF[] relTargets;
        private readonly List<PointF> rawPoints = new List<PointF>();
        private readonly List<Point> testPoints = new List<Point>();
        private readonly Timer timer = new Timer();
        private readonly Button btnSave = new Button();
        private readonly Button btnRetry = new Button();
        private readonly Button btnCancel = new Button();

        private Phase phase;
        private int identifyTries;
        private int holdTicks;
        private int secondsLeft;
        private int flashFrames;
        private string errorText;
        private bool cursorHidden;
        private Point? lastRawTouch;

        public AffineTransform Result { get; private set; }
        public double RmsError { get; private set; }
        public Screen TargetScreen { get { return screen; } }
        // Kullanıcı bu ekranın dokunmatik ekran olduğunu dokunarak onayladı mı?
        public bool ScreenConfirmed { get; private set; }

        public CalibrationForm(InputEngine engine, Screen screen)
        {
            this.engine = engine;
            this.screen = screen;
            previousMode = engine.Mode;
            previousTransform = engine.Transform;
            // 4 köşe hedefi: sol üst, sağ üst, sağ alt, sol alt (kenarlardan %10 içeride).
            relTargets = new[]
            {
                new PointF(0.1f, 0.1f), new PointF(0.9f, 0.1f),
                new PointF(0.9f, 0.9f), new PointF(0.1f, 0.9f)
            };

            Text = "Dokunmatik Kalibrasyon";
            FormBorderStyle = FormBorderStyle.None;
            StartPosition = FormStartPosition.Manual;
            Bounds = screen.Bounds;
            TopMost = true;
            ShowInTaskbar = false;
            BackColor = Color.White;
            KeyPreview = true;
            DoubleBuffered = true;

            SetupButton(btnSave, "Kaydet", Color.FromArgb(22, 128, 61));
            SetupButton(btnRetry, "Tekrarla", Color.FromArgb(37, 99, 235));
            SetupButton(btnCancel, "İptal", Color.FromArgb(185, 28, 28));
            btnSave.Click += delegate { Finish(true); };
            btnRetry.Click += delegate { Restart(); };
            btnCancel.Click += delegate { Finish(false); };

            timer.Interval = 1000;
            timer.Tick += OnTimerTick;
        }

        private void SetupButton(Button b, string text, Color color)
        {
            b.Text = text;
            b.Visible = false;
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.BackColor = color;
            b.ForeColor = Color.White;
            b.TabStop = false;
            Controls.Add(b);
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            PlaceOnScreen();
            engine.PointCaptured += OnPointCaptured;
            engine.TouchDown += OnTouchDown;
            if (Screen.AllScreens.Length > 1)
            {
                StartIdentify();
            }
            else
            {
                ScreenConfirmed = true;
                Restart();
            }
            timer.Start();
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            timer.Stop();
            SetCursorHidden(false);
            engine.PointCaptured -= OnPointCaptured;
            engine.TouchDown -= OnTouchDown;
            engine.Transform = previousTransform;
            engine.Mode = previousMode;
            base.OnFormClosed(e);
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            LayoutButtons();
            Invalidate();
        }

        // Pencereyi seçili ekranı tam kaplayacak şekilde yerleştirir.
        private void PlaceOnScreen()
        {
            Bounds = screen.Bounds;
            // Windows pencereyi başka ekrana koyduysa doğrudan Win32 ile zorla yerleştir.
            if (IsHandleCreated && Screen.FromHandle(Handle).DeviceName != screen.DeviceName)
            {
                Rectangle b = screen.Bounds;
                NativeMethods.SetWindowPos(Handle, NativeMethods.HWND_TOPMOST, b.X, b.Y, b.Width, b.Height,
                    NativeMethods.SWP_SHOWWINDOW);
            }
            LayoutButtons();
            Activate();
            Invalidate();
        }

        private void LayoutButtons()
        {
            int w = Math.Max(140, ClientSize.Width / 7);
            int h = Math.Max(56, ClientSize.Height / 11);
            int gap = w / 5;
            int total = w * 3 + gap * 2;
            int x = (ClientSize.Width - total) / 2;
            int y = (int)(ClientSize.Height * 0.62);
            float fontPx = Math.Max(16, h / 3f);
            foreach (Button b in new[] { btnSave, btnRetry, btnCancel })
            {
                b.SetBounds(x, y, w, h);
                b.Font = new Font("Segoe UI", fontPx, FontStyle.Bold, GraphicsUnit.Pixel);
                x += w + gap;
            }
        }

        // Kalibrasyon bitene kadar imleç yanlış yerde görünür ve kafa karıştırır: gizle.
        private void SetCursorHidden(bool hide)
        {
            if (hide == cursorHidden) return;
            if (hide) Cursor.Hide(); else Cursor.Show();
            cursorHidden = hide;
        }

        // ---------------- Aşamalar ----------------

        private void StartIdentify()
        {
            phase = Phase.Identify;
            holdTicks = 0;
            rawPoints.Clear();
            testPoints.Clear();
            secondsLeft = IdentifySecondsPerScreen;
            btnSave.Visible = btnRetry.Visible = btnCancel.Visible = false;
            BackColor = IdentifyBack;
            SetCursorHidden(true);
            engine.Transform = previousTransform;
            // Yakalama modu dokunmaları yutar; kiosk'ta masaüstüne yanlışlıkla tıklanmaz.
            engine.Mode = EngineMode.Capture;
            Invalidate();
        }

        private void AcceptScreen()
        {
            ScreenConfirmed = true;
            errorText = null;
            Restart();
        }

        private void Restart()
        {
            phase = Phase.Capture;
            rawPoints.Clear();
            testPoints.Clear();
            secondsLeft = IdleLimitSeconds;
            btnSave.Visible = btnRetry.Visible = btnCancel.Visible = false;
            BackColor = Color.White;
            SetCursorHidden(true);
            engine.Transform = previousTransform;
            engine.Mode = EngineMode.Capture;
            Invalidate();
        }

        private void MoveToNextScreen()
        {
            Screen[] all = Screen.AllScreens;
            if (all.Length < 2) return;
            int idx = 0;
            for (int i = 0; i < all.Length; i++)
                if (all[i].DeviceName == screen.DeviceName) idx = i;
            screen = all[(idx + 1) % all.Length];
            ScreenConfirmed = false;
            errorText = null;
            PlaceOnScreen();
            StartIdentify();
        }

        private Point TargetOnScreen(int i)
        {
            Rectangle b = screen.Bounds;
            return new Point(b.Left + (int)Math.Round(relTargets[i].X * (b.Width - 1)),
                             b.Top + (int)Math.Round(relTargets[i].Y * (b.Height - 1)));
        }

        private void OnTouchDown()
        {
            flashFrames = 1;
            // Parmak ekrandayken geri sayım ekran değiştirmesin (en fazla 3 sn beklenir).
            if (phase == Phase.Identify) holdTicks = 3;
            Invalidate();
        }

        private void OnPointCaptured(Point p)
        {
            flashFrames = 0;
            lastRawTouch = p;
            if (phase == Phase.Identify)
            {
                // Dokunmanın nereye düştüğü önemli değil: dokunulduysa kullanıcı bu ekranı görüyor.
                AcceptScreen();
                return;
            }
            if (phase != Phase.Capture || rawPoints.Count >= relTargets.Length) return;
            errorText = null;
            rawPoints.Add(p);
            secondsLeft = IdleLimitSeconds;
            if (rawPoints.Count == relTargets.Length) Compute();
            Invalidate();
        }

        private void Compute()
        {
            var targets = new PointF[relTargets.Length];
            for (int i = 0; i < targets.Length; i++) targets[i] = TargetOnScreen(i);

            double rms;
            AffineTransform t = AffineTransform.Fit(rawPoints.ToArray(), targets, out rms);
            if (t == null)
            {
                errorText = "Kalibrasyon hesaplanamadı (dokunulan noktalar birbirine çok yakın). Tekrar deneyin.";
                Restart();
                return;
            }

            Result = t;
            RmsError = rms;
            phase = Phase.Verify;
            secondsLeft = VerifyLimitSeconds;
            engine.Transform = t;
            engine.Mode = EngineMode.Correct;
            SetCursorHidden(false);
            btnSave.Visible = btnRetry.Visible = btnCancel.Visible = true;
        }

        private void Finish(bool save)
        {
            DialogResult = save && Result != null ? DialogResult.OK : DialogResult.Cancel;
            Close();
        }

        private void OnTimerTick(object sender, EventArgs e)
        {
            if (phase == Phase.Identify && holdTicks > 0)
            {
                holdTicks--;
                return;
            }
            secondsLeft--;
            if (phase == Phase.Identify)
            {
                if (secondsLeft <= 0)
                {
                    // Bu ekranda dokunma yok: sonraki ekranı dene. Birkaç tur sonra vazgeç.
                    identifyTries++;
                    if (identifyTries >= Screen.AllScreens.Length * IdentifyRounds)
                    {
                        Finish(false);
                        return;
                    }
                    MoveToNextScreen();
                }
                Invalidate();
                return;
            }
            if (secondsLeft <= 0)
            {
                // Onay gelmezse (ör. dokunmatik hiç çalışmıyorsa) eski ayara dön.
                Finish(false);
                return;
            }
            Invalidate();
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            base.OnKeyDown(e);
            switch (e.KeyCode)
            {
                case Keys.Escape:
                    Finish(false);
                    break;
                case Keys.E:
                    identifyTries = 0;
                    MoveToNextScreen();
                    break;
                case Keys.R:
                    if (phase != Phase.Identify) Restart();
                    break;
                case Keys.Enter:
                case Keys.Space:
                    if (phase == Phase.Identify) AcceptScreen();
                    else if (phase == Phase.Verify && e.KeyCode == Keys.Enter) Finish(true);
                    break;
            }
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            // Fareyle bu pencereye tıklandıysa kullanıcı bu ekranı görüyor demektir.
            if (phase == Phase.Identify && e.Button == MouseButtons.Left) AcceptScreen();
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            AddTestPoint(e.Location);
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (e.Button != MouseButtons.None) AddTestPoint(e.Location);
        }

        private void AddTestPoint(Point p)
        {
            if (phase != Phase.Verify) return;
            testPoints.Add(p);
            if (testPoints.Count > 400) testPoints.RemoveAt(0);
            Invalidate();
        }

        // ---------------- Çizim ----------------

        private string ScreenInfo()
        {
            Screen[] all = Screen.AllScreens;
            int idx = 0;
            for (int i = 0; i < all.Length; i++)
                if (all[i].DeviceName == screen.DeviceName) idx = i;
            Rectangle b = screen.Bounds;
            return "Ekran " + (idx + 1) + " / " + all.Length + "  •  " + b.Width + "×" + b.Height +
                   "  •  konum " + b.X + "," + b.Y + (screen.Primary ? "  •  Windows ana ekranı" : "") +
                   "  •  sürüm " + Program.Version;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            if (phase == Phase.Identify)
            {
                PaintIdentify(g);
                return;
            }

            int size = Math.Max(24, Math.Min(ClientSize.Width, ClientSize.Height) / 18);
            float fontPx = Math.Max(14, ClientSize.Height / 45f);

            using (var font = new Font("Segoe UI", fontPx, GraphicsUnit.Pixel))
            using (var bold = new Font("Segoe UI", fontPx * 1.3f, FontStyle.Bold, GraphicsUnit.Pixel))
            {
                if (phase == Phase.Capture)
                {
                    for (int i = 0; i < relTargets.Length; i++)
                    {
                        Point c = PointToClient(TargetOnScreen(i));
                        if (i < rawPoints.Count) DrawTarget(g, c, size / 2, Color.FromArgb(34, 197, 94), false);
                        else if (i == rawPoints.Count)
                            DrawTarget(g, c, size, flashFrames > 0 ? Color.FromArgb(234, 88, 12) : Color.FromArgb(220, 38, 38), true);
                    }

                    string title = "Dokunmatik Kalibrasyon — nokta " + Math.Min(rawPoints.Count + 1, relTargets.Length) +
                                   " / " + relTargets.Length;
                    string body = "Kırmızı hedefin tam merkezine parmağınızla ya da kalemle dokunun ve kaldırın.\n" +
                                  "Kalibrasyon bitene kadar dokunmanın başka yere (ör. ters köşeye) gitmesi NORMALDİR;\n" +
                                  "imlece bakmayın, sadece hedefe dokunun. Hedef yeşile dönünce sonrakine geçin.\n" +
                                  "Esc: iptal   •   R: baştan başla   •   " + secondsLeft + " sn içinde dokunulmazsa iptal edilir.";
                    if (Screen.AllScreens.Length > 1)
                        body += "\nBu ekran dokunmatik (kiosk) ekran değilse klavyeden E tuşuna basın → sonraki ekran.";
                    if (engine.FilterActive == false)
                        body += "\nUyarı: cihaz seçilmedi, tüm fare tıklamaları kalibrasyon noktası sayılır.";
                    DrawCenteredText(g, title, bold, Color.FromArgb(17, 24, 39), 0.28f);
                    DrawCenteredText(g, body, font, Color.FromArgb(75, 85, 99), 0.36f);
                    if (errorText != null) DrawCenteredText(g, errorText, bold, Color.FromArgb(185, 28, 28), 0.66f);
                }
                else
                {
                    string title = "Test edin: ekranın farklı yerlerine dokunun";
                    string body = "Mavi noktalar parmağınızın tam altında çıkıyorsa \"Kaydet\"e dokunun.\n" +
                                  "Ortalama hata: " + RmsError.ToString("0.0") + " piksel" +
                                  (RmsError > 25 ? "  (yüksek — Tekrarla önerilir)" : "") + "\n" +
                                  secondsLeft + " sn içinde onaylanmazsa eski ayar geri yüklenir.  Enter: kaydet  •  Esc: iptal";
                    DrawCenteredText(g, title, bold, Color.FromArgb(17, 24, 39), 0.28f);
                    DrawCenteredText(g, body, font, Color.FromArgb(75, 85, 99), 0.36f);

                    using (var brush = new SolidBrush(Color.FromArgb(160, 37, 99, 235)))
                    {
                        int r = Math.Max(4, size / 6);
                        foreach (Point p in testPoints)
                            g.FillEllipse(brush, p.X - r, p.Y - r, r * 2, r * 2);
                    }
                }

                // Alt bilgi: hangi ekranda olduğumuz ve sürüm (sorun bildirirken işe yarar).
                string footer = ScreenInfo();
                if (lastRawTouch.HasValue)
                    footer += "  •  son dokunma (düzeltilmemiş): " + lastRawTouch.Value.X + "," + lastRawTouch.Value.Y;
                if (Screen.AllScreens.Length == 1)
                    footer += "\nWindows yalnızca bu ekranı görüyor. Kiosk ayrı bir monitörse Windows+P → \"Genişlet\" seçin.";
                using (var small = new Font("Segoe UI", Math.Max(12, fontPx * 0.8f), GraphicsUnit.Pixel))
                    DrawCenteredText(g, footer, small, Color.FromArgb(107, 114, 128), 0.73f);
            }
        }

        private void PaintIdentify(Graphics g)
        {
            int w = ClientSize.Width, h = ClientSize.Height;
            float titlePx = Math.Max(28, h / 11f);
            float bodyPx = Math.Max(16, h / 30f);
            float countPx = Math.Max(48, h / 4.5f);

            using (var titleFont = new Font("Segoe UI", titlePx, FontStyle.Bold, GraphicsUnit.Pixel))
            using (var bodyFont = new Font("Segoe UI", bodyPx, GraphicsUnit.Pixel))
            using (var countFont = new Font("Segoe UI", countPx, FontStyle.Bold, GraphicsUnit.Pixel))
            using (var white = new SolidBrush(Color.White))
            using (var soft = new SolidBrush(Color.FromArgb(191, 219, 254)))
            using (var yellow = new SolidBrush(Color.FromArgb(250, 204, 21)))
            using (var fmt = new StringFormat { Alignment = StringAlignment.Center })
            {
                g.DrawString("DOKUNMATİK EKRAN BU MU?", titleFont, white,
                    new RectangleF(0, h * 0.12f, w, h * 0.16f), fmt);
                g.DrawString(
                    "EVET  →  ekranın herhangi bir yerine dokunun\n" +
                    "HAYIR  →  hiçbir şey yapmayın, birazdan sonraki ekrana geçilecek\n" +
                    "(Dokunmanın başka yerde görünmesi normaldir; kalibrasyon bunu düzeltecek.)",
                    bodyFont, white, new RectangleF(w * 0.05f, h * 0.30f, w * 0.9f, h * 0.16f), fmt);
                g.DrawString(Math.Max(0, secondsLeft).ToString(), countFont,
                    flashFrames > 0 ? yellow : white,
                    new RectangleF(0, h * 0.46f, w, h * 0.3f), fmt);
                g.DrawString(
                    ScreenInfo() + "\nKlavye: Enter = bu ekran  •  E = sonraki ekran  •  Esc = iptal",
                    bodyFont, soft, new RectangleF(w * 0.05f, h * 0.80f, w * 0.9f, h * 0.15f), fmt);
            }
        }

        private void DrawCenteredText(Graphics g, string text, Font font, Color color, float relY)
        {
            var rect = new RectangleF(ClientSize.Width * 0.1f, ClientSize.Height * relY,
                                      ClientSize.Width * 0.8f, ClientSize.Height * 0.25f);
            using (var brush = new SolidBrush(color))
            using (var fmt = new StringFormat { Alignment = StringAlignment.Center })
                g.DrawString(text, font, brush, rect, fmt);
        }

        private static void DrawTarget(Graphics g, Point c, int size, Color color, bool active)
        {
            using (var pen = new Pen(color, active ? 3f : 2f))
            {
                g.DrawLine(pen, c.X - size, c.Y, c.X + size, c.Y);
                g.DrawLine(pen, c.X, c.Y - size, c.X, c.Y + size);
                g.DrawEllipse(pen, c.X - size / 2, c.Y - size / 2, size, size);
            }
            if (active)
            {
                using (var brush = new SolidBrush(color))
                    g.FillEllipse(brush, c.X - 4, c.Y - 4, 8, 8);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) timer.Dispose();
            base.Dispose(disposing);
        }
    }
}
