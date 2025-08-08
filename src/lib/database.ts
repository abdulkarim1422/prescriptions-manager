import { Env, Disease, PrescriptionTemplate, Medication, PrescriptionItem, DiseasePrescription, SearchResponse } from '../types';

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Disease operations
  async searchDiseases(query: string, limit: number = 20, offset: number = 0): Promise<SearchResponse<Disease>> {
    const searchQuery = `%${query}%`;
    
    const countResult = await this.db.prepare(
      'SELECT COUNT(*) as total FROM diseases WHERE name LIKE ? OR code LIKE ? OR description LIKE ?'
    ).bind(searchQuery, searchQuery, searchQuery).first();
    
    const results = await this.db.prepare(
      'SELECT * FROM diseases WHERE name LIKE ? OR code LIKE ? OR description LIKE ? ORDER BY name LIMIT ? OFFSET ?'
    ).bind(searchQuery, searchQuery, searchQuery, limit, offset).all();

    return {
      results: results.results as unknown as Disease[],
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0)
    };
  }

  async getDiseaseById(id: number): Promise<Disease | null> {
    const result = await this.db.prepare('SELECT * FROM diseases WHERE id = ?').bind(id).first();
    return result as unknown as Disease | null;
  }

  async createDisease(disease: Omit<Disease, 'id' | 'created_at' | 'updated_at'>): Promise<Disease> {
    const result = await this.db.prepare(
      'INSERT INTO diseases (code, name, description, category) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(disease.code, disease.name, disease.description, disease.category).first();
    return result as unknown as Disease;
  }

  // Medication operations
  async searchMedications(query: string, limit: number = 20, offset: number = 0): Promise<SearchResponse<Medication>> {
    const searchQuery = `%${query}%`;
    
    const countResult = await this.db.prepare(
      'SELECT COUNT(*) as total FROM medications WHERE name LIKE ? OR generic_name LIKE ? OR category LIKE ?'
    ).bind(searchQuery, searchQuery, searchQuery).first();
    
    const results = await this.db.prepare(
      'SELECT * FROM medications WHERE name LIKE ? OR generic_name LIKE ? OR category LIKE ? ORDER BY name LIMIT ? OFFSET ?'
    ).bind(searchQuery, searchQuery, searchQuery, limit, offset).all();

    return {
      results: results.results as unknown as Medication[],
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0)
    };
  }

  async getMedicationById(id: number): Promise<Medication | null> {
    const result = await this.db.prepare('SELECT * FROM medications WHERE id = ?').bind(id).first();
    return result as Medication | null;
  }

  async getAllMedications(): Promise<Medication[]> {
    const result = await this.db.prepare('SELECT * FROM medications ORDER BY name').all();
    return result.results as unknown as Medication[];
  }

  async createMedication(medication: Omit<Medication, 'id' | 'created_at' | 'updated_at'>): Promise<Medication> {
    const result = await this.db.prepare(
      'INSERT INTO medications (name, generic_name, dosage_form, strength, manufacturer, category) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(
      medication.name,
      medication.generic_name,
      medication.dosage_form,
      medication.strength,
      medication.manufacturer,
      medication.category
    ).first();
    return result as unknown as Medication;
  }

  // Prescription template operations
  async searchPrescriptions(query: string, limit: number = 20, offset: number = 0): Promise<SearchResponse<PrescriptionTemplate>> {
    const searchQuery = `%${query}%`;
    
    const countResult = await this.db.prepare(
      'SELECT COUNT(*) as total FROM prescription_templates WHERE name LIKE ? OR description LIKE ? AND is_active = TRUE'
    ).bind(searchQuery, searchQuery).first();
    
    const results = await this.db.prepare(
      'SELECT * FROM prescription_templates WHERE name LIKE ? OR description LIKE ? AND is_active = TRUE ORDER BY name LIMIT ? OFFSET ?'
    ).bind(searchQuery, searchQuery, limit, offset).all();

    return {
      results: results.results as unknown as PrescriptionTemplate[],
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0)
    };
  }

  async getPrescriptionById(id: number): Promise<(PrescriptionTemplate & { items: PrescriptionItem[], diseases: Disease[] }) | null> {
    const prescription = await this.db.prepare('SELECT * FROM prescription_templates WHERE id = ?').bind(id).first() as PrescriptionTemplate;
    
    if (!prescription) return null;

    // Get prescription items with medication details
    const items = await this.db.prepare(`
      SELECT pi.*, m.name as medication_name, m.generic_name, m.dosage_form, m.strength
      FROM prescription_items pi
      JOIN medications m ON pi.medication_id = m.id
      WHERE pi.prescription_template_id = ?
    `).bind(id).all();

    // Get associated diseases
    const diseases = await this.db.prepare(`
      SELECT d.*
      FROM diseases d
      JOIN disease_prescriptions dp ON d.id = dp.disease_id
      WHERE dp.prescription_template_id = ?
    `).bind(id).all();

    return {
      ...prescription,
      items: items.results as unknown as PrescriptionItem[],
      diseases: diseases.results as unknown as Disease[]
    };
  }

  async createPrescription(
    template: Omit<PrescriptionTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>,
    items: Omit<PrescriptionItem, 'id' | 'prescription_template_id'>[],
    diseaseIds: number[] = []
  ): Promise<PrescriptionTemplate> {
    // Create prescription template
    const prescription = await this.db.prepare(
      'INSERT INTO prescription_templates (name, description, created_by, is_active) VALUES (?, ?, ?, TRUE) RETURNING *'
    ).bind(template.name, template.description, template.created_by).first() as PrescriptionTemplate;

    // Add prescription items
    for (const item of items) {
      await this.db.prepare(
        'INSERT INTO prescription_items (prescription_template_id, medication_id, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        prescription.id,
        item.medication_id,
        item.dosage,
        item.frequency,
        item.duration,
        item.instructions
      ).run();
    }

    // Associate with diseases
    for (const diseaseId of diseaseIds) {
      await this.db.prepare(
        'INSERT OR IGNORE INTO disease_prescriptions (disease_id, prescription_template_id, confidence_score) VALUES (?, ?, 1.0)'
      ).bind(diseaseId, prescription.id).run();
    }

    return prescription;
  }

  async updatePrescription(
    id: number,
    updates: Partial<PrescriptionTemplate>
  ): Promise<PrescriptionTemplate | null> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof PrescriptionTemplate] !== undefined);
    if (fields.length === 0) {
      return this.getPrescriptionById(id) as Promise<PrescriptionTemplate | null>;
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof PrescriptionTemplate]);

    const result = await this.db.prepare(
      `UPDATE prescription_templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`
    ).bind(...values, id).first();

    return result as PrescriptionTemplate | null;
  }

  async deletePrescription(id: number): Promise<boolean> {
    const result = await this.db.prepare('UPDATE prescription_templates SET is_active = FALSE WHERE id = ?').bind(id).run();
    return result.success;
  }

  // Disease-prescription associations
  async getPrescriptionsForDisease(diseaseId: number): Promise<PrescriptionTemplate[]> {
    const result = await this.db.prepare(`
      SELECT pt.*
      FROM prescription_templates pt
      JOIN disease_prescriptions dp ON pt.id = dp.prescription_template_id
      WHERE dp.disease_id = ? AND pt.is_active = TRUE
      ORDER BY dp.confidence_score DESC, pt.name
    `).bind(diseaseId).all();

    return result.results as unknown as PrescriptionTemplate[];
  }

  async getDiseasesForPrescription(prescriptionId: number): Promise<Disease[]> {
    const result = await this.db.prepare(`
      SELECT d.*
      FROM diseases d
      JOIN disease_prescriptions dp ON d.id = dp.disease_id
      WHERE dp.prescription_template_id = ?
    `).bind(prescriptionId).all();

    return result.results as unknown as Disease[];
  }

  // Search logs
  async logSearch(query: string, searchType: string, resultsCount: number, userId?: string): Promise<void> {
    await this.db.prepare(
      'INSERT INTO search_logs (query, search_type, results_count, user_id) VALUES (?, ?, ?, ?)'
    ).bind(query, searchType, resultsCount, userId || null).run();
  }

  // Configuration
  async getConfig(key: string): Promise<string | null> {
    const result = await this.db.prepare('SELECT value FROM app_config WHERE key = ?').bind(key).first();
    return result ? (result as any).value : null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.db.prepare(
      'INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, value).run();
  }
}
