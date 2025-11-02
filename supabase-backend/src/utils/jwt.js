const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '60m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function generateToken(payload, isAdmin = false) {
  const secret = isAdmin ? ADMIN_JWT_SECRET : JWT_SECRET;
  const expiresIn = isAdmin ? ADMIN_JWT_EXPIRES_IN : JWT_EXPIRES_IN;
  
  if (!secret) {
    throw new Error('JWT secret not configured');
  }
  
  return jwt.sign(payload, secret, { expiresIn });
}

function generateRefreshToken(payload) {
  const payloadWithType = { ...payload, type: 'refresh' };
  return jwt.sign(payloadWithType, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyToken(token, isAdmin = false) {
  const secret = isAdmin ? ADMIN_JWT_SECRET : JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT secret not configured');
  }
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

function generateReferralCode(userId) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// Generate secure initialization token
function generateInitToken() {
  const crypto = require('crypto');
  // Generate random 32-byte token and hash it
  const randomBytes = crypto.randomBytes(32);
  const hash = crypto.createHash('sha256').update(randomBytes).digest('hex');
  
  // Add timestamp and additional entropy
  const timestamp = Date.now();
  const combined = hash + timestamp + Math.random().toString();
  const finalHash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Return 64-character hash that looks like a secure token
  return finalHash;
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateReferralCode,
  generateInitToken
};

