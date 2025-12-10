// src/pages/ProductNew.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useApi from "../utils/useApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ArrowLeft, PackagePlus, Save } from "lucide-react";
import { showError } from "../utils/toast";

const initialFormData = {
  name: "",
  category: "uncategorized",
  brand: "generic",
  buyingPrice: 0,
  sellingPrice: 0,
  stockQuantity: 1,
  note: "",
  date: new Date().toISOString().split("T")[0],
};

const ProductNew = () => {
  const navigate = useNavigate();
  const { post, loading: createLoading } = useApi();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;
    if (["buyingPrice", "sellingPrice", "stockQuantity"].includes(name)) {
      newValue = Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data = formData) => {
    const newErrors = {};

    if (!data.name || data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    const buyingPrice = Number(data.buyingPrice);
    const sellingPrice = Number(data.sellingPrice);

    if (buyingPrice <= 0) {
      newErrors.buyingPrice = "Buying price must be greater than 0.";
    }
    if (sellingPrice <= 0) {
      newErrors.sellingPrice = "Selling price must be greater than 0.";
    }
    if (buyingPrice >= sellingPrice) {
      newErrors.priceConflict = "Buying price must be less than selling price.";
    }

    const stockQuantity = Number(data.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 1) {
      newErrors.stockQuantity =
        "Initial stock must be a whole number starting from 1.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please correct the errors in the form.");
      return;
    }

    const data = {
      ...formData,
      buyingPrice: Number(formData.buyingPrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: Number(formData.stockQuantity),
      date: new Date(formData.date).toISOString(),
    };

    const result = await post("/products", data,
      { message: "Product created successfully" }
    );

    if (result) navigate(`/products/${result.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/products`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Product</h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
            <PackagePlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Product Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Product Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
            <Input
              label="Category (Optional)"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
            <Input
              label="Brand (Optional)"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
            />
          </div>

          <h3 className="text-lg font-semibold border-b pb-2 pt-4">
            Pricing & Initial Stock
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Input
              label="Buying Price (PKR)"
              id="buyingPrice"
              name="buyingPrice"
              type="number"
              value={formData.buyingPrice}
              onChange={handleChange}
              required
              min={0.01}
              step="0.01"
              error={errors.buyingPrice || errors.priceConflict}
            />
            <Input
              label="Selling Price (PKR)"
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
              min={0.01}
              step="0.01"
              error={errors.sellingPrice || errors.priceConflict}
            />
            <Input
              label="Initial Stock Quantity"
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              min={1}
              step="1"
              error={errors.stockQuantity}
            />
            <Input
              label="Stock Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Notes (Optional)"
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
          />

          <Button
            type="submit"
            variant="primary"
            loading={createLoading}
            className="w-full text-lg py-3 mt-8"
          >
            <Save className="w-5 h-5 mr-2" />
            {createLoading ? "Creating Product..." : "Create Product"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProductNew;
