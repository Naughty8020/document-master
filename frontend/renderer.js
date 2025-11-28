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
const savefileBtn = document.getElementById("savefileBtn");

let slides = [];
let currentIndex = 0;
let selectedFilePath = null;
let selectedIndices = [];
let slidesData = null;
let fileData = null;

// ---------------------
// ★ showSlide 修正版
// ---------------------
function showSlide(index) {
    currentIndex = index;
    const slide = slides[index];

    console.log("Current index:", currentIndex);
    console.log("Slide data:", slide);
    console.log("Shapes:", slide?.shapes);

    const shapeInfoDiv = document.getElementById("shapeInfo");
    const textArea = document.querySelector(".custom-textarea"); // ← 最初に取得

    let html = slide.shapes
        .map((shape, i) => {
            const paragraphsHtml =
                shape.paragraphs && shape.paragraphs.length > 0
                    ? shape.paragraphs
                          .map(
                              (para, p) => `
        <div class="para-row" style="display:flex; align-items:flex-start; gap:6px; padding:4px 0;">
            <input 
                type="checkbox" 
                class="para-checkbox" 
                data-shape-index="${i}"
                data-paragraph-index="${p}"
                style="margin-top:4px;"
            >
            <div class="para-text" style="line-height:1.4;">
                ${para.text || ""}
            </div>
        </div>`
                          )
                          .join("")
                    : `<div style="padding:4px 0; color:#777;">(no paragraphs)</div>`;

            return `
<div class="shape-box" 
     style="margin-bottom: 8px; padding: 6px; border: 1px solid #ccc; border-radius: 4px; background:#fafafa;">
    
    <div class="shape-title" style="font-weight:bold; margin-bottom:4px;">
        Shape ${i + 1}
    </div>

    <div class="scroll-box" style="max-height:140px; overflow-y:auto; padding-right:4px;">
        ${paragraphsHtml}
    </div>

</div>`;
        })
        .join("");

    shapeInfoDiv.innerHTML = html;
    slideNumber.innerText = `Slide ${index + 1} / ${slides.length}`;

    // shapeInfoDiv の文字だけを textarea に入れる（空行削除＋shape間に1行空白）
    if (textArea) {
        const lines = shapeInfoDiv.innerText
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

        // shapeごとの間に空行を入れる
        const shapes = [];
        let currentShape = [];
        lines.forEach(line => {
            if (line.startsWith("Shape")) {
                if (currentShape.length > 0) {
                    shapes.push(currentShape.join("\n"));
                }
                currentShape = [line];
            } else {
                currentShape.push(line);
            }
        });
        if (currentShape.length > 0) shapes.push(currentShape.join("\n"));

        textArea.value = shapes.join("\n\n"); // shape間に空行1行
    }
}


{/* <div style="min-width: 160px; font-size: 14px; line-height: 1.4;">
<div>Left: ${shape.left}</div>
<div>Top: ${shape.top}</div>
<div>Width: ${shape.width}</div>
<div>Height: ${shape.height}</div>
</div> */}

{/* <span><strong>Paragraph ${p + 1}</strong></span> */}

  // <button
    //   class="select-all-btn"
    //   data-shape-index="${i}"
    //   style="margin: 6px 0; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
    //   全選択
    // </button>

// ---------------------
// --- リスト選択 ---
// ---------------------
listDisplay.addEventListener("click", (e) => {
    if (e.target.tagName !== "LI") return;

    const li = e.target;
    const index = Array.from(listDisplay.children).indexOf(li);

    if (selectedIndices.includes(index)) {
        selectedIndices = selectedIndices.filter((n) => n !== index);
        li.style.backgroundColor = "";
    } else {
        selectedIndices.push(index);
        li.style.backgroundColor = "#ffd";
    }
});

// ---------------------
// --- 置換ロジック ---
// ---------------------
replaceBtn.addEventListener("click", () => {
    if (!selectedIndices.length) return alert("置換する行を選択してください");

    const combined = selectedIndices
        .map((i) => listDisplay.children[i].textContent)
        .join("\n");

    const targetIndex = Math.min(...selectedIndices);
    const targetShape = slides[currentIndex].shapes[targetIndex];

    if (typeof targetShape === "object") {
        targetShape.text = combined;
    } else {
        slides[currentIndex].shapes[targetIndex] = combined;
    }

    const allTexts = slides[currentIndex].shapes.map((s) => s.text ?? s).join("\n");
    textArea.value = allTexts;

    alert("置換完了");
});

// ---------------------
// ★ ファイル選択
// ---------------------

let selectedFilename = null;

const filename = document.getElementById("currentFileName");

btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();

        fileSelected = true;
        fileData = data;
        console.log("Received file data:", data);
        slides = data.slides;
        document.getElementById("slideCountText").textContent = `1 / ${slides.length}`;

        selectedFilename = data.path;
        selectedFilePath = data.path;
        slidesData = data;

        console.log("Selected file data:", data);
        console.log("filename element:", data.filename);
        console.log("slides loaded:", selectedFilePath);

        // エラーがあれば表示して終了
        if (data.error) {
            if (p) p.textContent = `Error: ${data.error}`;
            return;
        }

        // ファイル名表示
        if (filename) {
            filename.textContent = `${data.filename || "無題"}`;
        }

        // 初期スライド表示
        currentIndex = 0;
        renderSlideSelector(data.slides);
        showSlide(0);

    } catch (err) {
        console.error("通信または表示エラー:", err);
        
    }
});



// ---------------------
// ★ 翻訳
// ---------------------
translateBtn.addEventListener("click", async () => {
    if (!slides || !slides.length) return alert("翻訳対象がありません");

    translateBtn.disabled = true;

    try {
        const res = await fetch("http://127.0.0.1:8000/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slides }),
        });

        const data = await res.json();
        console.log("Translation result:", data);

        const translatedTextDiv = document.getElementById("translated-text");
        translatedTextDiv.innerHTML = "";

        const tSlides = data.translated_text.slides;

        // 翻訳結果を表示
        tSlides.forEach((slide, i) => {
            const slideDiv = document.createElement("div");
            slideDiv.innerHTML = `<h3>Slide ${i + 1}</h3>`;

            slide.shapes.forEach((shape, j) => {
                const shapeDiv = document.createElement("div");
                shapeDiv.style.marginLeft = "20px";
                shapeDiv.innerHTML = `<strong>Shape ${j + 1}</strong>`;

                shape.paragraphs.forEach((p) => {
                    const pElem = document.createElement("p");
                    pElem.style.marginLeft = "40px";
                    pElem.textContent = p.text;
                    shapeDiv.appendChild(pElem);
                });

                slideDiv.appendChild(shapeDiv);
            });

            translatedTextDiv.appendChild(slideDiv);
        });

        // 翻訳結果を slides に反映
        tSlides.forEach((slide, i) => {
            slide.shapes.forEach((shape, j) => {
                shape.paragraphs.forEach((p, k) => {
                    slides[i].shapes[j].paragraphs[k].text = p.text;
                });
            });
        });

        // 翻訳結果を「after」の textarea にセット
        const afterTextArea = document.querySelector(".custom-textarea-after");
        if (afterTextArea) {
            const allText = tSlides.map((slide) => {
                return slide.shapes
                    .map((shape) => {
                        return shape.paragraphs
                            .map(p => p.text.trim())
                            .filter(Boolean)
                            .join("\n");
                    })
                    .join("\n\n"); // shape ごとの間に空行
            }).join("\n\n"); // slide ごとの間にも空行
            afterTextArea.value = allText;
        }

        // 必要であれば現在のスライドも更新
        

    } catch (err) {
        console.error(err);
    } finally {
        translateBtn.disabled = false;
    }
});




// ---------------------
// ★ 前へ / 次へ
// ---------------------
// prevBtn.addEventListener("click", () => {
//     if (currentIndex > 0) showSlide(currentIndex - 1);
// });

// nextBtn.addEventListener("click", () => {
//     if (currentIndex < slides.length - 1) showSlide(currentIndex + 1);
// });

// ---------------------
// ★ 保存ロジック
// ---------------------
// --- 保存ボタン ---
saveBtn.addEventListener("click", async () => {
    const currentShapes = slides[currentIndex].shapes;

    const payload = {
        selectedFilename,
        slide_index: currentIndex,
        shapes: currentShapes.map((s, i) => ({
            shape_index: i,
            text: s.paragraphs?.map(p => p.text).join("\n") ?? "",
        })),
    };

    console.log("📤 送信されるファイルパス (file_path):", payload.selectedFilename);
    console.log("📦 送信される全ペイロード:", payload);
    try {
        const res = await fetch("http://127.0.0.1:8000/saveppt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        let data;
        if (res.ok) {
            // 成功時は JSON として取得
            data = await res.json();
        } else {
            // エラー時は text() で取得
            const text = await res.text();
            throw new Error(text);
        }

        console.log("save result:", data);
    } catch (err) {
        console.error("Save failed:", err.message);
    }
});

// ---------------------
// savefile
// ---------------------
savefileBtn.addEventListener("click", async () => {
    await fetch("http://127.0.0.1:8000/savefile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFilePath }),
    });
});

// ---------------------
// test
// ---------------------
testBtn.addEventListener("click", async () => {
    const res = await fetch("http://127.0.0.1:8000/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFilePath }),
    });

    const data = await res.json();
    console.log(data.status);
});

// ---------------------
// 全選択ボタン
// ---------------------
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("select-all-btn")) return;

    const shapeIndex = e.target.dataset.shapeIndex;
    const checkboxes = document.querySelectorAll(
        `.para-checkbox[data-shape-index="${shapeIndex}"]`
    );

    const allChecked = [...checkboxes].every((c) => c.checked);
    checkboxes.forEach((c) => (c.checked = !allChecked));
});
