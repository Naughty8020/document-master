import React from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export default function TranslateSection({ slides, setSlides, afterTextAreaRef }) {
  // --- 翻訳 ---
  const handleTranslate = async () => {
    if (!slides || slides.length === 0) return alert("翻訳対象がありません");

    try {
      const res = await fetch("http://127.0.0.1:8000/translate_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      const data = await res.json();
      const tSlides = data.translated_text.slides;

      // after textarea にセット
      if (afterTextAreaRef.current) {
        const allText = tSlides
          .map((slide) =>
            slide.shapes
              .map((shape) =>
                shape.paragraphs
                  .map((p) => p.text.trim())
                  .filter(Boolean)
                  .join("\n")
              )
              .join("\n\n")
          )
          .join("\n\n");
        afterTextAreaRef.current.value = allText;
      }

      // slides state を更新
      const newSlides = slides.map((slide, i) => {
        const newSlide = { ...slide };
        newSlide.shapes = slide.shapes.map((shape, j) => {
          const newShape = { ...shape };
          newShape.paragraphs = newShape.paragraphs.map((p, k) => ({
            ...p,
            text: tSlides[i].shapes[j].paragraphs[k].text,
          }));
          return newShape;
        });
        return newSlide;
      });
      setSlides(newSlides);
    } catch (err) {
      console.error(err);
    }
  };

  // --- 保存 ---
  const handleSave = async () => {
    if (!slides || slides.length === 0) return alert("保存対象がありません");

    const currentIndexElement = document.getElementById("slideNumber");
    let currentSlideIndex = 0;
    if (currentIndexElement) {
      const match = currentIndexElement.innerText.match(/Slide (\d+) \/ \d+/);
      if (match) currentSlideIndex = parseInt(match[1], 10) - 1;
    }

    const currentShapes = slides[currentSlideIndex].shapes;

    const payload = {
      slide_index: currentSlideIndex,
      shapes: currentShapes.map((s, i) => ({
        shape_index: i,
        text: s.paragraphs?.map(p => p.text).join("\n") ?? "",
      })),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/saveppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("save result:", data);
      alert("保存完了");
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました");
    }
  };

  return (
    <div id="translate-section" className="page">
      <div id="translation-container">
        <button id="slideSelectorBtn" className="menu-item">
          スライド（<span id="slideCountText">0 / 0</span>）
          <ArrowDropDownIcon className="arrow-icon" />
        </button>

        <div id="slideSelectorList" className="slide-card is-hidden"></div>
        <p id="filePathLabel"></p>
        <p id="slideNumber"></p>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
          <button
            id="beforeBtn"
            style={{ color: "red", border: "none", padding: "8px 16px", background: "transparent", cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "darkred")}
            onMouseOut={(e) => (e.currentTarget.style.color = "red")}
          >
            before
          </button>
          <p style={{ margin: 0 }}>/</p>
          <button
            id="afterBtn"
            style={{ color: "blue", border: "none", padding: "8px 16px", background: "transparent", cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "darkblue")}
            onMouseOut={(e) => (e.currentTarget.style.color = "blue")}
          >
            after
          </button>
        </div>

        <textarea
          id="before"
          className="custom-textarea"
          style={{ display: "block", width: "100%", height: "300px", marginTop: "10px" }}
        ></textarea>
        <textarea
          id="after"
          className="custom-textarea-after"
          ref={afterTextAreaRef}
          style={{ display: "none", width: "100%", height: "300px", marginTop: "10px" }}
        />

        <div style={{ textAlign: "right", marginTop: "8px" }}>
          <button
            id="saveBtn"
            className="header-save-btn"
            onClick={handleSave}
            style={{ marginRight: "10px" }}
          >
            保存
          </button>
          <button id="translateBtn" className="header-save-btn" onClick={handleTranslate}>
            翻訳
          </button>
        </div>
      </div>
    </div>
  );
}
