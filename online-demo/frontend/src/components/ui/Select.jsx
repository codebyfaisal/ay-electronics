// src/components/ui/Select.jsx
import React from "react";

const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  className = "",
  required = false,
  ...rest
}) => {
  const selectClasses = `
        w-full p-3 border rounded-md appearance-none
        bg-[rgb(var(--input-bg))] text-[rgb(var(--text))]
        focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]
        transition-all duration-300 cursor-pointer
        ${error ? "border-[rgb(var(--error))]" : "border-[rgb(var(--border))]"}
    `;

  return (
    <div className={`flex flex-col space-y-1 ${className} ${rest.disabled && "opacity-50 cursor-not-allowed"}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}{" "}
          {required && <span className="text-[rgb(var(--error))]">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={selectClasses}
          required={required}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom arrow for appearance consistency */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[rgb(var(--text))]">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <p className="text-sm text-[rgb(var(--error))]">{error}</p>}
    </div>
  );
};

export default Select;
