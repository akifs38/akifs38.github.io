// firebase-config.js — Bulut senkronizasyonu yapılandırması.
//
// Cihazlar arası otomatik senkron için buraya kendi Firebase projenizin
// değerlerini girin (Firebase Console → Proje ayarları → Web uygulaması).
// Bu değerler gizli değildir (istemci tarafı tanımlayıcılardır); güvenlik
// Firestore kuralları + Authentication ile sağlanır.
//
// BOŞ bırakılırsa uygulama YEREL modda (tek cihaz, localStorage) çalışır.
//
// Kurulum adımları için README.md → "Bulut Senkronizasyonu" bölümüne bakın.

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '', // Realtime Database URL — örn. https://PROJE-default-rtdb.firebaseio.com
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export function isConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.appId);
}
