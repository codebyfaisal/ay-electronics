// src/components/finance/DailyTransactionsTab.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../hooks/useFetch";
import useApi from "../../utils/useApi.js";
import Table from "../Table";
import Button from "../ui/Button";
import { Plus, Filter, RefreshCw } from "lucide-react";
import EditModal from "../EditModal.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";

const transactionTypes = [
  { label: "Expense", value: "EXPENSE" },
  { label: "Bank", value: "BANK" },
  { label: "Debt", value: "DEBT" },
  { label: "Cash", value: "CASH" },
];

const initialForm = {
  id: null,
  type: "EXPENSE",
  amount: "",
  note: "",
  date: new Date().toISOString().split("T")[0],
};

const DailyTransactionsTab = () => {
  const [page, setPage] = useState(1);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [dataToEdit, setDataToEdit] = useState(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterForm, setFilterForm] = useState({
    startDate: "", endDate: "", type: ""
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const { post, del, put, loading: apiLoading } = useApi();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 10 });

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    return params.toString();
  }, [page, appliedFilters]);

  const {
    data: transactionsData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/finance/daily-transactions?${queryString}`, {}, true);

  const transactions = transactionsData?.dailyTransactions || [];
  const total = transactionsData?.total || 0;

  const handleSaveTransaction = async (data) => {
    const isNew = !data.id;

    const payload = {
      ...data,
      amount: Number(data.amount),
      date: new Date(data.date).toISOString(),
    };

    let result;
    if (isNew) {
      result = await post("/finance/daily-transactions", payload,
        { message: "Transaction added successfully" });
    } else {
      result = await put(`/finance/daily-transactions/${data.id}`, payload,
        { message: "Transaction updated successfully" });
    }

    if (result) {
      setIsCrudModalOpen(false);
      if (isNew) setPage(1);
      refetch();
    }
  };

  const handleOpenCreateModal = () => {
    setDataToEdit(initialForm);
    setIsCrudModalOpen(true);
  };

  const handleOpenEditModal = (transaction) => {
    const formattedTransaction = {
      ...transaction,
      amount: String(Number(transaction.amount)),
    }
    setDataToEdit(formattedTransaction);
    setIsCrudModalOpen(true);
  };

  const handleApplyFilters = (form) => {
    const newAppliedFilters = {};

    if (form.startDate) newAppliedFilters.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) newAppliedFilters.endDate = new Date(form.endDate).toISOString();
    if (form.type) newAppliedFilters.type = form.type;

    setFilterForm(form);
    setPage(1);
    setAppliedFilters(newAppliedFilters);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilterForm({ startDate: "", endDate: "", type: "" });
    setAppliedFilters({});
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this daily transaction?")) {
      const result = await del(`/finance/daily-transactions/${id}`,
        { message: "Transaction deleted successfully" }
      );
      if (result !== null) refetch();
    }
  };

  const handleAction = (action, id) => {
    const transaction = transactions.find(t => t.id === id);

    switch (action) {
      case 'edit':
        if (transaction) handleOpenEditModal(transaction);
        break;
      case 'delete':
        handleDelete(id);
        break;
      default:
        break;
    }
  };

  const transactionFields = [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: transactionTypes
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
      rest: { min: 0.01, step: "0.01" }
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      required: true
    },
    {
      key: 'note',
      label: 'Note (Optional)',
      type: 'text',
      required: false
    },
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: false,
      rest: { disabled: true, className: "hidden" }
    },
  ];

  const filterFields = [
    { key: 'type', label: 'Type', type: 'select', options: transactionTypes, required: false },
    { key: 'startDate', label: 'Start Date', type: 'date', required: false },
    { key: 'endDate', label: 'End Date', type: 'date', required: false },
  ];

  const columns = useMemo(
    () => [
      {
        header: "Amount",
        accessor: "amount",
        currency: true,
        render: (row) => Number(row.amount).toLocaleString(),
      },
      { header: "Type", accessor: "type" },
      {
        header: "Date",
        accessor: "date",
        render: (row) => new Date(row.date).toLocaleDateString(),
      },
      { header: "Note", accessor: "note" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex justify-between items-center">
        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />{" "}
          Add New Transaction
        </Button>

        <div className="flex space-x-2">
          {Object.keys(appliedFilters).length > 0 && (
            <div className="text-sm text-gray-500 flex items-center">
              {Object.entries(appliedFilters).map(([key, val]) => (
                <span key={key} className="bg-[rgb(var(--bg-secondary))] px-2 py-1 rounded-full text-sm ml-2">
                  {key}: {new Date(val).toLocaleDateString()}
                </span>
              ))}
            </div>
          )}

          <Button variant="secondary" onClick={() => setIsFilterModalOpen(true)} title="Filter Records">
            <Filter className="w-5 h-5 mr-2" /> Filter
          </Button>
          <Button variant="secondary" onClick={handleResetFilters} title="Refresh List">
            <RefreshCw className="w-5 h-5" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="relative min-h-64">
        <Table
          purpose="daily-transactions"
          data={transactions}
          columns={columns}
          pagination={{ page, limit: 10, total }}
          onPageChange={setPage}
          onAction={handleAction}
          loading={fetchLoading || apiLoading}
          activeActions={{ remove: true, edit: true }}
        />
      </div>

      {isCrudModalOpen && dataToEdit && (
        <EditModal
          isOpen={isCrudModalOpen}
          title={dataToEdit.id ? `Edit Daily Transaction #${dataToEdit.id}` : "Add New Daily Transaction"}
          initialData={dataToEdit}
          fields={transactionFields}
          onClose={() => { setIsCrudModalOpen(false); setDataToEdit(null); }}
          onSave={handleSaveTransaction}
          loading={apiLoading}
        />
      )}

      {isFilterModalOpen && (
        <EditModal
          isOpen={isFilterModalOpen}
          title="Filter By Date Range"
          initialData={filterForm}
          fields={filterFields}
          onClose={() => setIsFilterModalOpen(false)}
          onSave={handleApplyFilters}
          loading={apiLoading}
        />
      )}
    </div>
  );
};

export default DailyTransactionsTab;