# WebAuthn Biometrics Setup Guide for Next.js PWA

This guide explains how to implement WebAuthn (Web Authentication) biometrics for your Next.js PWA, with support for Android fingerprint, iOS Face ID/Touch ID, and other platform authenticators.

## Overview

WebAuthn is a web standard that allows users to authenticate using biometric information (fingerprint, face recognition) or platform-specific authenticators (PIN) available on their device. It works on:

- **iOS**: Face ID (iPhone X+), Touch ID (older iPhones with Touch ID)
- **Android**: Fingerprint, Face Recognition (Android 9+)
- **Windows**: Windows Hello (Face/Iris)
- **macOS**: Touch ID
- **Linux**: Limited support (depends on device)

## Current Implementation

### Files Created

1. **Frontend Components:**
   - `/app/login/page.tsx` - Login page with biometrics button
   - `/lib/biometrics.ts` - Biometrics utility functions

2. **API Routes (Stubs):**
   - `/app/api/auth/biometric-challenge/route.ts` - Generate challenge
   - `/app/api/auth/biometric-verify/route.ts` - Verify authentication
   - `/app/api/auth/biometric-register/route.ts` - Register new credential

### Key Features

✅ Mobile-only display: Biometrics button only shows on mobile/tablet devices
✅ Device detection: Automatically detects iOS, Android, and other devices
✅ Error handling: Comprehensive error messages for all WebAuthn errors
✅ Graceful fallback: Email/password login always available
✅ PWA compatible: Works with service workers and offline support

## Setup Instructions

### 1. Client-Side Implementation (Already Done)

The login page automatically:
- Detects if user is on mobile/tablet
- Checks WebAuthn API availability
- Queries platform authenticator availability
- Shows/hides biometrics button accordingly

```typescript
// Mobile detection
const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  navigator.userAgent.toLowerCase()
);

// Biometric availability
const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
```

### 2. Backend Implementation (Required)

You need to implement these three API endpoints in your backend:

#### A. `/api/auth/biometric-challenge` (POST)
Generates a cryptographic challenge for the client:

```typescript
POST /api/auth/biometric-challenge

Response:
{
  "success": true,
  "challenge": "base64-encoded-challenge-string"
}
```

**What to do:**
- Generate a random 32-byte challenge using `crypto.getRandomValues()`
- Store it temporarily in your database with a 5-minute TTL
- Encode it as Base64
- Associate it with the user's session

#### B. `/api/auth/biometric-verify` (POST)
Verifies the biometric authentication response:

```typescript
POST /api/auth/biometric-verify
Content-Type: application/json

{
  "id": "base64-credential-id",
  "clientDataJSON": "base64-client-data",
  "authenticatorData": "base64-authenticator-data",
  "signature": "base64-signature"
}

Response:
{
  "success": true,
  "message": "Biometric authentication successful"
}
```

**What to do:**
1. Retrieve the user's stored public key using the credential ID
2. Verify the signature using the public key
3. Validate `clientDataJSON`:
   - Check the challenge matches what you stored
   - Verify the origin matches your domain
   - Check the type is "webauthn.get"
4. Validate `authenticatorData`:
   - Extract the rpIdHash and verify it matches your domain
   - Check the user-present flag is set
   - Check the counter hasn't been decremented (clone detection)
5. Create a session/JWT token for the user
6. Return the token to the client

#### C. `/api/auth/biometric-register` (POST)
Registers a new biometric credential:

```typescript
POST /api/auth/biometric-register
Content-Type: application/json

{
  "id": "credential-id",
  "rawId": "base64-raw-id",
  "response": {
    "clientDataJSON": "base64-client-data",
    "attestationObject": "base64-attestation-object"
  },
  "type": "public-key",
  "deviceName": "My iPhone"
}

Response:
{
  "success": true,
  "credentialId": "base64-raw-id"
}
```

**What to do:**
1. Get the current user from session
2. Parse and verify the attestationObject
3. Extract the credential public key
4. Validate the clientDataJSON
5. Store the credential:
   ```sql
   INSERT INTO user_credentials (
     user_id, credential_id, public_key, 
     device_name, counter, created_at
   ) VALUES (...)
   ```

### 3. Database Schema

You'll need to create a table to store biometric credentials:

```sql
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  device_name VARCHAR(255),
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_credential_id ON user_credentials(credential_id);
```

### 4. Registration Flow

To allow users to register biometrics after login:

