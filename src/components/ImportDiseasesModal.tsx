import { useState } from 'react'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'

interface ImportOptions {
  includeCode: boolean
  includeName: boolean
  includeDescription: boolean
  includeCategory: boolean
  replaceExisting: boolean
}

interface ImportDiseasesModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: any[], options: ImportOptions) => void
}

export function ImportDiseasesModal({ isOpen, onClose, onImport }: ImportDiseasesModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState<any[]>([])
  const [options, setOptions] = useState<ImportOptions>({
    includeCode: true,
    includeName: true,
    includeDescription: true,
    includeCategory: true,
    replaceExisting: false
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setIsLoading(true)

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)
      
      let diseases = []
      if (Array.isArray(data)) {
        diseases = data
      } else if (data.diseases && Array.isArray(data.diseases)) {
        diseases = data.diseases
      } else {
        throw new Error('Invalid JSON format. Expected an array of diseases or an object with a "diseases" property.')
      }

      setJsonData(diseases)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file')
      setJsonData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (jsonData.length === 0) {
      setError('No data to import')
      return
    }
    onImport(jsonData, options)
    handleClose()
  }

  const handleClose = () => {
    setFile(null)
    setJsonData([])
    setError(null)
    setIsLoading(false)
    onClose()
  }

  const toggleOption = (key: keyof ImportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Import Diseases</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {file ? file.name : 'Click to upload JSON file'}
                </p>
              </label>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600">Parsing file...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Data Preview */}
          {jsonData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Found {jsonData.length} diseases to import
                </span>
              </div>
              
              {/* Sample preview */}
              <div className="bg-gray-50 rounded p-3 text-xs">
                <div className="font-medium mb-1">Sample disease:</div>
                <pre className="text-gray-600 overflow-x-auto">
                  {JSON.stringify(jsonData[0], null, 2).substring(0, 200)}...
                </pre>
              </div>
            </div>
          )}

          {/* Import Options */}
          {jsonData.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Import Options</h3>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeCode}
                    onChange={() => toggleOption('includeCode')}
                    className="mr-2"
                  />
                  Include ICD codes
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeName}
                    onChange={() => toggleOption('includeName')}
                    className="mr-2"
                  />
                  Include disease names
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeDescription}
                    onChange={() => toggleOption('includeDescription')}
                    className="mr-2"
                  />
                  Include descriptions
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeCategory}
                    onChange={() => toggleOption('includeCategory')}
                    className="mr-2"
                  />
                  Include categories
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.replaceExisting}
                    onChange={() => toggleOption('replaceExisting')}
                    className="mr-2"
                  />
                  Replace existing diseases (by code)
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={jsonData.length === 0}
            className="btn-primary"
          >
            Import {jsonData.length > 0 ? `${jsonData.length} diseases` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
