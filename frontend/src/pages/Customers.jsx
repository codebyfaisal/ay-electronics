// src/pages/Customers.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi";
import Table from "../components/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/Spinner";
import { Plus, Search, RefreshCw } from "lucide-react";
import Select from "../components/ui/Select";

const customerSearchOptions = [
  { label: "Name", value: "name" },
  { label: "CNIC", value: "cnic" },
  { label: "Phone", value: "phone" },
  { label: "ID", value: "id" },
];

const Customers = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    queryValue: "",
    queryType: "name",
  });

  const [appliedFilters, setAppliedFilters] = useState({});

  const { del, loading: deleteLoading } = useApi();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 10 });

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params.toString();
  }, [page, appliedFilters]);

  const {
    data: customerData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/customers?${queryString}`, {}, true);

  const customers = customerData?.customers || [];
  const total = customerData?.total || 0;

  const handleApplyFilters = () => {
    setPage(1);

    const newAppliedFilters = {};
    const input = filters.queryValue.trim();
    const type = filters.queryType;

    if (input) {
      newAppliedFilters[type] = input;
    }

    setAppliedFilters(newAppliedFilters);
  };

  const handleReset = () => {
    setFilters({
      queryValue: "",
      queryType: "name",
    });
    setAppliedFilters({});
    setPage(1);
  };

  const handleAction = async (action, id) => {
    switch (action) {
      case "view":
        navigate(`/customers/${id}`);
        break;
      case "new":
        navigate(`/customers/new`);
        break;
      case "edit":
        navigate(`/customers/edit/${id}`);
        break;
      case "delete":
        if (
          window.confirm(
            "Are you sure you want to delete this customer? This action cannot be undone."
          )
        ) {
          const result = await del(`/customers/${id}`,
            { message: "Customer deleted successfully" });
          if (result !== null) {
            refetch();
          }
        }
        break;
      default:
        break;
    }
  };

  const columns = useMemo(
    () => [
      { header: "Name", accessor: "name", className: "capitalize" },
      { header: "CNIC", accessor: "cnic" },
      { header: "Phone", accessor: "phone" },
      { header: "Address", accessor: "address" },
      {
        header: "Created At",
        accessor: "createdAt",
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },      
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <Button
          variant="primary"
          onClick={() => handleAction("new")}
          className="w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" /> Add New Customer
        </Button>
      </div>
      <div className="flex w-full md:w-auto space-x-2">
        <div className="flex items-end gap-2 w-full">
          <Input
            type="search"
            placeholder={`Search by ${customerSearchOptions.find((o) => o.value === filters.queryType)
              ?.label || "Name"
              }`}
            value={filters.queryValue}
            onChange={(e) =>
              setFilters((f) => ({ ...f, queryValue: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            className="w-full"
          />
          <Select
            value={filters.queryType}
            onChange={(e) =>
              setFilters((f) => ({ ...f, queryType: e.target.value }))
            }
            options={customerSearchOptions}
            className="w-24"
          />
        </div>

        <Button variant="secondary" onClick={handleApplyFilters} title="Search">
          <Search className="w-5 h-5" />
          <span className="hidden md:inline">Search</span>
        </Button>
        <Button variant="secondary" onClick={handleReset} title="Reset Filter">
          <RefreshCw className="w-5 h-5" />
          <span className="hidden md:inline">Reset</span>
        </Button>
      </div>

      <div className="relative min-h-64">
        <Table
          purpose="customers"
          data={customers}
          columns={columns}
          pagination={{ page, limit: 10, total }}
          onPageChange={setPage}
          onAction={handleAction}
          loading={fetchLoading || deleteLoading}
          activeActions={{
            view: true,
            edit: true,
            remove: true,
          }}
        />
        {(fetchLoading || deleteLoading) && <Spinner overlay={true} />}
      </div>
    </div>
  );
};

export default Customers;
