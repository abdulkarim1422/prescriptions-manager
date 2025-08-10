import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, ChevronDown, Plus, Edit, Trash2, Info } from 'lucide-react'
import { Drug } from '../types'
import { DrugInfoModal } from './DrugInfoModal'

interface DrugsResponse {
  results: Drug[]
  total: number
  has_more: boolean
}

interface MedicationsViewProps {
  onShowCreateDrug: () => void
  onShowImportDrugs: () => void
  onEditDrug: (drug: Drug) => void
  onDeleteDrug: (drugId: number) => void
  importingDrugs: boolean
  importSummary: string | null
}

interface SearchFilters {
  productName: boolean
  activeIngredient: boolean
  atcCode: boolean
  barcode: boolean
  categories: boolean
  description: boolean
}

interface PaginationState {
  currentPage: number
  totalCount: number
  hasMore: boolean
  loading: boolean
}

export function MedicationsView({ 
  onShowCreateDrug, 
  onShowImportDrugs, 
  onEditDrug,
  onDeleteDrug,
  importingDrugs, 
  importSummary 
}: MedicationsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [deletingDrugId, setDeletingDrugId] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [showDrugInfo, setShowDrugInfo] = useState(false)
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  
  // Initialize state from URL parameters
  const getSearchQueryFromUrl = () => searchParams.get('q') || ''
  const getPageFromUrl = () => parseInt(searchParams.get('page') || '1')
  const getShowFiltersFromUrl = () => searchParams.get('showFilters') === 'true'
  const getFiltersFromUrl = (): SearchFilters => {
    const defaultFilters: SearchFilters = {
      productName: true,
      activeIngredient: true,
      atcCode: true,
      barcode: false,
      categories: false,
      description: false
    }
    
    // Check if any filter parameters exist in URL
    const hasFilterParams = searchParams.has('productName') || 
                           searchParams.has('activeIngredient') || 
                           searchParams.has('atcCode') || 
                           searchParams.has('barcode') || 
                           searchParams.has('categories') || 
                           searchParams.has('description')
    
    if (!hasFilterParams) {
      return defaultFilters
    }
    
    return {
      productName: searchParams.get('productName') !== 'false',
      activeIngredient: searchParams.get('activeIngredient') !== 'false',
      atcCode: searchParams.get('atcCode') !== 'false',
      barcode: searchParams.get('barcode') === 'true',
      categories: searchParams.get('categories') === 'true',
      description: searchParams.get('description') === 'true'
    }
  }
  
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromUrl())
  const [showFilters, setShowFilters] = useState(getShowFiltersFromUrl())
  const [filters, setFilters] = useState<SearchFilters>(getFiltersFromUrl())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category') || null)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: getPageFromUrl(),
    totalCount: 0,
    hasMore: false,
    loading: false
  })

  const ITEMS_PER_PAGE = 100

  // Function to update URL parameters
  const updateUrlParams = (updates: { 
    q?: string, 
    page?: number, 
    filters?: Partial<SearchFilters>,
    showFilters?: boolean,
    category?: string | null
  }) => {
    const newSearchParams = new URLSearchParams(searchParams)
    
    // Update search query
    if (updates.q !== undefined) {
      if (updates.q.trim()) {
        newSearchParams.set('q', updates.q.trim())
      } else {
        newSearchParams.delete('q')
      }
    }
    
    // Update page
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        newSearchParams.set('page', updates.page.toString())
      } else {
        newSearchParams.delete('page')
      }
    }
    
    // Update showFilters
    if (updates.showFilters !== undefined) {
      if (updates.showFilters) {
        newSearchParams.set('showFilters', 'true')
      } else {
        newSearchParams.delete('showFilters')
      }
    }

    // Update category filter
    if (updates.category !== undefined) {
      if (updates.category) {
        newSearchParams.set('category', updates.category)
      } else {
        newSearchParams.delete('category')
      }
    }
    
    // Update filters
    if (updates.filters) {
      const currentFilters = { ...filters, ...updates.filters }
      Object.entries(currentFilters).forEach(([key, value]) => {
        // Only set explicit false for default-true filters, and explicit true for default-false filters
        const defaultFilters: SearchFilters = {
          productName: true,
          activeIngredient: true,
          atcCode: true,
          barcode: false,
          categories: false,
          description: false
        }
        
        const isDefaultTrue = defaultFilters[key as keyof SearchFilters]
        
        if (isDefaultTrue) {
          // For default-true filters, only set URL param if false
          if (!value) {
            newSearchParams.set(key, 'false')
          } else {
            newSearchParams.delete(key)
          }
        } else {
          // For default-false filters, only set URL param if true
          if (value) {
            newSearchParams.set(key, 'true')
          } else {
            newSearchParams.delete(key)
          }
        }
      })
    }
    
    setSearchParams(newSearchParams)
  }

  useEffect(() => {
    loadDrugs(true) // Reset to first page
  }, [])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        searchDrugs()
      } else {
        loadDrugs(true)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  // Watch for selectedCategory changes
  useEffect(() => {
    if (selectedCategory) {
      searchDrugs(true)
    } else if (searchQuery.trim() !== '') {
      searchDrugs(true)
    } else {
      loadDrugs(true)
    }
  }, [selectedCategory])

  // New useEffect to handle URL parameter changes
  useEffect(() => {
    const urlQuery = getSearchQueryFromUrl()
    const urlPage = getPageFromUrl()
    const urlShowFilters = getShowFiltersFromUrl()
    const urlFilters = getFiltersFromUrl()
    
    // Update local state if URL parameters changed (e.g., from browser back/forward)
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
    }
    if (urlPage !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: urlPage }))
    }
    if (urlShowFilters !== showFilters) {
      setShowFilters(urlShowFilters)
    }
    
    // Compare filters
    const filtersChanged = Object.keys(filters).some(
      key => filters[key as keyof SearchFilters] !== urlFilters[key as keyof SearchFilters]
    )
    if (filtersChanged) {
      setFilters(urlFilters)
    }
  }, [searchParams])

  const loadDrugs = async (reset = false) => {
    const page = reset ? 1 : pagination.currentPage
    const offset = (page - 1) * ITEMS_PER_PAGE

    try {
      setPagination(prev => ({ ...prev, loading: true }))
      
      let url = `/api/drugs?limit=${ITEMS_PER_PAGE}&offset=${offset}`
      
      // Add category filter if selected
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json() as DrugsResponse
        
        if (reset) {
          setDrugs(data.results || [])
        } else {
          setDrugs(prev => [...prev, ...(data.results || [])])
        }

        setPagination({
          currentPage: page,
          totalCount: data.total || 0,
          hasMore: data.has_more || false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to load drugs:', error)
      setPagination(prev => ({ ...prev, loading: false }))
    }
  }

  const searchDrugs = async (reset = true) => {
    if (searchQuery.trim().length < 2 && !selectedCategory) {
      loadDrugs(true)
      return
    }

    const page = reset ? 1 : pagination.currentPage
    const offset = (page - 1) * ITEMS_PER_PAGE

    try {
      setPagination(prev => ({ ...prev, loading: true }))
      
      // Build search fields based on filters
      const searchFields = []
      if (filters.productName) searchFields.push('product_name')
      if (filters.activeIngredient) searchFields.push('active_ingredient')
      if (filters.atcCode) searchFields.push('atc_code')
      if (filters.barcode) searchFields.push('barcode')
      if (filters.categories) searchFields.push('categories')
      if (filters.description) searchFields.push('description')

      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        fields: searchFields.join(',')
      })

      // Add search query if present
      if (searchQuery.trim()) {
        queryParams.set('q', searchQuery.trim())
      }

      // Add category filter if selected
      if (selectedCategory) {
        queryParams.set('category', selectedCategory)
      }

      const response = await fetch(`/api/drugs?${queryParams}`)
      if (response.ok) {
        const data = await response.json() as DrugsResponse
        
        if (reset) {
          setDrugs(data.results || [])
        } else {
          setDrugs(prev => [...prev, ...(data.results || [])])
        }

        setPagination({
          currentPage: page,
          totalCount: data.total || 0,
          hasMore: data.has_more || false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to search drugs:', error)
      setPagination(prev => ({ ...prev, loading: false }))
    }
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !pagination.loading) {
      const nextPage = pagination.currentPage + 1
      setPagination(prev => ({ ...prev, currentPage: nextPage }))
      updateUrlParams({ page: nextPage })
      
      if (searchQuery.trim() !== '') {
        searchDrugs(false)
      } else {
        loadDrugs(false)
      }
    }
  }

  const handleFilterChange = (key: keyof SearchFilters) => {
    const newValue = !filters[key]
    const newFilters = { ...filters, [key]: newValue }
    setFilters(newFilters)
    updateUrlParams({ filters: { [key]: newValue }, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    updateUrlParams({ q: value, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleDeleteDrug = async (drugId: number) => {
    try {
      setDeletingDrugId(drugId)
      
      const response = await fetch(`/api/drugs/${drugId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove from local state
        setDrugs(prev => prev.filter(drug => drug.id !== drugId))
        setPagination(prev => ({ 
          ...prev, 
          totalCount: Math.max(0, prev.totalCount - 1) 
        }))
        onDeleteDrug(drugId)
      } else {
        console.error('Failed to delete drug')
        alert('Failed to delete medication. Please try again.')
      }
    } catch (error) {
      console.error('Delete drug error:', error)
      alert('Failed to delete medication. Please try again.')
    } finally {
      setDeletingDrugId(null)
    }
  }

  const handleShowDrugInfo = (drug: Drug) => {
    setSelectedDrug(drug)
    setShowDrugInfo(true)
  }

  const handleCloseDrugInfo = () => {
    setShowDrugInfo(false)
    setSelectedDrug(null)
  }

  const toggleCategoryExpansion = (drugId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(drugId)) {
        newSet.delete(drugId)
      } else {
        newSet.add(drugId)
      }
      return newSet
    })
  }

  const handleCategoryClick = (category: string) => {
    const newCategory = selectedCategory === category ? null : category
    setSelectedCategory(newCategory)
    updateUrlParams({ category: newCategory, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    updateUrlParams({ q: '', category: null, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medications</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowCreateDrug}
            className="btn-primary flex items-center gap-2"
            title="Add a drug manually"
          >
            <Plus size={18} />
            Add Drug
          </button>
          <button
            onClick={onShowImportDrugs}
            className={`btn-secondary flex items-center gap-2 ${importingDrugs ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={importingDrugs}
            title="Import drugs from JSON"
          >
            <Plus size={18} />
            {importingDrugs ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>

      {/* Import Summary */}
      {importSummary && (
        <div className="text-sm text-gray-700 bg-gray-100 rounded px-3 py-2">
          {importSummary}
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            className="input-field pl-10 pr-10"
            placeholder="Search medications... (min 2 characters)"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newShowFilters = !showFilters
              setShowFilters(newShowFilters)
              updateUrlParams({ showFilters: newShowFilters })
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter size={16} />
            Search Fields ({activeFiltersCount})
            <ChevronDown 
              size={16} 
              className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <div className="text-sm text-gray-600">
            Showing {drugs.length} of {pagination.totalCount} medications
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-700 mb-3">Search in:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.productName}
                  onChange={() => handleFilterChange('productName')}
                  className="mr-2"
                />
                Product Name
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.activeIngredient}
                  onChange={() => handleFilterChange('activeIngredient')}
                  className="mr-2"
                />
                Active Ingredient
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.atcCode}
                  onChange={() => handleFilterChange('atcCode')}
                  className="mr-2"
                />
                ATC Code
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.barcode}
                  onChange={() => handleFilterChange('barcode')}
                  className="mr-2"
                />
                Barcode
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories}
                  onChange={() => handleFilterChange('categories')}
                  className="mr-2"
                />
                Categories
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.description}
                  onChange={() => handleFilterChange('description')}
                  className="mr-2"
                />
                Description
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Selected Category Filter */}
      {selectedCategory && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-800">
            Filtering by category:
          </span>
          <span className="text-sm font-medium text-blue-900 bg-blue-200 px-2 py-1 rounded">
            {selectedCategory}
          </span>
          <button
            onClick={() => handleCategoryClick(selectedCategory)}
            className="text-blue-600 hover:text-blue-800 text-sm underline ml-auto"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drugs.map(drug => (
          <div key={drug.id} className="card relative group">
            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleShowDrugInfo(drug)}
                className="p-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                title="View drug information"
              >
                <Info size={14} />
              </button>
              <button
                onClick={() => onEditDrug(drug)}
                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                title="Edit medication"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDeleteDrug(drug.id)}
                disabled={deletingDrugId === drug.id}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                title="Delete medication"
              >
                {deletingDrugId === drug.id ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>

            <div className="font-medium pr-20">{drug.product_name || 'Unknown Product'}</div>
            {drug.active_ingredient && (
              <div className="text-sm text-gray-600">Active: {drug.active_ingredient}</div>
            )}
            {drug.atc_code && (
              <div className="text-sm text-gray-500">ATC: {drug.atc_code}</div>
            )}
            {drug.barcode && (
              <div className="text-xs text-gray-400 mt-1">Barcode: {drug.barcode}</div>
            )}
            {drug.categories && drug.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(() => {
                  const isExpanded = expandedCategories.has(drug.id)
                  const displayCategories = isExpanded ? drug.categories : drug.categories.slice(0, 3)
                  const remainingCount = drug.categories.length - 3
                  
                  return (
                    <>
                      {displayCategories.map((category, index) => (
                        <button
                          key={index}
                          onClick={() => handleCategoryClick(category)}
                          className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900'
                          }`}
                          title={`Filter by category: ${category}`}
                        >
                          {category}
                        </button>
                      ))}
                      {remainingCount > 0 && !isExpanded && (
                        <button
                          onClick={() => toggleCategoryExpansion(drug.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer px-1"
                          title={`Click to show ${remainingCount} more categories`}
                        >
                          +{remainingCount} more
                        </button>
                      )}
                      {isExpanded && drug.categories.length > 3 && (
                        <button
                          onClick={() => toggleCategoryExpansion(drug.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer px-1"
                          title="Click to show less"
                        >
                          show less
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
            {drug.description && (
              <div className="text-sm text-gray-500 mt-2 line-clamp-2">{drug.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={pagination.loading}
            className="btn-secondary flex items-center gap-2 mx-auto"
          >
            {pagination.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                Loading...
              </>
            ) : (
              <>
                Load More ({pagination.totalCount - drugs.length} remaining)
              </>
            )}
          </button>
        </div>
      )}

      {/* No Results */}
      {drugs.length === 0 && !pagination.loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchQuery ? `No medications found for "${searchQuery}"` : 'No medications found'}
          </div>
          {searchQuery && (
            <button onClick={clearSearch} className="btn-secondary mt-4">
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Drug Info Modal */}
      {showDrugInfo && selectedDrug && (
        <DrugInfoModal
          drug={selectedDrug}
          onClose={handleCloseDrugInfo}
        />
      )}
    </div>
  )
}
