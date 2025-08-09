// Database types
export interface Disease {
  id: number;
  code: string; // ICD-10 code
  name: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionTemplate {
  id: number;
  name: string;
  description?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: number;
  name: string;
  generic_name?: string;
  dosage_form?: string; // tablet, capsule, syrup, etc.
  strength?: string; // 500mg, 10ml, etc.
  manufacturer?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Drug {
  id: number;
  barcode?: string;
  atc_code?: string;
  active_ingredient?: string;
  product_name?: string;
  categories?: string[]; // Stored as JSON in DB
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  id: number;
  prescription_template_id: number;
  medication_id: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  medication?: Medication; // populated via JOIN
}

export interface DiseasePrescription {
  id: number;
  disease_id: number;
  prescription_template_id: number;
  confidence_score: number;
  created_at: string;
  disease?: Disease; // populated via JOIN
  prescription_template?: PrescriptionTemplate; // populated via JOIN
}

export interface SearchLog {
  id: number;
  query: string;
  search_type: 'disease' | 'medication' | 'prescription';
  results_count: number;
  user_id?: string;
  created_at: string;
}

export interface AISuggestion {
  id: number;
  query: string;
  suggestion_type: 'prescription' | 'medication' | 'disease';
  suggestions: string; // JSON array
  confidence_score: number;
  expires_at?: string;
  created_at: string;
}

export interface AppConfig {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

// API Request/Response types
export interface SearchRequest {
  query: string;
  type: 'disease' | 'medication' | 'prescription' | 'all';
  limit?: number;
  offset?: number;
  ai_enabled?: boolean;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  has_more: boolean;
  ai_suggestions?: any[];
}

export interface CreatePrescriptionRequest {
  name: string;
  description?: string;
  items: {
    medication_id: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  disease_ids?: number[];
}

export interface UpdatePrescriptionRequest extends Partial<CreatePrescriptionRequest> {
  id: number;
  is_active?: boolean;
}

export interface CreateDiseaseRequest {
  code: string;
  name: string;
  description?: string;
  category?: string;
}

export interface CreateMedicationRequest {
  name: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  category?: string;
}

export interface CreateDrugRequest {
  barcode?: string;
  atc_code?: string;
  active_ingredient?: string;
  product_name?: string;
  categories?: string[] | string; // Accept string for convenience; backend will normalize
  description?: string;
}

export interface BulkImportDrugsRequest {
  items: CreateDrugRequest[];
  replace_existing?: boolean;
}

// Frontend component props
export interface PrescriptionCardProps {
  prescription: PrescriptionTemplate & {
    items?: PrescriptionItem[];
    diseases?: Disease[];
  };
  onEdit?: (prescription: PrescriptionTemplate) => void;
  onDelete?: (id: number) => void;
  onView?: (prescription: PrescriptionTemplate) => void;
}

export interface SearchBarProps {
  onSearch: (query: string, type: SearchRequest['type']) => void;
  placeholder?: string;
  defaultType?: SearchRequest['type'];
  loading?: boolean;
}

export interface DiseaseSelectProps {
  selected: Disease[];
  onSelect: (diseases: Disease[]) => void;
  multiple?: boolean;
}

export interface MedicationSelectProps {
  selected: Medication[];
  onSelect: (medications: Medication[]) => void;
  multiple?: boolean;
}

// Cloudflare Workers environment
export interface Env {
  DB: D1Database;
  AI_API_KEY?: string;
  AI_PROVIDER?: string;
}

// AI Integration types
export interface AISearchRequest {
  query: string;
  context?: {
    diseases?: Disease[];
    medications?: Medication[];
    prescriptions?: PrescriptionTemplate[];
  };
}

export interface AISearchResponse {
  suggestions: {
    type: 'disease' | 'medication' | 'prescription';
    items: any[];
    confidence: number;
    reasoning?: string;
  }[];
  enhanced_query?: string;
}

export interface DosageCalculationRequest {
  medication_id: number;
  patient_weight?: number;
  patient_age?: number;
  condition?: string;
}

export interface DosageCalculationResponse {
  recommended_dosage: string;
  frequency: string;
  duration?: string;
  warnings?: string[];
  contraindications?: string[];
}
