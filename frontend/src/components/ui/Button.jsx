// src/components/ui/Button.jsx
import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
  children,
  variant = "primary", // 'primary', 'secondary', 'danger', 'ghost'
  type = "button",
  onClick,
  className = "",
  disabled = false,
  loading = false,
}) => {
  let baseStyles =
    "px-2.5 py-2 rounded-md font-semibold transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer";
  let variantStyles = "";

  // Define styles based on the variant
  switch (variant) {
    case "primary":
      variantStyles =
        "bg-[rgb(var(--primary))] hover:bg-green-600 ring-inset ring-[1px] focus:ring focus:ring-4 focus:ring-green-300 dark:hover:text-white";
      break;
    case "secondary":
      variantStyles =
        "bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white";
      break;
    case "danger":
      variantStyles =
        "bg-[rgb(var(--error))] text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300";
      break;
    case "ghost":
      variantStyles =
        "bg-transparent text-[rgb(var(--primary))] hover:bg-[rgb(var(--bg-secondary))]";
      break;
    default:
      variantStyles = "bg-[rgb(var(--primary))] text-white hover:bg-green-600";
  }

  // Handle disabled/loading states
  if (disabled || loading) variantStyles += " opacity-60 cursor-not-allowed";
  else variantStyles += " active:scale-[0.98]";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
