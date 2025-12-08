import React from "react";
import "../css/fileSection.css";

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
  handleSelectFile  
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
      <button onClick={handleSelectFile} id="selectFileBtn">
  ファイルを選択
</button>

        
      
    </div>
  );
}
