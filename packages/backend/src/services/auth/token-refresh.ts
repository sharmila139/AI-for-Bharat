import { JWTService } from './jwt-service';

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
}

export class TokenRefreshService {
  private jwtService: JWTService;
  private refreshThresholdSeconds: number = 300; // Refresh if token expires in 5 minutes

  constructor() {
    this.jwtService = new JWTService();
  }

  async refreshTokens(refreshToken: string): Promise<RefreshResult> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);

      if (!payload) {
        return {
          success: false,
          message: 'Invalid or expired refresh token. Please login again.',
        };
      }

      // Generate new token pair
      const newTokens = this.jwtService.generateTokens(payload);

      // Revoke old refresh token
      await this.jwtService.revokeRefreshToken(refreshToken);

      return {
        success: true,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
      };
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return {
        success: false,
        message: 'Failed to refresh tokens. Please try again.',
      };
    }
  }

  shouldRefreshToken(accessToken: string): boolean {
    try {
      const decoded = this.jwtService.decodeToken(accessToken);
      
      if (!decoded || !decoded.exp) {
        return true; // Invalid token, should refresh
      }

      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = (expiryTime - currentTime) / 1000; // Convert to seconds

      // Refresh if token expires within threshold
      return timeUntilExpiry <= this.refreshThresholdSeconds;
    } catch (error) {
      return true; // Error decoding, should refresh
    }
  }

  async autoRefreshIfNeeded(
    accessToken: string,
    refreshToken: string
  ): Promise<RefreshResult | null> {
    if (this.shouldRefreshToken(accessToken)) {
      return this.refreshTokens(refreshToken);
    }
    return null; // No refresh needed
  }

  getTokenExpiryTime(token: string): Date | null {
    try {
      const decoded = this.jwtService.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  getTimeUntilExpiry(token: string): number | null {
    const expiryTime = this.getTokenExpiryTime(token);
    if (!expiryTime) {
      return null;
    }
    return Math.max(0, expiryTime.getTime() - Date.now());
  }

  async validateAndRefresh(
    accessToken: string,
    refreshToken: string
  ): Promise<{
    valid: boolean;
    tokens?: { accessToken: string; refreshToken: string; expiresIn: number };
    message?: string;
  }> {
    // Check if access token is valid
    const payload = this.jwtService.verifyAccessToken(accessToken);

    if (payload) {
      // Token is valid, check if it needs refresh
      if (this.shouldRefreshToken(accessToken)) {
        const refreshResult = await this.refreshTokens(refreshToken);
        if (refreshResult.success) {
          return {
            valid: true,
            tokens: {
              accessToken: refreshResult.accessToken!,
              refreshToken: refreshResult.refreshToken!,
              expiresIn: refreshResult.expiresIn!,
            },
          };
        }
      }
      return { valid: true };
    }

    // Access token is invalid, try to refresh
    const refreshResult = await this.refreshTokens(refreshToken);
    if (refreshResult.success) {
      return {
        valid: true,
        tokens: {
          accessToken: refreshResult.accessToken!,
          refreshToken: refreshResult.refreshToken!,
          expiresIn: refreshResult.expiresIn!,
        },
      };
    }

    return {
      valid: false,
      message: 'Authentication failed. Please login again.',
    };
  }
}
