// // src/pages/Dashboard.jsx
// import React, { useMemo, useState } from "react";
// import useFetch from "../hooks/useFetch";
// import Spinner from "../components/Spinner";
// import Button from "../components/ui/Button";
// import FilterSidebar from "../components/FilterSidebar";
// import {
//   DollarSign,
//   Package,
//   TrendingUp,
//   TrendingDown,
//   Clock,
//   BarChart,
//   ListChecks,
//   Filter,
//   Banknote,
//   Landmark,
//   Wallet,
//   PieChart,
//   Users,
//   Package2,
//   PackageCheck,
// } from "lucide-react";
// import MetricCard from "../components/MetricCard";
// import formatCurrency from "../utils/formatCurrency";
// import { showInfo } from "../utils/toast";

// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
// } from "chart.js";
// import { Pie, Line } from "react-chartjs-2";
// import useApi from "../utils/useApi";

// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title
// );

// const months = Array.from({ length: 12 }, (_, i) => ({
//   label: new Date(0, i).toLocaleString("en-US", { month: "short" }),
//   value: String(i + 1),
// }));

// const currentMonth = String(new Date().getMonth() + 1);
// const currentYear = String(new Date().getFullYear());

// const MonthlyProfitChart = ({ summaryData }) => {
//   const netProfit = Number(summaryData?.netProfit || 0);
//   const grossProfit = Number(summaryData?.grossProfit || 0);

//   const trendData = summaryData?.trendData || [];

//   const chartData = useMemo(() => {
//     const labels = trendData.map(
//       (d) =>
//         `${months.find((m) => String(m.value) === String(d.month))?.label
//         } ${String(d.year).slice(-2)}`
//     );

