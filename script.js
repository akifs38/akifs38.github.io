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
  },
  {
    quote: "The most difficult thing is the decision to act, the rest is merely tenacity.",
    author: "Amelia Earhart",
    turkish: "En zor şey harekete geçme kararıdır, geri kalan sadece azimdir."
  },
  {
    quote: "Every strike brings me closer to the next home run.",
    author: "Babe Ruth",
    turkish: "Her vuruş beni bir sonraki sayıya daha da yaklaştırır."
  },
  {
    quote: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon",
    turkish: "Hayat, siz başka planlar yapmakla meşgulken başınıza gelenlerdir."
  },
  {
    quote: "We become what we think about.",
    author: "Earl Nightingale",
    turkish: "Düşündüğümüz şey haline geliriz."
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
    turkish: "Zihin her şeydir. Ne düşünürseniz o olursunuz."
  },
  {
    quote: "An unexamined life is not worth living.",
    author: "Socrates",
    turkish: "Sorgulanmamış bir hayat yaşamaya değmez."
  },
  {
    quote: "Eighty percent of success is showing up.",
    author: "Woody Allen",
    turkish: "Başarının yüzde seksen'i ortaya çıkmaktır."
  }
];

// Sayfa yüklendiğinde verileri yükle
window.addEventListener('DOMContentLoaded', function() {
  console.log('Sayfa yüklendi, veriler yükleniyor...');
  loadData();
});

// Verileri yükle
async function loadData() {
  try {
    console.log('Veri yükleme başladı...');
    
    // Kelimeleri ve atasözlerini paralel yükle
    await Promise.all([loadWords(), loadProverbs()]);
    
    console.log('Veriler başarıyla yüklendi:', {
      kelimeler: wordDatabase.length,
      atasozleri: proverbDatabase.length
    });
    
    isLoading = false;
    nextBtn.disabled = false;
    restartBtn.disabled = false;
    
    initGame();
    
  } catch (error) {
    console.error('Veriler yüklenirken hata oluştu:', error);
    showError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
  }
}

// Kelimeleri yükle
async function loadWords() {
  try {
    console.log('Kelimeler yükleniyor...');
    const response = await fetch('words.json');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Kelimeler JSON alındı:', data);
      
      if (Array.isArray(data)) {
        wordDatabase = data.map(item => ({
          english: item.en,
          turkish: item.tr
        }));
      } else if (data.words && Array.isArray(data.words)) {
        wordDatabase = data.words.map(item => ({
          english: item.en,
          turkish: item.tr
        }));
      } else {
        throw new Error('Geçersiz JSON formatı');
      }
    } else {
      console.log('words.json bulunamadı, dahili kelimeler kullanılıyor');
      wordDatabase = builtInWords;
    }
    
    console.log('Kelimeler yüklendi:', wordDatabase.length);
    
  } catch (error) {
    console.error('Kelimeler yüklenirken hata:', error);
    wordDatabase = builtInWords;
    console.log('Dahili kelimeler kullanılıyor:', wordDatabase.length);
  }
}

// Atasözlerini yükle
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
    } else {
      console.log('proverbs.json bulunamadı, dahili atasözleri kullanılıyor');
      proverbDatabase = builtInProverbs;
    }
    
    console.log('Atasözleri yüklendi:', proverbDatabase.length);
    
  } catch (error) {
    console.error('Atasözleri yüklenirken hata:', error);
    proverbDatabase = builtInProverbs;
    console.log('Dahili atasözleri kullanılıyor:', proverbDatabase.length);
  } finally {
    // Zorluk seviyelerini her durumda ayarla
    setupDifficultyLevels();
  }
}

// Zorluk seviyelerini ayarla
function setupDifficultyLevels() {
  console.log('Zorluk seviyeleri ayarlanıyor...');
  
  // Kelimeler
  const totalWords = wordDatabase.length;
  difficultySettings.easy.words = wordDatabase.slice(0, Math.min(10, totalWords));
  difficultySettings.medium.words = wordDatabase.slice(0, Math.min(20, totalWords));
  difficultySettings.hard.words = wordDatabase;
  
  // Atasözleri
  const totalProverbs = proverbDatabase.length;
  difficultySettings.easy.proverbs = proverbDatabase.slice(0, Math.min(5, totalProverbs));
  difficultySettings.medium.proverbs = proverbDatabase.slice(0, Math.min(10, totalProverbs));
  difficultySettings.hard.proverbs = proverbDatabase;
  
  // Zaman sınırları
  difficultySettings.easy.time = 15;
  difficultySettings.medium.time = 10;
  difficultySettings.hard.time = 7;
  
  console.log('Zorluk seviyeleri ayarlandı:', {
    easy: { words: difficultySettings.easy.words.length, proverbs: difficultySettings.easy.proverbs.length },
    medium: { words: difficultySettings.medium.words.length, proverbs: difficultySettings.medium.proverbs.length },
    hard: { words: difficultySettings.hard.words.length, proverbs: difficultySettings.hard.proverbs.length }
  });
}

