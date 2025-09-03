// Secure token management utility
class TokenManager {
  static TOKEN_KEY = 'token';
  static USER_KEY = 'user';

  // Get token from localStorage or cookies
  static getToken() {
    // Try localStorage first
    let token = localStorage.getItem(this.TOKEN_KEY);
    
    // Fallback to cookies
    if (!token) {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${this.TOKEN_KEY}=`));
      token = cookieValue ? cookieValue.split('=')[1] : null;
    }
    
    return token && token !== 'undefined' && token !== 'null' ? token : null;
  }

  // Set token in both localStorage and cookies
  static setToken(token) {
    if (!token) return;
    
    localStorage.setItem(this.TOKEN_KEY, token);
    // Set secure cookie (httpOnly would be set by server)
    document.cookie = `${this.TOKEN_KEY}=${token}; Path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
  }

  // Remove token from all storage
  static removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Clear cookie
    document.cookie = `${this.TOKEN_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }

  // Get user data
  static getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData || userData === 'undefined' || userData === 'null') {
      return null;
    }
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      this.removeToken(); // Clear corrupted data
      return null;
    }
  }

  // Set user data
  static setUser(user) {
    if (!user) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Check if token exists and is valid format
  static hasValidToken() {
    const token = this.getToken();
    return token && token.length > 10; // Basic validation
  }

  // Clear all auth data
  static clearAll() {
    this.removeToken();
  }
}

export default TokenManager;