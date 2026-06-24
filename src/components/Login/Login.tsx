import React, { useState, useEffect } from 'react';
import { login } from '../../services/authService';
import { createTicket } from '../../services/ticketsService';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import LoginBackground from './LoginBackground';
import './Login.css';

const incidenceTypeOptions = [
    { value: 'Soporte Técnico', label: 'Soporte Técnico' },
    { value: 'Facturación', label: 'Facturación' },
    { value: 'Garantía', label: 'Garantía' },
    { value: 'Dudas', label: 'Dudas' },
    { value: 'Otro', label: 'Otro' }
];

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Support Form States
    const [showSupportForm, setShowSupportForm] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [ticketTitle, setTicketTitle] = useState('');
    const [incidenceType, setIncidenceType] = useState('Soporte Técnico');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketPriority, setTicketPriority] = useState(0);
    const [ticketSuccessNumber, setTicketSuccessNumber] = useState<string | null>(null);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const checkCapsLock = (e: React.KeyboardEvent) => {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            if (rememberMe) {
                localStorage.setItem('savedEmail', email);
            } else {
                localStorage.removeItem('savedEmail');
            }
            navigate('/pipeline');
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                const msg = err.response.data.message;
                setError(msg === 'Unauthorized' ? 'Correo o contraseña incorrectos' : msg);
            } else {
                setError(err.message || 'Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactName.trim() || !contactEmail.trim() || !ticketTitle.trim() || !ticketDescription.trim()) {
            setSupportError('Por favor, completa los campos requeridos (*).');
            return;
        }

        setSupportLoading(true);
        setSupportError('');
        try {
            const ticket = await createTicket({
                strtitle: ticketTitle.trim(),
                tipo_incidencia: incidenceType,
                description: ticketDescription.trim(),
                priority: ticketPriority,
                contactName: contactName.trim(),
                contactEmail: contactEmail.trim().toLowerCase(),
                contactPhone: contactPhone.trim() || undefined,
                companyName: companyName.trim() || undefined,
            });

            // Convert ticket number to 5 digit format e.g. 00003
            const numStr = ticket.ticket_number.toString().padStart(5, '0');
            setTicketSuccessNumber(numStr);
        } catch (err: any) {
            setSupportError(err.response?.data?.message || err.message || 'Error al registrar el ticket');
        } finally {
            setSupportLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full lg:overflow-hidden overflow-y-auto bg-white">

            {/* Sección Izquierda: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white z-10 relative">
                <div className="w-full max-w-[420px] py-4 animate-in fade-in slide-in-from-left-8 duration-700">

                    {ticketSuccessNumber ? (
                        /* Vista de Éxito en Ticket */
                        <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                ¡Ticket Registrado!
                            </h2>
                            <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                                Tu solicitud ha sido registrada correctamente. El número de seguimiento asignado es:
                            </p>
                            
                            <div className="my-6 inline-block bg-indigo-50 border border-indigo-100 px-6 py-3.5 rounded-2xl">
                                <span className="text-indigo-600 font-black text-3xl tracking-wider">
                                    #{ticketSuccessNumber}
                                </span>
                            </div>

                            <p className="text-slate-400 text-[10px] max-w-xs mx-auto mb-8 leading-relaxed">
                                Un agente responsable comenzará a atender tu solicitud a la brevedad. Conserva este número para futuras aclaraciones.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setTicketSuccessNumber(null);
                                    setShowSupportForm(false);
                                    setContactName('');
                                    setContactEmail('');
                                    setContactPhone('');
                                    setCompanyName('');
                                    setTicketTitle('');
                                    setTicketDescription('');
                                    setTicketPriority(0);
                                }}
                                className="login-btn-premium py-4 w-full cursor-pointer"
                            >
                                VOLVER AL INICIO
                            </button>
                        </div>
                    ) : showSupportForm ? (
                        /* Formulario Público de Soporte */
                        <div className="animate-in fade-in duration-500">
                            <div className="mb-6 text-left">
                                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                    <svg className="text-white w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Mesa de Soporte
                                </h1>
                                <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.22em] mt-1">
                                    Registro de Incidencias
                                </p>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="space-y-4 lg:max-h-[65vh] lg:overflow-y-auto pr-1">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Juan Pérez"
                                        value={contactName}
                                        onChange={e => setContactName(e.target.value)}
                                        className="login-input-premium pl-4"
                                        style={{ background: '#fff', borderColor: '#e2e8f0' }}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Correo Electrónico *</label>
                                        <input
                                            type="email"
                                            placeholder="correo@empresa.com"
                                            value={contactEmail}
                                            onChange={e => setContactEmail(e.target.value)}
                                            className="login-input-premium pl-4"
                                            style={{ background: '#fff', borderColor: '#e2e8f0' }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Teléfono</label>
                                        <input
                                            type="tel"
                                            placeholder="5512345678"
                                            value={contactPhone}
                                            onChange={e => setContactPhone(e.target.value)}
                                            className="login-input-premium pl-4"
                                            style={{ background: '#fff', borderColor: '#e2e8f0' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Empresa</label>
                                    <input
                                        type="text"
                                        placeholder="Empresa S.A."
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="login-input-premium pl-4"
                                        style={{ background: '#fff', borderColor: '#e2e8f0' }}
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Título de Incidencia *</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Falla de carga de catálogo"
                                        value={ticketTitle}
                                        onChange={e => setTicketTitle(e.target.value)}
                                        className="login-input-premium pl-4"
                                        style={{ background: '#fff', borderColor: '#e2e8f0' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Tipo de Incidencia *</label>
                                    <Select
                                        options={incidenceTypeOptions}
                                        value={incidenceTypeOptions.find(opt => opt.value === incidenceType)}
                                        onChange={(val) => setIncidenceType(val ? val.value : 'Soporte Técnico')}
                                        placeholder="Seleccione el tipo de incidencia..."
                                        isSearchable={false}
                                        className="w-full text-sm font-medium text-slate-900"
                                        styles={{
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                borderRadius: '1rem',
                                                borderColor: state.isFocused ? '#4f46e5' : '#e2e8f0',
                                                boxShadow: state.isFocused ? '0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -4px rgba(79, 70, 229, 0.1)' : 'none',
                                                minHeight: '54px',
                                                backgroundColor: '#fff',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1'
                                                }
                                            }),
                                            valueContainer: (baseStyles) => ({
                                                ...baseStyles,
                                                paddingLeft: '1rem',
                                            }),
                                            singleValue: (baseStyles) => ({
                                                ...baseStyles,
                                                color: '#0f172a',
                                                fontWeight: '500',
                                            }),
                                            menu: (baseStyles) => ({
                                                ...baseStyles,
                                                borderRadius: '1rem',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                                border: '1px solid #f1f5f9',
                                                overflow: 'hidden',
                                                marginTop: '6px',
                                                backgroundColor: '#ffffff',
                                                zIndex: 50,
                                            }),
                                            menuList: (baseStyles) => ({
                                                ...baseStyles,
                                                padding: '6px',
                                                backgroundColor: '#ffffff'
                                            }),
                                            option: (baseStyles, state) => ({
                                                ...baseStyles,
                                                borderRadius: '0.75rem',
                                                backgroundColor: state.isSelected 
                                                    ? '#4f46e5' 
                                                    : state.isFocused 
                                                    ? '#eff6ff' 
                                                    : 'transparent',
                                                color: state.isSelected ? '#ffffff' : '#334155',
                                                fontWeight: '600',
                                                fontSize: '12px',
                                                padding: '10px 14px',
                                                margin: '2px 0',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:active': {
                                                    backgroundColor: '#4f46e5'
                                                }
                                            }),
                                            indicatorSeparator: () => ({
                                                display: 'none'
                                            }),
                                            dropdownIndicator: (baseStyles, state) => ({
                                                ...baseStyles,
                                                color: state.isFocused ? '#4f46e5' : '#94a3b8',
                                                paddingRight: '12px',
                                                transition: 'color 0.3s ease',
                                                '&:hover': {
                                                    color: '#4f46e5'
                                                }
                                            }),
                                            placeholder: (baseStyles) => ({
                                                ...baseStyles,
                                                color: '#94a3b8',
                                                fontWeight: '500'
                                            })
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Descripción del Problema *</label>
                                    <textarea
                                        placeholder="Por favor describe detalladamente la incidencia..."
                                        value={ticketDescription}
                                        onChange={e => setTicketDescription(e.target.value)}
                                        className="login-input-premium pl-4 py-3 min-h-[90px]"
                                        style={{ background: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                                        required
                                    />
                                </div>

                                {supportError && (
                                    <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                        <ShieldAlert size={14} className="stroke-[3]" />
                                        {supportError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSupportForm(false);
                                            setSupportError('');
                                        }}
                                        className="w-1/3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer font-bold"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold"
                                        disabled={supportLoading}
                                    >
                                        {supportLoading ? 'REGISTRANDO...' : 'REGISTRAR TICKET'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Formulario de Login */
                        <>
                            <div className="mb-8 text-left">
                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <LogIn className="text-white" size={28} />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                    Acceso
                                </h1>
                                <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mt-2">
                                    Friday • Tu aliado CRM
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={18} />
                                            <input
                                                type="email"
                                                placeholder="usuario@empresa.com"
                                                value={email}
                                                onChange={e => {
                                                    setEmail(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                className={`login-input-premium pl-12 ${error ? 'border-rose-300 bg-rose-50/30' : ''}`}
                                                style={{ background: '#fff', borderColor: error ? '#fca5a5' : '#e2e8f0' }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Contraseña</label>
                                        <div className="relative">
                                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => {
                                                    setPassword(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                onKeyUp={checkCapsLock}
                                                className={`login-input-premium pl-12 pr-12 ${error ? 'border-rose-300 bg-rose-50/30' : ''}`}
                                                style={{ background: '#fff', borderColor: error ? '#fca5a5' : '#e2e8f0' }}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 hover:bg-slate-50 transition-all p-1.5 rounded-lg cursor-pointer"
                                                tabIndex={-1}
                                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {(isCapsLockOn && !error) && (
                                            <div className="flex items-center gap-1.5 mt-2 ml-1 text-amber-600 animate-in fade-in slide-in-from-top-1">
                                                <AlertCircle size={12} className="stroke-[3]" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Mayúsculas activadas</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center ml-1">
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-4 h-4 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                                            <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Recordarme</span>
                                    </label>

                                    <Link
                                        to="/forgot-password"
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>

                                {error && (
                                    <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                        <ShieldAlert size={14} className="stroke-[3]" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="login-btn-premium py-5 cursor-pointer"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            AUTENTICANDO...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            ENTRAR AL SISTEMA
                                            <LogIn size={20} />
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Enlace para registrar ticket público */}
                            <div className="text-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSupportForm(true);
                                        setSupportError('');
                                    }}
                                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest focus:outline-none cursor-pointer transition-colors"
                                >
                                    ¿Necesitas ayuda? Levantar un Ticket de Soporte
                                </button>
                            </div>
                        </>
                    )}

                    {/* Footer Info */}
                    <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Friday • CRM para Gestión de Ventas
                    </p>
                </div>

                {/* Decoración lateral sutil en el lado izquierdo */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600"></div>
            </div>

            {/* Sección Derecha: Energy River */}
            <div className="hidden lg:flex w-1/2 bg-slate-50 items-center justify-center relative overflow-hidden border-l border-slate-100">
                <div className="absolute inset-0">
                    <LoginBackground />
                </div>

                <div className="relative z-10 text-center px-12 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-6 inline-block bg-white shadow-sm px-4 py-2 rounded-full border border-slate-200">
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Friday</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 leading-tight mb-4">
                        Acelera tus cierres de ventas.
                    </h2>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        Tu aliado para convertir prospectos en clientes y llevar tus ventas al siguiente nivel.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Login;