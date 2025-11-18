// const { get } = require("http");

const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePathLabel");
const textArea = document.getElementById("fileContent");
const saveBtn = document.getElementById("saveBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideNumber = document.getElementById("slideNumber");
const translateBtn = document.getElementById("translateBtn");
const translatedTextArea = document.getElementById("translatedContent");
const testBtn = document.getElementById("test");

let slides = [];
let currentIndex = 0;
let selectedFilePath = null;

// スライド表示
function showSlide(index) {
    const slide = slides[index];
    const shapeInfoDiv = document.getElementById("shapeInfo");

    // 位置情報リストを作る
    let html = `<h3>シェイプ情報 (スライド ${index + 1})</h3>`;

    slide.shapes.forEach((shape, i) => {
        html += `
            <div style="margin-bottom:10px; padding:6px; border:1px solid #ccc;">
                <strong>Shape ${i+1}</strong><br>
                Text: ${shape.text}<br>
                Left: ${shape.left}<br>
                Top: ${shape.top}<br>
                Width: ${shape.width}<br>
                Height: ${shape.height}
            </div>
        `;
    });

    shapeInfoDiv.innerHTML = html;
}


// ファイル選択
btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();
        slides = data.slides || [];
        selectedFilePath = data.path;
        if (data.error) { p.innerText = `Error: ${data.error}`; return; }
        p.innerText = `選択したファイル: ${data.filename}`;
        currentIndex = 0;
        if (slides.length > 0) showSlide(currentIndex);
    } catch (err) {
        console.error(err);
        p.innerText = "通信エラー";
    }
});

// 前へ
prevBtn.addEventListener("click", () => { if(currentIndex>0){currentIndex--; showSlide(currentIndex); } });
// 次へ
nextBtn.addEventListener("click", () => { if(currentIndex<slides.length-1){currentIndex++; showSlide(currentIndex); } });

// 翻訳
translateBtn.addEventListener("click", async () => {
    if (!slides.length) return alert("ファイルを先に選択してください");
    const textToTranslate = textArea.value;
    if (!textToTranslate.trim()) return alert("翻訳するテキストを入力してください");
    translateBtn.disabled = true;
    try {
        const res = await fetch("http://127.0.0.1:8000/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToTranslate })
        });
        const data = await res.json();
        const translatedText = data.translated_text;
        translatedTextArea.value = translatedText;
        textArea.value = translatedText;
        slides[currentIndex].shapes.forEach((s, i) => s.text = translatedText.split("\n")[i] || "");
        alert("✅ 翻訳完了");
    } catch (err) { console.error(err); alert("翻訳エラー"); }
    finally { translateBtn.disabled = false; }
});

// 保存
saveBtn.addEventListener("click", async () => {
    if (!slides.length) return;
    const slideData = slides.map(slide => ({
        slide_index: slide.index,
        shapes: slide.shapes.map((s,i)=>({shape_index:i, translated_text:s.text}))
    }));
    try {
        const res = await fetch("http://127.0.0.1:8000/update_slide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slides: slideData })
        });
        const data = await res.json();
        if(data.status==="ok") alert("✅ 保存完了");
    } catch(err){ console.error(err); alert("保存エラー"); }
});

// /test
testBtn.addEventListener("click", async () => {
    try {
        await fetch("http://127.0.0.1:8000/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedFilePath })
        });
    } catch(err){ console.error(err); }
});

const savetest = document.getElementById("savetest");
savetest.addEventListener("click", async () => {
    try {
        await fetch ("http://localhost:8000/savetest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedFilePath })
        });
    } catch(err){ console.error(err); }
});