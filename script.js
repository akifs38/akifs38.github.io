let words = [];
let score = 0;
let wrongCount = 0;
let currentWord = null;

const scoreDisplay = document.getElementById("score");
const wrongDisplay = document.getElementById("wrongCount");
const postit = document.getElementById("postit");
const english = document.getElementById("english");
const result = document.getElementById("result");
const optionsContainer = document.getElementById("options");

// JSON'dan kelimeleri yükle
fetch("words.json")
  .then(res => res.json())
  .then(data => {
    words = data;
    newWord();
  })
  .catch(err => console.error("Kelime listesi yüklenemedi:", err));

function newWord() {
  postit.classList.remove("flipped");
  result.textContent = "";
  result.classList.remove("correct", "wrong");

  currentWord = words[Math.floor(Math.random() * words.length)];
  english.textContent = currentWord.en;

  // 3 yanlış seçenek (toplam 4 seçenek)
  let wrongOptions = words
    .filter(w => w.tr !== currentWord.tr)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  const allOptions = [currentWord.tr, ...wrongOptions.map(w => w.tr)].sort(() => 0.5 - Math.random());

  optionsContainer.innerHTML = "";
  allOptions.forEach(opt => {
    const button = document.createElement("button");
    button.textContent = opt;
    button.classList.add("option");
    button.addEventListener("click", () => checkAnswer(opt, button));
    optionsContainer.appendChild(button);
  });
}

function checkAnswer(answer, button) {
  postit.classList.add("flipped");
  optionsContainer.querySelectorAll("button").forEach(b => b.disabled = true);

  setTimeout(() => {
    if (answer === currentWord.tr) {
      result.textContent = "Doğru ✅";
      result.classList.add("correct");
      button.classList.add("correct");
      score++;
    } else {
      result.textContent = `Yanlış ❌ (${currentWord.tr})`;
      result.classList.add("wrong");
      button.classList.add("wrong");
      wrongCount++;

      optionsContainer.querySelectorAll("button").forEach(b => {
        if(b.textContent === currentWord.tr){
          b.classList.add("correct");
        }
      });
    }

    scoreDisplay.textContent = score;
    wrongDisplay.textContent = wrongCount;

    setTimeout(newWord, 1500);
  }, 300);
}
