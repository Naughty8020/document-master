import React, { useState } from "react";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import "../css/translate.css";
import { useTranslateSetting } from "../context/TranslateSettingContext";


export default function TranslateSection({
  slides,
  setSlides,
  TranslateDate,
  filepath,
}) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mode, setMode] = useState("before");

  // after をスライドごとに保持
  const [afterTexts, setAfterTexts] = useState([]);

  // 翻訳中フラグ
  const [isTranslating, setIsTranslating] = useState(false);
  const { translateMode } = useTranslateSetting();

  console.log(translateMode);


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

  // ------------------------
  // 全スライド翻訳
  // ------------------------
  const handleTranslate = async () => {
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

      // after texts 格納
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

      // slides を上書き
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

  // ------------------------
  // 選択中スライドだけ翻訳
  // ------------------------
  const selectedTranslate = async () => {
    if (!slides || slides.length === 0) return alert("翻訳対象がありません");

    const targetSlide = slides[currentSlideIndex];

    try {
      setIsTranslating(true);

      const res = await fetch("http://127.0.0.1:8000/translate_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: [targetSlide] }),
      });

      const data = await res.json();
      const translated = data.translated_text.slides[0];

      // afterTexts 更新
      const converted =
        translated.shapes
          .map(shape =>
            shape.paragraphs
              .map(p => p.text.trim())
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n");

      const newAfter = [...afterTexts];
      newAfter[currentSlideIndex] = converted;
      setAfterTexts(newAfter);

      // slides の1枚だけ更新
      const newSlides = [...slides];
      newSlides[currentSlideIndex] = {
        ...targetSlide,
        shapes: targetSlide.shapes.map((shape, j) => ({
          ...shape,
          paragraphs: shape.paragraphs.map((p, k) => ({
            ...p,
            text: translated.shapes[j].paragraphs[k].text,
          })),
        })),
      };

      setSlides(newSlides);

      alert("翻訳完了");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // ------------------------
  // 保存
  // ------------------------
  const handleSave = async () => {
    if (!slides || slides.length === 0) return alert("保存対象がありません");

    // after の最新値を slides に反映
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

      const data = await res.json();
      console.log("save result:", data);
      alert("保存完了");
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました");
    }
  };

  // ------------------------
// DOCX 保存
// ------------------------
const handleSaveDocx = async () => {
  if (!slides || slides.length === 0) return alert("保存対象がありません");

  // 保存するチャンクだけを作成
  const chunks = slides.map((slide, i) => {
    // afterTexts に翻訳済みテキストがある場合はそれを使い、なければ元のテキスト
    const text = afterTexts[i] !== undefined
      ? afterTexts[i]  // 更新されたチャンクのみ反映
      : slide.shapes
          .map(shape =>
            shape.paragraphs
              .map(p => p.text)
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n");
    return text;
  });

  const payload = {
    selectedFilePath: filepath,
    chunks: chunks
  };

  try {
    const res = await fetch("http://127.0.0.1:8000/savedocx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("save DOCX result:", data);

    if (data.status === "ok") {
      alert("DOCX 保存完了");
    } else {
      alert("DOCX 保存失敗: " + data.message);
    }
  } catch (err) {
    console.error("DOCX 保存エラー:", err);
    alert("DOCX 保存に失敗しました");
  }
};


// 保存ボタンを切り替える関数
const renderSaveButton = () => {
  if (!filepath) return null;

  const ext = filepath.split('.').pop().toLowerCase();

  if (ext === "ppt" || ext === "pptx") {
    return (
      <button
        id="saveBtn"
        className="header-save-btn"
        onClick={handleSave}
        disabled={isTranslating}
      >
        保存
      </button>
    );
  } else if (ext === "docx") {
    return (
      <button
        onClick={handleSaveDocx}
        disabled={isTranslating}
      >
        DOCX 保存
      </button>
    );
  }

  return null;
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
          marginTop: "0px",
          marginBottom: "2px",
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
            color: mode === "after" ? "rad" : "#444",
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
            marginTop: "2px",
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
            marginTop: "2px",
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
  
  <div style={{ textAlign: "right", marginTop: "10px" }}>
  {renderSaveButton()}

  {translateMode === "all" && (
    <button
      id="translateBtn"
      className="header-save-btn"
      onClick={handleTranslate}
      disabled={isTranslating}
    >
      {isTranslating ? "翻訳中…" : "全スライド翻訳"}
    </button>
  )}

  {translateMode === "selected" && (
    <button
      id="translateBtnSelected"
      className="header-save-btn"
      onClick={selectedTranslate}
      disabled={isTranslating}
    >
      {isTranslating ? "翻訳中…" : "選択スライド翻訳"}
    </button>
  )}
</div>




</div>

   
  );
  
}
