-- ============================================================================
-- RuralConnect AI - Health Module Schema
-- ============================================================================

-- ============================================================================
-- HEALTH PROFILES TABLE
-- ============================================================================

CREATE TABLE health_profiles (
    health_profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Basic Health Information
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    bmi DECIMAL(4, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN height_cm > 0 THEN weight_kg / ((height_cm / 100) * (height_cm / 100))
            ELSE NULL
        END
    ) STORED,
    
    -- Activity Level
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    occupation_type VARCHAR(50) CHECK (occupation_type IN ('desk_job', 'light_physical', 'moderate_physical', 'heavy_physical', 'farming')),
    
    -- Medical History
    chronic_conditions TEXT[],
    allergies TEXT[],
    current_medications TEXT[],
    
    -- Dietary Restrictions
    dietary_restrictions TEXT[] CHECK (dietary_restrictions <@ ARRAY['vegetarian', 'vegan', 'gluten_free', 'lactose_intolerant', 'diabetic', 'none']),
    food_allergies TEXT[],
    
    -- Emergency Contacts
    emergency_contacts JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for health_profiles
CREATE INDEX idx_health_user ON health_profiles(user_id);
CREATE INDEX idx_health_activity ON health_profiles(activity_level);

-- ============================================================================
-- SYMPTOMS TABLE (Master List)
-- ============================================================================

CREATE TABLE symptoms (
    symptom_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Symptom Information
    symptom_name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) CHECK (category IN ('respiratory', 'digestive', 'cardiovascular', 'neurological', 'musculoskeletal', 'skin', 'general', 'emergency')),
    severity_indicators TEXT[],
    
    -- Emergency Flags
    is_emergency_symptom BOOLEAN DEFAULT FALSE,
    red_flags TEXT[],
    
    -- Description
    description TEXT,
    common_causes TEXT[],
    
    -- Multi-language Names
    names_multilang JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for symptoms
CREATE INDEX idx_symptoms_name ON symptoms(symptom_name);
CREATE INDEX idx_symptoms_category ON symptoms(category);
CREATE INDEX idx_symptoms_emergency ON symptoms(is_emergency_symptom) WHERE is_emergency_symptom = TRUE;

-- ============================================================================
-- SYMPTOM ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE symptom_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Symptoms Reported
    symptoms JSONB NOT NULL, -- Array of symptom objects with severity, duration
    
    -- Assessment Details
    duration VARCHAR(50) CHECK (duration IN ('less_than_1_hour', '1_to_6_hours', '6_to_24_hours', '1_to_3_days', '3_to_7_days', 'more_than_week')),
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    
    -- Risk Assessment
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    emergency_category VARCHAR(50),
    requires_immediate_attention BOOLEAN DEFAULT FALSE,
    
    -- AI Analysis
    ai_assessment JSONB,
    ai_confidence DECIMAL(5, 2),
    ai_model_version VARCHAR(50),
    
    -- Recommendations
    first_aid_steps TEXT[],
    when_to_seek_help TEXT,
    recommended_remedies UUID[], -- References to natural_remedies
    
    -- Follow-up
    outcome VARCHAR(50) CHECK (outcome IN ('improved', 'no_change', 'worsened', 'sought_medical_help', 'unknown')),
    outcome_notes TEXT,
    outcome_reported_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for symptom_assessments
CREATE INDEX idx_assessments_user ON symptom_assessments(user_id);
CREATE INDEX idx_assessments_risk ON symptom_assessments(risk_level);
CREATE INDEX idx_assessments_emergency ON symptom_assessments(requires_immediate_attention) WHERE requires_immediate_attention = TRUE;
CREATE INDEX idx_assessments_created ON symptom_assessments(created_at);

-- ============================================================================
-- NATURAL REMEDIES TABLE
-- ============================================================================

CREATE TABLE natural_remedies (
    remedy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Remedy Information
    remedy_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) CHECK (category IN ('ayurvedic', 'herbal', 'home_remedy', 'dietary', 'lifestyle')),
    
    -- Multi-language Names
    names_multilang JSONB,
    
    -- Conditions Treated
    conditions_treated TEXT[],
    symptoms_addressed TEXT[],
    
    -- Ingredients
    ingredients JSONB NOT NULL, -- Array of ingredient objects with quantities
    
    -- Preparation
    preparation_method TEXT NOT NULL,
    preparation_time_minutes INTEGER,
    preparation_steps TEXT[],
    
    -- Usage
    dosage_instructions TEXT NOT NULL,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    best_time_to_take VARCHAR(100),
    
    -- Age-specific Dosage
    dosage_by_age JSONB, -- Different dosages for different age groups
    
    -- Safety Information
    contraindications TEXT[],
    side_effects TEXT[],
    warnings TEXT[],
    safe_for_pregnancy BOOLEAN DEFAULT FALSE,
    safe_for_children BOOLEAN DEFAULT FALSE,
    
    -- Efficacy
    efficacy_rating DECIMAL(3, 2) CHECK (efficacy_rating BETWEEN 0 AND 5),
    evidence_level VARCHAR(50) CHECK (evidence_level IN ('scientific_research', 'clinical_trials', 'traditional_use', 'anecdotal')),
    success_rate DECIMAL(5, 2),
    
    -- Seasonal Availability
    seasonal_availability TEXT[],
    ingredient_availability VARCHAR(20) CHECK (ingredient_availability IN ('easily_available', 'moderately_available', 'rare', 'seasonal')),
    
    -- Media
    images TEXT[],
    videos TEXT[],
    audio_instructions TEXT[],
    
    -- Verification
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Engagement
    usage_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for natural_remedies
CREATE INDEX idx_remedies_name ON natural_remedies(remedy_name);
CREATE INDEX idx_remedies_category ON natural_remedies(category);
CREATE INDEX idx_remedies_status ON natural_remedies(status);
CREATE INDEX idx_remedies_conditions ON natural_remedies USING GIN(conditions_treated);
CREATE INDEX idx_remedies_symptoms ON natural_remedies USING GIN(symptoms_addressed);
CREATE INDEX idx_remedies_efficacy ON natural_remedies(efficacy_rating);

-- Full-text search index
CREATE INDEX idx_remedies_search ON natural_remedies USING GIN(
    to_tsvector('english', remedy_name || ' ' || COALESCE(preparation_method, ''))
);

-- ============================================================================
-- REMEDY USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE remedy_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    remedy_id UUID NOT NULL REFERENCES natural_remedies(remedy_id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES symptom_assessments(assessment_id) ON DELETE SET NULL,
    
    -- Usage Details
    start_date DATE NOT NULL,
    end_date DATE,
    frequency_per_day INTEGER,
    
    -- Effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    symptoms_improved BOOLEAN,
    side_effects_experienced TEXT[],
    
    -- Feedback
    user_notes TEXT,
    would_recommend BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for remedy_usage
CREATE INDEX idx_usage_user ON remedy_usage(user_id);
CREATE INDEX idx_usage_remedy ON remedy_usage(remedy_id);
CREATE INDEX idx_usage_assessment ON remedy_usage(assessment_id);

-- ============================================================================
-- NUTRITION PLANS TABLE
-- ============================================================================

CREATE TABLE nutrition_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Plan Information
    plan_name VARCHAR(255),
    plan_type VARCHAR(50) CHECK (plan_type IN ('weight_loss', 'weight_gain', 'maintenance', 'therapeutic', 'custom')),
    
    -- Nutritional Goals
    target_calories INTEGER NOT NULL,
    target_protein_g DECIMAL(6, 2),
    target_carbs_g DECIMAL(6, 2),
    target_fat_g DECIMAL(6, 2),
    target_fiber_g DECIMAL(6, 2),
    
    -- Meal Structure
    meals_per_day INTEGER DEFAULT 5,
    meal_schedule JSONB, -- Meal times and types
    
    -- Dietary Preferences
    cuisine_preferences TEXT[],
    avoid_foods TEXT[],
    
    -- Budget
    daily_budget_inr DECIMAL(8, 2),
    cost_optimized BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for nutrition_plans
CREATE INDEX idx_nutrition_user ON nutrition_plans(user_id);
CREATE INDEX idx_nutrition_active ON nutrition_plans(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- MEAL PLANS TABLE
-- ============================================================================

CREATE TABLE meal_plans (
    meal_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(plan_id) ON DELETE CASCADE,
    
    -- Meal Information
    meal_date DATE NOT NULL,
    meal_type VARCHAR(50) CHECK (meal_type IN ('breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner')),
    meal_time TIME,
    
    -- Food Items
    food_items JSONB NOT NULL, -- Array of food items with quantities
    
    -- Nutritional Content
    total_calories INTEGER,
    total_protein_g DECIMAL(6, 2),
    total_carbs_g DECIMAL(6, 2),
    total_fat_g DECIMAL(6, 2),
    total_fiber_g DECIMAL(6, 2),
    
    -- Cost
    estimated_cost_inr DECIMAL(8, 2),
    
    -- Recipe
    recipe_instructions TEXT,
    preparation_time_minutes INTEGER,
    
    -- Compliance
    consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP,
    compliance_rating INTEGER CHECK (compliance_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for meal_plans
CREATE INDEX idx_meals_plan ON meal_plans(nutrition_plan_id);
CREATE INDEX idx_meals_date ON meal_plans(meal_date);
CREATE INDEX idx_meals_type ON meal_plans(meal_type);
CREATE INDEX idx_meals_consumed ON meal_plans(consumed);

-- ============================================================================
-- FIRST AID PROTOCOLS TABLE
-- ============================================================================

CREATE TABLE first_aid_protocols (
    protocol_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Protocol Information
    protocol_name VARCHAR(255) NOT NULL,
    emergency_type VARCHAR(100) NOT NULL,
    severity_level VARCHAR(20) CHECK (severity_level IN ('minor', 'moderate', 'severe', 'life_threatening')),
    
    -- Instructions
    immediate_steps TEXT[] NOT NULL,
    detailed_instructions TEXT NOT NULL,
    what_not_to_do TEXT[],
    
    -- When to Seek Help
    seek_medical_help_if TEXT[],
    call_emergency_if TEXT[],
    
    -- Checkpoints
    checkpoints JSONB, -- Array of checkpoint objects with timing
    
    -- Media
    images TEXT[],
    videos TEXT[],
    diagrams TEXT[],
    
    -- Multi-language Support
    content_multilang JSONB,
    
    -- Offline Availability
    cached_for_offline BOOLEAN DEFAULT TRUE,
    priority_level INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for first_aid_protocols
CREATE INDEX idx_protocols_type ON first_aid_protocols(emergency_type);
CREATE INDEX idx_protocols_severity ON first_aid_protocols(severity_level);
CREATE INDEX idx_protocols_offline ON first_aid_protocols(cached_for_offline) WHERE cached_for_offline = TRUE;

-- ============================================================================
-- HEALTH RECORDS TABLE (Encrypted)
-- ============================================================================

CREATE TABLE health_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Record Type
    record_type VARCHAR(50) CHECK (record_type IN ('lab_test', 'prescription', 'diagnosis', 'vaccination', 'medical_report', 'other')),
    
    -- Record Data (Encrypted)
    record_data_encrypted TEXT NOT NULL,
    record_metadata JSONB, -- Non-sensitive metadata
    
    -- File Attachments
    file_urls TEXT[],
    
    -- Date
    record_date DATE NOT NULL,
    
    -- Provider Information
    provider_name VARCHAR(255),
    provider_type VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for health_records
CREATE INDEX idx_records_user ON health_records(user_id);
CREATE INDEX idx_records_type ON health_records(record_type);
CREATE INDEX idx_records_date ON health_records(record_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_health_profiles_updated_at
    BEFORE UPDATE ON health_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symptoms_updated_at
    BEFORE UPDATE ON symptoms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_natural_remedies_updated_at
    BEFORE UPDATE ON natural_remedies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remedy_usage_updated_at
    BEFORE UPDATE ON remedy_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_plans_updated_at
    BEFORE UPDATE ON nutrition_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_first_aid_protocols_updated_at
    BEFORE UPDATE ON first_aid_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
    BEFORE UPDATE ON health_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active nutrition plans view
CREATE VIEW active_nutrition_plans AS
SELECT 
    np.*,
    hp.activity_level,
    hp.weight_kg,
    hp.height_cm,
    hp.bmi
FROM nutrition_plans np
JOIN health_profiles hp ON np.user_id = hp.user_id
WHERE np.is_active = TRUE;

-- Popular remedies view
CREATE VIEW popular_remedies AS
SELECT 
    remedy_id,
    remedy_name,
    category,
    efficacy_rating,
    usage_count,
    helpful_count,
    (helpful_count::FLOAT / NULLIF(helpful_count + not_helpful_count, 0)) as helpfulness_ratio
FROM natural_remedies
WHERE status = 'published'
ORDER BY usage_count DESC, efficacy_rating DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE health_profiles IS 'User health profiles with medical history';
COMMENT ON TABLE symptoms IS 'Master list of symptoms with emergency indicators';
COMMENT ON TABLE symptom_assessments IS 'User symptom assessments with AI analysis';
COMMENT ON TABLE natural_remedies IS 'Natural and Ayurvedic remedies database';
COMMENT ON TABLE remedy_usage IS 'Tracking of remedy usage and effectiveness';
COMMENT ON TABLE nutrition_plans IS 'Personalized nutrition plans';
COMMENT ON TABLE meal_plans IS 'Daily meal plans with nutritional information';
COMMENT ON TABLE first_aid_protocols IS 'First aid instructions for emergencies';
COMMENT ON TABLE health_records IS 'Encrypted health records and documents';
