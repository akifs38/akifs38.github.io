using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    // Birden fazla ekran varken kalibrasyonun hangi ekranda yapılacağını seçtirir.
    // Tek bir pencere tüm ekranları kaplar; her ekranda büyük bir numara gösterilir.
    // Kullanıcı dokunmatik (kiosk) ekrana fareyle tıklar ya da numarasına basar.
    internal sealed class ScreenPickerForm : Form
    {
        private readonly Screen[] screens;
        private readonly int current;
        private int hover = -1;

        public int SelectedIndex { get; private set; }

        public ScreenPickerForm(Screen[] screens, int current)
        {
            this.screens = screens;
            this.current = current;
            SelectedIndex = -1;

            Text = "Dokunmatik ekranı seçin";
            FormBorderStyle = FormBorderStyle.None;
            StartPosition = FormStartPosition.Manual;
            Bounds = AllScreensBounds();
            TopMost = true;
            ShowInTaskbar = false;
            BackColor = Color.Black;
            KeyPreview = true;
            DoubleBuffered = true;
            Cursor = Cursors.Hand;
        }

        private Rectangle AllScreensBounds()
        {
            Rectangle r = screens[0].Bounds;
            for (int i = 1; i < screens.Length; i++) r = Rectangle.Union(r, screens[i].Bounds);
            return r;
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            Bounds = AllScreensBounds();
            Activate();
        }

        private int IndexAt(Point screenPoint)
        {
            for (int i = 0; i < screens.Length; i++)
                if (screens[i].Bounds.Contains(screenPoint)) return i;
            return -1;
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            int i = IndexAt(PointToScreen(e.Location));
            if (i != hover)
            {
                hover = i;
                Invalidate();
            }
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            if (e.Button != MouseButtons.Left) return;
            Choose(IndexAt(PointToScreen(e.Location)));
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            base.OnKeyDown(e);
            if (e.KeyCode == Keys.Escape)
            {
                DialogResult = DialogResult.Cancel;
                Close();
                return;
            }
            if (e.KeyCode == Keys.Enter)
            {
                Choose(current);
                return;
            }
            int n = -1;
            if (e.KeyCode >= Keys.D1 && e.KeyCode <= Keys.D9) n = e.KeyCode - Keys.D1;
            else if (e.KeyCode >= Keys.NumPad1 && e.KeyCode <= Keys.NumPad9) n = e.KeyCode - Keys.NumPad1;
            if (n >= 0) Choose(n);
        }

        private void Choose(int index)
        {
            if (index < 0 || index >= screens.Length) return;
            SelectedIndex = index;
            DialogResult = DialogResult.OK;
            Close();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            for (int i = 0; i < screens.Length; i++)
            {
                Rectangle r = RectangleToClient(screens[i].Bounds);
                bool isHover = i == hover;
                Color bg = isHover ? Color.FromArgb(29, 78, 216) : Color.FromArgb(30, 41, 59);
                using (var brush = new SolidBrush(bg))
                    g.FillRectangle(brush, r);

                if (i == current)
                {
                    int w = Math.Max(6, r.Height / 90);
                    using (var pen = new Pen(Color.FromArgb(250, 204, 21), w))
                        g.DrawRectangle(pen, r.X + w / 2, r.Y + w / 2, r.Width - w, r.Height - w);
                }

                float big = Math.Max(48, r.Height / 3.2f);
                float small = Math.Max(16, r.Height / 32f);
                using (var numFont = new Font("Segoe UI", big, FontStyle.Bold, GraphicsUnit.Pixel))
                using (var font = new Font("Segoe UI", small, GraphicsUnit.Pixel))
                using (var bold = new Font("Segoe UI", small * 1.25f, FontStyle.Bold, GraphicsUnit.Pixel))
                using (var white = new SolidBrush(Color.White))
                using (var gray = new SolidBrush(Color.FromArgb(203, 213, 225)))
                using (var fmt = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
                {
                    var numRect = new RectangleF(r.X, r.Y + r.Height * 0.08f, r.Width, r.Height * 0.42f);
                    g.DrawString((i + 1).ToString(), numFont, white, numRect, fmt);

                    var titleRect = new RectangleF(r.X + r.Width * 0.05f, r.Y + r.Height * 0.52f, r.Width * 0.9f, r.Height * 0.1f);
                    g.DrawString("Dokunmatik (kiosk) ekran BU ise buraya FAREYLE tıklayın", bold, white, titleRect, fmt);

                    string info = "ya da klavyeden " + (i + 1) + " tuşuna basın\n\n" +
                                  screens[i].Bounds.Width + "×" + screens[i].Bounds.Height +
                                  (screens[i].Primary ? "  •  Windows ana ekranı" : "") +
                                  (i == current ? "  •  şu an seçili (Enter)" : "") +
                                  "\nEsc: iptal";
                    var infoRect = new RectangleF(r.X + r.Width * 0.05f, r.Y + r.Height * 0.63f, r.Width * 0.9f, r.Height * 0.3f);
                    fmt.LineAlignment = StringAlignment.Near;
                    g.DrawString(info, font, gray, infoRect, fmt);
                }
            }
        }
    }
}
