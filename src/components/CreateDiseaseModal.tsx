import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Disease } from '../types'

interface CreateDiseaseModalProps {
  onClose: () => void
  onCreated: (disease: Disease) => void
}

export function CreateDiseaseModal({ onClose, onCreated }: CreateDiseaseModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Disease name is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/diseases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.trim() || undefined,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category.trim() || undefined,
        }),
      })

      if (response.ok) {
        const newDisease = await response.json() as Disease
        onCreated(newDisease)
        onClose()
      } else {
        throw new Error('Failed to create disease')
      }
    } catch (error) {
      console.error('Create disease error:', error)
      alert('Failed to create disease. Please try again.')
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Disease</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disease Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="input-field"
              placeholder="e.g., Type 2 Diabetes Mellitus"
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

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
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
                Creating...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Disease
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
