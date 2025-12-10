// src/components/layout/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg-secondary))] relative">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="p-4 md:px-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
