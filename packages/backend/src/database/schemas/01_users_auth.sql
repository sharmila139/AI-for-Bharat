-- ============================================================================
-- RuralConnect AI - Users and Authentication Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Profile Information
    name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Location
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Occupation
    occupation VARCHAR(100),
    
    -- Sensitive Data (encrypted)
    aadhaar_encrypted TEXT, -- Encrypted Aadhaar number
    aadhaar_hash VARCHAR(64), -- SHA-256 hash for lookup
    
    -- Profile Picture
    profile_picture_url TEXT,
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    
    -- Account Status
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
    deletion_requested_at TIMESTAMP,
    deletion_scheduled_for TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT valid_phone CHECK (phone_number ~ '^\+91[6-9][0-9]{9}$'),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for users table
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_aadhaar_hash ON users(aadhaar_hash) WHERE aadhaar_hash IS NOT NULL;
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_location ON users(state, district);

-- ============================================================================
-- USER SESSIONS TABLE
-- ============================================================================

CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Session Data
    refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Session Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for user_sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- OTP VERIFICATION TABLE
-- ============================================================================

CREATE TABLE otp_verifications (
    otp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    
    -- OTP Data
    otp_hash VARCHAR(64) NOT NULL, -- Hashed OTP for security
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('login', 'registration', 'password_reset', 'phone_verification')),
    
    -- Verification Status
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    CONSTRAINT valid_otp_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_attempts CHECK (attempts <= max_attempts)
);

-- Indexes for otp_verifications
CREATE INDEX idx_otp_phone ON otp_verifications(phone_number);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX idx_otp_verified ON otp_verifications(verified);

-- ============================================================================
-- RATE LIMITING TABLE
-- ============================================================================

CREATE TABLE rate_limits (
    limit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- user_id, phone_number, or IP address
    endpoint VARCHAR(255) NOT NULL,
    
    -- Rate Limit Data
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    blocked BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(identifier, endpoint, window_start)
);

-- Indexes for rate_limits
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(blocked) WHERE blocked = TRUE;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Event Data
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('auth', 'profile', 'security', 'data', 'system')),
    event_description TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_type ON audit_logs(event_type);
CREATE INDEX idx_audit_category ON audit_logs(event_category);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- ACCOUNT DELETION REQUESTS TABLE
-- ============================================================================

CREATE TABLE account_deletion_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Request Data
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    CONSTRAINT valid_schedule CHECK (scheduled_for > requested_at)
);

-- Indexes for account_deletion_requests
CREATE INDEX idx_deletion_user ON account_deletion_requests(user_id);
CREATE INDEX idx_deletion_status ON account_deletion_requests(status);
CREATE INDEX idx_deletion_scheduled ON account_deletion_requests(scheduled_for);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log user profile changes
CREATE OR REPLACE FUNCTION log_user_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, event_type, event_category, event_description, metadata)
        VALUES (
            NEW.user_id,
            'profile_updated',
            'profile',
            'User profile was updated',
            jsonb_build_object(
                'old_values', row_to_json(OLD),
                'new_values', row_to_json(NEW)
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, event_type, event_category, event_description)
        VALUES (
            OLD.user_id,
            'profile_deleted',
            'profile',
            'User profile was deleted'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_user_changes
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_profile_changes();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active users view
CREATE VIEW active_users AS
SELECT 
    user_id,
    phone_number,
    email,
    name,
    district,
    state,
    occupation,
    preferred_language,
    created_at,
    last_login_at
FROM users
WHERE account_status = 'active';

-- User session summary view
CREATE VIEW user_session_summary AS
SELECT 
    u.user_id,
    u.phone_number,
    u.name,
    COUNT(s.session_id) as total_sessions,
    COUNT(CASE WHEN s.is_active THEN 1 END) as active_sessions,
    MAX(s.last_used_at) as last_session_activity
FROM users u
LEFT JOIN user_sessions s ON u.user_id = s.user_id
GROUP BY u.user_id, u.phone_number, u.name;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otp_verifications
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users
    SET 
        name = 'DELETED_USER',
        email = NULL,
        phone_number = '+91' || LPAD(floor(random() * 10000000000)::TEXT, 10, '0'),
        aadhaar_encrypted = NULL,
        aadhaar_hash = NULL,
        profile_picture_url = NULL,
        date_of_birth = NULL,
        account_status = 'deleted',
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Main users table storing user profiles and authentication data';
COMMENT ON TABLE user_sessions IS 'Active user sessions with refresh tokens';
COMMENT ON TABLE otp_verifications IS 'OTP verification records for phone authentication';
COMMENT ON TABLE rate_limits IS 'Rate limiting data for API endpoints';
COMMENT ON TABLE audit_logs IS 'Audit trail for security and compliance';
COMMENT ON TABLE account_deletion_requests IS 'GDPR-compliant account deletion requests';

-- ============================================================================
-- GRANTS (adjust based on your user roles)
-- ============================================================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ruralconnect_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ruralconnect_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ruralconnect_app;
