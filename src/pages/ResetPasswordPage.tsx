import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle, Eye, EyeOff, ArrowLeft, LogIn, ShieldAlert } from 'lucide-react';
import axiosInstance from '../core/axios/axiosInstance';
import { auth } from '../global/endpoints';
import LoginBackground from '../components/Login/LoginBackground';
import '../components/Login/Login.css';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!token) {
            setError('Token de recuperación faltante');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axiosInstance.post(auth.RESET_PASSWORD, {
                token,
                password
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-8">
                <div className="max-w-md w-full glass-card p-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-sm">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Enlace inválido</h2>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                        Este enlace de recuperación no es válido, ha expirado o está incompleto. Por favor, solicita uno nuevo.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="login-btn-premium py-4 block text-center"
                    >
                        SOLICITAR NUEVO ENLACE
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-white">

            {/* Sección Izquierda: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white z-10 relative">
                <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-left-8 duration-700">

                    <Link to="/login" className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-10 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1 group">
                        <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
                        Volver al inicio
                    </Link>

                    {success ? (
                        <div className="text-left animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 border border-green-100 shadow-sm">
                                <CheckCircle size={32} />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">¡Listo! Ya puedes volver.</h1>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Tu acceso ha sido restaurado correctamente. Ya puedes acceder a la plataforma con tus nuevas credenciales. ¡Qué bueno tenerte de vuelta!
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="login-btn-premium py-5"
                            >
                                IR AL LOGIN
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10 text-left">
                                <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <LogIn className="text-white" size={28} />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                    ¡Vamos a restaurar tu acceso!
                                </h1>
                                <p className="text-rose-600 text-[11px] font-black uppercase tracking-[0.3em] mt-2">
                                    Billy Sales & Services • Seguridad
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2 relative group">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nueva Contraseña</label>
                                        <div className="relative">
                                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => {
                                                    setPassword(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                className={`login-input-premium pl-12 pr-12 focus:border-rose-500 focus:ring-rose-500 ${error ? 'border-rose-300 bg-rose-50/30' : ''}`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-all p-1.5 rounded-lg"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative group">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-rose-500'}`} size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={e => {
                                                    setConfirmPassword(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                className={`login-input-premium pl-12 pr-12 focus:border-rose-500 focus:ring-rose-500 ${error ? 'border-rose-300 bg-rose-50/30' : ''}`}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Requisitos:</h4>
                                   <ul className="text-[10px] text-slate-500 font-bold uppercase tracking-tight space-y-1">
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 bg-rose-600 rounded-full"></div> Mínimo 8 caracteres</li>
                                       <li className="flex items-center gap-2"><div className="w-1 h-1 bg-rose-600 rounded-full"></div> Letras y números</li>
                                   </ul>
                               </div>

                               {error && (
                                   <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                       <ShieldAlert size={14} className="stroke-[3]" />
                                       {error}
                                   </div>
                               )}

                               <button
                                   type="submit"
                                   className="login-btn-premium !bg-rose-600 hover:!bg-rose-700 py-5"
                                   disabled={loading}
                               >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            PROCESANDO...
                                        </div>
                                    ) : (
                                        'ESTABLECER NUEVA CONTRASEÑA'
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Billy Sales & Services • CRM para Gestión de Ventas
                    </p>
                </div>

                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-red-600"></div>
            </div>

            {/* Sección Derecha: Visual Experience */}
            <div className="hidden lg:flex w-1/2 bg-slate-50 items-center justify-center relative overflow-hidden border-l border-slate-100">
                <div className="absolute inset-0">
                    <LoginBackground />
                </div>

                <div className="relative z-10 text-center px-12 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-6 inline-block bg-white shadow-sm px-4 py-2 rounded-full border border-slate-200">
                        <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.4em]">Seguridad Avanzada</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 leading-tight mb-4">
                        Cuidamos de ti y de tu información.
                    </h2>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        Recupera tu entrada y sigue construyendo el futuro del equipo.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default ResetPasswordPage;
