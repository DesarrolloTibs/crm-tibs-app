import { useState, useEffect, useMemo, useRef } from 'react';
import { getClients, createClient, updateClient, updateClientStatus } from '../services/clientsService';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import { type Client } from '../core/models/Client';
import type { Company } from '../core/models/Company';
import { useConfigStore } from '../store/useConfigStore';

type NotifType = 'success' | 'error' | 'warning' | 'confirmation';
interface Notif { show: boolean; type: NotifType; title: string; message: string; onConfirm: () => void; onCancel: () => void; }
const NOTIF_OFF: Notif = { show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {} };
const PAGE_SIZE = 10;

export function useClients() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const [viewSubModule, setViewSubModule] = useState<'contacts' | 'companies'>('contacts');
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterCorreo, setFilterCorreo] = useState('');
  const [filterEjecutivoId, setFilterEjecutivoId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => { setCurrentPage(1); }, [filterNombre, filterEmpresa, filterCorreo, filterEjecutivoId, filterCategory, viewSubModule]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cd, cod] = await Promise.all([getClients(), getCompanies()]);
      setClients(cd); setCompanies(cod);
    } catch { showError('No se pudieron cargar los datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAllData();
    getActiveUsers().then(users => setExecutives(users.filter(u => u.id).map(u => ({ value: u.id!, label: u.username })))).catch(console.error);
  }, [schemaName]);

  const handleCreateClient = async (client: Client) => {
    setLoading(true);
    try { const { ejecutivo, company, ...d } = client as any; await createClient(d); setClientModalOpen(false); showSuccess('Contacto creado correctamente'); loadAllData(); }
    catch { showError('No se pudo crear el contacto'); }
    finally { setLoading(false); }
  };

  const handleUpdateClient = async (client: Client) => {
    if (!client.id) return;
    setLoading(true);
    try { const { id, ejecutivo, company, ...d } = client as any; await updateClient(id, d); setEditingClient(null); setClientModalOpen(false); showSuccess('Contacto actualizado correctamente'); loadAllData(); }
    catch { showError('No se pudo actualizar el contacto'); }
    finally { setLoading(false); }
  };

  const handleUpdateClientStatus = async (client: Client) => {
    if (!client.id) return;
    const isActivating = !client.estatus;
    setNotification({ show: true, type: 'confirmation', title: `¿${isActivating?'Reactivar':'Desactivar'} este contacto?`, message: isActivating?'El contacto volverá a estar activo.':'El contacto se marcará como inactivo.',
      onConfirm: async () => { hideNotification(); try { await updateClientStatus(client.id!, isActivating); showSuccess(`Contacto ${isActivating?'reactivado':'desactivado'} correctamente.`); loadAllData(); } catch { showError(`No se pudo ${isActivating?'reactivar':'desactivar'} el contacto.`); } },
      onCancel: hideNotification });
  };

  const handleCreateCompany = async (company: Company) => {
    setLoading(true);
    try { const { ejecutivo, contacts, ...d } = company as any; await createCompany(d); setCompanyModalOpen(false); showSuccess('Empresa creada correctamente'); loadAllData(); }
    catch { showError('No se pudo crear la empresa'); }
    finally { setLoading(false); }
  };

  const handleUpdateCompany = async (company: Company) => {
    if (!company.id) return;
    setLoading(true);
    try { const { id, ejecutivo, contacts, ...d } = company as any; await updateCompany(id, d); setEditingCompany(null); setCompanyModalOpen(false); showSuccess('Empresa actualizada correctamente'); loadAllData(); }
    catch { showError('No se pudo actualizar la empresa'); }
    finally { setLoading(false); }
  };

  const handleUpdateCompanyStatus = async (company: Company) => {
    if (!company.id) return;
    const isActivating = !company.estatus;
    setNotification({ show: true, type: 'confirmation', title: `¿${isActivating?'Reactivar':'Desactivar'} esta empresa?`, message: isActivating?'La empresa volverá a estar activa.':'La empresa se marcará como inactiva.',
      onConfirm: async () => { hideNotification(); try { await updateCompanyStatus(company.id!, isActivating); showSuccess(`Empresa ${isActivating?'reactivada':'desactivada'} correctamente.`); loadAllData(); } catch { showError(`No se pudo ${isActivating?'reactivar':'desactivar'} la empresa.`); } },
      onCancel: hideNotification });
  };

  const openCreateModal = () => { if (viewSubModule === 'contacts') { setEditingClient(null); setClientModalOpen(true); } else { setEditingCompany(null); setCompanyModalOpen(true); } };
  const openEditClientModal = (c: Client) => { setEditingClient(c); setClientModalOpen(true); };
  const openEditCompanyModal = (c: Company) => { setEditingCompany(c); setCompanyModalOpen(true); };

  const filteredClients = useMemo(() => clients.filter(c => (c.nombre+' '+c.apellido).toLowerCase().includes(filterNombre.toLowerCase()) && (c.company?.nombre||c.empresa||'').toLowerCase().includes(filterEmpresa.toLowerCase()) && (c.correo||'').toLowerCase().includes(filterCorreo.toLowerCase()) && (!filterEjecutivoId||c.ejecutivo_id===filterEjecutivoId) && (!filterCategory||c.category===filterCategory)), [clients, filterNombre, filterEmpresa, filterCorreo, filterEjecutivoId, filterCategory]);
  const filteredCompanies = useMemo(() => companies.filter(c => c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) && (c.correo||'').toLowerCase().includes(filterCorreo.toLowerCase()) && (!filterEjecutivoId||c.ejecutivo_id===filterEjecutivoId)), [companies, filterNombre, filterCorreo, filterEjecutivoId]);

  const activeListLength = viewSubModule === 'contacts' ? filteredClients.length : filteredCompanies.length;
  const totalPages = Math.ceil(activeListLength / PAGE_SIZE);
  const paginatedClients = useMemo(() => filteredClients.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), [filteredClients, currentPage]);
  const paginatedCompanies = useMemo(() => filteredCompanies.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), [filteredCompanies, currentPage]);

  const handleClearFilters = () => { setFilterNombre(''); setFilterEmpresa(''); setFilterCorreo(''); setFilterEjecutivoId(null); setFilterCategory(null); };

  return {
    viewSubModule, setViewSubModule, clients, companies, editingClient, editingCompany,
    clientModalOpen, setClientModalOpen, companyModalOpen, setCompanyModalOpen,
    showFilters, setShowFilters, filterNombre, setFilterNombre, filterEmpresa, setFilterEmpresa,
    filterCorreo, setFilterCorreo, filterEjecutivoId, setFilterEjecutivoId,
    filterCategory, setFilterCategory, executives, currentPage, setCurrentPage,
    loading, notification, searchDropdownRef,
    filteredClients, filteredCompanies, paginatedClients, paginatedCompanies, totalPages,
    handleCreateClient, handleUpdateClient, handleUpdateClientStatus,
    handleCreateCompany, handleUpdateCompany, handleUpdateCompanyStatus,
    openCreateModal, openEditClientModal, openEditCompanyModal, handleClearFilters,
  };
}
