// src/pages/CustomerNew.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useApi from "../utils/useApi";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import { showError } from "../utils/toast";

const CustomerNew = () => {
  const navigate = useNavigate();
  const { post, loading: createLoading } = useApi();

  const [formData, setFormData] = useState({
    name: "",
    cnic: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

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
    for (const key in formData)
      trimmedData[key] = formData[key].trim();

    setFormData(trimmedData);

    if (!validateForm(trimmedData)) {
      showError("Please correct the errors in the form.");
      return;
    }

    const result = await post("/customers", trimmedData,
      { message: "Customer created successfully" });

    if (result) navigate(`/customers`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to={`/customers`}>
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Customer Enrollment</h1>
      </div>

      <div className="bg-[rgb(var(--bg))] p-8 rounded-md shadow-md border border-[rgb(var(--border))]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center border-b pb-2 mb-4">
            <UserPlus className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
            Customer Details
          </h2>

          <Input
            label="Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="CNIC (e.g., 1730122343445)"
              id="cnic"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              required
              maxLength={13}
              error={errors.cnic}
              count={true}
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
            loading={createLoading}
            className="w-full text-lg py-3 mt-8"
          >
            <Save className="w-5 h-5 mr-2" />
            {createLoading ? "Creating Customer..." : "Create Customer"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CustomerNew;
