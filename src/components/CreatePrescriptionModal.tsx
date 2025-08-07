import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Medication, Disease, CreatePrescriptionRequest } from '../types'

interface CreatePrescriptionModalProps {
  medications: Medication[]
  diseases: Disease[]
  onSubmit: (data: CreatePrescriptionRequest) => void
  onClose: () => void
}

interface PrescriptionItem {
  medication_id: number
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export function CreatePrescriptionModal({ medications, diseases, onSubmit, onClose }: CreatePrescriptionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<PrescriptionItem[]>([{
    medication_id: 0,
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }])
  const [selectedDiseases, setSelectedDiseases] = useState<number[]>([])

  const handleAddItem = () => {
    setItems([...items, {
      medication_id: 0,
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

  const handleDiseaseToggle = (diseaseId: number) => {
    setSelectedDiseases(prev => 
      prev.includes(diseaseId)
        ? prev.filter(id => id !== diseaseId)
        : [...prev, diseaseId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a prescription name')
      return
    }

    const validItems = items.filter(item => 
      item.medication_id > 0 && 
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
      items: validItems,
      disease_ids: selectedDiseases.length > 0 ? selectedDiseases : undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Prescription Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                        Medication *
                      </label>
                      <select
                        value={item.medication_id}
                        onChange={(e) => handleItemChange(index, 'medication_id', parseInt(e.target.value))}
                        className="input-field"
                        required
                      >
                        <option value={0}>Select medication</option>
                        {medications.map(med => (
                          <option key={med.id} value={med.id}>
                            {med.name} ({med.strength} {med.dosage_form})
                          </option>
                        ))}
                      </select>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {diseases.map(disease => (
                <label key={disease.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDiseases.includes(disease.id)}
                    onChange={() => handleDiseaseToggle(disease.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">
                    {disease.name} ({disease.code})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
