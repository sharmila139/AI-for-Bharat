-- ============================================================================
-- RuralConnect AI - Education Module Schema
-- ============================================================================

-- ============================================================================
-- STUDENT PROFILES TABLE
-- ============================================================================

CREATE TABLE student_profiles (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Student Information
    grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
    school_name VARCHAR(255),
    board VARCHAR(50) CHECK (board IN ('CBSE', 'ICSE', 'State', 'Other')),
    
    -- Learning Preferences
    learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
    preferred_subjects TEXT[],
    
    -- Goals
    target_grade_level INTEGER,
    target_exam VARCHAR(100),
    study_hours_per_day DECIMAL(4, 2),
    
    -- Diagnostic Assessment
    initial_assessment_completed BOOLEAN DEFAULT FALSE,
    initial_assessment_date DATE,
    overall_proficiency_level VARCHAR(20) CHECK (overall_proficiency_level IN ('beginner', 'elementary', 'intermediate', 'advanced')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for student_profiles
CREATE INDEX idx_students_user ON student_profiles(user_id);
CREATE INDEX idx_students_grade ON student_profiles(grade_level);

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================

CREATE TABLE subjects (
    subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Subject Information
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE,
    category VARCHAR(50) CHECK (category IN ('mathematics', 'science', 'language', 'social_studies', 'arts', 'vocational')),
    
    -- Grade Applicability
    applicable_grades INTEGER[],
    
    -- Description
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subjects
CREATE INDEX idx_subjects_name ON subjects(subject_name);
CREATE INDEX idx_subjects_category ON subjects(category);

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================

CREATE TABLE topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    parent_topic_id UUID REFERENCES topics(topic_id) ON DELETE SET NULL,
    
    -- Topic Information
    topic_name VARCHAR(255) NOT NULL,
    topic_code VARCHAR(50),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    
    -- Hierarchy
    level INTEGER DEFAULT 0, -- 0 for root topics, 1 for subtopics, etc.
    order_index INTEGER DEFAULT 0,
    
    -- Prerequisites
    prerequisite_topics UUID[],
    
    -- Estimated Time
    estimated_hours DECIMAL(5, 2),
    
    -- Description
    description TEXT,
    learning_objectives TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for topics
CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_topics_parent ON topics(parent_topic_id);
CREATE INDEX idx_topics_difficulty ON topics(difficulty_level);

-- ============================================================================
-- LEARNING CONTENT TABLE
-- ============================================================================

CREATE TABLE learning_content (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    
    -- Content Information
    title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('video', 'text', 'interactive', 'quiz', 'simulation', 'game', 'practice')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    
    -- Content Data
    content_url TEXT,
    content_data JSONB, -- For interactive content, quiz questions, etc.
    duration_minutes INTEGER,
    
    -- Video Specific
    video_quality_options JSONB, -- Different quality URLs (360p, 480p, 720p)
    video_size_mb DECIMAL(10, 2),
    chapter_markers JSONB, -- Array of chapter markers with timestamps
    
    -- Subtitles and Transcripts
    subtitles JSONB, -- Multi-language subtitles
    transcript TEXT,
    
    -- Offline Availability
    available_offline BOOLEAN DEFAULT FALSE,
    offline_size_mb DECIMAL(10, 2),
    download_priority INTEGER DEFAULT 0,
    
    -- Metadata
    tags TEXT[],
    keywords TEXT[],
    
    -- Language
    language VARCHAR(10) DEFAULT 'en',
    
    -- Engagement Metrics
    view_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Indexes for learning_content
CREATE INDEX idx_content_topic ON learning_content(topic_id);
CREATE INDEX idx_content_type ON learning_content(content_type);
CREATE INDEX idx_content_difficulty ON learning_content(difficulty_level);
CREATE INDEX idx_content_offline ON learning_content(available_offline) WHERE available_offline = TRUE;
CREATE INDEX idx_content_language ON learning_content(language);
CREATE INDEX idx_content_tags ON learning_content USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_content_search ON learning_content USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(transcript, ''))
);

-- ============================================================================
-- KNOWLEDGE STATE TABLE
-- ============================================================================

CREATE TABLE knowledge_state (
    knowledge_state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    
    -- Proficiency Score (0-100)
    proficiency_score DECIMAL(5, 2) DEFAULT 0 CHECK (proficiency_score BETWEEN 0 AND 100),
    
    -- Bayesian Knowledge Tracing Parameters
    p_know DECIMAL(5, 4) DEFAULT 0.0, -- Probability student knows the skill
    p_learn DECIMAL(5, 4) DEFAULT 0.3, -- Probability of learning
    p_guess DECIMAL(5, 4) DEFAULT 0.25, -- Probability of guessing correctly
    p_slip DECIMAL(5, 4) DEFAULT 0.1, -- Probability of making a mistake
    
    -- Learning Progress
    mastery_level VARCHAR(20) CHECK (mastery_level IN ('not_started', 'learning', 'practicing', 'mastered')),
    attempts_count INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    
    -- Time Spent
    total_time_minutes INTEGER DEFAULT 0,
    
    -- Last Activity
    last_practiced_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, topic_id)
);

-- Indexes for knowledge_state
CREATE INDEX idx_knowledge_student ON knowledge_state(student_id);
CREATE INDEX idx_knowledge_topic ON knowledge_state(topic_id);
CREATE INDEX idx_knowledge_proficiency ON knowledge_state(proficiency_score);
CREATE INDEX idx_knowledge_mastery ON knowledge_state(mastery_level);

-- ============================================================================
-- LEARNING SESSIONS TABLE
-- ============================================================================

CREATE TABLE learning_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    
    -- Session Information
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Progress
    progress_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    -- Engagement
    pauses_count INTEGER DEFAULT 0,
    rewinds_count INTEGER DEFAULT 0,
    playback_speed DECIMAL(3, 2) DEFAULT 1.0,
    
    -- Quiz/Assessment Results
    quiz_score DECIMAL(5, 2),
    quiz_attempts INTEGER DEFAULT 0,
    
    -- Device Information
    device_type VARCHAR(50),
    offline_mode BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for learning_sessions
CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_sessions_content ON learning_sessions(content_id);
CREATE INDEX idx_sessions_completed ON learning_sessions(completed);
CREATE INDEX idx_sessions_started ON learning_sessions(started_at);

-- ============================================================================
-- ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    
    -- Assessment Information
    title VARCHAR(500) NOT NULL,
    assessment_type VARCHAR(50) CHECK (assessment_type IN ('diagnostic', 'formative', 'summative', 'practice', 'mock_test')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'mixed')),
    
    -- Questions
    questions JSONB NOT NULL, -- Array of question objects
    total_questions INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    
    -- Time Limit
    time_limit_minutes INTEGER,
    
    -- Passing Criteria
    passing_percentage DECIMAL(5, 2) DEFAULT 40,
    
    -- Adaptive Assessment
    is_adaptive BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for assessments
