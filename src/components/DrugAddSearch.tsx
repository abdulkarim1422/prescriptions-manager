import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Drug } from '../types'

interface DrugAddSearchProps {
  onDrugAdd: (drugId: number, drugName: string) => void
  placeholder?: string
}

export function DrugAddSearch({ onDrugAdd, placeholder = "Search and add medications..." }: DrugAddSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Drug[]>([])
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
        searchDrugs(searchQuery)
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

  const searchDrugs = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      setIsOpen(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/drugs?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json() as { results: Drug[] }
        setSearchResults(data.results || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Drug search failed:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrugSelect = (drug: Drug) => {
    onDrugAdd(drug.id, drug.product_name || `Drug #${drug.id}`)
    setSearchQuery('')
    setIsOpen(false)
    setSearchResults([])
  }

  const handleFocus = () => {
    if (searchQuery.length >= 3) {
      searchDrugs(searchQuery)
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
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((drug) => (
            <button
              key={drug.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handleDrugSelect(drug)}
            >
              <div className="font-medium text-gray-900">
                {drug.product_name || `Drug #${drug.id}`}
              </div>
              {drug.active_ingredient && (
                <div className="text-sm text-gray-600">
                  Active: {drug.active_ingredient}
                </div>
              )}
              {drug.atc_code && (
                <div className="text-xs text-gray-500">
                  ATC: {drug.atc_code}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && searchResults.length === 0 && searchQuery.length >= 3 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-3 text-sm text-gray-500 text-center">
            No drugs found for "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  )
}
