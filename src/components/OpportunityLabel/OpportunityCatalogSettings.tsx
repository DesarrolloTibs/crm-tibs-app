import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCatalogOptions,
  createCatalogOption,
  updateCatalogOption,
  deleteCatalogOption,
} from '../../services/opportunityCatalogsService';
import type { OpportunityCatalogOption } from '../../core/models/OpportunityCatalog';
import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';
import { Pencil, Plus, Trash2, Sliders, Search } from 'lucide-react';
import Notification from '../Modal/Notification';
import Input from '../shared/Input';
import Button from '../shared/Button';

interface Props {
  catalogType: 'business-lines' | 'delivery-types' | 'licensings';
  catalogTitle: string;
}

const PAGE_SIZE = 10;

const OpportunityCatalogSettings: React.FC<Props> = ({ catalogType, catalogTitle }) => {
  const [options, setOptions] = useState<OpportunityCatalogOption[]>([]);
  const [editing, setEditing] = useState<OpportunityCatalogOption | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [optionName, setOptionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOppList, setSelectedOppList] = useState<{ id: string; nombre_proyecto: string }[] | null>(null);

  const [filterName, setFilterName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const data = await getCatalogOptions(catalogType);
      setOptions(data);
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: `No se pudieron cargar las opciones del catálogo "${catalogTitle}"`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [catalogType]);

  const openCreateModal = () => {
    setEditing(null);
    setOptionName('');
    setModalOpen(true);
  };

  const openEditModal = (option: OpportunityCatalogOption) => {
    setEditing(option);
    setOptionName(option.strname);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim()) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Validación',
        message: 'El nombre de la opción no puede estar vacío',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateCatalogOption(catalogType, editing.id, optionName.trim());
        setNotification({
          show: true,
          type: 'success',
          title: '¡Éxito!',
          message: 'Opción actualizada correctamente',
          onConfirm: hideNotification,
          onCancel: hideNotification,
        });
      } else {
        await createCatalogOption(catalogType, optionName.trim());
        setNotification({
          show: true,
          type: 'success',
          title: '¡Éxito!',
          message: 'Opción creada correctamente',
          onConfirm: hideNotification,
          onCancel: hideNotification,
        });
      }
      setModalOpen(false);
      fetchOptions();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar la opción';
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (option: OpportunityCatalogOption) => {
    setLoading(true);
    try {
      await updateCatalogOption(catalogType, option.id, undefined, !option.blnstatus);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: `Opción ${!option.blnstatus ? 'activada' : 'desactivada'} correctamente`,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchOptions();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cambiar el estado';
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (option: OpportunityCatalogOption) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Seguro que deseas eliminar esta opción?',
      message: `La opción "${option.strname}" se eliminará físicamente del catálogo. Si está en uso por alguna oportunidad, el sistema te lo impedirá y podrás optar por desactivarla.`,
      onConfirm: async () => {
        hideNotification();
        setLoading(true);
        try {
          await deleteCatalogOption(catalogType, option.id);
          setNotification({
            show: true,
            type: 'success',
            title: '¡Éxito!',
            message: 'Opción eliminada del catálogo correctamente',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          fetchOptions();
        } catch (error: any) {
          const msg = error.response?.data?.message || 'Error al eliminar la opción';
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: Array.isArray(msg) ? msg.join(', ') : msg,
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: hideNotification,
    });
  };

  // Filtrado
  const filteredOptions = options.filter(opt =>
    opt.strname.toLowerCase().includes(filterName.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredOptions.length / PAGE_SIZE);
  const paginatedOptions = filteredOptions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterName]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4 text-left">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sliders size={20} className="text-indigo-600" />
            Catálogo: {catalogTitle}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra las opciones disponibles en el formulario de oportunidades para {catalogTitle}.
          </p>
        </div>
        <Button
          type="button"
          variant="success"
          onClick={openCreateModal}
          className="!py-2 !px-3.5 !text-[11px]"
        >
          <Plus size={14} className="mr-1.5" />
          Nueva Opción
        </Button>
      </div>

      <div className="mb-6 flex gap-4 text-left">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder={`Buscar ${catalogTitle.toLowerCase()}...`}
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            inputPrefix={<Search size={16} />}
          />
        </div>
      </div>

      {loading && options.length === 0 ? (
        <Loader />
      ) : (
        <div className="border border-slate-150 rounded-xl overflow-x-auto bg-white shadow-sm max-w-4xl text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Nombre de Opción</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedOptions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500 text-xs">
                    No se encontraron opciones registradas.
                  </td>
                </tr>
              ) : (
                paginatedOptions.map(option => (
                  <tr key={option.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col gap-1.5 text-left">
                        <span className="font-semibold text-slate-800">{option.strname}</span>
                        {option.opportunities && option.opportunities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedOppList(option.opportunities || [])}
                            className="inline-flex items-center gap-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline w-fit cursor-pointer text-left focus:outline-none"
                          >
                            <span>Ver Oportunidades ({option.opportunities.length})</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(option)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            option.blnstatus ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                          title={option.blnstatus ? 'Desactivar opción' : 'Activar opción'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              option.blnstatus ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold select-none ${option.blnstatus ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {option.blnstatus ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(option)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-indigo-50 border border-slate-250 hover:border-indigo-350 text-indigo-600 font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-all text-xs cursor-pointer"
                          title="Editar nombre"
                        >
                          <Pencil size={11} />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <div className="relative group inline-block">
                          <button
                            type="button"
                            onClick={() => handleDelete(option)}
                            disabled={option.isUsed}
                            className={`inline-flex items-center gap-1 font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-all text-xs border ${
                              option.isUsed
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                : 'bg-white hover:bg-red-50 border-slate-250 hover:border-red-350 text-red-600 cursor-pointer'
                            }`}
                            title={option.isUsed ? undefined : "Eliminar opción"}
                          >
                            <Trash2 size={11} />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                          {option.isUsed && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] p-2.5 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-center font-semibold leading-normal z-30 select-none">
                              No se puede eliminar porque está en uso. Desactívala.
                              <div className="absolute top-full right-3 border-4 border-transparent border-t-slate-900/95" />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-150">
              <span className="text-xs text-slate-500 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="!py-1.5 !px-3 !text-[10px] !rounded-md"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="!py-1.5 !px-3 !text-[10px] !rounded-md"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear/Editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-md" height="h-auto">
        <form onSubmit={handleSave} className="space-y-5 p-2 text-left">
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-150 pb-2.5 flex items-center gap-2">
              <Pencil size={18} className="text-indigo-600" />
              {editing ? 'Editar Opción' : 'Nueva Opción de Catálogo'}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              {editing ? 'Modifica el nombre de la opción seleccionada.' : `Agrega una nueva opción para el catálogo de ${catalogTitle}.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <Input
              label="Nombre de la Opción"
              type="text"
              value={optionName}
              onChange={e => setOptionName(e.target.value)}
              placeholder={`Escribe el nombre (ej. ${catalogTitle})...`}
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              variant="indigo"
            >
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver oportunidades en uso */}
      <Modal open={selectedOppList !== null} onClose={() => setSelectedOppList(null)} maxWidth="max-w-md" height="h-auto">
        <div className="p-2 text-left space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-150 pb-2.5 flex items-center gap-2">
              <Search size={18} className="text-indigo-600" />
              Oportunidades Relacionadas
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Las siguientes oportunidades tienen asignada esta opción del catálogo. Haz clic en cualquiera de ellas para abrirla en el Pipeline.
            </p>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100 bg-white">
            {selectedOppList?.map(opp => (
              <Link
                key={opp.id}
                to={`/pipeline?opportunityId=${opp.id}`}
                onClick={() => setSelectedOppList(null)}
                className="flex items-center justify-between p-3 hover:bg-slate-50 text-xs sm:text-sm text-indigo-600 font-semibold transition-colors hover:underline"
              >
                <span>{opp.nombre_proyecto}</span>
                <span className="text-[10px] text-gray-400 font-normal">Abrir →</span>
              </Link>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedOppList(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OpportunityCatalogSettings;
