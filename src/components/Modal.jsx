import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="m-0 text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose}
            className="bg-none border-none text-gray-400 cursor-pointer p-1 rounded flex items-center justify-center hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
