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

const SaleDetail = () => {
  const { id: saleId } = useParams();
  const navigate = useNavigate();

  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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

    const result = await post(`/sales/${saleId}/installments`,
      data, { message: "Installment paid successfully" }
    );
    if (result) {
      setInstallmentAmount("");
      refetch();
    }
  };


  // -------- EDIT INSTALLMENT HANDLERS ----------
  const handleEditInstallment = (installment) => {
    if (installment.status !== "PAID" && installment.status !== "PAID_LATE") {
      showInfo("Only PAID installments can be edited.");
      return;
    }
    setInstallmentToEdit(installment);
    setIsEditModalOpen(true);
  };

  const handleUpdateInstallment = async (updatedData) => {
    setEditLoading(true);
    const result = await put(`/sales/installments/${updatedData.id}`,
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
    setEditLoading(false);
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

  const nextUpcomingInstallment = sale?.installments?.find(
    (i) => i.status === "UPCOMING"
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
              <DetailItem label="Agreement No" value={sale?.id} />
              <DetailItem
                label="Sale Date"
                value={new Date(sale?.saleDate).toLocaleDateString()}
              />
              <DetailItem
                label="Status"
                value={<StatusBadge status={sale?.status} />}
              />
              <DetailItem
                label="Sale Type"
                value={sale?.saleType}
              />
            </div>

            {/* Customer */}
            <div>
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Customer
              </h2>
              <DetailItem
                label="Name"
                value={sale?.customer?.name}
                className="capitalize"
                onClick={() => navigate(`/customers/${sale?.customer?.id}`)}
              />
              <DetailItem label="CNIC" value={sale?.customer?.cnic} />
              <DetailItem label="Phone" value={sale?.customer?.phone} />
              <DetailItem label="Address" value={sale?.customer?.address} />
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
                value={sale?.product.name}
                className="capitalize"
                onClick={() => navigate(`/products/${sale?.product.id}`)}
              />
              <DetailItem label="Category" value={sale?.product.category} className="capitalize" />
              <DetailItem label="Brand" className="capitalize" value={sale?.product.brand} />
              <DetailItem label="Sold Quantity" value={sale?.quantity + " unit"} />
              <DetailItem
                label="Original Price" currency={true}
                value={Number(sale?.buyingPrice).toLocaleString()}
              />
              <DetailItem
                label="Selling Price" currency={true}
                value={Number(sale?.product.sellingPrice).toLocaleString()}
              />
            </div>

            <div className="flex flex-col">
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Payment
              </h2>
              <div className="flex flex-col flex-1 justify-end">
                <DetailItem
                  label="Total Amount"
                  value={Number(sale?.totalAmount).toLocaleString()}
                  currency={true}
                />
                <DetailItem label="Discount" value={sale?.discount} />
                <DetailItem
                  label="Paid Amount"
                  value={Number(sale?.paidAmount).toLocaleString()}
                  currency={true}
                />
                <DetailItem
                  label="Remaining"
                  value={Number(sale?.remainingAmount).toLocaleString()}
                  className="text-[rgb(var(--error))] font-bold"
                  currency={true}
                />
              </div>
            </div>
          </div>

          {/* Product + Payment Info */}
          {(sale?.status === "PARTIAL" || sale?.status === "RETURNED") && (
            <div className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))]">
              <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                Return
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Return Quantity" value={sale?.returnQuantity} className="text-red-500" />
                <DetailItem label="Refund Amount" value={sale?.returnAmount} />
              </div>
            </div>
          )}

          {/* Installment Table */}
          {sale?.saleType === "INSTALLMENT" && (
            <div className={`bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] ${sale?.status === "RETURNED" ? "opacity-70 cursor-not-allowed" : ""}`}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold">Installments</h2>
                <span className="text-md">
                  ({(Number(sale?.totalInstallments) - Number(sale?.paidInstallments)).toLocaleString()} out of {sale?.totalInstallments} remaining)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[rgb(var(--border))]">
                  <thead className="bg-[rgb(var(--bg-secondary))]">
                    <tr>
                      {["S.no.", "Amount", "Due Date", "Paid Date", "Status", "Action"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-medium uppercase"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {sale?.installments.map((i, ix) => (
                      <tr
                        key={i.id}
                        className={`hover:bg-[rgb(var(--bg-secondary))] ${i.status !== "PAID" && i.status !== "PAID_LATE" || loading ? "opacity-70 cursor-not-all" : ""}`}
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
                            disabled={(i.status !== "PAID" && i.status !== "PAID_LATE") || loading}
                            loading={i.id === installmentToEdit?.id && editLoading}
                            // title={
                            //   i.status == "PAID" || i.status == "PAID_LATE"
                            //     ? "Edit Installment"
                            //     : "Only Paid installments can be edited"
                            // }
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
            {sale?.saleType === "INSTALLMENT" && (
              <form
                onSubmit={handlePayInstallment}
                className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-4"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" /> Pay Next Installment
                </h2>

                {sale?.status === "COMPLETED" && (
                  <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded text-sm text-green-700 dark:text-green-300">
                    This sale is fully COMPLETED.
                  </div>
                )}

                <Input
                  label={`Next Due Amount (Approx: ${Number(
                    nextUpcomingInstallment?.amount
                  ).toLocaleString()})`}
                  id="installmentAmount"
                  type="number"
                  placeholder="Enter paid amount"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  required
                  disabled={sale?.status === "COMPLETED" || sale?.status === "RETURNED" || loading}
                  currency={true}
                  min={0.01}
                  max={sale?.remainingAmount}
                  step="0.01"
                />

                <Input
                  label="Paid Date"
                  id="paidDate"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                  disabled={sale?.status === "COMPLETED" || sale?.status === "RETURNED" || loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={payLoading}
                  className="w-full"
                  disabled={sale?.status === "COMPLETED" || sale?.status === "RETURNED" || loading}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  {payLoading ? "Processing..." : "Add Installment"}
                </Button>
              </form>
            )}

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
