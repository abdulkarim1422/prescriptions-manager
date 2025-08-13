import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Search, Plus, Settings, FileText, Pill, Stethoscope, ChevronDown } from 'lucide-react'
import { CreateDrugModal } from './CreateDrugModal'
import { EditDrugModal } from './EditDrugModal'
import { ImportDrugsModal } from './ImportDrugsModal'
import { CreateDiseaseModal } from './CreateDiseaseModal'
import { EditDiseaseModal } from './EditDiseaseModal'
import { ImportDiseasesModal } from './ImportDiseasesModal'
import { SearchBar } from './SearchBar'
import { PrescriptionCard } from './PrescriptionCard'
import { CreatePrescriptionModal } from './CreatePrescriptionModal'
import { ConfigPanel } from './ConfigPanel'
import { MedicationsView } from './MedicationsView'
import { DiseasesView } from './DiseasesView'
import { FindingsView } from './FindingsView'
import { PrescriptionTemplate, Disease, Medication, Drug, SearchRequest } from '../types'

export function PrescriptionsApp() {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionTemplate[]>([])
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({ ai_enabled: true })
  const [importingDrugs, setImportingDrugs] = useState(false)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [showCreateDrug, setShowCreateDrug] = useState(false)
  const [showImportDrugs, setShowImportDrugs] = useState(false)
  const [showEditDrug, setShowEditDrug] = useState(false)
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null)
  
  // Disease-related state
  const [showCreateDisease, setShowCreateDisease] = useState(false)
  const [showImportDiseases, setShowImportDiseases] = useState(false)
  const [showEditDisease, setShowEditDisease] = useState(false)
  const [editingDisease, setEditingDisease] = useState<Disease | null>(null)
  const [importingDiseases, setImportingDiseases] = useState(false)
  const [diseasesImportSummary, setDiseasesImportSummary] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [prescriptionsRes, diseasesRes, medicationsRes, drugsRes, configRes] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/diseases'),
        fetch('/api/medications'),
        fetch('/api/drugs'),
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

      if (drugsRes.ok) {
        const data = await drugsRes.json() as any
        setDrugs(Array.isArray(data.results) ? data.results : [])
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

  const reloadDrugs = async () => {
    try {
      const drugsRes = await fetch('/api/drugs')
      if (drugsRes.ok) {
        const data = await drugsRes.json() as any
        setDrugs(Array.isArray(data.results) ? data.results : [])
      }
    } catch (error) {
      console.error('Failed to reload drugs:', error)
    }
  }

  const handleImportDrugs = async (items: any[], options: any) => {
    // The ImportDrugsModal now handles the actual import
    // This function just receives the final summary for backward compatibility
    
    if (options && typeof options.imported === 'number') {
      // New enhanced modal passed summary info
      setImportSummary(
        `Successfully imported ${options.imported} drugs. ${options.errors || 0} errors.`
      )
      setTimeout(() => setImportSummary(null), 10000) // Clear after 10 seconds
      await reloadDrugs() // Reload to show imported data
      return
    }

    // Legacy support for old modal behavior (if needed)
    try {
      setImportingDrugs(true)
      setImportSummary(null)

      const normalized = items.map((it) => {
        const categories: string[] = []
        Object.keys(it || {}).forEach((key) => {
          if (/^Category_\d+$/i.test(key) && it[key]) {
            categories.push(String(it[key]).trim())
          }
        })

        return {
          barcode: options.includeBarcode ? (it.barcode || it.Barcode || it.BARCODE || undefined) : undefined,
          atc_code: options.includeATC ? (it.ATC_code || it.atc_code || it.ATC || undefined) : undefined,
          active_ingredient: options.includeActiveIngredient ? (it.Active_Ingredient || it.active_ingredient || undefined) : undefined,
          product_name: options.includeProductName ? (it.Product_Name || it.product_name || undefined) : undefined,
          categories: options.includeCategories && categories.length > 0 ? categories : undefined,
          description: options.includeDescription ? (it.Description || it.description || undefined) : undefined,
        }
      })

      const res = await fetch('/api/drugs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: normalized, replace_existing: options.replaceExisting })
      })
      
      if (!res.ok) throw new Error('Import failed')
      
      const result = (await res.json()) as { inserted?: number; updated?: number }
      setImportSummary(`Imported: ${result.inserted ?? 0}, Updated: ${result.updated ?? 0}`)
      
      // Reload drugs to show the imported data
      await reloadDrugs()
    } catch (err) {
      console.error('Import drugs failed', err)
      setImportSummary('Import failed')
    } finally {
      setImportingDrugs(false)
    }
  }

  const handleEditDrug = (drug: Drug) => {
    setEditingDrug(drug)
    setShowEditDrug(true)
  }

  const handleDrugUpdated = (updatedDrug: Drug) => {
    setDrugs(prev => prev.map(drug => drug.id === updatedDrug.id ? updatedDrug : drug))
    setEditingDrug(null)
    setShowEditDrug(false)
    setImportSummary(`Successfully updated "${updatedDrug.product_name}".`)
    setTimeout(() => setImportSummary(null), 5000)
  }

  const handleDeleteDrug = (drugId: number) => {
    // The actual deletion is handled in MedicationsView
    // This is just for any additional cleanup if needed
    const deletedDrug = drugs.find(d => d.id === drugId)
    if (deletedDrug) {
      setImportSummary(`Successfully deleted "${deletedDrug.product_name}".`)
      setTimeout(() => setImportSummary(null), 5000)
    }
  }

  // Disease handlers
  const handleEditDisease = (disease: Disease) => {
    setEditingDisease(disease)
    setShowEditDisease(true)
  }

  const handleDeleteDisease = async (id: number) => {
    try {
      const response = await fetch(`/api/diseases/${id}`, { method: 'DELETE' })
      if (response.ok) {
        // Reload diseases if needed - the DiseasesView component handles its own state
        console.log('Disease deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete disease:', error)
    }
  }

  const handleDiseaseUpdated = async () => {
    setShowEditDisease(false)
    setEditingDisease(null)
  }

  const handleImportDiseases = async (diseases: any[], options: any) => {
    // The ImportDiseasesModal now handles the actual import
    // This function just receives the final summary
    if (options && typeof options.imported === 'number') {
      setDiseasesImportSummary(
        `Successfully imported ${options.imported} diseases. ${options.errors || 0} errors.`
      )
      setTimeout(() => setDiseasesImportSummary(null), 10000) // Clear after 10 seconds
    }
    setShowImportDiseases(false)
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

  // Search View Component
  const SearchView = () => (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Search Prescriptions</h2>
        <SearchBar 
          onSearch={handleSearch}
          loading={loading}
          placeholder="Search for diseases, medications, or prescriptions..."
        />
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
      
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

  // Prescriptions View Component
  const PrescriptionsView = () => (
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

  // Diseases View Component (wrapper)
  const DiseasesViewWrapper = () => (
    <DiseasesView
      onShowCreateDisease={() => setShowCreateDisease(true)}
      onShowImportDiseases={() => setShowImportDiseases(true)}
      onEditDisease={handleEditDisease}
      onDeleteDisease={handleDeleteDisease}
      importingDiseases={importingDiseases}
      importSummary={diseasesImportSummary}
    />
  )

  // Medications View Component (wrapper)
  const MedicationsViewWrapper = () => (
    <MedicationsView
      onShowCreateDrug={() => setShowCreateDrug(true)}
      onShowImportDrugs={() => setShowImportDrugs(true)}
      onEditDrug={handleEditDrug}
      onDeleteDrug={handleDeleteDrug}
      importingDrugs={importingDrugs}
      importSummary={importSummary}
    />
  )

  // Settings View Component
  const SettingsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <ConfigPanel config={config} onConfigChange={setConfig} />
    </div>
  )

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
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Search size={18} />
                Search
              </NavLink>
              
              <NavLink
                to="/prescriptions"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <FileText size={18} />
                Prescriptions
              </NavLink>
              
              <div className="relative group">
                <div className="px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-default select-none">
                  <Stethoscope size={18} />
                  Diseases & Findings
                  <ChevronDown size={16} className="ml-1" />
                </div>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <NavLink
                    to="/diseases"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg ${isActive ? 'bg-primary-100 text-primary-700' : ''}`
                    }
                  >
                    Diseases
                  </NavLink>
                  <NavLink
                    to="/findings"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg ${isActive ? 'bg-primary-100 text-primary-700' : ''}`
                    }
                  >
                    Findings
                  </NavLink>
                </div>
              </div>
              
              <NavLink
                to="/medications"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Pill size={18} />
                Medications
              </NavLink>
              
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Settings size={18} />
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<SearchView />} />
          <Route path="/prescriptions" element={<PrescriptionsView />} />
          <Route path="/diseases" element={<DiseasesViewWrapper />} />
          <Route path="/findings" element={<FindingsView />} />
          <Route path="/medications" element={<MedicationsViewWrapper />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<SearchView />} />
        </Routes>
      </main>

      {showCreateModal && (
        <CreatePrescriptionModal
          diseases={diseases}
          onSubmit={handleCreatePrescription}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showCreateDrug && (
        <CreateDrugModal
          onClose={() => setShowCreateDrug(false)}
          onCreated={async () => {
            await reloadDrugs()
          }}
        />
      )}

      {showImportDrugs && (
        <ImportDrugsModal
          isOpen={showImportDrugs}
          onClose={() => setShowImportDrugs(false)}
          onImport={handleImportDrugs}
        />
      )}

      {showEditDrug && (
        <EditDrugModal
          drug={editingDrug}
          onClose={() => {
            setShowEditDrug(false)
            setEditingDrug(null)
          }}
          onSave={handleDrugUpdated}
        />
      )}

      {showCreateDisease && (
        <CreateDiseaseModal
          onClose={() => setShowCreateDisease(false)}
          onCreated={() => {
            setShowCreateDisease(false)
          }}
        />
      )}

      {showImportDiseases && (
        <ImportDiseasesModal
          isOpen={showImportDiseases}
          onClose={() => setShowImportDiseases(false)}
          onImport={handleImportDiseases}
        />
      )}

      {showEditDisease && (
        <EditDiseaseModal
          disease={editingDisease}
          onClose={() => {
            setShowEditDisease(false)
            setEditingDisease(null)
          }}
          onSave={handleDiseaseUpdated}
        />
      )}
    </div>
  )
}
