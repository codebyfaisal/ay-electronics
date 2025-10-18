// src/pages/CustomerEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/Spinner";
import { ArrowLeft, User, Save } from "lucide-react";
import { showError } from "../utils/toast";

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = Number(id);

  const {
    data: customer,
    loading: fetchLoading,
    error: fetchError,
  } = useFetch(`/customers/${customerId}`, {}, true);

  const { put, loading: updateLoading } = useApi();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cnic: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        cnic: customer.cnic || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const name = e.target.name;
    let value = e.target.value;

    if (name === "phone" || name === "cnic")
      value = value.replace(/[^0-9]/g, "");
    else if (name === "email") value = value.toLowerCase();

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data = formData) => {
    const newErrors = {};

    if (!data.name || data.name.length < 2)
      newErrors.name = "Name must be at least 2 characters.";

    if (!data.cnic || data.cnic.length !== 13)
      newErrors.cnic = "CNIC must be exactly 13 characters.";

    if (!data.phone || data.phone.length < 9 || data.phone.length > 11)
      newErrors.phone = "Phone must be between 9 and 11 digits.";

    if (!data.address) newErrors.address = "Address is required.";

    if (data.email && !/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Email is invalid.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedData = {};
    for (const key in formData) {
      const value = formData[key].trim();
      if (key === "email" && value === "") continue;
      trimmedData[key] = value;
    }

    setFormData(trimmedData);

    if (!validateForm(trimmedData)) {
      showError("Please correct the errors in the form.");
      return;
    }

    const payload = {
      ...trimmedData,
    };

    const result = await put(
      `/customers/${customerId}`,
      payload,
      { message: "Customer updated successfully" }
    );

    if (result) {
      navigate(`/customers/${customerId}`);
    }
  };

  const loading = fetchLoading || updateLoading;

  if (fetchError) {
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error loading customer data: {fetchError}
      </div>
    );
  }

  if (loading && !customer) {
    return <Spinner overlay={false} />;
  }

  if (!customer) {
    return <div className="text-center p-4">Customer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/customers/${customerId}`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Customer: {customer.name}</h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))] max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center mb-4">
            <User className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
            <Input
              label="CNIC (e.g., 1730122343445)"
              id="cnic"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              required
              maxLength={13}
              count={true}
              error={errors.cnic}
            />
            <Input
              label="Phone"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              type="tel"
              maxLength={11}
              error={errors.phone}
              count={true}
            />
            <Input
              label="Email (Optional)"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
          </div>

          <Input
            label="Address"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            error={errors.address}
          />

          <Button
            type="submit"
            variant="primary"
            loading={updateLoading}
            className="w-full text-lg py-3 mt-8"
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            {updateLoading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CustomerEdit;
