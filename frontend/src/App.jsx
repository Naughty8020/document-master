// App.js
import React, { useState, useRef } from "react";
import "./main.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FileSection from "./components/FileSection";
import TranslateSection from "./components/TranslateSection";
import TextareaSection from "./components/TextareaSection";
import SettingSection from "./components/SettingSection";
import Modal from "./components/Modal";
import { TranslateSettingProvider } from "./context/TranslateSettingContext";



export default function App() {
  const [currentPage, setCurrentPage] = useState("file-section");
  const [fileSelected, setFileSelected] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("選択中のファイル名なし");
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesData, setSlidesData] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [filepath, setFilepath] = useState("");

  const textAreaRef = useRef(null);
  const afterTextAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [pptxPosition, setPptxPosition] = useState({
    left: 2,
    top: 2,
    width: 4,
    height: 1.5,
  });

  const sectionTitles = {
    "file-section": "ファイル選択",
    "translate-section": "翻訳",
    "textarea-section": "入力",
    "setting-section": "設定",
  };

  const handleMenuClick = (target) => {
    if (!fileSelected && target !== "file-section" && target !== "setting-section") {
      setModalVisible(true);
      return;
    }
    setCurrentPage(target);
  };

  const closeModalAndMoveToFile = () => {
  setModalVisible(false);
  setCurrentPage("file-section"); 
};

const handleSelectFile = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/get_file");
      const data = await res.json();
      console.log("Fetched file data:", data);
      setSlides(data.slides);
      setSlidesData(data);
      setSelectedFilePath(data.path);
      setSelectedFileName(data.filename || "無題");
      setFilepath(data.path);
      setFileSelected(true);
      setCurrentIndex(0);
      // 初期スライド表示はTextAreaで行う

      setCurrentPage("translate-section");
      if (textAreaRef.current) {
        textAreaRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TranslateSettingProvider>
    <div>
      <Header
        title={sectionTitles[currentPage]}
        selectedFileName={selectedFileName}
        slides={slides}
        currentIndex={currentIndex}
        textAreaRef={textAreaRef}
        setSlides={setSlides}
      />
      <Sidebar handleMenuClick={handleMenuClick} />
      <div id="mainContent">
        {currentPage === "file-section" && (
          <FileSection
            fileSelected={fileSelected}
            setFileSelected={setFileSelected}
            selectedFileName={selectedFileName}
            setSelectedFileName={setSelectedFileName}
            fileInputRef={fileInputRef}
            setSlides={setSlides}
            setSlidesData={setSlidesData}
            setSelectedFilePath={setSelectedFilePath}
            setCurrentIndex={setCurrentIndex}
            textAreaRef={textAreaRef}
            handleSelectFile={handleSelectFile}
          />
        )}
        {currentPage === "translate-section" && (
          <TranslateSection slides={slides} setSlides={setSlides} afterTextAreaRef={afterTextAreaRef} TranslateDate={slidesData} filepath={filepath} setFilepath={setFilepath}/>
        )}
        {currentPage === "textarea-section" && (
         <TextareaSection
         slides={slides}
         currentIndex={currentIndex}
         textAreaRefBefore={textAreaRef}
         textAreaRefAfter={afterTextAreaRef}
         pptxPosition={pptxPosition}
         setPptxPosition={setPptxPosition}
         onInsert={() => console.log("挿入ボタン押下")}
        />
        )}
        {currentPage === "setting-section" && <SettingSection />}
      </div>
      {modalVisible && <Modal closeAndMove={closeModalAndMoveToFile} />}

    </div>
    </TranslateSettingProvider>
  );
}
