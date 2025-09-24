// lib/auth.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function verifyToken(req) {
  try {
    // Get token from cookie instead of Authorization header
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      console.log('No cookies found');
      return null;
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const token = cookies.token;
    
    if (!token) {
      console.log('No token cookie found');
      return null;
    }

    // Verify the token using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return {
      userId: decoded.id,
      email: decoded.email
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}