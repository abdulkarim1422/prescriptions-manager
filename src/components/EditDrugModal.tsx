import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Drug } from '../types'

interface EditDrugModalProps {
  drug: Drug | null
  onClose: () => void
  onSave: (updatedDrug: Drug) => void
}

export function EditDrugModal({ drug, onClose, onSave }: EditDrugModalProps) {
  const [formData, setFormData] = useState({
    product_name: '',
    active_ingredient: '',
    atc_code: '',
    barcode: '',
    description: '',
    categories: [] as string[]
  })
  const [categoriesInput, setCategoriesInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (drug) {
      setFormData({
        product_name: drug.product_name || '',
        active_ingredient: drug.active_ingredient || '',
        atc_code: drug.atc_code || '',
        barcode: drug.barcode || '',
        description: drug.description || '',
        categories: drug.categories || []
      })
      setCategoriesInput((drug.categories || []).join(', '))
    }
  }, [drug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drug) return

    setIsLoading(true)
    try {
      const updatedData = {
        ...formData,
        categories: categoriesInput
          .split(',')
          .map(cat => cat.trim())
          .filter(cat => cat.length > 0)
      }

      const response = await fetch(`/api/drugs/${drug.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const updatedDrug = await response.json() as Drug
        onSave(updatedDrug)
        onClose()
      } else {
        throw new Error('Failed to update drug')
      }
    } catch (error) {
      console.error('Update drug error:', error)
      alert('Failed to update medication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  if (!drug) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Edit Medication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={handleInputChange('product_name')}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Ingredient
            </label>
            <input
              type="text"
              value={formData.active_ingredient}
              onChange={handleInputChange('active_ingredient')}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ATC Code
              </label>
              <input
                type="text"
                value={formData.atc_code}
                onChange={handleInputChange('atc_code')}
                className="input-field"
                placeholder="e.g., A10BA02"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={handleInputChange('barcode')}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <input
              type="text"
              value={categoriesInput}
              onChange={(e) => setCategoriesInput(e.target.value)}
              className="input-field"
              placeholder="Separate categories with commas (e.g., Diabetes, Oral, Prescription)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple categories with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              className="input-field resize-none"
              rows={3}
              placeholder="Optional description of the medication..."
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.product_name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
