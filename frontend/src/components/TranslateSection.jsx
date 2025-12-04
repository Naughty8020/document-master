import React, { useState, useEffect } from "react";
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
  const [afterText, setAfterText] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);

  const toggleSelector = () => {
    setIsSelectorOpen(!isSelectorOpen);
  };

  // BEFORE テキスト
  const beforeText = TranslateDate?.slides?.[currentSlideIndex]?.shapes
    ?.map(shape =>
      shape.paragraphs
        ?.map(p => p.text.trim())
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n") || "";

  // AFTER 更新
  useEffect(() => {
    if (!slides || slides.length === 0) return;

    const slide = slides[currentSlideIndex];
    const t =
      slide.shapes
        ?.map(s =>
          s.paragraphs?.map(p => p.text.trim()).filter(Boolean).join("\n")
        )
        .join("\n\n") || "";

    setAfterText(t);
  }, [currentSlideIndex, slides]);

  // --------------------
  // ▼ 翻訳（現在のスライドだけ）
  // --------------------
  const handleTranslate = async () => {
    if (!slides || slides.length === 0) return alert("翻訳対象がありません");

    try {
      setIsTranslating(true);

      const currentSlide = slides[currentSlideIndex];

      // ▼ 現在のスライドだけ送信
      const res = await fetch("http://127.0.0.1:8000/translate_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: currentSlide }),
      });

      const data = await res.json();
      const translatedSlide = data.translated_text.slide;

      // ▼ 他スライドには触らず、現在のスライドのみ更新
      const newSlides = slides.map((slide, i) =>
        i === currentSlideIndex
          ? {
              ...slide,
              shapes: slide.shapes.map((shape, j) => ({
                ...shape,
                paragraphs: shape.paragraphs.map((p, k) => ({
                  ...p,
                  text: translatedSlide.shapes[j].paragraphs[k].text,
                })),
              })),
            }
          : slide
      );

      setSlides(newSlides);
      alert("翻訳完了");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // --------------------
  // ▼ 保存（現在のスライドだけ）
  // --------------------
  const handleSave = async () => {
    if (!slides || slides.length === 0) return alert("保存対象がありません");
  
    const currentSlide = slides[currentSlideIndex];
  
    const payload = {
      selectedFilePath: filepath,
      slide_index: currentSlideIndex,
      shapes: currentSlide.shapes.map((s, i) => ({
        shape_index: i,
        text: s.paragraphs?.map(p => p.text).join("\n") || "",
      })),
    };
  
    const res = await fetch("http://127.0.0.1:8000/saveppt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    const data = await res.json();
    console.log(data);
    alert("保存完了");
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

      {/* before / after */}
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

      {/* AFTER */}
      {mode === "after" && (
        <textarea
          id="after"
          className="custom-textarea-after"
          value={afterText}
          onChange={(e) => setAfterText(e.target.value)}
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
