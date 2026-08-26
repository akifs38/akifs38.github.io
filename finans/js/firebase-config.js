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
  apiKey: 'AIzaSyAc3rcGF9u0o4NR_ZAREOh_bl0sAlMeJWo',
  authDomain: 'finans-69ad2.firebaseapp.com',
  databaseURL: '', // ⬅️ Realtime Database sayfasının üstündeki https://... adresini buraya gir
  projectId: 'finans-69ad2',
  storageBucket: 'finans-69ad2.firebasestorage.app',
  messagingSenderId: '590835899154',
  appId: '1:590835899154:web:2707617ddc83ce893db1cb',
};

export function isConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.appId);
}
