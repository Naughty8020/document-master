import React, { useState } from "react";
import { useTranslateSetting } from "../context/TranslateSettingContext";

export default function SettingSection() {
  const [model, setModel] = useState("gpt-4");
  const [language, setLanguage] = useState("ja");
  const [hardware, setHardware] = useState("cpu");
  const [saved, setSaved] = useState(false);
  const [hover, setHover] = useState(false);

  const { translateMode, setTranslateMode } = useTranslateSetting();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
  style={{
    background: "#ffffff", // 白いカード
    padding: "30px",        // padding大きく
    borderRadius: "12px",
    marginBottom: "30px",   // 間隔大きく
    boxSizing: "border-box",
    width: "100%",
    minHeight: "80vh",      // 高さ大きく
  }}
>
  <div style={{ marginBottom: "20px" }}> {/* 間隔広げる */}
    <label
      style={{
        display: "block",
        fontSize: "20px",    // 大きめ文字
        fontWeight: 700,
        marginBottom: "10px",
        color: "#24292f"
      }}
    >
      翻訳モード
    </label>

    <select
      value={translateMode}
      onChange={(e) => setTranslateMode(e.target.value)}
      style={{
        width: "100%",
        maxWidth: "400px",   // 幅大きく
        padding: "10px 12px", // 高さ大きく
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        background: "#f6f8fa",
        fontSize: "16px",    // 文字大きく
        color: "#24292f"
      }}
    >
      <option value="all">全スライド翻訳</option>
      <option value="selected">選択スライドのみ翻訳</option>
    </select>
    <p style={{ color: "blue", marginTop: "8px" }}>※全スライドを翻訳する場合時間がかかることがあります。</p>
  </div>

  {/* モデル */}
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor="modelSelect"
      style={{
        display: "block",
        fontSize: "20px",
        fontWeight: 700,
        marginBottom: "10px",
        color: "#24292f"
      }}
    >
      モデル
    </label>
    <select
      id="modelSelect"
      value={model}
      onChange={(e) => setModel(e.target.value)}
      style={{
        width: "100%",
        maxWidth: "400px",
        padding: "10px 12px",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        background: "#f6f8fa",
        fontSize: "16px",
        color: "#24292f"
      }}
    >
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-5">GPT-5</option>
    </select>
  </div>

  {/* 言語 */}
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor="languageSelect"
      style={{
        display: "block",
        fontSize: "20px",
        fontWeight: 700,
        marginBottom: "10px",
        color: "#24292f"
      }}
    >
      翻訳言語
    </label>
    <select
      id="languageSelect"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        width: "100%",
        maxWidth: "400px",
        padding: "10px 12px",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        background: "#f6f8fa",
        fontSize: "16px",
        color: "#24292f"
      }}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
      <option value="zh">中文</option>
      <option value="ko">한국어</option>
    </select>
  </div>

  {/* ハードウェア */}
  <div style={{ marginBottom: "30px" }}>
    <label
      htmlFor="hardwareSelect"
      style={{
        display: "block",
        fontSize: "20px",
        fontWeight: 700,
        marginBottom: "10px",
        color: "#24292f"
      }}
    >
      処理モード
    </label>
    <select
      id="hardwareSelect"
      value={hardware}
      onChange={(e) => setHardware(e.target.value)}
      style={{
        width: "100%",
        maxWidth: "400px",
        padding: "10px 12px",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        background: "#f6f8fa",
        fontSize: "16px",
        color: "#24292f"
      }}
    >
      <option value="cpu">CPU</option>
      <option value="gpu">GPU</option>
      <option value="auto">AUTO（自動選択）</option>
    </select>
  </div>

  <button
    id="saveSettingBtn"
    onClick={handleSave}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    style={{
      padding: "12px 24px",
      background: hover ? "#1a6aff" : "#195ff2",
      color: "#fff",
      border: "1px solid rgba(27,31,36,0.15)",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "16px"
    }}
  >
    設定を保存
  </button>

  <p
    style={{
      color: "#195ff2",
      marginTop: "15px",
      fontSize: "16px",
      display: saved ? "block" : "none"
    }}
  >
    設定を保存しました！
  </p>
</div>

  );
}
