import { useState } from 'react'
import { X, Upload, FileText } from 'lucide-react'

interface ImportDrugsModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: any[], options: ImportOptions) => Promise<void>
}

interface ImportOptions {
  includeProductName: boolean
  includeActiveIngredient: boolean
  includeATC: boolean
  includeBarcode: boolean
  includeCategories: boolean
  includeDescription: boolean
  replaceExisting: boolean
}

export function ImportDrugsModal({ isOpen, onClose, onImport }: ImportDrugsModalProps) {
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [options, setOptions] = useState<ImportOptions>({
    includeProductName: true,
    includeActiveIngredient: true,
    includeATC: true,
    includeBarcode: true,
    includeCategories: true,
    includeDescription: true,
    replaceExisting: false
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/json') {
      setSelectedFile(file)
    } else {
      alert('Please select a valid JSON file')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    try {
      setImporting(true)
      const text = await selectedFile.text()
      const raw = JSON.parse(text)
      
      // Handle different JSON structures
      let items: any[] = []
      
      if (Array.isArray(raw)) {
        // Check if it's the PHPMyAdmin export format
        const tableObj = raw.find(item => item.type === 'table' && item.data)
        if (tableObj && Array.isArray(tableObj.data)) {
          items = tableObj.data
        } else {
          // Standard array format
          items = raw
        }
      } else if (raw.data && Array.isArray(raw.data)) {
        // Handle structure like {"type":"table","name":"ilac","database":"ilaçlar","data":[...]}
        items = raw.data
      } else if (raw.items && Array.isArray(raw.items)) {
        items = raw.items
      } else {
        // Look for any array in the object
        const firstArray = Object.values(raw).find(value => Array.isArray(value))
        if (firstArray) {
          items = firstArray as any[]
        }
      }

      if (items.length === 0) {
        alert('No valid data found in the file. Please check the format.')
        return
      }

      await onImport(items, options)
      onClose()
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import file. Please check the file format.')
    } finally {
      setImporting(false)
    }
  }

  const toggleOption = (key: keyof ImportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Import Drugs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select JSON File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="text-gray-400" size={32} />
                  <div className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select a JSON file'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Format: Similar to /data/tr/drugs.json
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Fields to Import
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeProductName}
                  onChange={() => toggleOption('includeProductName')}
                  className="mr-2"
                />
                <span className="text-sm">Product Name</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeActiveIngredient}
                  onChange={() => toggleOption('includeActiveIngredient')}
                  className="mr-2"
                />
                <span className="text-sm">Active Ingredient</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeATC}
                  onChange={() => toggleOption('includeATC')}
                  className="mr-2"
                />
                <span className="text-sm">ATC Code</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeBarcode}
                  onChange={() => toggleOption('includeBarcode')}
                  className="mr-2"
                />
                <span className="text-sm">Barcode</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeCategories}
                  onChange={() => toggleOption('includeCategories')}
                  className="mr-2"
                />
                <span className="text-sm">Categories</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeDescription}
                  onChange={() => toggleOption('includeDescription')}
                  className="mr-2"
                />
                <span className="text-sm">Description</span>
              </label>
            </div>
          </div>

          {/* Replace Option */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.replaceExisting}
                onChange={() => toggleOption('replaceExisting')}
                className="mr-2"
              />
              <span className="text-sm">Replace existing drugs with same barcode</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
