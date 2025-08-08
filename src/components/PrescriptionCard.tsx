import { Edit, Trash2, Eye } from 'lucide-react'
import { PrescriptionCardProps } from '../types'

export function PrescriptionCard({ prescription, onEdit, onDelete, onView }: PrescriptionCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${prescription.name}"?`)) {
      onDelete?.(prescription.id)
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900">{prescription.name}</h3>
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(prescription)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(prescription)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      {prescription.description && (
        <p className="text-gray-600 text-sm mb-3">{prescription.description}</p>
      )}
      
      {prescription.items && Array.isArray(prescription.items) && prescription.items.length > 0 && (
        <div className="space-y-2 mb-3">
          <h4 className="text-sm font-medium text-gray-700">Medications:</h4>
          <div className="space-y-1">
            {prescription.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <div className="font-medium">{item.medication?.name || `Medication ID: ${item.medication_id}`}</div>
                <div className="text-xs">
                  {item.dosage} • {item.frequency} • {item.duration}
                </div>
              </div>
            ))}
            {prescription.items.length > 3 && (
              <div className="text-xs text-gray-500">
                +{prescription.items.length - 3} more medications
              </div>
            )}
          </div>
        </div>
      )}
      
      {prescription.diseases && Array.isArray(prescription.diseases) && prescription.diseases.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Associated Conditions:</h4>
          <div className="flex flex-wrap gap-1">
            {prescription.diseases.slice(0, 2).map((disease, index) => (
              <span 
                key={index}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                {disease.name}
              </span>
            ))}
            {prescription.diseases.length > 2 && (
              <span className="text-xs text-gray-500">
                +{prescription.diseases.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <span>Created: {new Date(prescription.created_at).toLocaleDateString()}</span>
        <span className={`px-2 py-1 rounded ${prescription.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {prescription.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}
