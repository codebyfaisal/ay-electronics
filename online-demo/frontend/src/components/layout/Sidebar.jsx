// src/components/layout/Sidebar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  WalletCards,
  Settings,
  CreditCard,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const businessName = "AY Electronics";

const navItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Finance", path: "/finance", icon: DollarSign },
  { name: "Products", path: "/products", icon: Package },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Sales", path: "/sales", icon: ShoppingBag },
  { name: "One Shot Sale", path: "/one-shot-sale", icon: CreditCard },
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Team", path: "/team", icon: UsersRound },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const commonClasses = "flex items-center p-3 rounded-md w-full";
  const activeClasses = "bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text))]";
  const inactiveClasses =
    "hover:bg-[rgb(var(--bg-secondary))] hover:text-[rgb(var(--text))]";

  const renderContent = () => (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`
          }
          onClick={() => setIsOpen(false)}
        >
          <item.icon className="w-5 h-5 mr-3" />
          {item.name}
        </NavLink>
      ))}

      <div className="pt-4 border-t border-[rgb(var(--border))] mt-4">
        <button
          onClick={toggleTheme}
          className={`${commonClasses} ${inactiveClasses} justify-start`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 mr-3" />
          ) : (
            <Sun className="w-5 h-5 mr-3" />
          )}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button
          onClick={logout}
          className={`${commonClasses} ${inactiveClasses} text-[rgb(var(--error))]cursor-pointer`}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-[rgb(var(--primary))] text-white md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className="hidden md:flex flex-col w-60 min-w-60 bg-[rgb(var(--bg))] p-4 shadow-md border-r border-[rgb(var(--border))] sticky top-0 left-0 h-screen">
        <div className="text-2xl font-bold text-[rgb(var(--primary))] mb-8">
          {businessName}
        </div>
        {renderContent()}
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-64 h-full bg-[rgb(var(--bg))] p-4 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-2xl font-bold text-[rgb(var(--primary))] mb-8">
              {businessName}
            </div>
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
