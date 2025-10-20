// src/pages/ProductEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/Spinner";
import Select from "../components/ui/Select";
import { ArrowLeft, Package, Save, Plus, PackagePlus } from "lucide-react";
import { showError } from "../utils/toast";

// ✅ FIXED: Define combined stock type + direction for clarity
const STOCK_TYPES = [
  { label: "Purchase (IN)", value: "PURCHASE_IN" },
  { label: "Supplier Return (OUT)", value: "RETURN_OUT" },
];

const ProductEdit = () => {
  const { id } = useParams();
  const productId = Number(id);

  const {
    data: productReport,
    loading: fetchLoading,
    error: fetchError,
    refetch,
  } = useFetch(`/products/${productId}`, {}, true);

  const { put, loading: updateLoading } = useApi();

  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    brand: "",
    buyingPrice: 0,
    sellingPrice: 0,
  });
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    if (productReport && productReport.productOverview) {
      const overview = productReport.productOverview;
      setEditFormData({
        name: overview.name || "",
        category: overview.category || "uncategorized",
        brand: overview.brand || "generic",
        buyingPrice: String(overview.buyingPrice),
        sellingPrice: String(overview.sellingPrice),
      });
    }
  }, [productReport]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (["buyingPrice", "sellingPrice"].includes(name)) {
      newValue = value === "" ? "" : Number(value);
    }

    setEditFormData((prev) => ({ ...prev, [name]: newValue }));
    if (editErrors[name] || editErrors.priceConflict)
      setEditErrors((prev) => ({ ...prev, [name]: "", priceConflict: "" }));
  };

  const validateEditForm = (data = editFormData) => {
    const newErrors = {};
    if (!data.name || data.name.length < 2)
      newErrors.name = "Name must be at least 2 characters.";

    const buyingPrice = Number(data.buyingPrice);
    const sellingPrice = Number(data.sellingPrice);

    if (buyingPrice <= 0)
      newErrors.buyingPrice = "Buying price must be greater than 0.";
    if (sellingPrice <= 0)
      newErrors.sellingPrice = "Selling price must be greater than 0.";
    if (buyingPrice >= sellingPrice)
      newErrors.priceConflict = "Buying price must be less than selling price.";

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) {
      showError("Please correct the errors in the Product Edit form.");
      return;
    }

    const data = {
      id: productId,
      name: editFormData.name.trim(),
      category: editFormData.category.trim() || "uncategorized",
      brand: editFormData.brand.trim() || "generic",
      buyingPrice: Number(editFormData.buyingPrice),
      sellingPrice: Number(editFormData.sellingPrice),
    };

    const result = await put(`/products/${productId}`, data,
      { message: "Product details updated successfully" }
    );

    if (result) refetch();
  };

  const loading = fetchLoading || updateLoading;

  if (fetchError) {
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error loading product data: {fetchError}
      </div>
    );
  }

  if (loading && !productReport) {
    return <Spinner overlay={false} />;
  }

  if (!productReport) {
    return <div className="text-center p-4">Product not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/products/${productId}`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          Edit Product: {editFormData.name}
        </h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] max-w-5xl mx-auto">
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
            <Package className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Update General & Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Product Name"
              id="name"
              name="name"
              value={editFormData.name}
              onChange={handleEditChange}
              required
              error={editErrors.name}
            />
            <Input
              label="Category"
              id="category"
              name="category"
              value={editFormData.category}
              onChange={handleEditChange}
            />
            <Input
              label="Brand"
              id="brand"
              name="brand"
              value={editFormData.brand}
              onChange={handleEditChange}
            />
          </div>

          <h3 className="text-lg font-semibold border-b pb-2 pt-4">Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Buying Price (PKR)"
              id="buyingPrice"
              name="buyingPrice"
              type="number"
              value={editFormData.buyingPrice}
              onChange={handleEditChange}
              required
              min={0.01}
              step="0.01"
              error={editErrors.buyingPrice || editErrors.priceConflict}
            />
            <Input
              label="Selling Price (PKR)"
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              value={editFormData.sellingPrice}
              onChange={handleEditChange}
              required
              min={0.01}
              step="0.01"
              error={editErrors.sellingPrice || editErrors.priceConflict}
            />
          </div>

          {editErrors.priceConflict && (
            <p className="text-sm text-[rgb(var(--error))]">
              {editErrors.priceConflict}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={updateLoading}
            className="w-full text-lg py-3 mt-8"
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            {updateLoading ? "Saving Details..." : "Save Details"}
          </Button>
        </form>
      </div>

      <AddStockForm productId={productId} onStockAdded={refetch} />
    </div>
  );
};

export default ProductEdit;

const AddStockForm = ({ productId, onStockAdded }) => {
  const { post, loading: stockLoading } = useApi();

  const [stockFormData, setStockFormData] = useState({
    stockQuantity: 1,
    note: "",
    date: new Date().toISOString().split("T")[0],
    type: "PURCHASE_IN",
  });

  const [stockErrors, setStockErrors] = useState({});

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "stockQuantity") newValue = Number(value);

    setStockFormData((prev) => ({ ...prev, [name]: newValue }));
    if (stockErrors[name]) setStockErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStockForm = (data = stockFormData) => {
    const newErrors = {};
    const quantity = Number(data.stockQuantity);

    if (!Number.isInteger(quantity) || quantity < 1)
      newErrors.stockQuantity =
        "Quantity must be a whole number starting from 1.";
    if (!data.type) newErrors.type = "Transaction type is required.";
    if (!data.date) newErrors.date = "Date is required.";

    setStockErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();

    if (!validateStockForm()) {
      showError("Please correct the errors in the Add Stock form.");
      return;
    }

    // ✅ FIXED: Properly split type into baseType and direction
    const [rawType, direction] = stockFormData.type.split("_");

    const data = {
      id: productId,
      stockQuantity: stockFormData.stockQuantity,
      note: stockFormData.note,
      date: new Date(stockFormData.date).toISOString(),
      type: rawType,
      direction,
    };

    const result = await post(`/products/${productId}/stocks`,
      data, { message: "Stock updated successfully" }
    );

    if (result) {
      setStockFormData({
        stockQuantity: 1,
        note: "",
        date: new Date().toISOString().split("T")[0],
        type: "PURCHASE_IN",
      });
      if (onStockAdded) onStockAdded();
    }
  };

  return (
    <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] max-w-5xl mx-auto">
      <form onSubmit={handleStockSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
          <Plus className="w-5 h-5 mr-2 text-[rgb(var(--secondary))]" /> Add
          Stock / Record Return
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Select
            label="Transaction Type"
            name="type"
            value={stockFormData.type}
            onChange={handleStockChange}
            options={STOCK_TYPES}
            required
            error={stockErrors.type}
          />
          <Input
            label="Quantity to Add"
            name="stockQuantity"
            type="number"
            value={stockFormData.stockQuantity}
            onChange={handleStockChange}
            required
            min={1}
            step="1"
            error={stockErrors.stockQuantity}
          />
          <Input
            label="Transaction Date"
            name="date"
            type="date"
            value={stockFormData.date}
            onChange={handleStockChange}
            required
            error={stockErrors.date}
          />
          <Input
            label="Note (Optional)"
            name="note"
            value={stockFormData.note}
            onChange={handleStockChange}
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          loading={stockLoading}
          className="w-full text-lg py-3 mt-8"
        >
          <PackagePlus className="w-5 h-5 mr-2" />
          {stockLoading ? "Processing Stock..." : "Save Stock Transaction"}
        </Button>
      </form>
    </div>
  );
};
