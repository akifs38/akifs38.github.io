// Kelime veritabanı
let wordDatabase = [];
let isLoading = true;

// Oyun durumu
let score = 0;
let wrongCount = 0;
let currentWordIndex = 0;
let usedWords = [];
let isCardFlipped = false;
let autoNextTimeout = null;

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

// JSON dosyasından kelimeleri yükle
async function loadWords() {
    try {
        const response = await fetch('words.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // JSON formatını kontrol et ve uygun şekilde işle
        if (Array.isArray(data)) {
            // Direkt array formatı: [{"tr": "...", "en": "..."}]
            wordDatabase = data.map(item => ({
                english: item.en,
                turkish: item.tr
            }));
        } else if (data.words && Array.isArray(data.words)) {
            // words array'i içinde: {"words": [{"tr": "...", "en": "..."}]}
            wordDatabase = data.words.map(item => ({
                english: item.en,
                turkish: item.tr
            }));
        } else {
            throw new Error('Geçersiz JSON formatı');
        }
        
        if (wordDatabase.length === 0) {
            throw new Error('JSON dosyasında kelime bulunamadı');
        }
        
        isLoading = false;
        
        // Butonları etkinleştir
        nextBtn.disabled = false;
        restartBtn.disabled = false;
        
        // Oyunu başlat
        initGame();
        
    } catch (error) {
        console.error('Kelimeler yüklenirken hata oluştu:', error);
        showError('Kelimeler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
}

// Hata mesajı göster
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <h3>Hata!</h3>
        <p>${message}</p>
        <p>words.json dosyasının doğru formatta olduğundan emin olun.</p>
        <p><strong>Örnek format:</strong></p>
        <pre>[
  {"tr": "haksız", "en": "unfair"},
  {"tr": "kelime", "en": "word"}
]</pre>
    `;
    
    document.body.insertBefore(errorDiv, optionsElement);
    optionsElement.innerHTML = '';
}

// Oyunu başlat
function initGame() {
    if (isLoading || wordDatabase.length === 0) return;
    
    score = 0;
    wrongCount = 0;
    currentWordIndex = 0;
    usedWords = [];
    updateScore();
    loadNewWord();
}

// Yeni kelime yükle
function loadNewWord() {
    if (isLoading || wordDatabase.length === 0) return;

    // Önceki timeout'u temizle
    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    // Tüm kelimeler kullanıldıysa oyunu bitir
    if (usedWords.length === wordDatabase.length) {
        endGame();
        return;
    }

    // Kullanılmamış rastgele bir kelime seç
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * wordDatabase.length);
    } while (usedWords.includes(randomIndex));
    
    currentWordIndex = randomIndex;
    usedWords.push(randomIndex);
    
    // İngilizce kelimeyi göster
    englishElement.textContent = wordDatabase[currentWordIndex].english;
    resultElement.textContent = wordDatabase[currentWordIndex].turkish;
    resultElement.className = 'back';
    
    // Kartı sıfırla
    postitElement.classList.remove('flipped');
    isCardFlipped = false;
    
    // Seçenekleri oluştur
    createOptions();
    
    // İlerleme çubuğunu güncelle
    updateProgressBar();
}

// Seçenekleri oluştur
function createOptions() {
    optionsElement.innerHTML = '';
    
    // Doğru cevabı içeren 4 seçenek oluştur
    const correctAnswer = wordDatabase[currentWordIndex].turkish;
    const options = [correctAnswer];
    
    // Yanlış seçenekler ekle
    while (options.length < 4 && options.length < wordDatabase.length) {
        const randomIndex = Math.floor(Math.random() * wordDatabase.length);
        const randomTurkish = wordDatabase[randomIndex].turkish;
        
        if (!options.includes(randomTurkish) && randomTurkish !== correctAnswer) {
            options.push(randomTurkish);
        }
    }
    
    // Seçenekleri karıştır
    shuffleArray(options);
    
    // Seçenekleri DOM'a ekle
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(option));
        optionsElement.appendChild(button);
    });
}

// Cevabı kontrol et
function checkAnswer(selectedAnswer) {
    const correctAnswer = wordDatabase[currentWordIndex].turkish;
    
    // Kartı çevir
    postitElement.classList.add('flipped');
    isCardFlipped = true;
    
    // Tüm seçenekleri devre dışı bırak
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach(button => {
        button.disabled = true;
        
        // Doğru cevabı yeşil, yanlış cevapları kırmızı yap
        if (button.textContent === correctAnswer) {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
        } else if (button.textContent === selectedAnswer && selectedAnswer !== correctAnswer) {
            button.style.backgroundColor = '#f44336';
            button.style.color = 'white';
        }
    });
    
    // Cevabı kontrol et
    if (selectedAnswer === correctAnswer) {
        // Doğru cevap
        score++;
        resultElement.className = 'back';
    } else {
        // Yanlış cevap
        wrongCount++;
        resultElement.className = 'back wrong';
    }
    
    updateScore();
    
    // 1.5 saniye sonra otomatik olarak bir sonraki kelimeye geç
    autoNextTimeout = setTimeout(() => {
        loadNewWord();
    }, 1500);
}

// Puanı güncelle
function updateScore() {
    scoreElement.textContent = score;
    wrongCountElement.textContent = wrongCount;
}

// İlerleme çubuğunu güncelle
function updateProgressBar() {
    const progress = (usedWords.length / wordDatabase.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Oyunu bitir
function endGame() {
    englishElement.textContent = "Oyun Bitti!";
    resultElement.textContent = `Sonuç: ${score} Doğru, ${wrongCount} Yanlış`;
    optionsElement.innerHTML = '<div class="loading">Oyun bitti! Yeniden başlatmak için "Yeniden Başlat" butonuna tıklayın.</div>';
    postitElement.classList.add('flipped');
    
    // Butonları devre dışı bırak
    nextBtn.disabled = true;
}

// Dizi karıştırma fonksiyonu
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Kart tıklama olayı
postitElement.addEventListener('click', () => {
    if (!isCardFlipped && !isLoading && wordDatabase.length > 0) {
        postitElement.classList.toggle('flipped');
        isCardFlipped = true;
    }
});

// Sonraki kelime butonu
nextBtn.addEventListener('click', loadNewWord);

// Yeniden başlat butonu
restartBtn.addEventListener('click', () => {
    // Timeout'u temizle
    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }
    
    nextBtn.disabled = false;
    initGame();
});

// Sayfa yüklendiğinde kelimeleri yükle
window.addEventListener('DOMContentLoaded', loadWords);
