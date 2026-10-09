import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sliders } from 'lucide-react';

// Componentes Compartidos
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Notification from '../../../components/shared/Notification';
import Loader from '../../../components/shared/Loader';

// Subcomponentes Modulares del Asistente
import { OpportunityLabelsStepper } from './components/OpportunityLabelsStepper';
import { OpportunityFieldsSelector } from './components/OpportunityFieldsSelector';
import { OpportunityLabelEditForm } from './components/OpportunityLabelEditForm';
import { OpportunityFormMockup } from './components/OpportunityFormMockup';

// Esquemas y Tipos
import type { OpportunityLabel, NotificationState } from './schemas/opportunityLabels.schema';

// Servicios API
import {
  getOpportunityLabels,
  updateOpportunityLabel,
} from '../../../services/opportunityLabelsService';

interface OpportunityLabelsPageProps {
  onLabelsUpdated?: () => void;
}

export const OpportunityLabelsPage: React.FC<OpportunityLabelsPageProps> = ({
  onLabelsUpdated,
}) => {
  const [labels, setLabels] = useState<OpportunityLabel[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<OpportunityLabel | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: notif.onConfirm || hideNotification,
    });
  };

  // Guard ref para evitar peticiones duplicadas simultáneas
  const isFetchingRef = useRef<boolean>(false);

  // Cargar etiquetas desde el backend
  const fetchLabels = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const data = await getOpportunityLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar etiquetas de oportunidad:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener las etiquetas de oportunidad desde el servidor.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Selección de campo
  const handleSelectField = (label: OpportunityLabel) => {
    setSelectedLabel(label);
    setNewName(label.strname || '');
    setStep(2);
  };

  // Selección directa desde el mockup interactivo
  const handleFieldClick = (fieldKey: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento') => {
    const targetLabel = labels.find((l) => l.field_key === fieldKey);
    if (targetLabel) {
      handleSelectField(targetLabel);
    }
  };

  // Guardar y sincronizar cambios
  const handleSave = async (cleanName: string) => {
    if (!selectedLabel) return;

    setSaving(true);
    try {
      await updateOpportunityLabel(selectedLabel.id, cleanName);

      setStep(1);
      setSelectedLabel(null);

      notify({
        type: 'success',
        title: '¡Éxito!',
        message: 'Etiqueta modificada y sincronizada correctamente en base de datos.',
      });

      // Recargar etiquetas y propagar evento a la vista principal
      await fetchLabels();
      if (onLabelsUpdated) {
        onLabelsUpdated();
      }
    } catch (err: any) {
      console.error('Error al actualizar etiqueta de oportunidad:', err);
      const errorMsg =
        err.response?.data?.message ||
        'No se pudo actualizar la etiqueta de oportunidad seleccionada.';
      notify({
        type: 'error',
        title: 'Error',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContainer
      title="Etiquetas de Oportunidad"
      description="Sigue los pasos del asistente para modificar de forma segura las etiquetas del formulario y su tracking histórico."
      icon={<Sliders size={18} />}
    >
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />

      {/* Indicador Visual de Pasos */}
      <OpportunityLabelsStepper step={step} />

      {loading && labels.length === 0 ? (
        <div className="py-20">
          <Loader />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto mt-12 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUMNA IZQUIERDA: Selector (Paso 1) o Formulario (Paso 2) */}
            <div className="lg:col-span-7 space-y-6">
              {step === 1 && (
                <OpportunityFieldsSelector
                  labels={labels}
                  onSelectField={handleSelectField}
                />
              )}

              {step === 2 && selectedLabel && (
                <OpportunityLabelEditForm
                  selectedLabel={selectedLabel}
                  allLabels={labels}
                  onBack={() => {
                    setStep(1);
                    setSelectedLabel(null);
                  }}
                  onSave={handleSave}
                  loading={saving}
                  onNameChange={setNewName}
                />
              )}
            </div>

            {/* COLUMNA DERECHA: Vista previa / Mockup interactivo en vivo */}
            <div className="lg:col-span-5">
              <OpportunityFormMockup
                labels={labels}
                selectedLabel={selectedLabel}
                step={step}
                newName={newName}
                onFieldClick={handleFieldClick}
              />
            </div>
          </div>
        </div>
      )}
    </SettingsContainer>
  );
};

export default OpportunityLabelsPage;
