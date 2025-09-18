import { useState, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { SearchBarProps, SearchRequest } from '../types'

export function SearchBar({ onSearch, placeholder, defaultType = 'all', loading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchRequest['type']>(defaultType)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Clear any pending delayed search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = null
      }
      onSearch(query.trim(), searchType)
    }
  }

  const debouncedSearch = useCallback((searchQuery: string, type: SearchRequest['type']) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim(), type)
      }
    }, 300) // 300ms delay to reduce rapid API calls
  }, [onSearch])

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    // Only trigger auto-search if we have 3 or more characters
    // This prevents premature searches and maintains better UX
    if (value.trim().length >= 3) {
      debouncedSearch(value.trim(), searchType)
    } else if (value.trim().length === 0) {
      // Clear results when input is empty
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = null
      }
      onSearch('', searchType)
    }
  }

  const handleTypeChange = (newType: SearchRequest['type']) => {
    setSearchType(newType)
    // Re-trigger search with new type if we have a query
    if (query.trim().length >= 3) {
      debouncedSearch(query.trim(), newType)
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
          onChange={(e) => handleTypeChange(e.target.value as SearchRequest['type'])}
          className="input-field w-44"
          disabled={loading}
        >
          <option value="all">All Categories</option>
          <option value="disease">Diseases</option>
          <option value="finding">Findings</option>
          <option value="medication">Medications</option>
          <option value="drug">Drugs</option>
          <option value="therapy">Therapies</option>
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
