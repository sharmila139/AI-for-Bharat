-- ============================================================================
-- RuralConnect AI - Additional Indexes for Performance Optimization
-- ============================================================================

-- This file contains additional indexes beyond the basic ones in schema files
-- These are optimized for common query patterns and performance

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Users: Search by location and status
CREATE INDEX IF NOT EXISTS idx_users_location_status 
ON users(state, district, account_status) 
WHERE account_status = 'active';

-- Users: Phone verification lookup
CREATE INDEX IF NOT EXISTS idx_users_phone_verified 
ON users(phone_number, phone_verified);

-- Farm Profiles: User's farms with soil type
CREATE INDEX IF NOT EXISTS idx_farms_user_soil 
ON farm_profiles(user_id, soil_type);

-- Farm Crops: Active crops by farm
CREATE INDEX IF NOT EXISTS idx_farm_crops_active 
ON farm_crops(farm_id, status) 
WHERE status IN ('sowing', 'growing');

-- Farm Crops: Seasonal analysis
CREATE INDEX IF NOT EXISTS idx_farm_crops_season_year 
ON farm_crops(season, year, crop_id);

-- Soil Analysis: Recent analyses by farm
CREATE INDEX IF NOT EXISTS idx_soil_farm_date 
ON soil_analyses(farm_id, analysis_date DESC);

-- Weather Data: Location and date range queries
CREATE INDEX IF NOT EXISTS idx_weather_location_date 
ON weather_data(state, district, date DESC);

-- Weather Alerts: Active alerts by farm
CREATE INDEX IF NOT EXISTS idx_alerts_farm_status 
ON weather_alerts(farm_id, status, alert_date) 
WHERE status = 'active';

-- Market Prices: Commodity price trends
CREATE INDEX IF NOT EXISTS idx_prices_commodity_location_date 
ON market_prices(commodity, state, district, price_date DESC);

-- ============================================================================
-- HEALTH MODULE INDEXES
-- ============================================================================

-- Symptom Assessments: User's recent assessments
CREATE INDEX IF NOT EXISTS idx_assessments_user_date 
ON symptom_assessments(user_id, created_at DESC);

-- Symptom Assessments: Emergency cases
CREATE INDEX IF NOT EXISTS idx_assessments_emergency 
ON symptom_assessments(risk_level, requires_immediate_attention, created_at) 
WHERE requires_immediate_attention = TRUE;

-- Natural Remedies: Search by conditions
CREATE INDEX IF NOT EXISTS idx_remedies_conditions_efficacy 
ON natural_remedies(efficacy_rating DESC, status) 
WHERE status = 'published';

-- Remedy Usage: User's remedy history
CREATE INDEX IF NOT EXISTS idx_usage_user_date 
ON remedy_usage(user_id, start_date DESC);

-- Nutrition Plans: Active plans by user
CREATE INDEX IF NOT EXISTS idx_nutrition_user_active 
ON nutrition_plans(user_id, is_active, start_date) 
WHERE is_active = TRUE;

-- Meal Plans: Daily meals by plan
CREATE INDEX IF NOT EXISTS idx_meals_plan_date_type 
ON meal_plans(nutrition_plan_id, meal_date, meal_type);

-- Health Records: User's records by type and date
CREATE INDEX IF NOT EXISTS idx_records_user_type_date 
ON health_records(user_id, record_type, record_date DESC);

-- ============================================================================
-- EDUCATION MODULE INDEXES
-- ============================================================================

-- Knowledge State: Student's proficiency by topic
CREATE INDEX IF NOT EXISTS idx_knowledge_student_proficiency 
ON knowledge_state(student_id, proficiency_score DESC, mastery_level);

-- Knowledge State: Topics needing intervention
CREATE INDEX IF NOT EXISTS idx_knowledge_low_proficiency 
ON knowledge_state(proficiency_score, student_id) 
WHERE proficiency_score < 60;

-- Learning Sessions: Student's recent sessions
CREATE INDEX IF NOT EXISTS idx_sessions_student_date 
ON learning_sessions(student_id, started_at DESC);

