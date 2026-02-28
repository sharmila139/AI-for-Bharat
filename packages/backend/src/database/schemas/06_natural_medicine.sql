-- ============================================================================
-- RuralConnect AI - Natural Medicine Database Schema
-- ============================================================================
-- This schema provides comprehensive natural medicine/remedy database with:
-- - Multi-language support for remedy names and instructions
-- - Detailed ingredient tracking with seasonal availability
-- - Step-by-step preparation methods with media support
-- - Age-specific dosage guidelines
-- - Comprehensive safety information
-- - Community ratings and verification workflow
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- REMEDIES TABLE (Core remedy information)
-- ============================================================================

CREATE TABLE remedies (
    remedy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Multi-language Names (JSONB for flexibility)
    -- Format: {"en": "Turmeric Milk", "hi": "हल्दी दूध", "ta": "மஞ்சள் பால்", "scientific": "Curcuma longa"}
    names JSONB NOT NULL,
    
    -- Description
    description TEXT,
    description_multilang JSONB, -- Multi-language descriptions
    
    -- Ailments Treated
    ailments_treated TEXT[] NOT NULL,
    symptoms_addressed TEXT[],
    
    -- Preparation Details
    preparation_time_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'difficult')),
    
    -- Efficacy and Evidence
    efficacy_rating DECIMAL(3, 2) CHECK (efficacy_rating BETWEEN 1.0 AND 5.0),
    evidence_level VARCHAR(20) CHECK (evidence_level IN ('traditional', 'moderate', 'strong')) NOT NULL,
    success_rate_percentage DECIMAL(5, 2) CHECK (success_rate_percentage BETWEEN 0 AND 100),
    
    -- Verification Status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Category
    category VARCHAR(50) CHECK (category IN ('ayurvedic', 'herbal', 'home_remedy', 'dietary', 'lifestyle')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_names_structure CHECK (
        names ? 'en' AND 
        jsonb_typeof(names) = 'object'
    )
);

-- Indexes for remedies
CREATE INDEX idx_remedies_status ON remedies(status);
CREATE INDEX idx_remedies_verification ON remedies(verification_status);
CREATE INDEX idx_remedies_efficacy ON remedies(efficacy_rating DESC);
CREATE INDEX idx_remedies_success_rate ON remedies(success_rate_percentage DESC);
CREATE INDEX idx_remedies_ailments ON remedies USING GIN(ailments_treated);
CREATE INDEX idx_remedies_symptoms ON remedies USING GIN(symptoms_addressed);
CREATE INDEX idx_remedies_category ON remedies(category);

-- Full-text search index on remedy names (English)
CREATE INDEX idx_remedies_name_search ON remedies USING GIN(
    to_tsvector('english', COALESCE(names->>'en', '') || ' ' || COALESCE(description, ''))
);

-- ============================================================================
-- REMEDY INGREDIENTS TABLE
-- ============================================================================

CREATE TABLE remedy_ingredients (
    ingredient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedy_id UUID NOT NULL REFERENCES remedies(remedy_id) ON DELETE CASCADE,
    
    -- Ingredient Information
    ingredient_name JSONB NOT NULL, -- Multi-language: {"en": "Turmeric", "hi": "हल्दी", "ta": "மஞ்சள்"}
    
    -- Quantity
    quantity VARCHAR(100) NOT NULL, -- e.g., "1 teaspoon", "100 grams"
    unit VARCHAR(50), -- e.g., "teaspoon", "grams", "ml"
    
    -- Seasonal Availability
    -- Array of month numbers (1-12) when ingredient is available
    seasonal_availability INTEGER[] CHECK (
        seasonal_availability IS NULL OR 
        (array_length(seasonal_availability, 1) > 0 AND 
         seasonal_availability <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12])
    ),
    availability_notes TEXT,
    
    -- Substitutes
    substitutes JSONB, -- Array of substitute ingredients with names in multiple languages
    
    -- Order in recipe
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_ingredient_name CHECK (
        ingredient_name ? 'en' AND 
        jsonb_typeof(ingredient_name) = 'object'
    )
);

