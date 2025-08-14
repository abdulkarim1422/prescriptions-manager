import { useState } from 'react'
import { X } from 'lucide-react'
import { CreateTherapyRequest } from '../types'

interface CreateTherapyModalProps {
  onSubmit: (data: CreateTherapyRequest) => void
  onClose: () => void
}

export function CreateTherapyModal({ onSubmit, onClose }: CreateTherapyModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [activeIngredient, setActiveIngredient] = useState('')
  const [dosageForm, setDosageForm] = useState('')
  const [strength, setStrength] = useState('')
  const [manufacturer, setManufacturer] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a therapy name')
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      active_ingredient: activeIngredient.trim() || undefined,
      dosage_form: dosageForm.trim() || undefined,
      strength: strength.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Therapy</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Therapy Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Metpamid, Buscopan"
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
              placeholder="Brief description of this therapy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="General">General</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Neurological">Neurological</option>
              <option value="Endocrine">Endocrine</option>
              <option value="Anti-inflammatory">Anti-inflammatory</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Pain Relief">Pain Relief</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Ingredient
            </label>
            <input
              type="text"
              value={activeIngredient}
              onChange={(e) => setActiveIngredient(e.target.value)}
              className="input-field"
              placeholder="e.g., Metoclopramide, Hyoscine butylbromide"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage Form
              </label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="input-field"
              >
                <option value="">Select form</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Suspension">Suspension</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drop">Drop</option>
                <option value="Patch">Patch</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strength
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="input-field"
                placeholder="e.g., 10mg, 5ml"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="input-field"
              placeholder="e.g., Generic Pharma, Boehringer Ingelheim"
            />
          </div>

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
              Create Therapy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
