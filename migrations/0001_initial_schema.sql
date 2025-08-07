-- Migration: Create prescriptions database schema
-- Created at: 2025-08-07

-- Diseases table with ICD-10 codes
CREATE TABLE diseases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- ICD-10 code
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prescription templates table
CREATE TABLE prescription_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT, -- doctor/user identifier
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medications table
CREATE TABLE medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage_form TEXT, -- tablet, capsule, syrup, etc.
  strength TEXT, -- 500mg, 10ml, etc.
  manufacturer TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items (medications in a prescription template)
CREATE TABLE prescription_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prescription_template_id INTEGER NOT NULL,
  medication_id INTEGER NOT NULL,
  dosage TEXT NOT NULL, -- e.g., "1 tablet"
  frequency TEXT NOT NULL, -- e.g., "twice daily"
  duration TEXT NOT NULL, -- e.g., "7 days"
  instructions TEXT, -- special instructions
  FOREIGN KEY (prescription_template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- Disease-prescription associations
CREATE TABLE disease_prescriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disease_id INTEGER NOT NULL,
  prescription_template_id INTEGER NOT NULL,
  confidence_score REAL DEFAULT 1.0, -- for AI suggestions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE,
  FOREIGN KEY (prescription_template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE,
  UNIQUE(disease_id, prescription_template_id)
);

-- Search logs for analytics and AI improvement
CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'disease', 'medication', 'prescription'
  results_count INTEGER DEFAULT 0,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI suggestions cache
CREATE TABLE ai_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'prescription', 'medication', 'disease'
  suggestions TEXT NOT NULL, -- JSON array of suggestions
  confidence_score REAL DEFAULT 0.0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration table for app settings
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_diseases_code ON diseases(code);
CREATE INDEX idx_diseases_name ON diseases(name);
CREATE INDEX idx_prescription_templates_name ON prescription_templates(name);
CREATE INDEX idx_medications_name ON medications(name);
CREATE INDEX idx_prescription_items_template ON prescription_items(prescription_template_id);
CREATE INDEX idx_disease_prescriptions_disease ON disease_prescriptions(disease_id);
CREATE INDEX idx_disease_prescriptions_prescription ON disease_prescriptions(prescription_template_id);
CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_ai_suggestions_query ON ai_suggestions(query);

-- Insert default configuration
INSERT INTO app_config (key, value, description) VALUES 
  ('ai_enabled', 'true', 'Enable AI features'),
  ('ai_provider', 'openai', 'AI provider (openai, anthropic, etc.)'),
  ('search_suggestions_enabled', 'true', 'Enable search suggestions'),
  ('auto_save_enabled', 'true', 'Enable auto-save for prescription templates');

-- Sample data for development
INSERT INTO diseases (code, name, description, category) VALUES 
  ('J00', 'Acute nasopharyngitis [common cold]', 'Common cold with nasal congestion', 'Respiratory'),
  ('K30', 'Functional dyspepsia', 'Indigestion and stomach discomfort', 'Digestive'),
  ('M25.50', 'Pain in unspecified joint', 'Joint pain of unknown origin', 'Musculoskeletal'),
  ('R50.9', 'Fever, unspecified', 'Fever without known cause', 'General symptoms');

INSERT INTO medications (name, generic_name, dosage_form, strength, category) VALUES 
  ('Paracetamol', 'Acetaminophen', 'Tablet', '500mg', 'Analgesic'),
  ('Ibuprofen', 'Ibuprofen', 'Tablet', '400mg', 'NSAID'),
  ('Amoxicillin', 'Amoxicillin', 'Capsule', '250mg', 'Antibiotic'),
  ('Cetirizine', 'Cetirizine HCl', 'Tablet', '10mg', 'Antihistamine'),
  ('Omeprazole', 'Omeprazole', 'Capsule', '20mg', 'PPI');

INSERT INTO prescription_templates (name, description, created_by) VALUES 
  ('Common Cold Treatment', 'Standard treatment for common cold symptoms', 'system'),
  ('Pain Relief - Mild', 'Basic pain relief for mild discomfort', 'system'),
  ('Gastritis Treatment', 'Treatment for stomach inflammation', 'system');

INSERT INTO prescription_items (prescription_template_id, medication_id, dosage, frequency, duration, instructions) VALUES 
  (1, 1, '1 tablet', 'Every 6 hours', '5 days', 'Take with food'),
  (1, 4, '1 tablet', 'Once daily', '7 days', 'Take at bedtime'),
  (2, 1, '1 tablet', 'Every 8 hours', '3 days', 'As needed for pain'),
  (3, 5, '1 capsule', 'Once daily', '14 days', 'Take before breakfast');

INSERT INTO disease_prescriptions (disease_id, prescription_template_id, confidence_score) VALUES 
  (1, 1, 0.9),
  (3, 2, 0.8),
  (2, 3, 0.85);
