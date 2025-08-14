import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Therapy } from '../types'

interface TherapySearchProps {
  selectedTherapyId: number
  onTherapySelect: (therapyId: number, therapyName: string) => void
  placeholder?: string
  required?: boolean
}

export function TherapySearch({ selectedTherapyId, onTherapySelect, placeholder = "Search for a therapy...", required = false }: TherapySearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Therapy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load selected therapy details when component mounts
  useEffect(() => {
    if (selectedTherapyId > 0 && !selectedTherapy) {
      loadTherapyDetails(selectedTherapyId)
    }
  }, [selectedTherapyId, selectedTherapy])

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

  const loadTherapyDetails = async (therapyId: number) => {
    try {
      const response = await fetch(`/api/therapies/${therapyId}`)
      if (response.ok) {
        const therapy = await response.json() as Therapy
        setSelectedTherapy(therapy)
        setSearchQuery(therapy.name || '')
      }
    } catch (error) {
      console.error('Failed to load therapy details:', error)
    }
  }

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

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear selection if user is typing new query
    if (selectedTherapy && value !== selectedTherapy.name) {
      setSelectedTherapy(null)
      onTherapySelect(0, '')
    }
  }

  const handleTherapySelect = (therapy: Therapy) => {
    setSelectedTherapy(therapy)
    setSearchQuery(therapy.name || `Therapy #${therapy.id}`)
    setIsOpen(false)
    setSearchResults([])
    onTherapySelect(therapy.id, therapy.name || `Therapy #${therapy.id}`)
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
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="input-field pr-10"
          placeholder={placeholder}
          required={required}
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
          {searchResults.map((therapy) => (
            <button
              key={therapy.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
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
        </div>
      )}

      {/* No results */}
      {isOpen && searchResults.length === 0 && searchQuery.length >= 3 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-3 text-sm text-gray-500 text-center">
            No therapies found for "{searchQuery}"
          </div>
        </div>
      )}

      {/* Selected therapy info */}
      {selectedTherapy && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <div className="font-medium text-green-800">{selectedTherapy.name}</div>
          {selectedTherapy.active_ingredient && (
            <div className="text-green-600">Active: {selectedTherapy.active_ingredient}</div>
          )}
          {selectedTherapy.dosage_form && selectedTherapy.strength && (
            <div className="text-green-600">{selectedTherapy.dosage_form} - {selectedTherapy.strength}</div>
          )}
        </div>
      )}
    </div>
  )
}
