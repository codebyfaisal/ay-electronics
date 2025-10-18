// src/pages/SaleNew.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useApi from "../utils/useApi";
import useFetch from "../hooks/useFetch";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Spinner from "../components/Spinner";
import SearchableFilterSelect from "../components/SearchableFilterSelect";
import { ArrowLeft, ShoppingBag, Save } from "lucide-react";
import { showError } from "../utils/toast";

const SALE_TYPES = [
  { label: "Cash", value: "CASH" },
  { label: "Installment", value: "INSTALLMENT" },
];

const PAYMENT_METHODS = [
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
];

const initialFormData = {
  customerId: "",
  productId: "",
  saleDate: new Date().toISOString().split("T")[0],
  paymentMethod: "CASH",
  quantity: 1,
  discount: 0,
  paidAmount: 0,
  downPayment: 0,
  saleType: "CASH",
  totalInstallments: 1,
  note: "",
};

const SaleNew = () => {
  const navigate = useNavigate();
  const { post, loading: createLoading } = useApi();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const productId = formData.productId;
  const { data: productDetails } = useFetch(
    productId ? `/products/${productId}` : null,
    useMemo(() => ({}), [productId]),
    true
  );

  const selectedProduct = productDetails?.productOverview;

  const sellingPrice = Number(selectedProduct?.sellingPrice || 0);
  const stockQuantity = Number(selectedProduct?.stockQuantity || 0);

  const totalAmount = sellingPrice * Number(formData.quantity);
  const discount = Number(formData.discount);
  const downPayment = Number(formData.downPayment);

  const remainingAmount = useMemo(() => {
    let remaining = totalAmount - discount;
    if (formData.paymentMethod === "INSTALLMENT") {
      remaining -= downPayment;
    } else {
      remaining = remaining - Number(formData.paidAmount);
    }
    return Math.max(0, remaining);
  }, [
    totalAmount,
    discount,
    formData.paymentMethod,
    downPayment,
    formData.paidAmount,
  ]);

  useEffect(() => {
    setFormData((prev) => {
      if (prev.saleType === "CASH") {
        const newPaid = Math.max(0, totalAmount - discount);
        return {
          ...prev,
          paidAmount: newPaid,
          downPayment: newPaid,
          totalInstallments: 0,
        };
      } else if (prev.saleType === "INSTALLMENT") {
        return {
          ...prev,
          paidAmount: prev.downPayment,
          totalInstallments: prev.totalInstallments || 1,
        };
      }
      return prev;
    });
  }, [formData.paymentMethod, totalAmount, discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;
    if (
      [
        "quantity",
        "discount",
        "paidAmount",
        "downPayment",
        "totalInstallments",
      ].includes(name)
    ) newValue = value === "" ? 0 : parseFloat(value);


    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) newErrors.customerId = "Customer is required.";
    if (!formData.productId) newErrors.productId = "Product is required.";

    if (selectedProduct && formData.quantity > stockQuantity)
      newErrors.quantity = `Not enough stock available. Max: ${stockQuantity}`;


    if (formData.saleType === "INSTALLMENT") {
      if (formData.totalInstallments < 1 || formData.totalInstallments > 10) {
        newErrors.totalInstallments = "Installments must be between 1 and 10.";
      }
      if (downPayment > totalAmount)
        newErrors.downPayment = "Down payment cannot exceed total amount.";
    }

    if (Number(formData.paidAmount) > totalAmount)
      newErrors.paidAmount = "Paid amount cannot be greater than total price.";

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
      customerId: Number(formData.customerId),
      productId: Number(formData.productId),
      saleDate: new Date(formData.saleDate).toISOString(),
      paymentMethod: formData.paymentMethod,
      saleType: formData.saleType,
      quantity: Number(formData.quantity),
      discount: Number(formData.discount),
      note: formData.note,
    };

    if (formData.saleType === "CASH") {
      const paid = Math.max(0, totalAmount - discount);
      data.paidAmount = paid;
      data.downPayment = paid;
    } else if (formData.saleType === "INSTALLMENT") {
      data.downPayment = Number(formData.downPayment);
      data.paidAmount = Number(formData.downPayment);
      data.totalInstallments = Number(formData.totalInstallments);
    }

    const result = await post("/sales", data, { message: "Sale created successfully" });

    if (result) navigate(`/sales/${result.id}`);

  };

  if (createLoading) return <Spinner overlay={true} />;


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/sales`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Sale</h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
              Sale Details
            </h2>
            <Select
              label="Sale Type"
              name="saleType"
              value={formData.saleType}
              onChange={handleChange}
              options={SALE_TYPES}
              required
              disabled={stockQuantity === 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SearchableFilterSelect
              label="Customer"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              searchApiUrl="/customers"
              searchKey="name"
              displayKey="name"
              dataKey="customers"
              placeholder="Customer Name"
              required
              error={errors.customerId}
            />

            <SearchableFilterSelect
              label="Product"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              searchApiUrl="/products"
              searchKey="name"
              displayKey="name"
              dataKey="products"
              placeholder="Product Name"
              required
              error={errors.productId}
            />

            <Input
              label="Sale Date"
              name="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-[rgb(var(--border))]">
            <Input
              label="Selling Price (Unit)"
              value={sellingPrice.toLocaleString()}
              disabled
              currency={true}
            />
            <Input
              label={`Quantity (Max: ${stockQuantity})`}
              name="quantity"
              type="number"
              value={stockQuantity === 0 ? 0 : formData.quantity}
              onChange={handleChange}
              min={stockQuantity === 0 ? 0 : 1}
              max={stockQuantity}
              required
              error={errors.quantity}
              disabled={stockQuantity === 0}
            />
            <Input
              label="Total Amount"
              value={totalAmount.toLocaleString()}
              disabled
              currency={true}
            />
            <Input
              label="Discount"
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleChange}
              min={0}
              error={errors.discount}
              currency={true}
              disabled={stockQuantity === 0}
            />
          </div>

          <div className="flex items-center border-b pb-2 pt-4">
            <h3 className="text-lg font-semibold">
              Payment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Select
              label="Payment Method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              options={PAYMENT_METHODS}
              required
              disabled={stockQuantity === 0}
            />

            {formData.saleType === "INSTALLMENT" ? (
              <>
                <Input
                  label="Down Payment"
                  name="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={handleChange}
                  min={0}
                  error={errors.downPayment}
                  currency={true}
                  disabled={stockQuantity === 0}
                />
                <Input
                  label="No. of Installments (Max 10)"
                  name="totalInstallments"
                  type="number"
                  value={formData.totalInstallments}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  step={1}
                  error={errors.totalInstallments}
                  disabled={stockQuantity === 0}
                />
                <Input
                  label="Pay Per Installment"
                  name="installmentAmount"
                  type="number"
                  value={Math.ceil(totalAmount / formData.totalInstallments)}
                  disabled
                  currency={true}
                />
              </>
            ) : (
              <Input
                label="Paid Amount (Total - Discount)"
                name="paidAmount"
                type="number"
                value={Math.max(0, totalAmount - discount)}
                disabled={stockQuantity === 0}
                currency={true}
              />
            )}

            <Input
              label="Remaining Balance"
              value={remainingAmount.toLocaleString()}
              disabled
              className="font-bold"
              currency={true}
            />
          </div>

          <Input
            label="Note (Optional)"
            name="note"
            value={formData.note}
            onChange={handleChange}
            disabled={stockQuantity === 0}
          />

          <Button
            type="submit"
            variant="primary"
            loading={createLoading}
            className="w-full text-lg py-3 mt-8"
          >
            <Save className="w-5 h-5 mr-2" />
            {createLoading ? "Creating Sale..." : "Create Sale"}
          </Button>
        </form>

        {productId && !selectedProduct && (
          <div className="mt-4 text-center">
            <Spinner overlay={false} /> Fetching product details...
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleNew;
