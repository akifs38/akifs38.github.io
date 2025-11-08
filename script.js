import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from './firebase-config.js';

// Kelime ve atasözü veritabanları
let wordDatabase = [];
let proverbDatabase = [];
let isLoading = true;

// Oyun durumu
let score = 0;
let wrongCount = 0;
let currentWordIndex = 0;
let currentProverbIndex = 0;
let usedWords = [];
let usedProverbs = [];
let isCardFlipped = false;
let autoNextTimeout = null;
let timer = null;
let timeLeft = 15;
let currentDifficulty = 'easy';
let currentMode = 'word';

// Firebase durumu
let currentUser = null;
let userScores = [];
let chatMessages = [];

// Zorluk seviyeleri
const difficultySettings = {
  easy: { time: 15, words: [], proverbs: [] },
  medium: { time: 10, words: [], proverbs: [] },
  hard: { time: 7, words: [], proverbs: [] }
};

// DOM elementleri
const scoreElement = document.getElementById('score');
const wrongCountElement = document.getElementById('wrongCount');
const englishElement = document.getElementById('english');
const resultElement = document.getElementById('result');
const optionsElement = document.getElementById('options');
const postitElement = document.getElementById('postit');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const progressBar = document.getElementById('progressBar');
const timerElement = document.getElementById('timer');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const wordGameElement = document.getElementById('wordGame');
const proverbGameElement = document.getElementById('proverbGame');
const proverbTextElement = document.getElementById('proverbText');
const proverbAuthorElement = document.getElementById('proverbAuthor');
const turkishTranslationElement = document.getElementById('turkishTranslation');
const blankProverbElement = document.getElementById('blankProverb');
const proverbOptionsElement = document.getElementById('proverbOptions');

// Firebase DOM elementleri
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const scoreboard = document.getElementById('scoreboard');
const chatMessagesElement = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// Dahili kelime veritabanı
const builtInWords = [
  { english: "unfair", turkish: "haksız" },
  { english: "word", turkish: "kelime" },
  { english: "develop", turkish: "geliştirmek" },
  { english: "programming", turkish: "programlama" },
  { english: "learn", turkish: "öğrenmek" },
  { english: "application", turkish: "uygulama" },
  { english: "interface", turkish: "arayüz" },
  { english: "database", turkish: "veritabanı" },
  { english: "server", turkish: "sunucu" },
  { english: "client", turkish: "istemci" }
];

// Dahili atasözü veritabanı
const builtInProverbs = [
  {
    quote: "Life isn't about getting and having, it's about giving and being.",
    author: "Kevin Kruse",
    turkish: "Hayat almak ve sahip olmakla ilgili değildir, vermek ve olmakla ilgilidir."
  },
  {
    quote: "Whatever the mind of man can conceive and believe, it can achieve.",
    author: "Napoleon Hill",
    turkish: "İnsan aklının kavrayabildiği ve inanabildiği her şeyi başarabilir."
  },
  {
    quote: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
    turkish: "Başarılı olmak için değil, değerli olmak için çaba gösterin."
  }
];

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', function() {
  console.log('Sayfa yüklendi, Firebase ve veriler yükleniyor...');
  initAuth();
  loadData();
});

// ==================== FIREBASE FONKSİYONLARI ====================

// Firebase Authentication başlatma
function initAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      showUserInfo(user);
      enableChat();
      loadScoreboard();
      loadChatMessages();
      console.log('Kullanıcı giriş yaptı:', user.displayName);
    } else {
      currentUser = null;
      showLoginButton();
      disableChat();
      console.log('Kullanıcı çıkış yaptı');
    }
  });
}

// Kullanıcı bilgilerini göster
function showUserInfo(user) {
  userInfo.style.display = 'flex';
  loginBtn.style.display = 'none';
  
  userName.textContent = user.displayName || 'Kullanıcı';
  userPhoto.src = user.photoURL || 'https://via.placeholder.com/40/4CAF50/white?text=U';
  userPhoto.alt = user.displayName || 'Kullanıcı';
}

// Giriş butonunu göster
function showLoginButton() {
  userInfo.style.display = 'none';
  loginBtn.style.display = 'block';
}

// Google ile giriş
loginBtn.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Giriş başarılı:', result.user);
  } catch (error) {
    console.error('Giriş hatası:', error);
    alert('Giriş sırasında hata oluştu: ' + error.message);
  }
});

