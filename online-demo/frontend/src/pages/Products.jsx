// src/pages/Products.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi.js";
import Table from "../components/Table";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Plus, Search, RefreshCw } from "lucide-react";

const Products = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [finalSearch, setFinalSearch] = useState("");
  const { del, loading: deleteLoading } = useApi();

  const {
    data: productData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/products?page=${page}&limit=10&name=${finalSearch}`, {}, true);

  const products = productData?.products || [];
  const total = productData?.total || 0;

  const handleSearch = () => {
    setPage(1);
    setFinalSearch(searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
    setFinalSearch("");
    setPage(1);
  };

  const handleAction = async (action, id) => {
    switch (action) {
      case "view":
        navigate(`/products/${id}`);
        break;
      case "new":
        navigate(`/products/new`);
        break;
      case "edit":
        navigate(`/products/edit/${id}`);
        break;
      case "delete":
        if (
          window.confirm(
            "Are you sure you want to delete this product? This will remove all associated stock transactions and sales may become inconsistent."
          )
        ) {
          const result = await del(`/products/${id}`,
            { message: "Product deleted successfully" }
          );
          if (result !== null)
            refetch();
        }
        break;
      default:
        break;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessor: "name",
        className: "capitalize",
      },
      { header: "Category", accessor: "category", className: "capitalize" },
      {
        header: "Selling Price",
        accessor: "sellingPrice",
        currency: true,
        render: (row) => Number(row.sellingPrice).toLocaleString(),
      },
      { header: "Stock Qty", accessor: "stockQuantity" },
      {
        header: "Purchase Date",
        accessor: "purchaseDate",
        render: (row) => new Date(row.purchaseDate).toLocaleDateString(),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Product Inventory</h1>
        <Button
          variant="primary"
          onClick={() => handleAction("new")}
          className="w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" /> Add New Product
        </Button>
      </div>

      <div className="flex w-full md:w-auto space-x-2">
        <Input
          type="search"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="w-full"
        />
        <Button variant="secondary" onClick={handleSearch} title="Search">
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
          purpose="products"
          data={products}
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
      </div>
    </div>
  );
};

export default Products;
