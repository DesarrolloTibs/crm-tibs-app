import React, { useState, useContext, createContext, useEffect, useMemo, useCallback, ReactNode, FormEvent, ChangeEvent } from 'react';
import { LayoutDashboard, Users, Zap, CalendarCheck, LogOut, Settings, BarChart, X, Menu, Search, Filter, Sparkles, Loader2, Mail, Trash2, Edit } from 'lucide-react';

// --- 0. CORE DATA INTERFACES ---

type ClientStatus = 'Activo' | 'Inactivo' | 'Potencial';
type OpportunityStage = 'Prospección' | 'Calificación' | 'Propuesta' | 'Negociación' | 'Cerrada Ganada' | 'Cerrada Perdida';
type TaskType = 'Cliente' | 'Oportunidad';
type UserRole = 'admin' | 'vendedor';
type OpportunityStatus = 'Open' | 'Closed';

interface Client {
    id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    company: string;
    interactions: number;
    status: ClientStatus;
}

interface Opportunity {
    id: string;
    name: string;
    client: string; // Client Name
    clientId: string;
    amount: number;
    stage: OpportunityStage;
    assignedTo: UserRole;
    closeDate: string; // YYYY-MM-DD
    status: OpportunityStatus;
}

interface Task {
    id: string;
    title: string;
    relatedTo: string; // Client ID or Opportunity ID
    type: TaskType;
    dueDate: string; // YYYY-MM-DD
    completed: boolean;
    assignedTo: UserRole;
}

interface User {
    id: string;
    username: string;
    role: UserRole;
}

// --- 1. CONTEXT TYPES ---

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    isAdmin: boolean;
    isSales: boolean;
}

interface DataContextType {
    clients: Client[];
    addClient: (newClient: Omit<Client, 'id' | 'interactions'>) => void;
    updateClient: (updatedClient: Client) => void;
    deleteClient: (id: string) => void;
    getClientById: (id: string) => Client | undefined;

    opportunities: Opportunity[];
    addOpportunity: (newOpportunity: Omit<Opportunity, 'id' | 'status'>) => void;
    updateOpportunity: (updatedOpportunity: Opportunity) => void;
    deleteOpportunity: (id: string) => void;

    tasks: Task[];
    addTask: (newTask: Omit<Task, 'id' | 'completed'>) => void;
    updateTask: (updatedTask: Task) => void;
    deleteTask: (id: string) => void;
    toggleTaskCompletion: (id: string) => void;
}

// --- 2. DATA AND STATE MANAGEMENT (Context API) ---

// Mock Data (now strictly typed)
const initialClients: Client[] = [
    { id: 'c1', name: 'Innovacion Digital S.A.', contact: 'Ana Lopez', email: 'ana@innova.com', phone: '555-0101', company: 'Innovacion Digital', interactions: 3, status: 'Activo' },
    { id: 'c2', name: 'Servicios Globales Ltda.', contact: 'Pedro Martínez', email: 'pedro@global.com', phone: '555-0102', company: 'Servicios Globales', interactions: 5, status: 'Activo' },
    { id: 'c3', name: 'Tecnología Avanzada Corp.', contact: 'María García', email: 'maria@tecadv.com', phone: '555-0103', company: 'Tecnología Avanzada', interactions: 1, status: 'Inactivo' },
];

const initialOpportunities: Opportunity[] = [
    { id: 'o1', name: 'Renovación de Licencias', client: 'Innovacion Digital S.A.', clientId: 'c1', amount: 15000, stage: 'Propuesta', assignedTo: 'admin', closeDate: '2025-11-15', status: 'Open' },
    { id: 'o2', name: 'Nuevo Contrato de Soporte', client: 'Servicios Globales Ltda.', clientId: 'c2', amount: 2500, stage: 'Negociación', assignedTo: 'vendedor', closeDate: '2025-10-30', status: 'Open' },
    { id: 'o3', name: 'Expansión de Sistema', client: 'Tecnología Avanzada Corp.', clientId: 'c3', amount: 50000, stage: 'Cerrada Ganada', assignedTo: 'admin', closeDate: '2025-09-20', status: 'Closed' },
];

const initialTasks: Task[] = [
    { id: 't1', title: 'Llamar a Ana Lopez para seguimiento de licencia', relatedTo: 'c1', type: 'Cliente', dueDate: '2025-10-01', completed: false, assignedTo: 'admin' },
    { id: 't2', title: 'Enviar Propuesta final para O2', relatedTo: 'o2', type: 'Oportunidad', dueDate: '2025-10-05', completed: false, assignedTo: 'vendedor' },
    { id: 't3', title: 'Revisión trimestral de servicio con Pedro Martínez', relatedTo: 'c2', type: 'Cliente', dueDate: '2025-09-25', completed: true, assignedTo: 'admin' },
];

