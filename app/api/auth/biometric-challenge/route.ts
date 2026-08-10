/**
 * GET /api/auth/biometric-challenge
 * Generates a challenge for WebAuthn biometric authentication
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Get the user's session/email from the request
    // 2. Generate a cryptographically secure challenge
    // 3. Store it temporarily (with a short TTL) in your backend
    // 4. Return it to the client

    // Example implementation:
    const challenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');

    // Store challenge in session/cache (pseudo-code):
    // await setChallenge(session.userId, challenge, { expiresIn: '5 minutes' });

    return NextResponse.json(
      {
        success: true,
        challenge,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Biometric challenge error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate challenge',
      },
      { status: 500 }
    );
  }
}
