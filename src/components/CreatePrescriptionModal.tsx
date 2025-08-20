import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Disease, CreatePrescriptionRequest, Therapy } from '../types'
import { DrugSearch } from './DrugSearch'
import { TherapySearch } from './TherapySearch'
import { DrugAddSearch } from './DrugAddSearch'
import { TherapyAddSearch } from './TherapyAddSearch'
import { DiseaseSearch } from './DiseaseSearch'
import { FindingsSearch } from './FindingsSearch'
import { Finding } from './FindingsView'
import { CreateDrugModal } from './CreateDrugModal'
import { CreateTherapyModal } from './CreateTherapyModal'
import { CreateDiseaseModal } from './CreateDiseaseModal'
import { CreateFindingModal } from './CreateFindingModal'

interface CreatePrescriptionModalProps {
  diseases: Disease[]
  onSubmit: (data: CreatePrescriptionRequest) => void
  onClose: () => void
}

interface PrescriptionItem {
  medication_id?: number
  medication_name?: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface TherapyItem {
  therapy_id?: number
  therapy_name?: string
  procedure: string
  timing: string
  duration: string
  instructions?: string
}

export function CreatePrescriptionModal({ diseases, onSubmit, onClose }: CreatePrescriptionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [medications, setMedications] = useState<PrescriptionItem[]>([])
  const [therapies, setTherapies] = useState<TherapyItem[]>([])
  const [selectedDiseases, setSelectedDiseases] = useState<number[]>([])
  const [selectedDiseaseObjects, setSelectedDiseaseObjects] = useState<Disease[]>([])
  const [selectedFindings, setSelectedFindings] = useState<number[]>([])
  const [selectedFindingObjects, setSelectedFindingObjects] = useState<Finding[]>([])

  // Create modal states
  const [showCreateDrugModal, setShowCreateDrugModal] = useState(false)
  const [showCreateTherapyModal, setShowCreateTherapyModal] = useState(false)
  const [showCreateDiseaseModal, setShowCreateDiseaseModal] = useState(false)
  const [showCreateFindingModal, setShowCreateFindingModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  


  const handleAddMedicationFromSearch = (drugId: number, drugName: string) => {
    const newMedication: PrescriptionItem = {
      medication_id: drugId,
      medication_name: drugName,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
    setMedications([...medications, newMedication])
  }

  const handleAddTherapyFromSearch = (therapyId: number, therapyName: string) => {
    const newTherapy: TherapyItem = {
      therapy_id: therapyId,
      therapy_name: therapyName,
      procedure: '',
      timing: '',
      duration: '',
      instructions: ''
    }
    setTherapies([...therapies, newTherapy])
  }

  const handleRemoveMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const handleRemoveTherapy = (index: number) => {
    setTherapies(therapies.filter((_, i) => i !== index))
  }

  const handleMedicationChange = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = { ...updatedMedications[index], [field]: value }
    setMedications(updatedMedications)
  }

  const handleTherapyChange = (index: number, field: keyof TherapyItem, value: string | number) => {
    const updatedTherapies = [...therapies]
    updatedTherapies[index] = { ...updatedTherapies[index], [field]: value }
    setTherapies(updatedTherapies)
  }

  const handleDrugSelect = (index: number, drugId: number, drugName: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = { 
      ...updatedMedications[index], 
      medication_id: drugId,
      medication_name: drugName
    }
    setMedications(updatedMedications)
  }

  const handleTherapySelect = (index: number, therapyId: number, therapyName: string) => {
    const updatedTherapies = [...therapies]
    updatedTherapies[index] = { 
      ...updatedTherapies[index], 
      therapy_id: therapyId,
      therapy_name: therapyName
    }
    setTherapies(updatedTherapies)
  }

  const handleDiseaseToggle = (diseaseId: number) => {
    setSelectedDiseases(prev => 
      prev.includes(diseaseId)
        ? prev.filter(id => id !== diseaseId)
        : [...prev, diseaseId]
    )
  }

  const handleDiseasesChange = (diseaseIds: number[], diseases: Disease[]) => {
    setSelectedDiseases(diseaseIds)
    setSelectedDiseaseObjects(diseases)
  }

  const handleFindingsChange = (findingIds: number[], findings: Finding[]) => {
    setSelectedFindings(findingIds)
    setSelectedFindingObjects(findings)
  }

  // Add new handlers
  const handleAddNewDrug = (searchTerm: string) => {
    setNewItemName(searchTerm)
    setShowCreateDrugModal(true)
  }

  const handleAddNewTherapy = (searchTerm: string) => {
    setNewItemName(searchTerm)
    setShowCreateTherapyModal(true)
  }

  const handleAddNewDisease = (searchTerm: string) => {
    setNewItemName(searchTerm)
    setShowCreateDiseaseModal(true)
  }

  const handleAddNewFinding = (searchTerm: string) => {
    setNewItemName(searchTerm)
    setShowCreateFindingModal(true)
  }

  const handleDrugCreated = (newDrug: any) => {
    if (newDrug && newDrug.id) {
      handleAddMedicationFromSearch(newDrug.id, newDrug.product_name || newDrug.name)
    }
    setShowCreateDrugModal(false)
    setNewItemName('')
  }

  const handleTherapyCreated = (newTherapy: any) => {
    handleAddTherapyFromSearch(newTherapy.id, newTherapy.name)
    setShowCreateTherapyModal(false)
    setNewItemName('')
  }

  const handleDiseaseCreated = (newDisease: any) => {
    setSelectedDiseases(prev => [...prev, newDisease.id])
    setSelectedDiseaseObjects(prev => [...prev, newDisease])
    setShowCreateDiseaseModal(false)
    setNewItemName('')
  }

  const handleFindingCreated = (newFinding: any) => {
    setSelectedFindings(prev => [...prev, newFinding.id])
    setSelectedFindingObjects(prev => [...prev, newFinding])
    setShowCreateFindingModal(false)
    setNewItemName('')
  }

  // Quick add handlers
  const handleQuickAddMedication = (medicationName: string) => {
    const newMedication: PrescriptionItem = {
      medication_id: undefined,
      medication_name: medicationName,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
    setMedications([...medications, newMedication])
  }

  const handleQuickAddTherapy = (therapyName: string) => {
    const newTherapy: TherapyItem = {
      therapy_id: undefined,
      therapy_name: therapyName,
      procedure: '',
      timing: '',
      duration: '',
      instructions: ''
    }
    setTherapies([...therapies, newTherapy])
  }

  // Quick add handlers for diseases and findings
  const handleQuickAddDisease = async (diseaseName: string) => {
    try {
      // Create the disease through API
      const response = await fetch('/api/diseases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: diseaseName,
          code: `QUICK_${Date.now()}`,
          description: `Quick added disease: ${diseaseName}`
        })
      })
      
      if (response.ok) {
        const newDisease = await response.json() as Disease
        // Add to both arrays
        setSelectedDiseases(prev => [...prev, newDisease.id])
        setSelectedDiseaseObjects(prev => [...prev, newDisease])
      } else {
        console.error('Failed to create disease')
        alert('Failed to create disease. Please try again.')
      }
    } catch (error) {
      console.error('Error creating disease:', error)
      alert('Error creating disease. Please try again.')
    }
  }

