// src/context/FontContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const FontContext = createContext();

// A list of all possible font class values for cleanup
const FONT_CLASSES = ["default", "poppins-custom", "play-custom"];
const LOCAL_STORAGE_KEY = 'font';

export const useFont = () => useContext(FontContext);

export const FontProvider = ({ children }) => {
  const [currentFont, setCurrentFont] = useState(() => {
    // Initialize font from localStorage or use 'default'
    const savedFont = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedFont && FONT_CLASSES.includes(savedFont) ? savedFont : 'default';
  });

  // Apply the font class to the document body on initial load and font change
  useEffect(() => {
    const body = document.body;
    
    // 1. Remove all known font classes to ensure only the current one is active
    FONT_CLASSES.forEach(fontClass => body.classList.remove(fontClass));
    
    // 2. Add the current font class
    if (currentFont && currentFont !== 'default') {
      body.classList.add(currentFont);
    }
    
    // 3. Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, currentFont);

  }, [currentFont]);

  const changeFont = (newFont) => {
    // You might want to validate 'newFont' against FONT_CLASSES here
    setCurrentFont(newFont);
  };

  return (
    <FontContext.Provider value={{ currentFont, changeFont }}>
      {children}
    </FontContext.Provider>
  );
};