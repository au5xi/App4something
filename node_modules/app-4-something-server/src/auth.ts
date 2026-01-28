import jwt from 'jsonwebtoken';
import { config } from './config.js';

export type JwtUser = { userId: string };

export function signToken(payload: JwtUser) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, config.jwtSecret) as JwtUser;
}
