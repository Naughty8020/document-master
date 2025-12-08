import React, { useRef, useState } from "react";
import "../css/insert.css";
import { useTranslateSetting } from "../context/TranslateSettingContext";

export default function TextareaSection({ filename }) {
  const textAreaRefBefore = useRef(null);
  const textAreaRefAfter = useRef(null);
  console.log("TextareaSection filename:", filename);
  const isPPTX = filename?.toLowerCase().endsWith(".pptx");

  const [pptxPosition, setPptxPosition] = useState({
    left: 1,
    top: 1,
    width: 5,
    height: 2,
  });

  const [isTranslating, setIsTranslating] = useState(false);

  const { language } = useTranslateSetting();

  // ---------------------
  // 🔵 翻訳
  // ---------------------
  const handleTranslate = async () => {
    const input = textAreaRefBefore.current.value;
    if (!input.trim()) return alert("翻訳対象のテキストがありません");

    setIsTranslating(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/insert-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          target_language: language,
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        // Ref に直接書き込む
        textAreaRefAfter.current.value = data.translated_text;
      } else {
        alert("翻訳に失敗しました: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("翻訳に失敗しました");
    } finally {
      setIsTranslating(false);
    }
  };

  // 挿入ボタンのクリック処理
const handleInsertUnified = async () => {
  const ext = filename?.split(".").pop().toLowerCase();
  const text = textAreaRefAfter.current.value;

  try {
    if (ext === "docx") {
      // DOCX用API
      await fetch("http://127.0.0.1:8000/insert-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } else if (ext === "ppt" || ext === "pptx") {
      // PPTX用API
      await fetch("http://127.0.0.1:8000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          left: pptxPosition.left,
          top: pptxPosition.top,
          width: pptxPosition.width,
          height: pptxPosition.height,
        }),
      });
    } else {
      return alert("対応していないファイル形式です");
    }

    alert("挿入完了");
  } catch (err) {
    console.error("insert error:", err);
    alert("挿入失敗");
  }
};


  return (
    <div id="textarea-section" style={{ padding: "20px" }}>
      <div className="translate-vertical">
        <div className="translate-box">
          <h3 className="insert-title">入力</h3>
          
          
          <textarea
            ref={textAreaRefBefore}
            className="translate-textarea"
            placeholder="ここに翻訳したいテキスト入力"
          />

<div className="line-preview-box">
        {/* <ul>
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul> */}
      </div>
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button className="translate-insert" onClick={handleTranslate}>
              翻訳する
            </button>
          </div>
        </div>

        <div className="arrow-box">
          <span className="arrow-icon">⬇</span>
        </div>

        <div className="translate-box">
          <h3 className="translate-title">翻訳結果</h3>
          <textarea
            ref={textAreaRefAfter}
            className="translate-textarea"
            placeholder="翻訳結果が表示"
          />
        </div>
      </div>

      {/* PPTX 挿入位置 */}
      {isPPTX && (
        <>
          <div className="pptx-card" style={{ marginTop: "20px" }}>
            <h3>📐 PPTX テキスト挿入位置</h3>
            <div className="pptx-grid">
              {["left", "top", "width", "height"].map((key) => (
                <div className="pptx-item" key={key}>
                  <label>{key}</label>
                  <input
                    type="number"
                    value={pptxPosition[key]}
                    step="0.1"
                    onChange={(e) =>
                      setPptxPosition((prev) => ({
                        ...prev,
                        [key]: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="info-alert" style={{ marginTop: "20px" }}>
            <span className="icon-alert">ℹ️</span>
            <span className="text-alert">
              デフォルトサイズ（PowerPoint標準）
              <br />
              通常の標準(4:3) → Left:10インチ × Top:7.5インチ
              <br />
              ワイドスクリーン(16:9) → Left:13.333インチ × Top:7.5インチ
              <br />
              Width（textboxの横幅）
              <br />
              Height（textboxの縦幅）
              <br />
              1インチ=2.54センチ
              <br />
              <span className="alert-danger-text">
                ※この基準を超えるとスライドからはみ出す可能性があります。
              </span>
            </span>
          </div>
        </>
      )}

<div id="insert-btn-container">
  <button className="insert-btn" onClick={handleInsertUnified}>
    挿入する
  </button>
</div>


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
    </div>
  );
}