//     return {
//       labels: labels,
//       datasets: [
//         {
//           label: "Net Profit",
//           data: trendData.map((d) => d.netProfit),
//           borderColor: "rgb(34, 197, 94)",
//           backgroundColor: "rgba(34, 197, 94, 0.5)",
//           tension: 0.2,
//           fill: false,
//         },
//         {
//           label: "Gross Profit",
//           data: trendData.map((d) => d.grossProfit),
//           borderColor: "rgb(59, 130, 246)",
//           backgroundColor: "rgba(59, 130, 246, 0.5)",
//           tension: 0.2,
//           fill: false,
//           borderDash: [5, 5],
//         },
//       ],
//     };
//   }, [trendData]);

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "top" },
//       title: {
//         display: true,
//         text: "Profit Trend Over Selected Period",
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           callback: function (value) {
//             return formatCurrency(value);
//           },
//         },
//       },
//       x: {
//         grid: { display: false },
//       },
//     },
//   };

//   return (
//     <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] col-span-2 h-max">
//       <h2 className="text-xl font-semibold mb-4 flex items-center">
//         <BarChart className="w-5 h-5 mr-2 text-blue-500" /> Profit & Sales Trend
//       </h2>
//       <div className="space-y-4 mb-2">
//         <p className="text-sm font-semibold">
//           Net Profit: {formatCurrency(netProfit)}
//         </p>
//         <p className="text-sm font-semibold">
//           Gross Profit: {formatCurrency(grossProfit)}
//         </p>
//       </div>
//       <div className="h-64">
//         {trendData.length > 0 ? (
//           <Line data={chartData} options={chartOptions} />
//         ) : (
//           <div className="flex items-center justify-center h-full text-gray-500 border-2 border-dashed border-[rgb(var(--border))] rounded p-4">
//             No monthly summaries available for this period to show trend.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const FinancialMixChart = ({ totalSales, totalExpense, totalDebt }) => {
//   const sales = Number(totalSales || 0);
//   const expenses = Number(totalExpense || 0);
//   const debt = Number(totalDebt || 0);


//   const chartData = useMemo(() => {
//     return {
//       labels: ["Total Sales", "Total Expenses", "Total Debt"],
//       datasets: [
//         {
//           data: [sales, expenses, debt],
//           backgroundColor: [
//             "rgb(34, 197, 94)",
//             "rgb(239, 68, 68)",
//             "rgb(255, 159, 64)",
//           ],
//           hoverOffset: 10,
//         },
//       ],
//     };
//   }, [sales, expenses, debt]);

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: "bottom",
//         labels: {
//           generateLabels: (chart) => {
//             const data = chart.data.datasets[0].data;
//             const labels = chart.data.labels;
//             const total = data.reduce((sum, value) => sum + value, 0);

//             return labels.map((label, index) => ({
//               text: `${label}: ${formatCurrency(data[index])} (${(
//                 (data[index] / total) *
//                 100
//               ).toFixed(1)}%)`,
//               fillStyle: chart.data.datasets[0].backgroundColor[index],
//               strokeStyle: "rgba(0,0,0,0)",
//               lineWidth: 0,
//             }));
//           },
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: ({ label, raw }) => `${label}: ${formatCurrency(raw)}`,
//         },
//       },
//     },
//   };

//   return (
//     <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] max-h-103">
//       <h2 className="text-xl font-semibold mb-4 flex items-center">
//         <PieChart className="w-5 h-5 mr-2 text-purple-500" /> Key Financial Flow
//         Mix
//       </h2>
//       <div className="h-full flex justify-center items-center">
//         <Pie data={chartData} options={chartOptions} />
//       </div>
//     </div>
//   );
// };

// const Dashboard = () => {
//   const [isFilterOpen, setIsFilterOpen] = useState(false);

//   const [filters, setFilters] = useState({
//     startMonth: currentMonth,
//     startYear: currentYear,
//     endMonth: "",
//     endYear: "",
//   });

//   const [appliedFilters, setAppliedFilters] = useState({
//     startMonth: currentMonth,
//     startYear: currentYear,
//   });

//   const apiUrl = useMemo(() => {
//     let url = `/finance/dashboard?startM=${appliedFilters.startMonth}&startY=${appliedFilters.startYear}`;

//     if (appliedFilters.endMonth && appliedFilters.endYear)
//       url += `&endM=${appliedFilters.endMonth}&endY=${appliedFilters.endYear}`;

//     return url;
//   }, [appliedFilters]);

//   const { data: summaryResponse, loading, error } = useFetch(apiUrl, {}, true);

//   const summaryData = summaryResponse;


//   const handleApply = (newFilters) => {
//     const hasStart = newFilters.startMonth && newFilters.startYear;
//     const hasPartialEnd =
//       (newFilters.endMonth && !newFilters.endYear) ||
//       (!newFilters.endMonth && newFilters.endYear);

//     if (hasStart && hasPartialEnd) {
//       showInfo(
//         "Please provide both Month and Year for the End Date filter to apply."
//       );
//       return;
//     }

//     setFilters(newFilters);

//     const newApplied = {
//       startMonth: newFilters.startMonth,
//       startYear: newFilters.startYear,
//     };

//     if (newFilters.endMonth && newFilters.endYear) {
//       newApplied.endMonth = newFilters.endMonth;
//       newApplied.endYear = newFilters.endYear;
//     }

//     setAppliedFilters(newApplied);
//   };

//   const handleReset = () => {
//     const defaults = {
//       startMonth: currentMonth,
//       startYear: currentYear,
//       endMonth: "",
//       endYear: "",
//     };
//     setFilters(defaults);
//     setAppliedFilters({
//       startMonth: currentMonth,
//       startYear: currentYear,
//     });
//   };


//   const allKpis = useMemo(() => {
//     const data = summaryData;
//     return [
//       {
//         title: "Total Investment",
//         value: formatCurrency(data?.totalInvestment),
//         icon: ListChecks,
//         color: "text-purple-500",
//         currency: true,
//       },
//       {
//         title: "Total Assets Value",
//         value: formatCurrency(data?.totalAssetsValue),
//         icon: TrendingDown,
//         color: "text-red-500",
//         currency: true,
//       },
//       {
//         title: "Net Profit",
//         value: formatCurrency(data?.netProfit),
//         icon: TrendingUp,
//         color: "text-[rgb(var(--primary))]",
//         currency: true,
//       },
//       {
//         title: "Gross Profit",
//         value: formatCurrency(data?.grossProfit),
//         icon: DollarSign,
//         color: "text-blue-500",
//         currency: true,
//       },
//       {
//         title: "Total Bank Balance",
//         value: formatCurrency(data?.totalBank),
//         icon: Landmark,
//         color: "text-blue-700",
//         currency: true,
//       },
//       {
//         title: "Total Cash on Hand",
//         value: formatCurrency(data?.totalCash),
//         icon: Banknote,
//         color: "text-yellow-700",
//         currency: true,
//       },
//       {
//         title: "Total Expenses",
//         value: formatCurrency(data?.totalExpense),
//         icon: TrendingDown,
//         color: "text-red-500",
//         currency: true,
//       },
//       {
//         title: "Total Debt Incurred",
//         value: formatCurrency(data?.totalDebt),
//         icon: Wallet,
//         color: "text-red-700",
//         currency: true,
//       },
//       {
//         title: "Total Customer Debt",
//         value: formatCurrency(Number(data?.totalCustomerDebt)),
//         icon: BarChart,
//         color: "text-cyan-500",
//         currency: true,
//       },
//       {
//         title: "Total Sales Revenue",
//         value: formatCurrency(data?.totalSales),
//         icon: BarChart,
//         color: "text-cyan-500",
//         currency: true,
//       },
//       {
//         title: "Current Stock Value",
//         value: formatCurrency(data?.stockValue),
//         icon: Package,
//         color: "text-yellow-500",
//         currency: true,
//       },
//       {
//         title: "Cost of Stock Sold (COGS)",
//         value: formatCurrency(data?.costOfStock),
//         icon: DollarSign,
//         color: "text-orange-500",
//         currency: true,
//       },
//       {
//         title: "Total Customers",
//         value: summaryData?.totalCustomers,
//         icon: Users,
//         color: "text-indigo-500",
//         currency: false,
//       },
//       {
//         title: "Total Products",
//         value: summaryData?.totalProducts,
//         icon: PackageCheck,
//         color: "text-indigo-500",
//         currency: false,
//       },
//       {
//         title: "Total Stock Quantity",
//         value: summaryData?.totalStockValue,
//         icon: Clock,
//         color: "text-green-500",
//         currency: false,
//       },
//     ];
//   }, [summaryData]);

//   const getMonthName = (monthValue) =>
//     months.find((m) => String(m.value) === String(monthValue))?.label;

//   const periodDisplay = (() => {
//     if (!summaryData?.from) return "Latest Available Period";

//     const fromMonthName = getMonthName(summaryData.from.month);
//     const fromYear = summaryData.from.year;

//     if (summaryData.to && summaryData.from.month !== summaryData.to.month) {
//       const toMonthName = getMonthName(summaryData.to.month);
//       const toYear = summaryData.to.year;
//       return `Report from ${fromMonthName} ${fromYear} to ${toMonthName} ${toYear}`;
//     }

//     return `Report for ${fromMonthName} ${fromYear}`;
//   })();

//   if ((loading && !summaryData)) {
//     return (
//       <div className="size-full flex items-center justify-center">
//         <Spinner overlay={false} />
//       </div>
//     );
//   }

//   if (error)
//     return (
//       <div className="text-center text-[rgb(var(--error))] p-4">
//         Error loading dashboard data: {error}
//       </div>
//     );

//   return (
//     <>
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Dashboard</h1>

//         <h2 className="text-2xl font-bold">{periodDisplay}</h2>
//         <Button variant="primary" onClick={() => setIsFilterOpen(true)}>
//           <Filter className="w-5 h-5 mr-2" /> Filter Report
//         </Button>
//       </header>

//       <FilterSidebar
//         isOpen={isFilterOpen}
//         onClose={() => setIsFilterOpen(false)}
//         initialFilters={filters}
//         onApply={handleApply}
//         onReset={handleReset}
//       />

//       {summaryData ? (
//         <>
//           <section>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
//               {allKpis.map((kpi, index) => (
//                 <MetricCard
//                   key={index}
//                   title={kpi.title}
//                   value={kpi.value}
//                   icon={kpi.icon}
//                   colorClass={kpi.color}
//                   currency={kpi.currency}
//                   order={Math.floor(Math.random() * 9)}
//                 />
//               ))}
//             </div>
//           </section>

//           <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 hidden">
//             <MonthlyProfitChart summaryData={summaryData} />
//             <FinancialMixChart
//               totalSales={summaryData.totalSales}
//               totalExpense={summaryData.totalExpense}
//               totalDebt={summaryData.totalDebt}
//             />
//           </section>
//         </>
//       ) : (
//         <section className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-3">
//           <p className="text-gray-500">
//             No summary data available for the selected period.
//           </p>
//         </section>
//       )}
//     </>
//   );
// };

// export default Dashboard;
import React, { useMemo, useState, useEffect } from "react";
import useFetch from "../hooks/useFetch";
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
} from "lucide-react";
import MetricCard from "../components/MetricCard"; // Your original component
import formatCurrency from "../utils/formatCurrency";
import { showInfo } from "../utils/toast";

