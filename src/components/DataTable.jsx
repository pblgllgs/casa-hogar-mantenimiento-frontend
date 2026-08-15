import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export default function DataTable({ columns, data, page = 0, totalPages = 1, onPageChange }) {
  const hasData = data && data.length > 0

  const getColKey = (col) => col.key || col.accessor
  const getColLabel = (col) => col.label || col.header

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th key={getColKey(col)} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors">
                  {getColLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasData ? (
              data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`hover:bg-gray-50 even:bg-gray-50/30 transition-colors duration-150 ${idx < data.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={getColKey(col)} className="px-4 py-3 text-gray-600">
                      {col.render ? col.render(row) : row[getColKey(col)]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-400">
                  <Inbox size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="m-0 text-sm font-medium">No hay datos disponibles</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page === 0}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i
              } else if (page < 3) {
                pageNum = i
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={`flex items-center justify-center min-w-8 h-8 rounded-lg text-sm cursor-pointer border ${
                    pageNum === page
                      ? 'border-indigo-500 bg-indigo-500 text-white font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 font-normal hover:bg-gray-100'
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
