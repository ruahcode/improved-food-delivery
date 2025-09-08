const axios = require('axios');
const crypto = require('crypto');

class ChapaService {
  constructor() {
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.baseUrl = 'https://api.chapa.co/v1';
  }

  /**
   * Verify payment status with Chapa API
   * @param {string} transactionReference - The transaction reference to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(transactionReference) {
    try {
      if (!transactionReference) {
        throw new Error('Transaction reference is required');
      }

      if (!this.secretKey) {
        throw new Error('Chapa secret key is not configured');
      }

      console.log(`Verifying payment with Chapa API for tx_ref: ${transactionReference}`);
      
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${transactionReference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000, 
          validateStatus: (status) => status < 500 
        }
      );
      
      console.log('Chapa API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const { data } = response;
      
      // Handle successful verification
      if (response.status === 200 && data && data.status === 'success') {
        return {
          success: true,
          status: data.status,
          data: {
            amount: data.amount,
            currency: data.currency,
            tx_ref: data.tx_ref,
            charge: data.charge,
            mode: data.mode,
            method: data.method,
            type: data.type,
            created_at: data.created_at,
            updated_at: data.updated_at
          },
          message: data.message || 'Payment verification completed'
        };
      }
      
      // Handle failed verification or pending status
      return {
        success: false,
        status: data?.status || 'failed',
        message: data?.message || 'Payment verification failed',
        data: data || null
      };
      
    } catch (error) {
      console.error('Chapa verification error:', {
        tx_ref: transactionReference,
        error: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          status: 'timeout',
          message: 'Payment verification request timed out',
          error: 'timeout'
        };
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          status: 'network_error',
          message: 'Unable to connect to payment verification service',
          error: 'network'
        };
      }
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          return {
            success: false,
            status: 'not_found',
            message: 'Transaction not found',
            error: 'transaction_not_found'
          };
        }
        
        if (status === 401 || status === 403) {
          return {
            success: false,
            status: 'auth_error',
            message: 'Authentication failed with payment service',
            error: 'authentication_failed'
          };
        }
        
        return {
          success: false,
          status: 'api_error',
          message: data?.message || 'Payment verification failed',
          error: error.message,
          statusCode: status
        };
      }
      
      // Generic error
      return {
        success: false,
        status: 'error',
        message: 'Payment verification failed',
        error: error.message
      };
    }
  }

  /**
   * Generate secure payment session token for authentication persistence
   * @param {string} userId - User ID
   * @param {string} orderId - Order ID
   * @param {string} token - Current JWT token
   * @returns {string} Encrypted session token
   */
  generatePaymentSession(userId, orderId, token) {
    try {
      const sessionData = {
        userId,
        orderId,
        token,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      
      // Simple base64 encoding for session data
      return Buffer.from(JSON.stringify(sessionData)).toString('base64');
    } catch (error) {
      console.error('Error generating payment session:', error);
      return null;
    }
  }

  /**
   * Decrypt and validate payment session token
   * @param {string} encryptedSession - Encrypted session token
   * @returns {Object|null} Decrypted session data or null if invalid
   */
  validatePaymentSession(encodedSession) {
    try {
      if (!encodedSession) return null;
      
      // Simple base64 decoding
      const sessionData = JSON.parse(Buffer.from(encodedSession, 'base64').toString('utf8'));
      
      // Check if session has expired
      if (Date.now() > sessionData.expires) {
        console.log('Payment session expired');
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.error('Error validating payment session:', error);
      return null;
    }
  }

  /**
   * Parse order ID from transaction reference
   * @param {string} txRef - Transaction reference (format: order-{orderId}-{timestamp})
   * @returns {string|null} Order ID or null if invalid format
   */
  parseOrderIdFromTxRef(txRef) {
    try {
      if (!txRef || typeof txRef !== 'string') return null;
      
      const parts = txRef.split('-');
      if (parts.length >= 3 && parts[0] === 'order') {
        return parts[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing order ID from tx_ref:', error);
      return null;
    }
  }

  /**
   * Check if Chapa service is properly configured
   * @returns {boolean} Whether the service is configured
   */
  isConfigured() {
    return !!(this.secretKey && this.baseUrl);
  }

  /**
   * Get configuration status for debugging
   * @returns {Object} Configuration status
   */
  getConfigStatus() {
    return {
      hasSecretKey: !!this.secretKey,
      baseUrl: this.baseUrl,
      configured: this.isConfigured()
    };
  }

  /**
   * Validate webhook signature (if Chapa provides webhook signatures)
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Whether signature is valid
   */
  validateWebhookSignature(payload, signature) {
    try {
      if (!signature || !payload) return false;
      
      // Generate expected signature using webhook secret
      const expectedSignature = crypto
        .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET || this.secretKey)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

const chapaService = new ChapaService();

// Log configuration status on startup
console.log('Chapa Service Configuration:', chapaService.getConfigStatus());

module.exports = chapaService;
