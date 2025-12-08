import React, { createContext, useContext, useState } from "react";

const TranslateSettingContext = createContext();

export const TranslateSettingProvider = ({ children }) => {
  const [translateMode, setTranslateMode] = useState("selected");
  const [language, setLanguage] = useState("en"); // ← 言語をここで管理
  const [model, setModel] = useState("gpt-4");
  const [hardware, setHardware] = useState("cpu");

  return (
    <TranslateSettingContext.Provider
      value={{
        translateMode,
        setTranslateMode,
        language,
        setLanguage,
        model,
        setModel,
        hardware,
        setHardware,
      }}
    >
      {children}
    </TranslateSettingContext.Provider>
  );
};

// フックとして使いやすくする
export const useTranslateSetting = () => useContext(TranslateSettingContext);
