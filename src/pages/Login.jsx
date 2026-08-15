import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(formData)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-8 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-indigo-500 text-white inline-flex items-center justify-center mb-4">
            <LogIn size={28} />
          </div>
          <h1 className="m-0 text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="mt-2 mb-0 text-sm text-gray-500">Casa Hogar - Sistema de Mantenimiento</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
            <input
              type="text" name="username" value={formData.username} onChange={handleChange}
              required placeholder="Ingrese su usuario"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none box-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              style={{ fontFamily: 'inherit' }} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange} required placeholder="Ingrese su contraseña"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none box-border pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                style={{ fontFamily: 'inherit' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-none border-none text-gray-400 cursor-pointer p-1 flex hover:text-gray-600 active:text-gray-800 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full px-4 py-3 rounded-lg border-none text-white text-[15px] font-semibold cursor-pointer mb-4 disabled:opacity-70 disabled:cursor-not-allowed bg-indigo-500 hover:bg-indigo-600 transition-colors">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 m-0">
          ¿No tiene cuenta?{' '}
          <Link to="/register" className="text-indigo-500 no-underline font-medium">Registrarse</Link>
        </p>
      </div>
    </div>
  )
}
