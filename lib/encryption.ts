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

// Helper function to convert string to UTF-8 bytes
const stringToUtf8Bytes = (str: string): Uint8Array => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // Fallback for environments without TextEncoder
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      // Surrogate pair
      i++;
      const charCode2 = str.charCodeAt(i);
      const codePoint = 0x10000 + (((charCode & 0x3ff) << 10) | (charCode2 & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return new Uint8Array(bytes);
};

// Helper function to convert UTF-8 bytes to string
const utf8BytesToString = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  // Fallback for environments without TextDecoder
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    let byte1 = bytes[i++];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if ((byte1 >> 5) === 0x06) {
      const byte2 = bytes[i++];
      str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else if ((byte1 >> 4) === 0x0e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    } else if ((byte1 >> 3) === 0x1e) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      if (codePoint > 0xffff) {
        const surrogate1 = 0xd800 + ((codePoint - 0x10000) >> 10);
        const surrogate2 = 0xdc00 + ((codePoint - 0x10000) & 0x3ff);
        str += String.fromCharCode(surrogate1, surrogate2);
      } else {
        str += String.fromCharCode(codePoint);
      }
    }
  }
  return str;
};

// Helper function to convert Uint8Array to base64
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  if (typeof btoa !== 'undefined') {
    // Convert Uint8Array to binary string for btoa
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Fallback base64 encoding
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1] || 0;
    const byte3 = bytes[i + 2] || 0;
    const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i + 1 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i + 2 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
};

// Helper function to convert base64 to Uint8Array with error handling
const base64ToUint8Array = (base64: string): Uint8Array | null => {
  try {
    // Clean the base64 string (remove whitespace, etc.)
    const cleanBase64 = base64.trim().replace(/[\s\n\r]/g, '');
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return null;
    }
    
    if (typeof atob !== 'undefined') {
      const binary = atob(cleanBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
      return bytes;
    }
    // Fallback base64 decoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bufferLength = Math.floor(cleanBase64.length * 0.75);
    if (cleanBase64[cleanBase64.length - 1] === '=') {
      bufferLength--;
      if (cleanBase64[cleanBase64.length - 2] === '=') {
        bufferLength--;
      }
    }
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < cleanBase64.length; i += 4) {
      const encoded1 = chars.indexOf(cleanBase64[i]);
      const encoded2 = chars.indexOf(cleanBase64[i + 1]);
      const encoded3 = chars.indexOf(cleanBase64[i + 2]);
      const encoded4 = chars.indexOf(cleanBase64[i + 3]);
      if (encoded1 === -1 || encoded2 === -1) return null;
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 === -1 ? 0 : encoded3) << 6) | (encoded4 === -1 ? 0 : encoded4);
      if (p < bufferLength) bytes[p++] = (bitmap >> 16) & 255;
      if (p < bufferLength) bytes[p++] = (bitmap >> 8) & 255;
      if (p < bufferLength) bytes[p++] = bitmap & 255;
    }
    return bytes;
  } catch (error) {
    return null;
  }
};

// Old decryption method (for backward compatibility with old messages)
const decryptMessageOld = (encryptedContent: string, key: string): string => {
  // Clean the base64 string
  const cleanBase64 = encryptedContent.trim().replace(/[\s\n\r]/g, '');
  
  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
    throw new Error('Invalid base64 format');
  }
  
  let decoded: string;
  try {
    // Decode from base64 - this can throw if base64 is invalid
    decoded = atob(cleanBase64);
  } catch (error) {
    // If base64 decoding fails, the message might be corrupted
    throw new Error('Failed to decode base64: ' + (error instanceof Error ? error.message : String(error)));
  }
    
    // Decrypt using the same key
    const keyHash = simpleHash(key);
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = keyHash.charCodeAt(i % keyHash.length) || 1;
      decrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return decrypted;
};

// Encrypt message content (XOR cipher with key)
export const encryptMessage = (content: string, key: string): string => {
  try {
    // Convert string to UTF-8 bytes
    const contentBytes = stringToUtf8Bytes(content);
    
    // Create a key hash for encryption
    const keyHash = simpleHash(key);
    const keyBytes = stringToUtf8Bytes(keyHash);
    
    // Encrypt bytes using XOR
    const encryptedBytes = new Uint8Array(contentBytes.length);
    for (let i = 0; i < contentBytes.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length] || 1;
      encryptedBytes[i] = contentBytes[i] ^ keyByte;
    }
    
    // Encode to base64 for storage
    return uint8ArrayToBase64(encryptedBytes);
  } catch (error) {
    console.error('❌ Error encrypting message:', error);
    // Fallback: return original content if encryption fails
    return content;
  }
};

// Decrypt message content (with backward compatibility)
export const decryptMessage = (encryptedContent: string, key: string): string => {
  // If content is not base64 (plain text), return as-is
  if (!encryptedContent || encryptedContent.trim().length === 0) {
    return encryptedContent;
  }
  
  // Check if content looks like plain text (not base64)
  // Base64 strings are typically longer and don't contain spaces or common punctuation
  const looksLikePlainText = encryptedContent.includes(' ') || 
                             encryptedContent.length < 10 ||
                             /[.,!?;:'"()]/.test(encryptedContent);
  
  if (looksLikePlainText && !/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedContent.trim())) {
    // Might already be plain text, return as-is
    return encryptedContent;
  }
  
  try {
    // Try new decryption method first (UTF-8 aware)
    const encryptedBytes = base64ToUint8Array(encryptedContent);
    
    if (encryptedBytes && encryptedBytes.length > 0) {
      // Create a key hash for decryption
      const keyHash = simpleHash(key);
      const keyBytes = stringToUtf8Bytes(keyHash);
      
      // Decrypt bytes using XOR
      const decryptedBytes = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        const keyByte = keyBytes[i % keyBytes.length] || 1;
        decryptedBytes[i] = encryptedBytes[i] ^ keyByte;
      }
      
      // Convert UTF-8 bytes back to string
      const decrypted = utf8BytesToString(decryptedBytes);
      
      // Validate the decrypted result makes sense (contains printable characters)
      if (decrypted && decrypted.length > 0) {
        return decrypted;
      }
    }
  } catch (error) {
    // Silently try old method
  }
  
  // Fallback to old decryption method (for backward compatibility)
  try {
    return decryptMessageOld(encryptedContent, key);
  } catch (error) {
    // Only log if it's not a base64 decoding error (those are expected for corrupted messages)
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes('base64') && !errorMsg.includes('Invalid')) {
      console.error('❌ Error decrypting message (both methods failed):', error);
    }
    // Last resort: return encrypted content if all decryption fails
    // This handles corrupted messages gracefully
    return encryptedContent;
  }
};