  const handleQuickAddFinding = async (findingName: string) => {
    try {
      // Create the finding through API
      const response = await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: findingName,
          code: `QUICK_${Date.now()}`,
          description: `Quick added finding: ${findingName}`
        })
      })
      
      if (response.ok) {
        const newFinding = await response.json() as Finding
        // Add to both arrays
        setSelectedFindings(prev => [...prev, Number(newFinding.id)])
        setSelectedFindingObjects(prev => [...prev, newFinding])
      } else {
        console.error('Failed to create finding')
        alert('Failed to create finding. Please try again.')
      }
    } catch (error) {
      console.error('Error creating finding:', error)
      alert('Error creating finding. Please try again.')
    }
  }



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a prescription name')
      return
    }

    // Only require medication_id/therapy_id to be present
    const validMedications = medications.filter(med => 
      (med.medication_id || 0) > 0
    )

    const validTherapies = therapies.filter(therapy => 
      (therapy.therapy_id || 0) > 0
    )

    if (validMedications.length === 0 && validTherapies.length === 0) {
      alert('Please add at least one medication or therapy')
      return
    }

    // Combine medications and therapies into the items array
    const allItems = [
      ...validMedications.map(med => ({
        medication_id: med.medication_id,
        therapy_id: undefined,
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.instructions || ''
      })),
      ...validTherapies.map(therapy => ({
        medication_id: undefined,
        therapy_id: therapy.therapy_id,
        dosage: therapy.procedure || '', // Use procedure as dosage equivalent
        frequency: therapy.timing || '', // Use timing as frequency equivalent
        duration: therapy.duration || '',
        instructions: therapy.instructions || ''
      }))
    ]

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      items: allItems,
      disease_ids: selectedDiseases.length > 0 ? selectedDiseases : undefined,
      finding_ids: selectedFindings.length > 0 ? selectedFindings : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Prescription Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prescription Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="e.g., Common Cold Treatment"
                required
              />
            </div>

                         <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Description
               </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Brief description of when to use this prescription template (e.g., 'For common cold symptoms', 'Post-surgery pain management')"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium text-green-800">Medications</h3>
                <span className="text-sm text-green-600">• Drugs to be dispensed from pharmacy</span>
              </div>
                             <DrugAddSearch
                 onDrugAdd={handleAddMedicationFromSearch}
                 placeholder="Search and add medications..."
                 onAddNew={handleAddNewDrug}
                 onQuickAdd={handleQuickAddMedication}
               />
            </div>

            {medications.length > 0 && (
              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <div key={index} className="p-4 border border-green-300 bg-green-100 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-green-800">{medication.medication_name}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                             <div>
                         <label className="block text-sm font-medium text-green-700 mb-1">
                           Dosage
                         </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 1 tablet, 5ml"
                        />
                      </div>

                                             <div>
                         <label className="block text-sm font-medium text-green-700 mb-1">
                           Frequency
                         </label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Twice daily"
                        />
                      </div>

                                             <div>
                         <label className="block text-sm font-medium text-green-700 mb-1">
                           Duration
                         </label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={medication.instructions || ''}
                        onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Take with food, Before bedtime"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Therapies Section */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium text-blue-800">Immediate Therapies</h3>
                <span className="text-sm text-blue-600">• Treatments performed immediately in hospital</span>
              </div>
                             <TherapyAddSearch
                 onTherapyAdd={handleAddTherapyFromSearch}
                 placeholder="Search and add therapies..."
                 onAddNew={handleAddNewTherapy}
                 onQuickAdd={handleQuickAddTherapy}
               />
            </div>

            {therapies.length > 0 && (
              <div className="space-y-4">
                {therapies.map((therapy, index) => (
                  <div key={index} className="p-4 border border-blue-300 bg-blue-100 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-blue-800">{therapy.therapy_name}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveTherapy(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                             <div>
                         <label className="block text-sm font-medium text-blue-700 mb-1">
                           Procedure
                         </label>
                        <input
                          type="text"
                          value={therapy.procedure}
                          onChange={(e) => handleTherapyChange(index, 'procedure', e.target.value)}
                          className="input-field"
                          placeholder="e.g., IV injection"
                        />
                      </div>

                                             <div>
                         <label className="block text-sm font-medium text-blue-700 mb-1">
                           Timing
                         </label>
                        <input
                          type="text"
                          value={therapy.timing}
                          onChange={(e) => handleTherapyChange(index, 'timing', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Immediately"
                        />
                      </div>

                                             <div>
                         <label className="block text-sm font-medium text-blue-700 mb-1">
                           Duration
                         </label>
                        <input
                          type="text"
                          value={therapy.duration}
                          onChange={(e) => handleTherapyChange(index, 'duration', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Single dose"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={therapy.instructions || ''}
                        onChange={(e) => handleTherapyChange(index, 'instructions', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Monitor vital signs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Diseases */}
          <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-purple-800">Associated Diseases/Conditions (Optional)</h3>
            <p className="text-sm text-purple-600">
              Search and select diseases or conditions that this prescription template is commonly used for.
            </p>
            <DiseaseSearch
              selectedDiseaseIds={selectedDiseases}
              onDiseasesChange={handleDiseasesChange}
              placeholder="Search for diseases/conditions (min 2 characters)..."
              multiple={true}
              maxSelections={10}
              onAddNew={handleAddNewDisease}
              onQuickAdd={handleQuickAddDisease}
              selectedDiseaseObjects={selectedDiseaseObjects}
            />
          </div>

          {/* Associated Findings */}
          <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-orange-800">Associated Findings (Optional)</h3>
            <p className="text-sm text-orange-600">
              Search and select clinical findings that this prescription template is commonly used for.
            </p>
            <FindingsSearch
              selectedFindingIds={selectedFindings}
              onFindingsChange={handleFindingsChange}
              placeholder="Search for findings (min 2 characters)..."
              multiple={true}
              maxSelections={10}
              onAddNew={handleAddNewFinding}
              onQuickAdd={handleQuickAddFinding}
              selectedFindingObjects={selectedFindingObjects}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Prescription Template
            </button>
          </div>
        </form>
      </div>

      {/* Create Modals */}
      {showCreateDrugModal && (
        <CreateDrugModal
          onClose={() => {
            setShowCreateDrugModal(false)
            setNewItemName('')
          }}
          onCreated={handleDrugCreated}
          initialName={newItemName}
        />
      )}

      {showCreateTherapyModal && (
        <CreateTherapyModal
          onSubmit={(data) => {
            handleTherapyCreated(data)
          }}
          onClose={() => {
            setShowCreateTherapyModal(false)
            setNewItemName('')
          }}
          initialName={newItemName}
        />
      )}

      {showCreateDiseaseModal && (
        <CreateDiseaseModal
          onClose={() => {
            setShowCreateDiseaseModal(false)
            setNewItemName('')
          }}
          onCreated={(disease) => {
            handleDiseaseCreated(disease)
          }}
          initialName={newItemName}
        />
      )}

      {showCreateFindingModal && (
        <CreateFindingModal
          onAdd={(finding) => {
            handleFindingCreated(finding)
          }}
          onClose={() => {
            setShowCreateFindingModal(false)
            setNewItemName('')
          }}
          initialName={newItemName}
        />
      )}
    </div>
  )
}
