import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  CornerDownLeft,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  Conversation,
  WhatsAppTemplate,
  SendTemplatePayload,
  Message,
} from '../../core/models/Conversation';
import { getWhatsAppTemplates, sendWhatsAppTemplate } from '../../services/conversationsService';
import Loader from '../shared/Loader';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import Input from '../shared/Input';

interface WhatsAppTemplateSelectorModalProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onTemplateSent: (message: Message) => void;
}

type CategoryTab = 'TODAS' | 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'UTILITY', label: 'Utilidad (Servicio)' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'AUTHENTICATION', label: 'Autenticación' },
];

export const WhatsAppTemplateSelectorModal: React.FC<WhatsAppTemplateSelectorModalProps> = ({
  open,
  onClose,
  conversation,
  onTemplateSent,
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('TODAS');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  const [headerVariables, setHeaderVariables] = useState<Record<string, string>>({});
  const [bodyVariables, setBodyVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Cargar plantillas cuando el modal se abre
  useEffect(() => {
    if (!open || !conversation) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSelectedTemplate(null);
    setSearchQuery('');
    setSendError(null);

    getWhatsAppTemplates(conversation.id)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setTemplates(list);
        if (list.length > 0) {
          // Seleccionar la primera plantilla por defecto
          setSelectedTemplate(list[0]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al obtener plantillas de WhatsApp:', err);
        setError(
          err?.response?.data?.message ||
            'No se pudieron cargar las plantillas de WhatsApp. Verifica que la cuenta de WhatsApp Business (WABA) esté configurada.'
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, conversation?.id]);

  // Al cambiar la plantilla seleccionada, detectar variables y pre-llenar con el cliente
  useEffect(() => {
    if (!selectedTemplate) {
      setHeaderVariables({});
      setBodyVariables({});
      setSendError(null);
      return;
    }

    setSendError(null);

    // Detectar variables en BODY
    const bodyComp = selectedTemplate.components.find((c) => c.type === 'BODY');
    const newBodyVars: Record<string, string> = {};
    if (bodyComp?.text) {
      const matches = bodyComp.text.matchAll(/\{\{(\d+)\}\}/g);
      for (const m of matches) {
        const varIndex = m[1];
        // Pre-llenar {{1}} con el nombre del cliente si está disponible
        if (varIndex === '1' && conversation?.clientName) {
          newBodyVars[varIndex] = conversation.clientName;
        } else {
          newBodyVars[varIndex] = '';
        }
      }
    }
    setBodyVariables(newBodyVars);

    // Detectar variables en HEADER
    const headerComp = selectedTemplate.components.find((c) => c.type === 'HEADER' && c.format === 'TEXT');
    const newHeaderVars: Record<string, string> = {};
    if (headerComp?.text) {
      const matches = headerComp.text.matchAll(/\{\{(\d+)\}\}/g);
      for (const m of matches) {
        newHeaderVars[m[1]] = '';
      }
    }
    setHeaderVariables(newHeaderVars);
  }, [selectedTemplate, conversation?.clientName]);

  // Filtrado de plantillas por buscador y categoría
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat = selectedCategory === 'TODAS' || tpl.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.components.some((c) => c.text && c.text.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Componentes de la plantilla activa
  const activeHeader = selectedTemplate?.components.find((c) => c.type === 'HEADER');
  const activeBody = selectedTemplate?.components.find((c) => c.type === 'BODY');
  const activeFooter = selectedTemplate?.components.find((c) => c.type === 'FOOTER');
  const activeButtons = selectedTemplate?.components.find((c) => c.type === 'BUTTONS')?.buttons || [];

  // Reemplazar texto del body con las variables en tiempo real
  const renderedBodyText = useMemo(() => {
    if (!activeBody?.text) return '';
    return activeBody.text.replace(/\{\{(\d+)\}\}/g, (_, num) => {
      const val = bodyVariables[num];
      return val ? val : `{{${num}}}`;
    });
  }, [activeBody, bodyVariables]);

  // Reemplazar texto del header con las variables en tiempo real
  const renderedHeaderText = useMemo(() => {
    if (!activeHeader?.text) return '';
    return activeHeader.text.replace(/\{\{(\d+)\}\}/g, (_, num) => {
      const val = headerVariables[num];
      return val ? val : `{{${num}}}`;
    });
  }, [activeHeader, headerVariables]);

  const bodyVarKeys = Object.keys(bodyVariables).sort((a, b) => Number(a) - Number(b));
  const headerVarKeys = Object.keys(headerVariables).sort((a, b) => Number(a) - Number(b));

  // Validar si falta alguna variable requerida
  const isFormValid = useMemo(() => {
    if (!selectedTemplate) return false;
    for (const key of bodyVarKeys) {
      if (!bodyVariables[key]?.trim()) return false;
    }
    for (const key of headerVarKeys) {
      if (!headerVariables[key]?.trim()) return false;
    }
    return true;
  }, [selectedTemplate, bodyVariables, headerVariables, bodyVarKeys, headerVarKeys]);

  // Enviar plantilla
  const handleSend = async () => {
    if (!selectedTemplate || !conversation || !isFormValid || sending) return;

    try {
      setSending(true);
      setSendError(null);

      const componentsPayload: SendTemplatePayload['components'] = [];

      // Parámetros de Header
      if (headerVarKeys.length > 0) {
        componentsPayload.push({
          type: 'header',
          parameters: headerVarKeys.map((k) => ({
            type: 'text',
            text: headerVariables[k].trim(),
          })),
        });
      }

      // Parámetros de Body
      if (bodyVarKeys.length > 0) {
        componentsPayload.push({
          type: 'body',
          parameters: bodyVarKeys.map((k) => ({
            type: 'text',
            text: bodyVariables[k].trim(),
          })),
        });
      }

      const payload: SendTemplatePayload = {
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.language || 'es',
        components: componentsPayload.length > 0 ? componentsPayload : undefined,
      };

      const newMsg = await sendWhatsAppTemplate(conversation.id, payload);
      onTemplateSent(newMsg);
      onClose();
    } catch (err: any) {
      console.error('Error al enviar plantilla de WhatsApp:', err);
      setSendError(
        err?.response?.data?.message ||
          'No se pudo enviar la plantilla a Meta WhatsApp Cloud API. Revisa los parámetros o la configuración de WABA.'
      );
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-5xl"
      height="h-[92vh] max-h-[850px]"
      padding="p-0 overflow-hidden"
      hideCloseButton
    >
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-800 text-lg">Plantillas Oficiales de WhatsApp</h3>
                <Badge variant="success" size="sm">
                  Meta Verified
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Selecciona una plantilla pre-aprobada para contactar a{' '}
                <span className="font-bold text-gray-700">{conversation?.clientName || 'este cliente'}</span>{' '}
                incluso fuera de la ventana de 24 horas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-150 rounded-full transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - 2 Columns */}
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center p-12">
            <Loader />
            <p className="text-sm font-semibold text-gray-500 mt-4 animate-pulse">
              Consultando catálogo de plantillas de WhatsApp Cloud API...
            </p>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="font-bold text-gray-800 text-base mb-1">No se pudieron cargar las plantillas</h4>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <Button
              variant="success"
              onClick={() => {
                if (conversation) {
                  setLoading(true);
                  setError(null);
                  getWhatsAppTemplates(conversation.id)
                    .then((data) => setTemplates(Array.isArray(data) ? data : []))
                    .catch((e) => setError(e?.response?.data?.message || 'Error al conectar con WhatsApp API'))
                    .finally(() => setLoading(false));
                }
              }}
              className="!py-2 !px-4 !rounded-xl !text-xs"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: List & Filters */}
            <div className="w-full md:w-5/12 border-r border-gray-150 flex flex-col bg-white overflow-hidden">
              {/* Filter Tabs */}
              <div className="p-3 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar bg-slate-50/40">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <Search size={16} className="text-gray-400 absolute left-3" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o contenido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-9 pr-3 text-xs bg-transparent border-0 outline-none text-gray-700 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              {/* Templates List */}
              <div className="flex-grow overflow-y-auto divide-y divide-gray-100 no-scrollbar">
                {filteredTemplates.length === 0 ? (
                  <EmptyState
                    title="No se encontraron plantillas"
                    message="Prueba con otro término de búsqueda o categoría."
                    icon={<FileText size={32} className="text-slate-400" />}
                    className="py-10"
                  />
                ) : (
                  filteredTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id || selectedTemplate?.name === tpl.name;
                    const bodySnippet = tpl.components.find((c) => c.type === 'BODY')?.text || '';

                    return (
                      <div
                        key={tpl.id || tpl.name}
                        onClick={() => setSelectedTemplate(tpl)}
                        className={`p-3.5 cursor-pointer transition-all hover:bg-emerald-50/40 border-l-4 ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-600 pl-3'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-gray-800 text-xs truncate max-w-[200px]" title={tpl.name}>
                            {tpl.name}
                          </span>
                          <Badge
                            variant={
                              tpl.category === 'MARKETING'
                                ? 'purple'
                                : tpl.category === 'UTILITY'
                                ? 'indigo'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {tpl.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {bodySnippet || 'Plantilla interactiva'}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-semibold">
                          <Badge variant="success" size="sm">
                            <CheckCircle2 size={11} className="mr-0.5" /> Aprobada por Meta
                          </Badge>
                          <span className="uppercase font-mono">{tpl.language}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Customization & Live WhatsApp Preview */}
            <div className="w-full md:w-7/12 flex flex-col bg-slate-50/50 overflow-hidden">
              {selectedTemplate ? (
                <div className="flex-grow flex flex-col overflow-hidden">
                  <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-5">
                    {/* Send Error Alert */}
                    {sendError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2 animate-fade-in">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                        <div>
                          <p className="font-bold">Error al enviar plantilla</p>
                          <p className="text-[11px] mt-0.5">{sendError}</p>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Live Simulator Bubble */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-emerald-600" /> Previsualización en Vivo (WhatsApp)
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          Plantilla: <strong className="text-gray-700">{selectedTemplate.name}</strong>
                        </span>
                      </div>

                      {/* Simulator Container styled with WhatsApp look */}
                      <div
                        className="rounded-2xl p-4 sm:p-5 border border-emerald-950/10 shadow-inner flex flex-col items-start"
                        style={{
                          backgroundColor: '#efeae2',
                          backgroundImage:
                            'radial-gradient(#0000000a 1px, transparent 1px), radial-gradient(#0000000a 1px, #efeae2 1px)',
                          backgroundSize: '20px 20px',
                        }}
                      >
                        <div className="bg-white rounded-2xl rounded-tl-xs shadow-md p-3.5 sm:p-4 max-w-sm sm:max-w-md w-full border border-gray-150/70 text-gray-800 space-y-2.5">
                          {/* Header Preview */}
                          {activeHeader && (
                            <div className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                              {activeHeader.format === 'IMAGE' ? (
                                <div className="h-32 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col items-center justify-center text-emerald-700 gap-1 text-xs">
                                  <ImageIcon size={28} />
                                  <span className="font-medium">Imagen de cabecera multimedia</span>
                                </div>
                              ) : activeHeader.format === 'DOCUMENT' ? (
                                <div className="h-20 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center text-blue-700 gap-2 text-xs">
                                  <FileText size={24} />
                                  <span className="font-medium">Documento adjunto (PDF)</span>
                                </div>
                              ) : (
                                <span>{renderedHeaderText}</span>
                              )}
                            </div>
                          )}

                          {/* Body Preview */}
                          <div className="text-xs leading-relaxed font-normal whitespace-pre-wrap text-gray-800">
                            {renderedBodyText}
                          </div>

                          {/* Footer Preview */}
                          {activeFooter?.text && (
                            <div className="text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100/60">
                              {activeFooter.text}
                            </div>
                          )}

                          {/* Buttons Preview */}
                          {activeButtons.length > 0 && (
                            <div className="pt-2 border-t border-gray-150 space-y-1.5">
                              {activeButtons.map((btn, idx) => (
                                <div
                                  key={idx}
                                  className="w-full py-2 px-3 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200/60 select-none"
                                >
                                  {btn.type === 'URL' ? (
                                    <ExternalLink size={13} />
                                  ) : btn.type === 'PHONE_NUMBER' ? (
                                    <Phone size={13} />
                                  ) : (
                                    <CornerDownLeft size={13} />
                                  )}
                                  <span>{btn.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Bubble timestamp & tick mock */}
                          <div className="text-right text-[10px] text-gray-400 font-medium pt-0.5">
                            <span>Ahora</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Variables Form */}
                    {(bodyVarKeys.length > 0 || headerVarKeys.length > 0) && (
                      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                          <Info size={16} className="text-blue-600" />
                          <h4 className="font-bold text-gray-800 text-xs">
                            Parámetros y Variables de la Plantilla
                          </h4>
                        </div>

                        {/* Header Variables */}
                        {headerVarKeys.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                              Variables del Encabezado:
                            </span>
                            {headerVarKeys.map((key) => (
                              <div key={`header-${key}`} className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-700">
                                  Variable <code className="bg-gray-100 text-gray-800 px-1 rounded">{`{{${key}}}`}</code>
                                </label>
                                <Input
                                  type="text"
                                  placeholder={`Valor para {{${key}}}...`}
                                  value={headerVariables[key] || ''}
                                  onChange={(e) =>
                                    setHeaderVariables((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  className="!py-2 !px-3 !rounded-xl !text-xs !bg-gray-50 focus:!bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Body Variables */}
                        {bodyVarKeys.length > 0 && (
                          <div className="space-y-3">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                              Variables del Cuerpo (Mensaje):
                            </span>
                            {bodyVarKeys.map((key) => (
                              <div key={`body-${key}`} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="text-xs font-semibold text-gray-700">
                                    Variable <code className="bg-gray-100 text-emerald-800 px-1 rounded font-bold">{`{{${key}}}`}</code>
                                    {key === '1' && conversation?.clientName && (
                                      <span className="text-[10px] text-gray-400 font-normal ml-2">
                                        (Sugerido: Nombre del cliente)
                                      </span>
                                    )}
                                  </label>
                                </div>
                                <Input
                                  type="text"
                                  placeholder={`Ingresa el texto para {{${key}}}...`}
                                  value={bodyVariables[key] || ''}
                                  onChange={(e) =>
                                    setBodyVariables((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  className="!py-2 !px-3 !rounded-xl !text-xs !bg-gray-50 focus:!bg-white"
                                  error={!bodyVariables[key]?.trim() ? 'Campo requerido' : undefined}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer / Action Bar */}
                  <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3 shrink-0">
                    <Button
                      variant="secondary"
                      onClick={onClose}
                      disabled={sending}
                      className="!py-2.5 !px-5 !rounded-xl !text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleSend}
                      disabled={!isFormValid || sending}
                      loading={sending}
                      className="!py-2.5 !px-5 !rounded-xl !text-xs gap-2"
                    >
                      <Send size={15} />
                      <span>Enviar Plantilla al Cliente</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Ninguna plantilla seleccionada"
                  message="Selecciona una plantilla del panel izquierdo para previsualizarla y configurar sus variables."
                  icon={<Smartphone size={36} className="text-slate-400" />}
                  className="flex-grow justify-center"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WhatsAppTemplateSelectorModal;