// Context Setup - Using non-null assertion as the provider will always wrap consumers
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DataContext = createContext<DataContextType | undefined>(undefined);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Mock Auth Provider
const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (username: string, password: string): boolean => {
        if (username === 'admin' && password === '123') {
            setUser({ id: 'u1', username: 'Administrador', role: 'admin' });
            return true;
        } else if (username === 'vendedor' && password === '123') {
            setUser({ id: 'u2', username: 'Vendedor', role: 'vendedor' });
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';
    const isSales = user?.role === 'vendedor';

    const value: AuthContextType = { user, login, logout, isAdmin, isSales };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Data Provider
const DataProvider = ({ children }: { children: ReactNode }) => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const generateId = (prefix: string, items: { id: string }[]) => {
        return prefix + (items.length + 1).toString();
    };

    // --- CLIENTS CRUD ---
    const addClient = (newClient: Omit<Client, 'id' | 'interactions'>) => {
        const fullClient: Client = { ...newClient, id: generateId('c', clients), interactions: 0 };
        setClients(prev => [...prev, fullClient]);
    };
    const updateClient = (updatedClient: Client) => {
        setClients(prev => prev.map(c => (c.id === updatedClient.id ? updatedClient : c)));
    };
    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
    };
    const getClientById = useCallback((id: string): Client | undefined => {
        return clients.find(c => c.id === id);
    }, [clients]);

    // --- OPPORTUNITIES CRUD ---
    const addOpportunity = (newOpportunity: Omit<Opportunity, 'id' | 'status'>) => {
        const status: OpportunityStatus = newOpportunity.stage.startsWith('Cerrada') ? 'Closed' : 'Open';
        const fullOpportunity: Opportunity = { ...newOpportunity, id: generateId('o', opportunities), status };
        setOpportunities(prev => [...prev, fullOpportunity]);
    };
    const updateOpportunity = (updatedOpportunity: Opportunity) => {
        setOpportunities(prev => prev.map(o => (o.id === updatedOpportunity.id ? updatedOpportunity : o)));
    };
    const deleteOpportunity = (id: string) => {
        setOpportunities(prev => prev.filter(o => o.id !== id));
    };

    // --- TASKS CRUD ---
    const addTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
        const fullTask: Task = { ...newTask, id: generateId('t', tasks), completed: false };
        setTasks(prev => [...prev, fullTask]);
    };
    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    };
    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };
    const toggleTaskCompletion = (id: string) => {
        setTasks(prev => prev.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };
    
    const value: DataContextType = {
        clients, addClient, updateClient, deleteClient, getClientById,
        opportunities, addOpportunity, updateOpportunity, deleteOpportunity,
        tasks, addTask, updateTask, deleteTask, toggleTaskCompletion
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// --- 3. LLM UTILITIES ---

/**
 * Calls the Gemini API to generate content with exponential backoff.
 * @param {string} systemPrompt - Instruction for the model's persona/role.
 * @param {string} userQuery - The specific task/query for the model.
 * @returns {Promise<string>} The generated text content.
 */
const fetchGeminiContent = async (systemPrompt: string, userQuery: string): Promise<string> => {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 && i < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                return text;
            } else {
                throw new Error("Received empty response from Gemini.");
            }
        } catch (e) {
            const error = e as Error;
            console.error(`Gemini API Error (Attempt ${i + 1}):`, error);
            if (i === MAX_RETRIES - 1) throw new Error("Fallo al contactar con la IA después de varios intentos.");
        }
    }
    throw new Error("Fallo desconocido al contactar con la IA."); // Should be unreachable
};

// Generic Modal Component Props
interface AIModalProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
}

const AIModal: React.FC<AIModalProps> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <Card title={title} className="w-full max-w-2xl animate-in fade-in zoom-in duration-300">
            <div className="max-h-[80vh] overflow-y-auto pr-2">
                {children}
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition shadow-lg"
                >
                    Cerrar
                </button>
            </div>
        </Card>
    </div>
);


// --- 4. COMPONENTS ---

// Generic Card Component Props
interface CardProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg transition-all ${className}`}>
        {title && <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>}
        {children}
    </div>
);

// Stat Card Props
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <Card className={`border-l-4 border-${color}-500 flex justify-between items-center`}>
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-500 opacity-60`} />
    </Card>
);

