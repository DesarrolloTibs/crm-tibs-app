import { useState, useEffect, useMemo, useRef } from 'react';
import { type SingleValue } from 'react-select';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService';
import { getUsers } from '../services/usersService';
import type { Expense } from '../core/models/Expense';
import type { User as UserModel } from '../core/models/User';
import { useConfigStore } from '../store/useConfigStore';

const PAGE_SIZE = 10;
export interface SelectOption { value: string; label: string; }
type NotifType = 'success' | 'error' | 'warning' | 'confirmation';
interface Notif { show: boolean; type: NotifType; title: string; message: string; onConfirm: () => void; onCancel: () => void; }
const NOTIF_OFF: Notif = { show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {} };

export function useExpenses() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [uploadingExpense, setUploadingExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterConcept, setFilterConcept] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<Notif>(NOTIF_OFF);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const showSuccess = (msg: string) => setNotification({ show: true, type: 'success', title: '¡Éxito!', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showError = (msg: string) => setNotification({ show: true, type: 'error', title: 'Error', message: msg, onConfirm: hideNotification, onCancel: hideNotification });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowFilters(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try { const data = await getExpenses(); setExpenses(data); setFilteredExpenses(data); }
    catch { showError('No se pudieron cargar los gastos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); getUsers().then(d => setUsers(d.sort((a,b) => a.username.localeCompare(b.username)))).catch(console.error); }, [schemaName]);

  useEffect(() => {
    const results = expenses.filter(e => e.concepto.toLowerCase().includes(filterConcept.toLowerCase()) && (filterUser ? e.usuario?.id === filterUser : true) && (filterDate ? e.fecha.startsWith(filterDate) : true));
    setFilteredExpenses(results); setCurrentPage(1);
  }, [filterConcept, filterUser, filterDate, expenses]);

  const handleCreate = async (data: Partial<Expense>) => {
    setLoading(true);
    try { await createExpense(data); setModalOpen(false); showSuccess('Gasto registrado correctamente'); fetchExpenses(); }
    catch { showError('No se pudo registrar el gasto'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (data: Partial<Expense>) => {
    if (!editingExpense?.id) return;
    setLoading(true);
    try { await updateExpense(editingExpense.id, data); setModalOpen(false); setEditingExpense(undefined); showSuccess('Gasto actualizado correctamente'); fetchExpenses(); }
    catch { showError('No se pudo actualizar el gasto'); }
    finally { setLoading(false); }
  };

  const handleDelete = (expense: Expense) => {
    setNotification({ show: true, type: 'confirmation', title: 'Confirmar eliminación', message: `¿Eliminar el gasto "${expense.concepto}"?`,
      onConfirm: async () => { hideNotification(); setLoading(true); try { if (expense.id) { await deleteExpense(expense.id); showSuccess('El gasto ha sido eliminado.'); fetchExpenses(); } } catch { showError('No se pudo eliminar el gasto'); } finally { setLoading(false); } },
      onCancel: hideNotification });
  };

  const openCreateModal = () => { setEditingExpense(undefined); setModalOpen(true); };
  const openEditModal = (e: Expense) => { setEditingExpense(e); setModalOpen(true); };
  const openUploadModal = (e: Expense) => setUploadingExpense(e);
  const closeUploadModal = () => setUploadingExpense(null);
  const handleUploadSuccess = () => { closeUploadModal(); fetchExpenses(); };
  const handleClearFilters = () => { setFilterConcept(''); setFilterUser(''); setFilterDate(''); };

  const userOptions: SelectOption[] = useMemo(() => users.filter((u): u is UserModel & { id: string } => !!u.id).map(u => ({ value: u.id, label: u.username })), [users]);
  const handleUserFilterChange = (sel: SingleValue<SelectOption>) => setFilterUser(sel ? sel.value : '');

  const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
  const paginatedExpenses = useMemo(() => filteredExpenses.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), [filteredExpenses, currentPage]);

  return {
    expenses, filteredExpenses, paginatedExpenses, loading, modalOpen, setModalOpen,
    editingExpense, uploadingExpense, showFilters, setShowFilters,
    filterConcept, setFilterConcept, filterUser, setFilterUser, filterDate, setFilterDate,
    currentPage, setCurrentPage, notification, searchDropdownRef,
    userOptions, handleUserFilterChange, totalPages,
    handleCreate, handleUpdate, handleDelete,
    openCreateModal, openEditModal, openUploadModal, closeUploadModal, handleUploadSuccess, handleClearFilters,
  };
}