// DND-Kit Imports
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
  rectSortingStrategy, // Changed to rect for grid layout
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Charting imports (left unchanged)
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
import { Pie, Line } from "react-chartjs-2";
import useApi from "../utils/useApi";

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

// --- Start of New Component: SortableMetricCard ---
const SortableMetricCard = ({ kpi }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: kpi.id }); // Use the unique 'id' for sorting

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Add z-index to ensure the dragged card is always on top
    zIndex: isDragging ? 10 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // Apply opacity and slight scale to the dragging item
      className={`${isDragging ? "opacity-50 scale-[1.02] shadow-2xl" : ""}`}
    >
      <MetricCard
        title={kpi.title}
        value={kpi.value}
        icon={kpi.icon}
        colorClass={kpi.color}
        currency={kpi.currency}
        // NOTE: Removed the 'order' prop from your original implementation since DND handles visual order
      />
    </div>
  );
};
// --- End of New Component: SortableMetricCard ---


// Components (MonthlyProfitChart and FinancialMixChart) remain unchanged for brevity
// ... (The MonthlyProfitChart and FinancialMixChart components go here, unchanged)
const MonthlyProfitChart = ({ summaryData }) => {
    const netProfit = Number(summaryData?.netProfit || 0);
    const grossProfit = Number(summaryData?.grossProfit || 0);

    const trendData = summaryData?.trendData || [];

    const chartData = useMemo(() => {
        const labels = trendData.map(
            (d) =>
                `${months.find((m) => String(m.value) === String(d.month))?.label
                } ${String(d.year).slice(-2)}`
        );

        return {
            labels: labels,
            datasets: [
                {
                    label: "Net Profit",
                    data: trendData.map((d) => d.netProfit),
                    borderColor: "rgb(34, 197, 94)",
                    backgroundColor: "rgba(34, 197, 94, 0.5)",
                    tension: 0.2,
                    fill: false,
                },
                {
                    label: "Gross Profit",
                    data: trendData.map((d) => d.grossProfit),
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.5)",
                    tension: 0.2,
                    fill: false,
                    borderDash: [5, 5],
                },
            ],
        };
    }, [trendData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Profit Trend Over Selected Period",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return formatCurrency(value);
                    },
                },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    return (
        <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] col-span-2 h-max">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-blue-500" /> Profit & Sales Trend
            </h2>
            <div className="space-y-4 mb-2">
                <p className="text-sm font-semibold">
                    Net Profit: {formatCurrency(netProfit)}
                </p>
                <p className="text-sm font-semibold">
                    Gross Profit: {formatCurrency(grossProfit)}
                </p>
            </div>
            <div className="h-64">
                {trendData.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 border-2 border-dashed border-[rgb(var(--border))] rounded p-4">
                        No monthly summaries available for this period to show trend.
                    </div>
                )}
            </div>
        </div>
    );
};