// Çıkış
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    console.log('Çıkış başarılı');
  } catch (error) {
    console.error('Çıkış hatası:', error);
  }
});

// Sohbeti etkinleştir
function enableChat() {
  chatInput.disabled = false;
  sendBtn.disabled = false;
  chatInput.placeholder = 'Mesajınızı yazın...';
}

// Sohbeti devre dışı bırak
function disableChat() {
  chatInput.disabled = true;
  sendBtn.disabled = true;
  chatInput.placeholder = 'Sohbet için giriş yapın...';
}

// Skor tablosunu yükle
function loadScoreboard() {
  const q = query(
    collection(db, 'scores'),
    orderBy('score', 'desc'),
    limit(10)
  );

  onSnapshot(q, (snapshot) => {
    userScores = [];
    scoreboard.innerHTML = '';
    
    if (snapshot.empty) {
      scoreboard.innerHTML = '<div class="loading">Henüz skor bulunmuyor</div>';
      return;
    }
    
    snapshot.forEach((doc) => {
      const scoreData = doc.data();
      userScores.push(scoreData);
      
      const scoreItem = document.createElement('div');
      scoreItem.className = 'score-item';
      scoreItem.innerHTML = `
        <div class="score-user">
          <img src="${scoreData.photoURL || 'https://via.placeholder.com/30/4CAF50/white?text=U'}" 
               alt="${scoreData.displayName}" class="score-avatar">
          <span>${scoreData.displayName}</span>
        </div>
        <div class="score-value">${scoreData.score}</div>
      `;
      
      scoreboard.appendChild(scoreItem);
    });
  }, (error) => {
    console.error('Skor tablosu yüklenirken hata:', error);
    scoreboard.innerHTML = '<div class="error">Skorlar yüklenemedi</div>';
  });
}

