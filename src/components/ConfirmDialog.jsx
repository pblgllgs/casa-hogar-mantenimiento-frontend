import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

  return (
    <div onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[420px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <h3 className="m-0 text-lg font-semibold text-gray-800">{title}</h3>
        </div>

        <p className="m-0 mb-6 text-sm text-gray-500 leading-relaxed">{message}</p>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => { onConfirm(); onClose() }}
            className="px-4 py-2 rounded-lg border-none bg-red-500 text-white text-sm font-medium cursor-pointer hover:bg-red-600">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
