// cloud.js — Firebase Auth + Firestore ile bulut senkronizasyon katmanı.
// Firebase yapılandırılmadıysa devre dışı kalır; uygulama yerel moda düşer.

import { firebaseConfig, isConfigured } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

export const cloud = {
  enabled: isConfigured(),
  ready: false,
  _auth: null,
  _db: null,
  fn: {},
};

// Firebase SDK'yı (yalnızca yapılandırıldıysa) dinamik olarak yükle ve başlat
export async function initCloud() {
  if (!cloud.enabled) return false;
  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-database.js`),
  ]);
  const app = appMod.initializeApp(firebaseConfig);
  cloud._auth = authMod.getAuth(app);
  cloud._db = dbMod.getDatabase(app);
  cloud.fn = { ...authMod, ...dbMod };
  try { await authMod.setPersistence(cloud._auth, authMod.browserLocalPersistence); } catch (e) { /* yoksay */ }
  cloud.ready = true;
  return true;
}

export function onAuth(cb) {
  return cloud.fn.onAuthStateChanged(cloud._auth, cb);
}

export async function signUp(name, email, password) {
  const cred = await cloud.fn.createUserWithEmailAndPassword(cloud._auth, email.trim(), password);
  if (name) { try { await cloud.fn.updateProfile(cred.user, { displayName: name }); } catch (e) { /* yoksay */ } }
  return cred.user;
}

export async function signIn(email, password) {
  const cred = await cloud.fn.signInWithEmailAndPassword(cloud._auth, email.trim(), password);
  return cred.user;
}

// Google ile giriş — mobilde popup engellenirse yönlendirmeye düşer
export async function signInWithGoogle() {
  const provider = new cloud.fn.GoogleAuthProvider();
  try {
    const cred = await cloud.fn.signInWithPopup(cloud._auth, provider);
    return cred.user;
  } catch (err) {
    if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/operation-not-supported-in-this-environment')) {
      await cloud.fn.signInWithRedirect(cloud._auth, provider);
      return null;
    }
    throw err;
  }
}

export async function signOutCloud() {
  return cloud.fn.signOut(cloud._auth);
}

// Şifre değiştir: önce eski şifreyle yeniden kimlik doğrula, sonra güncelle
export async function changePasswordCloud(oldPass, newPass) {
  const user = cloud._auth.currentUser;
  if (!user) throw new Error('Oturum bulunamadı.');
  const cred = cloud.fn.EmailAuthProvider.credential(user.email, oldPass);
  await cloud.fn.reauthenticateWithCredential(user, cred);
  await cloud.fn.updatePassword(user, newPass);
}

function dataRef(uid) {
  return cloud.fn.ref(cloud._db, `finance/${uid}`);
}

// Realtime Database'de tüm veriyi tek bir JSON string olarak sakla (tip kısıtı olmaz)
export async function loadData(uid) {
  const snap = await cloud.fn.get(dataRef(uid));
  return snap.exists() ? (snap.val().json || null) : null;
}

export async function saveData(uid, dataObj) {
  return cloud.fn.set(dataRef(uid), { json: JSON.stringify(dataObj), updatedAt: Date.now() });
}

// Gerçek zamanlı dinleme; cb(json)
export function subscribe(uid, cb) {
  return cloud.fn.onValue(dataRef(uid), (snap) => {
    if (!snap.exists()) return;
    cb(snap.val().json || null);
  }, (err) => console.error('Realtime DB dinleme hatası', err));
}

// Firebase hata kodlarını Türkçe mesaja çevir
export function cloudErrorMessage(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
    'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter).',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/user-not-found': 'Kullanıcı bulunamadı.',
    'auth/too-many-requests': 'Çok fazla deneme. Bir süre sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    'auth/requires-recent-login': 'Bu işlem için tekrar giriş yapmanız gerekiyor.',
  };
  return map[code] || (err && err.message) || 'Bir hata oluştu.';
}
