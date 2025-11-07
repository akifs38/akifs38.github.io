const imageCount = 10; // Foto sayısı
const imageFolder = "images/images1"; // Klasör yolu

for (let i = 1; i <= imageCount; i++) {
  const img = document.createElement("img");
  img.src = `${imageFolder}/${i}.png`; // png veya jpg
  img.classList.add("cloud-img");

  // Rastgele konum
  img.style.left = Math.random() * 80 + "vw";
  img.style.top = Math.random() * 80 + "vh";
  img.style.width = (50 + Math.random() * 50) + "px";
  img.style.height = img.style.width;

  document.body.appendChild(img);
}
