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
    cnic: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedData = {};
    for (const key in formData) trimmedData[key] = formData[key].trim();

    setFormData(trimmedData);

    if (!validateForm(trimmedData)) {
      showError("Please correct the errors in the form.");
      return;
    }

    const payload = { ...trimmedData };

    const result = await put(`/customers/${customerId}`,
      payload, { message: "Customer updated successfully" }
    );

    if (result) navigate(`/customers/${customerId}`);
  };

  const loading = fetchLoading || updateLoading;

  if (fetchError) {
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error loading customer data: {fetchError}
      </div>
    );
  }

  if (loading && !customer) return (
    <section className="w-full h-full flex items-center justify-center">
      <Spinner overlay={false} />;
    </section>
  );

  if (!customer) return (
    <div className="w-full h-full flex items-center justify-center text-center p-4">
      Customer not found.
    </div>
  )

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

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))]">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold flex items-center mb-4 border-b pb-2">
            <User className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Customer Information
          </h2>

          <Input
            label="Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder={"e.g gohar"}
            error={errors.name}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-2">
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
              placeholder={"e.g 1730122343445"}
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
              placeholder={"e.g 032093996953"}
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
            placeholder={"Peshawar"}
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
