import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Disease, CreatePrescriptionRequest, Therapy } from '../types'
import { DrugSearch } from './DrugSearch'
import { TherapySearch } from './TherapySearch'
import { DiseaseSearch } from './DiseaseSearch'
import { FindingsSearch } from './FindingsSearch'
import { Finding } from './FindingsView'

interface CreatePrescriptionModalProps {
  diseases: Disease[]
  onSubmit: (data: CreatePrescriptionRequest) => void
  onClose: () => void
}

interface PrescriptionItem {
  medication_id?: number
  therapy_id?: number
  medication_name?: string
  therapy_name?: string
  item_type: 'medication' | 'therapy'
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export function CreatePrescriptionModal({ diseases, onSubmit, onClose }: CreatePrescriptionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<PrescriptionItem[]>([{
    medication_id: 0,
    medication_name: '',
    item_type: 'medication',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }])
  const [selectedDiseases, setSelectedDiseases] = useState<number[]>([])
  const [selectedDiseaseObjects, setSelectedDiseaseObjects] = useState<Disease[]>([])
  const [selectedFindings, setSelectedFindings] = useState<number[]>([])
  const [selectedFindingObjects, setSelectedFindingObjects] = useState<Finding[]>([])

  const handleAddItem = () => {
    setItems([...items, {
      medication_id: 0,
      medication_name: '',
      item_type: 'medication',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const handleDrugSelect = (index: number, drugId: number, drugName: string) => {
    const updatedItems = [...items]
    updatedItems[index] = { 
      ...updatedItems[index], 
      medication_id: drugId,
      medication_name: drugName,
      therapy_id: undefined,
      therapy_name: undefined,
      item_type: 'medication'
    }
    setItems(updatedItems)
  }

  const handleTherapySelect = (index: number, therapyId: number, therapyName: string) => {
    const updatedItems = [...items]
    updatedItems[index] = { 
      ...updatedItems[index], 
      therapy_id: therapyId,
      therapy_name: therapyName,
      medication_id: undefined,
      medication_name: undefined,
      item_type: 'therapy'
    }
    setItems(updatedItems)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a prescription name')
      return
    }

    const validItems = items.filter(item => 
      (item.item_type === 'medication' && (item.medication_id || 0) > 0) ||
      (item.item_type === 'therapy' && (item.therapy_id || 0) > 0) &&
      item.dosage.trim() && 
      item.frequency.trim() && 
      item.duration.trim()
    )

    if (validItems.length === 0) {
      alert('Please add at least one valid medication')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      items: validItems.map(item => ({
        medication_id: item.item_type === 'medication' ? item.medication_id : undefined,
        therapy_id: item.item_type === 'therapy' ? item.therapy_id : undefined,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions
      })),
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
                rows={3}
                placeholder="Brief description of this prescription template"
              />
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Medications</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Add Medication
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Medication {index + 1}</h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        value={item.item_type}
                        onChange={(e) => handleItemChange(index, 'item_type', e.target.value as 'medication' | 'therapy')}
                        className="input-field"
                        required
                      >
                        <option value="medication">Medication</option>
                        <option value="therapy">Therapy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {item.item_type === 'medication' ? 'Medication' : 'Therapy'} *
                      </label>
                      {item.item_type === 'medication' ? (
                        <DrugSearch
                          selectedDrugId={item.medication_id || 0}
                          onDrugSelect={(drugId, drugName) => handleDrugSelect(index, drugId, drugName)}
                          placeholder="Search for a drug (min 3 characters)..."
                          required
                        />
                      ) : (
                        <TherapySearch
                          selectedTherapyId={item.therapy_id || 0}
                          onTherapySelect={(therapyId, therapyName) => handleTherapySelect(index, therapyId, therapyName)}
                          placeholder="Search for a therapy (min 3 characters)..."
                          required
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                        className="input-field"
                        placeholder="e.g., 1 tablet, 5ml"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency *
                      </label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Twice daily, Every 8 hours"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration *
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                        className="input-field"
                        placeholder="e.g., 7 days, 2 weeks"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      value={item.instructions || ''}
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Take with food, Before bedtime"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Associated Diseases */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Associated Diseases/Conditions (Optional)</h3>
            <p className="text-sm text-gray-600">
              Search and select diseases or conditions that this prescription template is commonly used for.
            </p>
            <DiseaseSearch
              selectedDiseaseIds={selectedDiseases}
              onDiseasesChange={handleDiseasesChange}
              placeholder="Search for diseases/conditions (min 2 characters)..."
              multiple={true}
              maxSelections={10}
            />
          </div>

          {/* Associated Findings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Associated Findings (Optional)</h3>
            <p className="text-sm text-gray-600">
              Search and select clinical findings that this prescription template is commonly used for.
            </p>
            <FindingsSearch
              selectedFindingIds={selectedFindings}
              onFindingsChange={handleFindingsChange}
              placeholder="Search for findings (min 2 characters)..."
              multiple={true}
              maxSelections={10}
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
              Create Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