-- Learning Sessions: Incomplete sessions
CREATE INDEX IF NOT EXISTS idx_sessions_incomplete 
ON learning_sessions(student_id, completed) 
WHERE completed = FALSE;

-- Learning Content: Popular content by type
CREATE INDEX IF NOT EXISTS idx_content_type_views 
ON learning_content(content_type, view_count DESC, status) 
WHERE status = 'published';

-- Assessment Attempts: Student's recent attempts
CREATE INDEX IF NOT EXISTS idx_attempts_student_date 
ON assessment_attempts(student_id, submitted_at DESC);

-- Learning Paths: Active paths by student
CREATE INDEX IF NOT EXISTS idx_paths_student_active 
ON learning_paths(student_id, is_active, progress_percentage) 
WHERE is_active = TRUE;

-- Student Achievements: Recent achievements
CREATE INDEX IF NOT EXISTS idx_student_achievements_date 
ON student_achievements(student_id, earned_at DESC);

-- ============================================================================
-- INFRASTRUCTURE MODULE INDEXES
-- ============================================================================

-- Grievances: User's grievances by status
CREATE INDEX IF NOT EXISTS idx_grievances_user_status 
ON grievances(user_id, status, created_at DESC);

-- Grievances: Overdue by location
CREATE INDEX IF NOT EXISTS idx_grievances_overdue_location 
ON grievances(state, district, is_overdue, sla_deadline) 
WHERE is_overdue = TRUE;

-- Grievances: Category and priority
CREATE INDEX IF NOT EXISTS idx_grievances_category_priority 
ON grievances(category, priority, status);

-- Grievance Updates: Recent updates by grievance
CREATE INDEX IF NOT EXISTS idx_updates_grievance_date 
ON grievance_updates(grievance_id, created_at DESC);

-- Polls: Active polls by location
CREATE INDEX IF NOT EXISTS idx_polls_location_status 
ON polls(status, start_date, end_date) 
WHERE status = 'active';

-- Poll Votes: Demographic analysis
CREATE INDEX IF NOT EXISTS idx_votes_demographics 
ON poll_votes(poll_id, voter_state, voter_district, voter_age_group);

-- Infrastructure Projects: Active projects by location
CREATE INDEX IF NOT EXISTS idx_projects_location_status 
ON infrastructure_projects(state, district, status, progress_percentage);

-- Infrastructure Projects: Delayed projects
CREATE INDEX IF NOT EXISTS idx_projects_delayed_location 
ON infrastructure_projects(is_delayed, state, district, delay_days DESC) 
WHERE is_delayed = TRUE;

-- Project Updates: Recent updates by project
CREATE INDEX IF NOT EXISTS idx_project_updates_date 
ON project_updates(project_id, update_date DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ============================================================================

-- Active user sessions only
CREATE INDEX IF NOT EXISTS idx_sessions_active_user 
ON user_sessions(user_id, last_used_at DESC) 
WHERE is_active = TRUE AND revoked = FALSE;

-- Unverified OTPs
CREATE INDEX IF NOT EXISTS idx_otp_unverified 
ON otp_verifications(phone_number, expires_at) 
WHERE verified = FALSE;

-- Pending account deletions
CREATE INDEX IF NOT EXISTS idx_deletion_pending 
ON account_deletion_requests(scheduled_for, user_id) 
WHERE status = 'pending';

-- Published agriculture knowledge
CREATE INDEX IF NOT EXISTS idx_knowledge_published_category 
ON agriculture_knowledge(category, view_count DESC) 
WHERE status = 'published';

-- Published learning content
CREATE INDEX IF NOT EXISTS idx_content_published_topic 
ON learning_content(topic_id, content_type, view_count DESC) 
WHERE status = 'published';

-- Verified natural remedies
CREATE INDEX IF NOT EXISTS idx_remedies_verified 
ON natural_remedies(category, efficacy_rating DESC) 
WHERE status = 'published' AND verified_at IS NOT NULL;

-- Active weather alerts
CREATE INDEX IF NOT EXISTS idx_alerts_active_severity 
ON weather_alerts(severity, alert_date) 
WHERE status = 'active';

-- ============================================================================
-- COVERING INDEXES (Include columns for index-only scans)
-- ============================================================================

-- User profile lookup with common fields
CREATE INDEX IF NOT EXISTS idx_users_profile_covering 
ON users(user_id) 
INCLUDE (phone_number, name, email, district, state, preferred_language);

-- Farm profile with location
CREATE INDEX IF NOT EXISTS idx_farms_covering 
ON farm_profiles(farm_id) 
INCLUDE (user_id, farm_name, land_size_value, land_size_unit, soil_type);

-- Grievance summary
CREATE INDEX IF NOT EXISTS idx_grievances_covering 
ON grievances(grievance_id) 
INCLUDE (ticket_number, category, status, priority, created_at);

-- Project summary
CREATE INDEX IF NOT EXISTS idx_projects_covering 
ON infrastructure_projects(project_id) 
INCLUDE (project_name, project_type, status, progress_percentage, district, state);

-- ============================================================================
-- EXPRESSION INDEXES
-- ============================================================================

-- Case-insensitive user name search
CREATE INDEX IF NOT EXISTS idx_users_name_lower 
ON users(LOWER(name)) 
WHERE name IS NOT NULL;

-- Case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email)) 
WHERE email IS NOT NULL;

