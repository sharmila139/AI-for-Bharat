-- ============================================================================
-- RuralConnect AI - Enhanced Knowledge Base Schema
-- Extension to 02_agriculture.sql for comprehensive knowledge management
-- ============================================================================

-- ============================================================================
-- KNOWLEDGE BASE ARTICLES TABLE (Enhanced)
-- ============================================================================

-- Drop existing table if we need to recreate with enhancements
-- Note: In production, use migrations instead
-- DROP TABLE IF EXISTS knowledge_articles CASCADE;

CREATE TABLE IF NOT EXISTS knowledge_articles (
    article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Multi-language Content
    title JSONB NOT NULL, -- {"en": "Title", "hi": "शीर्षक", "ta": "தலைப்பு", ...}
    content JSONB NOT NULL, -- {"en": "Content...", "hi": "सामग्री...", ...}
    summary JSONB, -- {"en": "Summary", "hi": "सारांश", ...}
    
    -- Category and Classification
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'organic_farming', 'pest_management', 'soil_conservation', 
        'water_management', 'crop_rotation', 'general'
    )),
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Multi-format Media
    media JSONB DEFAULT '{"images": [], "videos": [], "audio": []}'::jsonb,
    -- Structure: {"images": [{"url": "...", "caption": {"en": "...", "hi": "..."}}], ...}
    
    -- Evidence and Verification
    evidence_level VARCHAR(20) NOT NULL CHECK (evidence_level IN ('traditional', 'moderate', 'strong')),
    scientific_references JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{"title": "...", "authors": "...", "year": 2023, "url": "..."}]
    
    -- Implementation Guide
    implementation_guide JSONB,
    -- Structure: {
    --   "steps": [{"step": 1, "description": {"en": "...", "hi": "..."}, "duration": "30 min"}],
    --   "materials": [{"name": {"en": "...", "hi": "..."}, "quantity": "...", "cost": 100}],
    --   "tools": [{"name": {"en": "...", "hi": "..."}}],
    --   "timeline": "2-3 weeks"
    -- }
    
    -- Benefits Quantification
    benefits JSONB,
    -- Structure: {
    --   "environmental": {"description": {"en": "...", "hi": "..."}, "impact": "high"},
    --   "economic": {"description": {"en": "...", "hi": "..."}, "roi": "150%", "payback_period": "6 months"},
    --   "social": {"description": {"en": "...", "hi": "..."}}
    -- }
    
    -- Community Engagement
    view_count INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    success_story_count INTEGER DEFAULT 0,
    
    -- Verification Status
    verified_by UUID REFERENCES users(user_id),
    verification_date TIMESTAMP,
    verification_notes TEXT,
    
    -- Applicable Crops and Regions
    applicable_crops TEXT[] DEFAULT '{}',
    applicable_regions TEXT[] DEFAULT '{}', -- States/districts
    applicable_seasons TEXT[] DEFAULT '{}',
    
    -- Languages Available
    available_languages TEXT[] DEFAULT '{"en"}',
    primary_language VARCHAR(10) DEFAULT 'en',
    
    -- Status and Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    published_at TIMESTAMP,
    
    -- Author Information
    author_id UUID REFERENCES users(user_id),
    author_type VARCHAR(50) CHECK (author_type IN ('extension_officer', 'researcher', 'farmer', 'admin')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for knowledge_articles
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_evidence ON knowledge_articles(evidence_level);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_crops ON knowledge_articles USING GIN(applicable_crops);
CREATE INDEX IF NOT EXISTS idx_articles_languages ON knowledge_articles USING GIN(available_languages);
CREATE INDEX IF NOT EXISTS idx_articles_published ON knowledge_articles(published_at) WHERE status = 'published';

-- Full-text search index for multi-language content
CREATE INDEX IF NOT EXISTS idx_articles_search ON knowledge_articles USING GIN(
    (title || content || COALESCE(summary, '{}'::jsonb))
);

-- ============================================================================
-- CROP ROTATION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crop_rotation_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Plan Information
    plan_name JSONB NOT NULL, -- Multi-language
    description JSONB,
    
    -- Rotation Sequence (3-5 years)
    rotation_sequence JSONB NOT NULL,
    -- Structure: [
    --   {"year": 1, "season": "kharif", "crop": "rice", "benefits": {"en": "...", "hi": "..."}},
    --   {"year": 1, "season": "rabi", "crop": "wheat", "benefits": {"en": "...", "hi": "..."}}
    -- ]
    
    -- Soil and Climate Requirements
    suitable_soil_types TEXT[],
    suitable_regions TEXT[],
    
    -- Benefits
    soil_health_improvement JSONB,
    -- Structure: {"nitrogen_gain": "+20%", "organic_matter": "+15%", "description": {"en": "...", "hi": "..."}}
    
    financial_benefits JSONB,
    -- Structure: {
    --   "total_investment": 50000,
    --   "expected_revenue": 80000,
    --   "profit_margin": "60%",
    --   "year_wise_breakdown": [...]
    -- }
    
    -- Verification
    verified_by UUID REFERENCES users(user_id),
    verification_date TIMESTAMP,
    
    -- Engagement
    adoption_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for crop_rotation_plans
CREATE INDEX IF NOT EXISTS idx_rotation_soil ON crop_rotation_plans USING GIN(suitable_soil_types);
CREATE INDEX IF NOT EXISTS idx_rotation_regions ON crop_rotation_plans USING GIN(suitable_regions);
CREATE INDEX IF NOT EXISTS idx_rotation_status ON crop_rotation_plans(status);

-- ============================================================================
-- COMMUNITY RATINGS AND REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES knowledge_articles(article_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- Implementation Status
    implemented BOOLEAN DEFAULT FALSE,
    implementation_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, user_id)
);

