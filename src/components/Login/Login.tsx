import React, { useState } from 'react';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/pipeline');
        } catch (err: any) {
            // Revisa si el error viene con una respuesta del backend y un mensaje específico
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError(err.message || 'Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl m-4">
                {/* Columna Izquierda - Branding */}
                <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-tr from-blue-700 to-indigo-600 items-center justify-center text-white p-12">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">CRM TIBS</h1>
                        <p className="text-lg text-blue-100">Gestiona tus clientes y oportunidades de forma eficiente.</p>
                    </div>
                </div>

                {/* Columna Derecha - Formulario */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido de nuevo</h2>
                        <p className="text-gray-600 mb-8">Ingresa tus credenciales para acceder a tu cuenta.</p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 px-10 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 px-10 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:bg-blue-400"
                                disabled={loading}
                            >
                                {loading ? 'Ingresando...' : 'Ingresar'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;