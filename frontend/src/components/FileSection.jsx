import React from "react";

export default function FileSection({
  fileSelected,
  setFileSelected,
  selectedFileName,
  setSelectedFileName,
  fileInputRef,
  setSlides,
  setSlidesData,
  setSelectedFilePath,
  setCurrentIndex,
  textAreaRef,
}) {
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFileName(e.target.files[0].name);
      setFileSelected(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      setSelectedFileName(e.dataTransfer.files[0].name);
      setFileSelected(true);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSelectFile = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/get_file");
      const data = await res.json();
      setSlides(data.slides);
      setSlidesData(data);
      setSelectedFilePath(data.path);
      setSelectedFileName(data.filename || "無題");
      setFileSelected(true);
      setCurrentIndex(0);
      // 初期スライド表示はTextAreaで行う
      if (textAreaRef.current) {
        textAreaRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="file-section">
      <div className="alert-info">
        <span className="alert-icon">ℹ️</span>
        <span className="alert-text">
          翻訳したいファイルをドラッグ＆ドロップ<br />
          またはファイルを選択
        </span>
      </div>

      <div id="dropArea" onDrop={handleDrop} onDragOver={handleDragOver}>
        ここにファイルをドラッグ＆ドロップ
      </div>

      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <button onClick={() => fileInputRef.current.click()} id="selectFileBtn">
        ファイルを選択
      </button>
      
    </div>
  );
}
