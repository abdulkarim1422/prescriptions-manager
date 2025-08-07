import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DatabaseService } from './lib/database'
import { AIService, createAIService } from './lib/ai'
import { Env, SearchRequest, CreatePrescriptionRequest, CreateDiseaseRequest, CreateMedicationRequest } from './types'

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
  const db = new DatabaseService(c.env.DB)
  const aiService = createAIService(c.env, await db.getConfig('ai_enabled') === 'true')
  
  const body = await c.req.json() as SearchRequest
  const { query, type, limit = 20, offset = 0, ai_enabled = false } = body

  let results: any = { results: [], total: 0, has_more: false }
  let aiSuggestions: any[] = []

  try {
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
    if (ai_enabled && aiService.isEnabled()) {
      const aiResponse = await aiService.searchEnhancement({
        query,
        context: { diseases: [], medications: [], prescriptions: [] }
      })
      if (aiResponse) {
        aiSuggestions = aiResponse.suggestions
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
    return c.json({ error: 'Search failed' }, 500)
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

export default app
