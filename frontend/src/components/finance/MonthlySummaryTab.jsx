// src/components/finance/MonthlySummaryTab.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../hooks/useFetch";
import useApi from "../../utils/useApi.js";
import Table from "../Table";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { RefreshCw } from "lucide-react";

const MonthlySummaryTab = () => {
  const [page, setPage] = useState(1);
  const [recalcMonth, setRecalcMonth] = useState(new Date().getMonth() + 1);
  const [recalcYear, setRecalcYear] = useState(new Date().getFullYear());
  const { post, del, loading: apiLoading } = useApi();

  // Fetch monthly summaries
  const {
    data: summaryData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/finance/monthly?page=${page}&limit=10`, {}, true);

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => ({
      label: (startYear + i).toString(),
      value: startYear + i,
    }));
  }, []);

  const handleRecalculate = async () => {
    const data = {
      month: Number(recalcMonth),
      year: Number(recalcYear),
    };
    const result = await post(
      "/finance/monthly",
      data,
      {
        server: true,
        message: `Summary for ${recalcMonth}/${recalcYear} generated successfully`
      }
    );
    if (result) {
      refetch();
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this monthly summary?")
    ) {
      const result = await del(
        `/finance/monthly/${id}`,
        {
          message: "Summary deleted successfully"
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
          `${months.find((m) => m.value === row.month).label}, ${row.year}`,
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
      <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <Select
          label="Month to Generate/Recalculate"
          value={recalcMonth}
          onChange={(e) => setRecalcMonth(Number(e.target.value))}
          options={months}
        />
        <Select
          label="Year"
          value={recalcYear}
          onChange={(e) => setRecalcYear(Number(e.target.value))}
          options={years}
        />
        <Button
          variant="secondary"
          onClick={handleRecalculate}
          loading={apiLoading}
          className="md:col-span-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Generate/Recalculate Summary
        </Button>
      </div>

      <div className="relative min-h-64">
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
