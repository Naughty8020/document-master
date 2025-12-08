import React from "react";
import FileOpenIcon from '@mui/icons-material/FolderOpen';
import TranslateIcon from '@mui/icons-material/Translate';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Sidebar({ handleMenuClick, currentPage }) {
  return (
    <aside id="sidebar">
      <h2 className="sidebar-title">Document Master</h2>

      <div
        className={`menu-div ${currentPage === "file-section" ? "current" : ""}`}
        onClick={() => handleMenuClick("file-section")}
      >
        <FileOpenIcon className="menu-icon" />
        <span className="menu-item">ファイル選択</span>
      </div>

      <div
        className={`menu-div ${currentPage === "translate-section" ? "current" : ""}`}
        onClick={() => handleMenuClick("translate-section")}
      >
        <TranslateIcon className="menu-icon" />
        <span className="menu-item">翻訳</span>
      </div>

      <div
        className={`menu-div ${currentPage === "textarea-section" ? "current" : ""}`}
        onClick={() => handleMenuClick("textarea-section")}
      >
        <EditNoteIcon className="menu-icon" />
        <span className="menu-item">入力</span>
      </div>

      <div
        className={`menu-div ${currentPage === "setting-section" ? "current" : ""}`}
        onClick={() => handleMenuClick("setting-section")}
      >
        <SettingsIcon className="menu-icon" />
        <span className="menu-item">設定</span>
      </div>
    </aside>
  );
}
