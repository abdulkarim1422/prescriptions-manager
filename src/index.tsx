import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DatabaseService } from './lib/database'
import { AIService, createAIService } from './lib/ai'
import { Env, SearchRequest, CreatePrescriptionRequest, CreateDiseaseRequest, CreateMedicationRequest, BulkImportDrugsRequest, CreateDrugRequest } from './types'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
const api = app.basePath('/api')

// Search endpoint
api.post('/search', async (c) => {
  try {
    // Check if we have database access (not available in dev mode)
    if (!c.env?.DB) {
      console.log('Database not available in development mode, returning mock data')
      
      const body = await c.req.json() as SearchRequest
      const { query, type } = body
      
      // Return mock data for development
      const mockResults = {
        disease: {
          results: [
            { id: 1, code: 'E11', name: 'Type 2 Diabetes Mellitus', description: 'A chronic condition affecting blood sugar regulation', severity: 'moderate', category: 'endocrine', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          total: 1,
          has_more: false
        },
        medication: {
          results: [
            { id: 1, name: 'Metformin', generic_name: 'Metformin HCl', dosage_form: 'tablet', strength: '500mg', manufacturer: 'Generic Pharma', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          total: 1,
          has_more: false
        },
        prescription: {
          results: [
            { id: 1, name: 'Diabetes Management Protocol', disease_id: 1, description: 'Standard treatment for Type 2 Diabetes', instructions: 'Take as directed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          total: 1,
          has_more: false
        },
        all: {
          results: {
            diseases: [{ id: 1, code: 'E11', name: 'Type 2 Diabetes Mellitus', description: 'A chronic condition affecting blood sugar regulation', severity: 'moderate', category: 'endocrine', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
            medications: [{ id: 1, name: 'Metformin', generic_name: 'Metformin HCl', dosage_form: 'tablet', strength: '500mg', manufacturer: 'Generic Pharma', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
            prescriptions: [{ id: 1, name: 'Diabetes Management Protocol', disease_id: 1, description: 'Standard treatment for Type 2 Diabetes', instructions: 'Take as directed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
          },
          total: 3,
          has_more: false
        }
      }
      
      const result = mockResults[type as keyof typeof mockResults] || mockResults.all
      
      return c.json({
        ...result,
        ai_suggestions: []
      })
    }

    const db = new DatabaseService(c.env.DB)
    
    const body = await c.req.json() as SearchRequest
    const { query, type, limit = 20, offset = 0, ai_enabled = false } = body

    let results: any = { results: [], total: 0, has_more: false }
    let aiSuggestions: any[] = []

    switch (type) {
      case 'disease':
        results = await db.searchDiseases(query, limit, offset)
        break
      case 'medication':
        results = await db.searchMedications(query, limit, offset)
        break
      case 'prescription':
        results = await db.searchPrescriptions(query, limit, offset)
        break
      case 'all':
        const [diseases, medications, prescriptions] = await Promise.all([
          db.searchDiseases(query, 5, 0),
          db.searchMedications(query, 5, 0),
          db.searchPrescriptions(query, 5, 0)
        ])
        results = {
          results: {
            diseases: diseases.results,
            medications: medications.results,
            prescriptions: prescriptions.results
          },
          total: diseases.total + medications.total + prescriptions.total,
          has_more: diseases.has_more || medications.has_more || prescriptions.has_more
        }
        break
    }

    // AI enhancement if enabled
    if (ai_enabled) {
      try {
        const aiEnabledConfig = await db.getConfig('ai_enabled')
        if (aiEnabledConfig === 'true') {
          const aiService = createAIService(c.env, true)
          if (aiService.isEnabled()) {
            const aiResponse = await aiService.searchEnhancement({
              query,
              context: { diseases: [], medications: [], prescriptions: [] }
            })
            if (aiResponse) {
              aiSuggestions = aiResponse.suggestions
            }
          }
        }
      } catch (aiError) {
        console.error('AI enhancement failed:', aiError)
        // Continue without AI suggestions
      }
    }

    // Log search
    await db.logSearch(query, type, Array.isArray(results.results) ? results.results.length : Object.keys(results.results).length)

    return c.json({
      ...results,
      ai_suggestions: aiSuggestions
    })
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ 
      error: 'Search failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Diseases endpoints
api.get('/diseases', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')
  
  const results = await db.searchDiseases(query, limit, offset)
  return c.json(results)
})

api.get('/diseases/:id', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const disease = await db.getDiseaseById(id)
  
  if (!disease) {
    return c.json({ error: 'Disease not found' }, 404)
  }
  
  return c.json(disease)
})

api.post('/diseases', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const body = await c.req.json() as CreateDiseaseRequest
  
  try {
    const disease = await db.createDisease(body)
    return c.json(disease, 201)
  } catch (error) {
    console.error('Create disease error:', error)
    return c.json({ error: 'Failed to create disease' }, 500)
  }
})

// Medications endpoints
api.get('/medications', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const query = c.req.query('q') || ''
  
  if (query) {
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')
    const results = await db.searchMedications(query, limit, offset)
    return c.json(results)
  } else {
    const medications = await db.getAllMedications()
    return c.json({ results: medications, total: medications.length, has_more: false })
  }
})

api.get('/medications/:id', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const medication = await db.getMedicationById(id)
  
  if (!medication) {
    return c.json({ error: 'Medication not found' }, 404)
  }
  
  return c.json(medication)
})

api.post('/medications', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const body = await c.req.json() as CreateMedicationRequest
  
  try {
    const medication = await db.createMedication(body)
    return c.json(medication, 201)
  } catch (error) {
    console.error('Create medication error:', error)
    return c.json({ error: 'Failed to create medication' }, 500)
  }
})

// Drugs endpoints (TR dataset)
api.get('/drugs', async (c) => {
  if (!c.env?.DB) {
    return c.json({ results: [], total: 0, has_more: false })
  }
  
  const db = new DatabaseService(c.env.DB)
  const query = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')
  const fields = c.req.query('fields') || 'product_name,active_ingredient,atc_code'
  
  // Priority: category filter > search query > all drugs
  if (category) {
    const results = await db.searchDrugsByCategory(category, limit, offset)
    return c.json(results)
  } else if (query) {
    const results = await db.searchDrugs(query, limit, offset, fields.split(','))
    return c.json(results)
  } else {
    const results = await db.getAllDrugs(limit, offset)
    return c.json(results)
  }
})

api.get('/drugs/:id', async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'Drug not found (dev mock)' }, 404)
  }
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const drug = await db.getDrugById(id)
  if (!drug) {
    return c.json({ error: 'Drug not found' }, 404)
  }
  return c.json(drug)
})

api.post('/drugs/import', async (c) => {
  let items: BulkImportDrugsRequest['items'] = []
  let replace_existing = false
  try {
    // Parse JSON payload safely
    const raw = await c.req.text()
    if (raw) {
      const parsed = JSON.parse(raw) as BulkImportDrugsRequest
      items = Array.isArray(parsed?.items) ? parsed.items : (Array.isArray((parsed as any)) ? (parsed as any) : [])
      replace_existing = Boolean((parsed as any)?.replace_existing)
    }
  } catch (parseError) {
    console.warn('Import payload parse error; continuing with empty items')
  }

  if (!c.env?.DB) {
    return c.json({ inserted: items.length, updated: 0 }, 201)
  }

  try {
    const db = new DatabaseService(c.env.DB)
    const result = await db.bulkImportDrugs(items, replace_existing)
    return c.json(result, 201)
  } catch (error) {
    console.error('Bulk import drugs error:', error)
    return c.json({ error: 'Failed to import drugs' }, 500)
  }
})

api.post('/drugs', async (c) => {
  const body = await c.req.json() as CreateDrugRequest
  try {
    if (!c.env?.DB) {
      // Dev mock: echo back with a fake id
      return c.json({ id: Math.floor(Math.random()*1e6), ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 201)
    }
    const db = new DatabaseService(c.env.DB)
    const drug = await db.createDrug(body)
    return c.json(drug, 201)
  } catch (error) {
    console.error('Create drug error:', error)
    return c.json({ error: 'Failed to create drug' }, 500)
  }
})

api.put('/drugs/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json() as Partial<CreateDrugRequest>
  
  try {
    if (!c.env?.DB) {
      // Dev mock: echo back updated data
      return c.json({ id, ...body, updated_at: new Date().toISOString() }, 200)
    }
    
    const db = new DatabaseService(c.env.DB)
    const updatedDrug = await db.updateDrug(id, body)
    
    if (!updatedDrug) {
      return c.json({ error: 'Drug not found' }, 404)
    }
    
    return c.json(updatedDrug, 200)
  } catch (error) {
    console.error('Update drug error:', error)
    return c.json({ error: 'Failed to update drug' }, 500)
  }
})

api.delete('/drugs/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  
  try {
    if (!c.env?.DB) {
      // Dev mock: just return success
      return c.json({ success: true }, 200)
    }
    
    const db = new DatabaseService(c.env.DB)
    const success = await db.deleteDrug(id)
    
    if (!success) {
      return c.json({ error: 'Drug not found' }, 404)
    }
    
    return c.json({ success: true }, 200)
  } catch (error) {
    console.error('Delete drug error:', error)
    return c.json({ error: 'Failed to delete drug' }, 500)
  }
})

// Prescriptions endpoints
api.get('/prescriptions', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = parseInt(c.req.query('offset') || '0')
  
  const results = await db.searchPrescriptions(query, limit, offset)
  return c.json(results)
})

api.get('/prescriptions/:id', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const prescription = await db.getPrescriptionById(id)
  
  if (!prescription) {
    return c.json({ error: 'Prescription not found' }, 404)
  }
  
  return c.json(prescription)
})

api.post('/prescriptions', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const body = await c.req.json() as CreatePrescriptionRequest
  
  try {
    const prescription = await db.createPrescription(
      {
        name: body.name,
        description: body.description,
        created_by: 'user' // In real app, get from auth
      },
      body.items,
      body.disease_ids
    )
    return c.json(prescription, 201)
  } catch (error) {
    console.error('Create prescription error:', error)
    return c.json({ error: 'Failed to create prescription' }, 500)
  }
})

api.put('/prescriptions/:id', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const updates = await c.req.json()
  
  try {
    const prescription = await db.updatePrescription(id, updates)
    if (!prescription) {
      return c.json({ error: 'Prescription not found' }, 404)
    }
    return c.json(prescription)
  } catch (error) {
    console.error('Update prescription error:', error)
    return c.json({ error: 'Failed to update prescription' }, 500)
  }
})