// Sohbet mesajlarını yükle
function loadChatMessages() {
  const q = query(
    collection(db, 'chat'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  onSnapshot(q, (snapshot) => {
    chatMessages = [];
    const messages = [];
    
    snapshot.forEach((doc) => {
      const messageData = doc.data();
      chatMessages.push(messageData);
      messages.push(messageData);
    });
    
    messages.reverse();
    displayChatMessages(messages);
  }, (error) => {
    console.error('Sohbet mesajları yüklenirken hata:', error);
    chatMessagesElement.innerHTML = '<div class="error">Sohbet yüklenemedi</div>';
  });
}

// Sohbet mesajlarını göster
function displayChatMessages(messages) {
  chatMessagesElement.innerHTML = '';
  
  if (messages.length === 0) {
    chatMessagesElement.innerHTML = '<div class="loading">Henüz mesaj yok</div>';
    return;
  }
  
  messages.forEach((message) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const time = message.timestamp ? 
      new Date(message.timestamp.toDate()).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Şimdi';
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-user">${message.displayName}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${message.text}</div>
    `;
    
    chatMessagesElement.appendChild(messageElement);
  });
  
  chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

// Mesaj gönder
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

async function sendMessage() {
  const messageText = chatInput.value.trim();
  
  if (!messageText || !currentUser) {
    return;
  }
  
  if (messageText.length > 500) {
    alert('Mesaj çok uzun! Maksimum 500 karakter.');
    return;
  }
  
  const messageData = {
    text: messageText,
    displayName: currentUser.displayName,
    photoURL: currentUser.photoURL,
    userId: currentUser.uid,
    timestamp: serverTimestamp()
  };
  
  try {
    await addDoc(collection(db, 'chat'), messageData);
    chatInput.value = '';
    console.log('Mesaj gönderildi');
  } catch (error) {
    console.error('Mesaj gönderilirken hata:', error);
    alert('Mesaj gönderilemedi: ' + error.message);
  }
}

// Skor güncelleme
async function updateUserScore() {
  if (!currentUser) return;
  
  const userScoreRef = doc(db, 'scores', currentUser.uid);
  
  try {
    const docSnap = await getDoc(userScoreRef);
    
    if (docSnap.exists()) {
      const currentScore = docSnap.data().score;
      if (score > currentScore) {
        await updateDoc(userScoreRef, {
          score: score,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastUpdated: serverTimestamp()
        });
        console.log('Skor güncellendi:', score);
      }
    } else {
      await setDoc(userScoreRef, {
        score: score,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      console.log('Yeni skor eklendi:', score);
    }
  } catch (error) {
    console.error('Skor güncellenirken hata:', error);
  }
}

// ==================== OYUN FONKSİYONLARI ====================

async function loadData() {
  try {
    console.log('Veri yükleme başladı...');
    await Promise.all([loadWords(), loadProverbs()]);
    
    console.log('Veriler başarıyla yüklendi:', {
      kelimeler: wordDatabase.length,
      atasozleri: proverbDatabase.length
    });
    
    setupDifficultyLevels();
    
    isLoading = false;
    nextBtn.disabled = false;
    restartBtn.disabled = false;
    
    initGame();
    
  } catch (error) {
    console.error('Veriler yüklenirken hata oluştu:', error);
    
    // Hata durumunda dahili verileri kullan
    wordDatabase = builtInWords;
    proverbDatabase = builtInProverbs;
    setupDifficultyLevels();
    
    isLoading = false;
    nextBtn.disabled = false;
    restartBtn.disabled = false;
    
    initGame();
  }
}

async function loadWords() {
  try {
    console.log('Kelimeler yükleniyor...');
    const response = await fetch('words.json');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Kelimeler JSON alındı - İlk öğe:', data[0]);
      
      if (Array.isArray(data)) {
        wordDatabase = data.map(item => ({
          english: item.en,
          turkish: item.tr
        }));
        
        console.log('Kelimeler başarıyla işlendi:', wordDatabase.length);
        
      } else {
        throw new Error('Geçersiz JSON formatı - array bekleniyor');
      }
      
    } else {
      console.log('words.json bulunamadı, dahili kelimeler kullanılıyor');
      wordDatabase = builtInWords;
    }
    
  } catch (error) {
    console.error('Kelimeler yüklenirken hata:', error);
    wordDatabase = builtInWords;
  }
}

async function loadProverbs() {
  try {
    console.log('Atasözleri yükleniyor...');
    const response = await fetch('proverbs.json');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Atasözleri JSON alındı:', data);
      
      if (Array.isArray(data)) {
        proverbDatabase = data;
      } else if (data.proverbs && Array.isArray(data.proverbs)) {
        proverbDatabase = data.proverbs;
      } else {
        throw new Error('Geçersiz JSON formatı');
      }
      
      console.log('Atasözleri yüklendi:', proverbDatabase.length);
      
    } else {
      console.log('proverbs.json bulunamadı, dahili atasözleri kullanılıyor');
      proverbDatabase = builtInProverbs;
    }
    
  } catch (error) {
    console.error('Atasözleri yüklenirken hata:', error);
    proverbDatabase = builtInProverbs;
  }
}

function setupDifficultyLevels() {
  console.log('Zorluk seviyeleri ayarlanıyor...');
  console.log('Toplam kelimeler:', wordDatabase.length, 'Toplam atasözleri:', proverbDatabase.length);
  
  // Kelimeleri zorluk seviyelerine göre ayır
  const totalWords = wordDatabase.length;
  
  if (totalWords > 0) {
    difficultySettings.easy.words = wordDatabase.slice(0, Math.min(20, totalWords));
    difficultySettings.medium.words = wordDatabase.slice(0, Math.min(50, totalWords));
    difficultySettings.hard.words = wordDatabase;
  } else {
    console.error('Kelime veritabanı boş!');
    difficultySettings.easy.words = builtInWords;
    difficultySettings.medium.words = builtInWords;
    difficultySettings.hard.words = builtInWords;
  }
  
  // Atasözlerini zorluk seviyelerine göre ayır
  const totalProverbs = proverbDatabase.length;
  
  if (totalProverbs > 0) {
    difficultySettings.easy.proverbs = proverbDatabase.slice(0, Math.min(5, totalProverbs));
    difficultySettings.medium.proverbs = proverbDatabase.slice(0, Math.min(10, totalProverbs));
    difficultySettings.hard.proverbs = proverbDatabase;
  } else {
    console.error('Atasözü veritabanı boş!');
    difficultySettings.easy.proverbs = builtInProverbs;
    difficultySettings.medium.proverbs = builtInProverbs;
    difficultySettings.hard.proverbs = builtInProverbs;
  }
  
  // Zaman sınırlarını ayarla
  difficultySettings.easy.time = 15;
  difficultySettings.medium.time = 10;
  difficultySettings.hard.time = 7;
  
  console.log('Zorluk seviyeleri ayarlandı:', {
    easy: { 
      words: difficultySettings.easy.words.length, 
      proverbs: difficultySettings.easy.proverbs.length
    },
    medium: { 
      words: difficultySettings.medium.words.length, 
      proverbs: difficultySettings.medium.proverbs.length
    },
    hard: { 
      words: difficultySettings.hard.words.length, 
      proverbs: difficultySettings.hard.proverbs.length
    }
  });
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <h3>Hata!</h3>
    <p>${message}</p>
  `;
  
  document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.main-content'));
}

function initGame() {
  console.log('Oyun başlatılıyor, mod:', currentMode);
  console.log('Mevcut zorluk seviyesi:', currentDifficulty);
  console.log('Kolay seviye kelimeler:', difficultySettings.easy.words.length);
  
  // Veritabanı kontrolü
  if ((currentMode === 'word' && wordDatabase.length === 0) || 
      (currentMode === 'proverb' && proverbDatabase.length === 0)) {
    console.error('Veritabanı boş!');
    showError('Kelime veya atasözü veritabanı yüklenemedi. Lütfen sayfayı yenileyin.');
    return;
  }
  
  score = 0;
  wrongCount = 0;
  currentWordIndex = 0;
  currentProverbIndex = 0;
  usedWords = [];
  usedProverbs = [];
  updateScore();
  
  if (currentMode === 'word') {
    loadNewWord();
  } else {
    loadNewProverb();
  }
}

// Puanı güncelle
function updateScore() {
  scoreElement.textContent = score;
  wrongCountElement.textContent = wrongCount;
}

// Zamanlayıcıyı başlat
function startTimer() {
  clearInterval(timer);
  timeLeft = difficultySettings[currentDifficulty].time;
  updateTimerDisplay();
  
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeUp();
    }
  }, 1000);
}

