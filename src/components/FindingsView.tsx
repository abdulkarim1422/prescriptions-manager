import React, { useEffect, useState } from 'react'

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

  useEffect(() => {
    fetchFindings()
  }, [])

  async function fetchFindings() {
    setLoading(true)
    try {
      const res = await fetch('/api/findings')
      if (res.ok) {
        const data = await res.json()
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Findings</h2>
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
    </div>
  )
}
