import React, { useState } from "react";

export default function SettingSection() {
  const [model, setModel] = useState("gpt-4");
  const [language, setLanguage] = useState("ja");
  const [hardware, setHardware] = useState("cpu");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      id="setting-section"
      className="page"
      style={{ padding: "20px", boxSizing: "border-box" }}
    >
      <div
  style={{
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxSizing: "border-box",
    width: "100%",
    height: "100vh" // ← ここを 100% から 100vh に変更
  }}
>

        <h3
          style={{
            fontSize: "17px",
            marginBottom: "10px",
            color: "#24292f"
          }}
        >
          モデル選択
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <label
            htmlFor="modelSelect"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "6px",
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
              maxWidth: "300px",
              padding: "6px 8px",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              background: "#f6f8fa",
              fontSize: "14px",
              color: "#24292f"
            }}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-5">GPT-5</option>
          </select>
        </div>

        <h3
          style={{
            fontSize: "17px",
            marginBottom: "10px",
            color: "#24292f"
          }}
        >
          言語
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <label
            htmlFor="languageSelect"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "6px",
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
              maxWidth: "300px",
              padding: "6px 8px",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              background: "#f6f8fa",
              fontSize: "14px",
              color: "#24292f"
            }}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <h3
          style={{
            fontSize: "17px",
            marginBottom: "10px",
            color: "#24292f"
          }}
        >
          ハードウェア設定
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <label
            htmlFor="hardwareSelect"
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "6px",
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
              maxWidth: "300px",
              padding: "6px 8px",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              background: "#f6f8fa",
              fontSize: "14px",
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
          style={{
            padding: "8px 16px",
            background: "#195ff2",
            color: "#fff",
            border: "1px solid rgba(27,31,36,0.15)",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          設定を保存
        </button>

        <p
          style={{
            color: "#195ff2",
            marginTop: "10px",
            fontSize: "14px",
            display: saved ? "block" : "none",
            width: "100%",
            height: "30px"
          }}
        >
          設定を保存しました！
        </p>
      </div>
    </div>
  );
}
