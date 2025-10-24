// src/pages/CustomerDetail.jsx
import React, { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import Spinner from "../components/Spinner";
import {
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  TrendingDown,
  CreditCard,
  CheckCircle,
  Clock,
  ListChecks,
  Wallet,
} from "lucide-react";
import Button from "../components/ui/Button";
import MetricCard from "../components/MetricCard";
import formatCurrency from "../utils/formatCurrency";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = Number(id);

  const {
    data: customerData,
    loading: customerLoading,
    error: customerError,
  } = useFetch(`/customers/${customerId}`, {}, true);

  const salesUrl = useMemo(
    () => `/sales?customerId=${customerId}&limit=1000`,
    [customerId]
  );
  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useFetch(salesUrl, {}, true);

  const customer = customerData;
  const allSales = salesData?.sales || [];
  const metrics = customer?.metrics || {};

  const loading = customerLoading || salesLoading;
  const error = customerError || salesError;

  if (loading) return <Spinner overlay={false} />;

  if (error)
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error: {error}
      </div>
    );

  if (!customer)
    return <div className="text-center p-4">Customer not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex gap-2">
          <Link to="/customers">
            <Button variant="secondary" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Customer Report</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="ml-auto"
            onClick={() => navigate(`/sales?customerId=${customerId}`)}
          >
            View Sales
          </Button>
          <Button
            variant="primary"
            className="ml-auto"
            onClick={() => navigate(`/customers/edit/${customerId}`)}
          >
            Edit Customer
          </Button>
        </div>
      </div>

      <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">
          Customer Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
          <DetailItem label="Name" value={customer.name} />
          <DetailItem label="CNIC" value={customer.cnic} />
          <DetailItem label="Phone" value={customer.phone} />
          <DetailItem label="Address" value={customer.address} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Remaining Balance"
          value={formatCurrency(metrics.totalRemainingBalance)}
          icon={DollarSign}
          colorClass="text-[rgb(var(--error))]"
          currency={true}
        />
        <MetricCard
          title="Total Paid Amount"
          value={formatCurrency(metrics.totalPaidAmount)}
          icon={CreditCard}
          colorClass="text-[rgb(var(--primary))]"
          currency={true}
        />
        <MetricCard
          title="Total Purchase Value"
          value={formatCurrency(metrics.totalPurchaseValue)}
          icon={ShoppingBag}
          colorClass="text-blue-500"
          currency={true}
        />
        <MetricCard
          title="Total Discount Received"
          value={formatCurrency(metrics.totalDiscountReceived)}
          icon={TrendingDown}
          colorClass="text-gray-500"
          currency={true}
        />
        <MetricCard
          title="Total Sales Transactions"
          value={allSales.length}
          icon={Wallet}
          colorClass="text-gray-500"
        />
        <MetricCard
          title="Active Sales"
          value={metrics.salesActive}
          icon={Clock}
          colorClass="text-yellow-600"
        />
        <MetricCard
          title="Completed Sales"
          value={metrics.salesCompleted}
          icon={CheckCircle}
          colorClass="text-green-600"
        />
        <MetricCard
          title="Installment Sales"
          value={metrics.salesInstallments}
          icon={ListChecks}
          colorClass="text-cyan-500"
        />
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col space-y-1 p-2 border-b border-[rgb(var(--bg-secondary))] last:border-b-0">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="font-semibold text-[rgb(var(--text))]">{value}</p>
  </div>
);

export default CustomerDetail;
