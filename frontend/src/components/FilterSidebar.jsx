// src/components/FilterSidebar.jsx
import React, { useState, useEffect } from "react";
import Select from "./ui/Select";
import Button from "./ui/Button";
import { X, Filter, RefreshCw } from "lucide-react";

const months = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(0, i).toLocaleString("en-US", { month: "long" }),
  value: String(i + 1),
}));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2024 }, (_, i) => ({
  label: String(2025 + i),
  value: String(2025 + i),
}));

const FilterSidebar = ({
  isOpen,
  onClose,
  initialFilters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={onClose}
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-[rgb(var(--bg))] shadow-md z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-[rgb(var(--border))]">
            <h2 className="text-xl font-bold flex items-center">
              <Filter className="w-5 h-5 mr-2" /> Advanced Filters
            </h2>
            <Button variant="ghost" onClick={onClose} className="p-1">
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex-grow space-y-6 py-6 overflow-y-auto">
            <div className="space-y-4 p-4 border rounded-lg border-[rgb(var(--border))]">
              <p className="text-sm font-semibold">Start Date</p>
              <div className="flex justify-between gap-2">
                <Select
                  label="Month"
                  name="startMonth"
                  value={localFilters.startMonth}
                  onChange={handleChange}
                  options={months}
                  placeholder="Select Month"
                />
                <Select
                  label="Year"
                  name="startYear"
                  value={localFilters.startYear}
                  onChange={handleChange}
                  options={years}
                  placeholder="Select Year"
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg border-[rgb(var(--border))]">
              <p className="text-sm font-semibold">End Date</p>
              <div className="flex justify-between gap-2">
                <Select
                  label="Month"
                  name="endMonth"
                  value={localFilters.endMonth}
                  onChange={handleChange}
                  options={months}
                  placeholder="Select Month"
                />
                <Select
                  label="Year"
                  name="endYear"
                  value={localFilters.endYear}
                  onChange={handleChange}
                  options={years}
                  placeholder="Select Year"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between space-x-2 pt-4 border-t border-[rgb(var(--border))]">
            <Button
              variant="secondary"
              onClick={handleReset}
              className="flex-grow"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              className="flex-grow"
            >
              <Filter className="w-4 h-4 mr-2" /> Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
