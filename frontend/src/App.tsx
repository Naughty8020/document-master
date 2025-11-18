import React, { useState } from 'react';
import './App.css'; // スタイルファイルがある場合

// ここではダミーのイベントハンドラを定義しますが、
// 実際のElectron/APIロジックはここで実装または呼び出します。

function App() {
  // --- 状態管理 ---
  const [filePath, setFilePath] = useState('');
  const [slideNumber, setSlideNumber] = useState(0);
  const [fileContent, setFileContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  
  // スライドナビゲーションのダミー値
  const totalSlides = 5; 

  // --- イベントハンドラ ---
  
  const handleSelectFile = () => {
    // 実際のロジック: Electron/IPC (main process)経由でファイル選択ダイアログを開く
    console.log("ファイル選択ボタンがクリックされました");
    // 例: setFilePath('/path/to/selected/file.pptx');
    // 例: setFileContent('選択したファイルの内容をここにロードします。');
  };

  const handlePrev = () => {
    setSlideNumber(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setSlideNumber(prev => Math.min(totalSlides - 1, prev + 1));
  };
  
  const handleTranslate = () => {
    // 実際のロジック: FastAPI /translate_text エンドポイントを呼び出す
    console.log("翻訳ボタンがクリックされました");
    // 例: setTranslatedContent('翻訳が完了しました。');
  };

  const handleSave = () => {
    // 実際のロジック: FastAPI /update_slide エンドポイントを呼び出す
    console.log("保存ボタンがクリックされました");
  };

  // --- JSX (レンダリング) ---
  return (
    <div>
      <h1>Hello from Electron renderer!</h1>
      
      {/* ファイル選択ボタン */}
      <button id="selectFileBtn" onClick={handleSelectFile}>
        ファイル選択
      </button>

      {/* ページネーションボタン */}
      <div>
        <button id="prevBtn" onClick={handlePrev} disabled={slideNumber === 0}>
          ← 前
        </button>
        <button id="nextBtn" onClick={handleNext} disabled={slideNumber === totalSlides - 1}>
          次 →
        </button>
      </div>

      {/* ファイル情報とスライド番号の表示 */}
      <p id="filePathLabel">パス: {filePath || 'ファイルが選択されていません'}</p>
      <p id="slideNumber">
        スライド: {slideNumber + 1} / {totalSlides}
      </p>
      
      {/* 翻訳元テキストエリア */}
      <textarea
        id="fileContent"
        rows={15} 
        cols={60} 
        style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        placeholder="ここにファイルの内容が表示されます..."
      />

      {/* 翻訳先テキストエリア */}
      <textarea
        id="translatedContent" 
        rows={15} 
        cols={60} 
        style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}
        value={translatedContent}
        onChange={(e) => setTranslatedContent(e.target.value)}
        placeholder="翻訳結果がここに表示されます..."
      />

      {/* 翻訳・保存ボタン */}
      <button id ="translateBtn" onClick={handleTranslate}>
        翻訳
      </button>
      
      <button id="saveBtn" onClick={handleSave}>
        保存
      </button>
    </div>
  );
}

export default App;