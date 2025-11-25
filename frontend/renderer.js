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

    let html = slide.shapes
        .map((shape, i) => {
            const paragraphsHtml =
                shape.paragraphs && shape.paragraphs.length > 0
                    ? shape.paragraphs
                          .map(
                              (para, p) => `
        <div id="t-value" style="margin-left: 10px; padding: 4px 0;">
            <label style="display:flex; align-items:center; gap:6px;">
                <input 
                    type="checkbox" 
                    class="para-checkbox" 
                    data-shape-index="${i}"
                    data-paragraph-index="${p}">
                <span><strong>Paragraph ${p + 1}</strong></span>
            </label>
            <div style="margin-left:22px; margin-top:3px;">
                ${para.text || ""}
            </div>
        </div>`
                          )
                          .join("")
                    : `<div>(no paragraphs)</div>`;

            return `
<div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ccc; border-radius: 6px;">
    <strong>Shape ${i + 1}</strong><br>

    <button
      class="select-all-btn"
      data-shape-index="${i}"
      style="margin: 6px 0; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
      全選択
    </button>

    <div style="display: flex; gap: 16px; margin-top: 6px;">
      <div class="scroll-box" style="flex: 1; margin-top: 4px;">
        ${paragraphsHtml}
      </div>

      <div style="min-width: 160px; font-size: 14px; line-height: 1.4;">
        <div>Left: ${shape.left}</div>
        <div>Top: ${shape.top}</div>
        <div>Width: ${shape.width}</div>
        <div>Height: ${shape.height}</div>
      </div>
    </div>

    <hr style="margin: 8px 0;">
</div>`;
        })
        .join("");

    shapeInfoDiv.innerHTML = html;
    slideNumber.innerText = `Slide ${index + 1} / ${slides.length}`;

    // スライド内の全テキストを textarea に入れる
    const allTexts = slide.shapes.map((s) => s.text ?? s).join("\n");
    textArea.value = allTexts;
}

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
btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_file");
        const data = await res.json();

        fileData = data;
        slides = data.slides;
        document.getElementById("slideCountText").textContent = `1 / ${slides.length}`;

        selectedFilePath = data.path;
        slidesData = data;

        // console.log("aaa", data);

        if (data.error) {
            p.innerText = `Error: ${data.error}`;
            return;
        }

        p.innerText = `選択したファイル: ${data.filename}`;

        // 🔥 これが超重要
        // ---------------------------------------
        currentIndex = 0;
        renderSlideSelector(data.slides);

        showSlide(0);
        
        // ---------------------------------------

    } catch (err) {
        console.error(err);
        p.innerText = "通信エラー";
    }
});

// ---------------------
// ★ 翻訳
// ---------------------
translateBtn.addEventListener("click", async () => {
    const tNodes = document.querySelectorAll("#t-value > div");
    if (!tNodes.length) return alert("翻訳対象がありません");

    translateBtn.disabled = true;

    try {
        const res = await fetch("http://127.0.0.1:8000/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileData),
        });

        const data = await res.json();
        console.log("Translation result:", data);

        const translatedTextDiv = document.getElementById("translated-text");
        translatedTextDiv.innerHTML = "";

        const tSlides = data.translated_text.slides;

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

        // ★ ここで翻訳結果を slides に反映
        tSlides.forEach((slide, i) => {
            slide.shapes.forEach((shape, j) => {
                shape.paragraphs.forEach((p, k) => {
                    slides[i].shapes[j].paragraphs[k].text = p.text;
                });
            });
        });

    } catch (err) {
        console.error(err);
    } finally {
        translateBtn.disabled = false;
    }
});



// ---------------------
// ★ 前へ / 次へ
// ---------------------
prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) showSlide(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) showSlide(currentIndex + 1);
});

// ---------------------
// ★ 保存ロジック
// ---------------------
// --- 保存ボタン ---
saveBtn.addEventListener("click", async () => {
    const currentShapes = slides[currentIndex].shapes;

    const payload = {
        slide_index: currentIndex,
        shapes: currentShapes.map((s, i) => ({
            shape_index: i,
            text: s.paragraphs?.map(p => p.text).join("\n") ?? "",
        })),
    };

    const res = await fetch("http://127.0.0.1:8000/saveppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("save result:", data);
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
