// src/components/ui/Input.jsx
import React from "react";

const Input = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error = "",
  className = "",
  required = false,
  count = false,
  currency = false,
  min = 0,
  inputClass = null,
  ...rest
}) => {
  if (type === "number" && value < min) value = '';

  const inputClasses = `w-full p-3 border rounded-md ${inputClass ? inputClass : "bg-[rgb(var(--input-bg))] text-[rgb(var(--text))]"}
  focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]
  transition-all duration-300
  placeholder-gray-500 dark:placeholder-gray-400
  ${error ? "border-[rgb(var(--color-error))]" : "border-[rgb(var(--border))]"}
  `;

  return (
    <div className={`flex flex-col ${className} relative`}>
      {label && (
        <label htmlFor={id} className="font-medium text-sm mb-1">
          {label}
          {required && <span className="text-[rgb(var(--error))]">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClasses}
        required={required}
        {...rest}
      />
      {error &&
        <p className="text-sm text-[rgb(var(--color-error))] absolute top-full left-3 -translate-y-1">
          {error}
        </p>
      }
      <span
        className={`text-sm font-bold text-[rgb(var(--color-primary))] absolute top-1/2 right-4 translate-y-1
    ${value && rest.maxLength && value.length > rest.maxLength ? "text-[rgb(var(--color-error))]" : ""}
    ${!count || !value || value.length <= 0 ? "hidden" : "visible"}`}
      >
        {value ? value.length : 0}
      </span>

      {currency && (
        <span className={`ml-1 text-[0.7rem] absolute top-1/2 right-4 translate-y-1.5 ${rest.disabled ? "opacity-50" : ""}`}>PKR</span>
      )}
    </div>
  );
};

export default Input;
