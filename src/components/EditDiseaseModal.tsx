import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Disease } from '../types'

interface EditDiseaseModalProps {
  disease: Disease | null
  onClose: () => void
  onSave: (updatedDisease: Disease) => void
}

export function EditDiseaseModal({ disease, onClose, onSave }: EditDiseaseModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (disease) {
      setFormData({
        code: disease.code || '',
        name: disease.name || '',
        description: disease.description || '',
        category: disease.category || ''
      })
    }
  }, [disease])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disease) return

    setIsLoading(true)
    try {
      const updatedData = {
        code: formData.code.trim() || undefined,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
      }

      const response = await fetch(`/api/diseases/${disease.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const updatedDisease = await response.json() as Disease
        onSave(updatedDisease)
        onClose()
      } else {
        throw new Error('Failed to update disease')
      }
    } catch (error) {
      console.error('Update disease error:', error)
      alert('Failed to update disease. Please try again.')
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

  if (!disease) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Edit Disease</h2>
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
              Disease Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ICD Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={handleInputChange('code')}
              className="input-field"
              placeholder="e.g., E11.9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={handleInputChange('category')}
              className="input-field"
              placeholder="e.g., Endocrine disorders"
            />
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
              placeholder="Optional description of the disease..."
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
            disabled={isLoading || !formData.name.trim()}
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
