import React, { useState, useEffect } from 'react';
import { login } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LoginBackground from './LoginBackground';
import './Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

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
            navigate('/dashboard');
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

    return (
        <div className="flex min-h-screen w-full lg:overflow-hidden overflow-y-auto bg-white font-sans">

            {/* Sección Izquierda: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white z-10 relative">
                <div className="w-full max-w-[420px] py-4 animate-in fade-in slide-in-from-left-8 duration-700">

                    <div className="mb-8 text-left">
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                            <LogIn className="text-white" size={28} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Acceso
                        </h1>
                        <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mt-2">
                            Billy Sales & Services • Tu aliado CRM
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
                        <Link
                            to="/support"
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest focus:outline-none cursor-pointer transition-colors"
                        >
                            ¿Necesitas ayuda? Levantar un Ticket de Soporte
                        </Link>
                    </div>

                    {/* Footer Info */}
                    <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Billy Sales & Services • CRM para Gestión de Ventas
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
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Billy Sales & Services</span>
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