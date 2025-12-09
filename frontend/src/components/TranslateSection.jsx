import React, { useState, useEffect, useCallback } from "react";
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

  // 翻訳前のオリジナルテキストを保持する (Undo機能用)
  // 構造: { slideIndex: { 'sIndex-pIndex': 'Original Text', ... }, ... }
  const [originalParagraphTexts, setOriginalParagraphTexts] = useState({});

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

  // --- Undo機能のための初期化 ---
  // slides, currentSlideIndex が変更されたときにオリジナルテキストを保持する
  const initializeOriginalTexts = useCallback(() => {
    if (!slides || slides.length === 0) return;

    // 🌟 【修正ポイント】既に現在のスライドのオリジナルデータが存在する場合は何もしない
    // これにより、翻訳で slides が更新されてもオリジナルは上書きされない
    if (originalParagraphTexts[currentSlideIndex]) {
        return; 
    }

    const currentSlide = slides[currentSlideIndex];
    const originalTexts = {};

    currentSlide?.shapes?.forEach((shape, sIndex) => {
      shape.paragraphs?.forEach((p, pIndex) => {
        const key = `${sIndex}-${pIndex}`;
        if (p.text && p.text.trim() !== "") {
          originalTexts[key] = p.text;
        }
      });
    });

    setOriginalParagraphTexts(prev => ({
      ...prev,
      [currentSlideIndex]: originalTexts
    }));
  }, [slides, currentSlideIndex, originalParagraphTexts]);


  useEffect(() => {
    // slides が初めてロードされたとき、またはスライドが切り替わったときに実行
    initializeOriginalTexts();
    
    // スライド切り替え時に選択状態もリセット
    setSelectedIndexes([]);
    setSelectedAfterIndexes([]);
  }, [slides, currentSlideIndex, initializeOriginalTexts]);
  // -----------------------------


  // ------------------------
  // 全選択 / 全選択解除 (Before/After 共通ロジック)
  // ------------------------
  const toggleAllSelect = () => {
    const currentSlideKeys = getAllParagraphKeys(slides[currentSlideIndex]);
    
    // mode に応じて対象の state と setter を選択
    const [currentIndexes, setCurrentIndexes] = mode === "before" 
      ? [selectedIndexes, setSelectedIndexes]
      : [selectedAfterIndexes, setSelectedAfterIndexes];
      
    const isAllSelected = currentSlideKeys.length > 0 && currentSlideKeys.every(key => currentIndexes.includes(key));

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
      // afterTexts はスライドの全テキストを結合した形式
      const newAfterText = newTargetSlide.shapes
        ?.map(shape =>
          shape.paragraphs
            ?.map(p => p.text.trim())
            .filter(Boolean)
            .join("\n")
        )
        .filter(Boolean)
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
  // 翻訳前の状態に戻す (Undo機能)
  // ------------------------
  const handleRevertToOriginal = () => {
    const originalTextsForSlide = originalParagraphTexts[currentSlideIndex];
    if (!originalTextsForSlide) {
      return alert("元に戻せる翻訳前の状態がありません。");
    }

    const currentSlide = slides[currentSlideIndex];
    const newSlides = [...slides];
    const revertedSlide = JSON.parse(JSON.stringify(currentSlide));
    
    // スライドのテキストをオリジナルに戻す
    revertedSlide.shapes.forEach((shape, sIndex) => {
      shape.paragraphs.forEach((p, pIndex) => {
        const key = `${sIndex}-${pIndex}`;
        if (originalTextsForSlide[key] !== undefined) {
          p.text = originalTextsForSlide[key];
        }
      });
    });
    
    newSlides[currentSlideIndex] = revertedSlide;
    setSlides(newSlides);

    // afterTexts もリセット (オリジナルのテキストで埋める)
    const originalAfterText = revertedSlide.shapes
        ?.map(shape =>
          shape.paragraphs
            ?.map(p => p.text.trim())
            .filter(Boolean)
            .join("\n")
        )
        .filter(Boolean)
        .join("\n\n") || "";
        
    const newAfterTexts = [...afterTexts];
    newAfterTexts[currentSlideIndex] = originalAfterText;
    setAfterTexts(newAfterTexts);

    // 選択状態を解除
    setSelectedIndexes([]);
    setSelectedAfterIndexes([]);

    alert(`スライド ${currentSlideIndex + 1} の翻訳を元に戻しました。`);
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
            // ※ここでは afterTexts の lineIndex と shape/paragraph の対応が1:1であることを前提にしている
            //   この対応付けロジックが複雑なPPT構造で常に正確とは限らない点に注意
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
    // NOTE: これは非推奨のPPT処理パターン。afterTextsの内容を shapes/paragraphs に正確に戻す必要があります。
    if (afterTexts[currentSlideIndex]) {
        const afterLines = afterTexts[currentSlideIndex].split(/\n+/).filter(Boolean); // 改行で分割し空行を除去
        let lineIdx = 0;
        
        finalTargetSlide.shapes.forEach((s) => {
            s.paragraphs?.forEach((p) => {
                // p.text が空でない場合のみ、afterLines からテキストを割り当てる
                if (p.text && p.text.trim() !== "") {
                    if (lineIdx < afterLines.length) {
                        p.text = afterLines[lineIdx];
                    }
                    lineIdx++;
                }
            });
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
          .filter(Boolean) // ここで空文字列になったものを除外
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
        style={{
          // 💡 青いボタンにするためのスタイル
          backgroundColor: '#1a6aff', // 鮮やかな青
          color: 'white',             // 文字色を白に
          border: 'none',             // 境界線を削除
          padding: '10px 20px',       // パディングを追加
          borderRadius: '8px',        // 角を丸くする
          cursor: 'pointer',          // マウスオーバー時にカーソルをポインターに
          fontWeight: 'bold',         // 文字を太く
          transition: 'background-color 0.3s ease', // ホバー時の滑らかな変化のため
          // disabled時のスタイルも考慮するとさらに良いですが、基本形は上記です。
        }}
      >
        DOCX 保存
      </button>
    );
  }
  return null;
};


  return (
    <div id="translate-section" className="page">
  
      {/* ▼ 翻訳中モーダル (復元) */}
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
        <div style={{ marginBottom: "0px", textAlign: "right" }}>
          {mode === "before" && (() => {
            // 🌟 修正: 全選択ボタンの表示テキストの判定ロジックを修正
            const currentSlideKeys = getAllParagraphKeys(slides[currentSlideIndex]);
            const selectedCount = selectedIndexes.length;
            const totalCount = currentSlideKeys.length;

            // 選択されたキーのセットが、現在のスライドの全キーのセットと一致するかどうかを判定する
            const isAllSelected = totalCount > 0 && selectedCount === totalCount && 
                                  currentSlideKeys.every(key => selectedIndexes.includes(key));
            
            return (
              <button 
                onClick={toggleAllSelect} 
                disabled={isTranslating}
                style={{
                  padding: "4px 8px", 
                  borderRadius: "4px", 
                  border: "1px solid #4a90ff", 
                  background: "#f0f8ff", 
                  cursor: "pointer",
                  fontSize: "12px",
                  
                }}
              >
                {isAllSelected ? "全選択解除" : "全選択"}
              </button>
            );
          })()}
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
                  
                  // 🌟 変更検出ロジック (前回修正)
                  const originalText = originalParagraphTexts[currentSlideIndex]?.[key];
                  const isModified = originalText && originalText.trim() !== p.text.trim(); 

                  // 🌟 AFTERモードの色決定ロジック (前回修正)
                  const textColor = mode === "after" 
                      ? (isModified ? "red" : "#333") // AFTERモード: 変更ありなら赤、なければ黒
                      : "#333";                        // BEFOREモード: 黒
  
                  return (
                    <li
                      key={key}
                      // 🌟 liタグのインラインスタイル
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
                      {/* 選択ボタン: modeが "before" の時のみ表示 */}
                      {mode === "before" && ( 
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
                      )}

                      {/* 🌟 スタイルの適用 */}
                      <span style={{ color: textColor }}>
                        {p.text}
                      </span>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </ul>
      </div>
  
  <div style={{ textAlign: "right", marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
  
  {/* 翻訳前の状態に戻すボタン (Undo機能) */}
  {(mode === "before" || mode === "after") && (
      <button
          id="revertBtn"
          className="header-save-btn"
          onClick={handleRevertToOriginal}
          disabled={isTranslating || !originalParagraphTexts[currentSlideIndex]}
          style={{ backgroundColor: "#dc2f2f", color: "#fff", border: "1px solid #ccc" }}
      >
          元に戻す
      </button>
  )}

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