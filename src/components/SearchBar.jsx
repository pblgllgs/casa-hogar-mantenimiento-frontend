import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ onSearch, placeholder = 'Buscar...' }) {
  const [value, setValue] = useState('')

  const debouncedSearch = useCallback(() => {
    let timer
    return (searchValue) => {
      clearTimeout(timer)
      timer = setTimeout(() => { onSearch(searchValue) }, 300)
    }
  }, [onSearch])

  const debouncedFn = useCallback(debouncedSearch(), [debouncedSearch])

  useEffect(() => { debouncedFn(value) }, [value, debouncedFn])

  return (
    <div className="relative max-w-[400px]">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 pl-10 rounded-lg border border-gray-300 bg-white text-sm outline-none box-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  )
}
