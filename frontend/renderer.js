const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePathLabel");
const textArea = document.getElementById("fileContent");
const saveBtn = document.getElementById("saveBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideNumber = document.getElementById("slideNumber");

let slides = [];
let currentIndex = 0;

// スライド表示
function showSlide(index) {
    const s = slides[index];
    slideNumber.innerText = `スライド ${s.index + 1}`;
    textArea.value = s.text;
}

// ファイル選択
btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();

        if (data.error) {
            p.innerText = `Error: ${data.error}`;
            return;
        }

        p.innerText = `選択したファイル: ${data.filename}`;
        slides = data.slides || [];
        currentIndex = 0;

        if (slides.length > 0) {
            showSlide(currentIndex);
        }

    } catch (err) {
        console.error(err);
        p.innerText = "通信エラー";
    }
});

// 前へ
prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        showSlide(currentIndex);
    }
});

// 次へ
nextBtn.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        showSlide(currentIndex);
    }
});

// 保存
saveBtn.addEventListener("click", async () => {
    if (!slides.length) return;

    const slideIndex = currentIndex;
    const text = textArea.value;

    try {
        const res = await fetch("http://127.0.0.1:8000/update_slide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index: slideIndex, text: text })
        });

        const json = await res.json();
        console.log(json);

        if (json.status === "ok") {
            alert(`スライド ${slideIndex + 1} を保存しました`);
        } else {
            alert(`保存失敗: ${json.error || "不明なエラー"}`);
        }

    } catch (err) {
        console.error(err);
        alert("通信エラーが発生しました");
    }
});
