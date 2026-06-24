import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService';
import { getUsers } from '../services/usersService';
import type { Expense } from '../core/models/Expense';
import type { User as UserModel } from '../core/models/User';
import ExpensesTable from '../components/Expense/ExpensesTable';
import ExpenseForm from '../components/Expense/ExpenseForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import Notification from '../components/Modal/Notification';
import { Plus, Filter, XCircle, Calendar } from 'lucide-react';
import { type SingleValue } from 'react-select';
import Select from '../components/shared/Select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

import ReceiptUploadModal from '../components/Expense/ReceiptUploadModal';

const PAGE_SIZE = 10;

interface SelectOption {
    value: string;
    label: string;
}

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
    const [uploadingExpense, setUploadingExpense] = useState<Expense | null>(null);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filterConcept, setFilterConcept] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
    });

    const searchDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hideNotification = () => setNotification({ ...notification, show: false });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const data = await getExpenses();
            setExpenses(data);
            setFilteredExpenses(data);
        } catch (error) {
            console.error(error);
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los gastos', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();

        const fetchUsers = async () => {
            try {
                const usersData = await getUsers();
                setUsers(usersData.sort((a, b) => a.username.localeCompare(b.username)));
            } catch (error) {
                console.error("Failed to fetch users for filter", error);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const results = expenses.filter(expense => {
            const matchesConcept = expense.concepto.toLowerCase().includes(filterConcept.toLowerCase());
            const matchesUser = filterUser ? (expense.usuario?.id === filterUser) : true;
            const matchesDate = filterDate ? expense.fecha.startsWith(filterDate) : true;

            return matchesConcept && matchesUser && matchesDate;
        });
        setFilteredExpenses(results);
        setCurrentPage(1);
    }, [filterConcept, filterUser, filterDate, expenses]);

    const handleCreate = async (expenseData: Partial<Expense>) => {
        setLoading(true);
        try {
            await createExpense(expenseData);
            setModalOpen(false);
            setNotification({
                show: true, type: 'success', title: 'Éxito', message: 'Gasto registrado correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchExpenses();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo registrar el gasto', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (expenseData: Partial<Expense>) => {
        if (!editingExpense?.id) return;
        setLoading(true);
        try {
            await updateExpense(editingExpense.id, expenseData);
            setModalOpen(false);
            setEditingExpense(undefined);
            setNotification({
                show: true, type: 'success', title: 'Éxito', message: 'Gasto actualizado correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchExpenses();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar el gasto', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (expense: Expense) => {
        setNotification({
            show: true,
            type: 'confirmation',
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de que deseas eliminar el gasto "${expense.concepto}"?`,
            onConfirm: async () => {
                hideNotification();
                setLoading(true);
                try {
                    if (expense.id) {
                        await deleteExpense(expense.id);
                        setNotification({
                            show: true, type: 'success', title: 'Eliminado', message: 'El gasto ha sido eliminado.', onConfirm: hideNotification, onCancel: hideNotification
                        });
                        fetchExpenses();
                    }
                } catch (error) {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el gasto', onConfirm: hideNotification, onCancel: hideNotification
                    });
                } finally {
                    setLoading(false);
                }
            },
            onCancel: hideNotification
        });
    };

    const openCreateModal = () => {
        setEditingExpense(undefined);
        setModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setModalOpen(true);
    };

    const openUploadModal = (expense: Expense) => {
        setUploadingExpense(expense);
    };

    const closeUploadModal = () => {
        setUploadingExpense(null);
    };

    const handleUploadSuccess = () => {
        closeUploadModal();
        fetchExpenses();
    };

    const handleClearFilters = () => {
        setFilterConcept('');
        setFilterUser('');
        setFilterDate('');
    };

    const userOptions: SelectOption[] = useMemo(() =>
        users
            .filter((user): user is UserModel & { id: string } => !!user.id)
            .map(user => ({
                value: user.id,
                label: user.username,
            })),
        [users]);

    const handleUserFilterChange = (selectedOption: SingleValue<SelectOption>) => {
        setFilterUser(selectedOption ? selectedOption.value : '');
    };

    // Pagination
    const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const badges = useMemo(() => {
        const list: SearchBadge[] = [];
        if (filterUser) {
            list.push({
                id: 'user',
                label: userOptions.find(o => o.value === filterUser)?.label || 'Usuario',
                icon: <Filter size={10} />,
                onRemove: () => setFilterUser('')
            });
        }
        if (filterDate) {
            list.push({
                id: 'date',
                label: filterDate,
                icon: <Calendar size={10} />,
                onRemove: () => setFilterDate('')
            });
        }
        return list;
    }, [filterUser, filterDate, userOptions]);

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                    <UnifiedSearchBar
                        ref={searchDropdownRef}
                        searchTerm={filterConcept}
                        onSearchChange={setFilterConcept}
                        placeholder={!filterUser && !filterDate ? "Buscar por concepto..." : ""}
                        badges={badges}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        dropdownWidthClass="w-[300px]"
                    >
                        <div className="w-full flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Usuario</h4>
                                <Select
                                    inputId="user-filter"
                                    options={userOptions}
                                    value={filterUser ? userOptions.find(option => option.value === filterUser) : null}
                                    onChange={handleUserFilterChange}
                                    placeholder="Filtrar por usuario"
                                    isClearable
                                    isSearchable
                                    noOptionsMessage={() => 'No se encontraron usuarios'}
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Fecha</h4>
                                <Input
                                    type="date"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="text-xs bg-white cursor-pointer py-2 rounded-xl"
                                />
                            </div>
                            <div className="border-t border-gray-100 my-1 pt-2 w-full" />
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            >
                                <XCircle size={12} />
                                Limpiar Filtros
                            </button>
                        </div>
                    </UnifiedSearchBar>

                    <Button
                        variant="success"
                        onClick={openCreateModal}
                        className="w-full sm:w-auto py-2.5 px-4 h-[38px] flex items-center justify-center whitespace-nowrap"
                    >
                        <Plus size={18} className="mr-2" /> Nuevo Gasto
                    </Button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <ExpensesTable
                    expenses={paginatedExpenses}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onUploadReceipt={openUploadModal}
                />
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ExpenseForm
                    initialData={editingExpense}
                    onSubmit={editingExpense ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>

            <Modal open={!!uploadingExpense} onClose={closeUploadModal}>
                {uploadingExpense && (
                    <ReceiptUploadModal
                        expense={uploadingExpense}
                        onClose={closeUploadModal}
                        onUploadSuccess={handleUploadSuccess}
                    />
                )}
            </Modal>
        </>
    );
};

export default ExpensesPage;
