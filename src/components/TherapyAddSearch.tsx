import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Therapy } from '../types'

interface TherapyAddSearchProps {
  onTherapyAdd: (therapyId: number, therapyName: string) => void
  placeholder?: string
  onAddNew?: (searchTerm: string) => void
}

export function TherapyAddSearch({ onTherapyAdd, placeholder = "Search and add therapies...", onAddNew }: TherapyAddSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Therapy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Handle search debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (searchQuery.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchTherapies(searchQuery)
      }, 300)
    } else {
      setSearchResults([])
      setIsOpen(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const searchTherapies = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      setIsOpen(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/therapies?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json() as { results: Therapy[] }
        setSearchResults(data.results || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Therapy search failed:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTherapySelect = (therapy: Therapy) => {
    onTherapyAdd(therapy.id, therapy.name)
    setSearchQuery('')
    setIsOpen(false)
    setSearchResults([])
  }

  const handleFocus = () => {
    if (searchQuery.length >= 3) {
      searchTherapies(searchQuery)
    }
  }

  const handleBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="input-field pr-10"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Search hint */}
      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-3 text-sm text-gray-500 text-center">
            Type at least 3 characters to search
          </div>
        </div>
      )}

      {/* Search results */}
      {isOpen && (searchResults.length > 0 || (onAddNew && searchQuery.length >= 3)) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((therapy) => (
            <button
              key={therapy.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 focus:outline-none focus:bg-blue-50"
              onClick={() => handleTherapySelect(therapy)}
            >
              <div className="font-medium text-gray-900">
                {therapy.name}
              </div>
              {therapy.active_ingredient && (
                <div className="text-sm text-gray-600">
                  Active: {therapy.active_ingredient}
                </div>
              )}
              {therapy.category && (
                <div className="text-xs text-gray-500">
                  Category: {therapy.category}
                </div>
              )}
              {therapy.dosage_form && therapy.strength && (
                <div className="text-xs text-gray-500">
                  {therapy.dosage_form} - {therapy.strength}
                </div>
              )}
            </button>
          ))}
          
          {/* Add new option - moved to bottom */}
          {onAddNew && searchQuery.length >= 3 && (
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-t border-gray-200 focus:outline-none focus:bg-blue-50 flex items-center justify-between"
              onClick={() => {
                onAddNew(searchQuery)
                setSearchQuery('')
                setIsOpen(false)
              }}
            >
              <span className="text-gray-700">"{searchQuery}"</span>
              <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">Add new</span>
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && searchResults.length === 0 && searchQuery.length >= 3 && !isLoading && !onAddNew && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-3 text-sm text-gray-500 text-center">
            No therapies found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  )
}
