import { useState } from 'react'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'

// Helper function to flatten hierarchical diagnosis codes
function flattenDiagnosisHierarchy(data: any[]): any[] {
  const flattened: any[] = []
  
  function traverse(items: any[], parentCategory?: string) {
    for (const item of items) {
      if (item.code && item.desc) {
        // Determine category based on code pattern
        let category = parentCategory || 'General'
        
        // Top-level categories (e.g., A00-B99)
        if (item.code.includes('-')) {
          category = item.desc
        }
        // Second-level categories (e.g., A00-A09)
        else if (item.code.match(/^[A-Z]\d{2}-[A-Z]\d{2}$/)) {
          category = parentCategory || item.desc
        }
        
        flattened.push({
          code: item.code,
          name: item.desc_full || item.desc,
          description: item.desc_full ? item.desc : undefined,
          category: category
        })
      }
      
      // Recursively process children
      if (item.children && Array.isArray(item.children)) {
        traverse(item.children, item.desc || parentCategory)
      }
    }
  }
  
  traverse(data)
  return flattened
}

interface ImportOptions {
  includeCode: boolean
  includeName: boolean
  includeDescription: boolean
  includeCategory: boolean
  replaceExisting: boolean
}

interface ImportProgress {
  total: number
  processed: number
  imported: number
  errors: number
  currentBatch: number
  totalBatches: number
  startTime: number
  estimatedTimeRemaining?: number
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
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importComplete, setImportComplete] = useState(false)

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
        // Check if it's a hierarchical structure (like diagnosis_codes.json)
        if (data.length > 0 && data[0].children !== undefined) {
          diseases = flattenDiagnosisHierarchy(data)
        } else {
          diseases = data
        }
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

  const handleImport = async () => {
    if (jsonData.length === 0) {
      setError('No data to import')
      return
    }

    setIsImporting(true)
    setImportComplete(false)
    setError(null)
    
    const BATCH_SIZE = 100 // Process in batches of 100
    const totalItems = jsonData.length
    const totalBatches = Math.ceil(totalItems / BATCH_SIZE)
    const startTime = Date.now()

    setImportProgress({
      total: totalItems,
      processed: 0,
      imported: 0,
      errors: 0,
      currentBatch: 0,
      totalBatches,
      startTime
    })

    try {
      let totalImported = 0
      let totalErrors = 0

      for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * BATCH_SIZE
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalItems)
        const batch = jsonData.slice(batchStart, batchEnd)
        
        // Update progress before processing batch
        const elapsed = Date.now() - startTime
        const avgTimePerBatch = i > 0 ? elapsed / i : 0
        const remainingBatches = totalBatches - i
        const estimatedTimeRemaining = avgTimePerBatch * remainingBatches

        setImportProgress(prev => prev ? {
          ...prev,
          currentBatch: i + 1,
          processed: batchStart,
          estimatedTimeRemaining: estimatedTimeRemaining
        } : null)

        // Send batch to server
        try {
          const response = await fetch('/api/diseases/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              diseases: batch,
              replaceExisting: options.replaceExisting
            })
          })

          if (response.ok) {
            const result = await response.json() as { imported: number; errors: number }
            totalImported += result.imported || 0
            totalErrors += result.errors || 0
            
            // Update progress after processing batch
            setImportProgress(prev => prev ? {
              ...prev,
              processed: batchEnd,
              imported: totalImported,
              errors: totalErrors
            } : null)
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        } catch (batchError) {
          console.error('Batch import error:', batchError)
          totalErrors += batch.length
          
          setImportProgress(prev => prev ? {
            ...prev,
            processed: batchEnd,
            errors: totalErrors
          } : null)
        }

        // Small delay to prevent overwhelming the server
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      setImportComplete(true)
      
      // Call the parent onImport callback with summary
      onImport([], {
        ...options,
        // Pass additional info in options for parent component
        imported: totalImported,
        errors: totalErrors,
        total: totalItems
      } as any)

    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (isImporting && !importComplete) {
      const confirmClose = window.confirm('Import is still in progress. Are you sure you want to close?')
      if (!confirmClose) return
    }
    
    setFile(null)
    setJsonData([])
    setError(null)
    setIsLoading(false)
    setIsImporting(false)
    setImportProgress(null)
    setImportComplete(false)
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

          {/* Import Progress */}
          {isImporting && importProgress && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-blue-900">Import Progress</h3>
                <span className="text-sm text-blue-700">
                  Batch {importProgress.currentBatch} of {importProgress.totalBatches}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(importProgress.processed / importProgress.total) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Progress Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Processed:</span>
                  <span className="ml-1 text-blue-900">
                    {importProgress.processed.toLocaleString()} / {importProgress.total.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Imported:</span>
                  <span className="ml-1 text-green-900">
                    {importProgress.imported.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Errors:</span>
                  <span className="ml-1 text-red-900">
                    {importProgress.errors.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Progress:</span>
                  <span className="ml-1 text-blue-900">
                    {Math.round((importProgress.processed / importProgress.total) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Time Estimation */}
              {importProgress.estimatedTimeRemaining && importProgress.estimatedTimeRemaining > 0 && (
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Estimated time remaining:</span>
                  <span className="ml-1">
                    {Math.round(importProgress.estimatedTimeRemaining / 1000)}s
                  </span>
                </div>
              )}
              
              {/* Completion Message */}
              {importComplete && (
                <div className="p-3 bg-green-100 border border-green-200 rounded text-sm text-green-800">
                  <span className="font-medium">Import completed!</span> 
                  <span className="ml-1">
                    Successfully imported {importProgress.imported} diseases with {importProgress.errors} errors.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Data Preview */}
          {jsonData.length > 0 && !isImporting && (
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
          {jsonData.length > 0 && !isImporting && (
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
            disabled={isImporting && !importComplete}
            className={`btn-secondary ${isImporting && !importComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isImporting && !importComplete ? 'Importing...' : 'Cancel'}
          </button>
          
          {!isImporting && (
            <button
              onClick={handleImport}
              disabled={jsonData.length === 0}
              className="btn-primary"
            >
              Import {jsonData.length > 0 ? `${jsonData.length.toLocaleString()} diseases` : ''}
            </button>
          )}
          
          {isImporting && (
            <button
              disabled
              className="btn-primary opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Importing...
              </div>
            </button>
          )}
          
          {importComplete && (
            <button
              onClick={handleClose}
              className="btn-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