// Hata mesajı göster
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <h3>Hata!</h3>
    <p>${message}</p>
  `;
  
  document.querySelector('.container').insertBefore(errorDiv, wordGameElement);
}

// Oyunu başlat
function initGame() {
  console.log('Oyun başlatılıyor, mod:', currentMode);
  
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
    return;
  }

  clearTimeouts();
  clearInterval(timer);

  const currentWordPool = difficultySettings[currentDifficulty].words;
  console.log('Kelime havuzu:', currentWordPool.length, 'Kullanılan:', usedWords.length);
  
  if (usedWords.length === currentWordPool.length) {
    endGame();
    return;
  }

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * currentWordPool.length);
  } while (usedWords.includes(randomIndex));
  
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
  
  console.log('Kelime seçenekleri oluşturuldu:', options);
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
  } else {
    wrongCount++;
    resultElement.className = 'back wrong';
  }
  
  updateScore();
  
  autoNextTimeout = setTimeout(() => {
    loadNewWord();
  }, 1500);
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
  
  if (usedProverbs.length === currentProverbPool.length) {
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
  
  // Türkçe çeviriyi tam göster
  turkishTranslationElement.textContent = currentProverb.turkish;
  
  createProverbQuestion(currentProverb);
  updateProgressBar();
  startTimer();
  
  console.log('Yeni atasözü yüklendi:', currentProverb.quote);
}

// Atasözü sorusunu oluştur
function createProverbQuestion(currentProverb) {
  const englishWords = currentProverb.quote.split(' ');
  
  // Önemli bir kelimeyi seç (en az 4 harfli)
  let blankIndex;
  let attempts = 0;
  const maxAttempts = 20;
  
  do {
    blankIndex = Math.floor(Math.random() * englishWords.length);
    attempts++;
    
    const word = englishWords[blankIndex].replace(/[.,!?;']/g, '');
    const commonWords = ['the', 'and', 'is', 'to', 'of', 'a', 'in', 'it', 'you', 'that', 'for', 'with', 'on', 'but', 'be', 'are', 'as', 'at', 'this', 'by', 'from', 'have', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'when', 'we', 'there', 'can', 'an', 'your', 'which', 'their', 'said', 'if', 'will', 'each', 'tell', 'does', 'set', 'three', 'want', 'air', 'well', 'also', 'play', 'small', 'end', 'put', 'home', 'read', 'hand', 'port', 'large', 'spell', 'add', 'even', 'land', 'here', 'must', 'big', 'high', 'such', 'follow', 'act', 'why', 'ask', 'men', 'change', 'went', 'light', 'kind', 'off', 'need', 'house', 'picture', 'try', 'us', 'again', 'animal', 'point', 'mother', 'world', 'near', 'build', 'self', 'earth', 'father', 'any', 'new', 'work', 'part', 'take', 'get', 'place', 'made', 'live', 'where', 'after', 'back', 'little', 'only', 'round', 'man', 'year', 'came', 'show', 'every', 'good', 'me', 'give', 'our', 'under', 'name', 'very', 'through', 'just', 'form', 'sentence', 'great', 'think', 'say', 'help', 'low', 'line', 'differ', 'turn', 'cause', 'much', 'mean', 'before', 'move', 'right', 'boy', 'old', 'too', 'same', 'she', 'all', 'when', 'up', 'use', 'her', 'than', 'then'];
    
    if (word.length >= 4 && !commonWords.includes(word.toLowerCase()) && attempts > 10) {
      break;
    }
    
    // 20 denemeden sonra herhangi bir kelimeyi seç
    if (attempts >= maxAttempts) break;
    
  } while (englishWords[blankIndex].length < 3 || 
           /[.,!?;']/.test(englishWords[blankIndex]));

  const correctAnswer = englishWords[blankIndex].replace(/[.,!?;']/g, '');
  
  // Boşluklu İngilizce atasözünü oluştur
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
  
  // Seçenekleri oluştur
  createProverbOptions(correctAnswer, currentProverb);
  
  console.log('Atasözü sorusu oluşturuldu, boşluk:', correctAnswer);
}

// Atasözü seçeneklerini oluştur
function createProverbOptions(correctAnswer, currentProverb) {
  proverbOptionsElement.innerHTML = '';
  
  const options = [correctAnswer];
  
  // Yanlış seçenekler ekle
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
  
  // Eğer yeterli seçenek yoksa, rastgele kelimeler ekle
  const fallbackWords = ['success', 'life', 'mind', 'time', 'love', 'dream', 'future', 'past', 'moment', 'way', 'work', 'power', 'thought', 'heart', 'action', 'change', 'growth', 'truth', 'beauty', 'courage', 'wisdom', 'knowledge', 'freedom', 'peace', 'hope', 'faith', 'joy', 'patience', 'strength', 'victory'];
  
  while (options.length < 4) {
    const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    if (!usedWords.has(randomWord)) {
      options.push(randomWord);
      usedWords.add(randomWord);
    }
    
    // Sonsuz döngüyü önle
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
  
  console.log('Atasözü seçenekleri oluşturuldu:', options);
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
  
  // Doğru cevabı göster
  const englishWords = currentProverb.quote.split(' ');
  let blankIndex = -1;
  
  // Boşluklu kelimenin index'ini bul
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
  } else {
    wrongCount++;
  }
  
  updateScore();
  
  autoNextTimeout = setTimeout(() => {
    loadNewProverb();
  }, 2000);
}

// Puanı güncelle
function updateScore() {
  scoreElement.textContent = score;
  wrongCountElement.textContent = wrongCount;
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

// Oyun modunu değiştir
modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    currentMode = button.dataset.mode;
    
    // İlgili oyun içeriğini göster
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

// Kart tıklama olayı (sadece kelime oyunu için)
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