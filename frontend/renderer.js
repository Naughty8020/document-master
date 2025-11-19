// const { get } = require("http"); // これは不要なのでコメントアウトのまま

// --- 1. 変数の初期化 ---
const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePathLabel");
const textArea = document.getElementById("fileContent");
const saveBtn = document.getElementById("saveBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideNumber = document.getElementById("slideNumber");
const translateBtn = document.getElementById("translateBtn");

const testBtn = document.getElementById("test");
const listDisplay = document.getElementById("listDisplay");
const replaceBtn = document.getElementById("replaceBtn");

let slides = [];
let currentIndex = 0;
let selectedFilePath = null;
let selectedIndices = []; // 複数選択用

// ---------------------
// ★ showSlide 修正版
// ---------------------
function showSlide(index) {
    const slide = slides[index];
    const shapeInfoDiv = document.getElementById("shapeInfo");

    let html = "";

  

    
    for (let i = 0; i < slide.shapes.length; i++) {
        const shape = slide.shapes[i];
    
        html += `
        <div style="margin-bottom:10px; padding:6px; border:1px solid #ccc;">
            <strong>Shape ${i + 1}</strong><br>
    
            <button 
                class="select-all-btn" 
                data-shape-index="${i}"
                style="margin: 4px 0; padding:3px 10px;"
            >
                全選択
            </button>
    `;
    
        // --- paragraph の処理 ---
        if (shape.paragraphs && shape.paragraphs.length > 0) {
    
            for (let p = 0; p < shape.paragraphs.length; p++) {
                const para = shape.paragraphs[p];
    
                html += `
    <div id="t-value" style="margin-left: 10px; padding: 4px 0;">
        <label style="display:flex; align-items:center; gap:6px;">
            <input 
                type="checkbox" 
                class="para-checkbox" 
                data-shape-index="${i}"
                data-paragraph-index="${p}"
            >
            <span><strong>Paragraph ${p + 1}</strong></span>
        </label>
        <div style="margin-left:22px; margin-top:3px;">
            ${para.text || ""}
        </div>
    </div>
`;

            
            }
    
        } else {
            html += `<div>(no paragraphs)</div>`;
        }
    
        // --- 座標など ---
        html += `
                <hr style="margin:6px 0;">
                Left: ${shape.left}<br>
                Top: ${shape.top}<br>
                Width: ${shape.width}<br>
                Height: ${shape.height}
            </div>
        `;
    }
    

    shapeInfoDiv.innerHTML = html;
    slideNumber.innerText = `Slide ${index + 1} / ${slides.length}`;
    
    // ページ移動時、リストと選択をクリア
    listDisplay.innerHTML = "";
    selectedIndices = [];
    translatedTextArea.value = "";
    
    // スライドの全テキストを結合して表示
    const allTexts = slide.shapes.map(s => s.text ?? s).join("\n");
    textArea.value = allTexts;
}

// ---------------------
// --- リスト選択ロジック (トグル選択) ---
// ---------------------
listDisplay.addEventListener("click", (e) => {
    if (e.target.tagName !== "LI") return;

    const li = e.target;
    const index = Array.from(listDisplay.children).indexOf(li);
    const idxInArray = selectedIndices.indexOf(index);
    
    if (idxInArray > -1) {
        li.style.backgroundColor = ""; 
        selectedIndices.splice(idxInArray, 1);
    } else {
        li.style.backgroundColor = "#ffd"; 
        selectedIndices.push(index);
    }
});

// ---------------------
// --- 置換ロジック ---
// ---------------------
replaceBtn.addEventListener("click", () => {
    if (selectedIndices.length === 0) return alert("置換する行を選択してください");
    if (currentIndex >= slides.length || !slides[currentIndex].shapes) return;
    
    const combinedLiText = selectedIndices
        .map(index => listDisplay.children[index].textContent)
        .join("\n"); 
    const targetShapeIndex = Math.min(...selectedIndices);

    if (targetShapeIndex >= slides[currentIndex].shapes.length) return alert("選択された行がスライドの要素数を超えています");

    const targetShape = slides[currentIndex].shapes[targetShapeIndex];
    if (typeof targetShape === "object" && targetShape !== null && "text" in targetShape) {
        targetShape.text = combinedLiText;
    } else {
        slides[currentIndex].shapes[targetShapeIndex] = combinedLiText;
    }

    const allTexts = slides[currentIndex].shapes.map(s => s.text ?? s).join("\n");
    textArea.value = allTexts;
    translatedTextArea.value = allTexts;

    alert(`shape ${targetShapeIndex + 1} に選択した ${selectedIndices.length} 行を結合して置換しました`);
    
    Array.from(listDisplay.children).forEach(li => li.style.backgroundColor = "");
    selectedIndices = [];
});



let fileData = null;
btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();
        fileData = data;
        slides = data.slides || [];
        selectedFilePath = data.path;
        console.log("段落",data.slides[0].shapes[1].paragraphs);

        if (data.error) { 
            p.innerText = `Error: ${data.error}`;
            return;
        }

        p.innerText = `選択したファイル: ${data.filename}`;

        currentIndex = 0;
        if (slides.length > 0) showSlide(currentIndex);

    } catch (err) {
        console.error(err);
        p.innerText = "通信エラー";
    }
});





