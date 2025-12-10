// src/components/EditModal.jsx
import React, { useState, useEffect } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import { X, Save, Edit } from "lucide-react";
import { showError } from "../utils/toast";

const EditModal = ({
  isOpen,
  title,
  initialData,
  fields,
  onClose,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const initialForm = {};
      fields.forEach((field) => {
        const value = initialData[field.key];
        initialForm[field.key] =
          ["number", "select"].includes(field.type) && value !== undefined
            ? String(value)
            : value || "";
      });
      setFormData(initialForm);
    }
  }, [initialData, fields]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach((field) => {
      const rawValue = formData[field.key];
      const value =
        rawValue !== null && rawValue !== undefined
          ? String(rawValue).trim()
          : "";

      if (field.required && !value) {
        newErrors[field.key] = `${field.label} is required.`;
        isValid = false;
      }

      if (field.type === "number" && value && Number(value) <= 0) {
        newErrors[field.key] = `${field.label} must be greater than 0.`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Please correct the errors in the form.");
      return;
    }

    const finalData = { ...formData };
    fields.forEach((field) => {
      if (field.type === "number")
        finalData[field.key] = Number(finalData[field.key]);
    });

    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Edit className="w-5 h-5 mr-2" /> {title}
          </h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const Component = field.type === "select" ? Select : Input;
            const key = field.key;

            let value = formData[key];
            if (field.type === "date" && value)
              if (value.includes("T"))
                value = new Date(value).toISOString().split("T")[0];

            return (
              <Component
                key={key}
                label={field.label}
                name={key}
                type={field.type}
                value={value}
                onChange={handleChange}
                required={field.required}
                error={errors[key]}
                disabled={loading || field.disabled}
                options={field.options}
                {...field.rest}
              />
            );
          })}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-4"
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
