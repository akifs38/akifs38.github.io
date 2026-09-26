using System;
using System.Drawing;
using System.Globalization;

namespace DokunmatikKalibrasyon
{
    // Dokunmatiğin bildirdiği noktayı (x, y) ekrandaki gerçek noktaya çeviren
    // afin dönüşüm:
    //     X = A*x + B*y + C
    //     Y = D*x + E*y + F
    // Kaydırma, ölçek, eksen ters çevirme, X/Y yer değiştirme ve hafif dönme
    // hatalarının hepsini tek seferde düzeltir.
    internal sealed class AffineTransform
    {
        public double A, B, C, D, E, F;

        public AffineTransform(double a, double b, double c, double d, double e, double f)
        {
            A = a; B = b; C = c; D = d; E = e; F = f;
        }

        public static AffineTransform Identity
        {
            get { return new AffineTransform(1, 0, 0, 0, 1, 0); }
        }

        public bool IsIdentity
        {
            get
            {
                const double eps = 1e-9;
                return Math.Abs(A - 1) < eps && Math.Abs(B) < eps && Math.Abs(C) < eps &&
                       Math.Abs(D) < eps && Math.Abs(E - 1) < eps && Math.Abs(F) < eps;
            }
        }

        public Point Apply(int x, int y)
        {
            double nx = A * x + B * y + C;
            double ny = D * x + E * y + F;
            return new Point((int)Math.Round(nx), (int)Math.Round(ny));
        }

        // En küçük kareler yöntemiyle en az 3 nokta çiftinden dönüşüm hesaplar.
        // Dönüşüm hesaplanamazsa (noktalar aynı doğru üzerindeyse vb.) null döner.
        public static AffineTransform Fit(PointF[] raw, PointF[] target, out double rmsError)
        {
            rmsError = double.NaN;
            if (raw == null || target == null || raw.Length != target.Length || raw.Length < 3)
                return null;

            // Sayısal kararlılık için ham noktaları ortalamaya göre merkezle.
            double mx = 0, my = 0;
            for (int i = 0; i < raw.Length; i++) { mx += raw[i].X; my += raw[i].Y; }
            mx /= raw.Length; my /= raw.Length;

            double sxx = 0, sxy = 0, syy = 0, sx = 0, sy = 0, n = raw.Length;
            double sxX = 0, syX = 0, sX = 0, sxY = 0, syY = 0, sY = 0;
            for (int i = 0; i < raw.Length; i++)
            {
                double x = raw[i].X - mx, y = raw[i].Y - my;
                double X = target[i].X, Y = target[i].Y;
                sxx += x * x; sxy += x * y; syy += y * y; sx += x; sy += y;
                sxX += x * X; syX += y * X; sX += X;
                sxY += x * Y; syY += y * Y; sY += Y;
            }

            double[,] m =
            {
                { sxx, sxy, sx },
                { sxy, syy, sy },
                { sx,  sy,  n  }
            };

            // Ham noktalar birbirine çok yakınsa (hepsi aynı yere dokunulmuşsa) reddet.
            double spread = Math.Sqrt((sxx + syy) / n);
            if (spread < 5) return null;

            double[] abc = Solve3(m, new[] { sxX, syX, sX });
            double[] def = Solve3(m, new[] { sxY, syY, sY });
            if (abc == null || def == null) return null;

            // Merkezlemeyi geri al: X = a(x-mx) + b(y-my) + c
            var t = new AffineTransform(
                abc[0], abc[1], abc[2] - abc[0] * mx - abc[1] * my,
                def[0], def[1], def[2] - def[0] * mx - def[1] * my);

            double det = t.A * t.E - t.B * t.D;
            if (Math.Abs(det) < 1e-6 || double.IsNaN(det) || double.IsInfinity(det)) return null;

            double sum = 0;
            for (int i = 0; i < raw.Length; i++)
            {
                double px = t.A * raw[i].X + t.B * raw[i].Y + t.C;
                double py = t.D * raw[i].X + t.E * raw[i].Y + t.F;
                double dx = px - target[i].X, dy = py - target[i].Y;
                sum += dx * dx + dy * dy;
            }
            rmsError = Math.Sqrt(sum / raw.Length);
            return t;
        }

        // Kısmi pivotlamalı Gauss eliminasyonu ile 3x3 sistem çözümü.
        private static double[] Solve3(double[,] matrix, double[] rhs)
        {
            double[,] a = new double[3, 4];
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++) a[r, c] = matrix[r, c];
                a[r, 3] = rhs[r];
            }

            for (int col = 0; col < 3; col++)
            {
                int pivot = col;
                for (int r = col + 1; r < 3; r++)
                    if (Math.Abs(a[r, col]) > Math.Abs(a[pivot, col])) pivot = r;
                if (Math.Abs(a[pivot, col]) < 1e-12) return null;
                if (pivot != col)
                    for (int c = 0; c < 4; c++) { double tmp = a[col, c]; a[col, c] = a[pivot, c]; a[pivot, c] = tmp; }

                for (int r = 0; r < 3; r++)
                {
                    if (r == col) continue;
                    double factor = a[r, col] / a[col, col];
                    for (int c = col; c < 4; c++) a[r, c] -= factor * a[col, c];
                }
            }

            return new[] { a[0, 3] / a[0, 0], a[1, 3] / a[1, 1], a[2, 3] / a[2, 2] };
        }

        public string Serialize()
        {
            CultureInfo ci = CultureInfo.InvariantCulture;
            return string.Join(";", new[]
            {
                A.ToString("R", ci), B.ToString("R", ci), C.ToString("R", ci),
                D.ToString("R", ci), E.ToString("R", ci), F.ToString("R", ci)
            });
        }

        public static AffineTransform Parse(string s)
        {
            if (string.IsNullOrEmpty(s)) return null;
            string[] parts = s.Split(';');
            if (parts.Length != 6) return null;
            double[] v = new double[6];
            for (int i = 0; i < 6; i++)
            {
                if (!double.TryParse(parts[i], NumberStyles.Float, CultureInfo.InvariantCulture, out v[i]))
                    return null;
                if (double.IsNaN(v[i]) || double.IsInfinity(v[i])) return null;
            }
            return new AffineTransform(v[0], v[1], v[2], v[3], v[4], v[5]);
        }

        public override string ToString()
        {
            return string.Format(CultureInfo.InvariantCulture,
                "X = {0:0.0000}·x {1:+0.0000;-0.0000}·y {2:+0.0;-0.0}   Y = {3:0.0000}·x {4:+0.0000;-0.0000}·y {5:+0.0;-0.0}",
                A, B, C, D, E, F);
        }
    }
}