// Zamanlayıcıyı güncelle
function updateTimerDisplay() {
  timerElement.textContent = timeLeft;
  timerElement.style.color = timeLeft <= 5 ? '#ff5252' : 'white';
}

// Zaman dolduğunda
function handleTimeUp() {
  wrongCount++;
  updateScore();
  
  if (currentMode === 'word') {
    postitElement.classList.add('flipped');
    isCardFlipped = true;
    resultElement.className = 'back wrong';
    resultElement.textContent = 'Süre doldu!';
    
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach(button => {
      button.disabled = true;
    });
  } else {
    blankProverbElement.innerHTML = 'Süre doldu!';
    
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach(button => {
      button.disabled = true;
    });
  }
  
  autoNextTimeout = setTimeout(() => {
    if (currentMode === 'word') {
      loadNewWord();
    } else {
      loadNewProverb();
    }
  }, 1500);
}

// Yeni kelime yükle
function loadNewWord() {
  if (isLoading || wordDatabase.length === 0) {
    console.log('Kelimeler yüklenmedi veya boş');
    englishElement.textContent = "Kelimeler yükleniyor...";
    return;
  }

  clearTimeouts();
  clearInterval(timer);

  const currentWordPool = difficultySettings[currentDifficulty].words;
  console.log('Kelime havuzu:', currentWordPool.length, 'Kullanılan:', usedWords.length, 'Zorluk:', currentDifficulty);
  
  if (currentWordPool.length === 0) {
    console.error('Kelime havuzu boş!');
    englishElement.textContent = "Kelime havuzu boş";
    optionsElement.innerHTML = '<div class="loading">Kelime havuzu boş. Lütfen sayfayı yenileyin.</div>';
    return;
  }
  
  if (usedWords.length >= currentWordPool.length) {
    console.log('Tüm kelimeler kullanıldı, oyun bitiyor...');
    endGame();
    return;
  }

  let randomIndex;
  let attempts = 0;
  const maxAttempts = 50;
  
  do {
    randomIndex = Math.floor(Math.random() * currentWordPool.length);
    attempts++;
    
    if (attempts >= maxAttempts) {
      for (let i = 0; i < currentWordPool.length; i++) {
        if (!usedWords.includes(i)) {
          randomIndex = i;
          break;
        }
      }
      break;
    }
  } while (usedWords.includes(randomIndex) && attempts < maxAttempts);
  
  currentWordIndex = randomIndex;
  usedWords.push(randomIndex);
  
  englishElement.textContent = currentWordPool[currentWordIndex].english;
  resultElement.textContent = currentWordPool[currentWordIndex].turkish;
  resultElement.className = 'back';
  
  postitElement.classList.remove('flipped');
  isCardFlipped = false;
  
  createWordOptions();
  updateProgressBar();
  startTimer();
  
  console.log('Yeni kelime yüklendi:', currentWordPool[currentWordIndex].english);
}

