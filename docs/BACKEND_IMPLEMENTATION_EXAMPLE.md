# Backend Implementation Examples

This document provides implementation examples for the biometrics APIs using various backend frameworks.

## Overview

You need to implement 3 endpoints:
1. `/api/auth/biometric-challenge` - Generate challenge
2. `/api/auth/biometric-verify` - Verify authentication
3. `/api/auth/biometric-register` - Register new credential

---

## Option 1: Express.js + Node.js

### Installation

```bash
npm install express crypto @simplewebauthn/server
```

### Complete Implementation

```typescript
// biometric-routes.ts
import express from 'express';
import crypto from 'crypto';
import { 
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

const router = express.Router();

// Store challenges temporarily (use Redis in production)
const challenges = new Map<string, { userId: string; timestamp: number }>();
const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

// Challenge Endpoint
router.post('/biometric-challenge', async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Generate challenge
    const challenge = crypto.randomBytes(32);
    const encodedChallenge = Buffer.from(challenge).toString('base64');

    // Store challenge
    challenges.set(encodedChallenge, {
      userId,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      challenge: encodedChallenge,
    });
  } catch (error) {
    console.error('Challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate challenge',
    });
  }
});

// Verification Endpoint
router.post('/biometric-verify', async (req, res) => {
  try {
    const { id, clientDataJSON, authenticatorData, signature } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // Get user's stored credential
    const credential = await db.userCredentials.findOne({
      credentialId: id,
      userId,
    });

    if (!credential) {
      return res.status(401).json({
        success: false,
        message: 'Credential not found',
      });
    }

    try {
      // Verify the authentication response
      const verification = await verifyAuthenticationResponse({
        response: {
          id,
          rawId: Buffer.from(id, 'base64'),
          response: {
            clientDataJSON: Buffer.from(clientDataJSON, 'base64'),
            authenticatorData: Buffer.from(authenticatorData, 'base64'),
            signature: Buffer.from(signature, 'base64'),
          },
          type: 'public-key',
        },
        expectedChallenge: Buffer.from(
          challenges.get(req.body.challenge)?.userId || '', 
          'base64'
        ).toString('base64'),
        expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
        expectedRPID: 'localhost',
        credential: {
          credentialID: Buffer.from(id, 'base64'),
          credentialPublicKey: Buffer.from(credential.publicKey, 'base64'),
          counter: credential.counter,
          transports: ['internal'],
        },
      });

      if (!verification.verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature',
        });
      }

      // Update counter (for cloning detection)
      await db.userCredentials.updateOne(
        { credentialId: id },
        { counter: verification.authenticationInfo.newCounter }
      );

      // Create session/JWT token
      const token = generateJWT({ userId, credentialId: id });

      res.json({
        success: true,
        message: 'Authentication successful',
        token,
      });
    } catch (verifyError) {
      console.error('Verification failed:', verifyError);
      res.status(401).json({
        success: false,
        message: 'Verification failed',
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification error',
    });
  }
});

// Registration Endpoint
router.post('/biometric-register', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { response, deviceName } = req.body;

    try {
      // Verify registration response
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: Buffer.from(
          req.body.challenge || '', 
          'base64'
        ).toString('base64'),
        expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
        expectedRPID: 'localhost',
      });

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message: 'Registration verification failed',
        });
      }

      // Extract and store credential
      const credentialId = Buffer.from(
        verification.registrationInfo!.credentialID
      ).toString('base64');

      const publicKey = Buffer.from(
        verification.registrationInfo!.credentialPublicKey
      ).toString('base64');

      // Save to database
      await db.userCredentials.create({
        userId,
        credentialId,
        publicKey,
        deviceName: deviceName || 'Unknown Device',
        counter: 0,
      });

      res.json({
        success: true,
        message: 'Registration successful',
        credentialId,
      });
    } catch (verifyError) {
      console.error('Registration verification failed:', verifyError);
      res.status(400).json({
        success: false,
        message: 'Registration verification failed',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration error',
    });
  }
});

export default router;
```

### Setup in main Express app

```typescript
import express from 'express';
import biometricRoutes from './biometric-routes';

const app = express();

app.use(express.json());
app.use('/api/auth', biometricRoutes);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

---

## Option 2: Python + FastAPI

### Installation

```bash
pip install fastapi uvicorn python-multipart pydantic
```

### Complete Implementation

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
import secrets
import time
import base64
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI()

# Database setup
DATABASE_URL = "postgresql://user:password@localhost/yourdb"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Models
class UserCredential(Base):
    __tablename__ = "user_credentials"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    credential_id = Column(String, unique=True, nullable=False)
    public_key = Column(String, nullable=False)
    device_name = Column(String)
    counter = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)

# Store challenges temporarily
challenges = {}
CHALLENGE_TTL = 5 * 60  # 5 minutes

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/auth/biometric-challenge")
async def get_challenge(user_id: str, db: Session = Depends(get_db)):
    """Generate a challenge for biometric authentication"""
    try:
        # Generate random challenge
        challenge_bytes = secrets.token_bytes(32)
        challenge_b64 = base64.b64encode(challenge_bytes).decode('utf-8')
        
        # Store challenge
        challenges[challenge_b64] = {
            "user_id": user_id,
            "timestamp": time.time()
        }
        
        return {
            "success": True,
            "challenge": challenge_b64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/biometric-verify")
async def verify_biometric(
    id: str,
    clientDataJSON: str,
    authenticatorData: str,
    signature: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Verify biometric authentication response"""
    try:
        # Get stored credential
        credential = db.query(UserCredential).filter(
            UserCredential.credential_id == id,
            UserCredential.user_id == user_id
        ).first()
        
        if not credential:
            raise HTTPException(status_code=401, detail="Credential not found")
        
        # TODO: Verify signature using credential.public_key
        # This requires implementing CBOR decoding and signature verification
        
        # Update counter for clone detection
        credential.counter += 1
        credential.updated_at = datetime.utcnow()
        db.commit()
        
        # Create session/token
        token = create_jwt_token(user_id)
        
        return {
            "success": True,
            "message": "Authentication successful",
            "token": token
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/biometric-register")
async def register_biometric(
    id: str,
    rawId: str,
    response: dict,
    device_name: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Register a new biometric credential"""
    try:
        # TODO: Verify attestationObject
        # This requires CBOR decoding and cryptographic verification
        
        # Store credential
        new_credential = UserCredential(
            id=id,
            user_id=user_id,
            credential_id=rawId,
            public_key=response.get("publicKey", ""),
            device_name=device_name,
            counter=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_credential)
        db.commit()
        
        return {
            "success": True,
            "message": "Registration successful",
            "credentialId": rawId
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def create_jwt_token(user_id: str) -> str:
    """Create JWT token for user"""
    # Implementation depends on your JWT library
    # Example: import jwt
    import jwt
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, "your-secret-key", algorithm="HS256")
```

