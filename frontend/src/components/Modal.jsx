import React from "react";

export default function Modal({ closeAndMove }) {
  return (
    <div className="modal show">
      <div className="modal-content">
        <button className="modal-close-x" onClick={closeAndMove}>
          ×
        </button>

        <p>
          ファイルが選択されていません。<br />
          ページを移動する前に、ファイルを選択してください。
        </p>

        <button id="modal-close-btn" onClick={closeAndMove}>
          OK
        </button>
      </div>
    </div>
  );
}