```typescript
// In your user profile/settings page:
const registerBiometric = async () => {
  try {
    // Get registration options from your server
    const optionsResponse = await fetch('/api/auth/biometric-register-options', {
      method: 'POST',
    });
    const options = await optionsResponse.json();

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(Buffer.from(options.challenge, 'base64')),
        rp: {
          name: 'SchHub',
          id: 'yourdomain.com',
        },
        user: {
          id: new Uint8Array(Buffer.from(options.userId, 'base64')),
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        userVerification: 'preferred',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'discouraged',
          userVerification: 'preferred',
        },
      },
    });

    // Send to backend for verification
    const registerResponse = await fetch('/api/auth/biometric-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential),
    });

    if (registerResponse.ok) {
      alert('Biometric registration successful!');
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
};
```

### 5. Environment Setup

1. **HTTPS Required**: WebAuthn only works over HTTPS (except localhost)
   - Use HTTPS in production
   - Local testing can use `http://localhost:3000`

2. **Domain Configuration**:
   - Update your domain in API responses
   - Example: `rp.id: 'yourdomain.com'`
   - Must match the deployment domain

3. **PWA Configuration**:
   - Ensure manifest.json is properly configured
   - Service worker is correctly registered
   - CORS headers allow credential requests

## Error Handling

The implementation handles these WebAuthn errors:

| Error | Meaning | Solution |
|-------|---------|----------|
| `NotAllowedError` | User cancelled or failed auth | Retry or use email/password |
| `InvalidStateError` | Credential already registered | Use different authenticator |
| `TimeoutError` | Timeout waiting for biometric | Try again, increase timeout |
| `NotSupportedError` | Device doesn't support WebAuthn | Use email/password |
| `AbortError` | Operation aborted | Retry |
| `SecurityError` | Cross-origin issue | Check domain configuration |

## Testing

### Local Testing
```bash
# Run dev server on localhost
pnpm dev

# Test on mobile device by:
# 1. Get your machine's local IP: ipconfig getifaddr en0 (macOS) or similar
# 2. Visit http://<your-ip>:3000 on phone
# Note: Biometrics won't work on localhost except on the device
```

### Mobile Device Testing

**Android:**
1. Enable development mode
2. Install Android Studio or use Chrome DevTools remote debugging
3. Test with fingerprint emulator in Android Studio

**iOS:**
1. Use Safari on device
2. Test with Face ID/Touch ID simulator in Xcode
3. Enable biometric prompt in simulator

## Security Best Practices

1. **Always verify on server-side**: Never trust client-side biometric verification
2. **Store public keys securely**: Use encrypted database storage
3. **Monitor counter**: Check for sign of cloned authenticators
4. **Rate limit**: Limit failed attempts per credential
5. **Secure challenges**: Generate cryptographically secure random challenges
6. **HTTPS only**: Always use HTTPS in production
7. **Origin validation**: Always check origin matches your domain
8. **User consent**: Always inform users before registering biometrics

## Browser Support

| Browser | iOS | Android | Desktop |
|---------|-----|---------|---------|
| Safari | ✅ 13+ | ❌ | ✅ 13+ |
| Chrome | ✅ (partial) | ✅ 67+ | ✅ 67+ |
| Firefox | ❌ | ✅ 60+ | ✅ 60+ |
| Edge | ❌ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | - |

## Troubleshooting

### Biometrics button not showing
- Check if viewing on mobile device
- Verify `isMobileDevice()` is working
- Check browser console for errors

### "Biometric authenticator not available"
- Device doesn't have fingerprint/face sensor
- Platform authenticator not set up
- Browser doesn't support WebAuthn

### "Challenge doesn't match"
- Server challenge wasn't stored properly
- Challenge expired (>5 minutes)
- Multiple concurrent requests

### "Origin doesn't match"
- Incorrect domain in API responses
- Mismatched HTTP vs HTTPS
- Localhost vs 127.0.0.1

## References

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO2 Documentation](https://fidoalliance.org/fido2/)
- [WebAuthn Library: SimpleWebAuthn](https://simplewebauthn.dev/)

## Production Implementation

For production, consider using a library like:
- **SimpleWebAuthn**: Highly recommended, handles encoding/verification
- **Web3Auth**: Multi-chain authentication support
- **Passage by 1Password**: Passwordless authentication service
- **Okta**: Enterprise authentication platform

### SimpleWebAuthn Example

```bash
pnpm add @simplewebauthn/browser @simplewebauthn/server
```

```typescript
import { 
  startAuthentication, 
  startRegistration 
} from '@simplewebauthn/browser';

// Registration
const registrationResponse = await startRegistration(registrationOptions);

// Authentication  
const authenticationResponse = await startAuthentication(authenticationOptions);
```
