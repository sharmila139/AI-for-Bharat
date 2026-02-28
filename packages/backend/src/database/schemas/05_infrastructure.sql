-- ============================================================================
-- RuralConnect AI - Infrastructure & Civic Engagement Module Schema
-- ============================================================================

-- ============================================================================
-- GRIEVANCES TABLE
-- ============================================================================

CREATE TABLE grievances (
    grievance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- NULL for anonymous
    
    -- Ticket Information
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Grievance Details
    category VARCHAR(100) CHECK (category IN ('road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'public_safety', 'other')),
    subcategory VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    landmark VARCHAR(255),
    
    -- Media
    photos TEXT[],
    videos TEXT[],
    
    -- AI Classification
    ai_category VARCHAR(100),
    ai_confidence DECIMAL(5, 2),
    ai_severity VARCHAR(20) CHECK (ai_severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Assignment
    assigned_authority VARCHAR(255),
    assigned_department VARCHAR(255),
    assigned_officer_id UUID REFERENCES users(user_id),
    assigned_at TIMESTAMP,
    
    -- Priority and SLA
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    sla_deadline TIMESTAMP,
    is_overdue BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected')),
    status_history JSONB DEFAULT '[]'::jsonb,
    
    -- Resolution
    resolution_description TEXT,
    resolution_photos TEXT[],
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(user_id),
    
    -- Community Verification
    community_verified BOOLEAN DEFAULT FALSE,
    verification_votes_yes INTEGER DEFAULT 0,
    verification_votes_no INTEGER DEFAULT 0,
    verification_threshold INTEGER DEFAULT 5,
    
    -- Feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    feedback_at TIMESTAMP,
    
    -- Anonymous Reporting
    is_anonymous BOOLEAN DEFAULT FALSE,
    reporter_contact_encrypted TEXT, -- Encrypted contact for follow-up
    
    -- Duplicate Detection
    is_duplicate BOOLEAN DEFAULT FALSE,
    parent_grievance_id UUID REFERENCES grievances(grievance_id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for grievances
CREATE INDEX idx_grievances_user ON grievances(user_id);
CREATE INDEX idx_grievances_ticket ON grievances(ticket_number);
CREATE INDEX idx_grievances_category ON grievances(category);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_location ON grievances(state, district);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_overdue ON grievances(is_overdue) WHERE is_overdue = TRUE;
CREATE INDEX idx_grievances_created ON grievances(created_at);
CREATE INDEX idx_grievances_coordinates ON grievances USING GIST (
    ll_to_earth(latitude, longitude)
);

-- Full-text search index
CREATE INDEX idx_grievances_search ON grievances USING GIN(
    to_tsvector('english', title || ' ' || description)
);

-- ============================================================================
-- GRIEVANCE UPDATES TABLE
-- ============================================================================

CREATE TABLE grievance_updates (
    update_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID NOT NULL REFERENCES grievances(grievance_id) ON DELETE CASCADE,
    
    -- Update Information
    update_type VARCHAR(50) CHECK (update_type IN ('status_change', 'assignment', 'comment', 'resolution', 'escalation')),
    update_text TEXT NOT NULL,
    
    -- Media
    photos TEXT[],
    documents TEXT[],
    
    -- Author
    updated_by UUID REFERENCES users(user_id),
    updated_by_role VARCHAR(50) CHECK (updated_by_role IN ('citizen', 'officer', 'admin', 'system')),
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for grievance_updates
CREATE INDEX idx_updates_grievance ON grievance_updates(grievance_id);
CREATE INDEX idx_updates_created ON grievance_updates(created_at);

-- ============================================================================
-- POLLS TABLE
-- ============================================================================

CREATE TABLE polls (
    poll_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(user_id),
    
    -- Poll Information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    poll_type VARCHAR(50) CHECK (poll_type IN ('single_choice', 'multiple_choice', 'ranked_choice', 'budget_allocation')),
    
    -- Options
    options JSONB NOT NULL, -- Array of option objects
    
    -- Eligibility
    eligibility_criteria JSONB, -- Age, location, etc.
    eligible_districts TEXT[],
    eligible_states TEXT[],
    min_age INTEGER,
    max_age INTEGER,
    
    -- Voting Settings
    allow_anonymous BOOLEAN DEFAULT FALSE,
    require_verification BOOLEAN DEFAULT TRUE,
    max_votes_per_user INTEGER DEFAULT 1,
    
    -- Results Display
    show_results_before_voting BOOLEAN DEFAULT FALSE,
    show_results_after_voting BOOLEAN DEFAULT TRUE,
    show_real_time_results BOOLEAN DEFAULT FALSE,
    
    -- Binding Poll
    is_binding BOOLEAN DEFAULT FALSE,
    binding_threshold_percentage DECIMAL(5, 2),
    commitment_text TEXT,
    
    -- Schedule
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
    
    -- Results
    total_votes INTEGER DEFAULT 0,
    results JSONB,
    demographic_breakdown JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_poll_dates CHECK (end_date > start_date)
);

-- Indexes for polls
CREATE INDEX idx_polls_creator ON polls(created_by);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_dates ON polls(start_date, end_date);
CREATE INDEX idx_polls_location ON polls USING GIN(eligible_states);

-- ============================================================================
-- POLL VOTES TABLE
-- ============================================================================

CREATE TABLE poll_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- NULL for anonymous
    
    -- Vote Data
    vote_data JSONB NOT NULL, -- Selected options or rankings
    vote_hash VARCHAR(64) UNIQUE NOT NULL, -- One-way hash for anonymity
    
    -- Voter Demographics (for analysis)
    voter_age_group VARCHAR(20),
    voter_gender VARCHAR(20),
    voter_district VARCHAR(100),
    voter_state VARCHAR(100),
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50),
    
    -- Timestamps
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(poll_id, user_id) -- Prevent duplicate votes
);

-- Indexes for poll_votes
CREATE INDEX idx_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_votes_user ON poll_votes(user_id);
CREATE INDEX idx_votes_hash ON poll_votes(vote_hash);
CREATE INDEX idx_votes_demographics ON poll_votes(voter_state, voter_district);

-- ============================================================================
-- INFRASTRUCTURE PROJECTS TABLE
-- ============================================================================

CREATE TABLE infrastructure_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Project Information
    project_name VARCHAR(500) NOT NULL,
    project_code VARCHAR(50) UNIQUE,
    project_type VARCHAR(100) CHECK (project_type IN ('road', 'bridge', 'water_supply', 'sanitation', 'electricity', 'school', 'hospital', 'community_center', 'other')),
    description TEXT,
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    
    -- Budget
    total_budget DECIMAL(15, 2) NOT NULL,
    budget_currency VARCHAR(10) DEFAULT 'INR',
    funding_sources JSONB, -- Array of funding source objects
    
    -- Timeline
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    estimated_completion_date DATE,
    
    -- Progress
    progress_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    current_phase VARCHAR(100),
    milestones JSONB, -- Array of milestone objects
    
    -- Delays
    is_delayed BOOLEAN DEFAULT FALSE,
    delay_days INTEGER DEFAULT 0,
    delay_reasons TEXT[],
    
    -- Stakeholders
    contractor_name VARCHAR(255),
    contractor_contact VARCHAR(100),
    supervisor_name VARCHAR(255),
    supervisor_contact VARCHAR(100),
    implementing_agency VARCHAR(255),
    
    -- Quality
    quality_inspections JSONB, -- Array of inspection records
    quality_rating DECIMAL(3, 2),
    
    -- Transparency Documents
    documents JSONB, -- Array of document objects (tender, contracts, reports)
    
    -- Status
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    
    -- Community Engagement
    beneficiaries_count INTEGER,
    community_feedback_count INTEGER DEFAULT 0,
    average_community_rating DECIMAL(3, 2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_project_dates CHECK (planned_end_date > planned_start_date),
    CONSTRAINT valid_budget CHECK (total_budget > 0)
);

-- Indexes for infrastructure_projects
CREATE INDEX idx_projects_type ON infrastructure_projects(project_type);
CREATE INDEX idx_projects_status ON infrastructure_projects(status);
CREATE INDEX idx_projects_location ON infrastructure_projects(state, district);
CREATE INDEX idx_projects_delayed ON infrastructure_projects(is_delayed) WHERE is_delayed = TRUE;
CREATE INDEX idx_projects_dates ON infrastructure_projects(planned_start_date, planned_end_date);
CREATE INDEX idx_projects_coordinates ON infrastructure_projects USING GIST (
    ll_to_earth(latitude, longitude)
);

-- Full-text search index
CREATE INDEX idx_projects_search ON infrastructure_projects USING GIN(
    to_tsvector('english', project_name || ' ' || COALESCE(description, ''))
);

-- ============================================================================
-- PROJECT UPDATES TABLE
-- ============================================================================

CREATE TABLE project_updates (
    update_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES infrastructure_projects(project_id) ON DELETE CASCADE,
    
    -- Update Information
    update_type VARCHAR(50) CHECK (update_type IN ('progress', 'milestone', 'delay', 'budget', 'quality', 'completion')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Progress Update
    progress_percentage DECIMAL(5, 2),
    
    -- Media
    photos TEXT[],
    videos TEXT[],
    documents TEXT[],
    
    -- Author
    updated_by VARCHAR(255),
    updated_by_role VARCHAR(50) CHECK (updated_by_role IN ('contractor', 'supervisor', 'agency', 'admin')),
    
    -- Timestamps
    update_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_updates
CREATE INDEX idx_project_updates_project ON project_updates(project_id);
CREATE INDEX idx_project_updates_type ON project_updates(update_type);
CREATE INDEX idx_project_updates_date ON project_updates(update_date);

-- ============================================================================
-- PROJECT FEEDBACK TABLE
-- ============================================================================

CREATE TABLE project_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES infrastructure_projects(project_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Feedback
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    feedback_category VARCHAR(50) CHECK (feedback_category IN ('quality', 'timeline', 'transparency', 'impact', 'general')),
    
    -- Media
    photos TEXT[],
    
    -- Response
    response_text TEXT,
    responded_by VARCHAR(255),
    responded_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_feedback
CREATE INDEX idx_feedback_project ON project_feedback(project_id);
CREATE INDEX idx_feedback_user ON project_feedback(user_id);
CREATE INDEX idx_feedback_rating ON project_feedback(rating);

-- ============================================================================
-- CIVIC ENGAGEMENT STATISTICS TABLE
-- ============================================================================

CREATE TABLE civic_engagement_stats (
    stat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time Period
    stat_date DATE NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    
    -- Grievance Statistics
    grievances_submitted INTEGER DEFAULT 0,
    grievances_resolved INTEGER DEFAULT 0,
    grievances_overdue INTEGER DEFAULT 0,
    average_resolution_days DECIMAL(6, 2),
    
    -- Poll Statistics
    polls_active INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    
    -- Project Statistics
    projects_active INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    projects_delayed INTEGER DEFAULT 0,
    total_budget_allocated DECIMAL(15, 2),
    
    -- Engagement Metrics
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_date, district, state)
);

-- Indexes for civic_engagement_stats
CREATE INDEX idx_stats_date ON civic_engagement_stats(stat_date);
CREATE INDEX idx_stats_location ON civic_engagement_stats(state, district);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_grievances_updated_at
    BEFORE UPDATE ON grievances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_infrastructure_projects_updated_at
    BEFORE UPDATE ON infrastructure_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate ticket number for grievances
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'GRV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(NEXTVAL('grievance_ticket_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE grievance_ticket_seq;

CREATE TRIGGER set_grievance_ticket_number
    BEFORE INSERT ON grievances
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Check SLA and mark overdue
CREATE OR REPLACE FUNCTION check_grievance_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_deadline IS NOT NULL AND NEW.sla_deadline < CURRENT_TIMESTAMP AND NEW.status NOT IN ('resolved', 'closed') THEN
        NEW.is_overdue = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_sla_on_update
    BEFORE UPDATE ON grievances
    FOR EACH ROW
    EXECUTE FUNCTION check_grievance_sla();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active grievances view
CREATE VIEW active_grievances AS
SELECT 
    g.*,
    u.name as reporter_name,
    u.phone_number as reporter_phone
FROM grievances g
LEFT JOIN users u ON g.user_id = u.user_id
WHERE g.status NOT IN ('resolved', 'closed', 'rejected');

-- Project progress dashboard view
CREATE VIEW project_dashboard AS
SELECT 
    project_id,
    project_name,
    project_type,
    district,
    state,
    status,
    progress_percentage,
    total_budget,
    planned_start_date,
    planned_end_date,
    is_delayed,
    delay_days,
    average_community_rating
FROM infrastructure_projects
WHERE status IN ('approved', 'in_progress');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE grievances IS 'Citizen grievances with AI classification and tracking';
COMMENT ON TABLE grievance_updates IS 'Timeline of grievance status updates';
COMMENT ON TABLE polls IS 'Community opinion polls and surveys';
COMMENT ON TABLE poll_votes IS 'Anonymous poll votes with demographics';
COMMENT ON TABLE infrastructure_projects IS 'Infrastructure development projects';
COMMENT ON TABLE project_updates IS 'Project progress updates with media';
COMMENT ON TABLE project_feedback IS 'Community feedback on projects';
COMMENT ON TABLE civic_engagement_stats IS 'Daily civic engagement statistics';
