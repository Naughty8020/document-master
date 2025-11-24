const translateSection = document.getElementById("translate-section");
const textareaSection = document.getElementById("textarea-section");
const translateSectionbtn = document.getElementById("translate-section-btn");
const textareaSectionbtn = document.getElementById("textarea-section-btn");
const insertBtn = document.getElementById("insert-btn");


translateSectionbtn.addEventListener("click", () => {
    translateSection.classList.remove('is-hidden');  // これを表示
    textareaSection.classList.add('is-hidden');      // こっちは隠す
});

textareaSectionbtn.addEventListener("click", () => {
    textareaSection.classList.remove('is-hidden');   // これを表示
    translateSection.classList.add('is-hidden');    // こっちは隠す
});
<<<<<<< HEAD

=======
>>>>>>> 64ef2423221b9b945c2b6a2ff2796bc64093f954



// const textareaText ={
//     text: textareaValue
// }

let translatedText = "";

insertBtn.addEventListener("click", async () => {
    

    const newTextarea = document.getElementById("textarea-section")
    const actualTextarea = newTextarea.querySelector('textarea');
    
    
    const textareaValue = actualTextarea.value;
    // const textareaValue = actualTextarea ? actualTextarea.value : '';
    // if (!textareaValue.trim()) {
    //     console.warn("送信するテキストが空です。");
    //     return; // 空の場合は送信しない
    // }

    const leftValue   = parseFloat(document.getElementById("left-input").value);
    const topValue    = parseFloat(document.getElementById("top-input").value);
    const widthValue  = parseFloat(document.getElementById("width-input").value);
    const heightValue = parseFloat(document.getElementById("height-input").value);


    try{
        const payload = { 
            text: translatedText,
            left:leftValue,
            top:topValue,
            width:widthValue,
            height:heightValue
        };
        
        const res = await fetch("http://127.0.0.1:8000/insert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        
        // if (!res.ok) {
        //     // 422エラーの詳細情報をログに出力して、何が原因で拒否されたか確認
        //     const error_details = await res.json();
        //     console.error("FastAPI 422 Error Details:", error_details);
        // } else {
        //     console.log("送信成功:", await res.json());
        // }

    }catch (error) {
        console.error("Error inserting text:", error);
    }
});




const insertTranslateBtn = document.getElementById("insert-translate");
const textInput = document.getElementById("text-input");
console.log(textInput.innerText);

insertTranslateBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/insert-translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: textInput.value })
        });

        const data = await res.json(); // JSONとして取得
        console.log(data); // 確認用

        // 新しいdivに翻訳テキストを入れる
        const translatedDiv = document.createElement('div');
        translatedDiv.innerText = data.translated_text;
        translatedText=data.translated_text;

        document.body.appendChild(translatedDiv); // bodyに追加
    } catch (error) {
        console.error("Error inserting translated text:", error);
    }
});
