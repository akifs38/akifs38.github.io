using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    // Tam ekran kalibrasyon penceresi: hedefleri sırayla gösterir, dokunulan
    // noktaları toplar, dönüşümü hesaplar ve kaydetmeden önce test ettirir.
    internal sealed class CalibrationForm : Form
    {
        private const int IdleLimitSeconds = 30;
        private const int VerifyLimitSeconds = 45;

        private readonly InputEngine engine;
        private readonly Screen screen;
        private readonly EngineMode previousMode;
        private readonly AffineTransform previousTransform;
        private readonly PointF[] relTargets;
        private readonly List<PointF> rawPoints = new List<PointF>();
        private readonly List<Point> testPoints = new List<Point>();
        private readonly Timer timer = new Timer();
        private readonly Button btnSave = new Button();
        private readonly Button btnRetry = new Button();
        private readonly Button btnCancel = new Button();

        private bool verifying;
        private int secondsLeft;
        private int flashFrames;
        private string errorText;

        public AffineTransform Result { get; private set; }
        public double RmsError { get; private set; }

        public CalibrationForm(InputEngine engine, Screen screen, int pointCount)
        {
            this.engine = engine;
            this.screen = screen;
            previousMode = engine.Mode;
            previousTransform = engine.Transform;
            relTargets = pointCount == 9
                ? new[]
                {
                    new PointF(0.1f, 0.1f), new PointF(0.5f, 0.1f), new PointF(0.9f, 0.1f),
                    new PointF(0.9f, 0.5f), new PointF(0.5f, 0.5f), new PointF(0.1f, 0.5f),
                    new PointF(0.1f, 0.9f), new PointF(0.5f, 0.9f), new PointF(0.9f, 0.9f)
                }
                : new[]
                {
                    new PointF(0.1f, 0.1f), new PointF(0.9f, 0.1f), new PointF(0.9f, 0.9f),
                    new PointF(0.1f, 0.9f), new PointF(0.5f, 0.5f)
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
            // DPI'si farklı bir ekrana taşınınca boyut değişebilir; yeniden uygula.
            Bounds = screen.Bounds;
            LayoutButtons();
            Activate();
            engine.PointCaptured += OnPointCaptured;
            engine.TouchDown += OnTouchDown;
            Restart();
            timer.Start();
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            timer.Stop();
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

        private void Restart()
        {
            verifying = false;
            rawPoints.Clear();
            testPoints.Clear();
            secondsLeft = IdleLimitSeconds;
            btnSave.Visible = btnRetry.Visible = btnCancel.Visible = false;
            engine.Transform = previousTransform;
            engine.Mode = EngineMode.Capture;
            Invalidate();
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
            Invalidate();
        }

        private void OnPointCaptured(Point p)
        {
            if (verifying || rawPoints.Count >= relTargets.Length) return;
            flashFrames = 0;
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
            verifying = true;
            secondsLeft = VerifyLimitSeconds;
            engine.Transform = t;
            engine.Mode = EngineMode.Correct;
            btnSave.Visible = btnRetry.Visible = btnCancel.Visible = true;
        }

        private void Finish(bool save)
        {
            DialogResult = save && Result != null ? DialogResult.OK : DialogResult.Cancel;
            Close();
        }

        private void OnTimerTick(object sender, EventArgs e)
        {
            secondsLeft--;
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
            if (e.KeyCode == Keys.Escape) Finish(false);
            else if (e.KeyCode == Keys.R) Restart();
            else if (e.KeyCode == Keys.Enter && verifying) Finish(true);
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
            if (!verifying) return;
            testPoints.Add(p);
            if (testPoints.Count > 400) testPoints.RemoveAt(0);
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

            int size = Math.Max(24, Math.Min(ClientSize.Width, ClientSize.Height) / 18);
            float fontPx = Math.Max(14, ClientSize.Height / 45f);

            using (var font = new Font("Segoe UI", fontPx, GraphicsUnit.Pixel))
            using (var bold = new Font("Segoe UI", fontPx * 1.3f, FontStyle.Bold, GraphicsUnit.Pixel))
            {
                if (!verifying)
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
                                  "Esc: iptal   •   R: baştan başla   •   " + secondsLeft + " sn içinde dokunulmazsa iptal edilir.";
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
