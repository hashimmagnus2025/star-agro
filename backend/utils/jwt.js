import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT secret is not set. Set JWT_ACCESS_SECRET or JWT_SECRET in .env.');
    throw new Error('JWT secret is not configured');
  }
  return secret;
};

export const createToken = (payload, expiresIn = '1h') => jwt.sign(payload, getJwtSecret(), { expiresIn });

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());
