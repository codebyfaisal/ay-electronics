// src/components/finance/MonthlySummaryTab.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../hooks/useFetch";
import useApi from "../../utils/useApi.js";
import Table from "../Table";
import { X, DollarSign, BarChart2, TrendingUp, Package, Users, Zap } from "lucide-react";
import classNames from 'classnames';
import Button from "../ui/Button.jsx";

const KPICard = ({ title, value, icon: Icon, colorClass = 'text-green-500', currency = true }) => (
  <div className="p-6 rounded-lg shadow-xl flex items-center justify-between bg-[rgb(var(--bg))]">
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xl font-bold">
        {currency ? 'PKR ' : ''}
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
    <Icon size={24} className={colorClass} />
  </div>
);

const SummaryDetailsSidebar = ({ isOpen, setIsOpen, summary, months }) => {

  const period = summary
    ? `${months.find((m) => m.value === summary.month)?.label}, ${summary.year}`
    : 'Select a Period';

  const baseClass = "fixed top-0 right-0 h-full w-full md:w-1/2 text-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto bg-[rgb(var(--bg-secondary))]";

  const sidebarClasses = classNames(baseClass, {
    'translate-x-0': isOpen,
    'translate-x-full': !isOpen,
  });

  if (!summary) return null;

  const kpis = [
    { title: 'Total Sales Revenue', value: summary.totalSales, icon: BarChart2, colorClass: 'text-green-500' },
    { title: 'Cost of Stock Sold (COGS)', value: summary.costOfStock, icon: Package, colorClass: 'text-red-500' },
    { title: 'Gross Profit', value: summary.grossProfit, icon: DollarSign, colorClass: 'text-blue-400' },
    { title: 'Net Profit', value: summary.netProfit, icon: TrendingUp, colorClass: 'text-purple-400' },
    { title: 'Total Expenses', value: summary.totalExpense, icon: Zap, colorClass: 'text-red-500' },
    { title: 'Total Debt Incurred', value: summary.totalDebt, icon: DollarSign, colorClass: 'text-yellow-500' },
    { title: 'Total Debt on Customers', value: summary.totalDebtOnCustomers, icon: Users, colorClass: 'text-teal-400' },
    { title: 'Total Stock Value', value: summary.stockValue, icon: Package, colorClass: 'text-indigo-400' },
    { title: 'Total Investment', value: summary.totalInvestment, icon: Zap, colorClass: 'text-pink-400' },
    { title: 'Total Stock Quantity', value: summary.totalStockQuantity, icon: Package, colorClass: 'text-orange-400', currency: false },
    { title: 'Total Customers', value: summary.totalCustomers, icon: Users, colorClass: 'text-cyan-400', currency: false },
    { title: 'Total Products', value: summary.totalProducts, icon: Zap, colorClass: 'text-lime-400', currency: false },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 opacity-50 z-40"
        onClick={() => setIsOpen(false)}>
      </div>}

      <div className={sidebarClasses}>
        <div className="bg-[rgb(var(--bg-secondary))] sticky top-0 py-3.5 w-full space-y-2 px-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Summary Details</h2>
            <Button
              onClick={() => setIsOpen(false)}
              variant="secondary"
            >
              <X size={24} />
            </Button>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-primary))]">{period}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6">
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
      </div>
    </>
  );
};

const MonthlySummaryTab = () => {
  const [page, setPage] = useState(1);
  const { loading: apiLoading } = useApi();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);

  const {
    data: summaryData,
    loading: fetchLoading,
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

  const handleAction = async (action, id) => {
    const summaryRow = summaries.find(s => s.id === id);

    switch (action) {
      case "view":
        if (summaryRow) {
          setSelectedSummary(summaryRow);
          setIsSidebarOpen(true);
        }
        break;
      default:
        break;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Period",
        accessor: "period",
        render: (row) =>
          `${months.find((m) => m.value === row.month)?.label || "Unknown"}, ${row.year
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
          purpose="summaries"
          data={summaries}
          columns={columns}
          pagination={{ page, limit: 10, total }}
          onPageChange={setPage}
          onAction={handleAction}
          loading={fetchLoading || apiLoading}
          activeActions={{ view: true }}
        />
      </div>

      <SummaryDetailsSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        summary={selectedSummary}
        months={months}
      />
    </div>
  );
};

export default MonthlySummaryTab;