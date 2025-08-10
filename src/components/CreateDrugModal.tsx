import { useState } from 'react'

interface CreateDrugModalProps {
  onClose: () => void
  onCreated?: () => void
}

export function CreateDrugModal({ onClose, onCreated }: CreateDrugModalProps) {
  const [barcode, setBarcode] = useState('')
  const [atcCode, setAtcCode] = useState('')
  const [activeIngredient, setActiveIngredient] = useState('')
  const [productName, setProductName] = useState('')
  const [categories, setCategories] = useState<string>('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const payload = {
        barcode: barcode || undefined,
        atc_code: atcCode || undefined,
        active_ingredient: activeIngredient || undefined,
        product_name: productName || undefined,
        categories: categories
          ? categories
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        description: description || undefined,
      }
      const res = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create drug')
      if (onCreated) onCreated()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to create drug')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-medium">Add Drug</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input className="input-field" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Parol 500 mg Tablet" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Active Ingredient</label>
              <input className="input-field" value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} placeholder="e.g., Paracetamol" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ATC Code</label>
              <input className="input-field" value={atcCode} onChange={(e) => setAtcCode(e.target.value)} placeholder="e.g., N02BE01" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input className="input-field" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g., 8699546020015" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categories (comma-separated)</label>
              <input className="input-field" value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="e.g., Analgesic, Antipyretic" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Optional description" />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className={`btn-primary ${submitting ? 'opacity-60' : ''}`}>Save</button>
        </div>
      </div>
    </div>
  )
}

