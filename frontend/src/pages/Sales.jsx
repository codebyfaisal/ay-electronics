// src/pages/Sales.jsx
import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi.js";
import Table from "../components/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { RefreshCw, ShoppingBag, Filter } from "lucide-react";
import Select from "../components/ui/Select.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const customerSearchOptions = [
  { label: "Name", value: "customerName" },
  { label: "Phone", value: "phone" },
  { label: "CNIC", value: "cnic" },
  { label: "ID", value: "customerId" },
];

const Sales = () => {
  const navigate = useNavigate();
  const query = useQuery();

  const regNo = query.get("regNo") || "";
  const initialCustomerId = query.get("customerId") || "";
  const initialProductQuery = query.get("productName") || "";
  const initialCustomerFilterType =
    query.get("customerFilterType") ||
    (initialCustomerId ? "customerId" : "customerName");

  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    regNo,
    customerQuery: initialCustomerId,
    customerFilterType: initialCustomerFilterType,
    productQuery: initialProductQuery,
    saleDate: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const initial = {};

    if (initialCustomerId)
      initial[initialCustomerFilterType] = initialCustomerId;

    if (initialProductQuery) initial.productName = initialProductQuery;

    return initial;
  });

  const { del, loading: deleteLoading } = useApi();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 10 });

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params.toString();
  }, [page, appliedFilters]);

  const {
    data: salesData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/sales?${queryString}`, {}, true);

  const sales = salesData?.sales || [];
  const total = salesData?.total || 0;

  const handleApplyFilters = () => {
    setPage(1);

    const newAppliedFilters = {};
    const customerInput = filters.customerQuery.trim();
    const productInput = filters.productQuery.trim();
    const customerFilterType = filters.customerFilterType;

    if (filters.regNo) newAppliedFilters.regNo = filters.regNo;
    if (customerInput) newAppliedFilters[customerFilterType] = customerInput;
    if (productInput) newAppliedFilters.productName = productInput;
    if (filters.saleDate) newAppliedFilters.saleDate = filters.saleDate;

    setAppliedFilters(newAppliedFilters);
  };

  const handleReset = () => {
    setFilters({
      regNo: "",
      customerQuery: "",
      customerFilterType: "customerName",
      productQuery: "",
      saleDate: "",
    });
    setAppliedFilters({});
    setPage(1);
  };

  const handleAction = async (action, id) => {
    switch (action) {
      case "view":
        navigate(`/sales/${id}`);
        break;
      case "new":
        navigate(`/sales/new`);
        break;
      case "edit":
        navigate(`/sales/edit/${id}`);
        break;
      case "delete":
        if (
          window.confirm(
            "Are you sure you want to delete this sale? This action will reverse stock and cash flow."
          )
        ) {
          const result = await del(`/sales/${id}`,
            { message: "Sale deleted, stock and cash flow reversed successfully" }
          );
          if (result !== null) refetch();
        }
        break;
      default:
        break;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Customer Name",
        accessor: "customer.name",
        render: (row) => row.customer?.name || "N/A",
        onClick: (row) => navigate(`/customers/${row.customerId}`),
        className: "capitalize",
      },
      {
        header: "Product Name",
        accessor: "product.name",
        render: (row) => row.product?.name || "N/A",
        onClick: (row) => navigate(`/products/${row.productId}`),
        className: "capitalize",
      },
      {
        header: "Sale Price",
        accessor: "totalAmount",
        render: (row) => Number(row.totalAmount).toLocaleString(),
        currency: true
      },
      {
        header: "Paid Amount",
        accessor: "paidAmount",
        render: (row) => Number(row.paidAmount).toLocaleString(),
        currency: true
      },
      {
        header: "Remaining Balance",
        accessor: "remainingAmount",
        render: (row) => Number(row.remainingAmount).toLocaleString(),
        currency: true
      },
      {
        header: "Remaining Installments",
        accessor: "remainingInstallments",
        className: "text-center",
        render: (row) => row.saleType === "CASH" ?
          <StatusBadge status={row.saleType} /> :
          (Number(row.totalInstallments) - Number(row.paidInstallments)).toLocaleString(),
      },
      {
        header: "Status", accessor: "status",
        render: (row) => <StatusBadge status={row.status} />
      },
      {
        header: "Sale Date",
        accessor: "saleDate",
        render: (row) => new Date(row.saleDate).toLocaleDateString(),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Sales Records</h1>
        <Button
          variant="primary"
          onClick={() => handleAction("new")}
          className="w-full md:w-auto"
        >
          <ShoppingBag className="w-5 h-5 mr-2" /> Add New Sale
        </Button>
      </div>

      <div className="bg-[rgb(var(--bg))] p-4 rounded-lg shadow-md border border-[rgb(var(--border))]">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <Input
            label="Registration No."
            type="number"
            value={filters.regNo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, regNo: e.target.value }))
            }
            placeholder="e.g 1"
            className="col-span-full md:col-span-1"
          />
          <Input
            label="Product Name"
            type="search"
            value={filters.productQuery}
            onChange={(e) =>
              setFilters((f) => ({ ...f, productQuery: e.target.value }))
            }
            placeholder="Product Name Search"
            className="col-span-full md:col-span-2"
          />

          <div className="col-span-full md:col-span-3 flex items-end gap-2">
            <Input
              label="Customer Search"
              type="search"
              value={filters.customerQuery}
              onChange={(e) =>
                setFilters((f) => ({ ...f, customerQuery: e.target.value }))
              }
              placeholder={`Search by ${customerSearchOptions.find(
                (o) => o.value === filters.customerFilterType
              )?.label || "Name"
                }`}
              className="w-full"
            />
            <span className="h-full flex items-center translate-y-3">by</span>

            <Select
              value={filters.customerFilterType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  customerFilterType: e.target.value,
                }))
              }
              className="w-1/4"
              options={customerSearchOptions}
            />
          </div>

          <Input
            label="Sale Date"
            type="date"
            value={filters.saleDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, saleDate: e.target.value }))
            }
            className="col-span-full md:col-span-2"
          />
          <div className="flex justify-end items-end gap-4 col-span-full md:col-span-4">
            <Button
              variant="secondary"
              onClick={handleReset}
              title="Reset All Filters"
              className="size-max"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Reset
            </Button>
            <Button
              variant="secondary"
              onClick={handleApplyFilters}
              className="size-max whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-1" /> Apply Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="relative min-h-64">
        <Table
          purpose="sales"
          data={sales}
          columns={columns}
          pagination={{ page, limit: 10, total }}
          onPageChange={setPage}
          onAction={handleAction}
          loading={fetchLoading || deleteLoading}
          activeActions={{
            view: true,
            remove: true,
          }}
          id={true}
        />
      </div>

      {Object.keys(appliedFilters).length > 0 && (
        <div className="mt-4 text-right">
          <p className="text-sm text-gray-500">
            Active Filters:{" "}
            {Object.entries(appliedFilters).map(([key, val]) => (
              <span
                key={key}
                className="bg-[rgb(var(--bg-secondary))] px-2 py-1 rounded-full text-xs ml-2"
              >
                {key}: {val}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales;
