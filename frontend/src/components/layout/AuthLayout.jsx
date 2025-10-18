// src/components/layout/AuthLayout.jsx
import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-secondary))] p-4">
      <div className="w-full max-w-md bg-[rgb(var(--bg))] p-8 rounded-md shadow-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
