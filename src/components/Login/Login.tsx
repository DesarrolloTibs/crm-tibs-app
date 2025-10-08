import React, { useState } from 'react';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './Login.css'; // Importamos los estilos para la animación

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
        <div className="min-h-screen w-full flex flex-col md:flex-row">
            {/* Parte Izquierda: Animación y Bienvenida */}
            <div className="relative md:w-1/2 w-full bg-gradient-to-br from-fuchsia-600 via-blue-400 to-purple-700 animated-gradient flex flex-col items-center justify-center p-8 text-white overflow-hidden">
                <ul className="bubbles">
                    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
                </ul>
                <div className="relative z-10 text-center">
                    <h1 className="text-6xl font-bold mb-4 text-white">Friday</h1>
                    <p className="text-xl text-white/90 max-w-sm">Tu aliado para convertir prospectos en clientes y llevar tus ventas al siguiente nivel.</p>
                </div>
            </div>

            {/* Parte Derecha: Formulario de Login */}
            <div className="md:w-1/2 w-full bg-gray-50 flex items-center justify-center p-8">
                <div className="w-full max-w-md form-fade-in-up">
                    <div className="text-left mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Bienvenido de vuelta</h2>
                        <p className="text-gray-500">Ingresa tus credenciales para acceder a tu cuenta.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full border border-gray-300 px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition"
                                required
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full border border-gray-300 px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition"
                                required
                            />
                        </div>
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 text-sm text-center p-2 rounded-lg">{error}</div>}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:bg-blue-400"
                            disabled={loading}
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;