translateBtn.addEventListener("click", async () => {
    if (!slides.length) return alert("ファイルを先に選択してください");

    // ① t-value の paragraph 部分だけ集める
    const tValueNodes = document.querySelectorAll("#t-value > div");
    if (!tValueNodes.length) return alert("翻訳するテキストがありません");

    const textList = [...tValueNodes].map(node => node.textContent.trim());
    const textToTranslate = textList.join("\n"); // 改行区切り

    if (!textToTranslate.trim()) return alert("翻訳するテキストを入力してください");

    translateBtn.disabled = true;



    try {
        console.log("翻訳リクエスト送信:", textToTranslate);

        const res = await fetch("http://127.0.0.1:8000/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileData)
        });

        console.log("翻訳レスポンス受信", await res.json());
        // const data = await res.json();
        // console.log("翻訳レスポンス受信:", data);
        // const translatedText = data.translated_text;
        // const translatedList = translatedText.split('\n');

        let translatedList = [];  // 空配列で初期化しておく

      

        // shape に反映
        slides[currentIndex].shapes.forEach((shape, i) => {
            if (shape.paragraphs && shape.paragraphs[i]) {
                shape.paragraphs[i].text = translatedList[i] || "";
            }
        });

        // ★ リスト表示
        listDisplay.innerHTML = "";
        selectedIndices = [];
        
        translatedList.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const li = document.createElement("li");
            li.textContent = trimmed;
            listDisplay.appendChild(li);
        });

        alert("✅ 翻訳完了");

    } catch (err) {
        console.error(err);
        alert("翻訳エラー");
    } finally {
        translateBtn.disabled = false;
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

// ---------------------
// ★ 保存 (ロジック復元)
// ---------------------
saveBtn.addEventListener("click", async () => {
    if (!slides.length) return;

    // スライドデータ構造をサーバーに合わせて構築
    const slideData = slides.map(slide => ({
        slide_index: slide.index,
        shapes: slide.shapes.map((s, i) => ({
            shape_index: i,
            // 翻訳されたテキストは s.text に格納されていると仮定
            translated_text: s.text || s
        }))
    }));

    try {
        const res = await fetch("http://127.0.0.1:8000/update_slide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slides: slideData })
        });

        const data = await res.json();
        if (data.status === "ok") alert("✅ 保存完了");

    } catch (err) {
        console.error(err);
        alert("保存エラー");
    }
});


const savefileBtn = document.getElementById("savefileBtn");

savefileBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/savefile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedFilePath })
        });

    } catch (err) {
        console.error(err);
    }
});


// ---------------------
// ★ test / savetest (ロジック復元)
// ---------------------
testBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedFilePath })
        });

        const data = await res.json();
        console.log(data.status); // => "ok"
    } catch (err) {
        console.error(err);
    }
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("select-all-btn")) {
        const shapeIndex = e.target.dataset.shapeIndex;

        // この shape の paragraph チェックボックスだけ取得
        const checkboxes = document.querySelectorAll(
            `.para-checkbox[data-shape-index="${shapeIndex}"]`
        );

        // すべてチェック済みか確認
        let allChecked = true;
        for (let i = 0; i < checkboxes.length; i++) {
            if (!checkboxes[i].checked) {
                allChecked = false;
                break;
            }
        }

        // トグル処理
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = !allChecked;
        }
    }
});



// const translationContainer = document.getElementById('translation-container');
// const swaggerContainer = document.getElementById('swagger-container');
// const showTranslationBtn = document.getElementById('showTranslationBtn');
// const showSwaggerBtn = document.getElementById('showSwaggerBtn');

// let swaggerUiInitialized = false;

// function showTranslationUI() {
//     translationContainer.classList.remove('hidden');
//     swaggerContainer.classList.add('hidden');
// }

// function showSwaggerUI() {
//     translationContainer.classList.add('hidden');
//     swaggerContainer.classList.remove('hidden');

//     if (!swaggerUiInitialized) {
//         // node_modules の JSがロードされた後なので、SwaggerUIBundleが利用可能
//         SwaggerUIBundle({
//             url: "http://localhost:8080/swagger.json",
//             dom_id: '#swagger-ui',
//             presets: [
//                 SwaggerUIBundle.presets.apis,
//                 SwaggerUIStandalonePreset
//             ],
//             layout: "StandaloneLayout"
//         });
        
//         swaggerUiInitialized = true;
//     }
// }

// showTranslationBtn.addEventListener('click', showTranslationUI);
// showSwaggerBtn.addEventListener('click', showSwaggerUI);

// // 初期表示は翻訳ツールUI
// showTranslationUI();

