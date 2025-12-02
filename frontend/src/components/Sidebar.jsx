import React from "react";
import FileOpenIcon from '@mui/icons-material/FolderOpen';
import TranslateIcon from '@mui/icons-material/Translate';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Sidebar({ handleMenuClick }) {
  return (
    <aside id="sidebar">
      <h2 className="sidebar-title">Document Master</h2>

      <div className="menu-div" onClick={() => handleMenuClick("file-section")}>
        <FileOpenIcon />
        <span className="menu-item">ファイル選択</span>
      </div>

      <div className="menu-div" onClick={() => handleMenuClick("translate-section")}>
        <TranslateIcon />
        <span className="menu-item">翻訳</span>
      </div>

      <div className="menu-div" onClick={() => handleMenuClick("textarea-section")}>
        <EditNoteIcon />
        <span className="menu-item">入力</span>
      </div>

      <div className="menu-div" onClick={() => handleMenuClick("setting-section")}>
        <SettingsIcon />
        <span className="menu-item">設定</span>
      </div>
    </aside>
  );
}
