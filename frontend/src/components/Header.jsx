import React from "react";

export default function Header({ title, selectedFileName, slides, currentIndex, textAreaRef, setSlides }) {
  const handleSave = async () => {
    if (!slides.length) return;
    const currentShapes = slides[currentIndex].shapes;
    const payload = {
      slide_index: currentIndex,
      shapes: currentShapes.map((s, i) => ({
        shape_index: i,
        text: s.paragraphs?.map((p) => p.text).join("\n") ?? "",
      })),
    };
    const res = await fetch("http://127.0.0.1:8000/saveppt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("save result:", data);
  };

  return (
    <header id="topHeader">
      <div className="header-title">{title}</div>
      <div className="header-filename">{selectedFileName}</div>
      <button className="header-save-btn" onClick={handleSave}>
        保存
      </button>
    </header>
  );
}