-- Indexes for article_ratings
CREATE INDEX IF NOT EXISTS idx_ratings_article ON article_ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON article_ratings(user_id);

-- ============================================================================
-- SUCCESS STORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS success_stories (
    story_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES knowledge_articles(article_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Story Content
    title JSONB NOT NULL,
    story_text JSONB NOT NULL,
    
    -- Results
    results_achieved JSONB,
    -- Structure: {
    --   "yield_increase": "30%",
    --   "cost_reduction": "25%",
    --   "time_saved": "10 hours/week",
    --   "other_benefits": {"en": "...", "hi": "..."}
    -- }
    
    -- Media
    images TEXT[],
    videos TEXT[],
    
    -- Location (optional)
    location_district VARCHAR(100),
    location_state VARCHAR(100),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(user_id),
    verification_date TIMESTAMP,
    
    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for success_stories
CREATE INDEX IF NOT EXISTS idx_stories_article ON success_stories(article_id);
CREATE INDEX IF NOT EXISTS idx_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON success_stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_verified ON success_stories(verified) WHERE verified = TRUE;

-- ============================================================================
-- Q&A DISCUSSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES knowledge_articles(article_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Question
    question_text TEXT NOT NULL,
    
    -- Status
    is_answered BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    upvote_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for article_questions
CREATE INDEX IF NOT EXISTS idx_questions_article ON article_questions(article_id);
CREATE INDEX IF NOT EXISTS idx_questions_user ON article_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_answered ON article_questions(is_answered);

-- ============================================================================
-- Q&A ANSWERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_answers (
    answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES article_questions(question_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Answer
    answer_text TEXT NOT NULL,
    
    -- Verification (for expert answers)
    is_expert_answer BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(user_id),
    
    -- Engagement
    upvote_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for article_answers
CREATE INDEX IF NOT EXISTS idx_answers_question ON article_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user ON article_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_accepted ON article_answers(is_accepted) WHERE is_accepted = TRUE;

-- ============================================================================
-- ARTICLE MEDIA TABLE (for managing uploads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_media (
    media_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES knowledge_articles(article_id) ON DELETE CASCADE,
    
    -- Media Information
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
    file_url TEXT NOT NULL,
    file_size INTEGER, -- In bytes
    mime_type VARCHAR(100),
    
    -- Multi-language Metadata
    caption JSONB,
    alt_text JSONB,
    
    -- Video/Audio specific
    duration INTEGER, -- In seconds
    thumbnail_url TEXT,
    
    -- Processing Status
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for article_media
CREATE INDEX IF NOT EXISTS idx_media_article ON article_media(article_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON article_media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_status ON article_media(processing_status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_article_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE knowledge_articles
        SET rating_sum = rating_sum + NEW.rating,
            rating_count = rating_count + 1
        WHERE article_id = NEW.article_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE knowledge_articles
        SET rating_sum = rating_sum - OLD.rating + NEW.rating
        WHERE article_id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE knowledge_articles
        SET rating_sum = rating_sum - OLD.rating,
            rating_count = rating_count - 1
        WHERE article_id = OLD.article_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON article_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_article_rating_stats();

-- Trigger to update question answered status
CREATE OR REPLACE FUNCTION update_question_answered_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_accepted = TRUE) THEN
        UPDATE article_questions
        SET is_answered = TRUE
        WHERE question_id = NEW.question_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_answered
    AFTER INSERT OR UPDATE ON article_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_answered_status();

-- Trigger to update success story count
CREATE OR REPLACE FUNCTION update_success_story_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE knowledge_articles
        SET success_story_count = success_story_count + 1
        WHERE article_id = NEW.article_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        UPDATE knowledge_articles
        SET success_story_count = success_story_count + 1
        WHERE article_id = NEW.article_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE knowledge_articles
        SET success_story_count = success_story_count - 1
        WHERE article_id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE knowledge_articles
        SET success_story_count = success_story_count - 1
        WHERE article_id = OLD.article_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_success_story_count
    AFTER INSERT OR UPDATE OR DELETE ON success_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_success_story_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE knowledge_articles IS 'Enhanced knowledge base with multi-language support, media, and community features';
COMMENT ON TABLE crop_rotation_plans IS 'Crop rotation plans with 3-5 year sequences and benefits';
COMMENT ON TABLE article_ratings IS 'User ratings and reviews for knowledge articles';
COMMENT ON TABLE success_stories IS 'Community success stories for implemented practices';
COMMENT ON TABLE article_questions IS 'Q&A questions for knowledge articles';
COMMENT ON TABLE article_answers IS 'Answers to Q&A questions with expert verification';
COMMENT ON TABLE article_media IS 'Media files associated with knowledge articles';
