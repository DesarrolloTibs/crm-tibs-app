import axiosInstance from '@core/axios/axiosInstance';
import { EXPENSES } from '@/global/endpoints';
import type { Expense } from '@core/models/Expense';
import { configStore } from '@/store/useConfigStore';

let expensesCache: Record<string, { data: Expense[]; timestamp: number }> = {};
let pendingExpensesPromises: Record<string, Promise<Expense[]>> = {};

export const clearExpensesCache = () => {
  expensesCache = {};
};

export const getExpenses = async (forceRefresh = false): Promise<Expense[]> => {
    const selectedTenant = configStore.getSelectedTenant();
    const currentSchema = selectedTenant?.schema_name || 'public';
    const now = Date.now();

    if (!forceRefresh && expensesCache[currentSchema] && now - expensesCache[currentSchema].timestamp < 3000) {
      return expensesCache[currentSchema].data;
    }

    if (currentSchema in pendingExpensesPromises) {
      return pendingExpensesPromises[currentSchema];
    }

    const promise = (async () => {
      try {
        const response = await axiosInstance.get(EXPENSES.EXPENSES);
        const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Expense[];
        expensesCache[currentSchema] = { data, timestamp: Date.now() };
        return data;
      } finally {
        delete pendingExpensesPromises[currentSchema];
      }
    })();

    pendingExpensesPromises[currentSchema] = promise;
    return promise;
};

export const getExpenseById = async (id: string): Promise<Expense> => {
    const response = await axiosInstance.get(`${EXPENSES.EXPENSES}/${id}`);
    return response.data;
};

/**
 * Sanitiza el payload de un gasto antes de enviarlo a la API (POST o PATCH).
 * Remueve metadatos (id, createdAt, usuario_id, receiptUrl) y relaciones (client, opportunity, usuario)
 * para cumplir estrictamente con backend forbidNonWhitelisted: true.
 */
export function sanitizeExpensePayload(expense: Partial<Expense>): Record<string, any> {
    const payload: Record<string, any> = {};

    if (expense.fecha !== undefined) {
        payload.fecha = expense.fecha;
    }
    if (expense.concepto !== undefined) {
        payload.concepto = typeof expense.concepto === 'string' ? expense.concepto.trim() : expense.concepto;
    }
    if (expense.monto !== undefined) {
        payload.monto = Number(expense.monto);
    }
    if ('client_id' in expense) {
        payload.client_id = expense.client_id || null;
    }
    if ('opportunity_id' in expense) {
        payload.opportunity_id = expense.opportunity_id || null;
    }

    return payload;
}

export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
    const payload = sanitizeExpensePayload(expense);
    const response = await axiosInstance.post(EXPENSES.EXPENSES, payload);
    return response.data;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    const payload = sanitizeExpensePayload(expense);
    const response = await axiosInstance.patch(`${EXPENSES.EXPENSES}/${id}`, payload);
    return response.data;
};

export const deleteExpense = async (id: string): Promise<void> => {
    await axiosInstance.delete(`${EXPENSES.EXPENSES}/${id}`);
};

export const uploadReceipt = async (id: string, file: File): Promise<Expense> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<Expense>(
        `${EXPENSES.EXPENSES}/${id}/receipt`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const deleteReceipt = async (id: string): Promise<void> => {
    await axiosInstance.delete(`${EXPENSES.EXPENSES}/${id}/receipt`);
};

export const downloadReceipt = async (id: string, filename: string): Promise<void> => {
    const response = await axiosInstance.get(
        `${EXPENSES.EXPENSES}/${id}/receipt/download`,
        { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
};
