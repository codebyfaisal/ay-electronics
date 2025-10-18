// src/components/SearchableFilterSelect.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import useDebounce from "../hooks/useDebounce";
import useFetch from "../hooks/useFetch";
import Input from "./ui/Input";
import Spinner from "./Spinner";
import { Search, ChevronDown, Check } from "lucide-react";

const SearchableFilterSelect = ({
  label,
  name,
  value,
  onChange,
  searchApiUrl,
  searchKey,
  displayKey,
  dataKey,
  placeholder,
  error,
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const componentRef = useRef(null);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: 20 });
    if (debouncedSearchTerm) {
      params.append(searchKey, debouncedSearchTerm);
    }
    return `${searchApiUrl}?${params.toString()}`;
  }, [searchApiUrl, debouncedSearchTerm, searchKey]);

  const { data: fetchedData, loading } = useFetch(apiUrl, {}, true);

  const options = useMemo(() => {
    const rawItems = fetchedData?.[dataKey] || [];
    return rawItems.map((item) => ({
      label: item[displayKey],
      value: item.id.toString(),
    }));
  }, [fetchedData, dataKey, displayKey]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [componentRef]);

  const handleSelect = (newValue, newLabel) => {
    onChange({ target: { name, value: newValue } });
    setSearchTerm(newLabel);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    setSearchTerm(input);

    if (!isOpen) setIsOpen(true);
    if (value) onChange({ target: { name, value: "" } });

  };

  const inputBorderClass = error
    ? "border-[rgb(var(--error))]"
    : isOpen
      ? "border-[rgb(var(--primary))] ring-2 ring-[rgb(var(--primary))]/50"
      : "border-[rgb(var(--border))]";

  return (
    <div className="relative flex flex-col space-y-1" ref={componentRef}>
      <label className="text-sm font-medium">
        {label}{" "}
        {required && <span className="text-[rgb(var(--error))]">*</span>}
      </label>

      <div
        className={`relative p-0 rounded-lg bg-[rgb(var(--input-bg))] ${inputBorderClass} transition-all duration-300`}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center p-3 cursor-pointer">
          <Search className="w-4 h-4 mr-2 text-gray-500" />
          <span
            className={`flex-grow text-[rgb(var(--text))] ${selectedItem ? "font-medium" : "text-gray-500"
              }`}
          >
            {selectedItem?.label || placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
              }`}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 rounded-lg shadow-md bg-[rgb(var(--bg))] border border-[rgb(var(--border))] z-20 overflow-hidden">
            <div className="p-2 border-b border-[rgb(var(--border))]">
              <Input
                id={`${name}-search-input`}
                type="text"
                placeholder={`Type to search ${displayKey}...`}
                value={searchTerm}
                onChange={handleInputChange}
                className="w-full !p-2 !m-0"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <Spinner overlay={false} className="w-5 h-5" />
                </div>
              ) : options.length > 0 ? (
                options.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value, option.label)}
                    className={`flex justify-between items-center p-3 cursor-pointer hover:bg-[rgb(var(--bg-secondary))] transition-colors duration-100 ${String(option.value) === String(value)
                      ? "bg-[rgb(var(--bg-secondary))] font-semibold"
                      : ""
                      }`}
                  >
                    {option.label}
                    {String(option.value) === String(value) && (
                      <Check className="w-4 h-4 text-[rgb(var(--primary))]" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No results found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[rgb(var(--error))]">{error}</p>}
    </div>
  );
};

export default SearchableFilterSelect;
