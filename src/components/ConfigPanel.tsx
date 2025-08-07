import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'

interface ConfigPanelProps {
  config: { ai_enabled: boolean }
  onConfigChange: (config: { ai_enabled: boolean }) => void
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/config/ai_enabled', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: localConfig.ai_enabled.toString() })
      })

      if (response.ok) {
        onConfigChange(localConfig)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setLocalConfig(config)
    setSaved(false)
  }

  const hasChanges = localConfig.ai_enabled !== config.ai_enabled

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-medium mb-4">AI Features</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable AI Enhancement
              </label>
              <p className="text-xs text-gray-500">
                Use AI to enhance search results and provide intelligent suggestions
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={localConfig.ai_enabled}
                onChange={(e) => setLocalConfig({ ...localConfig, ai_enabled: e.target.checked })}
                className="toggle toggle-primary"
              />
            </div>
          </div>

          {localConfig.ai_enabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI Features Include:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Enhanced search with intelligent suggestions</li>
                <li>• Prescription recommendations based on symptoms</li>
                <li>• Drug interaction and dosage validation</li>
                <li>• Disease pattern recognition</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Note: AI features require an API key to be configured on the server.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Application Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-save Templates
              </label>
              <p className="text-xs text-gray-500">
                Automatically save prescription templates as you type
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="toggle toggle-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Search Suggestions
              </label>
              <p className="text-xs text-gray-500">
                Show search suggestions while typing
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="toggle toggle-primary"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        
        <div className="space-y-3">
          <button className="btn-secondary w-full">
            Export All Data
          </button>
          <button className="btn-secondary w-full">
            Import Data
          </button>
          <button className="btn-secondary w-full text-red-600 hover:bg-red-50">
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Save Controls */}
      {hasChanges && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Unsaved Changes</p>
              <p className="text-xs text-yellow-700">You have unsaved configuration changes</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={saving}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm font-medium text-green-800">
            ✓ Configuration saved successfully
          </p>
        </div>
      )}
    </div>
  )
}
