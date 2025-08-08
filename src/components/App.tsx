import { useState, useEffect } from 'react'
import { Search, Plus, Settings, FileText, Pill, Stethoscope } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { PrescriptionCard } from './PrescriptionCard'
import { CreatePrescriptionModal } from './CreatePrescriptionModal'
import { ConfigPanel } from './ConfigPanel'
import { PrescriptionTemplate, Disease, Medication, SearchRequest } from '../types'

export function PrescriptionsApp() {
  const [currentView, setCurrentView] = useState<'search' | 'prescriptions' | 'diseases' | 'medications' | 'settings'>('search')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionTemplate[]>([])
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({ ai_enabled: true })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [prescriptionsRes, diseasesRes, medicationsRes, configRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/diseases'),
        fetch('/api/medications'),
        fetch('/api/config/ai_enabled').catch(() => ({ ok: false }))
      ])

      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json() as any
        setPrescriptions(Array.isArray(data.results) ? data.results : [])
      }

      if (diseasesRes.ok) {
        const data = await diseasesRes.json() as any
        setDiseases(Array.isArray(data.results) ? data.results : [])
      }

      if (medicationsRes.ok) {
        const data = await medicationsRes.json() as any
        setMedications(Array.isArray(data.results) ? data.results : [])
      }

      if (configRes.ok && 'json' in configRes) {
        const configData = await configRes.json() as any
        setConfig(prev => ({ ...prev, ai_enabled: configData.value === 'true' }))
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string, type: SearchRequest['type']) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          type,
          ai_enabled: config.ai_enabled
        })
      })

      if (response.ok) {
        const data = await response.json() as any
        // Ensure we have valid results data
        if (data && data.results) {
          setSearchResults(data.results)
        } else {
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrescription = async (prescriptionData: any) => {
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      })

      if (response.ok) {
        const newPrescription = await response.json() as any
        if (newPrescription && typeof newPrescription === 'object') {
          setPrescriptions(prev => [...prev, newPrescription as PrescriptionTemplate])
        }
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create prescription:', error)
    }
  }

  const handleDeletePrescription = async (id: number) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPrescriptions(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete prescription:', error)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Search Prescriptions</h2>
              <SearchBar 
                onSearch={handleSearch}
                loading={loading}
                placeholder="Search for diseases, medications, or prescriptions..."
              />
            </div>
            
            {(Array.isArray(searchResults) ? searchResults.length > 0 : Object.keys(searchResults).length > 0) && (
              <div className="card">
                <h3 className="text-lg font-medium mb-4">Search Results</h3>
                <div className="space-y-4">
                  {Array.isArray(searchResults) ? 
                    searchResults.map((result, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium">{result.name}</h4>
                        <p className="text-sm text-gray-600">{result.description || result.code}</p>
                      </div>
                    )) : 
                    Object.entries(searchResults).map(([type, results]) => (
                      <div key={type} className="space-y-2">
                        <h4 className="font-medium capitalize">{type}</h4>
                        {Array.isArray(results) && results.map((item, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.description || item.code}</div>
                          </div>
                        ))}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )

      case 'prescriptions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Prescription Templates</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                Create New
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prescriptions.map(prescription => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  onDelete={handleDeletePrescription}
                />
              ))}
            </div>
          </div>
        )

      case 'diseases':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Diseases & Conditions</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {diseases.map(disease => (
                <div key={disease.id} className="card">
                  <div className="font-medium">{disease.name}</div>
                  <div className="text-sm text-gray-600">ICD-10: {disease.code}</div>
                  {disease.description && (
                    <div className="text-sm text-gray-500 mt-2">{disease.description}</div>
                  )}
                  {disease.category && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                      {disease.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'medications':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Medications</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {medications.map(medication => (
                <div key={medication.id} className="card">
                  <div className="font-medium">{medication.name}</div>
                  {medication.generic_name && (
                    <div className="text-sm text-gray-600">Generic: {medication.generic_name}</div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {medication.dosage_form} {medication.strength}
                  </div>
                  {medication.category && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                      {medication.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <ConfigPanel config={config} onConfigChange={setConfig} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <FileText className="text-primary-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">Prescriptions Manager</h1>
            </div>
            
            <nav className="flex gap-1">
              <button
                onClick={() => setCurrentView('search')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'search' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search size={18} />
                Search
              </button>
              
              <button
                onClick={() => setCurrentView('prescriptions')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'prescriptions' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText size={18} />
                Prescriptions
              </button>
              
              <button
                onClick={() => setCurrentView('diseases')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'diseases' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Stethoscope size={18} />
                Diseases
              </button>
              
              <button
                onClick={() => setCurrentView('medications')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'medications' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Pill size={18} />
                Medications
              </button>
              
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings size={18} />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && currentView === 'search' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        
        {renderContent()}
      </main>

      {showCreateModal && (
        <CreatePrescriptionModal
          medications={medications}
          diseases={diseases}
          onSubmit={handleCreatePrescription}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
