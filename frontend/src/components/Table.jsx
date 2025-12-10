// src/components/Table.jsx
import React from "react";
import { ChevronLeft, ChevronRight, Eye, Trash2, Edit } from "lucide-react";
import Button from "./ui/Button";

const Table = ({
  purpose = "",
  data = [],
  columns = [],
  pagination = { page: 1, limit: 10, total: 0 },
  onPageChange,
  onAction,
  activeActions = {
    view: false,
    edit: false,
    remove: false,
  },
  loading = false,
  id = false
}) => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  const startCount = (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  const allColumns = [
    {
      header: "S no.",
      accessor: "s_no",
      render: (row, index) => <p>#{id ? row.id : startCount + index}</p>,
    },
    ...columns,
  ];

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg text-gray-500">No records found.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto shadow-md rounded-md bg-[rgb(var(--bg))] p-4">
      {loading && (
        <div className="absolute inset-0 bg-[rgb(var(--bg))] bg-opacity-60 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-t-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <p className="text-sm mb-3 text-gray-500">
        {startCount} of {total} {purpose}
      </p>

      <table className="min-w-full divide-y divide-[rgb(var(--border))]">
        <thead className="bg-[rgb(var(--bg-secondary))] dark:bg-gray-700">
          <tr>
            {allColumns?.map((col, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
              >
                {col.header}
              </th>
            ))}
            {(activeActions.view ||
              activeActions.edit ||
              activeActions.remove) &&
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white">
                Actions
              </th>
            }
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--border))]">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id}
              className="hover:bg-[rgb(var(--bg-secondary))] transition-colors duration-150"
            >
              {allColumns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`p-4 whitespace-nowrap text-sm text-[rgb(var(--text))]} ${col.className
                    } ${col.onClick ? "cursor-pointer underline" : ""}`}
                  onClick={() => col.onClick && col.onClick(row)}
                >
                  {col.render
                    ? col.render(row, rowIndex)
                    : row[col.accessor] ?? "-"}
                  {col.currency && (
                    <span className="ml-1 text-[0.7rem]">PKR</span>
                  )}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2 justify-center">
                  {activeActions.view && (
                    <Button
                      variant="ghost"
                      onClick={() => onAction("view", row.id)}
                      className="p-1 ring"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[rgb(var(--secondary))]" />
                    </Button>
                  )}

                  {activeActions.edit && (
                    <Button
                      variant="ghost"
                      onClick={() => onAction("edit", row.id)}
                      className="p-1 ring"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-[rgb(var(--primary))]" />
                    </Button>
                  )}

                  {activeActions.remove && (
                    <Button
                      variant="ghost"
                      onClick={() => onAction("delete", row.id)}
                      className="p-1 ring"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[rgb(var(--error))]" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {total > limit && (
        <div className="flex justify-between items-center pt-4 border-t border-[rgb(var(--border))] mt-4">
          <p className="text-sm text-gray-500">
            Showing {startCount} to {endCount} of {total} entries
          </p>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={page === 1 || loading}
              className="text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={page === totalPages || loading}
              className="text-sm"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
