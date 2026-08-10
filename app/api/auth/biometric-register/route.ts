/**
 * POST /api/auth/biometric-register
 * Handles WebAuthn biometric registration/enrollment
 */

import { NextRequest, NextResponse } from 'next/server';

interface BiometricRegistrationBody {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: string;
  deviceName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BiometricRegistrationBody = await request.json();

    if (!body.id || !body.rawId || !body.response) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required registration data',
        },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Verify the attestation object
    // 2. Extract the public key
    // 3. Validate the client data JSON
    // 4. Check the origin matches your domain
    // 5. Store the public key and credential ID associated with the user
    // 6. Increment or reset the counter for clone detection

    // Pseudo-code implementation:
    /*
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const verified = await verifyRegistrationResponse(
      body.response.attestationObject,
      body.response.clientDataJSON,
      session.userId
    );

    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Registration verification failed' },
        { status: 400 }
      );
    }

    // Store credential
    await storeCredential({
      userId: session.userId,
      credentialId: body.rawId,
      publicKey: verified.publicKey,
      deviceName: body.deviceName || 'Unknown Device',
      counter: 0,
    });
    */

    return NextResponse.json(
      {
        success: true,
        message: 'Biometric credential registered successfully',
        credentialId: body.rawId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Biometric registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Biometric registration failed',
      },
      { status: 500 }
    );
  }
}
