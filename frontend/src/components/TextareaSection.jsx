import React from "react";

export default function TextareaSection({
  slides,
  currentIndex,
  textAreaRefBefore,
  textAreaRefAfter,
  pptxPosition,
  setPptxPosition,
  onInsert
}) {
  return (
    <div id="textarea-section" style={{ padding: "20px" }}>
      {/* 左右2カラム */}
      <div className="translate-container">
        <div className="translate-column">
          <h3>英語入力</h3>
          <textarea
            id="inputText"
            className="translate-textarea"
            placeholder="Enter text"
            ref={textAreaRefBefore}
          />
        </div>

        <div className="translate-column">
          <h3>翻訳結果（日本語）</h3>
          <textarea
            id="outputText"
            className="translate-textarea"
            placeholder="テキストが表示"
            ref={textAreaRefAfter}
          />
        </div>
      </div>

      {/* PPTXカード */}
      <div className="pptx-card" style={{ marginTop: "20px" }}>
        <h3 className="pptx-card-title">📐 PPTX テキスト挿入位置</h3>
        <div className="pptx-grid">
          {["left", "top", "width", "height"].map((key) => (
            <div className="pptx-item" key={key}>
              <label htmlFor={`${key}-input`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}（インチ）
              </label>
              <input
                type="number"
                id={`${key}-input`}
                value={pptxPosition[key]}
                step="0.1"
                min={key === "left" || key === "top" ? 0 : undefined}
                max={key === "left" ? 15 : key === "top" ? 10 : undefined}
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

      {/* info-alert */}
      <div className="info-alert" style={{ marginTop: "20px" }}>
        <span className="icon-alert">ℹ️</span>
        <span className="text-alert">
          デフォルトサイズ（PowerPoint標準）<br />
          通常の標準(4:3) → Left:10インチ × Top:7.5インチ<br />
          ワイドスクリーン(16:9) → Left:13.333インチ × Top:7.5インチ<br />
          Width（textboxの横幅）<br />
          Height（textboxの縦幅）<br />
          1インチ=2.54センチ<br />
          <span className="alert-danger-text">
            ※この基準を超えるとスライドからはみ出す可能性があります。
          </span>
        </span>
      </div>

      {/* 挿入ボタン */}
      <div id="insert-btn-container">
        <button id="insert-btn" onClick={onInsert}>
          挿入する
        </button>
      </div>
    </div>
  );
}
