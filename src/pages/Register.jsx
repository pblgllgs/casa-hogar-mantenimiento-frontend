import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '', documentNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailValid = emailRegex.test(formData.email)
  const emailBorderClass = !emailTouched || emailValid
    ? 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
    : 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'

  const handleEmailBlur = () => {
    setEmailTouched(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Ingrese un correo electrónico válido')
      return
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const { confirmPassword, ...data } = formData
      await register(data)
      toast.success('Cuenta creada exitosamente')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setFormData({ ...formData, phone: value.replace(/\D/g, '') })
      return
    }
    if (name === 'documentNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 9)
      const formatted = digits.replace(/(\d{3})(?=\d)/g, '$1.')
      setFormData({ ...formData, documentNumber: formatted })
      return
    }
    setFormData({ ...formData, [name]: value })
  }

  const pwMatchClass = formData.confirmPassword
    ? (formData.confirmPassword === formData.password
      ? 'border-emerald-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200'
      : 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100')
    : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  const fields = [
    { name: 'firstName', label: 'Nombre', type: 'text', placeholder: 'Nombre' },
    { name: 'lastName', label: 'Apellido', type: 'text', placeholder: 'Apellido' },
    { name: 'username', label: 'Usuario', type: 'text', placeholder: 'Nombre de usuario' },
    { name: 'email', label: 'Correo Electrónico', type: 'email', placeholder: 'correo@ejemplo.com' },
    { name: 'phone', label: 'Teléfono', type: 'tel', placeholder: 'Número de teléfono' },
    { name: 'documentNumber', label: 'Número de Documento', type: 'text', placeholder: 'Documento de identidad' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-8 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-indigo-500 text-white inline-flex items-center justify-center mb-4">
            <UserPlus size={28} />
          </div>
          <h1 className="m-0 text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="mt-2 mb-0 text-sm text-gray-500">Casa Hogar - Sistema de Mantenimiento</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={field.name === 'email' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input type={field.type} name={field.name} value={formData[field.name]}
                  onChange={handleChange} onBlur={field.name === 'email' ? handleEmailBlur : undefined}
                  required placeholder={field.placeholder}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none box-border transition-colors ${field.name === 'email' ? emailBorderClass : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                  style={{ fontFamily: 'inherit' }} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none box-border pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  style={{ fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-none border-none text-gray-400 cursor-pointer p-1 flex hover:text-gray-600 active:text-gray-800 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Repetir Contraseña</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange} required placeholder="Repita la contraseña"
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none box-border pr-10 transition-colors ${pwMatchClass}`}
                  style={{ fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-none border-none text-gray-400 cursor-pointer p-1 flex hover:text-gray-600 active:text-gray-800 transition-colors">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full px-4 py-3 rounded-lg border-none text-white text-[15px] font-semibold cursor-pointer mt-6 disabled:opacity-70 disabled:cursor-not-allowed bg-indigo-500 hover:bg-indigo-600 transition-colors">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4 mb-0">
          ¿Ya tiene cuenta?{' '}
          <Link to="/login" className="text-indigo-500 no-underline font-medium">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  )
}
