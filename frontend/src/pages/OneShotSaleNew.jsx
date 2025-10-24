import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useApi from "../utils/useApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/Spinner";
import { ArrowLeft, ShoppingBag, UserPlus, PackagePlus, Save } from "lucide-react";
import { showError } from "../utils/toast";

const initialCustomerData = {
  name: "",
  registrationNo: "", // CHANGED FROM 'email'
  cnic: "",
  phone: "",
  address: "",
};

const initialProductData = {
  name: "",
  category: "uncategorized",
  brand: "generic",
  buyingPrice: 0,
  sellingPrice: 0,
  stockQuantity: 1,
  note: "",
  date: new Date().toISOString().split("T")[0],
};

const initialSaleData = {
  saleDate: new Date().toISOString().split("T")[0],
  paymentMethod: "CASH",
  quantity: 1,
  discount: 0,
  firstInstallment: 0, // CHANGED FROM 'downPayment'
  totalInstallments: 1,
  saleType: "INSTALLMENT",
};

const OneShotSaleNew = () => {
  const navigate = useNavigate();
  const { post, loading: createLoading } = useApi();
  const [formData, setFormData] = useState({
    customer: initialCustomerData,
    product: initialProductData,
    sale: initialSaleData,
  });
  const [errors, setErrors] = useState({});

  // Destructure for easy access
  const { customer, product, sale } = formData;
  const { sellingPrice } = product;
  const { quantity, discount, firstInstallment, totalInstallments } = sale; // ADDED paymentMethod

  // --- SALE CALCULATIONS ---
  const totalAmount = Number(sellingPrice) * Number(quantity);
  const remainingAfterDiscount = Math.max(0, totalAmount - Number(discount));

  const remainingAmount = useMemo(() => {
    // Remaining is total after discount minus First Installment
    return Math.max(0, remainingAfterDiscount - Number(firstInstallment));
  }, [remainingAfterDiscount, firstInstallment]);

  const payPerInstallment = useMemo(() => {
    if (Number(totalInstallments) < 1) return 0;
    const amountToInstall = remainingAfterDiscount - Number(firstInstallment);
    // Use Math.ceil to ensure total installments cover the full amount
    return Math.ceil(Math.max(0, amountToInstall) / Number(totalInstallments));
  }, [remainingAfterDiscount, firstInstallment, totalInstallments]);

  // Enforce Sale Type to INSTALLMENT
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sale: {
        ...prev.sale,
        saleType: "INSTALLMENT",
        paidAmount: prev.sale.firstInstallment, // paidAmount is equal to firstInstallment
      }
    }));
  }, [sale.firstInstallment]);


  // --- GENERIC CHANGE HANDLER FOR NESTED STATE ---
  const handleChange = (e, entity) => {
    const { name, value } = e.target;
    let newValue = value;

    // Type conversion for numbers
    if (
      ["quantity", "discount", "firstInstallment", "totalInstallments"].includes(name) ||
      (entity === "product" && ["buyingPrice", "sellingPrice", "stockQuantity"].includes(name))
    ) {
      newValue = value === "" ? 0 : parseFloat(value);
    }

    // Customer field cleaning (only digits for phone/cnic, numeric for registrationNo)
    if (entity === "customer") {
      if (name === "phone" || name === "cnic") {
        newValue = value.replace(/[^0-9]/g, "");
      } else if (name === "registrationNo") {
        newValue = value === "" ? 0 : parseInt(value, 10);
      }
    }

    // Update nested state
    setFormData((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [name]: newValue,
      },
    }));

    // Clear errors
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };


  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    const newErrors = {};

    // 1. Customer Validation
    if (!customer.name || customer.name.length < 2) newErrors.customerName = "Name must be at least 2 characters.";
    if (!customer.cnic || customer.cnic.length !== 13) newErrors.customerCnic = "CNIC must be exactly 13 characters.";
    if (!customer.phone || customer.phone.length < 9 || customer.phone.length > 11) newErrors.customerPhone = "Phone must be between 9 and 11 digits.";
    if (!customer.address) newErrors.customerAddress = "Address is required.";
    if (Number(customer.registrationNo) < 1 || !Number.isInteger(Number(customer.registrationNo))) newErrors.customerRegistrationNo = "Registration No must be a whole number greater than 0."; // UPDATED REG NO VALIDATION

    // 2. Product Validation
    const bp = Number(product.buyingPrice);
    const sp = Number(product.sellingPrice);
    const sq = Number(product.stockQuantity);

    if (!product.name || product.name.length < 2) newErrors.productName = "Product Name is required.";
    if (bp <= 0) newErrors.buyingPrice = "Buying price must be greater than 0.";
    if (sp <= 0) newErrors.sellingPrice = "Selling price must be greater than 0.";
    if (bp >= sp) newErrors.priceConflict = "Buying price must be less than selling price.";
    if (!Number.isInteger(sq) || sq < 1) newErrors.stockQuantity = "Initial stock must be a whole number starting from 1.";

    // 3. Sale Validation (Installment-specific)
    if (Number(quantity) < 1 || !Number.isInteger(Number(quantity))) newErrors.quantity = "Quantity must be a whole number greater than 0.";

    if (Number(totalInstallments) < 1 || !Number.isInteger(Number(totalInstallments))) // REMOVED MAX 10 VALIDATION
      newErrors.totalInstallments = "Total Installments must be a whole number of 1 or more.";

    if (Number(firstInstallment) > remainingAfterDiscount)
      newErrors.firstInstallment = `First Installment cannot exceed the price after discount (${remainingAfterDiscount.toLocaleString()}).`;

    if (remainingAfterDiscount > Number(firstInstallment) && payPerInstallment <= 0)
      newErrors.totalInstallments = "The remaining amount is too small to be split into the specified number of installments."; // REFINED ERROR MESSAGE

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // --- SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Please correct the errors in the form.");
      return;
    }

    // Clean customer data before submission
    const customerData = {};
    for (const key in customer) {
      // Ensure numeric fields are properly handled
      const isNumeric = ["registrationNo"];
      let value = customer[key];

      if (typeof value === 'string') {
        value = value.trim();
      }

      if (isNumeric.includes(key)) {
        customerData[key] = Number(value);
      } else if (value !== "") { // Skip empty optional strings, but send others
        customerData[key] = value;
      }
    }

    // Combine all data for the unified endpoint
    const submissionData = {
      // Customer Data 
      customer: customerData,

      // Product Data
      product: {
        ...product,
        buyingPrice: Number(product.buyingPrice),
        sellingPrice: Number(product.sellingPrice),
        stockQuantity: Number(product.stockQuantity),
        date: new Date(product.date).toISOString(),
      },

      // Sale Data (Installment only)
      sale: {
        saleDate: new Date(sale.saleDate).toISOString(),
        paymentMethod: sale.paymentMethod, // ADDED paymentMethod
        saleType: "INSTALLMENT", // Enforced
        quantity: Number(sale.quantity),
        discount: Number(sale.discount),

        // Calculated fields/Renamed fields
        firstInstallment: Number(firstInstallment),
        paidAmount: Number(firstInstallment),
        totalInstallments: Number(totalInstallments),
        perInstallment: payPerInstallment,
        remainingAmount: remainingAmount,
      },
    };

    // Assuming a new backend endpoint handles the creation of all three entities at once
    const result = await post("/sales/complete-installment", submissionData,
      { message: "Customer, Product, and Installment Sale created successfully" });

    if (result) navigate(`/sales/${result.saleId}`); // Assuming result returns the new saleId
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
        <h1 className="text-3xl font-bold">New Complete Installment Sale</h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* CUSTOMER ENROLLMENT */}
          {/* ------------------------------------------------------------------ */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
              <UserPlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
              1. New Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                name="name"
                value={customer.name}
                onChange={(e) => handleChange(e, "customer")}
                required
                error={errors.customerName}
              />
              <Input
                label="Registration Number"
                name="registrationNo"
                type="number"
                required
                value={customer.registrationNo}
                onChange={(e) => handleChange(e, "customer")}
                error={errors.customerRegistrationNo}
                min={1}
              />
              <Input
                label="CNIC (e.g., 1730122343445)"
                name="cnic"
                value={customer.cnic}
                onChange={(e) => handleChange(e, "customer")}
                maxLength={13}
                error={errors.customerCnic}
                count={true}
              />
              <Input
                label="Phone"
                name="phone"
                value={customer.phone}
                onChange={(e) => handleChange(e, "customer")}
                type="tel"
                maxLength={11}
                error={errors.customerPhone}
                count={true}
              />
            </div>
            <Input
              label="Address"
              name="address"
              value={customer.address}
              onChange={(e) => handleChange(e, "customer")}
              required
              error={errors.customerAddress}
            />
          </section>

          {/* ------------------------------------------------------------------ */}

          {/* PRODUCT CREATION */}
          {/* ------------------------------------------------------------------ */}
          <section className="space-y-6 border-t border-[rgb(var(--border))] pt-8">
            <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
              <PackagePlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
              2. New Product Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Product Name"
                name="name"
                value={product.name}
                onChange={(e) => handleChange(e, "product")}
                required
                error={errors.productName}
              />
              <Input
                label="Category (Optional)"
                name="category"
                value={product.category}
                onChange={(e) => handleChange(e, "product")}
              />
              <Input
                label="Brand (Optional)"
                name="brand"
                value={product.brand}
                onChange={(e) => handleChange(e, "product")}
              />
              <Input
                label="Buying Price (PKR)"
                name="buyingPrice"
                type="number"
                value={product.buyingPrice}
                onChange={(e) => handleChange(e, "product")}
                required
                min={0.01}
                step="0.01"
                error={errors.buyingPrice || errors.priceConflict}
                currency={true}
              />
              <Input
                label="Selling Price (PKR)"
                name="sellingPrice"
                type="number"
                value={product.sellingPrice}
                onChange={(e) => handleChange(e, "product")}
                required
                min={0.01}
                step="0.01"
                error={errors.sellingPrice || errors.priceConflict}
                currency={true}
              />
            </div>

            <Input
              label="Product Notes (Optional)"
              name="note"
              value={product.note}
              onChange={(e) => handleChange(e, "product")}
            />
          </section>

          {/* ------------------------------------------------------------------ */}

          {/* INSTALLMENT SALE DETAILS */}
          {/* ------------------------------------------------------------------ */}
          <section className="space-y-6 border-t border-[rgb(var(--border))] pt-8">
            <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
              <ShoppingBag className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
              3. Installment Sale Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                label="Sale Date"
                name="saleDate"
                type="date"
                value={sale.saleDate}
                onChange={(e) => handleChange(e, "sale")}
                required
              />
              <Input
                label="Selling Price (Unit)"
                value={Number(product.sellingPrice).toLocaleString()}
                disabled
                currency={true}
              />
              <Input
                label={`Quantity`}
                name="quantity"
                type="number"
                value={sale.quantity}
                onChange={(e) => handleChange(e, "sale")}
                min={1}
                required
                error={errors.quantity}
              />
              <Input
                label="Total Amount"
                value={totalAmount.toLocaleString()}
                disabled
                currency={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                label="Discount"
                name="discount"
                type="number"
                value={sale.discount}
                onChange={(e) => handleChange(e, "sale")}
                min={0}
                error={errors.discount}
                currency={true}
              />
              <Input
                label={`Price After Discount`}
                value={remainingAfterDiscount.toLocaleString()}
                disabled
                className="font-semibold"
                currency={true}
              />
              <div></div> {/* Empty column for alignment */}
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 pt-4">
              Installment Terms
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                label="First Installment"
                name="firstInstallment"
                type="number"
                value={sale.firstInstallment}
                onChange={(e) => handleChange(e, "sale")}
                min={1}
                max={remainingAfterDiscount}
                error={errors.firstInstallment}
                currency={true}
                required
              />
              <Input
                label="No. of Installments"
                name="totalInstallments"
                type="number"
                value={sale.totalInstallments}
                onChange={(e) => handleChange(e, "sale")}
                min={1}
                step={1}
                required
                error={errors.totalInstallments}
              />
              <Input
                label="Pay Per Installment (Est.)"
                value={payPerInstallment.toLocaleString()}
                disabled
                currency={true}
              />
              <Input
                label="Remaining Balance"
                value={remainingAmount.toLocaleString()}
                disabled
                className="font-bold text-[rgb(var(--error))]"
                currency={true}
              />
            </div>
          </section>

          {/* ------------------------------------------------------------------ */}

          <Button
            type="submit"
            variant="primary"
            loading={createLoading}
            className="w-full text-lg py-3 mt-8"
          >
            <Save className="w-5 h-5 mr-2" />
            {createLoading ? "Processing Complete Sale..." : "Create All & Finalize Sale"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OneShotSaleNew;