// Client List Item Props
interface ClientListItemProps {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (id: string, name: string) => void;
    onAnalyze: (client: Client) => void;
}

const ClientListItem: React.FC<ClientListItemProps> = ({ client, onEdit, onDelete, onAnalyze }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b hover:bg-gray-50 transition duration-150">
        <div className="flex-1 min-w-0 mb-2 sm:mb-0">
            <p className="text-lg font-semibold text-blue-600 truncate">{client.name}</p>
            <p className="text-sm text-gray-500 truncate">{client.contact} - {client.company}</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
            <div className="flex space-x-2 items-center">
                <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">{client.status}</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{client.interactions} Interacciones</span>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onAnalyze(client)}
                    className="flex items-center text-purple-600 hover:text-purple-900 transition p-1 rounded-full hover:bg-purple-100"
                    title="Análisis de IA"
                >
                    <Sparkles className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onEdit(client)}
                    className="text-indigo-600 hover:text-indigo-900 transition p-1 rounded-full hover:bg-indigo-100"
                    title="Editar Cliente"
                >
                    <Edit className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(client.id, client.name)}
                    className="text-red-600 hover:text-red-900 transition p-1 rounded-full hover:bg-red-100"
                    title="Eliminar Cliente"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);

// Client Form Props
interface ClientFormProps {
    client: Client | null;
    onClose: () => void;
    onSave: (clientData: Client | Omit<Client, 'id' | 'interactions'>) => void;
}

