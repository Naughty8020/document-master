const btn = document.getElementById("selectFileBtn");
const p = document.getElementById("filePath");

btn.addEventListener("click", async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/get_ppt");
        const data = await res.json();

        // バックエンドの返り値は { message: "Hello World" }
        p.innerText = `選択したファイル: ${data.filename}`;


    } catch (err) {
        console.error(err);
        p.innerText = "Error!";
    }
});

