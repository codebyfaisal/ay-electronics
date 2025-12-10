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
  { label: "Installment", value: "INSTALLMENT" },
  { label: "Cash", value: "CASH" },
];

const initialFormData = {
  customerId: "",
  productId: "",
  agreementNo: "",
  saleDate: new Date().toISOString().split("T")[0],
  quantity: 1,
  discount: 0,
  paidAmount: 0,
  firstInstallment: 0,
  saleType: "INSTALLMENT",
  totalInstallments: 1,
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
  const firstInstallment = Number(formData.firstInstallment);
  const totalInstallments = Number(formData.totalInstallments);

  const remainingAfterDiscount = Math.max(0, totalAmount - discount);

  const remainingAmount = useMemo(() => {
    let remaining = remainingAfterDiscount;

    if (formData.saleType === "INSTALLMENT") remaining -= firstInstallment;
    else remaining -= Number(formData.paidAmount);

    return Math.max(0, remaining);
  }, [
    remainingAfterDiscount,
    formData.saleType,
    firstInstallment,
    formData.paidAmount,
  ]);

  const payPerInstallment = useMemo(() => {
    if (formData.saleType !== "INSTALLMENT" || totalInstallments < 1) return 0;

    const amountToInstall = remainingAfterDiscount - firstInstallment;

    return Math.ceil(Math.max(0, amountToInstall) / totalInstallments);
  }, [remainingAfterDiscount, firstInstallment, totalInstallments, formData.saleType]);


  useEffect(() => {
    setFormData((prev) => {
      if (prev.saleType === "CASH") {
        const newPaid = remainingAfterDiscount;
        return {
          ...prev,
          paidAmount: newPaid,
          firstInstallment: newPaid,
          totalInstallments: 1,
        };
      } else if (prev.saleType === "INSTALLMENT") {
        return {
          ...prev,
          paidAmount: prev.firstInstallment,
          totalInstallments: prev.totalInstallments || 1,
        };
      }
      return prev;
    });
  }, [formData.saleType, totalAmount, discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;
    if (
      [
        "quantity",
        "discount",
        "paidAmount",
        "firstInstallment",
        "totalInstallments",
      ].includes(name)
    ) newValue = value === "" ? 0 : parseFloat(value);

    setFormData((prev) => {
      let newState = { ...prev, [name]: newValue };

      if (name === "firstInstallment" && prev.saleType === "INSTALLMENT")
        newState.paidAmount = newValue;

      return newState;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) newErrors.customerId = "Customer is required.";
    if (!formData.productId) newErrors.productId = "Product is required.";

    if (Number(formData.agreementNo) < 1)
      newErrors.agreementNo = "Agreement number must be greater than 0.";

    if (selectedProduct && formData.quantity > stockQuantity)
      newErrors.quantity = `Not enough stock available. Max: ${stockQuantity}`;

    if (formData.saleType === "INSTALLMENT") {
      if (totalInstallments < 1)
        newErrors.totalInstallments = "Installments must be between 1 and 10.";

      if (firstInstallment > remainingAfterDiscount)
        newErrors.firstInstallment = `First Installment cannot exceed price (${remainingAfterDiscount}).`;

      if (remainingAfterDiscount > firstInstallment && payPerInstallment <= 0)
        newErrors.totalInstallments = "Number of installments is too high for the remaining amount.";
    }

    if (Number(formData.paidAmount) > remainingAfterDiscount)
      newErrors.paidAmount = "Paid amount cannot be greater than total price after discount.";

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
      saleType: formData.saleType,
      quantity: Number(formData.quantity),
      discount: Number(formData.discount),
      agreementNo: Number(formData.agreementNo),
    };

    if (formData.saleType === "CASH") {
      const paid = remainingAfterDiscount;
      data.paidAmount = paid;
      data.firstInstallment = paid;
      data.totalInstallments = 1;
      data.perInstallment = paid;
      data.remainingAmount = 0;

    } else if (formData.saleType === "INSTALLMENT") {
      data.firstInstallment = firstInstallment;
      data.paidAmount = firstInstallment;
      data.totalInstallments = totalInstallments;
      data.perInstallment = payPerInstallment;
      data.remainingAmount = remainingAmount;
    }

    const result = await post("/sales", data,
      { message: "Sale created successfully" });

    if (result) navigate(`/sales/${result.id}`);

  };

  if (createLoading) return (
    <section className="w-full h-full flex items-center justify-center">
      <Spinner overlay={false} />;
    </section>
  )

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

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="flex items-center border-b pb-2 mb-4 text-xl font-semibold">
            <ShoppingBag className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Sale Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              label="Agreement No."
              name="agreementNo"
              type="number"
              value={formData.agreementNo}
              onChange={handleChange}
              required
              error={errors.agreementNo}
            />
            <Input
              label="Sale Date"
              name="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={handleChange}
              required
              error={errors.saleDate}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 pt-4 border-t border-[rgb(var(--border))]">
            <Input
              label="Selling Price (Unit)"
              value={sellingPrice.toLocaleString()}
              currency={true}
              error={errors.sellingPrice}
              className="opacity-50"
              disabled
            />
            <Input
              label={`Quantity (Max: ${stockQuantity})`}
              name="quantity"
              type="number"
              value={stockQuantity === 0 ? 0 : formData.quantity}
              onChange={handleChange}
              min={0}
              max={stockQuantity}
              required
              error={errors.quantity}
              disabled={stockQuantity === 0}
            />
            <Input
              label="Total Amount (selling price * quantity)"
              value={totalAmount.toLocaleString()}
              disabled
              currency={true}
              className="opacity-50"
              min={0}
            />
          </div>

          <h3 className="text-lg font-semibold border-b pb-2 pt-4 lg:pt-0">
            Payment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Sale Type"
              name="saleType"
              value={formData.saleType}
              onChange={handleChange}
              options={SALE_TYPES}
              required
              disabled={stockQuantity === 0}
            />
            <Input
              label="Discount"
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleChange}
              error={errors.discount}
              currency={true}
              disabled={stockQuantity === 0}
            />
            {formData.saleType === "INSTALLMENT" ? (
              <>
                <Input
                  label="First Installment"
                  name="firstInstallment"
                  type="number"
                  value={formData.firstInstallment}
                  onChange={handleChange}
                  min={0}
                  max={remainingAfterDiscount}
                  error={errors.firstInstallment}
                  currency={true}
                  disabled={stockQuantity === 0}
                />
                <Input
                  label="No. of Installments"
                  name="totalInstallments"
                  type="number"
                  value={formData.totalInstallments}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  error={errors.totalInstallments}
                  disabled={stockQuantity === 0}
                />
                <Input
                  label="Pay Per Installment"
                  name="installmentAmount"
                  type="number"
                  value={payPerInstallment}
                  disabled
                  currency={true}
                />
                <Input
                  label="Remaining Balance"
                  value={remainingAmount.toLocaleString()}
                  disabled
                  className="font-bold col-start-3"
                  currency={true}
                  inputClass="ring-2 ring-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]"
                />
              </>
            ) : (
              <Input
                label="Paid Amount (Total - Discount)"
                name="paidAmount"
                type="number"
                value={remainingAfterDiscount}
                disabled={stockQuantity === 0}
                currency={true}
              />
            )}
          </div>

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