-- Date-based partitioning helpers
CREATE INDEX IF NOT EXISTS idx_grievances_created_date 
ON grievances(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_assessments_created_date 
ON symptom_assessments(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_sessions_started_date 
ON learning_sessions(DATE(started_at));

-- ============================================================================
-- JSONB INDEXES FOR FLEXIBLE QUERIES
-- ============================================================================

-- JSONB GIN indexes for array/object searches
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin 
ON users USING GIN(
    jsonb_build_object(
        'language', preferred_language,
        'notifications', notification_enabled
    )
);

-- Crop recommendations data
CREATE INDEX IF NOT EXISTS idx_recommendations_crops_gin 
ON crop_recommendations USING GIN(recommended_crops);

-- Poll options and results
CREATE INDEX IF NOT EXISTS idx_polls_options_gin 
ON polls USING GIN(options);

CREATE INDEX IF NOT EXISTS idx_polls_results_gin 
ON polls USING GIN(results);

-- Project milestones
CREATE INDEX IF NOT EXISTS idx_projects_milestones_gin 
ON infrastructure_projects USING GIN(milestones);

-- Learning content data
CREATE INDEX IF NOT EXISTS idx_content_data_gin 
ON learning_content USING GIN(content_data);

-- Assessment questions
CREATE INDEX IF NOT EXISTS idx_assessments_questions_gin 
ON assessments USING GIN(questions);

-- ============================================================================
-- STATISTICS AND MAINTENANCE
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE farm_profiles;
ANALYZE farm_crops;
ANALYZE soil_analyses;
ANALYZE weather_data;
ANALYZE market_prices;
ANALYZE health_profiles;
ANALYZE symptom_assessments;
ANALYZE natural_remedies;
ANALYZE nutrition_plans;
ANALYZE student_profiles;
ANALYZE knowledge_state;
ANALYZE learning_content;
ANALYZE learning_sessions;
ANALYZE grievances;
ANALYZE polls;
ANALYZE infrastructure_projects;

-- ============================================================================
-- INDEX MONITORING QUERIES
-- ============================================================================

-- View to check index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- View to find unused indexes
CREATE OR REPLACE VIEW unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- View to find missing indexes (tables with sequential scans)
CREATE OR REPLACE VIEW tables_needing_indexes AS
SELECT
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_percentage
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_scan DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_users_location_status IS 'Composite index for location-based user queries';
COMMENT ON INDEX idx_grievances_overdue_location IS 'Partial index for overdue grievances by location';
COMMENT ON INDEX idx_knowledge_low_proficiency IS 'Partial index for students needing intervention';
COMMENT ON INDEX idx_projects_delayed_location IS 'Partial index for delayed infrastructure projects';
