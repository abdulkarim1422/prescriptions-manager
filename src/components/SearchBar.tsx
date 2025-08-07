import { useState } from 'react'
import { Search } from 'lucide-react'
import { SearchBarProps, SearchRequest } from '../types'

export function SearchBar({ onSearch, placeholder, defaultType = 'all', loading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchRequest['type']>(defaultType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim(), searchType)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    // Trigger search on every keystroke for better UX
    if (value.trim().length > 2) {
      onSearch(value.trim(), searchType)
    } else if (value.trim().length === 0) {
      onSearch('', searchType) // Clear results
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder || "Search..."}
            className="input-field pl-10"
            disabled={loading}
          />
        </div>
        
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as SearchRequest['type'])}
          className="input-field w-40"
          disabled={loading}
        >
          <option value="all">All</option>
          <option value="disease">Diseases</option>
          <option value="medication">Medications</option>
          <option value="prescription">Prescriptions</option>
        </select>
        
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}
