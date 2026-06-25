import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, ShieldAlert, LogIn } from 'lucide-react';
import axiosInstance from '../core/axios/axiosInstance';
import { auth } from '../global/endpoints';
import LoginBackground from '../components/Login/LoginBackground';
import '../components/Login/Login.css';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axiosInstance.post(auth.FORGOT_PASSWORD, { email });
            setSuccess(true);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Error al procesar la solicitud';
            setError(msg === 'User not found' ? 'El correo no está registrado' : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-white">

            {/* Sección Izquierda: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white z-10 relative">
                <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-left-8 duration-700">

                    <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-10 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1 group">
                        <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
                        Volver al inicio
                    </Link>

                    {success ? (
                        <div className="text-left animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 border border-green-100 shadow-sm">
                                <CheckCircle size={32} />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">¡Listo! Revisa tu bandeja.</h1>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Si el correo <strong className="text-slate-900">{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="login-btn-premium py-5"
                            >
                                ENTENDIDO
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10 text-left">
                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                                    <LogIn className="text-white" size={28} />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                    ¿Olvidaste tu acceso?
                                </h1>
                                <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.3em] mt-2">
                                    Billy Sales & Services • Seguridad
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Tu Correo Institucional</label>
                                    <div className="relative group">
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
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                        <ShieldAlert size={14} className="stroke-[3]" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="login-btn-premium py-5"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ENVIANDO...
                                        </div>
                                    ) : (
                                        'ENVIAR ENLACE DE RECUPERACIÓN'
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} Billy Sales & Services • CRM para Gestión de Ventas
                    </p>
                </div>

                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600"></div>
            </div>

            {/* Sección Derecha: Visual Experience */}
            <div className="hidden lg:flex w-1/2 bg-slate-50 items-center justify-center relative overflow-hidden border-l border-slate-100">
                <div className="absolute inset-0">
                    <LoginBackground />
                </div>

                <div className="relative z-10 text-center px-12 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-6 inline-block bg-white shadow-sm px-4 py-2 rounded-full border border-slate-200">
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Protección de Datos</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 leading-tight mb-4">
                        Cuidamos de ti y de tu acceso.
                    </h2>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        Inicia el proceso de recuperación y sigue construyendo el futuro con nosotros.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default ForgotPasswordPage;