const FinancialMixChart = ({ totalSales, totalExpense, totalDebt }) => {
    const sales = Number(totalSales || 0);
    const expenses = Number(totalExpense || 0);
    const debt = Number(totalDebt || 0);


    const chartData = useMemo(() => {
        return {
            labels: ["Total Sales", "Total Expenses", "Total Debt"],
            datasets: [
                {
                    data: [sales, expenses, debt],
                    backgroundColor: [
                        "rgb(34, 197, 94)",
                        "rgb(239, 68, 68)",
                        "rgb(255, 159, 64)",
                    ],
                    hoverOffset: 10,
                },
            ],
        };
    }, [sales, expenses, debt]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    generateLabels: (chart) => {
                        const data = chart.data.datasets[0].data;
                        const labels = chart.data.labels;
                        const total = data.reduce((sum, value) => sum + value, 0);

                        return labels.map((label, index) => ({
                            text: `${label}: ${formatCurrency(data[index])} (${(
                                (data[index] / total) *
                                100
                            ).toFixed(1)}%)`,
                            fillStyle: chart.data.datasets[0].backgroundColor[index],
                            strokeStyle: "rgba(0,0,0,0)",
                            lineWidth: 0,
                        }));
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: ({ label, raw }) => `${label}: ${formatCurrency(raw)}`,
                },
            },
        },
    };

    return (
        <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] max-h-103">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-500" /> Key Financial Flow
                Mix
            </h2>
            <div className="h-full flex justify-center items-center">
                <Pie data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};
