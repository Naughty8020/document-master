import React, { createContext, useContext, useState } from "react";

const TranslateSettingContext = createContext();

export function TranslateSettingProvider({ children }) {
  const [translateMode, setTranslateMode] = useState("selected"); 
  const [language, setLanguage] = useState("en");
  // "all" = 全部翻訳, "selected" = 選択スライドのみ翻訳

  return (
    <TranslateSettingContext.Provider value={{ translateMode, setTranslateMode , language, setLanguage }}>
      {children}
    </TranslateSettingContext.Provider>
  );
}

export function useTranslateSetting() {
  return useContext(TranslateSettingContext);
}
