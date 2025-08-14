import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react'
import { Therapy } from '../types'

interface TherapiesViewProps {
  onShowCreateTherapy?: () => void
  onShowImportTherapies?: () => void
  onEditTherapy?: (therapy: Therapy) => void
  onDeleteTherapy?: (therapyId: number) => void
  importingTherapies?: boolean
  importSummary?: string | null
}

export function TherapiesView({
  onShowCreateTherapy,
  onShowImportTherapies,
  onEditTherapy,
  onDeleteTherapy,
  importingTherapies = false,
  importSummary
}: TherapiesViewProps) {
  const [therapies, setTherapies] = useState<Therapy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTherapies, setFilteredTherapies] = useState<Therapy[]>([])

  useEffect(() => {
    loadTherapies()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = therapies.filter(therapy =>
        therapy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapy.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapy.active_ingredient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapy.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredTherapies(filtered)
    } else {
      setFilteredTherapies(therapies)
    }
  }, [searchQuery, therapies])

  const loadTherapies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/therapies')
      if (response.ok) {
        const data = await response.json() as any
        setTherapies(Array.isArray(data.results) ? data.results : [])
      } else {
        console.error('Failed to load therapies')
        setTherapies([])
      }
    } catch (error) {
      console.error('Failed to load therapies:', error)
      setTherapies([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTherapy = async (therapyId: number, therapyName: string) => {
    if (!confirm(`Are you sure you want to delete "${therapyName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/therapies/${therapyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTherapies(prev => prev.filter(therapy => therapy.id !== therapyId))
        onDeleteTherapy?.(therapyId)
      } else {
        alert('Failed to delete therapy')
      }
    } catch (error) {
      console.error('Failed to delete therapy:', error)
      alert('Failed to delete therapy')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Therapies</h2>
        <div className="flex gap-2">
          {onShowImportTherapies && (
            <button
              onClick={onShowImportTherapies}
              className="btn-secondary flex items-center gap-2"
              disabled={importingTherapies}
            >
              <Upload size={16} />
              {importingTherapies ? 'Importing...' : 'Import'}
            </button>
          )}
          {onShowCreateTherapy && (
            <button
              onClick={onShowCreateTherapy}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Therapy
            </button>
          )}
        </div>
      </div>

      {/* Import Summary */}
      {importSummary && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {importSummary}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search therapies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Therapies Grid */}
      {filteredTherapies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery ? 'No therapies found matching your search.' : 'No therapies found.'}
          </div>
          {!searchQuery && onShowCreateTherapy && (
            <button
              onClick={onShowCreateTherapy}
              className="btn-primary"
            >
              Add Your First Therapy
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTherapies.map((therapy) => (
            <div key={therapy.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{therapy.name}</h3>
                <div className="flex gap-1">
                  {onEditTherapy && (
                    <button
                      onClick={() => onEditTherapy(therapy)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit therapy"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTherapy(therapy.id, therapy.name)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete therapy"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {therapy.description && (
                <p className="text-gray-600 text-sm mb-3">{therapy.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {therapy.active_ingredient && (
                  <div>
                    <span className="font-medium">Active Ingredient:</span>
                    <span className="ml-2 text-gray-600">{therapy.active_ingredient}</span>
                  </div>
                )}
                {therapy.dosage_form && (
                  <div>
                    <span className="font-medium">Form:</span>
                    <span className="ml-2 text-gray-600">{therapy.dosage_form}</span>
                  </div>
                )}
                {therapy.strength && (
                  <div>
                    <span className="font-medium">Strength:</span>
                    <span className="ml-2 text-gray-600">{therapy.strength}</span>
                  </div>
                )}
                {therapy.category && (
                  <div>
                    <span className="font-medium">Category:</span>
                    <span className="ml-2 text-gray-600">{therapy.category}</span>
                  </div>
                )}
                {therapy.manufacturer && (
                  <div>
                    <span className="font-medium">Manufacturer:</span>
                    <span className="ml-2 text-gray-600">{therapy.manufacturer}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Created: {new Date(therapy.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
