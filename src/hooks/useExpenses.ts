import { useState, useEffect, useMemo, useCallback } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService';
import { getUsers } from '../services/usersService';
import type { Expense } from '../core/models/Expense';
import type { User as UserModel } from '../core/models/User';
import { useConfigStore } from '../store/useConfigStore';
import useDebounce from './useDebounce';
import useNotification from './useNotification';
import type { ExpenseFiltersState } from '../components/Expense/ExpenseFiltersBar';

const INITIAL_FILTERS: ExpenseFiltersState = {
  concept: '',
  user: null,
  date: '',
};

export function useExpenses() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [uploadingExpense, setUploadingExpense] = useState<Expense | null>(null);

  // Grouped filters state
  const [filters, setFilters] = useState<ExpenseFiltersState>(INITIAL_FILTERS);

  // Debounced concept for smooth typing
  const debouncedConcept = useDebounce(filters.concept, 250);

  // Reusable notification hook
  const { notification, showSuccess, showError, showConfirmation } = useNotification();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      showError('No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchExpenses();
    getUsers()
      .then((d) => setUsers(d.sort((a, b) => a.username.localeCompare(b.username))))
      .catch(console.error);
  }, [fetchExpenses, schemaName]);

  const handleCreate = async (data: Partial<Expense>) => {
    setLoading(true);
    try {
      await createExpense(data);
      setModalOpen(false);
      showSuccess('Gasto registrado correctamente');
      fetchExpenses();
    } catch {
      showError('No se pudo registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<Expense>) => {
    if (!editingExpense?.id) return;
    setLoading(true);
    try {
      await updateExpense(editingExpense.id, data);
      setModalOpen(false);
      setEditingExpense(undefined);
      showSuccess('Gasto actualizado correctamente');
      fetchExpenses();
    } catch {
      showError('No se pudo actualizar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((expense: Expense) => {
    showConfirmation({
      title: 'Confirmar eliminación',
      message: `¿Eliminar el gasto "${expense.concepto}"?`,
      onConfirm: async () => {
        if (!expense.id) return;
        setLoading(true);
        try {
          await deleteExpense(expense.id);
          showSuccess('El gasto ha sido eliminado.');
          fetchExpenses();
        } catch {
          showError('No se pudo eliminar el gasto');
        } finally {
          setLoading(false);
        }
      },
    });
  }, [showConfirmation, showSuccess, showError, fetchExpenses]);

  const handleFilterChange = useCallback(
    <K extends keyof ExpenseFiltersState>(key: K, value: ExpenseFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const openCreateModal = () => {
    setEditingExpense(undefined);
    setModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditingExpense(e);
    setModalOpen(true);
  };

  const openUploadModal = (e: Expense) => setUploadingExpense(e);
  const closeUploadModal = () => setUploadingExpense(null);
  const handleUploadSuccess = () => {
    closeUploadModal();
    fetchExpenses();
  };

  const userOptions = useMemo(
    () =>
      users
        .filter((u): u is UserModel & { id: string } => !!u.id)
        .map((u) => ({ value: u.id, label: u.username })),
    [users]
  );

  const filteredExpenses = useMemo(() => {
    const c = debouncedConcept.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchesConcept = !c || (e.concepto || '').toLowerCase().includes(c);
      const matchesUser = !filters.user || e.usuario?.id === filters.user;
      const matchesDate = !filters.date || e.fecha.startsWith(filters.date);
      return matchesConcept && matchesUser && matchesDate;
    });
  }, [expenses, debouncedConcept, filters.user, filters.date]);

  return {
    expenses: filteredExpenses,
    loading,
    modalOpen,
    setModalOpen,
    editingExpense,
    uploadingExpense,
    filters,
    userOptions,
    notification,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreateModal,
    openEditModal,
    openUploadModal,
    closeUploadModal,
    handleUploadSuccess,
  };
}

export default useExpenses;
