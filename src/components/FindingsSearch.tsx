import { useState, useEffect, useRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Finding } from './FindingsView'

interface FindingsSearchProps {
  selectedFindingIds: number[]
  onFindingsChange: (findingIds: number[], findings: Finding[]) => void
  placeholder?: string
  multiple?: boolean
  maxSelections?: number
  onAddNew?: (searchTerm: string) => void
}

export function FindingsSearch({ 
  selectedFindingIds, 
  onFindingsChange, 
  placeholder = "Search for findings...", 
  multiple = true,
  maxSelections = 10,
  onAddNew
}: FindingsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Finding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFindings, setSelectedFindings] = useState<Finding[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load selected finding details when component mounts or selectedFindingIds change
  useEffect(() => {
    if (selectedFindingIds.length > 0) {
      loadSelectedFindings()
    } else {
      setSelectedFindings([])
    }
  }, [selectedFindingIds])

  // Handle search debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchFindings(searchQuery)
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

  const loadSelectedFindings = async () => {
    try {
      const promises = selectedFindingIds.map(id => 
        fetch(`/api/findings/${id}`).then(res => res.json())
      )
      const findings = await Promise.all(promises)
      setSelectedFindings(findings.filter((f: any) => f && !f.error) as Finding[])
    } catch (error) {
      console.error('Error loading selected findings:', error)
    }
  }

  const searchFindings = async (query: string) => {
    if (query.length < 2) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/findings?q=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json() as { results: Finding[] }
        setSearchResults(data.results || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error searching findings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFindingSelect = (finding: Finding) => {
    if (!multiple) {
      // Single selection mode
      setSelectedFindings([finding])
      onFindingsChange([Number(finding.id)], [finding])
      setSearchQuery('')
      setIsOpen(false)
      return
    }

    // Multiple selection mode
    const isAlreadySelected = selectedFindingIds.includes(Number(finding.id))
    
    if (isAlreadySelected) {
      // Remove from selection
      const newIds = selectedFindingIds.filter(id => id !== Number(finding.id))
      const newFindings = selectedFindings.filter(f => Number(f.id) !== Number(finding.id))
      setSelectedFindings(newFindings)
      onFindingsChange(newIds, newFindings)
    } else {
      // Add to selection (if under max limit)
      if (selectedFindingIds.length < maxSelections) {
        const newIds = [...selectedFindingIds, Number(finding.id)]
        const newFindings = [...selectedFindings, finding]
        setSelectedFindings(newFindings)
        onFindingsChange(newIds, newFindings)
      }
    }
    
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleRemoveFinding = (findingId: number) => {
    const newIds = selectedFindingIds.filter(id => id !== findingId)
    const newFindings = selectedFindings.filter(f => Number(f.id) !== findingId)
    setSelectedFindings(newFindings)
    onFindingsChange(newIds, newFindings)
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (searchResults.length > 0 || (onAddNew && searchQuery.length >= 2)) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* Add new option */}
            {onAddNew && searchQuery.length >= 2 && (
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 focus:outline-none focus:bg-orange-50 flex items-center justify-between"
                onClick={() => {
                  onAddNew(searchQuery)
                  setSearchQuery('')
                  setIsOpen(false)
                }}
              >
                <span className="text-gray-700">"{searchQuery}"</span>
                <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">Add new</span>
              </button>
            )}
            
            {searchResults.map((finding) => {
              const isSelected = selectedFindingIds.includes(Number(finding.id))
              const isAtMaxLimit = selectedFindingIds.length >= maxSelections && !isSelected
              
              return (
                <button
                  key={finding.id}
                  type="button"
                  onClick={() => !isAtMaxLimit && handleFindingSelect(finding)}
                  disabled={isAtMaxLimit}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{finding.name}</div>
                      {finding.code && (
                        <div className="text-sm text-gray-500">Code: {finding.code}</div>
                      )}
                      {finding.description && (
                        <div className="text-sm text-gray-600 mt-1">{finding.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="text-primary-600">
                        <Plus className="rotate-45" size={16} />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Findings */}
      {selectedFindings.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Findings ({selectedFindings.length}/{maxSelections}):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFindings.map((finding) => (
              <span
                key={finding.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {finding.name}
                {finding.code && ` (${finding.code})`}
                <button
                  type="button"
                  onClick={() => handleRemoveFinding(Number(finding.id))}
                  className="ml-1 hover:text-primary-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
