-- ============================================================================
-- RuralConnect AI - Agriculture Module Schema
-- ============================================================================

-- ============================================================================
-- FARM PROFILES TABLE
-- ============================================================================

CREATE TABLE farm_profiles (
    farm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Farm Information
    farm_name VARCHAR(255) NOT NULL,
    land_size_value DECIMAL(10, 2) NOT NULL,
    land_size_unit VARCHAR(10) NOT NULL CHECK (land_size_unit IN ('acre', 'hectare')),
    
    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Soil Information
    soil_type VARCHAR(50) CHECK (soil_type IN ('clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'mixed')),
    soil_ph DECIMAL(3, 1),
    soil_health_score INTEGER CHECK (soil_health_score BETWEEN 0 AND 100),
    last_soil_test_date DATE,
    
    -- Irrigation
    irrigation_type VARCHAR(50) CHECK (irrigation_type IN ('drip', 'sprinkler', 'flood', 'rainfed', 'mixed')),
    water_source VARCHAR(50) CHECK (water_source IN ('well', 'borewell', 'canal', 'river', 'pond', 'rainwater', 'mixed')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_land_size CHECK (land_size_value > 0)
);

-- Indexes for farm_profiles
CREATE INDEX idx_farms_user ON farm_profiles(user_id);
CREATE INDEX idx_farms_location ON farm_profiles(state, district);
CREATE INDEX idx_farms_soil_type ON farm_profiles(soil_type);
CREATE INDEX idx_farms_coordinates ON farm_profiles USING GIST (
    ll_to_earth(latitude, longitude)
);

-- ============================================================================
-- CROPS TABLE
-- ============================================================================

CREATE TABLE crops (
    crop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Crop Information
    crop_name VARCHAR(100) NOT NULL UNIQUE,
    scientific_name VARCHAR(150),
    category VARCHAR(50) CHECK (category IN ('cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash_crop', 'fodder')),
    
    -- Growing Conditions
    ideal_soil_types TEXT[], -- Array of soil types
    ideal_ph_min DECIMAL(3, 1),
    ideal_ph_max DECIMAL(3, 1),
    ideal_temp_min INTEGER, -- Celsius
    ideal_temp_max INTEGER,
    water_requirement VARCHAR(20) CHECK (water_requirement IN ('low', 'medium', 'high')),
    
    -- Growing Season
    sowing_season TEXT[], -- Array of months
    harvest_season TEXT[],
    growing_duration_days INTEGER,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for crops
CREATE INDEX idx_crops_name ON crops(crop_name);
CREATE INDEX idx_crops_category ON crops(category);

-- ============================================================================
-- FARM CROPS TABLE (Current/Historical Crops)
-- ============================================================================

CREATE TABLE farm_crops (
    farm_crop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_profiles(farm_id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES crops(crop_id),
    
    -- Crop Cycle Information
    season VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    area_planted DECIMAL(10, 2) NOT NULL, -- In acres/hectares
    
    -- Dates
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    
    -- Yield
    expected_yield DECIMAL(10, 2),
    actual_yield DECIMAL(10, 2),
    yield_unit VARCHAR(20) DEFAULT 'quintal',
    
    -- Financial
    investment_amount DECIMAL(12, 2),
    revenue_amount DECIMAL(12, 2),
    profit_amount DECIMAL(12, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'sowing', 'growing', 'harvested', 'failed')),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_area CHECK (area_planted > 0),
    CONSTRAINT valid_dates CHECK (expected_harvest_date > sowing_date)
);

-- Indexes for farm_crops
CREATE INDEX idx_farm_crops_farm ON farm_crops(farm_id);
CREATE INDEX idx_farm_crops_crop ON farm_crops(crop_id);
CREATE INDEX idx_farm_crops_season ON farm_crops(season, year);
CREATE INDEX idx_farm_crops_status ON farm_crops(status);

-- ============================================================================
-- CROP RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE crop_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_profiles(farm_id) ON DELETE CASCADE,
    
    -- Recommendation Data
    recommended_crops JSONB NOT NULL, -- Array of crops with scores
    season VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    
    -- Factors Considered
    soil_factors JSONB,
    climate_factors JSONB,
    market_factors JSONB,
    
    -- ML Model Info
    model_version VARCHAR(50),
    confidence_score DECIMAL(5, 2) CHECK (confidence_score BETWEEN 0 AND 100),
    
    -- User Feedback
    user_accepted BOOLEAN,
    user_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for crop_recommendations
CREATE INDEX idx_recommendations_farm ON crop_recommendations(farm_id);
CREATE INDEX idx_recommendations_season ON crop_recommendations(season, year);

-- ============================================================================
-- SOIL ANALYSIS TABLE
-- ============================================================================

CREATE TABLE soil_analyses (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_profiles(farm_id) ON DELETE CASCADE,
    
    -- Analysis Method
    analysis_type VARCHAR(50) CHECK (analysis_type IN ('lab_test', 'ai_image', 'manual_input')),
    image_url TEXT,
    
    -- Soil Properties
    ph_level DECIMAL(3, 1),
    nitrogen_level VARCHAR(20) CHECK (nitrogen_level IN ('low', 'medium', 'high')),
    phosphorus_level VARCHAR(20) CHECK (phosphorus_level IN ('low', 'medium', 'high')),
    potassium_level VARCHAR(20) CHECK (potassium_level IN ('low', 'medium', 'high')),
    organic_carbon DECIMAL(5, 2),
    electrical_conductivity DECIMAL(5, 2),
    
    -- Micronutrients
    zinc DECIMAL(5, 2),
    iron DECIMAL(5, 2),
    manganese DECIMAL(5, 2),
    copper DECIMAL(5, 2),
    boron DECIMAL(5, 2),
    
    -- Health Score
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    
    -- Recommendations
    fertilizer_recommendations JSONB,
    improvement_suggestions TEXT[],
    
    -- AI Analysis
    ai_confidence DECIMAL(5, 2),
    ai_model_version VARCHAR(50),
    
    -- Timestamps
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for soil_analyses
CREATE INDEX idx_soil_farm ON soil_analyses(farm_id);
CREATE INDEX idx_soil_date ON soil_analyses(analysis_date);
CREATE INDEX idx_soil_type ON soil_analyses(analysis_type);

-- ============================================================================
-- IRRIGATION SCHEDULES TABLE
-- ============================================================================

CREATE TABLE irrigation_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_crop_id UUID NOT NULL REFERENCES farm_crops(farm_crop_id) ON DELETE CASCADE,
    
    -- Schedule Information
    schedule_type VARCHAR(20) CHECK (schedule_type IN ('daily', 'weekly', 'custom')),
    irrigation_method VARCHAR(50),
    
    -- Water Requirements
    water_amount_per_session DECIMAL(10, 2), -- In liters
    frequency_per_week INTEGER,
    duration_minutes INTEGER,
    
    -- Schedule Details
    schedule_data JSONB, -- Detailed schedule with times
    
    -- Weather-based Adjustments
    adjust_for_rain BOOLEAN DEFAULT TRUE,
    adjust_for_temperature BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for irrigation_schedules
CREATE INDEX idx_irrigation_farm_crop ON irrigation_schedules(farm_crop_id);
CREATE INDEX idx_irrigation_active ON irrigation_schedules(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- WEATHER DATA TABLE
-- ============================================================================

CREATE TABLE weather_data (
    weather_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    
    -- Weather Information
    date DATE NOT NULL,
    temperature_min DECIMAL(5, 2),
    temperature_max DECIMAL(5, 2),
    temperature_avg DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    rainfall DECIMAL(7, 2), -- In mm
    wind_speed DECIMAL(5, 2),
    
    -- Forecast vs Actual
    is_forecast BOOLEAN DEFAULT FALSE,
    forecast_date DATE,
    
    -- Data Source
    source VARCHAR(50) CHECK (source IN ('imd', 'openweather', 'manual', 'crowdsourced')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(latitude, longitude, date, is_forecast)
);

-- Indexes for weather_data
CREATE INDEX idx_weather_location ON weather_data(latitude, longitude);
CREATE INDEX idx_weather_date ON weather_data(date);
CREATE INDEX idx_weather_district ON weather_data(state, district);
CREATE INDEX idx_weather_forecast ON weather_data(is_forecast);

-- ============================================================================
-- WEATHER ALERTS TABLE
-- ============================================================================

CREATE TABLE weather_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_profiles(farm_id) ON DELETE CASCADE,
    
    -- Alert Information
    alert_type VARCHAR(50) CHECK (alert_type IN ('frost', 'heavy_rain', 'drought', 'heatwave', 'storm', 'pest_risk')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Advisory
    advisory TEXT,
    action_required TEXT[],
    
    -- Timing
    alert_date DATE NOT NULL,
    valid_until DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'expired')),
    acknowledged_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for weather_alerts
CREATE INDEX idx_alerts_farm ON weather_alerts(farm_id);
CREATE INDEX idx_alerts_type ON weather_alerts(alert_type);
CREATE INDEX idx_alerts_status ON weather_alerts(status);
CREATE INDEX idx_alerts_date ON weather_alerts(alert_date);

-- ============================================================================
-- MARKET PRICES TABLE
-- ============================================================================

CREATE TABLE market_prices (
    price_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Commodity Information
    commodity VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    
    -- Location
    market_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Price Information
    min_price DECIMAL(10, 2) NOT NULL,
    max_price DECIMAL(10, 2) NOT NULL,
    modal_price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'quintal',
    
    -- Date
    price_date DATE NOT NULL,
    
    -- Data Source
    source VARCHAR(50) DEFAULT 'agmarknet',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_prices CHECK (min_price <= modal_price AND modal_price <= max_price)
);

-- Indexes for market_prices
CREATE INDEX idx_prices_commodity ON market_prices(commodity);
CREATE INDEX idx_prices_location ON market_prices(state, district);
CREATE INDEX idx_prices_date ON market_prices(price_date);
CREATE INDEX idx_prices_commodity_date ON market_prices(commodity, price_date);

-- ============================================================================
-- KNOWLEDGE BASE TABLE
-- ============================================================================

CREATE TABLE agriculture_knowledge (
    knowledge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content Information
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(100) CHECK (category IN ('sustainable_farming', 'pest_management', 'soil_health', 'water_management', 'crop_rotation', 'organic_farming', 'general')),
    
    -- Media
    images TEXT[],
    videos TEXT[],
    audio_files TEXT[],
    
    -- Evidence Level
    evidence_level VARCHAR(20) CHECK (evidence_level IN ('research_backed', 'expert_verified', 'traditional_knowledge', 'community_shared')),
    
    -- Verification
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Tags
    tags TEXT[],
    crops_applicable TEXT[],
    
    -- Language
    language VARCHAR(10) DEFAULT 'en',
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Indexes for agriculture_knowledge
CREATE INDEX idx_knowledge_category ON agriculture_knowledge(category);
CREATE INDEX idx_knowledge_status ON agriculture_knowledge(status);
CREATE INDEX idx_knowledge_language ON agriculture_knowledge(language);
CREATE INDEX idx_knowledge_tags ON agriculture_knowledge USING GIN(tags);
CREATE INDEX idx_knowledge_crops ON agriculture_knowledge USING GIN(crops_applicable);

-- Full-text search index
CREATE INDEX idx_knowledge_search ON agriculture_knowledge USING GIN(
    to_tsvector('english', title || ' ' || content || ' ' || COALESCE(summary, ''))
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_farm_profiles_updated_at
    BEFORE UPDATE ON farm_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crops_updated_at
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_crops_updated_at
    BEFORE UPDATE ON farm_crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_schedules_updated_at
    BEFORE UPDATE ON irrigation_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agriculture_knowledge_updated_at
    BEFORE UPDATE ON agriculture_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE farm_profiles IS 'Farm profiles with location and soil information';
COMMENT ON TABLE crops IS 'Master crop database with growing requirements';
COMMENT ON TABLE farm_crops IS 'Current and historical crop cultivation records';
COMMENT ON TABLE crop_recommendations IS 'AI-generated crop recommendations';
COMMENT ON TABLE soil_analyses IS 'Soil test results and health scores';
COMMENT ON TABLE irrigation_schedules IS 'Irrigation schedules for crops';
COMMENT ON TABLE weather_data IS 'Weather data and forecasts';
COMMENT ON TABLE weather_alerts IS 'Weather alerts and advisories';
COMMENT ON TABLE market_prices IS 'Agricultural commodity market prices';
COMMENT ON TABLE agriculture_knowledge IS 'Knowledge base for sustainable farming practices';
