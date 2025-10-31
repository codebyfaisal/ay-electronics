import { createDailyTransactionSchema, createInvestmentSchema, getSummarySchema, updateDailyTransactionSchema, updateInvestmentSchema } from "../schemas/finance.schema.js";
import { createInvestment, deleteInvestment, getInvestments, updateInvestment } from "../services/investment.service.js";
import { createDailyTransaction, deleteDailyTransaction, getDailyTransactions, updateDailyTransaction } from "../services/dailyTransaction.service.js";
import { deleteSummary, getSummary, getSummaries } from "../services/summary.service.js";
import { createHandler, deleteHandler, getManyHandler, updateHandler } from "./generic.controller.js";
import { idSchema } from "../schemas/common.schema.js";

const investment = "Investment";
export const handleGetInvestments = getManyHandler(
    getInvestments,
    investment,
);

export const handleCreateInvestment = createHandler(
    createInvestmentSchema,
    createInvestment,
    investment,
);

export const handleUpdateInvestment = updateHandler(
    updateInvestmentSchema,
    updateInvestment,
    investment
)

export const handleDeleteInvestment = deleteHandler(
    idSchema,
    deleteInvestment,
    investment,
);

const daily = "Daily Transaction";
export const handleGetDailyTransaction = getManyHandler(
    getDailyTransactions,
    daily,
);

export const handleCreateDailyTransaction = createHandler(
    createDailyTransactionSchema,
    createDailyTransaction,
    daily,
);

export const handleUpdateDailyTransaction = updateHandler(
    updateDailyTransactionSchema,
    updateDailyTransaction,
    daily,
);

export const handleDeleteDailyTransaction = deleteHandler(
    idSchema,
    deleteDailyTransaction,
    daily,
);

const monthly = "Monthly Summary";
export const handleGetSummaries = getManyHandler(
    getSummaries,
    monthly,
)

export const handleGetSummary = updateHandler(
    getSummarySchema,
    getSummary,
    monthly
)

export const handleDeleteSummary = deleteHandler(
    idSchema,
    deleteSummary,
    monthly,
);