-- Indexes for remedy_ingredients
CREATE INDEX idx_ingredients_remedy ON remedy_ingredients(remedy_id);
CREATE INDEX idx_ingredients_order ON remedy_ingredients(remedy_id, display_order);
CREATE INDEX idx_ingredients_seasonal ON remedy_ingredients USING GIN(seasonal_availability);

-- ============================================================================
-- PREPARATION METHODS TABLE (Step-by-step instructions)
-- ============================================================================

CREATE TABLE preparation_methods (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedy_id UUID NOT NULL REFERENCES remedies(remedy_id) ON DELETE CASCADE,
    
    -- Step Information
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    description_multilang JSONB, -- Multi-language step descriptions
    
    -- Timing and Temperature
    duration_minutes INTEGER, -- How long this step takes
    temperature VARCHAR(50), -- e.g., "medium heat", "room temperature", "boil"
    
    -- Media URLs
    image_url TEXT,
    video_url TEXT,
    audio_url TEXT, -- Audio instructions for low-literacy users
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_remedy_step UNIQUE (remedy_id, step_number)
);

-- Indexes for preparation_methods
CREATE INDEX idx_preparation_remedy ON preparation_methods(remedy_id);
CREATE INDEX idx_preparation_order ON preparation_methods(remedy_id, step_number);

-- ============================================================================
-- DOSAGE GUIDELINES TABLE (Age-specific dosages)
-- ============================================================================

CREATE TABLE dosage_guidelines (
    dosage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedy_id UUID NOT NULL REFERENCES remedies(remedy_id) ON DELETE CASCADE,
    
    -- Age Group
    age_group VARCHAR(20) CHECK (age_group IN ('infant', 'child', 'adult', 'elderly', 'pregnant', 'lactating')) NOT NULL,
    age_range_min INTEGER, -- Minimum age in years (NULL for no minimum)
    age_range_max INTEGER, -- Maximum age in years (NULL for no maximum)
    
    -- Dosage Information
    dosage_amount VARCHAR(100) NOT NULL, -- e.g., "1 teaspoon", "half cup"
    frequency VARCHAR(100) NOT NULL, -- e.g., "twice daily", "before meals"
    duration VARCHAR(100), -- e.g., "3-5 days", "until symptoms improve"
    
    -- Special Instructions
    special_instructions TEXT,
    special_instructions_multilang JSONB,
    
    -- Best time to take
    best_time VARCHAR(100), -- e.g., "morning empty stomach", "before bed"
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_remedy_age_group UNIQUE (remedy_id, age_group),
    CONSTRAINT valid_age_range CHECK (
        age_range_min IS NULL OR 
        age_range_max IS NULL OR 
        age_range_min <= age_range_max
    )
);

-- Indexes for dosage_guidelines
CREATE INDEX idx_dosage_remedy ON dosage_guidelines(remedy_id);
CREATE INDEX idx_dosage_age_group ON dosage_guidelines(age_group);

-- ============================================================================
-- SAFETY INFORMATION TABLE
-- ============================================================================