api.delete('/prescriptions/:id', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  
  try {
    const success = await db.deletePrescription(id)
    if (!success) {
      return c.json({ error: 'Prescription not found' }, 404)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete prescription error:', error)
    return c.json({ error: 'Failed to delete prescription' }, 500)
  }
})

// Disease-prescription associations
api.get('/diseases/:id/prescriptions', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const id = parseInt(c.req.param('id'))
  
  const prescriptions = await db.getPrescriptionsForDisease(id)
  return c.json({ results: prescriptions, total: prescriptions.length, has_more: false })
})

// Configuration endpoints
api.get('/config/:key', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const key = c.req.param('key')
  const value = await db.getConfig(key)
  
  if (value === null) {
    return c.json({ error: 'Config not found' }, 404)
  }
  
  return c.json({ key, value })
})

api.put('/config/:key', async (c) => {
  const db = new DatabaseService(c.env.DB)
  const key = c.req.param('key')
  const { value } = await c.req.json()
  
  await db.setConfig(key, value)
  return c.json({ key, value })
})

// Client-side routing fallback - serve the main app for all non-API routes
app.get('*', async (c) => {
  const path = c.req.path
  
  // Skip API routes
  if (path.startsWith('/api/')) {
    return c.notFound()
  }
  
  // Serve the client app for all other routes
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prescriptions Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client.tsx"></script>
  </body>
</html>`)
})

export default app
