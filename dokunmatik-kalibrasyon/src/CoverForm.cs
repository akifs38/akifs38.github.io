using System;
using System.Drawing;
using System.Windows.Forms;

namespace DokunmatikKalibrasyon
{
    // Kalibrasyon sürerken diğer ekranları kaplayan koyu pencere. Odak çalmaz.
    // Dokunma yanlışlıkla bu ekrana düşse bile başka bir programa tıklanmaz.
    internal sealed class CoverForm : Form
    {
        private readonly Screen screen;

        public CoverForm(Screen screen)
        {
            this.screen = screen;
            Text = "Dokunmatik Kalibrasyon";
            FormBorderStyle = FormBorderStyle.None;
            StartPosition = FormStartPosition.Manual;
            Bounds = screen.Bounds;
            TopMost = true;
            ShowInTaskbar = false;
            BackColor = Color.FromArgb(17, 24, 39);
            DoubleBuffered = true;
        }

        protected override bool ShowWithoutActivation
        {
            get { return true; }
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            Bounds = screen.Bounds;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            float px = Math.Max(16, ClientSize.Height / 28f);
            using (var font = new Font("Segoe UI", px, GraphicsUnit.Pixel))
            using (var brush = new SolidBrush(Color.FromArgb(203, 213, 225)))
            using (var fmt = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                e.Graphics.DrawString(
                    "Kalibrasyon başka bir ekranda sürüyor.\n" +
                    "Dokunmatik ekran bu ise bekleyin: birkaç saniye içinde buraya geçer.\n\n" +
                    "Esc: iptal",
                    font, brush, ClientRectangle, fmt);
            }
        }
    }
}