// Kelime seçeneklerini oluştur
function createWordOptions() {
  optionsElement.innerHTML = '';
  
  const currentWordPool = difficultySettings[currentDifficulty].words;
  const correctAnswer = currentWordPool[currentWordIndex].turkish;
  const options = [correctAnswer];
  
  while (options.length < 4 && options.length < currentWordPool.length) {
    const randomIndex = Math.floor(Math.random() * currentWordPool.length);
    const randomTurkish = currentWordPool[randomIndex].turkish;
    
    if (!options.includes(randomTurkish) && randomTurkish !== correctAnswer) {
      options.push(randomTurkish);
    }
  }
  
  shuffleArray(options);
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option';
    button.textContent = option;
    button.addEventListener('click', () => checkWordAnswer(option));
    optionsElement.appendChild(button);
  });
}

// Kelime cevabını kontrol et
function checkWordAnswer(selectedAnswer) {
  clearInterval(timer);
  
  const currentWordPool = difficultySettings[currentDifficulty].words;
  const correctAnswer = currentWordPool[currentWordIndex].turkish;
  
  postitElement.classList.add('flipped');
  isCardFlipped = true;
  
  const optionButtons = document.querySelectorAll('.option');
  optionButtons.forEach(button => {
    button.disabled = true;
    
    if (button.textContent === correctAnswer) {
      button.style.backgroundColor = '#4CAF50';
      button.style.color = 'white';
    } else if (button.textContent === selectedAnswer && selectedAnswer !== correctAnswer) {
      button.style.backgroundColor = '#f44336';
      button.style.color = 'white';
    }
  });
  
  if (selectedAnswer === correctAnswer) {
    score++;
    resultElement.className = 'back';
    
    if (currentUser) {
      sendGameMessage('correct');
    }
  } else {
    wrongCount++;
    resultElement.className = 'back wrong';
  }
  
  updateScore();
  
  autoNextTimeout = setTimeout(() => {
    loadNewWord();
  }, 1500);
}

// Oyun mesajı gönder
async function sendGameMessage(type) {
  if (!currentUser) return;
  
  const messages = {
    correct: [
      `Harika! "${englishElement.textContent}" kelimesini bildim! 🎯`,
      `Doğru cevap! "${englishElement.textContent}" öğrendim! ✅`,
      `Mükemmel! "${englishElement.textContent}" kelimesini biliyorum! 🌟`
    ]
  };
  
  const randomMessage = messages[type][Math.floor(Math.random() * messages[type].length)];
  
  const messageData = {
    text: randomMessage,
    displayName: currentUser.displayName,
    photoURL: currentUser.photoURL,
    userId: currentUser.uid,
    timestamp: serverTimestamp(),
    isGameMessage: true
  };
  
  try {
    await addDoc(collection(db, 'chat'), messageData);
  } catch (error) {
    console.error('Oyun mesajı gönderilirken hata:', error);
  }
}

// Yeni atasözü yükle
function loadNewProverb() {
  if (isLoading || proverbDatabase.length === 0) {
    console.log('Atasözleri yüklenmedi veya boş');
    proverbOptionsElement.innerHTML = '<div class="loading">Atasözleri yüklenemedi. Lütfen sayfayı yenileyin.</div>';
    return;
  }

  clearTimeouts();
  clearInterval(timer);

  const currentProverbPool = difficultySettings[currentDifficulty].proverbs;
  console.log('Atasözü havuzu:', currentProverbPool.length, 'Kullanılan:', usedProverbs.length);
  
  if (usedProverbs.length >= currentProverbPool.length) {
    endGame();
    return;
  }

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * currentProverbPool.length);
  } while (usedProverbs.includes(randomIndex));
  
  currentProverbIndex = randomIndex;
  usedProverbs.push(randomIndex);
  
  const currentProverb = currentProverbPool[currentProverbIndex];
  
  turkishTranslationElement.textContent = currentProverb.turkish;
  
  createProverbQuestion(currentProverb);
  updateProgressBar();
  startTimer();
  
  console.log('Yeni atasözü yüklendi:', currentProverb.quote);
}

