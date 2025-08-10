import { useState } from 'react'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'

interface ImportOptions {
  includeProductName: boolean
  includeActiveIngredient: boolean
  includeATC: boolean
  includeBarcode: boolean
  includeCategories: boolean
  includeDescription: boolean
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

interface ImportDrugsModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: any[], options: ImportOptions) => Promise<void>
}

export function ImportDrugsModal({ isOpen, onClose, onImport }: ImportDrugsModalProps) {
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importComplete, setImportComplete] = useState(false)
  const [options, setOptions] = useState<ImportOptions>({
    includeProductName: true,
    includeActiveIngredient: true,
    includeATC: true,
    includeBarcode: true,
    includeCategories: true,
    includeDescription: true,
    replaceExisting: false
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError(null)
    setIsLoading(true)

    try {
      const text = await file.text()
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
        throw new Error('No valid data found in the file. Please check the format.')
      }

      setParsedData(items)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON file'
      setError(errorMessage)
      setParsedData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError('No data to import')
      return
    }

    setImporting(true)
    setImportComplete(false)
    setError(null)
    
    const BATCH_SIZE = 100 // Process in batches of 100
    const totalItems = parsedData.length
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
        const batch = parsedData.slice(batchStart, batchEnd)
        
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
          const response = await fetch('/api/drugs/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: batch,
              replace_existing: options.replaceExisting
            })
          })

          if (response.ok) {
            const result = await response.json() as { inserted: number; updated: number }
            totalImported += (result.inserted || 0) + (result.updated || 0)
            
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
      
      // Call the parent onImport callback with summary (for backward compatibility)
      await onImport([], {
        ...options,
        imported: totalImported,
        errors: totalErrors,
        total: totalItems
      } as any)

    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    if (importing && !importComplete) {
      const confirmClose = window.confirm('Import is still in progress. Are you sure you want to close?')
      if (!confirmClose) return
    }
    
    setSelectedFile(null)
    setParsedData([])
    setError(null)
    setIsLoading(false)
    setImporting(false)
    setImportProgress(null)
    setImportComplete(false)
    onClose()
  }

  const toggleOption = (key: keyof ImportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Import Drugs</h2>
          <button
            onClick={handleClose}
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
          {importing && importProgress && (
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
                    Successfully imported {importProgress.imported} drugs with {importProgress.errors} errors.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && !importing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Found {parsedData.length.toLocaleString()} drugs to import
                </span>
              </div>
              
              {/* Sample preview */}
              <div className="bg-gray-50 rounded p-3 text-xs">
                <div className="font-medium mb-1">Sample drug:</div>
                <pre className="text-gray-600 overflow-x-auto">
                  {JSON.stringify(parsedData[0], null, 2).substring(0, 200)}...
                </pre>
              </div>
            </div>
          )}

          {/* Import Options */}
          {parsedData.length > 0 && !importing && (
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
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={handleClose}
            disabled={importing && !importComplete}
            className={`px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ${importing && !importComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {importing && !importComplete ? 'Importing...' : 'Cancel'}
          </button>
          
          {!importing && (
            <button
              onClick={handleImport}
              disabled={parsedData.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              Import {parsedData.length > 0 ? `${parsedData.length.toLocaleString()} drugs` : ''}
            </button>
          )}
          
          {importing && (
            <button
              disabled
              className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Importing...
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
