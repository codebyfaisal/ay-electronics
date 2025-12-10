// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './css/fonts.css';
import './css/index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { FontProvider } from './context/FontContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FontProvider>
        <App />
        </FontProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
