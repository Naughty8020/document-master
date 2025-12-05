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
  const [selectedLines, setSelectedLines] = useState([]);
  
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

  // AFTER テキスト（スライド切り替え時更新）
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

  // ▼ 翻訳
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

  // ▼ 保存
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

  // ▼ 部分置換（PySide の replace_btn と同じ役割）
  const handleReplace = () => {
    // ここは必要に応じて自由に書き換えてOK
    // 今は例として "before" → "after" へ置換
    const newText = afterText.replace(/before/gi, "after");
    setAfterText(newText);
  };

  return (
    <div id="translate-section" className="page">

      {/* 翻訳中モーダル */}
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

      {/* スライド一覧 */}
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

{mode === "after" && (
        <div style={{ marginTop: "10px" }}>

          {/* 編集テキスト入力欄 */}
          <textarea
            id="after"
            className="custom-textarea-after"
            value={afterText}
            onChange={(e) => setAfterText(e.target.value)}
            style={{
              width: "100%",
              height: "200px",
              border: "1px solid #ccc",
              padding: "8px",
              boxSizing: "border-box",
              resize: "vertical",
              backgroundColor: "#fff",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
            disabled={isTranslating}
          />
          
          {/* -------------------------------------- */}
          {/* 一括置換ボタン */}
          <button
              onClick={() => {
                  if (selectedLines.length === 0) {
                      alert("置換対象の行を選択してください。");
                      return;
                  }

                  const lines = afterText.split("\n");
                  
                  // 選択された行のみを置換する処理
                  const newText = lines
                      .map((l, i) =>
                          selectedLines.includes(i) ? l.replace(/before/gi, "after") : l
                      )
                      .join("\n");

                  setAfterText(newText);
                  // 処理後に選択を解除
                  setSelectedLines([]);
              }}
              disabled={isTranslating || selectedLines.length === 0}
              style={{
                  marginTop: "10px",
                  padding: "8px 15px",
                  borderRadius: "6px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  opacity: selectedLines.length === 0 ? 0.6 : 1,
              }}
          >
              選択した {selectedLines.length} 行を一括で "before" → "after" に置換
          </button>
          {/* -------------------------------------- */}

          {/* テキスト行ごとの置換リスト */}
          <div
            style={{
              marginTop: "14px",
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "6px",
              background: "#fafafa",
            }}
          >
            {afterText.split("\n").map((line, index) => {
                // 選択状態の切り替え関数
                const toggleLineSelection = () => {
                    if (selectedLines.includes(index)) {
                        setSelectedLines(selectedLines.filter(i => i !== index));
                    } else {
                        setSelectedLines([...selectedLines, index]);
                    }
                };

                const isSelected = selectedLines.includes(index);

                return (
                    <div
                        key={index}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            
                            background: isSelected ? "#e0f7fa" : "#fff", // 選択された行をハイライト
                            borderRadius: "4px",
                            border: "0px solid #ddd",
                            marginBottom: "0px", // 行間にスペース
                            padding: "0px 8px",
                            cursor: "pointer", // クリックできることを示す
                        }}
                        onClick={toggleLineSelection} // 行全体をクリックで選択できるように
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {/* チェックボックス */}
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={toggleLineSelection} 
                                style={{ marginRight: "10px" }}
                            />
                            <span>{line || "(空行)"}</span>
                        </div>

                        {/* 元の「+」ボタンは削除しました。必要ならここに戻してください。 */}

                    </div>
                );
            })}
          </div>
        </div>
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
