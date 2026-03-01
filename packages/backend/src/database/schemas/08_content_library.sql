-- ============================================================================
-- RuralConnect AI - Content Library and Curriculum Alignment Schema
-- Section 19: Backend Services for Content Management
-- ============================================================================

-- ============================================================================
-- CONTENT VERSIONS TABLE (for version control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_versions (
    version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes TEXT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, version_number)
);

CREATE INDEX idx_content_versions_content ON content_versions(content_id);
CREATE INDEX idx_content_versions_number ON content_versions(version_number);

-- ============================================================================
-- CONTENT APPROVALS TABLE (for publishing workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_approvals (
    approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    reviewer_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_approvals_content ON content_approvals(content_id);
CREATE INDEX idx_content_approvals_status ON content_approvals(approval_status);

-- ============================================================================
-- CURRICULUM ALIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_alignments (
    alignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    curriculum_type VARCHAR(20) CHECK (curriculum_type IN ('NCERT', 'CBSE', 'ICSE', 'State')),
    board_name VARCHAR(100),
    grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
    chapter_number VARCHAR(20),
    section_number VARCHAR(20),
    alignment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, curriculum_type, grade_level)
);

CREATE INDEX idx_curriculum_alignments_content ON curriculum_alignments(content_id);
CREATE INDEX idx_curriculum_alignments_type ON curriculum_alignments(curriculum_type);
CREATE INDEX idx_curriculum_alignments_grade ON curriculum_alignments(grade_level);

-- ============================================================================
-- VIDEO STREAMING SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_streaming_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    quality_selected VARCHAR(10) CHECK (quality_selected IN ('360p', '480p', '720p', 'auto')),
    bandwidth_kbps INTEGER,
    buffering_events INTEGER DEFAULT 0,
    quality_switches INTEGER DEFAULT 0,
    total_buffering_time_seconds INTEGER DEFAULT 0,
    playback_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_sessions_student ON video_streaming_sessions(student_id);
CREATE INDEX idx_video_sessions_content ON video_streaming_sessions(content_id);
CREATE INDEX idx_video_sessions_quality ON video_streaming_sessions(quality_selected);

-- ============================================================================
-- TRANSCODING JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transcoding_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    target_qualities TEXT[] NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcoding_jobs_content ON transcoding_jobs(content_id);
CREATE INDEX idx_transcoding_jobs_status ON transcoding_jobs(status);

-- ============================================================================
-- SIMULATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulations (
    simulation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    simulation_type VARCHAR(50) CHECK (simulation_type IN ('physics', 'chemistry', 'biology', 'math', 'geography', 'other')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    estimated_duration_minutes INTEGER,
    learning_objectives TEXT[],
    interactive_elements JSONB,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_simulations_content ON simulations(content_id);
CREATE INDEX idx_simulations_type ON simulations(simulation_type);

-- ============================================================================
-- GAMES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    game_type VARCHAR(50) CHECK (game_type IN ('quiz', 'puzzle', 'strategy', 'adventure', 'simulation')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    max_score INTEGER NOT NULL,
    time_limit_seconds INTEGER,
    levels JSONB NOT NULL,
    mechanics JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_content ON games(content_id);
CREATE INDEX idx_games_type ON games(game_type);

-- ============================================================================
-- SIMULATION PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulation_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    simulation_id UUID NOT NULL REFERENCES simulations(simulation_id) ON DELETE CASCADE,
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    best_score DECIMAL(5, 2) DEFAULT 0,
    completion_time_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    last_state JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_simulation_progress_student ON simulation_progress(student_id);
CREATE INDEX idx_simulation_progress_simulation ON simulation_progress(simulation_id);
CREATE INDEX idx_simulation_progress_completed ON simulation_progress(completed);

-- ============================================================================
-- GAME PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    levels_completed INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    achievements_earned TEXT[] DEFAULT ARRAY[]::TEXT[],
    power_ups_collected TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, game_id)
);

CREATE INDEX idx_game_progress_student ON game_progress(student_id);
CREATE INDEX idx_game_progress_game ON game_progress(game_id);
CREATE INDEX idx_game_progress_score ON game_progress(total_score);

-- ============================================================================
-- CONTENT VIEWS TABLE (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_views (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    watch_duration_minutes DECIMAL(10, 2),
    completion_percentage DECIMAL(5, 2),
    interactions INTEGER DEFAULT 0,
    device_type VARCHAR(50),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_views_student ON content_views(student_id);
CREATE INDEX idx_content_views_content ON content_views(content_id);
CREATE INDEX idx_content_views_date ON content_views(viewed_at);

-- ============================================================================
-- CONTENT ENGAGEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_engagement (
    engagement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, student_id)
);

CREATE INDEX idx_content_engagement_content ON content_engagement(content_id);
CREATE INDEX idx_content_engagement_student ON content_engagement(student_id);

-- ============================================================================
-- CONTENT COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES content_comments(comment_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_comments_content ON content_comments(content_id);
CREATE INDEX idx_content_comments_student ON content_comments(student_id);
CREATE INDEX idx_content_comments_parent ON content_comments(parent_comment_id);

-- ============================================================================
-- CONTENT RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, student_id)
);

CREATE INDEX idx_content_ratings_content ON content_ratings(content_id);
CREATE INDEX idx_content_ratings_student ON content_ratings(student_id);

-- ============================================================================
-- SUBTITLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subtitles (
    subtitle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    language_name VARCHAR(100) NOT NULL,
    format VARCHAR(10) CHECK (format IN ('srt', 'vtt')),
    subtitle_url TEXT NOT NULL,
    file_size_kb INTEGER,
    created_by VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, language, format)
);

CREATE INDEX idx_subtitles_content ON subtitles(content_id);
CREATE INDEX idx_subtitles_language ON subtitles(language);

-- ============================================================================
-- TRANSCRIPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transcripts (
    transcript_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES learning_content(content_id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    full_text TEXT NOT NULL,
    word_count INTEGER,
    timestamps JSONB,
    generated_method VARCHAR(20) CHECK (generated_method IN ('manual', 'auto', 'imported')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, language)
);

CREATE INDEX idx_transcripts_content ON transcripts(content_id);
CREATE INDEX idx_transcripts_language ON transcripts(language);

-- Full-text search index for transcripts
CREATE INDEX idx_transcripts_search ON transcripts USING GIN(to_tsvector('english', full_text));

-- ============================================================================
-- LEARNING STYLE PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_style_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    primary_style VARCHAR(20) CHECK (primary_style IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
    style_scores JSONB NOT NULL,
    content_preferences JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_style_student ON learning_style_profiles(student_id);
CREATE INDEX idx_learning_style_primary ON learning_style_profiles(primary_style);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_content_approvals_updated_at
    BEFORE UPDATE ON content_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_alignments_updated_at
    BEFORE UPDATE ON curriculum_alignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_sessions_updated_at
    BEFORE UPDATE ON video_streaming_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcoding_jobs_updated_at
    BEFORE UPDATE ON transcoding_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at
    BEFORE UPDATE ON simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_progress_updated_at
    BEFORE UPDATE ON simulation_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_engagement_updated_at
    BEFORE UPDATE ON content_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at
    BEFORE UPDATE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_ratings_updated_at
    BEFORE UPDATE ON content_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtitles_updated_at
    BEFORE UPDATE ON subtitles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE content_versions IS 'Version control for educational content';
COMMENT ON TABLE content_approvals IS 'Content approval workflow tracking';
COMMENT ON TABLE curriculum_alignments IS 'Curriculum alignment metadata (NCERT, CBSE, etc.)';
COMMENT ON TABLE video_streaming_sessions IS 'Video streaming quality and performance tracking';
COMMENT ON TABLE transcoding_jobs IS 'Video transcoding job status';
COMMENT ON TABLE simulations IS 'Interactive simulation metadata';
COMMENT ON TABLE games IS 'Educational game metadata';
COMMENT ON TABLE simulation_progress IS 'Student progress in simulations';
COMMENT ON TABLE game_progress IS 'Student progress in games';
COMMENT ON TABLE content_views IS 'Content view analytics';
COMMENT ON TABLE content_engagement IS 'Content engagement metrics (likes, shares)';
COMMENT ON TABLE content_comments IS 'Student comments on content';
COMMENT ON TABLE content_ratings IS 'Student ratings for content';
COMMENT ON TABLE subtitles IS 'Multi-language subtitle files';
COMMENT ON TABLE transcripts IS 'Video transcripts for search and accessibility';
COMMENT ON TABLE learning_style_profiles IS 'Student learning style preferences';

