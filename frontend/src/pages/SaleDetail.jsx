// src/pages/SaleDetail.jsx
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import useApi from "../utils/useApi.js";
import Spinner from "../components/Spinner";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ArrowLeft, DollarSign, CreditCard, Edit } from "lucide-react";
import { showInfo } from "../utils/toast";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import EditModal from "../components/EditModal.jsx";
import Select from "../components/ui/Select.jsx";

const SaleDetail = () => {
  const { id: saleId } = useParams();
  const navigate = useNavigate();

  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [returnQuantity, setReturnQuantity] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [refundMethod, setRefundMethod] = useState("CASH");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState(null);

  const { post, put, loading: payLoading } = useApi();
  const [editLoading, setEditLoading] = useState(false);

  const {
    data: sale,
    loading: fetchLoading,
    error,
    refetch,
  } = useFetch(`/sales/${saleId}`, {}, true);

  const loading = fetchLoading || payLoading || editLoading;

  // -------- PAY INSTALLMENT HANDLER ----------
  const handlePayInstallment = async (e) => {
    e.preventDefault();
    const data = {
      id: Number(saleId),
      paidDate,
      amount: Number(installmentAmount) || undefined,
    };

    const result = await post(
      `/sales/${saleId}/installments`,
      data,
      { message: "Installment paid successfully" }
    );
    if (result) {
      setInstallmentAmount("");
      refetch();
    }
  };

  // -------- RETURN SALE HANDLER ----------
  const handleReturnSale = async (e) => {
    e.preventDefault();
    const confirm = window.confirm("Are you sure you want to return this sale?");
    if (!confirm) return;

    const data = {
      quantity: Number(returnQuantity),
      date: returnDate,
      refundMethod: refundMethod.toUpperCase(),
      note: returnNote.trim(),
    };

    const result = await put(`/sales/${saleId}/return`, data, {
      message: "Sale returned successfully",
    });

    if (result) {
      setReturnQuantity("");
      setReturnNote("");
      refetch();
    }
  };

  // -------- EDIT INSTALLMENT HANDLERS ----------
  const handleEditInstallment = (installment) => {
    if (installment.status !== "PAID") {
      showInfo("Only PAID installments can be edited.");
      return;
    }
    setInstallmentToEdit(installment);
    setIsEditModalOpen(true);
  };

  const handleUpdateInstallment = async (updatedData) => {
    setEditLoading(true);
    try {
      const result = await put(
        `/sales/installments/${updatedData.id}`,
        {
          amount: updatedData.amount,
          paidDate: new Date(updatedData.paidDate).toISOString(),
        },
        { message: "Installment updated successfully" }
      );

      if (result) {
        setIsEditModalOpen(false);
        setInstallmentToEdit(null);
        refetch();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  const installmentEditFields = [
    {
      key: "amount",
      label: "Paid Amount (PKR)",
      type: "number",
      required: true,
      rest: { min: 0.01, step: "0.01", currency: true },
    },
    {
      key: "paidDate",
      label: "Paid Date",
      type: "date",
      required: true,
    },
    {
      key: "id",
      label: "Installment ID",
      type: "text",
      required: true,
      rest: { disabled: true, className: "hidden" },
    },
  ];

  if (loading && !sale) return <Spinner overlay={false} />;

  if (error)
    return (
      <div className="text-center text-[rgb(var(--error))] p-4">
        Error: {error}
      </div>
    );

  if (!sale) return <div className="text-center p-4">Sale not found.</div>;

  const nextPendingInstallment = sale.installments?.find(
    (i) => i.status === "PENDING"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/sales">
          <Button variant="secondary" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Detail Sale View</h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 border border-[rgb(var(--border))]">
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Summary
              </h2>
              <DetailItem label="Sale ID" value={sale.id} />
              <DetailItem
                label="Sale Date"
                value={new Date(sale.saleDate).toLocaleDateString()}
              />
              <DetailItem
                label="Status"
                value={<StatusBadge status={sale.status} />}
              />
              <DetailItem
                label="Sale Type"
                value={sale.saleType}
              />
            </div>

            {/* Customer */}
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Customer
              </h2>
              <DetailItem
                label="Name"
                value={sale.customer.name}
                className="capitalize"
                onClick={() => navigate(`/customers/${sale.customer.id}`)}
              />
              <DetailItem label="CNIC" value={sale.customer.cnic} />
              <DetailItem label="Phone" value={sale.customer.phone} />
              <DetailItem label="Address" value={sale.customer.address} />
            </div>
          </div>

          {/* Product + Payment Info */}
          <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 border border-[rgb(var(--border))]">
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Product
              </h2>
              <DetailItem
                label="Product"
                value={sale.product.name}
                className="capitalize"
                onClick={() => navigate(`/products/${sale.product.id}`)}
              />
              <DetailItem
                label="Category"
                value={sale.product.category}
                className="capitalize"
              />
              <DetailItem
                label="Original Price"
                value={Number(sale.product.buyingPrice).toLocaleString()}
                currency={true}
              />
              <DetailItem
                label="Selling Price"
                value={Number(sale.product.sellingPrice).toLocaleString()}
                currency={true}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Payment
              </h2>
              <DetailItem
                label="Total Price"
                value={Number(sale.totalAmount).toLocaleString()}
                currency={true}
              />
              <DetailItem
                label="Paid Amount"
                value={Number(sale.paidAmount).toLocaleString()}
                currency={true}
              />
              <DetailItem label="Payment Method" value={sale.paymentMethod} />
              <DetailItem
                label="Remaining"
                value={Number(sale.remainingAmount).toLocaleString()}
                className="text-[rgb(var(--error))] font-bold"
                currency={true}
              />
            </div>
          </div>

          {/* Installment Table */}
          {sale.saleType === "INSTALLMENT" && (
            <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold">Installments</h2>
                <span className="text-md">
                  ({sale.paidInstallments} out of {sale.totalInstallments} remaining)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[rgb(var(--border))]">
                  <thead className="bg-[rgb(var(--bg-secondary))]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                        S.no.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                        Paid Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {sale.installments.map((i, ix) => (
                      <tr
                        key={i.id}
                        className="hover:bg-[rgb(var(--bg-secondary))]"
                      >
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {++ix}.
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {Number(i.amount).toLocaleString()}{" "}
                          <span className="text-[0.7rem]">PKR</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {new Date(i.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          {i.paidDate
                            ? new Date(i.paidDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <StatusBadge status={i.status} />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          <Button
                            variant="ghost"
                            className="text-[rgb(var(--primary))] p-1"
                            onClick={() => handleEditInstallment(i)}
                            disabled={i.status !== "PAID" || loading}
                            loading={i.id === installmentToEdit?.id && editLoading}
                            title={
                              i.status !== "PAID"
                                ? "Only Paid installments can be edited"
                                : "Edit Installment"
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE FORMS */}
        <div className="lg:col-span-1">
          <div className="space-y-6 sticky top-19.5">
            {/* Installment Payment Form */}
            {sale.saleType === "INSTALLMENT" && (
              <form
                onSubmit={handlePayInstallment}
                className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-4"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" /> Pay Next Installment
                </h2>

                {sale.status === "COMPLETED" && (
                  <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded text-sm text-green-700 dark:text-green-300">
                    This sale is fully COMPLETED.
                  </div>
                )}

                <Input
                  label={`Next Due Amount (Approx: ${Number(
                    nextPendingInstallment?.amount
                  ).toLocaleString()})`}
                  id="installmentAmount"
                  type="number"
                  placeholder="Enter paid amount"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  required
                  disabled={sale.status === "COMPLETED" || loading}
                  currency={true}
                  min={0.01}
                  step="0.01"
                />
                <Input
                  label="Paid Date"
                  id="paidDate"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                  disabled={sale.status === "COMPLETED" || loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={payLoading}
                  className="w-full"
                  disabled={sale.status === "COMPLETED" || loading}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  {payLoading ? "Processing..." : "Add Installment"}
                </Button>
              </form>
            )}

            {/* Return Sale Form */}
            <form
              onSubmit={handleReturnSale}
              className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] sticky top-19.5 space-y-4"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-red-500" /> Return Sale
              </h2>

              {sale.status === "RETURNED" && (
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded text-sm text-red-700 dark:text-red-300">
                  This sale has already been returned.
                </div>
              )}

              <Input
                label="Return Quantity"
                id="returnQuantity"
                type="number"
                placeholder="Enter quantity to return"
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
                required
                disabled={sale.status === "RETURNED" || loading}
                min={1}
                step="1"
              />

              <Select
                label="Refund Method"
                id="refundMethod"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                required
                disabled={sale.status === "RETURNED" || loading}
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "BANK", label: "Bank" },
                ]}
              />

              <Input
                label={"Return Date"}
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                disabled={sale.status === "RETURNED" || loading}
                min={new Date(sale?.saleDate).toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
              />

              <Input
                label="Return Note"
                id="returnNote"
                type="text"
                placeholder="Reason for return"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                required
                disabled={sale.status === "RETURNED" || loading}
              />

              <Button
                type="submit"
                variant="destructive"
                loading={payLoading}
                className="w-full"
                disabled={sale.status === "RETURNED" || loading}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                {payLoading ? "Processing..." : "Submit Return"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Installment Modal */}
      {isEditModalOpen && installmentToEdit && (
        <EditModal
          isOpen={isEditModalOpen}
          title={`Edit Installment #${installmentToEdit.id}`}
          initialData={{
            ...installmentToEdit,
            amount: installmentToEdit.amount,
          }}
          fields={installmentEditFields}
          onClose={() => {
            setIsEditModalOpen(false);
            setInstallmentToEdit(null);
          }}
          onSave={handleUpdateInstallment}
          loading={editLoading}
        />
      )}
    </div>
  );
};

const DetailItem = ({ label, value, className = "", currency, onClick = false }) => (
  <div className={`flex justify-between items-center py-1 ${className}`}>
    <p className="w-1/2 text-sm text-gray-500 dark:text-gray-400">{label}:</p>
    <p
      className={`w-1/2 text-right font-medium ${onClick && "cursor-pointer underline"
        }`}
      onClick={onClick}
    >
      {value}
      {currency && <span className="ml-1 text-[0.7rem]">PKR</span>}
    </p>
  </div>
);

export default SaleDetail;
