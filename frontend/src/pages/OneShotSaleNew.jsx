import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useApi from "../utils/useApi";

import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Spinner from "../components/Spinner";

import { ArrowLeft, UserPlus, PackagePlus, ShoppingBag, Save } from "lucide-react";
import { showError } from "../utils/toast";

const SALE_TYPES = [
  { label: "Installment", value: "INSTALLMENT" },
  { label: "Cash", value: "CASH" },
];

const CombinedNewForm = () => {
  const navigate = useNavigate();
  const { post, loading } = useApi();

  const [customer, setCustomer] = useState({
    name: "",
    cnic: "",
    phone: "",
    address: "",
  });

  const [product, setProduct] = useState({
    name: "",
    category: "uncategorized",
    brand: "generic",
    buyingPrice: 0,
    sellingPrice: 0,
    note: "",
  });

  const [sale, setSale] = useState({
    agreementNo: "",
    saleDate: new Date().toISOString().split("T")[0],
    quantity: 1,
    discount: 0,
    paidAmount: 0,
    firstInstallment: 0,
    saleType: "INSTALLMENT",
    totalInstallments: 10,
  });

  const [errors, setErrors] = useState({});

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (["phone", "cnic"].includes(name)) newValue = value.replace(/[^0-9]/g, "");
    setCustomer((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    let newValue = ["buyingPrice", "sellingPrice"].includes(name)
      ? Number(value)
      : value;
    setProduct((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (
      ["quantity", "discount", "paidAmount", "firstInstallment", "totalInstallments"].includes(name)
    ) {
      newValue = value === "" ? 0 : parseFloat(value);
    }

    setSale((prev) => {
      let newState = { ...prev, [name]: newValue };
      if (name === "firstInstallment" && prev.saleType === "INSTALLMENT")
        newState.paidAmount = newValue;
      return newState;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const { quantity, discount, firstInstallment, totalInstallments } = sale;
  const sellingPrice = Number(product.sellingPrice);
  const totalAmount = sellingPrice * Number(quantity);
  const discountValue = Number(discount);

  const remainingAfterDiscount = Math.max(0, totalAmount - discountValue);
  const remainingAmount =
    sale.saleType === "INSTALLMENT"
      ? Math.max(0, remainingAfterDiscount - Number(firstInstallment))
      : Math.max(0, remainingAfterDiscount - Number(sale.paidAmount));

  const payPerInstallment =
    sale.saleType === "INSTALLMENT" && totalInstallments > 0
      ? Math.ceil(
        Math.max(0, remainingAfterDiscount - Number(firstInstallment)) / totalInstallments
      )
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer.name || !product.name) {
      showError("Please fill in all required fields.");
      return;
    }

    try {
      const saleData = {
        customer,
        product,
        sale: {
          ...sale,
          quantity: Number(quantity),
          saleDate: new Date(sale.saleDate).toISOString(),
          sellingPrice,
          totalAmount,
          remainingAmount,
          perInstallment: payPerInstallment,
        },
      };

      const data = await post("/sales/oneshot", saleData, {
        message: "One-shot sale created successfully",
      });

      if (data) navigate(`/sales/${Number(data.sale.id)}`);
    } catch (err) {
      showError("Something went wrong. Please check all fields.");
    }
  };

  if (loading)
    return (
      <section className="w-full h-full flex items-center justify-center">
        <Spinner overlay={false} />
      </section>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Manual One-Shot Sale Entry</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] space-y-8"
      >
        {/* CUSTOMER */}
        <section>
          <h2 className="text-xl font-semibold flex items-center border-b pb-2 mb-4">
            <UserPlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Name" name="name" value={customer.name} onChange={handleCustomerChange} required />
            <Input label="CNIC" name="cnic" value={customer.cnic} onChange={handleCustomerChange} required maxLength={13} count />
            <Input label="Phone" name="phone" value={customer.phone} onChange={handleCustomerChange} required maxLength={11} count />
            <Input label="Address" name="address" value={customer.address} onChange={handleCustomerChange} required />
          </div>
        </section>

        {/* PRODUCT */}
        <section className="my-4 lg:my-2">
          <h2 className="text-xl font-semibold flex items-center border-b pb-2 mb-4">
            <PackagePlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />
            Product Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Product Name" name="name" value={product.name} onChange={handleProductChange} required />
            <Input label="Category" name="category" value={product.category} onChange={handleProductChange} />
            <Input label="Brand" name="brand" value={product.brand} onChange={handleProductChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <Input label="Buying Price (PKR)" name="buyingPrice" type="number" value={product.buyingPrice === 0 ? '' : product.buyingPrice} onChange={handleProductChange} />
            <Input label="Selling Price (PKR)" name="sellingPrice" type="number" value={product.sellingPrice === 0 ? '' : product.sellingPrice} onChange={handleProductChange} />
            <Input label="Quantity" name="quantity" type="number" value={sale.quantity} onChange={handleSaleChange} />
            <Input label="Total Amount" value={totalAmount} disabled currency className="lg:col-start-3" />
          </div>
        </section>

        {/* SALE */}
        <section>
          <h2 className="text-xl font-semibold flex items-center border-b pb-2 mb-4">
            <ShoppingBag className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />
            Sale Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select label="Sale Type" name="saleType" value={sale.saleType} onChange={handleSaleChange} options={SALE_TYPES} />
            <Input label="Agreement No." name="agreementNo" type="number" value={sale.agreementNo} onChange={handleSaleChange} />
            <Input label="Sale Date" name="saleDate" type="date" value={sale.saleDate} onChange={handleSaleChange} />
            <Input label="Discount" name="discount" type="number" value={sale.discount} onChange={handleSaleChange} />
            {sale.saleType === "INSTALLMENT" && (
              <>
                <Input label="First Installment" name="firstInstallment" type="number" value={sale.firstInstallment === 0 ? '' : sale.firstInstallment} onChange={handleSaleChange} />
                <Input label="Total Installments" name="totalInstallments" type="number" value={sale.totalInstallments === 0 ? '' : sale.totalInstallments} onChange={handleSaleChange} />
                <Input label="Pay per Installment" value={payPerInstallment} disabled currency />
              </>
            )}
            <Input label="Remaining Amount" value={remainingAmount}
              disabled currency className="opacity-80 col-start-3"
              inputClass="ring-2 ring-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] font-bold" />
          </div>
        </section>

        <Button type="submit" variant="primary" loading={loading} className="w-full text-lg py-3 mt-8">
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Submitting..." : "Create One-Shot Sale"}
        </Button>
      </form>
    </div>
  );
};

export default CombinedNewForm;
