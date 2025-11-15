const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePathLabel");
const textArea  = document.getElementById("fileContent");

// スライド切り替え用
let slides = [];
let currentIndex = 0;

// スライド表示
function showSlide(index) {
    const s = slides[index];
    slideNumber.innerText = `スライド ${s.index+1}`; 
    textArea.value = s.text;  
}

btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();

        // ファイル名
        p.innerText = `選択したファイル: ${data.filename}`;

        // スライドを受け取って保存
        slides = data.slides || [];
        currentIndex = 0;

        // pptx
        if (data.ext == ".pptx") {
            showSlide(currentIndex);
        }

        // docx
        if (data.ext == ".docx") {
            showSlide(currentIndex);
        }

    } catch (err) {
        console.error(err);
        p.innerText = "Error!";
    }
});

// 前へ
document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        showSlide(currentIndex);
    }
});

// 次へ
document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        showSlide(currentIndex);
    }


});
