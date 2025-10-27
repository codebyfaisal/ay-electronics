import React, { useState, useEffect, useMemo } from "react";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ListChecks,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Landmark,
  Banknote,
  Wallet,
  BarChart,
  Package,
  Users,
  PackageCheck,
  Clock,
} from "lucide-react";


const data = {
  totalInvestment: 1250000,
  totalAssetsValue: 1500000,
  netProfit: 250000,
  grossProfit: 400000,
  totalBank: 500000,
  totalCash: 75000,
  totalExpense: 150000,
  totalDebt: 300000,
  totalCustomerDebt: 50000,
  totalSales: 800000,
  stockValue: 100000,
  costOfStock: 200000,
};

const summaryData = {
  totalCustomers: 1200,
  totalProducts: 45,
  totalStockValue: 875,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const BASE_KPIS = [
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
    color: "text-green-500",
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

const SortableKPI = ({ kpi }) => {
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

  const Icon = kpi.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 ${
        isDragging ? "opacity-50 shadow-2xl scale-[1.02]" : "hover:shadow-xl"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-500">{kpi.title}</div>
        <div className={`p-2 rounded-full bg-gray-100 ${kpi.color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-1 text-3xl font-bold text-gray-900 truncate">
        {kpi.value}
      </div>
    </div>
  );
};

const KPIDashboard = () => {
  const LOCAL_STORAGE_KEY = "kpiOrder";

  const [kpis, setKpis] = useState([]);
  
  useEffect(() => {
    const savedOrderJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (savedOrderJson) {
      try {
        const savedOrder = JSON.parse(savedOrderJson);
        
        const kpiMap = BASE_KPIS.reduce((acc, kpi) => {
          acc[kpi.id] = kpi;
          return acc;
        }, {});
        const reorderedKpis = savedOrder
          .map(id => kpiMap[id])
          .filter(kpi => kpi);
          const existingIds = new Set(reorderedKpis.map(k => k.id));
        const newKpis = BASE_KPIS.filter(kpi => !existingIds.has(kpi.id));

        setKpis([...reorderedKpis, ...newKpis]);

      } catch (e) {
        console.error("Could not parse saved KPI order:", e);
        setKpis(BASE_KPIS); 
      }
    } else {
      setKpis(BASE_KPIS);
    }
  }, []); 
  
  useEffect(() => {
    if (kpis.length > 0) {
      const currentOrderIds = kpis.map((kpi) => kpi.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentOrderIds));
    }
  }, [kpis]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setKpis((items) => {
        const oldIndex = items.findIndex((kpi) => kpi.id === active.id);
        const newIndex = items.findIndex((kpi) => kpi.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const kpiIds = useMemo(() => kpis.map(kpi => kpi.id), [kpis]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Reorderable KPI Dashboard 🚀
      </h1>
      <p className="text-gray-600 mb-8">
        Drag and drop the cards to change their order. The new order is automatically saved in your browser's local storage.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SortableContext items={kpiIds} strategy={verticalListSortingStrategy}>
            {kpis.map((kpi) => (
              <SortableKPI key={kpi.id} kpi={kpi} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default KPIDashboard;