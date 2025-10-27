// src/components/finance/MonthlySummaryTab.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../hooks/useFetch";
import useApi from "../../utils/useApi.js";
import Table from "../Table";

const MonthlySummaryTab = () => {
  const [page, setPage] = useState(1);
  const { del, loading: apiLoading } = useApi();

  const {
    data: summaryData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/finance/summary?page=${page}&limit=10`, {}, true);

  const summaries = summaryData?.monthlySummaries || [];
  const total = summaryData?.total || 0;

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: new Date(0, i).toLocaleString("en-US", { month: "long" }),
        value: i + 1,
      })),
    []
  );

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this monthly summary?")
    ) {
      const result = await del(`/finance/summary/${id}`, {
        message: "Summary deleted successfully",
      });
      if (result !== null) refetch();
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Period",
        accessor: "period",
        render: (row) =>
          `${months.find((m) => m.value === row.month)?.label || "Unknown"}, ${
            row.year
          }`,
      },
      {
        header: "Gross Profit",
        accessor: "grossProfit",
        currency: true,
        render: (row) => Number(row.grossProfit).toLocaleString(),
      },
      {
        header: "Net Profit",
        accessor: "netProfit",
        currency: true,
        render: (row) => Number(row.netProfit).toLocaleString(),
      },
      {
        header: "Total Sales",
        accessor: "totalSales",
        currency: true,
        render: (row) => Number(row.totalSales).toLocaleString(),
      },
      {
        header: "Total Expense",
        accessor: "totalExpense",
        currency: true,
        render: (row) => Number(row.totalExpense).toLocaleString(),
      },
      {
        header: "Stock Value",
        accessor: "stockValue",
        currency: true,
        render: (row) => Number(row.stockValue).toLocaleString(),
      },
    ],
    [months]
  );

  return (
    <div className="space-y-6">
      <div className="min-h-64">
        <Table
          data={summaries}
          columns={columns}
          pagination={{ page, limit: 10, total }}
          onPageChange={setPage}
          onAction={(action, id) => {
            if (action === "delete") handleDelete(id);
          }}
          loading={fetchLoading || apiLoading}
          activeActions={{ remove: true }}
        />
      </div>
    </div>
  );
};

export default MonthlySummaryTab;
