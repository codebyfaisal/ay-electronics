// src/pages/Dashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import Button from "../components/ui/Button";
import FilterSidebar from "../components/FilterSidebar";
import {
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart,
  ListChecks,
  Filter,
  Banknote,
  Landmark,
  Wallet,
  PieChart,
  Users,
  PackageCheck,
  RefreshCw,
} from "lucide-react";
import MetricCard from "../components/MetricCard";
import formatCurrency from "../utils/formatCurrency";
import { showInfo } from "../utils/toast";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CalendarDays, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import useFetch from "../hooks/useFetch";
import Table from "../components/Table";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const months = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(0, i).toLocaleString("en-US", { month: "short" }),
  value: String(i + 1),
}));

const currentMonth = String(new Date().getMonth() + 1);
const currentYear = String(new Date().getFullYear());

const SortableMetricCard = ({ kpi }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: kpi.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? "opacity-50 scale-[1.02] shadow-2xl" : ""}`}
    >
      <MetricCard
        title={kpi.title}
        value={kpi.value}
        icon={kpi.icon}
        colorClass={kpi.color}
        currency={kpi.currency}
      />
    </div>
  );
};

const LOCAL_STORAGE_KEY = "kpiOrder";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    startMonth: currentMonth,
    startYear: currentYear,
    endMonth: "",
    endYear: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    startMonth: currentMonth,
    startYear: currentYear,
  });

  const apiUrl = useMemo(() => {
    let url = `/finance/dashboard?sMonth=${appliedFilters.startMonth}&sYear=${appliedFilters.startYear}`;

    if (appliedFilters.endMonth && appliedFilters.endYear)
      url += `&eMonth=${appliedFilters.endMonth}&eYear=${appliedFilters.endYear}`;

    return url;
  }, [appliedFilters]);

  const { data: upcomingInstallments, loading: upcomingLoading } = useFetch(
    "/sales/installments?status=UPCOMING&limit=5",
    {},
    true
  );

  const { data: lateInstallments, loading: lateLoading } = useFetch(
    "/sales/installments?status=LATE&limit=5",
    {},
    true
  );

  const { data: summaryResponse, loading, error } = useFetch(apiUrl, {}, true);
  const summaryData = summaryResponse;

  const baseKpis = useMemo(() => {
    const data = summaryData;
    return [
      {
        id: "investment",
        title: "Total Investment",
        value: formatCurrency(data?.totalInvestment),
        icon: ListChecks,
        color: "text-purple-500",
        currency: true,
      },
      {
        id: "assets",
        title: "Total Assets Value",
        value: formatCurrency(data?.totalAssetsValue),
        icon: TrendingDown,
        color: "text-red-500",
        currency: true,
      },
      {
        id: "sales-revenue",
        title: "Total Sales Revenue",
        value: formatCurrency(data?.totalSales),
        icon: BarChart,
        color: "text-cyan-500",
        currency: true,
      },
      {
        id: "stock-value",
        title: "Total Stock Value",
        value: formatCurrency(data?.stockValue),
        icon: Package,
        color: "text-yellow-500",
        currency: true,
      },
      {
        id: "net-profit",
        title: "Net Profit",
        value: formatCurrency(data?.netProfit),
        icon: TrendingUp,
        color: "text-[rgb(var(--primary))]",
        currency: true,
      },
      {
        id: "gross-profit",
        title: "Gross Profit",
        value: formatCurrency(data?.grossProfit),
        icon: DollarSign,
        color: "text-blue-500",
        currency: true,
      },
      {
        id: "bank-balance",
        title: "Total Bank Balance",
        value: formatCurrency(data?.totalBank),
        icon: Landmark,
        color: "text-blue-700",
        currency: true,
      },
      {
        id: "cash-on-hand",
        title: "Total Cash on Hand",
        value: formatCurrency(data?.totalCash),
        icon: Banknote,
        color: "text-yellow-700",
        currency: true,
      },
      {
        id: "expenses",
        title: "Total Expenses",
        value: formatCurrency(data?.totalExpense),
        icon: TrendingDown,
        color: "text-red-500",
        currency: true,
      },
      {
        id: "debt-incurred",
        title: "Total Debt Incurred",
        value: formatCurrency(data?.totalDebt),
        icon: Wallet,
        color: "text-red-700",
        currency: true,
      },
      {
        id: "customer-debt",
        title: "Total Debt on Customers",
        value: formatCurrency(Number(data?.totalDebtOnCustomers)),
        icon: BarChart,
        color: "text-cyan-500",
        currency: true,
      },
      {
        id: "cogs",
        title: "Cost of Stock Sold (COGS)",
        value: formatCurrency(data?.costOfStock),
        icon: DollarSign,
        color: "text-orange-500",
        currency: true,
      },
      {
        id: "customers",
        title: "Total Customers",
        value: summaryData?.totalCustomers,
        icon: Users,
        color: "text-indigo-500",
        currency: false,
      },
      {
        id: "products",
        title: "Total Products",
        value: summaryData?.totalProducts,
        icon: PackageCheck,
        color: "text-indigo-500",
        currency: false,
      },
      {
        id: "stock-quantity",
        title: "Total Stock Quantity",
        value: summaryData?.totalStockQuantity,
        icon: Clock,
        color: "text-green-500",
        currency: false,
      },
    ];
  }, [summaryData]);

  const [kpiOrder, setKpiOrder] = useState([]);

  useEffect(() => {
    if (baseKpis.length > 0) {
      const savedOrderJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      const kpiMap = baseKpis.reduce((acc, kpi) => ({ ...acc, [kpi.id]: kpi }), {});

      if (savedOrderJson) {
        try {
          const savedIds = JSON.parse(savedOrderJson);

          const reorderedKpis = savedIds
            .map(id => kpiMap[id])
            .filter(kpi => kpi);

          const existingIds = new Set(reorderedKpis.map(k => k.id));
          const newKpis = baseKpis.filter(kpi => !existingIds.has(kpi.id));

          setKpiOrder([...reorderedKpis, ...newKpis]);
        } catch (e) {
          console.error("Error parsing KPI order from localStorage:", e);
          setKpiOrder(baseKpis);
        }
      } else {
        setKpiOrder(baseKpis);
      }
    }
  }, [baseKpis]);

  useEffect(() => {
    if (kpiOrder.length > 0) {
      const currentOrderIds = kpiOrder.map((kpi) => kpi.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentOrderIds));
    }
  }, [kpiOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setKpiOrder((items) => {
        const oldIndex = items.findIndex((kpi) => kpi.id === active.id);
        const newIndex = items.findIndex((kpi) => kpi.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const kpiIds = useMemo(() => kpiOrder.map(kpi => kpi.id), [kpiOrder]);

  const handleApply = (newFilters) => {
    const hasStart = newFilters.startMonth && newFilters.startYear;
    const hasPartialEnd =
      (newFilters.endMonth && !newFilters.endYear) ||
      (!newFilters.endMonth && newFilters.endYear);

    if (hasStart && hasPartialEnd) {
      showInfo(
        "Please provide both Month and Year for the End Date filter to apply."
      );
      return;
    }
    setFilters(newFilters);

    const newApplied = {
      startMonth: newFilters.startMonth,
      startYear: newFilters.startYear,
    };

    if (newFilters.endMonth && newFilters.endYear) {
      newApplied.endMonth = newFilters.endMonth;
      newApplied.endYear = newFilters.endYear;
    }

    setAppliedFilters(newApplied);
  };

  const handleReset = () => {
    const defaults = {
      startMonth: currentMonth,
      startYear: currentYear,
      endMonth: "",
      endYear: "",
    };
    setFilters(defaults);
    setAppliedFilters({
      startMonth: currentMonth,
      startYear: currentYear,
    });
  };

  const getMonthName = (monthValue) =>
    months.find((m) => String(m.value) === String(monthValue))?.label;

  const periodDisplay = (() => {
    if (!summaryData?.from) return "Latest Available Period";

    const fromMonthName = getMonthName(summaryData.from.month);
    const fromYear = summaryData.from.year;

    if (summaryData.to && summaryData.from.month !== summaryData.to.month) {
      const toMonthName = getMonthName(summaryData.to.month);
      const toYear = summaryData.to.year;
      return `${fromMonthName} ${fromYear} to ${toMonthName} ${toYear}`;
    }

    return `${fromMonthName} ${fromYear}`;
  })();

  if ((loading && !summaryData)) {
    return (
      <div className="size-full flex items-center justify-center">
        <Spinner overlay={false} />
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error loading dashboard data: {error}
      </div>
    );

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <h2 className="text-2xl font-bold">{periodDisplay}</h2>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleReset} className="flex-grow">
            <RefreshCw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button variant="primary" onClick={() => setIsFilterOpen(true)}>
            <Filter className="w-5 h-5 mr-2" /> Filter Report
          </Button>
        </div>
      </header>

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialFilters={filters}
        onApply={handleApply}
        onReset={handleReset}
      />

      {summaryData ? (
        <>
          <section>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                <SortableContext
                  items={kpiIds}
                  strategy={rectSortingStrategy}
                >
                
                  {kpiOrder.map((kpi) => (
                    <SortableMetricCard key={kpi.id} kpi={kpi} />
                  ))}
                </SortableContext>
              </div>
            </DndContext>
          </section>

          <section className="mt-10 bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />
                Upcoming Installments
              </h2>
              <Link
                to="/sales"
                className="flex items-center text-[rgb(var(--primary))] hover:underline"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <Table
              purpose="upcoming-installments"
              data={upcomingInstallments?.installments || []}
              loading={upcomingLoading}
              columns={[
                {
                  header: "Customer",
                  accessor: "customerName",
                },
                {
                  header: "Due Date",
                  accessor: "dueDate",
                  render: (row) => new Date(row.dueDate).toLocaleDateString(),
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  render: (row) => (
                    <>
                      {Math.round(Number(row.amount)).toLocaleString()}{" "}
                      <span className="text-[0.7rem]">PKR</span>
                    </>
                  ),
                },
                {
                  header: "Days Left",
                  accessor: "daysUntilDue",
                  render: (row) => (
                    <span
                      className={`font-bold ${row.daysUntilDue === 0 ? "text-yellow-600" : "text-green-600"
                        }`}
                    >
                      {row.daysUntilDue === 0
                        ? "Today"
                        : `${row.daysUntilDue} day${row.daysUntilDue > 1 ? "s" : ""}`}
                    </span>
                  ),
                },
              ]}
              onAction={(action, id) => {
                navigate(`/sales/${id}`);
              }}
              activeActions={{ view: true }}
              id={true}
            />
          </section>

          <section className="mt-10 bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold flex items-center">
                <Clock className="w-5 h-5 mr-2 text-red-500" />
                Late Installments
              </h2>
              <Link
                to="/sales"
                className="flex items-center text-[rgb(var(--primary))] hover:underline"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <Table
              purpose="late-installments"
              data={lateInstallments?.installments || []}
              loading={lateLoading}
              columns={[
                {
                  header: "Customer",
                  accessor: "customerName",
                },
                {
                  header: "Due Date",
                  accessor: "dueDate",
                  render: (row) => new Date(row.dueDate).toLocaleDateString(),
                },
                {
                  header: "Amount",
                  accessor: "amount",
                  render: (row) => (
                    <>
                      {Math.round(Number(row.amount)).toLocaleString()}{" "}
                      <span className="text-[0.7rem]">PKR</span>
                    </>
                  ),
                },
                {
                  header: "Days Overdue",
                  accessor: "daysOverdue",
                  render: (row) => (
                    <span className="text-red-600 font-bold">
                      {row.daysOverdue} day{row.daysOverdue > 1 ? "s" : ""}
                    </span>
                  ),
                },
              ]}
              onAction={(action, id) => {
                navigate(`/sales/${id}`);
              }}
              activeActions={{ view: true }}
              id={true}
            />
          </section>


          {/* This section remains hidden, as per original code, but is preserved */}
          {/* <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <MonthlyProfitChart summaryData={summaryData} />
            <FinancialMixChart
              totalSales={summaryData.totalSales}
              totalExpense={summaryData.totalExpense}
              totalDebt={summaryData.totalDebt}
            />
          </section> */}
        </>
      ) : (
        <section className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-3">
          <p className="text-gray-500">
            No summary data available for the selected period.
          </p>
        </section>
      )}
    </>
  );
};

export default Dashboard;