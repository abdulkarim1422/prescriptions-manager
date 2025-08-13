import React, { useEffect, useState } from 'react'
import { CreateFindingModal } from './CreateFindingModal'

export interface Finding {
  id: string
  name: string
  code?: string
  description?: string
}

export function FindingsView() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchFindings()
  }, [])

  async function fetchFindings() {
    setLoading(true)
    try {
      const res = await fetch('/api/findings')
      if (res.ok) {
        const data = await res.json() as { results: Finding[] }
        setFindings(Array.isArray(data.results) ? data.results : [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = findings.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.code && f.code.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleAddFinding(finding: { name: string; code?: string; description?: string }) {
    const res = await fetch('/api/findings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finding)
    })
    if (res.ok) {
      await fetchFindings()
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Findings</h2>
      <button
        className="mb-4 px-4 py-2 rounded bg-primary-600 text-white"
        onClick={() => setShowCreate(true)}
      >
        + Add Finding
      </button>
      <input
        type="text"
        className="border rounded px-3 py-2 mb-4 w-full"
        placeholder="Search findings..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="divide-y">
          {filtered.map(finding => (
            <li key={finding.id} className="py-2">
              <span className="font-semibold">{finding.name}</span>
              {finding.code && <span className="ml-2 text-gray-500">({finding.code})</span>}
              {finding.description && <div className="text-sm text-gray-600">{finding.description}</div>}
            </li>
          ))}
        </ul>
      )}
      {showCreate && (
        <CreateFindingModal
          onAdd={handleAddFinding}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
