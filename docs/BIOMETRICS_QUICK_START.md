# Biometrics Quick Start

## What We've Set Up

✅ **Mobile-Only Biometrics Button** - Automatically hidden on desktop/PC
✅ **iOS Support** - Face ID and Touch ID
✅ **Android Support** - Fingerprint and Face Recognition
✅ **Error Handling** - User-friendly error messages
✅ **Fallback Login** - Always works with email/password

## How It Works

1. User lands on login page
2. App detects if device is mobile/tablet
3. If mobile + WebAuthn available, biometrics button shows
4. User can choose:
   - Email + Password login
   - Use Biometrics (mobile only)

## What You Need To Do

### Step 1: Implement Backend APIs (CRITICAL)

Create these 3 endpoints in your backend:

**1. POST /api/auth/biometric-challenge**
- Generates random 32-byte challenge
- Stores challenge with 5-minute TTL
- Returns Base64-encoded challenge

**2. POST /api/auth/biometric-verify**
- Receives: credential ID, client data, authenticator data, signature
- Verifies signature against stored public key
- Checks challenge matches
- Creates session/token
- Returns: { success, token }

**3. POST /api/auth/biometric-register**
- Receives: credential data with public key
- Stores public key + credential ID for user
- Returns: { success, credentialId }

### Step 2: Create Database Table

```sql
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  device_name VARCHAR(255),
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Step 3: Setup HTTPS

- Local: Works on `http://localhost:3000`
- Production: **MUST be HTTPS**

### Step 4: Deploy

- Update domain in API responses
- Deploy API endpoints
- Test on real mobile device

## Testing Checklist

- [ ] View login on desktop → Biometrics button hidden
- [ ] View login on mobile → Biometrics button visible (if supported)
- [ ] Click biometrics on unsupported device → Shows error message
- [ ] No credentials registered → Shows friendly error
- [ ] Failed biometric → Shows specific error reason
- [ ] Successful biometric → Redirects to dashboard
- [ ] Email/password still works → Always available fallback

## File Locations

```
app/
├── login/
│   └── page.tsx                    ← Main login page with biometrics
├── api/auth/
│   ├── biometric-challenge/
│   │   └── route.ts                ← Generate challenge (stub)
│   ├── biometric-verify/
│   │   └── route.ts                ← Verify authentication (stub)
│   └── biometric-register/
│       └── route.ts                ← Register credential (stub)
│
lib/
└── biometrics.ts                   ← Utility functions

BIOMETRICS_SETUP.md                 ← Full guide
BIOMETRICS_QUICK_START.md           ← This file
```

## Code Examples

### Login Page Features

```typescript
// Automatically detects mobile
const isMobileDevice = useDetectMobile();

// Checks biometric availability
const [isBiometricAvailable, setBiometricAvailable] = useState(false);

// Shows/hides biometric button
{isMobileDevice && isBiometricAvailable && (
  <button onClick={handleBiometricAuth}>
    Use Biometrics
  </button>
)}

// Error handling
{biometricError && (
  <div className="error-alert">{biometricError}</div>
)}
```

### Biometrics Utility Functions

```typescript
// Check if device supports biometrics
import { isPlatformAuthenticatorAvailable, isMobileDevice } from '@/lib/biometrics';

// Get stored credentials
import { getStoredCredentials } from '@/lib/biometrics';

// Handle errors gracefully
import { getErrorMessage } from '@/lib/biometrics';
```

## Common Issues & Solutions

### Issue: Biometrics button always hidden
**Solution:**
- Check device is actually mobile
- Verify browser supports WebAuthn (Chrome 67+, Safari 13+)
- Check console for errors

### Issue: "No biometric authenticator available"
**Solution:**
- Device doesn't have fingerprint/face sensor
- User hasn't set up biometrics in device settings
- Try fallback email/password login

### Issue: "Challenge doesn't match"
**Solution:**
- Backend challenge not stored properly
- Challenge expired (>5 minutes)
- Multiple concurrent requests

### Issue: Works on desktop (shouldn't!)
**Solution:**
- Make sure `isMobileDevice()` is working
- Add `max-width` to button if needed
- Use CSS media queries as backup

## Next Steps

1. **Implement Backend APIs** (See BIOMETRICS_SETUP.md)
2. **Create Database Schema**
3. **Test on Mobile Device**
4. **Add Registration Flow** (Users can register biometrics in settings)
5. **Monitor & Analytics** (Track biometric vs email logins)

## Support

For detailed implementation:
- See `BIOMETRICS_SETUP.md`
- Check MDN WebAuthn docs
- Review browser console logs for specific errors

## Browser Compatibility

| OS | Biometric Method | Browser | Version |
|---|---|---|---|
| iOS | Face ID / Touch ID | Safari | 13+ |
| Android | Fingerprint / Face | Chrome | 67+ |
| Windows | Windows Hello | Edge | 18+ |
| macOS | Touch ID | Safari | 13+ |

---

**Current Status:** ✅ Frontend implemented, ⏳ Backend APIs needed
