import { X } from 'lucide-react'
import { Drug } from '../types'

interface DrugInfoModalProps {
  drug: Drug
  onClose: () => void
}

export function DrugInfoModal({ drug, onClose }: DrugInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Drug Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {drug.id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {drug.product_name || 'Not specified'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Ingredient</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {drug.active_ingredient || 'Not specified'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ATC Code</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {drug.atc_code || 'Not specified'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {drug.barcode || 'Not specified'}
                </div>
              </div>
            </div>
            
            {/* Categories */}
            {drug.categories && drug.categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {drug.categories.map((category, index) => (
                    <span
                      key={index}
                      className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Description */}
            {drug.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded leading-relaxed whitespace-pre-wrap">
                  {drug.description.replace(/\\n/g, '\n')}
                </div>
              </div>
            )}
            
            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(drug.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {new Date(drug.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
