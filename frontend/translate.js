

      const selectorBtn = document.getElementById("slideSelectorBtn");
const selectorList = document.getElementById("slideSelectorList");

const slideCountText = document.getElementById("slideCountText");

selectorBtn.addEventListener("click", () => {
  const rect = selectorBtn.getBoundingClientRect();

  selectorList.style.position = "absolute";
  selectorList.style.top = rect.bottom + "px";
  selectorList.style.left = rect.left + "px";

  selectorList.classList.toggle("is-hidden");
});


function renderSlideSelector(slides) {
    console.log("renderSlideSelector arg:", slides);

    if (!Array.isArray(slides)) {
        console.error("slides が配列じゃない:", slides);
        return;
    }

    selectorList.innerHTML = "";  // 中身リセット
    

    slides.forEach((slide, index) => {
        const item = document.createElement("div");
        item.className = "slide-card-item";
        item.textContent = `スライド ${index + 1}`;

        item.addEventListener("click", () => {
            showSlide(index);   // ← これだけでOK（中でスライド番号更新済み）
            selectorList.classList.add("is-hidden");
        });

        selectorList.appendChild(item);
    });

    console.log("✔ スライドカード生成 完了");
}
// #slideSelectorList を取得済み
const selectorListtest = document.getElementById("slideSelectorList");

// 新しい要素を作る
const item = document.createElement("div");
item.className = "slide-card-item"; // CSSを効かせるならクラスも追加
item.textContent = "aaa";

// セレクターリストに追加
selectorListtest.appendChild(item);

// 設定保存
document.getElementById("saveSettingBtn").addEventListener("click", () => {
  const model = document.getElementById("modelSelect").value;
  const lang = document.getElementById("languageSelect").value;
  const hardware = document.getElementById("hardwareSelect").value;

  // localStorage に保存（Electron でも使える）
  const settings = { model, lang, hardware };
  localStorage.setItem("appSettings", JSON.stringify(settings));

  document.getElementById("settingSavedMsg").style.display = "block";
  setTimeout(() => {
    document.getElementById("settingSavedMsg").style.display = "none";
  }, 1500);

  console.log("設定を保存:", settings);
});