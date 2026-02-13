import React, { useEffect, useState, useMemo } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesService';
import { getUsers } from '../services/usersService';
import type { Expense } from '../core/models/Expense';
import type { User as UserModel } from '../core/models/User';
import ExpensesTable from '../components/Expense/ExpensesTable';
import ExpenseForm from '../components/Expense/ExpenseForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import Notification from '../components/Modal/Notification';
import { PlusCircle, Search, Filter, XCircle, User, Calendar } from 'lucide-react';
import Select, { type SingleValue } from 'react-select';

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

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Control de Gastos</h1>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <button
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        <span>Filtros</span>
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                    >
                        <PlusCircle size={18} /> Nuevo Gasto
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-down">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
                        <button onClick={handleClearFilters} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <XCircle size={16} className="mr-1" />
                            Limpiar filtros
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <Search size={20} />
                            </span>
                            <input
                                type="text"
                                placeholder="Filtrar por concepto"
                                value={filterConcept}
                                onChange={e => setFilterConcept(e.target.value)}
                                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <User size={20} />
                            </span>
                            <Select
                                inputId="user-filter"
                                options={userOptions}
                                value={filterUser ? userOptions.find(option => option.value === filterUser) : null}
                                onChange={handleUserFilterChange}
                                placeholder="Filtrar por usuario"
                                isClearable
                                isSearchable
                                noOptionsMessage={() => 'No se encontraron usuarios'}
                                styles={{ input: (base) => ({ ...base, paddingLeft: '28px' }) }}
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <Calendar size={20} />
                            </span>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}

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