CREATE INDEX idx_assessments_topic ON assessments(topic_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_difficulty ON assessments(difficulty_level);

-- ============================================================================
-- ASSESSMENT ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE assessment_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    
    -- Attempt Information
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_taken_minutes INTEGER,
    
    -- Responses
    responses JSONB NOT NULL, -- Array of response objects
    
    -- Scoring
    score DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    passed BOOLEAN,
    
    -- Analysis
    correct_answers INTEGER,
    incorrect_answers INTEGER,
    skipped_answers INTEGER,
    
    -- Topic-wise Performance
    topic_scores JSONB, -- Performance breakdown by topic
    
    -- Feedback
    feedback TEXT,
    areas_to_improve TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for assessment_attempts
CREATE INDEX idx_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_submitted ON assessment_attempts(submitted_at);

-- ============================================================================
-- LEARNING PATHS TABLE
-- ============================================================================

CREATE TABLE learning_paths (
    path_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    
    -- Path Information
    path_name VARCHAR(255),
    path_type VARCHAR(50) CHECK (path_type IN ('recommended', 'custom', 'remedial', 'advanced')),
    
    -- Topics Sequence
    topics_sequence UUID[] NOT NULL, -- Ordered array of topic IDs
    
    -- Progress
    current_topic_index INTEGER DEFAULT 0,
    completed_topics INTEGER DEFAULT 0,
    total_topics INTEGER NOT NULL,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP,
    estimated_completion_date DATE,
    completed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for learning_paths
CREATE INDEX idx_paths_student ON learning_paths(student_id);
CREATE INDEX idx_paths_subject ON learning_paths(subject_id);
CREATE INDEX idx_paths_active ON learning_paths(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Achievement Information
    achievement_name VARCHAR(255) NOT NULL UNIQUE,
    achievement_type VARCHAR(50) CHECK (achievement_type IN ('milestone', 'streak', 'mastery', 'speed', 'consistency', 'special')),
    category VARCHAR(50),
    
    -- Criteria
    criteria JSONB NOT NULL,
    points INTEGER DEFAULT 0,
    
    -- Badge
    badge_icon_url TEXT,
    badge_color VARCHAR(20),
    
    -- Description
    description TEXT,
    
    -- Rarity
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for achievements
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);

-- ============================================================================
-- STUDENT ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE student_achievements (
    student_achievement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    
    -- Achievement Details
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_data JSONB,
    
    -- Notification
    notified BOOLEAN DEFAULT FALSE,
    
    UNIQUE(student_id, achievement_id)
);

-- Indexes for student_achievements
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX idx_student_achievements_earned ON student_achievements(earned_at);

-- ============================================================================
-- DAILY STREAKS TABLE
-- ============================================================================

CREATE TABLE daily_streaks (
    streak_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    
    -- Streak Information
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for daily_streaks
CREATE INDEX idx_streaks_student ON daily_streaks(student_id);
CREATE INDEX idx_streaks_current ON daily_streaks(current_streak);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_content_updated_at
    BEFORE UPDATE ON learning_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_state_updated_at
    BEFORE UPDATE ON knowledge_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_streaks_updated_at
    BEFORE UPDATE ON daily_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Student progress summary view
CREATE VIEW student_progress_summary AS
SELECT 
    sp.student_id,
    sp.user_id,
    sp.grade_level,
    COUNT(DISTINCT ks.topic_id) as topics_studied,
    AVG(ks.proficiency_score) as average_proficiency,
    SUM(ks.total_time_minutes) as total_study_minutes,
    ds.current_streak,
    ds.longest_streak
FROM student_profiles sp
LEFT JOIN knowledge_state ks ON sp.student_id = ks.student_id
LEFT JOIN daily_streaks ds ON sp.student_id = ds.student_id
GROUP BY sp.student_id, sp.user_id, sp.grade_level, ds.current_streak, ds.longest_streak;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE student_profiles IS 'Student profiles with learning preferences';
COMMENT ON TABLE subjects IS 'Master list of subjects';
COMMENT ON TABLE topics IS 'Hierarchical topic structure';
COMMENT ON TABLE learning_content IS 'Educational content (videos, quizzes, etc.)';
COMMENT ON TABLE knowledge_state IS 'Student knowledge tracking with Bayesian KT';
COMMENT ON TABLE learning_sessions IS 'Individual learning session tracking';
COMMENT ON TABLE assessments IS 'Assessments and quizzes';
COMMENT ON TABLE assessment_attempts IS 'Student assessment attempts and scores';
COMMENT ON TABLE learning_paths IS 'Personalized learning paths';
COMMENT ON TABLE achievements IS 'Achievement definitions';
COMMENT ON TABLE student_achievements IS 'Student earned achievements';
COMMENT ON TABLE daily_streaks IS 'Daily learning streak tracking';
