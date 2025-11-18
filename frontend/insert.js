

const translateSection = document.getElementById("translate-section");
const textareaSection = document.getElementById("textarea-section");
const translateSectionbtn = document.getElementById("translate-section-btn");
const textareaSectionbtn = document.getElementById("textarea-section-btn");
const insertBtn = document.getElementById("insert-btn");


translateSectionbtn.addEventListener("click", () => {
    translateSection.classList.toggle('is-hidden');
}   );

textareaSectionbtn.addEventListener("click", () => {
    textareaSection.classList.toggle('is-hidden');
});
    



// const textareaText ={
//     text: textareaValue
// }

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
            text: textareaValue,
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