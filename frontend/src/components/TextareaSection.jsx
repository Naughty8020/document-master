import React, { useRef, useState } from "react";
import "../css/insert.css";

export default function TextareaSection() {
  const textAreaRefBefore = useRef(null);
  const textAreaRefAfter = useRef(null);

  const [pptxPosition, setPptxPosition] = useState({
    left: 1,
    top: 1,
    width: 5,
    height: 2,
  });

  // ---------------------
  // 🔵 翻訳 （/insert-translate）
  // ---------------------
  const handleTranslate = async () => {
    const input = textAreaRefBefore.current.value;

    try {
      const res = await fetch("http://127.0.0.1:8000/insert-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      // 翻訳結果を after テキストに入れる
      textAreaRefAfter.current.value = data.translated_text;
    } catch (err) {
      console.error("translate error:", err);
      alert("翻訳失敗");
    }
  };

  // ---------------------
  // 🔴 挿入 （/insert）
  // ---------------------
  const handleInsert = async () => {
    const payload = {
      text: textAreaRefAfter.current.value,
      left: pptxPosition.left,
      top: pptxPosition.top,
      width: pptxPosition.width,
      height: pptxPosition.height,
    };

    try {
      await fetch("http://127.0.0.1:8000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
    <h3>入力</h3>
    <textarea
      ref={textAreaRefBefore}
      className="translate-textarea"
      placeholder="ここに翻訳したいテキスト入力"
    />
  </div>

  {/* ▼ 矢印 */}
  <div className="arrow-box">
    <span className="arrow-icon">⬇</span>
  </div>

  <div className="translate-box">
    <h3>翻訳結果（日本語）</h3>
    <textarea
      ref={textAreaRefAfter}
      className="translate-textarea"
      placeholder="翻訳結果が表示"
    />
  </div>
</div>


      {/* 翻訳ボタン */}
      <div style={{ marginTop: "15px", textAlign: "right" }}>
        <button className="translate-insert" onClick={handleTranslate}>翻訳する</button>
      </div>

      {/* PPTX 挿入位置 */}
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
        <button className="insert-btn" onClick={handleInsert}>挿入する</button>
      </div>
    </div>
  );
}
