using System;
using System.Collections.Generic;

namespace DokunmatikKalibrasyon
{
    internal enum Route
    {
        Target,  // seçili dokunmatikten geliyor: düzelt / yakala
        Other,   // başka cihazdan (normal fare): dokunma
        Deferred // henüz belli değil: bekletildi, WM_INPUT gelince karar verilecek
    }

    // Fare kancası olaylarının hangi cihazdan geldiğine karar verir. Windows kancayı
    // çoğu zaman aynı olayın WM_INPUT mesajından önce çağırdığı için:
    //  - son WM_INPUT çok yeniyse olay aynı cihazın devamı sayılır;
    //  - değilse olay bekletilir, ilk gelen WM_INPUT bekleyenlerin hepsinin cihazını belirler;
    //  - WM_INPUT hiç gelmezse zaman aşımında bekleyenler "başka cihaz" sayılır.
    // Olayların sırası her durumda korunur. Windows'a bağımlı değildir, test edilebilir.
    internal sealed class DeviceRouter<T>
    {
        private struct Item
        {
            public T Event;
            public int Tick;
        }

        private readonly List<Item> pending = new List<Item>();
        private readonly int continuityMs;
        private readonly int timeoutMs;
        private bool hasRaw;
        private bool lastIsTarget;
        private int lastTick;

        public DeviceRouter(int continuityMs, int timeoutMs)
        {
            this.continuityMs = continuityMs;
            this.timeoutMs = timeoutMs;
        }

        public int PendingCount
        {
            get { return pending.Count; }
        }

        public Route OnHook(T ev, int now)
        {
            if (pending.Count == 0 && hasRaw && unchecked(now - lastTick) <= continuityMs)
                return lastIsTarget ? Route.Target : Route.Other;
            pending.Add(new Item { Event = ev, Tick = now });
            return Route.Deferred;
        }

        // Bir WM_INPUT işlendi: cihazı artık biliniyor. Bekleyenler bu cihaza aittir.
        public void OnRaw(bool isTarget, int now, Action<T, bool> resolve)
        {
            hasRaw = true;
            lastIsTarget = isTarget;
            lastTick = now;
            Resolve(isTarget, resolve);
        }

        public void OnTimer(int now, Action<T, bool> resolve)
        {
            if (pending.Count > 0 && unchecked(now - pending[0].Tick) > timeoutMs)
                Resolve(false, resolve);
        }

        // Mod değişirken bekleyenleri son bilinen cihaza göre sonuçlandır.
        public void Flush(Action<T, bool> resolve)
        {
            Resolve(lastIsTarget, resolve);
        }

        private void Resolve(bool isTarget, Action<T, bool> resolve)
        {
            if (pending.Count == 0) return;
            Item[] items = pending.ToArray();
            pending.Clear();
            foreach (Item it in items) resolve(it.Event, isTarget);
        }
    }
}
