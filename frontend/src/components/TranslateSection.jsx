import React, { useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import "../css/translate.css";

export default function TranslateSection({
  slides,
  setSlides,
  TranslateDate,
  filepath,
}) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState("before");

  // ★ after をスライドごとに保持する
  const [afterTexts, setAfterTexts] = useState([]);

  console.log("TranslateDate:", TranslateDate);

  // ★ 翻訳中フラグ
  const [isTranslating, setIsTranslating] = useState(false);

  const toggleSelector = () => {
    setIsSelectorOpen(!isSelectorOpen);
  };

  // BEFORE テキスト（スライド単位）
  const beforeText = TranslateDate?.slides?.[currentSlideIndex]?.shapes
    ?.map(shape =>
      shape.paragraphs
        ?.map(p => p.text.trim())
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n") || "";

  // --------------------
  // ▼ 翻訳
  // --------------------
  const handleTranslate = async () => {
    console.log("★★ filepath =", filepath);

    if (!slides || slides.length === 0) return alert("翻訳対象がありません");

    try {
      setIsTranslating(true);

      const res = await fetch("http://127.0.0.1:8000/translate_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      const data = await res.json();
      const tSlides = data.translated_text.slides;

      // ★ 翻訳結果をスライドごとに格納
      const converted = tSlides.map(slide =>
        slide.shapes
          .map(shape =>
            shape.paragraphs
              .map(p => p.text.trim())
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n")
      );

      setAfterTexts(converted);

      // ★ slides 内にも翻訳結果を反映
      const newSlides = slides.map((slide, i) => ({
        ...slide,
        shapes: slide.shapes.map((shape, j) => ({
          ...shape,
          paragraphs: shape.paragraphs.map((p, k) => ({
            ...p,
            text: tSlides[i].shapes[j].paragraphs[k].text,
          })),
        })),
      }));

      setSlides(newSlides);
      alert("翻訳完了");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // --------------------
  // ▼ 保存
  // --------------------
  const handleSave = async () => {
    console.log("★★ filepath =", filepath);

    if (!slides || slides.length === 0) return alert("保存対象がありません");

    // ★ after の編集内容を slides に反映（必要に応じて）
    if (afterTexts[currentSlideIndex]) {
      const edited = afterTexts[currentSlideIndex].split("\n");

      slides[currentSlideIndex].shapes.forEach((s, i) => {
        if (!edited[i]) return;
        if (s.paragraphs[0]) {
          s.paragraphs[0].text = edited[i];
        }
      });
    }

    const currentShapes = slides[currentSlideIndex].shapes;

    const payload = {
      selectedFilePath: filepath,
      slide_index: currentSlideIndex,
      shapes: currentShapes.map((s, i) => ({
        shape_index: i,
        text: s.paragraphs?.map(p => p.text).join("\n") || "",
      })),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/saveppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("a", payload);

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

      {/* ▼ 翻訳中モーダル */}
      {isTranslating && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px 50px",
              borderRadius: "14px",
              fontSize: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
              minWidth: "260px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #ccc",
                borderTop: "4px solid #4a90e2",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />

            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
              翻訳中…
            </div>
          </div>
        </div>
      )}

      {/* ▼ スライド一覧 */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          id="slideSelectorBtn"
          className="menu-item"
          onClick={toggleSelector}
          disabled={isTranslating}
        >
          スライド（{currentSlideIndex + 1} / {slides?.length || 0}）
          <ArrowDropDownIcon className="arrow-icon" />
        </button>

        {isSelectorOpen && (
          <div id="slideSelectorList" className="slide-card">
            {slides?.map((s, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setIsSelectorOpen(false);
                }}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  background: idx === currentSlideIndex ? "#eef" : "white",
                  borderBottom: "1px solid #ddd",
                }}
              >
                スライド {idx + 1}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* before / after 切替 */}
      <div
        style={{
          marginTop: "10px",
          marginBottom: "5px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <button
          onClick={() => setMode("before")}
          style={{
            color: mode === "before" ? "red" : "#444",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
          disabled={isTranslating}
        >
          before
        </button>

        <span>/</span>

        <button
          onClick={() => setMode("after")}
          style={{
            color: mode === "after" ? "blue" : "#444",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
          disabled={isTranslating}
        >
          after
        </button>
      </div>

      {/* BEFORE */}
      {mode === "before" && (
        <textarea
          id="before"
          className="custom-textarea"
          value={beforeText}
          readOnly
          style={{
            width: "100%",
            height: "300px",
            marginTop: "10px",
            border: "1px solid #ccc",
            padding: "8px",
            boxSizing: "border-box",
            display: "block",
            resize: "vertical",
            backgroundColor: "#fff",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        />
      )}

      {/* AFTER（スライドごとに切り替わる） */}
      {mode === "after" && (
        <textarea
          id="after"
          className="custom-textarea-after"
          value={afterTexts[currentSlideIndex] || ""}
          onChange={(e) => {
            const newArr = [...afterTexts];
            newArr[currentSlideIndex] = e.target.value;
            setAfterTexts(newArr);
          }}
          style={{
            width: "100%",
            height: "300px",
            marginTop: "10px",
            border: "1px solid #ccc",
            padding: "8px",
            boxSizing: "border-box",
            display: "block",
            resize: "vertical",
            backgroundColor: "#fff",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
          disabled={isTranslating}
        />
      )}

      {/* 保存 / 翻訳 */}
      <div style={{ textAlign: "right", marginTop: "10px" }}>
        <button
          id="saveBtn"
          className="header-save-btn"
          onClick={handleSave}
          style={{ marginRight: "10px" }}
          disabled={isTranslating}
        >
          保存
        </button>

        <button
          id="translateBtn"
          className="header-save-btn"
          onClick={handleTranslate}
          disabled={isTranslating}
        >
          {isTranslating ? "翻訳中…" : "翻訳"}
        </button>
      </div>
    </div>
  );
}
