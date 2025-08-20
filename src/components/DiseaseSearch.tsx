import { useState, useEffect, useRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Disease } from '../types'

interface DiseaseSearchProps {
  selectedDiseaseIds: number[]
  onDiseasesChange: (diseaseIds: number[], diseases: Disease[]) => void
  placeholder?: string
  multiple?: boolean
  maxSelections?: number
  onAddNew?: (searchTerm: string) => void
  onQuickAdd?: (diseaseName: string) => void
  selectedDiseaseObjects?: Disease[]
}

export function DiseaseSearch({ 
  selectedDiseaseIds, 
  onDiseasesChange, 
  placeholder = "Search for diseases/conditions...", 
  multiple = true,
  maxSelections = 10,
  onAddNew,
  onQuickAdd,
  selectedDiseaseObjects
}: DiseaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Disease[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDiseases, setSelectedDiseases] = useState<Disease[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load selected disease details when component mounts or selectedDiseaseIds change
  useEffect(() => {
    if (selectedDiseaseObjects && selectedDiseaseObjects.length > 0) {
      // Use the passed objects directly
      setSelectedDiseases(selectedDiseaseObjects)
    } else if (selectedDiseaseIds.length > 0) {
      // Fallback to loading from API if no objects provided
      loadSelectedDiseases()
    } else {
      setSelectedDiseases([])
    }
  }, [selectedDiseaseIds, selectedDiseaseObjects])

  // Handle search debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchDiseases(searchQuery)
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

  const loadSelectedDiseases = async () => {
    try {
      const diseasePromises = selectedDiseaseIds.map(async (id) => {
        const response = await fetch(`/api/diseases/${id}`)
        if (response.ok) {
          return await response.json() as Disease
        }
        return null
      })
      
      const diseases = await Promise.all(diseasePromises)
      const validDiseases = diseases.filter(d => d !== null) as Disease[]
      setSelectedDiseases(validDiseases)
    } catch (error) {
      console.error('Failed to load disease details:', error)
    }
  }

  const searchDiseases = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setIsOpen(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/diseases?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json() as { results: Disease[] }
        setSearchResults(data.results || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Disease search failed:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleDiseaseSelect = (disease: Disease) => {
    if (!multiple) {
      // Single selection mode
      const newDiseases = [disease]
      const newIds = [disease.id]
      setSelectedDiseases(newDiseases)
      onDiseasesChange(newIds, newDiseases)
      setSearchQuery('')
      setIsOpen(false)
      setSearchResults([])
      return
    }

    // Multiple selection mode
    if (selectedDiseaseIds.includes(disease.id)) {
      // Already selected, do nothing
      return
    }

    if (selectedDiseases.length >= maxSelections) {
      alert(`You can select up to ${maxSelections} diseases.`)
      return
    }

    const newDiseases = [...selectedDiseases, disease]
    const newIds = newDiseases.map(d => d.id)
    setSelectedDiseases(newDiseases)
    onDiseasesChange(newIds, newDiseases)
    setSearchQuery('')
    setIsOpen(false)
    setSearchResults([])
  }

  const handleRemoveDisease = (diseaseId: number) => {
    const newDiseases = selectedDiseases.filter(d => d.id !== diseaseId)
    const newIds = newDiseases.map(d => d.id)
    setSelectedDiseases(newDiseases)
    onDiseasesChange(newIds, newDiseases)
  }

  const handleFocus = () => {
    if (searchQuery.length >= 2) {
      searchDiseases(searchQuery)
    }
  }

  const handleBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => setIsOpen(false), 200)
  }

  const isDiseasSelected = (diseaseId: number) => {
    return selectedDiseaseIds.includes(diseaseId)
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
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
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-3 text-sm text-gray-500 text-center">
              Type at least 2 characters to search
            </div>
          </div>
        )}

        {/* Search results */}
        {isOpen && (searchResults.length > 0 || (onAddNew && searchQuery.length >= 2)) && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {searchResults.map((disease) => (
              <button
                key={disease.id}
                type="button"
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 focus:outline-none focus:bg-gray-50 ${
                  isDiseasSelected(disease.id) ? 'bg-green-50 border-green-200' : ''
                }`}
                onClick={() => handleDiseaseSelect(disease)}
                disabled={isDiseasSelected(disease.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {disease.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Code: {disease.code}
                    </div>
                    {disease.category && (
                      <div className="text-xs text-gray-500">
                        Category: {disease.category}
                      </div>
                    )}
                  </div>
                  {isDiseasSelected(disease.id) && (
                    <div className="text-green-600 text-sm font-medium">
                      Selected
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            {/* Add new option - moved to bottom */}
            {onAddNew && searchQuery.length >= 2 && (
              <div className="border-t border-gray-200">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="flex-1 text-left px-4 py-3 hover:bg-purple-50 focus:outline-none focus:bg-purple-50"
                    onClick={() => {
                      onAddNew(searchQuery)
                      setSearchQuery('')
                      setIsOpen(false)
                    }}
                  >
                    <span className="text-gray-700">"{searchQuery}"</span>
                    <span className="px-2 py-1 text-xs bg-purple-500 text-white rounded-full ml-2">Add new</span>
                  </button>
                  {onQuickAdd && (
                    <button
                      type="button"
                      className="px-3 py-1 mr-2 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickAdd(searchQuery)
                        setSearchQuery('')
                        setIsOpen(false)
                      }}
                    >
                      Quick Add
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {isOpen && searchResults.length === 0 && searchQuery.length >= 2 && !isLoading && !onAddNew && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-3 text-sm text-gray-500 text-center">
              No diseases found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {/* Selected diseases */}
      {selectedDiseases.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Diseases/Conditions:
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDiseases.map((disease) => (
              <div
                key={disease.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span>{disease.name} ({disease.code})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDisease(disease.id)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
