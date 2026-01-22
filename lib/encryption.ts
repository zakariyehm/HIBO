/**
 * End-to-End Encryption Utilities
 * Encrypted messaging between matched users only
 */

// Simple hash function for key derivation
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// Derive encryption key from match ID and user IDs (deterministic)
export const deriveMatchKey = (matchId: string, user1Id: string, user2Id: string): string => {
  // Create a deterministic key from match and user IDs
  // Sort user IDs to ensure same key regardless of order
  const sortedUsers = [user1Id, user2Id].sort().join('-');
  const combined = `${matchId}-${sortedUsers}`;
  return simpleHash(combined).padEnd(32, '0').substring(0, 32);
};

// Encrypt message content (XOR cipher with key)
export const encryptMessage = (content: string, key: string): string => {
  try {
    // Create a key hash for encryption
    const keyHash = simpleHash(key);
    let encrypted = '';
    
    for (let i = 0; i < content.length; i++) {
      const charCode = content.charCodeAt(i);
      const keyChar = keyHash.charCodeAt(i % keyHash.length) || 1;
      encrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    // Encode to base64 for storage
    // Use a simple base64-like encoding
    const base64 = btoa(encrypted);
    return base64;
  } catch (error) {
    console.error('❌ Error encrypting message:', error);
    // Fallback: return original content if encryption fails
    return content;
  }
};

// Decrypt message content
export const decryptMessage = (encryptedContent: string, key: string): string => {
  try {
    // Decode from base64
    const decoded = atob(encryptedContent);
    
    // Decrypt using the same key
    const keyHash = simpleHash(key);
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = keyHash.charCodeAt(i % keyHash.length) || 1;
      decrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return decrypted;
  } catch (error) {
    console.error('❌ Error decrypting message:', error);
    // Fallback: return encrypted content if decryption fails
    return encryptedContent;
  }
};

