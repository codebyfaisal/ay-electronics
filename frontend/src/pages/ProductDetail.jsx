// src/pages/ProductDetail.jsx
import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import Spinner from "../components/Spinner";
import Button from "../components/ui/Button";
import Table from "../components/Table";
import {
    ArrowLeft,
    Package,
    Warehouse,
    BarChart,
    Box,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import formatCurrency from "../utils/formatCurrency";
import useApi from "../utils/useApi";

const DetailItem = ({ label, value, className = "" }) => (
    <div
        className={`flex justify-between items-center py-1 border-b border-[rgb(var(--bg-secondary))] last:border-b-0 ${className}`}
    >
        <p className="w-1/2 text-sm text-gray-500 dark:text-gray-400">{label}:</p>
        <p className="w-1/2 text-right font-medium text-[rgb(var(--text))]">
            {value}
        </p>
    </div>
);

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const productId = Number(id);
    const [showTransactions, setShowTransactions] = useState(false);
    const { del } = useApi();

    const [transactionPage, setTransactionPage] = useState(1);
    const TRANSACTION_LIMIT = 5;
    const {
        data: productReport,
        loading: reportLoading,
        error: reportError,
    } = useFetch(`/products/${productId}`, {}, true);

    const transactionApiUrl = useMemo(() => {
        return `/products/${productId}/stocks?page=${transactionPage}&limit=${TRANSACTION_LIMIT}`;
    }, [productId, transactionPage]);

    const {
        refetch,
        data: transactionsData,
        loading: transactionsLoading,
        error: transactionsError,
    } = useFetch(transactionApiUrl, {}, true);

    const productTransactions = transactionsData?.stockTransactions || [];
    const totalTransactions = transactionsData?.total || 0;
    const loading = reportLoading || transactionsLoading;
    const error = reportError || transactionsError;


    const { productOverview, inventorySummary, salesSummary } = useMemo(() => {
        return productReport || {};
    }, [productReport]);

    const handleAction = async (action, id) => {
        switch (action) {
            case "delete":
                if (
                    window.confirm(
                        "Are you sure you want to delete this stock transaction? This will remove all associated sales may become inconsistent."
                    )
                ) {
                    const result = await del(`/products/stocks/${id}`,
                        { message: "Product deleted successfully" }
                    );
                    if (result !== null) refetch();
                }
                break;
            default:
                break;
        }
    };


    const hasReportData = !!productReport;

    const renderDirection = (direction) => {
        let colorClass =
            direction === "IN"
                ? "text-[rgb(var(--color-primary))]"
                : "text-[rgb(var(--color-error))]";
        let text = direction === "IN" ? "In" : "Out";
        return <span className={`font-semibold ${colorClass}`}>{text}</span>;
    };

    const transactionColumns = useMemo(
        () => [
            { header: "Type", accessor: "type" },
            {
                header: "Quantity",
                accessor: "quantity",
                render: (row) => `${row.quantity} units`,
            },
            {
                header: "Direction",
                accessor: "direction",
                render: (row) => renderDirection(row.direction),
            },
            {
                header: "Transaction Date",
                accessor: "date",
                render: (row) => new Date(row.date).toLocaleDateString(),
            },
            { header: "Note", accessor: "note" },
        ],
        []
    );

    if (error)
        return (
            <div className="text-center text-[rgb(var(--error))] p-4">
                Error: {error}
            </div>
        );

    if (loading && !hasReportData)
        return <Spinner overlay={false} />;

    if (!hasReportData)
        return <div className="text-center p-4">Product not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link to="/products">
                    <Button variant="secondary" className="p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold capitalize">
                    Product Report: {productOverview?.name}
                </h1>

                <Button
                    variant="secondary"
                    className="ml-auto"
                    onClick={() => navigate(`/products/edit/${productId}`)}
                >
                    Edit Product
                </Button>

                <Button
                    variant="primary"
                    onClick={() => navigate(`/products/edit/${productId}`)}
                >
                    Add Stock
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-4 lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 flex items-center border-b pb-2">
                        <Package className="w-5 h-5 mr-2 text-[rgb(var(--primary))]" />{" "}
                        Product Overview
                    </h2>
                    <DetailItem label="Name" value={productOverview?.name} className="capitalize" />
                    <DetailItem label="Category" value={productOverview?.category} className="capitalize" />
                    <DetailItem label="Brand" value={productOverview?.brand} className="capitalize" />
                    <DetailItem
                        label="Current Stock"
                        value={`${productOverview?.stockQuantity} units`}
                    />
                    <DetailItem
                        label="Buying Price (Unit)"
                        value={formatCurrency(productOverview?.buyingPrice)}
                    />
                    <DetailItem
                        label="Selling Price (Unit)"
                        value={formatCurrency(productOverview?.sellingPrice)}
                    />
                    <DetailItem
                        label="Added at"
                        value={new Date(productOverview?.initialStockDate).toLocaleDateString()}
                    />
                </div>

                <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-4 lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 flex items-center border-b pb-2">
                        <Warehouse className="w-5 h-5 mr-2 text-[rgb(var(--secondary))]" />{" "}
                        Inventory Summary
                    </h2>
                    <DetailItem
                        label="Total Purchased Qty"
                        value={`${inventorySummary?.totalPurchasedQty} units`}
                    />
                    <DetailItem
                        label="Total Purchase Cost"
                        value={formatCurrency(inventorySummary?.totalPurchaseCost)}
                    />
                    {/* <DetailItem
                        label="Product Returns (In)"
                        value={`${inventorySummary?.productReturns} units`}
                    /> */}
                    <DetailItem
                        label="Supplier Returns (Out)"
                        value={`${inventorySummary?.supplierReturns} units`}
                    />
                    <DetailItem
                        label="Expected Stock Value"
                        value={formatCurrency(inventorySummary?.expectedStockValue)}
                    />
                </div>

                <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-4 lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 flex items-center border-b pb-2">
                        <BarChart className="w-5 h-5 mr-2 text-[rgb(var(--accent))]" />{" "}
                        Sales Summary
                    </h2>
                    <DetailItem
                        label="Total Sales Transactions"
                        value={`${salesSummary?.totalSales} transactions`}
                    />
                    <DetailItem
                        label="Total Sold Quantity"
                        value={`${salesSummary?.totalSoldQty} units`}
                    />
                    <DetailItem
                        label="Total Revenue"
                        value={formatCurrency(salesSummary?.totalRevenue)}
                    />
                    <DetailItem
                        label="Total Discount Given"
                        value={formatCurrency(salesSummary?.totalDiscount)}
                    />
                    <DetailItem
                        label="Completed Sales"
                        value={`${salesSummary?.completedSales} sales`}
                    />
                    <DetailItem
                        label="Active Sales (Installment)"
                        value={`${salesSummary?.activeSales} sales`}
                    />
                </div>
            </div>

            <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
                <button
                    onClick={() => setShowTransactions(!showTransactions)}
                    className="w-full flex justify-between items-center text-xl font-semibold text-[rgb(var(--text))] hover:text-[rgb(var(--primary))] transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <Box className="w-6 h-6 mr-3" /> Stock Movement History (
                        {totalTransactions})
                    </div>
                    {showTransactions ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </button>

                <div
                    className={`mt-4 overflow-hidden transition-all duration-300 ${showTransactions
                        ? "max-h-[1000px] pt-4 border-t border-[rgb(var(--border))]"
                        : "max-h-0"
                        }`}
                >
                    <div className="relative">
                        <Table
                            data={productTransactions}
                            columns={transactionColumns}
                            pagination={{
                                page: transactionPage,
                                limit: TRANSACTION_LIMIT,
                                total: totalTransactions,
                            }}
                            onPageChange={setTransactionPage}
                            onAction={handleAction}
                            activeActions={{
                                view: false,
                                edit: false,
                                remove: true,
                            }}
                            loading={transactionsLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;