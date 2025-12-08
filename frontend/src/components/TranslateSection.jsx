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

  // after をスライドごとに保持 (保存ロジックで必要)
  const [afterTexts, setAfterTexts] = useState([]);

  // 翻訳中フラグ
  const [isTranslating, setIsTranslating] = useState(false);
  const { translateMode, language } = useTranslateSetting(); 

  // BEFORE モードでの選択状態
  const [selectedIndexes, setSelectedIndexes] = useState([]); 
  // AFTER モードでの選択状態 (新しく追加)
  const [selectedAfterIndexes, setSelectedAfterIndexes] = useState([]); 


  // --- Utility Functions ---
  const toggleSelector = () => {
    setIsSelectorOpen(!isSelectorOpen);
  };
  
  // スライド上のすべての段落キーを取得する関数
  const getAllParagraphKeys = (slide) => {
    const keys = [];
    slide?.shapes?.forEach((shape, sIndex) => {
      shape.paragraphs?.forEach((p, pIndex) => {
        if (p.text && p.text.trim() !== "") {
          keys.push(`${sIndex}-${pIndex}`);
        }
      });
    });
    return keys;
  };

  // ------------------------
  // 全選択 / 全選択解除 (Before/After 共通ロジック)
  // ------------------------
  const toggleAllSelect = () => {
    const currentSlideKeys = getAllParagraphKeys(slides[currentSlideIndex]);
    
    // mode に応じて対象の state と setter を選択
    const [currentIndexes, setCurrentIndexes] = mode === "before" 
      ? [selectedIndexes, setSelectedIndexes]
      : [selectedAfterIndexes, setSelectedAfterIndexes];
      
    const isAllSelected = currentSlideKeys.every(key => currentIndexes.includes(key));

    if (isAllSelected) {
      // 全選択解除
      setCurrentIndexes([]);
    } else {
      // 全選択
      setCurrentIndexes(currentSlideKeys);
    }
  };


  // ------------------------
  // 選択中スライドだけ翻訳
  // ------------------------
  const selectedTranslate = async () => {
    if (!slides || slides.length === 0 || selectedIndexes.length === 0) {
      return alert("翻訳対象がありません");
    }
  
    const targetSlide = slides[currentSlideIndex];
    
    // 1. 選択された段落とその位置情報のみを抽出
    const paragraphsToTranslate = [];
    targetSlide.shapes.forEach((shape, sIndex) => {
      shape.paragraphs.forEach((p, pIndex) => {
        const key = `${sIndex}-${pIndex}`;
        if (selectedIndexes.includes(key)) {
          paragraphsToTranslate.push({
            text: p.text,
            sIndex: sIndex, 
            pIndex: pIndex  
          });
        }
      });
    });
  
    try {
      setIsTranslating(true);
  
      const apiUrl = "http://127.0.0.1:8000/translate_texts"; 
  
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: paragraphsToTranslate.map(p => p.text), 
          language: language,
        }),
      });
  
      const data = await res.json();
      if (!data.translated_texts) throw new Error("翻訳結果がありません");
  
      const translatedTexts = data.translated_texts;
  
      // 2. 翻訳結果を元のスライドにピンポイントで適用
      const newSlides = [...slides];
      const newTargetSlide = JSON.parse(JSON.stringify(targetSlide)); 
  
      translatedTexts.forEach((tText, index) => {
          const originalP = paragraphsToTranslate[index];
          const s = originalP.sIndex;
          const p = originalP.pIndex;
          
          newTargetSlide.shapes[s].paragraphs[p].text = tText;
      });
  
      newSlides[currentSlideIndex] = newTargetSlide;
  
      // 3. afterTexts を更新
      const newAfterText = newTargetSlide.shapes
        ?.map(shape =>
          shape.paragraphs
            ?.map(p => p.text.trim())
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n") || "";

      const newAfterTexts = [...afterTexts];
      newAfterTexts[currentSlideIndex] = newAfterText;
      setAfterTexts(newAfterTexts);

      setSlides(newSlides);
      alert("選択行の翻訳が完了しました");
    } catch (err) {
    console.error(err);
    alert("翻訳に失敗しました");
  } finally {
    setIsTranslating(false);
  }
};
  

  // ------------------------
  // 保存 (選択された行のみ保存)
  // ------------------------
  const handleSave = async () => {
    if (!slides || slides.length === 0) return alert("保存対象がありません");

    let finalTargetSlide = slides[currentSlideIndex];

    if (mode === "after" && selectedAfterIndexes.length > 0) {
      // AFTERモードで選択行がある場合、その行のテキストを afterTexts に反映し、保存に使う
      
      const originalAfterText = afterTexts[currentSlideIndex] || "";
      let editedAfterTextLines = originalAfterText.split("\n");
      
      // slides[currentSlideIndex] の内容（最新の翻訳状態）を取得
      const currentSlide = slides[currentSlideIndex];
      let lineIndex = 0;

      // 選択された段落のテキストを afterTexts の対応する行にコピーする
      currentSlide.shapes.forEach((shape, sIndex) => {
        shape.paragraphs.forEach((p, pIndex) => {
          const key = `${sIndex}-${pIndex}`;
          
          if (p.text && p.text.trim() !== "") {
            // 選択されている場合、slides[currentSlideIndex]のテキストを使用
            if (selectedAfterIndexes.includes(key) && lineIndex < editedAfterTextLines.length) {
              editedAfterTextLines[lineIndex] = p.text.trim();
            }
            lineIndex++;
          }
        });
      });
      
      const newAfterText = editedAfterTextLines.join("\n");
      
      // afterTexts を更新（保存ペイロード生成用）
      const newAfterTexts = [...afterTexts];
      newAfterTexts[currentSlideIndex] = newAfterText;
      setAfterTexts(newAfterTexts);
    } 
    
    // finalTargetSlide のテキストを afterTexts の内容で上書き（保存ロジックの互換性維持のため）
    if (afterTexts[currentSlideIndex]) {
        const edited = afterTexts[currentSlideIndex].split("\n");
        finalTargetSlide.shapes.forEach((s, i) => {
            if (!edited[i]) return;
            if (s.paragraphs[0]) {
                s.paragraphs[0].text = edited[i];
            }
        });
    }


    const currentShapes = finalTargetSlide.shapes;

    const payload = {
      selectedFilePath: filepath,
      slide_index: currentSlideIndex,
      shapes: currentShapes.map((s, i) => ({
        shape_index: i,
        // ここで既に afterTexts の内容が slides に反映されていることを期待
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

  // afterTexts に翻訳済みテキストがある場合はそれを使い、なければ元のテキスト
  const chunks = slides.map((slide, i) => {
    const text = afterTexts[i] !== undefined
      ? afterTexts[i]  
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


const renderSaveButton = () => {
  if (!filepath) return null;
  if (mode !== "after") return null;

  const ext = filepath.split(".").pop().toLowerCase();

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
  
      {/* ▼ 翻訳中モーダル (省略) */}
      {isTranslating && (
        <div
          style={{ /* ... style ... */ }}
        >
          <div
            style={{ /* ... style ... */ }}
          >
            <div
              style={{ /* ... style ... */ }}
            />
  
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
              翻訳中…
            </div>
          </div>
        </div>
      )}
  
      {/* ▼ スライド一覧 (省略) */}
      <div style={{ position: "relative", display: "inline-block", marginTop: "15px" }}>
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
            color: mode === "before" ? "blue" : "#444",
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
            color: mode === "after" ? "red" : "#444",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
          disabled={isTranslating}
        >
          after
        </button>
      </div>
  
      {/* 選択ボタン / リスト本体 */}
      <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "4px" }}>
        
        {/* 全選択/解除ボタン */}
        <div style={{ marginBottom: "10px", textAlign: "right" }}>
          <button 
            onClick={toggleAllSelect} 
            disabled={isTranslating}
            style={{
              padding: "4px 8px", 
              borderRadius: "4px", 
              border: "1px solid #4a90ff", 
              background: "#f0f8ff", 
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {
              // mode に応じて対象の state を選択
              (mode === "before" ? selectedIndexes : selectedAfterIndexes).every(key => getAllParagraphKeys(slides[currentSlideIndex]).includes(key)) 
                ? "全選択解除" 
                : "全選択"
            }
          </button>
        </div>

        <ul>
            {slides[currentSlideIndex]?.shapes?.map((shape, sIndex) => (
              <React.Fragment key={sIndex}>
                {shape.paragraphs?.map((p, pIndex) => {
                  const key = `${sIndex}-${pIndex}`;
                  
                  // mode に応じて対象の state を選択
                  const currentSelectedIndexes = mode === "before" ? selectedIndexes : selectedAfterIndexes;
                  const currentSetSelectedIndexes = mode === "before" ? setSelectedIndexes : setSelectedAfterIndexes;

                  const selected = currentSelectedIndexes.includes(key);
  
                  if (!p.text || p.text.trim() === "") {
                    return null;
                  }
  
                  return (
                    <li
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        // 選択状態をハイライト
                        background: selected ? "#d0e7ff" : "transparent",
                        padding: "2px 4px",
                        borderRadius: "4px",
                      }}
                    >
                      {/* 選択ボタン */}
                        <button
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: "1px solid #555",
                            background: selected ? "#4a90ff" : "none",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            currentSetSelectedIndexes((prev) =>
                              selected
                                ? prev.filter((k) => k !== key)
                                : [...prev, key]
                            );
                          }}
                        />

                      <span style={{ color: mode === "after" ? "red" : "#333" }}>
                        {p.text}
                      </span>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </ul>
      </div>
  
  <div style={{ textAlign: "right", marginTop: "10px" }}>
  {renderSaveButton()}

  {translateMode === "all" && mode === "before" && (
  <button
    id="translateBtn"
    className="header-save-btn"
    onClick={() => alert("全スライド翻訳機能は現在コメントアウトされています")}
    disabled={isTranslating}
  >
    {isTranslating ? "翻訳中…" : "全スライド翻訳"}
  </button>
)}


  {translateMode === "selected" && mode ==="before" && (
    <button
      id="translateBtnSelected"
      className="header-save-btn"
      onClick={selectedTranslate}
      disabled={isTranslating || selectedIndexes.length === 0}
    >
      {isTranslating ? "翻訳中…" : "選択行を翻訳"}
    </button>
  )}
</div>


</div>

   
  );
  
}