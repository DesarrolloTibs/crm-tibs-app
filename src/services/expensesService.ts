import axiosInstance from '../core/axios/axiosInstance';
import { EXPENSES } from '../global/endpoints';
import type { Expense } from '../core/models/Expense';

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await axiosInstance.get(EXPENSES.EXPENSES);
    return response.data;
};

export const getExpenseById = async (id: string): Promise<Expense> => {
    const response = await axiosInstance.get(`${EXPENSES.EXPENSES}/${id}`);
    return response.data;
};

export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
    const response = await axiosInstance.post(EXPENSES.EXPENSES, expense);
    return response.data;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    const response = await axiosInstance.patch(`${EXPENSES.EXPENSES}/${id}`, expense);
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

    // Create a link element, hide it, direct it towards the blob, and then 'click' it intentionally
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
};
