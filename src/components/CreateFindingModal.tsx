import React, { useState } from 'react'

interface Props {
  onAdd: (finding: { id: number; name: string; code?: string; description?: string }) => void
  onClose: () => void
  initialName?: string
}

export function CreateFindingModal({ onAdd, onClose, initialName = '' }: Props) {
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Save to database
      const response = await fetch('/api/findings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create finding')
      }
      
      const createdFinding = await response.json() as { id: number; name: string; code?: string; description?: string }
      
      // Type-safe handling of the created finding
      if (createdFinding && createdFinding.id) {
        await onAdd({
          id: createdFinding.id,
          name: createdFinding.name,
          code: createdFinding.code,
          description: createdFinding.description
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error creating finding:', error)
      alert('Failed to create finding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold mb-4">Add New Finding</h3>
        <input
          className="border rounded px-3 py-2 mb-2 w-full"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 mb-2 w-full"
          placeholder="Code (optional)"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <textarea
          className="border rounded px-3 py-2 mb-2 w-full"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white" disabled={loading}>
            {loading ? 'Adding...' : 'Add Finding'}
          </button>
        </div>
      </form>
    </div>
  )
}
