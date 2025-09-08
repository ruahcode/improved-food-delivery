/**
 * Secure authentication persistence utilities for payment flows
 * Handles token storage, restoration, and validation during payment redirects
 */

const AUTH_STORAGE_KEY = 'auth_token';
const PAYMENT_SESSION_KEY = 'payment_session';
const PRE_PAYMENT_AUTH_KEY = 'pre_payment_auth';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

/**
 * Secure token storage with encryption (browser-side)
 */
class AuthPersistence {
  constructor() {
    this.isSupported = this.checkStorageSupport();
  }

  /**
   * Check if storage is supported and available
   */
  checkStorageSupport() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('Storage not supported:', error);
      return false;
    }
  }

  /**
   * Simple XOR encryption for client-side token obfuscation
   * Note: This is NOT cryptographically secure, just obfuscation
   */
  obfuscateToken(token, key = 'payment_flow_key') {
    if (!token) return null;
    
    try {
      let result = '';
      for (let i = 0; i < token.length; i++) {
        result += String.fromCharCode(
          token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return btoa(result); // Base64 encode
    } catch (error) {
      console.error('Token obfuscation error:', error);
      return token; // Fallback to plain token
    }
  }

  /**
   * Deobfuscate token
   */
  deobfuscateToken(obfuscatedToken, key = 'payment_flow_key') {
    if (!obfuscatedToken) return null;
    
    try {
      const decoded = atob(obfuscatedToken); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch (error) {
      console.error('Token deobfuscation error:', error);
      return obfuscatedToken; // Fallback to treating as plain token
    }
  }

  /**
   * Store authentication token securely
   */
  storeToken(token, options = {}) {
    if (!this.isSupported || !token) return false;

    try {
      const { 
        persistent = true, 
        obfuscate = true,
        expiresIn = 24 * 60 * 60 * 1000 // 24 hours default
      } = options;

      const tokenData = {
        token: obfuscate ? this.obfuscateToken(token) : token,
        timestamp: Date.now(),
        expires: Date.now() + expiresIn,
        obfuscated: obfuscate
      };

      const storage = persistent ? localStorage : sessionStorage;
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokenData));
      
      // Also store timestamp for validation
      storage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  }

  /**
   * Retrieve and validate stored token
   */
  retrieveToken(options = {}) {
    if (!this.isSupported) return null;

    try {
      const { persistent = true, validateExpiry = true } = options;
      const storage = persistent ? localStorage : sessionStorage;
      
      const tokenDataStr = storage.getItem(AUTH_STORAGE_KEY);
      if (!tokenDataStr) return null;

      const tokenData = JSON.parse(tokenDataStr);
      
      // Check expiry
      if (validateExpiry && Date.now() > tokenData.expires) {
        this.clearToken({ persistent });
        return null;
      }

      // Deobfuscate if needed
      const token = tokenData.obfuscated 
        ? this.deobfuscateToken(tokenData.token)
        : tokenData.token;

      return {
        token,
        timestamp: tokenData.timestamp,
        expires: tokenData.expires
      };
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Clear stored authentication data
   */
  clearToken(options = {}) {
    if (!this.isSupported) return;

    try {
      const { persistent = true, clearAll = false } = options;
      const storage = persistent ? localStorage : sessionStorage;
      
      storage.removeItem(AUTH_STORAGE_KEY);
      storage.removeItem(AUTH_TIMESTAMP_KEY);
      
      if (clearAll) {
        // Clear from both storages
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_TIMESTAMP_KEY);
        
        // Clear payment-specific storage
        this.clearPaymentSession();
      }
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  /**
   * Store pre-payment authentication state
   */
  storePrePaymentAuth(token) {
    if (!this.isSupported || !token) return false;

    try {
      const authData = {
        token: this.obfuscateToken(token),
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      };

      sessionStorage.setItem(PRE_PAYMENT_AUTH_KEY, JSON.stringify(authData));
      return true;
    } catch (error) {
      console.error('Error storing pre-payment auth:', error);
      return false;
    }
  }

  /**
   * Retrieve pre-payment authentication state
   */
  retrievePrePaymentAuth() {
    if (!this.isSupported) return null;

    try {
      const authDataStr = sessionStorage.getItem(PRE_PAYMENT_AUTH_KEY);
      if (!authDataStr) return null;

      const authData = JSON.parse(authDataStr);
      
      // Check expiry
      if (Date.now() > authData.expires) {
        sessionStorage.removeItem(PRE_PAYMENT_AUTH_KEY);
        return null;
      }

      return {
        token: this.deobfuscateToken(authData.token),
        timestamp: authData.timestamp
      };
    } catch (error) {
      console.error('Error retrieving pre-payment auth:', error);
      return null;
    }
  }

  /**
   * Clear payment session data
   */
  clearPaymentSession() {
    if (!this.isSupported) return;

    try {
      sessionStorage.removeItem(PRE_PAYMENT_AUTH_KEY);
      sessionStorage.removeItem(PAYMENT_SESSION_KEY);
      sessionStorage.removeItem('prePaymentAuth'); // Legacy key
      sessionStorage.removeItem('prePaymentTimestamp'); // Legacy key
      sessionStorage.removeItem('prePaymentLocation');
      sessionStorage.removeItem('paymentError');
    } catch (error) {
      console.error('Error clearing payment session:', error);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expires) return true;
    return Date.now() > tokenData.expires;
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    const tokenData = this.retrieveToken({ validateExpiry: false });
    
    if (!tokenData) {
      return { authenticated: false, reason: 'no_token' };
    }

    if (this.isTokenExpired(tokenData)) {
      return { authenticated: false, reason: 'expired' };
    }

    return { 
      authenticated: true, 
      token: tokenData.token,
      timestamp: tokenData.timestamp 
    };
  }

  /**
   * Migrate from legacy storage format
   */
  migrateLegacyAuth() {
    try {
      // Check for legacy token storage
      const legacyToken = localStorage.getItem('token');
      if (legacyToken && !this.retrieveToken()) {
        this.storeToken(legacyToken, { obfuscate: true });
        console.log('Migrated legacy authentication token');
      }

      // Check for legacy pre-payment auth
      const legacyPreAuth = sessionStorage.getItem('prePaymentAuth');
      if (legacyPreAuth && !this.retrievePrePaymentAuth()) {
        this.storePrePaymentAuth(legacyPreAuth);
        sessionStorage.removeItem('prePaymentAuth');
        console.log('Migrated legacy pre-payment authentication');
      }
    } catch (error) {
      console.error('Error migrating legacy auth:', error);
    }
  }
}

// Create singleton instance
const authPersistence = new AuthPersistence();

// Export both the class and instance
export default authPersistence;
export { AuthPersistence };
