import { OTPService } from './otp-service';
import { JWTService } from './jwt-service';
import { TokenRefreshService } from './token-refresh';
import { UserProfileService } from './user-profile';
import { RateLimiterService } from './rate-limiter';

interface LoginRequest {
  phoneNumber: string;
}

interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: any;
  };
}

export class AuthService {
  private otpService: OTPService;
  private jwtService: JWTService;
  private tokenRefreshService: TokenRefreshService;
  private userProfileService: UserProfileService;
  private rateLimiter: RateLimiterService;

  constructor() {
    this.otpService = new OTPService();
    this.jwtService = new JWTService();
    this.tokenRefreshService = new TokenRefreshService();
    this.userProfileService = new UserProfileService();
    this.rateLimiter = new RateLimiterService();
  }

  async initiateLogin(request: LoginRequest): Promise<AuthResponse> {
    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkRateLimit(request.phoneNumber);
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      };
    }

    // Send OTP
    const otpResult = await this.otpService.sendOTP(request.phoneNumber);

    return {
      success: otpResult.success,
      message: otpResult.message,
    };
  }

  async verifyAndLogin(request: VerifyOTPRequest): Promise<AuthResponse> {
    // Check rate limit
    const rateLimitResult = await this.rateLimiter.checkRateLimit(request.phoneNumber);
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      };
    }

    // Verify OTP
    const otpResult = await this.otpService.verifyOTP(request.phoneNumber, request.otp);

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Check if user exists
    let user = await this.userProfileService.getUserByPhoneNumber(request.phoneNumber);

    // Create user if doesn't exist
    if (!user) {
      user = await this.userProfileService.createUserProfile(request.phoneNumber);
    }

    // Update last login
    await this.userProfileService.updateLastLogin(user.userId);

    // Generate tokens
    const tokens = this.jwtService.generateTokens({
      userId: user.userId,
      phoneNumber: user.phoneNumber,
      role: 'user',
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          userId: user.userId,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const result = await this.tokenRefreshService.refreshTokens(refreshToken);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to refresh token',
      };
    }

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  async logout(refreshToken: string): Promise<AuthResponse> {
    const revoked = await this.jwtService.revokeRefreshToken(refreshToken);

    if (!revoked) {
      return {
        success: false,
        message: 'Failed to logout',
      };
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async validateToken(accessToken: string): Promise<{
    valid: boolean;
    userId?: string;
    phoneNumber?: string;
  }> {
    const payload = this.jwtService.verifyAccessToken(accessToken);

    if (!payload) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.userId,
      phoneNumber: payload.phoneNumber,
    };
  }

  async resendOTP(phoneNumber: string): Promise<AuthResponse> {
    // Check rate limit (stricter for resend)
    const rateLimitResult = await this.rateLimiter.checkCustomRateLimit(
      `resend_${phoneNumber}`,
      5, // 5 requests
      60 * 60 * 1000 // per hour
    );

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many OTP requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      };
    }

    const result = await this.otpService.resendOTP(phoneNumber);

    return {
      success: result.success,
      message: result.message,
    };
  }
}
