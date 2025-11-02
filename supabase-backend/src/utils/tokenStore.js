// In-memory token store for initialization tokens
// In production, use Redis or database for distributed systems

class TokenStore {
  constructor() {
    this.tokens = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  // Set token with expiration (default 1 hour)
  set(token, expiresInSeconds = 3600) {
    const expiresAt = Date.now() + (expiresInSeconds * 1000);
    this.tokens.set(token, {
      expiresAt,
      createdAt: Date.now()
    });
  }

  // Get token (returns true if exists and not expired)
  get(token) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    // Check if expired
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return false;
    }
    
    return true;
  }

  // Delete token (for single use tokens)
  delete(token) {
    return this.tokens.delete(token);
  }

  // Cleanup expired tokens every 5 minutes
  startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [token, data] of this.tokens.entries()) {
        if (now > data.expiresAt) {
          this.tokens.delete(token);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired initialization tokens`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Get stats
  getStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }
    
    return {
      total: this.tokens.size,
      active: activeCount,
      expired: expiredCount
    };
  }

  // Clear all tokens (for testing)
  clear() {
    this.tokens.clear();
  }
}

// Export singleton instance
module.exports = new TokenStore();