CREATE TABLE safety_information (
    safety_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedy_id UUID NOT NULL UNIQUE REFERENCES remedies(remedy_id) ON DELETE CASCADE,
    
    -- Side Effects
    side_effects JSONB, -- Array of side effects with severity: [{"effect": "nausea", "severity": "mild", "frequency": "rare"}]
    
    -- Contraindications
    contraindications JSONB, -- Array of conditions where remedy should not be used
    
    -- Drug Interactions
    drug_interactions JSONB, -- Array of drugs that interact: [{"drug": "aspirin", "interaction": "increases bleeding risk"}]
    
    -- Allergy Warnings
    allergy_warnings JSONB, -- Array of potential allergens
    
    -- Safety Flags
    safe_for_pregnancy BOOLEAN DEFAULT FALSE,
    safe_for_children BOOLEAN DEFAULT FALSE,
    safe_for_elderly BOOLEAN DEFAULT TRUE,
    safe_for_lactating BOOLEAN DEFAULT FALSE,
    
    -- Additional Warnings
    warnings TEXT[],
    precautions TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for safety_information
CREATE INDEX idx_safety_remedy ON safety_information(remedy_id);
CREATE INDEX idx_safety_pregnancy ON safety_information(safe_for_pregnancy) WHERE safe_for_pregnancy = TRUE;
CREATE INDEX idx_safety_children ON safety_information(safe_for_children) WHERE safe_for_children = TRUE;

-- ============================================================================
-- USER RATINGS TABLE (Community feedback)
-- ============================================================================

CREATE TABLE user_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remedy_id UUID NOT NULL REFERENCES remedies(remedy_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Rating
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    
    -- Review
    review_text TEXT,
    
    -- Effectiveness
    ailment_treated VARCHAR(255), -- Which ailment did they use it for
    effectiveness VARCHAR(20) CHECK (effectiveness IN ('very_effective', 'effective', 'somewhat_effective', 'not_effective')),
    
    -- Usage Details
    days_used INTEGER,
    followed_instructions BOOLEAN DEFAULT TRUE,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_user_remedy_rating UNIQUE (remedy_id, user_id)
);

-- Indexes for user_ratings
CREATE INDEX idx_ratings_remedy ON user_ratings(remedy_id);
CREATE INDEX idx_ratings_user ON user_ratings(user_id);
CREATE INDEX idx_ratings_rating ON user_ratings(rating DESC);
CREATE INDEX idx_ratings_effectiveness ON user_ratings(effectiveness);
CREATE INDEX idx_ratings_created ON user_ratings(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_remedies_updated_at
    BEFORE UPDATE ON remedies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remedy_ingredients_updated_at
    BEFORE UPDATE ON remedy_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preparation_methods_updated_at
    BEFORE UPDATE ON preparation_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dosage_guidelines_updated_at
    BEFORE UPDATE ON dosage_guidelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_information_updated_at
    BEFORE UPDATE ON safety_information
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update remedy success rate based on user ratings
-- ============================================================================

CREATE OR REPLACE FUNCTION update_remedy_success_rate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE remedies
    SET success_rate_percentage = (
        SELECT 
            ROUND(
                (COUNT(*) FILTER (WHERE effectiveness IN ('very_effective', 'effective'))::DECIMAL / 
                NULLIF(COUNT(*), 0) * 100)::NUMERIC, 
                2
            )
        FROM user_ratings
        WHERE remedy_id = NEW.remedy_id
        AND effectiveness IS NOT NULL
    )
    WHERE remedy_id = NEW.remedy_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update success rate when ratings are added/updated
CREATE TRIGGER update_success_rate_on_rating
    AFTER INSERT OR UPDATE ON user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_remedy_success_rate();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Published remedies with aggregated ratings
CREATE VIEW published_remedies_with_ratings AS
SELECT 
    r.remedy_id,
    r.names,
    r.description,
    r.ailments_treated,
    r.efficacy_rating,
    r.evidence_level,
    r.success_rate_percentage,
    r.category,
    r.difficulty_level,
    r.preparation_time_minutes,
    COUNT(ur.rating_id) as total_ratings,
    ROUND(AVG(ur.rating)::NUMERIC, 2) as average_rating,
    COUNT(ur.rating_id) FILTER (WHERE ur.effectiveness IN ('very_effective', 'effective')) as positive_feedback_count
FROM remedies r
LEFT JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
WHERE r.status = 'published' AND r.verification_status = 'verified'
GROUP BY r.remedy_id;

-- View: Seasonal remedies (available this month)
CREATE VIEW seasonal_remedies AS
SELECT DISTINCT
    r.remedy_id,
    r.names,
    r.ailments_treated,
    r.efficacy_rating,
    ri.ingredient_name,
    ri.seasonal_availability
FROM remedies r
JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
WHERE r.status = 'published'
AND r.verification_status = 'verified'
AND EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER = ANY(ri.seasonal_availability);

-- View: Top rated remedies
CREATE VIEW top_rated_remedies AS
SELECT 
    r.remedy_id,
    r.names,
    r.ailments_treated,
    r.efficacy_rating,
    r.success_rate_percentage,
    COUNT(ur.rating_id) as rating_count,
    ROUND(AVG(ur.rating)::NUMERIC, 2) as average_rating
FROM remedies r
JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
WHERE r.status = 'published' AND r.verification_status = 'verified'
GROUP BY r.remedy_id
HAVING COUNT(ur.rating_id) >= 5
ORDER BY average_rating DESC, r.efficacy_rating DESC
LIMIT 50;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE remedies IS 'Core natural remedies with multi-language support and verification workflow';
COMMENT ON TABLE remedy_ingredients IS 'Ingredients for each remedy with seasonal availability tracking';
COMMENT ON TABLE preparation_methods IS 'Step-by-step preparation instructions with media support';
COMMENT ON TABLE dosage_guidelines IS 'Age-specific dosage information for safe usage';
COMMENT ON TABLE safety_information IS 'Comprehensive safety data including contraindications and interactions';
COMMENT ON TABLE user_ratings IS 'Community ratings and effectiveness feedback';

COMMENT ON COLUMN remedies.names IS 'JSONB object with multi-language names: {"en": "English", "hi": "Hindi", "scientific": "Scientific name"}';
COMMENT ON COLUMN remedies.evidence_level IS 'Level of scientific evidence: traditional (folklore), moderate (some studies), strong (clinical trials)';
COMMENT ON COLUMN remedy_ingredients.seasonal_availability IS 'Array of month numbers (1-12) when ingredient is naturally available';
COMMENT ON COLUMN dosage_guidelines.age_group IS 'Target age group: infant (<2), child (2-12), adult (13-64), elderly (65+), pregnant, lactating';
COMMENT ON COLUMN safety_information.drug_interactions IS 'JSONB array of drug interactions with severity and description';

-- ============================================================================
-- SAMPLE DATA CONSTRAINTS VALIDATION
-- ============================================================================

-- Ensure all published remedies have required safety information
CREATE OR REPLACE FUNCTION validate_remedy_completeness()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' THEN
        -- Check if safety information exists
        IF NOT EXISTS (SELECT 1 FROM safety_information WHERE remedy_id = NEW.remedy_id) THEN
            RAISE EXCEPTION 'Cannot publish remedy without safety information';
        END IF;
        
        -- Check if at least one dosage guideline exists
        IF NOT EXISTS (SELECT 1 FROM dosage_guidelines WHERE remedy_id = NEW.remedy_id) THEN
            RAISE EXCEPTION 'Cannot publish remedy without dosage guidelines';
        END IF;
        
        -- Check if at least one preparation step exists
        IF NOT EXISTS (SELECT 1 FROM preparation_methods WHERE remedy_id = NEW.remedy_id) THEN
            RAISE EXCEPTION 'Cannot publish remedy without preparation methods';
        END IF;
        
        -- Check if at least one ingredient exists
        IF NOT EXISTS (SELECT 1 FROM remedy_ingredients WHERE remedy_id = NEW.remedy_id) THEN
            RAISE EXCEPTION 'Cannot publish remedy without ingredients';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_remedy_before_publish
    BEFORE UPDATE ON remedies
    FOR EACH ROW
    WHEN (NEW.status = 'published' AND OLD.status != 'published')
    EXECUTE FUNCTION validate_remedy_completeness();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
