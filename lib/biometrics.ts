/**
 * Biometrics utility functions for WebAuthn API
 * Supports fingerprint, face recognition, and PIN-based authentication
 */

export interface BiometricCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
  createdAt: string;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: "public-key";
    alg: number;
  }>;
  timeout: number;
  attestation: "none" | "indirect" | "direct";
  userVerification: "required" | "preferred" | "discouraged";
  authenticatorSelection: {
    authenticatorAttachment: "platform" | "cross-platform";
    residentKey: "required" | "preferred" | "discouraged";
    userVerification: "required" | "preferred" | "discouraged";
  };
}

/**
 * Check if device supports WebAuthn API
 */
export const isWebAuthnSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!window.PublicKeyCredential;
};

/**
 * Check if platform authenticator is available
 * (fingerprint, face recognition, PIN, etc.)
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error("Error checking platform authenticator:", error);
    return false;
  }
};

/**
 * Check if device is mobile or tablet
 */
export const isMobileDevice = (): boolean | number => {
  if (typeof navigator === "undefined") return false;

  const userAgent =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase(),
    ) ||
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

  return isMobile;
};

/**
 * Get all registered biometric credentials from localStorage
 */
export const getStoredCredentials = (): string[] => {
  try {
    const stored = localStorage.getItem("biometric_credentials");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving stored credentials:", error);
    return [];
  }
};

/**
 * Save biometric credentials to localStorage
 */
export const saveCredentials = (credentials: string[]): void => {
  try {
    localStorage.setItem("biometric_credentials", JSON.stringify(credentials));
  } catch (error) {
    console.error("Error saving credentials:", error);
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Handle WebAuthn errors with user-friendly messages
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";

  switch (error.name) {
    case "NotAllowedError":
      return "Biometric authentication was cancelled or not recognized. Please try again.";
    case "InvalidStateError":
      return "This device is already registered. Try a different credential.";
    case "TimeoutError":
      return "Biometric authentication timed out. Please try again.";
    case "NotSupportedError":
      return "Biometric authentication is not supported on this device.";
    case "AbortError":
      return "Biometric authentication was aborted.";
    case "SecurityError":
      return "Security error: Biometric authentication is not allowed in this context.";
    case "NetworkError":
      return "Network error. Please check your connection.";
    default:
      return error.message || "Biometric authentication failed.";
  }
};

/**
 * Generate a random challenge for WebAuthn
 */
export const generateChallenge = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(32));
};

/**
 * Get biometric type available on device (if any)
 */
export const getBiometricType = async (): Promise<string | null> => {
  if (!isMobileDevice()) return null;

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    // iOS devices support Face ID or Touch ID
    if (/os 1[1-9]|os 2[0-9]/.test(userAgent)) {
      return "Face ID"; // iOS 11+
    }
    return "Touch ID"; // Earlier iOS versions
  }

  if (/android/.test(userAgent)) {
    return "Android Biometric";
  }

  return "Biometric";
};
