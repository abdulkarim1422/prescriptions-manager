import { Env, Disease, PrescriptionTemplate, Medication, PrescriptionItem, DiseasePrescription, SearchResponse, Drug, CreateDrugRequest } from '../types';

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Finding operations
  async searchFindings(query: string, limit: number = 20, offset: number = 0, fields: string[] = ['code', 'name', 'description'], sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const searchQuery = `%${query}%`;
    const whereConditions = [];
    const bindValues = [];
    for (const field of fields) {
      switch (field) {
        case 'code':
          whereConditions.push('code LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'name':
          whereConditions.push('name LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'description':
          whereConditions.push('description LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'category':
          whereConditions.push('category LIKE ?');
          bindValues.push(searchQuery);
          break;
      }
    }
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' OR ') : '1=0';
    const allowedSortFields = ['code', 'name', 'description', 'category', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'code';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    const countResult = await this.db.prepare(`SELECT COUNT(*) as total FROM findings WHERE ${whereClause}`).bind(...bindValues).first();
    const results = await this.db.prepare(`SELECT * FROM findings WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`).bind(...bindValues, limit, offset).all();
    return {
      results: results.results,
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0)
    };
  }

  async getAllFindings(limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const allowedSortFields = ['code', 'name', 'description', 'category', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'code';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    if (limit === undefined) {
      const result = await this.db.prepare(`SELECT * FROM findings ${orderClause}`).all();
      const findings = result.results;
      return {
        results: findings,
        total: findings.length,
        has_more: false
      };
    }
    const countResult = await this.db.prepare('SELECT COUNT(*) as total FROM findings').first();
    const result = await this.db.prepare(`SELECT * FROM findings ${orderClause} LIMIT ? OFFSET ?`).bind(limit, offset || 0).all();
    const findings = result.results;
    return {
      results: findings,
      total: (countResult as any)?.total || 0,
      has_more: (offset || 0) + limit < ((countResult as any)?.total || 0),
    };
  }

  async getFindingById(id: number) {
    const result = await this.db.prepare('SELECT * FROM findings WHERE id = ?').bind(id).first();
    return result || null;
  }

  async createFinding(finding) {
    const result = await this.db.prepare(
      'INSERT INTO findings (code, name, description, category) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(
      finding.code || null,
      finding.name,
      finding.description || null,
      finding.category || 'General'
    ).first();
    return result;
  }

  async updateFinding(id, finding) {
    const result = await this.db.prepare(
      'UPDATE findings SET code = COALESCE(?, code), name = COALESCE(?, name), description = COALESCE(?, description), category = COALESCE(?, category), updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
    ).bind(
      finding.code || null,
      finding.name || null,
      finding.description || null,
      finding.category || null,
      id
    ).first();
    if (!result) throw new Error('Finding not found');
    return result;
  }

  async deleteFinding(id) {
    const result = await this.db.prepare('DELETE FROM findings WHERE id = ?').bind(id).run();
    if (!result.success) throw new Error('Failed to delete finding');
  }

  async bulkImportFindings(items, replaceExisting = false) {
    let imported = 0;
    let errors = 0;
    for (const item of items) {
      try {
        if (!item.name) { errors++; continue; }
        if (replaceExisting && item.code) {
          await this.db.prepare('DELETE FROM findings WHERE code = ?').bind(item.code).run();
        }
        const existing = item.code ? await this.db.prepare('SELECT id FROM findings WHERE code = ?').bind(item.code).first() : null;
        if (existing && !replaceExisting) continue;
        await this.db.prepare(
          'INSERT OR REPLACE INTO findings (code, name, description, category) VALUES (?, ?, ?, ?)'
        ).bind(
          item.code,
          item.name,
          item.description || null,
          item.category || 'General'
        ).run();
        imported++;
      } catch (error) {
        console.error('Error importing finding:', error, item);
        errors++;
      }
    }
    return { imported, errors };
  }


  // Disease operations
  async searchDiseases(query: string, limit: number = 20, offset: number = 0, fields: string[] = ['code', 'name', 'description'], sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Disease>> {
    const searchQuery = `%${query}%`;
    
    // Build WHERE clause based on selected fields
    const whereConditions = [];
    const bindValues = [];
    
    for (const field of fields) {
      switch (field) {
        case 'code':
          whereConditions.push('code LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'name':
          whereConditions.push('name LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'description':
          whereConditions.push('description LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'category':
          whereConditions.push('category LIKE ?');
          bindValues.push(searchQuery);
          break;
      }
    }
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' OR ') : '1=0';
    
    // Build ORDER BY clause with validation
    const allowedSortFields = ['code', 'name', 'description', 'category', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'code';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM diseases WHERE ${whereClause}`
    ).bind(...bindValues).first();
    
    const results = await this.db.prepare(
      `SELECT * FROM diseases WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
    ).bind(...bindValues, limit, offset).all();

    return {
      results: results.results as unknown as Disease[],
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0)
    };
  }

  async getAllDiseases(limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Disease>> {
    // Build ORDER BY clause with validation
    const allowedSortFields = ['code', 'name', 'description', 'category', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'code';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    if (limit === undefined) {
      const result = await this.db.prepare(`SELECT * FROM diseases ${orderClause}`).all();
      const diseases = result.results as unknown as Disease[];
      return {
        results: diseases,
        total: diseases.length,
        has_more: false
      };
    }
    
    const countResult = await this.db.prepare('SELECT COUNT(*) as total FROM diseases').first();
    const result = await this.db
      .prepare(`SELECT * FROM diseases ${orderClause} LIMIT ? OFFSET ?`)
      .bind(limit, offset || 0)
      .all();
      
    const diseases = result.results as unknown as Disease[];

    return {
      results: diseases,
      total: (countResult as any)?.total || 0,
      has_more: (offset || 0) + limit < ((countResult as any)?.total || 0),
    };
  }

  async searchDiseasesByCategory(category: string, limit: number = 20, offset: number = 0, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Disease>> {
    try {
      const categoryPattern = `%${category}%`;
      
      // Build ORDER BY clause with validation
      const allowedSortFields = ['code', 'name', 'description', 'category', 'created_at', 'updated_at'];
      const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'code';
      const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
      const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
      
      const countResult = await this.db
        .prepare('SELECT COUNT(*) as total FROM diseases WHERE category LIKE ?')
        .bind(categoryPattern)
        .first();

      const results = await this.db
        .prepare(`SELECT * FROM diseases WHERE category LIKE ? ${orderClause} LIMIT ? OFFSET ?`)
        .bind(categoryPattern, limit, offset)
        .all();

      return {
        results: results.results as unknown as Disease[],
        total: (countResult as any)?.total || 0,
        has_more: offset + limit < ((countResult as any)?.total || 0),
      };
    } catch (error) {
      console.error('Search diseases by category error:', error);
      throw error;
    }
  }

  async getDiseaseById(id: number): Promise<Disease | null> {
    const result = await this.db.prepare('SELECT * FROM diseases WHERE id = ?').bind(id).first();
    return result as unknown as Disease | null;
  }

  async createDisease(disease: Omit<Disease, 'id' | 'created_at' | 'updated_at'>): Promise<Disease> {
    const result = await this.db.prepare(
      'INSERT INTO diseases (code, name, description, category) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(disease.code || null, disease.name, disease.description || null, disease.category || null).first();
    return result as unknown as Disease;
  }

  async updateDisease(id: number, disease: Partial<Disease>): Promise<Disease> {
    const result = await this.db.prepare(
      'UPDATE diseases SET code = COALESCE(?, code), name = COALESCE(?, name), description = COALESCE(?, description), category = COALESCE(?, category), updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
    ).bind(disease.code, disease.name, disease.description, disease.category, id).first();
    
    if (!result) {
      throw new Error('Disease not found');
    }
    
    return result as unknown as Disease;
  }

  async deleteDisease(id: number): Promise<void> {
    try {
      const result = await this.db.prepare('DELETE FROM diseases WHERE id = ?').bind(id).run();
      
      if (!result.success) {
        throw new Error('Failed to delete disease');
      }
    } catch (error) {
      console.error('Delete disease error:', error);
      throw error;
    }
  }

  async bulkImportDiseases(items: any[], replaceExisting: boolean = false): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.code || !item.name) {
          errors++;
          continue;
        }

        if (replaceExisting && item.code) {
          // Delete existing disease with same code
          await this.db.prepare('DELETE FROM diseases WHERE code = ?').bind(item.code).run();
        }

        // Check if disease with this code already exists
        const existing = await this.db.prepare('SELECT id FROM diseases WHERE code = ?').bind(item.code).first();
        
        if (existing && !replaceExisting) {
          // Skip if exists and not replacing
          continue;
        }

        // Insert the disease
        await this.db.prepare(
          'INSERT OR REPLACE INTO diseases (code, name, description, category) VALUES (?, ?, ?, ?)'
        ).bind(
          item.code,
          item.name,
          item.description || null,
          item.category || 'General'
        ).run();

        imported++;
      } catch (error) {
        console.error('Error importing disease:', error, item);
        errors++;
      }
    }

    return { imported, errors };
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

  // Drugs operations (TR dataset)
  async searchDrugs(query: string, limit: number = 20, offset: number = 0, fields: string[] = ['product_name', 'active_ingredient', 'atc_code'], sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Drug>> {
    const searchQuery = `%${query}%`;
    
    // Build WHERE clause based on selected fields
    const whereConditions = [];
    const bindValues = [];
    
    for (const field of fields) {
      switch (field) {
        case 'product_name':
          whereConditions.push('product_name LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'active_ingredient':
          whereConditions.push('active_ingredient LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'atc_code':
          whereConditions.push('atc_code LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'barcode':
          whereConditions.push('barcode LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'categories':
          whereConditions.push('categories LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'description':
          whereConditions.push('description LIKE ?');
          bindValues.push(searchQuery);
          break;
      }
    }
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' OR ') : '1=0';
    
    // Build ORDER BY clause with validation
    const allowedSortFields = ['product_name', 'active_ingredient', 'atc_code', 'barcode', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'product_name';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM drugs WHERE ${whereClause}`)
      .bind(...bindValues)
      .first();

    const results = await this.db
      .prepare(`SELECT * FROM drugs WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`)
      .bind(...bindValues, limit, offset)
      .all();

    const rows = (results.results as unknown as any[]).map((r) => ({
      ...r,
      categories: typeof r.categories === 'string' ? JSON.parse(r.categories || '[]') : r.categories,
    })) as Drug[]

    return {
      results: rows,
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0),
    };
  }

  async getAllDrugs(limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Drug>> {
    // Build ORDER BY clause with validation
    const allowedSortFields = ['product_name', 'active_ingredient', 'atc_code', 'barcode', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'product_name';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    if (limit === undefined) {
      // Original behavior for backwards compatibility
      const result = await this.db.prepare(`SELECT * FROM drugs ${orderClause}`).all();
      const rows = (result.results as unknown as any[]).map((r) => ({
        ...r,
        categories: typeof r.categories === 'string' ? JSON.parse(r.categories || '[]') : r.categories,
      })) as Drug[];
      return {
        results: rows,
        total: rows.length,
        has_more: false
      };
    }
    
    // Paginated version
    const countResult = await this.db.prepare('SELECT COUNT(*) as total FROM drugs').first();
    const result = await this.db
      .prepare(`SELECT * FROM drugs ${orderClause} LIMIT ? OFFSET ?`)
      .bind(limit, offset || 0)
      .all();
      
    const rows = (result.results as unknown as any[]).map((r) => ({
      ...r,
      categories: typeof r.categories === 'string' ? JSON.parse(r.categories || '[]') : r.categories,
    })) as Drug[];

    return {
      results: rows,
      total: (countResult as any)?.total || 0,
      has_more: (offset || 0) + limit < ((countResult as any)?.total || 0),
    };
  }

  async searchDrugsByCategory(category: string, limit: number = 20, offset: number = 0, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<SearchResponse<Drug>> {
    try {
      const categoryPattern = `%"${category}"%`;
      
      // Build ORDER BY clause with validation
      const allowedSortFields = ['product_name', 'active_ingredient', 'atc_code', 'barcode', 'created_at', 'updated_at'];
      const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'product_name';
      const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
      const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
      
      const countResult = await this.db
        .prepare('SELECT COUNT(*) as total FROM drugs WHERE categories LIKE ?')
        .bind(categoryPattern)
        .first();

      const results = await this.db
        .prepare(`SELECT * FROM drugs WHERE categories LIKE ? ${orderClause} LIMIT ? OFFSET ?`)
        .bind(categoryPattern, limit, offset)
        .all();

      const rows = (results.results as unknown as any[]).map((r) => ({
        ...r,
        categories: typeof r.categories === 'string' ? JSON.parse(r.categories || '[]') : r.categories,
      })) as Drug[]

      return {
        results: rows,
        total: (countResult as any)?.total || 0,
        has_more: offset + limit < ((countResult as any)?.total || 0),
      };
    } catch (error) {
      console.error('Search drugs by category error:', error);
      throw error;
    }
  }

  async getDrugById(id: number): Promise<Drug | null> {
    const result = await this.db.prepare('SELECT * FROM drugs WHERE id = ?').bind(id).first();
    if (!result) return null;
    const row: any = result;
    return {
      ...row,
      categories: typeof row.categories === 'string' ? JSON.parse(row.categories || '[]') : row.categories,
    } as Drug;
  }

  async upsertDrugByBarcode(input: CreateDrugRequest): Promise<Drug> {
    // Normalize categories to JSON string
    const categoriesProvided = input.categories !== undefined;
    const categoriesJson = categoriesProvided
      ? (Array.isArray(input.categories)
          ? JSON.stringify(input.categories)
          : input.categories
          ? JSON.stringify(String(input.categories).split(',').map((s) => s.trim()).filter(Boolean))
          : JSON.stringify([]))
      : undefined;

    if (input.barcode) {
      const existing = await this.db.prepare('SELECT * FROM drugs WHERE barcode = ?').bind(input.barcode).first();
      if (existing) {
        const updated = await this.db
          .prepare(
            `UPDATE drugs SET 
              atc_code = COALESCE(?, atc_code), 
              active_ingredient = COALESCE(?, active_ingredient), 
              product_name = COALESCE(?, product_name), 
              categories = COALESCE(${categoriesProvided ? '?' : 'categories'}, categories), 
              description = COALESCE(?, description), 
              updated_at = CURRENT_TIMESTAMP 
             WHERE barcode = ? RETURNING *`
          )
          .bind(
            input.atc_code ?? null,
            input.active_ingredient ?? null,
            input.product_name ?? null,
            ...(categoriesProvided ? [categoriesJson ?? null] as any[] : []),
            input.description ?? null,
            input.barcode
          )
          .first();
        return updated as unknown as Drug;
      }
    }

    const inserted = await this.db
      .prepare(
        'INSERT INTO drugs (barcode, atc_code, active_ingredient, product_name, categories, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(
        input.barcode ?? null,
        input.atc_code ?? null,
        input.active_ingredient ?? null,
        input.product_name ?? null,
        categoriesJson ?? JSON.stringify([]),
        input.description ?? null
      )
      .first();

    return inserted as unknown as Drug;
  }

  async bulkImportDrugs(items: CreateDrugRequest[], replaceExisting: boolean = false): Promise<{ inserted: number; updated: number }>{
    let inserted = 0;
    let updated = 0;
    for (const item of items) {
      if (replaceExisting && item.barcode) {
        await this.db.prepare('DELETE FROM drugs WHERE barcode = ?').bind(item.barcode).run();
      }
      const existing = item.barcode
        ? await this.db.prepare('SELECT id FROM drugs WHERE barcode = ?').bind(item.barcode).first()
        : null;
      if (existing) {
        await this.upsertDrugByBarcode(item);
        updated += 1;
      } else {
        await this.upsertDrugByBarcode(item);
        inserted += 1;
      }
    }
    return { inserted, updated };
  }

  async createDrug(item: CreateDrugRequest): Promise<Drug> {
    return this.upsertDrugByBarcode(item);
  }

  async updateDrug(id: number, updates: Partial<CreateDrugRequest>): Promise<Drug | null> {
    try {
      // First check if the drug exists
      const existing = await this.getDrugById(id);
      if (!existing) {
        return null;
      }

      // Build the update query dynamically based on provided fields
      const updateFields = [];
      const values = [];

      if (updates.product_name !== undefined) {
        updateFields.push('product_name = ?');
        values.push(updates.product_name);
      }
      if (updates.active_ingredient !== undefined) {
        updateFields.push('active_ingredient = ?');
        values.push(updates.active_ingredient);
      }
      if (updates.atc_code !== undefined) {
        updateFields.push('atc_code = ?');
        values.push(updates.atc_code);
      }
      if (updates.barcode !== undefined) {
        updateFields.push('barcode = ?');
        values.push(updates.barcode);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.categories !== undefined) {
        updateFields.push('categories = ?');
        const categoriesJson = Array.isArray(updates.categories)
          ? JSON.stringify(updates.categories)
          : typeof updates.categories === 'string'
            ? JSON.stringify(updates.categories.split(',').map(s => s.trim()).filter(Boolean))
            : JSON.stringify([]);
        values.push(categoriesJson);
      }

      if (updateFields.length === 0) {
        return existing; // No updates to make
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE drugs SET ${updateFields.join(', ')} WHERE id = ? RETURNING *`;
      const result = await this.db.prepare(query).bind(...values).first();

      if (!result) {
        return null;
      }

      const row: any = result;
      return {
        ...row,
        categories: typeof row.categories === 'string' ? JSON.parse(row.categories || '[]') : row.categories,
      } as Drug;
    } catch (error) {
      console.error('Update drug error:', error);
      throw error;
    }
  }

  async deleteDrug(id: number): Promise<boolean> {
    try {
      const result = await this.db.prepare('DELETE FROM drugs WHERE id = ?').bind(id).run();
      return result.success;
    } catch (error) {
      console.error('Delete drug error:', error);
      throw error;
    }
  }

  // Therapies operations
  async searchTherapies(query: string, limit: number = 20, offset: number = 0, fields: string[] = ['name', 'active_ingredient', 'category'], sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const searchQuery = `%${query}%`;
    
    // Build WHERE clause based on selected fields
    const whereConditions = [];
    const bindValues = [];
    
    for (const field of fields) {
      switch (field) {
        case 'name':
          whereConditions.push('name LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'active_ingredient':
          whereConditions.push('active_ingredient LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'category':
          whereConditions.push('category LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'description':
          whereConditions.push('description LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'dosage_form':
          whereConditions.push('dosage_form LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'strength':
          whereConditions.push('strength LIKE ?');
          bindValues.push(searchQuery);
          break;
        case 'manufacturer':
          whereConditions.push('manufacturer LIKE ?');
          bindValues.push(searchQuery);
          break;
      }
    }
    
    const whereClause = whereConditions.length > 0 ? whereConditions.join(' OR ') : '1=0';
    
    // Build ORDER BY clause with validation
    const allowedSortFields = ['name', 'active_ingredient', 'category', 'dosage_form', 'strength', 'manufacturer', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM therapies WHERE ${whereClause}`)
      .bind(...bindValues)
      .first();

    const results = await this.db
      .prepare(`SELECT * FROM therapies WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`)
      .bind(...bindValues, limit, offset)
      .all();

    return {
      results: results.results,
      total: (countResult as any)?.total || 0,
      has_more: offset + limit < ((countResult as any)?.total || 0),
    };
  }

  async getAllTherapies(limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc') {
    // Build ORDER BY clause with validation
    const allowedSortFields = ['name', 'active_ingredient', 'category', 'dosage_form', 'strength', 'manufacturer', 'created_at', 'updated_at'];
    const validSortBy = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = sortOrder && ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}`;
    
    if (limit === undefined) {
      const result = await this.db.prepare(`SELECT * FROM therapies ${orderClause}`).all();
      const therapies = result.results;
      return {
        results: therapies,
        total: therapies.length,
        has_more: false
      };
    }
    
    // Paginated version
    const countResult = await this.db.prepare('SELECT COUNT(*) as total FROM therapies').first();
    const result = await this.db
      .prepare(`SELECT * FROM therapies ${orderClause} LIMIT ? OFFSET ?`)
      .bind(limit, offset || 0)
      .all();

    return {
      results: result.results,
      total: (countResult as any)?.total || 0,
      has_more: (offset || 0) + limit < ((countResult as any)?.total || 0),
    };
  }

  async getTherapyById(id: number) {
    const result = await this.db.prepare('SELECT * FROM therapies WHERE id = ?').bind(id).first();
    return result || null;
  }

  async createTherapy(therapy: any) {
    const result = await this.db.prepare(
      'INSERT INTO therapies (name, description, category, active_ingredient, dosage_form, strength, manufacturer) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(
      therapy.name,
      therapy.description || null,
      therapy.category || 'General',
      therapy.active_ingredient || null,
      therapy.dosage_form || null,
      therapy.strength || null,
      therapy.manufacturer || null
    ).first();
    return result;
  }

  async updateTherapy(id: number, therapy: any) {
    const result = await this.db.prepare(
      'UPDATE therapies SET name = COALESCE(?, name), description = COALESCE(?, description), category = COALESCE(?, category), active_ingredient = COALESCE(?, active_ingredient), dosage_form = COALESCE(?, dosage_form), strength = COALESCE(?, strength), manufacturer = COALESCE(?, manufacturer), updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
    ).bind(
      therapy.name || null,
      therapy.description || null,
      therapy.category || null,
      therapy.active_ingredient || null,
      therapy.dosage_form || null,
      therapy.strength || null,
      therapy.manufacturer || null,
      id
    ).first();
    if (!result) throw new Error('Therapy not found');
    return result;
  }

  async deleteTherapy(id: number): Promise<boolean> {
    try {
      const result = await this.db.prepare('DELETE FROM therapies WHERE id = ?').bind(id).run();
      return result.success;
    } catch (error) {
      console.error('Delete therapy error:', error);
      throw error;
    }
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
    diseaseIds: number[] = [],
    findingIds: number[] = []
  ): Promise<PrescriptionTemplate> {
    // Create prescription template
    const prescription = await this.db.prepare(
      'INSERT INTO prescription_templates (name, description, created_by, is_active) VALUES (?, ?, ?, TRUE) RETURNING *'
    ).bind(template.name, template.description, template.created_by).first() as PrescriptionTemplate;

    // Add prescription items
    for (const item of items) {
      await this.db.prepare(
        'INSERT INTO prescription_items (prescription_template_id, medication_id, therapy_id, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        prescription.id,
        item.medication_id || null,
        item.therapy_id || null,
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

    // Associate with findings
    for (const findingId of findingIds) {
      await this.db.prepare(
        'INSERT OR IGNORE INTO finding_prescriptions (finding_id, prescription_template_id, confidence_score) VALUES (?, ?, 1.0)'
      ).bind(findingId, prescription.id).run();
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