// ... (End of unchanged components)


const LOCAL_STORAGE_KEY = "kpiOrder";

const Dashboard = () => {
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
    let url = `/finance/dashboard?startM=${appliedFilters.startMonth}&startY=${appliedFilters.startYear}`;

    if (appliedFilters.endMonth && appliedFilters.endYear)
      url += `&endM=${appliedFilters.endMonth}&endY=${appliedFilters.endYear}`;

    return url;
  }, [appliedFilters]);

  // Original data fetch
  const { data: summaryResponse, loading, error } = useFetch(apiUrl, {}, true);
  const summaryData = summaryResponse;

  // 1. Base KPI Definitions (now includes a unique 'id')
  const baseKpis = useMemo(() => {
    const data = summaryData;
    // Map of original data structure to KPI cards, WITH a unique ID
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
        title: "Total Customer Debt",
        value: formatCurrency(Number(data?.totalCustomerDebt)),
        icon: BarChart,
        color: "text-cyan-500",
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
        title: "Current Stock Value",
        value: formatCurrency(data?.stockValue),
        icon: Package,
        color: "text-yellow-500",
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
        value: summaryData?.totalStockValue,
        icon: Clock,
        color: "text-green-500",
        currency: false,
      },
    ];
  }, [summaryData]);
  
  // 2. State for Reordered KPIs
  const [kpiOrder, setKpiOrder] = useState([]);
  
  // 3. Load Order from Local Storage
  useEffect(() => {
    if (baseKpis.length > 0) {
        const savedOrderJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        const kpiMap = baseKpis.reduce((acc, kpi) => ({ ...acc, [kpi.id]: kpi }), {});

        if (savedOrderJson) {
            try {
                const savedIds = JSON.parse(savedOrderJson);
                
                // Reconstruct array using saved IDs, ensuring all baseKpis are present
                const reorderedKpis = savedIds
                    .map(id => kpiMap[id])
                    .filter(kpi => kpi); 

                const existingIds = new Set(reorderedKpis.map(k => k.id));
                const newKpis = baseKpis.filter(kpi => !existingIds.has(kpi.id));

                // Set the final state with saved order + new KPIs at the end
                setKpiOrder([...reorderedKpis, ...newKpis]);
            } catch (e) {
                console.error("Error parsing KPI order from localStorage:", e);
                setKpiOrder(baseKpis); // Fallback to default order
            }
        } else {
            setKpiOrder(baseKpis); // Use default order if nothing is saved
        }
    }
  }, [baseKpis]); // Dependency on baseKpis ensures it runs after data is available/updated

  // 4. Persist Order to Local Storage
  useEffect(() => {
    if (kpiOrder.length > 0) {
      const currentOrderIds = kpiOrder.map((kpi) => kpi.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentOrderIds));
    }
  }, [kpiOrder]);

  // 5. Dnd Handlers
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


  // --- Original Filter and Period Logic (left unchanged) ---
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
      return `Report from ${fromMonthName} ${fromYear} to ${toMonthName} ${toYear}`;
    }

    return `Report for ${fromMonthName} ${fromYear}`;
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
  // --- End of Original Filter and Period Logic ---

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <h2 className="text-2xl font-bold">{periodDisplay}</h2>
        <Button variant="primary" onClick={() => setIsFilterOpen(true)}>
          <Filter className="w-5 h-5 mr-2" /> Filter Report
        </Button>
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
            {/* 6. DND Wrappers Applied Here */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                <SortableContext
                  items={kpiIds}
                  strategy={rectSortingStrategy} // Strategy suitable for grid layout
                >
                  {/* Map over the kpiOrder state, which reflects the live and saved order */}
                  {kpiOrder.map((kpi) => (
                    // 7. Use the new SortableMetricCard component
                    <SortableMetricCard key={kpi.id} kpi={kpi} />
                  ))}
                </SortableContext>
              </div>
            </DndContext>
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