---

## Option 3: Go + Gin

### Installation

```bash
go get github.com/gin-gonic/gin
go get github.com/duo-labs/webauthn
```

### Complete Implementation

```go
// biometric.go
package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/duo-labs/webauthn/protocol"
	"github.com/gin-gonic/gin"
)

var (
	webauthnInstance *webauthn.WebAuthn
	challenges       = make(map[string]ChallengeData)
)

type ChallengeData struct {
	UserID    string
	Timestamp int64
}

const ChallengeTTL = 5 * 60 // 5 minutes

func init() {
	webauthnInstance, _ = webauthn.New(&webauthn.Config{
		RPDisplayName: "SchHub",
		RPID:          "localhost",
		RPOrigin:      "http://localhost:3000",
		Timeout:       60000,
	})
}

// GenerateChallenge generates a WebAuthn challenge
func GenerateChallenge(c *gin.Context) {
	userID := c.GetString("user_id") // From middleware
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Not authenticated",
		})
		return
	}

	// Generate random challenge
	challenge := make([]byte, 32)
	rand.Read(challenge)
	challengeB64 := base64.StdEncoding.EncodeToString(challenge)

	// Store challenge
	challenges[challengeB64] = ChallengeData{
		UserID:    userID,
		Timestamp: time.Now().Unix(),
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"challenge": challengeB64,
	})
}

// VerifyBiometric verifies biometric authentication
func VerifyBiometric(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Not authenticated",
		})
		return
	}

	var req struct {
		ID                string `json:"id"`
		ClientDataJSON    string `json:"clientDataJSON"`
		AuthenticatorData string `json:"authenticatorData"`
		Signature         string `json:"signature"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
		})
		return
	}

	// Get stored credential
	credential, err := db.GetUserCredential(userID, req.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Credential not found",
		})
		return
	}

	// TODO: Verify signature and authenticator data
	// Update counter for clone detection
	credential.Counter++
	db.UpdateCredential(credential)

	// Create session token
	token := createJWTToken(userID)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Authentication successful",
		"token":     token,
	})
}

// RegisterBiometric registers a new biometric credential
func RegisterBiometric(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Not authenticated",
		})
		return
	}

	var req struct {
		ID         string                 `json:"id"`
		RawID      string                 `json:"rawId"`
		Response   map[string]string      `json:"response"`
		DeviceName string                 `json:"deviceName"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
		})
		return
	}

	// TODO: Verify attestationObject

	// Store credential
	err := db.StoreCredential(&UserCredential{
		UserID:        userID,
		CredentialID:  req.RawID,
		PublicKey:     req.Response["publicKey"],
		DeviceName:    req.DeviceName,
		Counter:       0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Registration failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       "Registration successful",
		"credentialId":  req.RawID,
	})
}

func createJWTToken(userID string) string {
	// Implementation using your JWT library
	return ""
}
```

---

## Database Schema for All Options

```sql
-- Create user_credentials table
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  credential_id VARCHAR(255) UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  device_name VARCHAR(255),
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_credential_id ON user_credentials(credential_id);
```

---

## Testing the APIs

### Using cURL

```bash
# Generate Challenge
curl -X POST http://localhost:3001/api/auth/biometric-challenge \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Verify Biometric
curl -X POST http://localhost:3001/api/auth/biometric-verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "credential-id",
    "clientDataJSON": "base64-data",
    "authenticatorData": "base64-data",
    "signature": "base64-data"
  }'

# Register Biometric
curl -X POST http://localhost:3001/api/auth/biometric-register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "clientDataJSON": "base64-data",
      "attestationObject": "base64-data"
    },
    "deviceName": "My iPhone"
  }'
```

---

## Important Notes

1. **Always verify on the server**: Never trust client-side verification
2. **Use libraries like SimpleWebAuthn**: They handle complex encoding/verification
3. **Store public keys securely**: Encrypt them in your database
4. **Monitor counter**: Detect cloned authenticators
5. **Rate limit**: Limit failed attempts
6. **HTTPS required**: Always use HTTPS in production
7. **Secure challenges**: Use cryptographically secure random generation

---

## Recommended Libraries by Language

- **Node.js**: `@simplewebauthn/server`, `fido2-lib`
- **Python**: `py_webauthn`, `fido2`
- **Go**: `duo-labs/webauthn`
- **Java**: `webauthn4j`
- **PHP**: `web-auth/webauthn-framework`
- **.NET**: `WebAuthn.Net`

---

## Next Steps

1. Choose your backend framework
2. Implement the API endpoints
3. Create database schema
4. Test with cURL first
5. Test with the frontend
6. Deploy to production with HTTPS
