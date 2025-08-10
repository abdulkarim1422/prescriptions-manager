import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, ChevronDown, Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Disease } from '../types'

interface DiseasesResponse {
  results: Disease[]
  total: number
  has_more: boolean
}

interface DiseasesViewProps {
  onShowCreateDisease: () => void
  onShowImportDiseases: () => void
  onEditDisease: (disease: Disease) => void
  onDeleteDisease: (diseaseId: number) => void
  importingDiseases: boolean
  importSummary: string | null
}

interface SearchFilters {
  code: boolean
  name: boolean
  description: boolean
  category: boolean
}

interface PaginationState {
  currentPage: number
  totalCount: number
  hasMore: boolean
  loading: boolean
}

export function DiseasesView({ 
  onShowCreateDisease, 
  onShowImportDiseases, 
  onEditDisease,
  onDeleteDisease,
  importingDiseases, 
  importSummary 
}: DiseasesViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [deletingDiseaseId, setDeletingDiseaseId] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  
  // Initialize state from URL parameters
  const getSearchQueryFromUrl = () => searchParams.get('q') || ''
  const getPageFromUrl = () => parseInt(searchParams.get('page') || '1')
  const getShowFiltersFromUrl = () => searchParams.get('showFilters') === 'true'
  const getSortFromUrl = () => ({
    sortBy: searchParams.get('sortBy') || 'code',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  })
  const getFiltersFromUrl = (): SearchFilters => {
    const defaultFilters: SearchFilters = {
      code: true,
      name: true,
      description: true,
      category: false
    }
    
    // Check if any filter parameters exist in URL
    const hasFilterParams = searchParams.has('code') || 
                           searchParams.has('name') || 
                           searchParams.has('description') || 
                           searchParams.has('category')
    
    if (!hasFilterParams) {
      return defaultFilters
    }
    
    return {
      code: searchParams.get('code') !== 'false',
      name: searchParams.get('name') !== 'false',
      description: searchParams.get('description') !== 'false',
      category: searchParams.get('category') === 'true'
    }
  }
  
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromUrl())
  const [showFilters, setShowFilters] = useState(getShowFiltersFromUrl())
  const [filters, setFilters] = useState<SearchFilters>(getFiltersFromUrl())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category') || null)
  const [sortConfig, setSortConfig] = useState(getSortFromUrl())
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
    category?: string | null,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
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
    
    // Update sorting
    if (updates.sortBy !== undefined) {
      if (updates.sortBy && updates.sortBy !== 'code') {
        newSearchParams.set('sortBy', updates.sortBy)
      } else {
        newSearchParams.delete('sortBy')
      }
    }
    
    if (updates.sortOrder !== undefined) {
      if (updates.sortOrder && updates.sortOrder !== 'asc') {
        newSearchParams.set('sortOrder', updates.sortOrder)
      } else {
        newSearchParams.delete('sortOrder')
      }
    }
    
    // Update filters
    if (updates.filters) {
      const currentFilters = { ...filters, ...updates.filters }
      Object.entries(currentFilters).forEach(([key, value]) => {
        const defaultFilters: SearchFilters = {
          code: true,
          name: true,
          description: true,
          category: false
        }
        
        const isDefaultTrue = defaultFilters[key as keyof SearchFilters]
        
        if (isDefaultTrue) {
          if (!value) {
            newSearchParams.set(key, 'false')
          } else {
            newSearchParams.delete(key)
          }
        } else {
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
    loadDiseases(true)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== '' || selectedCategory) {
        searchDiseases()
      } else {
        loadDiseases(true)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  useEffect(() => {
    if (selectedCategory) {
      searchDiseases(true)
    } else if (searchQuery.trim() !== '') {
      searchDiseases(true)
    } else {
      loadDiseases(true)
    }
  }, [selectedCategory])

  // Watch for sorting changes
  useEffect(() => {
    if (searchQuery.trim() !== '' || selectedCategory) {
      searchDiseases(true)
    } else {
      loadDiseases(true)
    }
  }, [sortConfig])

  useEffect(() => {
    const urlQuery = getSearchQueryFromUrl()
    const urlPage = getPageFromUrl()
    const urlShowFilters = getShowFiltersFromUrl()
    const urlFilters = getFiltersFromUrl()
    const urlSort = getSortFromUrl()
    
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
    }
    if (urlPage !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: urlPage }))
    }
    if (urlShowFilters !== showFilters) {
      setShowFilters(urlShowFilters)
    }
    
    const filtersChanged = Object.keys(filters).some(
      key => filters[key as keyof SearchFilters] !== urlFilters[key as keyof SearchFilters]
    )
    if (filtersChanged) {
      setFilters(urlFilters)
    }
    
    // Compare sorting
    if (urlSort.sortBy !== sortConfig.sortBy || urlSort.sortOrder !== sortConfig.sortOrder) {
      setSortConfig(urlSort)
    }
  }, [searchParams])

  const loadDiseases = async (reset = false) => {
    const page = reset ? 1 : pagination.currentPage
    const offset = (page - 1) * ITEMS_PER_PAGE

    try {
      setPagination(prev => ({ ...prev, loading: true }))
      
      let url = `/api/diseases?limit=${ITEMS_PER_PAGE}&offset=${offset}`
      
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      
      // Add sorting parameters
      if (sortConfig.sortBy) {
        url += `&sortBy=${encodeURIComponent(sortConfig.sortBy)}`
      }
      if (sortConfig.sortOrder) {
        url += `&sortOrder=${encodeURIComponent(sortConfig.sortOrder)}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json() as DiseasesResponse
        
        if (reset) {
          setDiseases(data.results || [])
        } else {
          setDiseases(prev => [...prev, ...(data.results || [])])
        }

        setPagination({
          currentPage: page,
          totalCount: data.total || 0,
          hasMore: data.has_more || false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to load diseases:', error)
      setPagination(prev => ({ ...prev, loading: false }))
    }
  }

  const searchDiseases = async (reset = true) => {
    if (searchQuery.trim().length < 2 && !selectedCategory) {
      loadDiseases(true)
      return
    }

    const page = reset ? 1 : pagination.currentPage
    const offset = (page - 1) * ITEMS_PER_PAGE

    try {
      setPagination(prev => ({ ...prev, loading: true }))
      
      const searchFields = []
      if (filters.code) searchFields.push('code')
      if (filters.name) searchFields.push('name')
      if (filters.description) searchFields.push('description')
      if (filters.category) searchFields.push('category')

      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
        fields: searchFields.join(',')
      })

      if (searchQuery.trim()) {
        queryParams.set('q', searchQuery.trim())
      }

      if (selectedCategory) {
        queryParams.set('category', selectedCategory)
      }
      
      // Add sorting parameters
      if (sortConfig.sortBy) {
        queryParams.set('sortBy', sortConfig.sortBy)
      }
      if (sortConfig.sortOrder) {
        queryParams.set('sortOrder', sortConfig.sortOrder)
      }

      const response = await fetch(`/api/diseases?${queryParams}`)
      if (response.ok) {
        const data = await response.json() as DiseasesResponse
        
        if (reset) {
          setDiseases(data.results || [])
        } else {
          setDiseases(prev => [...prev, ...(data.results || [])])
        }

        setPagination({
          currentPage: page,
          totalCount: data.total || 0,
          hasMore: data.has_more || false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to search diseases:', error)
      setPagination(prev => ({ ...prev, loading: false }))
    }
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !pagination.loading) {
      const nextPage = pagination.currentPage + 1
      setPagination(prev => ({ ...prev, currentPage: nextPage }))
      updateUrlParams({ page: nextPage })
      
      if (searchQuery.trim() !== '' || selectedCategory) {
        searchDiseases(false)
      } else {
        loadDiseases(false)
      }
    }
  }

  const handleFilterChange = (key: keyof SearchFilters) => {
    const newFilters = { [key]: !filters[key] }
    setFilters(prev => ({ ...prev, ...newFilters }))
    updateUrlParams({ filters: newFilters, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder: 'asc' | 'desc' = sortConfig.sortBy === newSortBy && sortConfig.sortOrder === 'asc' ? 'desc' : 'asc'
    const newSortConfig = { sortBy: newSortBy, sortOrder: newSortOrder }
    setSortConfig(newSortConfig)
    updateUrlParams({ sortBy: newSortBy, sortOrder: newSortOrder, page: 1 })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleDeleteDisease = async (diseaseId: number) => {
    try {
      setDeletingDiseaseId(diseaseId)
      
      const response = await fetch(`/api/diseases/${diseaseId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setDiseases(prev => prev.filter(disease => disease.id !== diseaseId))
        setPagination(prev => ({ 
          ...prev, 
          totalCount: Math.max(0, prev.totalCount - 1) 
        }))
        onDeleteDisease(diseaseId)
      } else {
        console.error('Failed to delete disease')
        alert('Failed to delete disease. Please try again.')
      }
    } catch (error) {
      console.error('Delete disease error:', error)
      alert('Failed to delete disease. Please try again.')
    } finally {
      setDeletingDiseaseId(null)
    }
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
        <h2 className="text-2xl font-bold">Diseases</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowCreateDisease}
            className="btn-primary flex items-center gap-2"
            title="Add a disease manually"
          >
            <Plus size={18} />
            Add Disease
          </button>
          <button
            onClick={onShowImportDiseases}
            className={`btn-secondary flex items-center gap-2 ${importingDiseases ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={importingDiseases}
            title="Import diseases from JSON"
          >
            <Plus size={18} />
            {importingDiseases ? 'Importing…' : 'Import'}
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              updateUrlParams({ q: e.target.value, page: 1 })
              setPagination(prev => ({ ...prev, currentPage: 1 }))
            }}
            className="input-field pl-10 pr-10"
            placeholder="Search diseases... (min 2 characters)"
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
            Showing {diseases.length} of {pagination.totalCount} diseases
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-700 mb-3">Search in:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.code}
                  onChange={() => handleFilterChange('code')}
                  className="mr-2"
                />
                ICD Code
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.name}
                  onChange={() => handleFilterChange('name')}
                  className="mr-2"
                />
                Disease Name
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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category}
                  onChange={() => handleFilterChange('category')}
                  className="mr-2"
                />
                Category
              </label>
            </div>
          </div>
        )}

        {/* Sorting Options */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium text-gray-700 mb-3">Sort by:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'code', label: 'ICD Code' },
              { key: 'name', label: 'Disease Name' },
              { key: 'description', label: 'Description' },
              { key: 'category', label: 'Category' },
              { key: 'created_at', label: 'Date Added' },
              { key: 'updated_at', label: 'Last Modified' }
            ].map(({ key, label }) => {
              const isActive = sortConfig.sortBy === key
              const isAsc = isActive && sortConfig.sortOrder === 'asc'
              const isDesc = isActive && sortConfig.sortOrder === 'desc'
              
              return (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                  {isActive ? (
                    isAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : (
                    <ArrowUpDown size={14} className="text-gray-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
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
        {diseases.map(disease => (
          <div key={disease.id} className="card relative group">
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditDisease(disease)}
                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                title="Edit disease"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDeleteDisease(disease.id)}
                disabled={deletingDiseaseId === disease.id}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                title="Delete disease"
              >
                {deletingDiseaseId === disease.id ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>

            <div className="font-medium pr-16">{disease.name || 'Unknown Disease'}</div>
            {disease.code && (
              <div className="text-sm text-gray-600">Code: {disease.code}</div>
            )}
            {disease.category && (
              <button
                onClick={() => handleCategoryClick(disease.category!)}
                className={`inline-block text-xs px-2 py-1 rounded mt-2 transition-colors cursor-pointer ${
                  selectedCategory === disease.category
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900'
                }`}
                title={`Filter by category: ${disease.category}`}
              >
                {disease.category}
              </button>
            )}
            {disease.description && (
              <div className="text-sm text-gray-500 mt-2 line-clamp-2">{disease.description}</div>
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
                Load More ({pagination.totalCount - diseases.length} remaining)
              </>
            )}
          </button>
        </div>
      )}

      {/* No Results */}
      {diseases.length === 0 && !pagination.loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchQuery || selectedCategory ? `No diseases found` : 'No diseases found'}
          </div>
          {(searchQuery || selectedCategory) && (
            <button onClick={clearSearch} className="btn-secondary mt-4">
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  )
}
