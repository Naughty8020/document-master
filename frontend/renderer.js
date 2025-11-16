const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePathLabel");
const textArea = document.getElementById("fileContent");
const saveBtn = document.getElementById("saveBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideNumber = document.getElementById("slideNumber");
const translateBtn = document.getElementById("translateBtn");
const translatedTextArea = document.getElementById("translatedContent");
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
translateBtn.addEventListener("click", async () => {
    // 翻訳したいテキストが入力されている前提 (元の日本語テキスト)
    const textToTranslate = textArea.value; 

    if (!slides.length) {
        alert("ファイルを先に選択してください。");
        return;
    }
    if (!textToTranslate.trim()) {
        alert("翻訳するテキストを入力してください。");
        return;
    }

    // 1. 連続操作を防ぐためボタンを無効化
    translateBtn.disabled = true;
    
    try {
        // --- A. 翻訳APIの呼び出し (/translate_text) ---
        const transRes = await fetch("http://127.0.0.1:8000/translate_text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToTranslate })
        });

        if (!transRes.ok) {
            throw new Error(`翻訳API HTTPエラー: ${transRes.status}`);
        }

        const transData = await transRes.json();

        if (transData.status !== "ok" || transData.translated_text === undefined) {
            alert(`翻訳サーバーエラー: ${transData.error || '翻訳結果がありません'}`);
            return;
        }

        const translatedText = transData.translated_text;

        // 2. 翻訳結果を translatedTextArea に表示
        translatedTextArea.value = translatedText; 
        
        // 3. 画面上の元のテキストエリア (textArea) の値を翻訳結果で上書き
        // 🚨 ここで画面上の表示を翻訳後のテキストに更新します
        textArea.value = translatedText;

        // 4. slides配列内の現在のスライドのテキストも更新
        // 🚨 これでスライドを移動しても翻訳結果が保持されますが、ファイルはまだ保存されません
        slides[currentIndex].text = translatedText;

        // ❌ B. ファイル更新APIの呼び出し (/update_slide) は削除しました。

        alert("✅ 翻訳が完了しました。手動で「保存」ボタンを押してください。");


    } catch (err) {
        console.error("処理エラー:", err);
        alert("通信または処理エラーが発生しました: " + err.message);
    } finally {
        // 5. 処理が終わったらボタンを再度有効にする
        translateBtn.disabled = false;
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
