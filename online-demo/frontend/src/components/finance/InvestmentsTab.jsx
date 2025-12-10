// src/components/finance/InvestmentsTab.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../hooks/useFetch";
import useApi from "../../utils/useApi.js";
import Table from "../Table";
import Button from "../ui/Button";
import { Plus, RefreshCw, Filter } from "lucide-react";
import EditModal from "../EditModal.jsx";

const initialInvestmentData = {
  id: null,
  investor: "",
  investment: "",
  note: "",
  date: new Date().toISOString().split("T")[0],
};

const InvestmentsTab = () => {
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [dataToEdit, setDataToEdit] = useState(null);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterForm, setFilterForm] = useState({
    startDate: "", endDate: ""
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const { post, del, put, loading: apiLoading } = useApi();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page, limit: LIMIT });

    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        params.append(key, value);
    });

    return params.toString();
  }, [page, appliedFilters]);

  const {
    data: investmentsData,
    loading: fetchLoading,
    refetch,
  } = useFetch(`/finance/investments?${queryString}`, {}, true);

  const investments = investmentsData?.investments || [];
  const total = investmentsData?.total || 0;

  const handleSaveInvestment = async (data) => {
    const isNew = !data.id;

    const payload = {
      ...data,
      investment: Number(data.investment),
      date: new Date(data.date).toISOString(),
    };

    let result;
    if (isNew) {
      result = await post("/finance/investments", payload,
        { message: "Investment added successfully" }
      );
    } else {
      result = await put(`/finance/investments/${data.id}`,
        payload,
        { message: "Investment updated successfully" }
      );
    }

    if (result) {
      setIsCrudModalOpen(false);
      setDataToEdit(null);
      if (isNew) setPage(1);
      refetch();
    }
  };

  const handleOpenCreateModal = () => {
    setDataToEdit(initialInvestmentData);
    setIsCrudModalOpen(true);
  };

  const handleOpenEditModal = (investment) => {
    const formattedInvestment = {
      ...investment,
      investment: String(Number(investment.investment)),
      date: new Date(investment.date).toISOString().split('T')[0]
    }
    setDataToEdit(formattedInvestment);
    setIsCrudModalOpen(true);
  };

  const handleApplyFilters = (form) => {
    const newAppliedFilters = {};

    if (form.startDate) newAppliedFilters.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) newAppliedFilters.endDate = new Date(form.endDate).toISOString();

    setFilterForm(form);
    setPage(1);
    setAppliedFilters(newAppliedFilters);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilterForm({ startDate: "", endDate: "" });
    setAppliedFilters({});
    setPage(1);
    setIsFilterModalOpen(false);
  };


  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this investment?")) {
      const result = await del(`/finance/investments/${id}`,
        { message: "Investment deleted successfully" }
      );
      if (result !== null) refetch();
    }
  };

  const handleAction = (action, id) => {
    const investment = investments.find(i => i.id === id);
    if (!investment) return;

    switch (action) {
      case 'edit':
        handleOpenEditModal(investment);
        break;
      case 'delete':
        handleDelete(id);
        break;
      default:
        break;
    }
  };


  const investmentFields = [
    { label: "Investor Name", key: "investor", type: "text", required: true },
    { label: "Amount", key: "investment", type: "number", required: true, rest: { min: 0.01, step: "0.01" } },
    { label: "Date", key: "date", type: "date", required: true },
    { label: "Note (Optional)", key: "note", type: "text", required: false },
    { label: "ID", key: "id", type: "number", required: false, rest: { className: "hidden" } }
  ];

  const filterFields = [
    { key: 'startDate', label: 'Start Date', type: 'date', required: false },
    { key: 'endDate', label: 'End Date', type: 'date', required: false },
  ];

  const columns = useMemo(
    () => [
      { header: "Investor", accessor: "investor" },
      {
        header: "Amount",
        accessor: "investment",
        currency: true,
        render: (row) => Number(row.investment).toLocaleString(),
      },
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
      <div className="flex justify-between items-center">
        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          className="w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Investment
        </Button>

        <div className="flex space-x-2">
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
          </div>

          <Button variant="secondary" onClick={() => setIsFilterModalOpen(true)} title="Filter Records">
            <Filter className="w-5 h-5 mr-2" /> Filter
          </Button>
          <Button variant="secondary" onClick={handleResetFilters} title="Reset Filter and Refresh List">
            <RefreshCw className="w-5 h-5" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>
      </div>

      <div className="relative min-h-64">
        <Table
          purpose="investments"
          data={investments || []}
          columns={columns}
          pagination={{
            page: page,
            limit: LIMIT,
            total: total,
          }}
          onPageChange={setPage}
          onAction={handleAction}
          loading={fetchLoading || apiLoading}
          activeActions={{ remove: true, edit: true }}
        />
      </div>

      {isCrudModalOpen && dataToEdit && (
        <EditModal
          isOpen={isCrudModalOpen}
          title={dataToEdit.id ? `Edit Investment #${dataToEdit.id}` : "Add New Investment"}
          initialData={dataToEdit}
          fields={investmentFields}
          onClose={() => { setIsCrudModalOpen(false); setDataToEdit(null); }}
          onSave={handleSaveInvestment}
          loading={apiLoading}
        />
      )}

      {isFilterModalOpen && (
        <EditModal
          isOpen={isFilterModalOpen}
          title="Filter Investments By Date Range"
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

export default InvestmentsTab;