// Atasözü sorusunu oluştur
function createProverbQuestion(currentProverb) {
  const englishWords = currentProverb.quote.split(' ');
  
  let blankIndex;
  let attempts = 0;
  const maxAttempts = 20;
  
  do {
    blankIndex = Math.floor(Math.random() * englishWords.length);
    attempts++;
    
    const word = englishWords[blankIndex].replace(/[.,!?;']/g, '');
    const commonWords = ['the', 'and', 'is', 'to', 'of', 'a', 'in', 'it', 'you', 'that', 'for', 'with', 'on', 'but', 'be', 'are'];
    
    if (word.length >= 4 && !commonWords.includes(word.toLowerCase()) && attempts > 10) {
      break;
    }
    
    if (attempts >= maxAttempts) break;
    
  } while (englishWords[blankIndex].length < 3 || 
           /[.,!?;']/.test(englishWords[blankIndex]));

  const correctAnswer = englishWords[blankIndex].replace(/[.,!?;']/g, '');
  
  let blankProverbHTML = '';
  englishWords.forEach((word, index) => {
    if (index === blankIndex) {
      blankProverbHTML += `<span class="blank-word">_____</span> `;
    } else {
      blankProverbHTML += `${word} `;
    }
  });
  
  blankProverbElement.innerHTML = blankProverbHTML;
  proverbTextElement.textContent = `"${currentProverb.quote}"`;
  proverbAuthorElement.textContent = `- ${currentProverb.author}`;
  
  createProverbOptions(correctAnswer, currentProverb);
}

// Atasözü seçeneklerini oluştur
function createProverbOptions(correctAnswer, currentProverb) {
  proverbOptionsElement.innerHTML = '';
  
  const options = [correctAnswer];
  
  const usedWords = new Set([correctAnswer]);
  let attempts = 0;
  const maxAttempts = 50;
  
  while (options.length < 4 && attempts < maxAttempts) {
    const randomProverbIndex = Math.floor(Math.random() * proverbDatabase.length);
    const randomProverb = proverbDatabase[randomProverbIndex];
    const randomWords = randomProverb.quote.split(' ');
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)].replace(/[.,!?;']/g, '');
    
    if (!usedWords.has(randomWord) && 
        randomWord !== correctAnswer && 
        randomWord.length >= 3 &&
        !['the', 'and', 'is', 'to', 'of', 'a', 'in', 'it', 'you', 'that', 'for', 'with', 'on', 'but', 'be', 'are'].includes(randomWord.toLowerCase())) {
      options.push(randomWord);
      usedWords.add(randomWord);
    }
    
    attempts++;
  }
  
  const fallbackWords = ['success', 'life', 'mind', 'time', 'love', 'dream', 'future', 'past', 'moment', 'way', 'work', 'power', 'thought', 'heart', 'action', 'change', 'growth', 'truth', 'beauty', 'courage', 'wisdom', 'knowledge', 'freedom', 'peace', 'hope', 'faith', 'joy', 'patience', 'strength', 'victory'];
  
  while (options.length < 4) {
    const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    if (!usedWords.has(randomWord)) {
      options.push(randomWord);
      usedWords.add(randomWord);
    }
    
    if (options.length >= 4) break;
  }
  
  shuffleArray(options);
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option';
    button.textContent = option;
    button.addEventListener('click', () => checkProverbAnswer(option, correctAnswer, currentProverb));
    proverbOptionsElement.appendChild(button);
  });
}

// Atasözü cevabını kontrol et
function checkProverbAnswer(selectedAnswer, correctAnswer, currentProverb) {
  clearInterval(timer);
  
  const optionButtons = document.querySelectorAll('.option');
  optionButtons.forEach(button => {
    button.disabled = true;
    
    if (button.textContent === correctAnswer) {
      button.style.backgroundColor = '#4CAF50';
      button.style.color = 'white';
    } else if (button.textContent === selectedAnswer && selectedAnswer !== correctAnswer) {
      button.style.backgroundColor = '#f44336';
      button.style.color = 'white';
    }
  });
  
  const englishWords = currentProverb.quote.split(' ');
  let blankIndex = -1;
  
  for (let i = 0; i < englishWords.length; i++) {
    if (englishWords[i].replace(/[.,!?;']/g, '') === correctAnswer) {
      blankIndex = i;
      break;
    }
  }
  
  let solvedProverbHTML = '';
  englishWords.forEach((word, index) => {
    if (index === blankIndex) {
      solvedProverbHTML += `<span class="blank-word" style="background-color: ${selectedAnswer === correctAnswer ? '#4CAF50' : '#f44336'}; color: white;">${word}</span> `;
    } else {
      solvedProverbHTML += `${word} `;
    }
  });
  
  blankProverbElement.innerHTML = solvedProverbHTML;
  
  if (selectedAnswer === correctAnswer) {
    score++;
    if (currentUser) {
      sendGameMessage('correct');
    }
  } else {
    wrongCount++;
  }
  
  updateScore();
  
  autoNextTimeout = setTimeout(() => {
    loadNewProverb();
  }, 2000);
}

// İlerleme çubuğunu güncelle
function updateProgressBar() {
  let progress = 0;
  
  if (currentMode === 'word') {
    const currentWordPool = difficultySettings[currentDifficulty].words;
    progress = (usedWords.length / currentWordPool.length) * 100;
  } else {
    const currentProverbPool = difficultySettings[currentDifficulty].proverbs;
    progress = (usedProverbs.length / currentProverbPool.length) * 100;
  }
  
  progressBar.style.width = `${progress}%`;
}

// Oyunu bitir
function endGame() {
  if (currentMode === 'word') {
    englishElement.textContent = "Oyun Bitti!";
    resultElement.textContent = `Sonuç: ${score} Doğru, ${wrongCount} Yanlış`;
    optionsElement.innerHTML = '<div class="loading">Oyun bitti! Yeniden başlatmak için "Yeniden Başlat" butonuna tıklayın.</div>';
    postitElement.classList.add('flipped');
  } else {
    proverbTextElement.textContent = "Oyun Bitti!";
    proverbAuthorElement.textContent = "";
    turkishTranslationElement.textContent = `Sonuç: ${score} Doğru, ${wrongCount} Yanlış`;
    blankProverbElement.innerHTML = '';
    proverbOptionsElement.innerHTML = '<div class="loading">Oyun bitti! Yeniden başlatmak için "Yeniden Başlat" butonuna tıklayın.</div>';
  }
  
  clearInterval(timer);
  nextBtn.disabled = true;
  
  if (currentUser && score > 0) {
    updateUserScore();
    sendGameCompletionMessage();
  }
}

// Oyun tamamlama mesajı gönder
async function sendGameCompletionMessage() {
  if (!currentUser) return;
  
  const messageData = {
    text: `🎮 Oyunu tamamladım! ${score} doğru, ${wrongCount} yanlış. Skorum: ${score} 🏅`,
    displayName: currentUser.displayName,
    photoURL: currentUser.photoURL,
    userId: currentUser.uid,
    timestamp: serverTimestamp(),
    isGameMessage: true
  };
  
  try {
    await addDoc(collection(db, 'chat'), messageData);
  } catch (error) {
    console.error('Oyun bitiş mesajı gönderilirken hata:', error);
  }
}

// Timeout'ları temizle
function clearTimeouts() {
  if (autoNextTimeout) {
    clearTimeout(autoNextTimeout);
    autoNextTimeout = null;
  }
}

// Dizi karıştırma
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==================== EVENT LISTENER'LAR ====================

// Oyun modunu değiştir
modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    currentMode = button.dataset.mode;
    wordGameElement.classList.toggle('active', currentMode === 'word');
    proverbGameElement.classList.toggle('active', currentMode === 'proverb');
    
    restartGame();
  });
});

// Zorluk seviyesi değiştirme
difficultyButtons.forEach(button => {
  button.addEventListener('click', () => {
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    currentDifficulty = button.dataset.level;
    restartGame();
  });
});

// Oyunu yeniden başlat
function restartGame() {
  clearTimeouts();
  clearInterval(timer);
  nextBtn.disabled = false;
  initGame();
}

// Kart tıklama olayı
postitElement.addEventListener('click', () => {
  if (!isCardFlipped && !isLoading && wordDatabase.length > 0 && currentMode === 'word') {
    postitElement.classList.toggle('flipped');
    isCardFlipped = true;
  }
});

// Sonraki butonu
nextBtn.addEventListener('click', () => {
  if (currentMode === 'word') {
    loadNewWord();
  } else {
    loadNewProverb();
  }
});

// Yeniden başlat butonu
restartBtn.addEventListener('click', restartGame);
