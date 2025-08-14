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
  const [medications, setMedications] = useState<PrescriptionItem[]>([{
    medication_id: 0,
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }])
  const [therapies, setTherapies] = useState<TherapyItem[]>([])
  const [selectedDiseases, setSelectedDiseases] = useState<number[]>([])
  const [selectedDiseaseObjects, setSelectedDiseaseObjects] = useState<Disease[]>([])
  const [selectedFindings, setSelectedFindings] = useState<number[]>([])
  const [selectedFindingObjects, setSelectedFindingObjects] = useState<Finding[]>([])

  const handleAddMedication = () => {
    setMedications([...medications, {
      medication_id: 0,
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }])
  }

  const handleAddTherapy = () => {
    setTherapies([...therapies, {
      therapy_id: 0,
      therapy_name: '',
      procedure: '',
      timing: '',
      duration: '',
      instructions: ''
    }])
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a prescription name')
      return
    }

    const validMedications = medications.filter(med => 
      (med.medication_id || 0) > 0 && 
      med.dosage.trim() && 
      med.frequency.trim() && 
      med.duration.trim()
    )

    const validTherapies = therapies.filter(therapy => 
      (therapy.therapy_id || 0) > 0 && 
      therapy.procedure.trim() && 
      therapy.timing.trim() && 
      therapy.duration.trim()
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
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions
      })),
      ...validTherapies.map(therapy => ({
        medication_id: undefined,
        therapy_id: therapy.therapy_id,
        dosage: therapy.procedure, // Use procedure as dosage equivalent
        frequency: therapy.timing, // Use timing as frequency equivalent
        duration: therapy.duration,
        instructions: therapy.instructions
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
                rows={3}
                placeholder="Brief description of this prescription template"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Medications</h3>
                <p className="text-sm text-gray-600">Drugs to be dispensed from pharmacy</p>
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Add Medication
              </button>
            </div>

            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Medication {index + 1}</h4>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drug *
                      </label>
                      <DrugSearch
                        selectedDrugId={medication.medication_id || 0}
                        onDrugSelect={(drugId, drugName) => handleDrugSelect(index, drugId, drugName)}
                        placeholder="Search for a drug (min 3 characters)..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
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
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
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
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
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
                      value={medication.instructions || ''}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Take with food, Before bedtime"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Therapies Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Immediate Therapies</h3>
                <p className="text-sm text-gray-600">Treatments to be performed immediately in hospital</p>
              </div>
              <button
                type="button"
                onClick={handleAddTherapy}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Add Therapy
              </button>
            </div>

            {therapies.length > 0 && (
              <div className="space-y-4">
                {therapies.map((therapy, index) => (
                  <div key={index} className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-blue-800">Therapy {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveTherapy(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Therapy *
                        </label>
                        <TherapySearch
                          selectedTherapyId={therapy.therapy_id || 0}
                          onTherapySelect={(therapyId, therapyName) => handleTherapySelect(index, therapyId, therapyName)}
                          placeholder="Search for a therapy (min 3 characters)..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Procedure *
                        </label>
                        <input
                          type="text"
                          value={therapy.procedure}
                          onChange={(e) => handleTherapyChange(index, 'procedure', e.target.value)}
                          className="input-field"
                          placeholder="e.g., IV injection, Nebulization"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Timing *
                        </label>
                        <input
                          type="text"
                          value={therapy.timing}
                          onChange={(e) => handleTherapyChange(index, 'timing', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Immediately, Every 4 hours"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Duration *
                        </label>
                        <input
                          type="text"
                          value={therapy.duration}
                          onChange={(e) => handleTherapyChange(index, 'duration', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Single dose, 30 minutes"
                          required
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
                        placeholder="e.g., Monitor vital signs, Patient positioning"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
