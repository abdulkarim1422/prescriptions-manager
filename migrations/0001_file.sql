-- Create findings table
CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_findings_code ON findings(code);
CREATE INDEX IF NOT EXISTS idx_findings_name ON findings(name);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
-- Migration number: 0001

-- Create diseases table
CREATE TABLE IF NOT EXISTS diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    generic_name TEXT,
    dosage_form TEXT,
    strength TEXT,
    manufacturer TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create drugs table
CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    atc_code TEXT,
    active_ingredient TEXT,
    product_name TEXT,
    categories TEXT DEFAULT '[]', -- JSON array
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create prescription templates table
CREATE TABLE IF NOT EXISTS prescription_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create prescription items table
CREATE TABLE IF NOT EXISTS prescription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_template_id INTEGER NOT NULL,
    medication_id INTEGER NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    FOREIGN KEY (prescription_template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES drugs(id) ON DELETE RESTRICT
);

-- Create disease prescriptions association table
CREATE TABLE IF NOT EXISTS disease_prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disease_id INTEGER NOT NULL,
    prescription_template_id INTEGER NOT NULL,
    confidence_score REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
    UNIQUE(disease_id, prescription_template_id)
);

-- Create finding prescriptions association table
CREATE TABLE IF NOT EXISTS finding_prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finding_id INTEGER NOT NULL,
    prescription_template_id INTEGER NOT NULL,
    confidence_score REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
    UNIQUE(finding_id, prescription_template_id)
);

-- Create search logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    search_type TEXT CHECK(search_type IN ('disease', 'medication', 'prescription')) NOT NULL,
    results_count INTEGER DEFAULT 0,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    suggestion_type TEXT CHECK(suggestion_type IN ('prescription', 'medication', 'disease')) NOT NULL,
    suggestions TEXT NOT NULL, -- JSON array
    confidence_score REAL DEFAULT 0.0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create app config table
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diseases_code ON diseases(code);
CREATE INDEX IF NOT EXISTS idx_diseases_name ON diseases(name);
CREATE INDEX IF NOT EXISTS idx_diseases_category ON diseases(category);

CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_generic_name ON medications(generic_name);

CREATE INDEX IF NOT EXISTS idx_drugs_barcode ON drugs(barcode);
CREATE INDEX IF NOT EXISTS idx_drugs_atc_code ON drugs(atc_code);
CREATE INDEX IF NOT EXISTS idx_drugs_product_name ON drugs(product_name);

CREATE INDEX IF NOT EXISTS idx_prescription_items_template_id ON prescription_items(prescription_template_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_id ON prescription_items(medication_id);

CREATE INDEX IF NOT EXISTS idx_disease_prescriptions_disease_id ON disease_prescriptions(disease_id);
CREATE INDEX IF NOT EXISTS idx_disease_prescriptions_template_id ON disease_prescriptions(prescription_template_id);

CREATE INDEX IF NOT EXISTS idx_finding_prescriptions_finding_id ON finding_prescriptions(finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_prescriptions_template_id ON finding_prescriptions(prescription_template_id);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_type ON search_logs(search_type);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_query ON ai_suggestions(query);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_expires_at ON ai_suggestions(expires_at);