// Client Form (Create/Edit Modal Simulation)
const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSave }) => {
    // Type for the form data state
    const [formData, setFormData] = useState<Client | Omit<Client, 'interactions'>>(
        client || { name: '', company: '', email: '', phone: '', contact: '', status: 'Activo' as ClientStatus }
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card title={client ? 'Editar Cliente' : 'Crear Nuevo Cliente'} className="w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Input fields for client details */}
                    {(['name', 'company', 'contact', 'email', 'phone'] as Array<keyof (Client | Omit<Client, 'interactions'>)>).map((field) => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">
                                {field === 'name' ? 'Nombre/Razón Social' : field}
                            </label>
                            <input
                                type={field === 'email' ? 'email' : 'text'}
                                name={field}
                                value={formData[field as keyof Client]}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Potencial">Potencial</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            {client ? 'Guardar Cambios' : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Opportunity Form Props
interface OpportunityFormProps {
    opportunity: Opportunity | null;
    onClose: () => void;
    onSave: (oppData: Opportunity | Omit<Opportunity, 'id' | 'status'>) => void;
    clients: Client[];
}

// Opportunity Form
const OpportunityForm: React.FC<OpportunityFormProps> = ({ opportunity, onClose, onSave, clients }) => {
    const initialData: Omit<Opportunity, 'status'> | Opportunity = opportunity || {
        name: '',
        client: '',
        clientId: '',
        amount: 0,
        stage: 'Prospección',
        assignedTo: 'admin',
        closeDate: new Date().toISOString().slice(0, 10),
        ...(opportunity ? { id: opportunity.id } : {}) // Include ID only if editing
    };
    const [formData, setFormData] = useState<Omit<Opportunity, 'status'> | Opportunity>(initialData);

    const stages: OpportunityStage[] = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cerrada Ganada', 'Cerrada Perdida'];
    const users: UserRole[] = ['admin', 'vendedor'];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'clientId') {
            const client = clients.find(c => c.id === value);
            setFormData(prev => ({ 
                ...prev, 
                clientId: value, 
                client: client ? client.name : '' 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as any })); // Use 'as any' for stage/assignedTo string conversion
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const dataToSave = { 
            ...formData, 
            amount: Number(formData.amount),
        };

        if (opportunity) {
             // If editing, calculate status based on stage
            const updatedOpportunity: Opportunity = {
                ...dataToSave as Opportunity,
                status: dataToSave.stage.startsWith('Cerrada') ? 'Closed' : 'Open'
            }
            onSave(updatedOpportunity);
        } else {
             // If creating, send Omit<Opportunity, 'id' | 'status'>
            onSave(dataToSave as Omit<Opportunity, 'id' | 'status'>);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card title={opportunity ? 'Editar Oportunidad' : 'Crear Nueva Oportunidad'} className="w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de Oportunidad</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cliente</label>
                        <select name="clientId" value={formData.clientId} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <option value="">-- Seleccionar Cliente --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Monto ($)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha Estimada de Cierre</label>
                            <input type="date" name="closeDate" value={formData.closeDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Etapa</label>
                        <select name="stage" value={formData.stage} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                        <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            {users.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition">
                            {opportunity ? 'Guardar Cambios' : 'Guardar Oportunidad'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Task Form Props
interface TaskFormProps {
    task: Task | null;
    onClose: () => void;
    onSave: (taskData: Task | Omit<Task, 'id' | 'completed'>) => void;
    clients: Client[];
    opportunities: Opportunity[];
}

// Task Form
const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSave, clients, opportunities }) => {
    const initialData: Omit<Task, 'completed'> | Task = task || {
        title: '',
        relatedTo: '', 
        type: 'Cliente',
        dueDate: new Date().toISOString().slice(0, 10),
        assignedTo: 'admin',
        ...(task ? { id: task.id, completed: task.completed } : {})
    };
    const [formData, setFormData] = useState<Omit<Task, 'completed'> | Task>(initialData);

    const users: UserRole[] = ['admin', 'vendedor']; 

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (task) {
            onSave(formData as Task);
        } else {
            onSave(formData as Omit<Task, 'id' | 'completed'>);
        }
        onClose();
    };

    const relatedList = formData.type === 'Cliente' ? clients : opportunities;
    const relatedLabel = formData.type === 'Cliente' ? 'Cliente' : 'Oportunidad';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card title={task ? 'Editar Tarea' : 'Crear Nueva Tarea'} className="w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título de Tarea</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Relación</label>
                            <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                <option value="Cliente">Cliente</option>
                                <option value="Oportunidad">Oportunidad</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Relacionado con ({relatedLabel})</label>
                            <select name="relatedTo" value={formData.relatedTo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                <option value="">-- Seleccionar {relatedLabel} --</option>
                                {relatedList.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                {users.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {task && (
                        <div className="flex items-center pt-2">
                            <input 
                                type="checkbox" 
                                name="completed" 
                                checked={(formData as Task).completed} 
                                onChange={handleChange} 
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded" 
                            />
                            <label className="ml-2 block text-sm text-gray-900">Completada</label>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition">
                            {task ? 'Guardar Cambios' : 'Guardar Tarea'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// Opportunity Card Props
interface OpportunityCardProps {
    opp: Opportunity;
    onEdit: (opp: Opportunity) => void;
    onDelete: (id: string, name: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opp, onEdit, onDelete }) => (
    <div key={opp.id} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-indigo-400 hover:shadow-md transition duration-150">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-gray-800">{opp.name}</p>
                <p className="text-sm text-gray-600">{opp.client}</p>
            </div>
            <div className="flex space-x-1">
                <button
                    onClick={() => onEdit(opp)}
                    className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50"
                    title="Editar Oportunidad"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(opp.id, opp.name)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    title="Eliminar Oportunidad"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
        <p className="text-lg font-bold text-green-600 mt-1">${opp.amount.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-2">Cierre: {opp.closeDate}</p>
    </div>
);

// Pipeline Column Props
interface PipelineColumnProps {
    stage: OpportunityStage;
    opportunities: Opportunity[];
    onEdit: (opp: Opportunity) => void;
    onDelete: (id: string, name: string) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ stage, opportunities, onEdit, onDelete }) => (
    <Card title={stage} className="w-80 flex-shrink-0 bg-gray-50 border border-gray-200">
        <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {opportunities.map(opp => (
                <OpportunityCard key={opp.id} opp={opp} onEdit={onEdit} onDelete={onDelete} />
            ))}
            {opportunities.length === 0 && <p className="text-sm text-gray-400 italic">No hay oportunidades en esta etapa.</p>}
        </div>
    </Card>
);

// Task Item Props
interface TaskItemProps {
    task: Task;
    onDraftEmail: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string, title: string) => void;
    onToggleCompletion: (id: string) => void;
}

// Task Item
const TaskItem: React.FC<TaskItemProps> = ({ task, onDraftEmail, onEdit, onDelete, onToggleCompletion }) => (
    <div className={`p-3 rounded-lg shadow-sm flex items-center justify-between transition duration-200 ${task.completed ? 'bg-green-100' : 'bg-yellow-50'}`}>
        <div className="flex items-center flex-1 min-w-0" onClick={() => onToggleCompletion(task.id)}>
            <input
                type="checkbox"
                checked={task.completed}
                readOnly
                className="form-checkbox h-5 w-5 text-indigo-600 rounded cursor-pointer"
            />
            <div className="ml-3 min-w-0">
                <p className={`font-medium truncate ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.title}</p>
                <p className="text-xs text-gray-500">{task.type}: {task.relatedTo} | Vence: {task.dueDate}</p>
            </div>
        </div>
        <div className="flex space-x-1 ml-4 flex-shrink-0">
            <button
                onClick={() => onDraftEmail(task)}
                className="flex items-center text-purple-600 hover:text-purple-900 transition p-1 rounded-full hover:bg-purple-100"
                title="Generar Borrador de Email con IA"
            >
                <Mail className="w-5 h-5 mr-1" />
                <Sparkles className="w-3 h-3" />
            </button>
            <button
                onClick={() => onEdit(task)}
                className="text-indigo-600 hover:text-indigo-900 transition p-1 rounded-full hover:bg-indigo-100"
                title="Editar Tarea"
            >
                <Edit className="w-5 h-5" />
            </button>
            <button
                onClick={() => onDelete(task.id, task.title)}
                className="text-red-600 hover:text-red-900 transition p-1 rounded-full hover:bg-red-100"
                title="Eliminar Tarea"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    </div>
);


// --- 5. GEMINI FEATURE COMPONENTS ---

interface ClientAnalysisModalProps {
    client: Client;
    onClose: () => void;
}

const ClientAnalysisModal: React.FC<ClientAnalysisModalProps> = ({ client, onClose }) => {
    const [analysisText, setAnalysisText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const generateAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisText('');
        
        const systemPrompt = "Eres un analista de CRM experto. Analiza la situación de un cliente y sugiere un resumen de estado y las 3 próximas mejores acciones para el equipo de ventas, incluyendo justificación. Usa el idioma español.";
        
        const userQuery = `Analiza al cliente:
- Nombre: ${client.name}
- Empresa: ${client.company}
- Contacto: ${client.contact}
- Interacciones registradas: ${client.interactions}
- Estado de CRM: ${client.status}

Genera el resumen y las 3 acciones clave.`;

        try {
            const result = await fetchGeminiContent(systemPrompt, userQuery);
            setAnalysisText(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    useEffect(() => {
        generateAnalysis();
    }, [generateAnalysis]);

    return (
        <AIModal title={`✨ Análisis de IA para ${client.name}`} onClose={onClose}>
            {isLoading && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <p className="text-gray-600">Generando análisis y estrategia...</p>
                </div>
            )}
            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">Error: {error}</p>}
            {analysisText && (
                <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: analysisText.replace(/\n/g, '<br/>') }} />
            )}
        </AIModal>
    );
};

interface EmailDraftModalProps {
    task: Task;
    onClose: () => void;
}

const EmailDraftModal: React.FC<EmailDraftModalProps> = ({ task, onClose }) => {
    const { getClientById } = useData();
    const [draftText, setDraftText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<string>('');
    
    // Find client details (can be undefined if task is related to an opportunity instead of a client)
    const client: Client | undefined = task.type === 'Cliente' ? getClientById(task.relatedTo) : undefined;

    const generateDraft = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDraftText('');

        const systemPrompt = "Eres un asistente de ventas profesional. Tu tarea es convertir una nota de tarea en un borrador de correo electrónico formal de seguimiento. Mantenlo conciso, respetuoso y orientado a la acción. Usa el idioma español.";
        
        let userQuery = `Usando el siguiente título de tarea: "${task.title}", genera un borrador de email de seguimiento.`;
        
        if (client) {
            userQuery += `\nEl correo debe estar dirigido a ${client.contact} de ${client.company} (${client.email}).`;
        }

        try {
            const result = await fetchGeminiContent(systemPrompt, userQuery);
            setDraftText(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [task, client]);

    const handleCopyToClipboard = () => {
        try {
            // Use navigator.clipboard.writeText if available, otherwise fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                 navigator.clipboard.writeText(draftText).then(() => {
                    setCopyStatus('¡Borrador copiado al portapapeles!');
                    setTimeout(() => setCopyStatus(''), 3000);
                }).catch(() => {
                    setCopyStatus('Error al copiar. Por favor, selecciona y copia manualmente.');
                    setTimeout(() => setCopyStatus(''), 5000);
                });
            } else {
                // Fallback for iFrames
                document.execCommand('copy');
                setCopyStatus('¡Borrador copiado al portapapeles! (Método de fallback)');
                setTimeout(() => setCopyStatus(''), 3000);
            }
        } catch (e) {
            setCopyStatus('Error al copiar. Por favor, selecciona y copia manualmente.');
            setTimeout(() => setCopyStatus(''), 5000);
        }
    };

    useEffect(() => {
        generateDraft();
    }, [generateDraft]);

    return (
        <AIModal title={`✨ Borrador de Email para Tarea: ${task.title}`} onClose={onClose}>
            {client && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800">
                    **Destinatario Sugerido:** {client.contact} ({client.email})
                </div>
            )}
            
            {isLoading && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                    <p className="text-gray-600">Redactando el borrador del correo...</p>
                </div>
            )}
            {error && <p className="text-red-600 p-4 bg-red-100 rounded-lg">Error: {error}</p>}
            {draftText && (
                <div className="space-y-4">
                    <textarea
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg shadow-inner font-mono text-sm"
                        value={draftText}
                        readOnly
                        // Allow manual copy
                        onCopy={handleCopyToClipboard} 
                        // Set selection range on mount for easier manual copying
                        ref={textarea => textarea?.setSelectionRange(0, draftText.length)}
                    />
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleCopyToClipboard}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition"
                        >
                            Copiar al Portapapeles
                        </button>
                        {copyStatus && (
                            <span className="text-sm text-green-700 font-medium">{copyStatus}</span>
                        )}
                    </div>
                </div>
            )}
        </AIModal>
    );
};


// --- 6. PAGE VIEWS ---

const DashboardView: React.FC = () => {
    const { clients, opportunities, tasks } = useData();

    const activeClients = clients.filter(c => c.status === 'Activo').length;
    const openOpportunities = opportunities.filter(o => o.status === 'Open').length;
    const totalRevenue = opportunities
        .filter(o => o.stage === 'Cerrada Ganada')
        .reduce((sum, o) => sum + o.amount, 0);
    const pendingTasks = tasks.filter(t => !t.completed).length;

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Principal</h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Clientes Activos" value={activeClients} icon={Users} color="indigo" />
                <StatCard title="Oportunidades Abiertas" value={openOpportunities} icon={Zap} color="orange" />
                <StatCard title="Ingresos (Cerrada Ganada)" value={`$${(totalRevenue / 1000).toFixed(1)}k`} icon={BarChart} color="green" />
                <StatCard title="Tareas Pendientes" value={pendingTasks} icon={CalendarCheck} color="red" />
            </div>

            {/* Sales Pipeline Summary (Mock Graph) */}
            <Card title="Resumen de Pipeline de Ventas" className="mb-8">
                <div className="h-48 bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-600">
                    [Placeholder para Gráfico de Tasa de Conversión/Oportunidades por Etapa]
                </div>
            </Card>

            {/* Recent Activity / Pending Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Tareas Pendientes Más Urgentes">
                    <div className="space-y-3">
                        {tasks.filter(t => !t.completed).slice(0, 5).map(task => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                onDraftEmail={() => console.log('Drafting email...')}
                                onEdit={() => console.log('Edit from dashboard not supported')}
                                onDelete={() => console.log('Delete from dashboard not supported')}
                                onToggleCompletion={() => console.log('Toggle from dashboard not supported')}
                            />
                        ))}
                    </div>
                </Card>
                <Card title="Historial de Actividad Reciente (Mock)">
                    <div className="space-y-2 text-sm text-gray-700">
                        <p className="p-2 border-b">Admin creó Cliente 'Innovacion Digital S.A.' - 20/09</p>
                        <p className="p-2 border-b">Vendedor actualizó Oportunidad 'O2' a Negociación - 21/09</p>
                        <p className="p-2 border-b">Admin completó Tarea 'Revisión trimestral' - 25/09</p>
                        <p className="p-2 border-b">Admin cerró Oportunidad 'O3' como ganada - 20/09</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ClientsView: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient } = useData();
    const { isAdmin } = useAuth();
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [analyzingClient, setAnalyzingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const openCreateModal = () => {
        setEditingClient(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setIsFormModalOpen(true);
    };
    
    const openAnalysisModal = (client: Client) => {
        setAnalyzingClient(client);
        setIsAnalysisModalOpen(true);
    };

    const handleSave = (clientData: Client | Omit<Client, 'id' | 'interactions'>) => {
        if ('id' in clientData) {
            updateClient(clientData as Client);
            setMessage(`Cliente ${clientData.name} actualizado con éxito.`);
        } else {
            addClient(clientData as Omit<Client, 'id' | 'interactions'>);
            setMessage(`Cliente ${clientData.name} creado con éxito.`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Está seguro de eliminar el cliente ${name}? Esta acción es irreversible.`)) {
            deleteClient(id);
            setMessage(`Cliente ${name} eliminado con éxito.`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const filteredClients = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return clients.filter(client =>
            client.name.toLowerCase().includes(term) ||
            client.company.toLowerCase().includes(term) ||
            client.contact.toLowerCase().includes(term)
        );
    }, [clients, searchTerm]);


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Gestión de Clientes ({clients.length})</h2>
                {isAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        <Users className="w-5 h-5 mr-2" /> Crear Cliente
                    </button>
                )}
            </div>
            
            {message && (
                <div className="p-3 mb-4 text-sm text-white bg-green-500 rounded-lg shadow-md transition-opacity duration-300">
                    {message}
                </div>
            )}

            <Card title="Lista de Clientes" className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button className="flex items-center text-gray-600 hover:text-indigo-600 transition">
                        <Filter className="w-5 h-5 mr-1" /> Filtrar
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredClients.map(client => (
                        <ClientListItem
                            key={client.id}
                            client={client}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onAnalyze={openAnalysisModal}
                        />
                    ))}
                    {filteredClients.length === 0 && (
                         <div className="text-center py-8 text-gray-500 italic">No se encontraron clientes.</div>
                    )}
                </div>
            </Card>

            {isFormModalOpen && <ClientForm client={editingClient} onClose={() => setIsFormModalOpen(false)} onSave={handleSave} />}
            {isAnalysisModalOpen && analyzingClient && <ClientAnalysisModal client={analyzingClient} onClose={() => setIsAnalysisModalOpen(false)} />}
        </div>
    );
};

const OpportunitiesView: React.FC = () => {
    const { opportunities, clients, addOpportunity, updateOpportunity, deleteOpportunity } = useData();
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
    const [message, setMessage] = useState<string>('');

    const openCreateModal = () => {
        setEditingOpportunity(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (opp: Opportunity) => {
        setEditingOpportunity(opp);
        setIsFormModalOpen(true);
    };
    
    const handleSave = (oppData: Opportunity | Omit<Opportunity, 'id' | 'status'>) => {
        if ('id' in oppData) {
            updateOpportunity(oppData as Opportunity);
            setMessage(`Oportunidad ${oppData.name} actualizada con éxito.`);
        } else {
            addOpportunity(oppData as Omit<Opportunity, 'id' | 'status'>);
            setMessage(`Oportunidad ${oppData.name} creada con éxito.`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Está seguro de eliminar la oportunidad ${name}?`)) {
            deleteOpportunity(id);
            setMessage(`Oportunidad ${name} eliminada con éxito.`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Group opportunities by stage
    const stages: OpportunityStage[] = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cerrada Ganada', 'Cerrada Perdida'];
    const groupedOpportunities = useMemo(() => {
        return stages.reduce((acc, stage) => {
            acc[stage] = opportunities.filter(o => o.stage === stage);
            return acc;
        }, {} as Record<OpportunityStage, Opportunity[]>);
    }, [opportunities]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Pipeline de Oportunidades ({opportunities.length})</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <Zap className="w-5 h-5 mr-2" /> Crear Oportunidad
                </button>
            </div>
            
            {message && (
                <div className="p-3 mb-4 text-sm text-white bg-green-500 rounded-lg shadow-md transition-opacity duration-300">
                    {message}
                </div>
            )}

            <div className="flex space-x-6 overflow-x-auto pb-4">
                {stages.map(stage => (
                    <PipelineColumn 
                        key={stage} 
                        stage={stage} 
                        opportunities={groupedOpportunities[stage] || []}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {isFormModalOpen && (
                <OpportunityForm 
                    opportunity={editingOpportunity} 
                    onClose={() => setIsFormModalOpen(false)} 
                    onSave={handleSave} 
                    clients={clients} 
                />
            )}
        </div>
    );
};

const TasksView: React.FC = () => {
    const { tasks, clients, opportunities, addTask, updateTask, deleteTask, toggleTaskCompletion } = useData();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [draftingTask, setDraftingTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [message, setMessage] = useState<string>('');

    const openDraftModal = (task: Task) => {
        setDraftingTask(task);
        setIsEmailModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsFormModalOpen(true);
    };

    const handleSave = (taskData: Task | Omit<Task, 'id' | 'completed'>) => {
        if ('id' in taskData) {
            updateTask(taskData as Task);
            setMessage(`Tarea ${taskData.title} actualizada con éxito.`);
        } else {
            addTask(taskData as Omit<Task, 'id' | 'completed'>);
            setMessage(`Tarea ${taskData.title} creada con éxito.`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(`¿Está seguro de eliminar la tarea ${title}?`)) {
            deleteTask(id);
            setMessage(`Tarea ${title} eliminada con éxito.`);
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    const handleToggleCompletion = (id: string) => {
        toggleTaskCompletion(id);
        const task = tasks.find(t => t.id === id);
        if (task) {
             setMessage(`Tarea "${task.title}" marcada como ${task.completed ? 'PENDIENTE' : 'COMPLETADA'}.`);
             setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Tareas y Recordatorios ({tasks.length})</h2>
                <button
                    onClick={openCreateModal}
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <CalendarCheck className="w-5 h-5 mr-2" /> Nueva Tarea
                </button>
            </div>
            
            {message && (
                <div className="p-3 mb-4 text-sm text-white bg-green-500 rounded-lg shadow-md transition-opacity duration-300">
                    {message}
                </div>
            )}

            <Card title="Lista de Tareas">
                <div className="space-y-4">
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onDraftEmail={openDraftModal} 
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onToggleCompletion={handleToggleCompletion}
                        />
                    ))}
                </div>
            </Card>

            {isEmailModalOpen && draftingTask && <EmailDraftModal task={draftingTask} onClose={() => setIsEmailModalOpen(false)} />}
            {isFormModalOpen && (
                <TaskForm 
                    task={editingTask} 
                    onClose={() => setIsFormModalOpen(false)} 
                    onSave={handleSave} 
                    clients={clients} 
                    opportunities={opportunities} 
                />
            )}
        </div>
    );
};

// --- 7. AUTHENTICATION AND LAYOUT ---

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!login(username, password)) {
            setError('Credenciales inválidas. Prueba con "admin" o "vendedor" y contraseña "123".');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card title="Acceso al CRM" className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="admin o vendedor"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="123"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                    >
                        Ingresar
                    </button>
                </form>
            </Card>
        </div>
    );
};

interface SidebarProps {
    currentView: string;
    setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
        { name: 'Clientes', icon: Users, view: 'clients' },
        { name: 'Oportunidades', icon: Zap, view: 'opportunities' },
        { name: 'Tareas', icon: CalendarCheck, view: 'tasks' },
    ];

    const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
        <button
            onClick={() => { setView(item.view); setIsMenuOpen(false); }}
            className={`flex items-center w-full p-3 rounded-xl transition duration-150 ${currentView === item.view
                ? 'bg-indigo-700 text-white shadow-md'
                : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
                }`}
        >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.name}</span>
        </button>
    );

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden bg-indigo-800 p-4 flex justify-between items-center sticky top-0 z-40 shadow-xl">
                <h1 className="text-xl font-bold text-white">CRM - {user?.role.toUpperCase()}</h1>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2 rounded-md hover:bg-indigo-700">
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsMenuOpen(false)}></div>
            )}

            {/* Sidebar Desktop/Mobile */}
            <aside className={`fixed inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out bg-indigo-900 text-white w-64 p-6 flex flex-col z-50 md:z-auto`}>
                <h1 className="text-3xl font-extrabold mb-8 text-center text-indigo-300">CRM Suite</h1>
                <p className="text-sm text-indigo-400 mb-6 border-b border-indigo-700 pb-3">Usuario: {user?.username} ({user?.role})</p>

                <nav className="flex-1 space-y-2">
                    {navItems.map(item => <NavLink key={item.view} item={item} />)}
                </nav>

                <div className="pt-6 border-t border-indigo-700">
                    <button
                        onClick={logout}
                        className="flex items-center w-full p-3 mt-4 rounded-xl text-red-300 hover:bg-red-700 hover:text-white transition duration-150"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

interface HeaderProps {
    user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => (
    <header className="hidden md:flex justify-between items-center p-6 bg-white shadow-md sticky top-0 z-20">
        <h1 className="text-2xl font-semibold text-gray-800">Bienvenido, {user.username}</h1>
        <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{user.role.toUpperCase()}</span>
            <button className="text-gray-500 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100" title="Configuración">
                <Settings className="w-6 h-6" />
            </button>
        </div>
    </header>
);

const AppLayout: React.FC = () => {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState<string>('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'clients':
                return <ClientsView />;
            case 'opportunities':
                return <OpportunitiesView />;
            case 'tasks':
                return <TasksView />;
            default:
                return <DashboardView />;
        }
    };

    if (!user) return null; // Should not happen if wrapped correctly

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar currentView={currentView} setView={setCurrentView} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <Header user={user} />
                {renderView()}
                <footer className="p-4 text-center text-sm text-gray-500 border-t mt-8">
                    CRM System | Desarrollado con React & Tailwind CSS
                </footer>
            </main>
        </div>
    );
};


// --- 8. MAIN APPLICATION ---

const App: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="font-sans">
            {user ? <AppLayout /> : <LoginPage />}
        </div>
    );
};

// Wrapper for Context Providers
const CrmApp: React.FC = () => (
    <AuthProvider>
        <DataProvider>
            <App />
        </DataProvider>
    </AuthProvider>
);

export default CrmApp;
