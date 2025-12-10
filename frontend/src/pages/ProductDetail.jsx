// src/pages/ProductDetail.jsx
import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import Spinner from "../components/Spinner";
import Button from "../components/ui/Button";
import Table from "../components/Table";
import EditModal from "../components/EditModal";
import useApi from "../utils/useApi";
import { showError } from "../utils/toast";
import {
    ArrowLeft,
    Package,
    Warehouse,
    BarChart,
    Box,
    ChevronDown,
    PackagePlus,
} from "lucide-react";
import formatCurrency from "../utils/formatCurrency";

const STOCK_TYPES = [
    { label: "Purchase (IN)", value: "PURCHASE" },
    // { label: "Supplier Return (OUT)", value: "SUPPLIER_RETURN" },
];

const DetailItem = ({ label, value, className = "", currency = false }) => (
    <div
        className={`flex justify-between items-center py-1 border-b border-[rgb(var(--bg-secondary))] last:border-b-0 ${className}`}
    >
        <p className="w-1/2 text-sm text-gray-500 dark:text-gray-400">{label}:</p>
        <p className="w-1/2 text-right font-medium text-[rgb(var(--text))]">
            {value}
            {currency && <span className="ml-1 text-[0.7rem]">PKR</span>}
        </p>
    </div>
);

const ADD_STOCK_FIELDS = (product) => [
    {
        label: "Transaction Type",
        key: "type",
        type: "select",
        required: true,
        options: STOCK_TYPES,
        disabled: true,
    },
    {
        label: "Buying Price (Unit)",
        key: "buyingPrice",
        type: "number",
        required: true,
        rest: { min: 1, step: "1" },
    },
    {
        label: "Quantity",
        key: "stockQuantity",
        type: "number",
        required: true,
        rest: { min: 1, step: "1" },
    },
    {
        label: "Transaction Date",
        key: "date",
        type: "date",
        required: true,
        rest: {
            min: product?.initialStockDate ? new Date(product.initialStockDate).toISOString().split("T")[0] : undefined,
            max: new Date().toISOString().split("T")[0],
        }
    },
    {
        label: "Note (Optional)",
        key: "note",
        type: "text",
        required: false,
    },
];

const getInitialStockData = () => ({
    stockQuantity: 1,
    note: "",
    date: new Date().toISOString().split("T")[0],
    type: "PURCHASE",
});


const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const productId = Number(id);
    const [showTransactions, setShowTransactions] = useState(false);
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const { del, post, loading: stockLoading } = useApi();

    const [transactionPage, setTransactionPage] = useState(1);
    const TRANSACTION_LIMIT = 5;
    const {
        data: productReport,
        loading: reportLoading,
        error: reportError,
        refetch: refetchReport,
    } = useFetch(`/products/${productId}`, {}, true);

    const transactionApiUrl = useMemo(() => {
        return `/products/${productId}/stocks?page=${transactionPage}&limit=${TRANSACTION_LIMIT}`;
    }, [productId, transactionPage]);

    const {
        refetch: refetchTransactions,
        data: transactionsData,
        loading: transactionsLoading,
        error: transactionsError,
    } = useFetch(transactionApiUrl, {}, true);

    const handleRefetchAll = () => {
        refetchReport();
        refetchTransactions();
    }


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
                    if (result !== null) handleRefetchAll();
                }
                break;
            default:
                break;
        }
    };

    const handleAddStockSubmit = async (formData) => {
        const [rawType, direction] = formData.type.split("_");

        const data = {
            id: productOverview?.id,
            stockQuantity: Number(formData.stockQuantity),
            note: formData.note,
            date: new Date(formData.date).toISOString(),
            type: rawType,
            direction,
            buyingPrice: Number(formData.buyingPrice),
        };



        if (data.stockQuantity <= 0) {
            showError("Quantity must be greater than 0.");
            return;
        }

        const result = await post(
            `/products/${productOverview?.id}/stocks`,
            data,
            { message: "Stock updated successfully" }
        );

        if (result) {
            setIsAddStockModalOpen(false);
            handleRefetchAll();
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
                header: "Direction",
                accessor: "direction",
                render: (row) => renderDirection(row.direction),
            },
            {
                header: "Quantity",
                accessor: "quantity",
                render: (row) => `${row.quantity} Units`,
            },
            {
                header: "Buying Price",
                accessor: "buyingPrice",
                render: (row) => formatCurrency(row.buyingPrice),
                currency: true,
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
        return (
            <div className="flex justify-center items-center w-full h-full">
                <Spinner overlay={false} />
            </div>)

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
                    onClick={() => setIsAddStockModalOpen(true)} // 👈 Open Modal
                >
                    <PackagePlus className="w-5 h-5 mr-2" />
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
                        currency
                    />
                    <DetailItem
                        label="Selling Price (Unit)"
                        value={formatCurrency(productOverview?.sellingPrice)}
                        currency
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
                        currency
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
                        currency
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
                        currency
                    />
                    <DetailItem
                        label="Total Discount Given"
                        value={formatCurrency(salesSummary?.totalDiscount)}
                        currency
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
                    <ChevronDown className={`w-5 h-5 transition duration-300 ${showTransactions ? "rotate-180" : ""}`} />
                </button>

                <div className={`mt-4 overflow-hidden transition-all duration-300 ${showTransactions
                    ? "max-h-[1000px] pt-4 border-t border-[rgb(var(--border))]"
                    : "max-h-0"
                    }`} >
                    <div className="relative">
                        <Table
                            purpose="Product Stock transactions"
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

            <EditModal
                isOpen={isAddStockModalOpen}
                title="Add Stock"
                initialData={getInitialStockData(productOverview)}
                fields={ADD_STOCK_FIELDS(productOverview)}
                onClose={() => setIsAddStockModalOpen(false)}
                onSave={handleAddStockSubmit}
                loading={stockLoading}
            />
        </div>
    );
};

export default ProductDetail;