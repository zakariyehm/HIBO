/**
 * WaafiPay API Integration
 * Handles mobile wallet payments (Zaad, Sahal, Hormuud, etc.) in Somalia
 * 
 * Documentation: https://docs.waafipay.com/
 */

// WaafiPay API Configuration
// Note: Sandbox might need HTTPS, check WaafiPay docs
// Use environment variable if set, otherwise use __DEV__ to determine
const WAAFI_API_URL = process.env.EXPO_PUBLIC_WAAFI_API_URL 
  || (__DEV__
    ? 'https://sandbox.waafipay.net/asm' // Testing (try HTTPS first)
    : 'https://api.waafipay.com/asm'); // Production

// Get credentials from environment variables
const getWaafiCredentials = () => {
  const merchantUid = process.env.EXPO_PUBLIC_WAAFI_MERCHANT_UID || '';
  const apiUserId = process.env.EXPO_PUBLIC_WAAFI_API_USER_ID || '';
  const apiKey = process.env.EXPO_PUBLIC_WAAFI_API_KEY || '';

  if (!merchantUid || !apiUserId || !apiKey) {
    console.warn('⚠️ WaafiPay credentials not configured. Check .env file.');
  }

  return { merchantUid, apiUserId, apiKey };
};

/**
 * Generate unique reference ID (UUID format)
 */
const generateReferenceId = (): string => {
  return `hibo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Format timestamp for WaafiPay API
 */
const formatTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
};

/**
 * Process WaafiPay Purchase (direct payment)
 * 
 * @param phoneNumber - Mobile wallet phone number (e.g., "252611111111")
 * @param amount - Amount to charge (numeric, max 2 decimal places)
 * @param currency - Currency code (USD, SLSH, DJF)
 * @param description - Transaction description
 * @param referenceId - Optional reference ID (auto-generated if not provided)
 * 
 * @returns { data: { transactionId, referenceId, state }, error: null } on success
 * @returns { data: null, error: { message, code } } on failure
 */
export const processWaafiPayPurchase = async ({
  phoneNumber,
  amount,
  currency = 'USD',
  description = 'HIBO Premium Subscription',
  referenceId,
}: {
  phoneNumber: string;
  amount: number;
  currency?: 'USD' | 'SLSH' | 'DJF';
  description?: string;
  referenceId?: string;
}) => {
  try {
    const { merchantUid, apiUserId, apiKey } = getWaafiCredentials();

    if (!merchantUid || !apiUserId || !apiKey) {
      return {
        data: null,
        error: {
          message: 'WaafiPay credentials not configured. Please contact support.',
          code: 'WAAFI_CONFIG_ERROR',
        },
      };
    }

    // Validate phone number format (should be 252XXXXXXXXX)
    if (!phoneNumber.startsWith('252') || phoneNumber.length < 10) {
      return {
        data: null,
        error: {
          message: 'Invalid phone number format. Must start with 252 (e.g., 252611111111)',
          code: 'INVALID_PHONE',
        },
      };
    }

    // Format amount to 2 decimal places (WaafiPay requirement)
    const formattedAmount = Number(amount.toFixed(2));

    // Generate reference ID if not provided
    const refId = referenceId || generateReferenceId();

    // Generate UUID for requestId
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Prepare request payload
    const requestPayload = {
      schemaVersion: '1.0',
      requestId,
      timestamp: formatTimestamp(),
      channelName: 'WEB',
      serviceName: 'API_PURCHASE',
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        paymentMethod: 'MWALLET_ACCOUNT', // Mobile wallet (Zaad, Sahal, Hormuud)
        payerInfo: {
          accountNo: phoneNumber,
        },
        transactionInfo: {
          referenceId: refId,
          invoiceId: refId, // Same as referenceId
          amount: String(formattedAmount),
          currency,
          description,
        },
      },
    };

    console.log('📤 WaafiPay Purchase Request:', {
      url: WAAFI_API_URL,
      phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3'), // Mask phone
      amount: formattedAmount,
      currency,
      referenceId: refId,
      merchantUid,
      apiUserId,
    });
    
    // Log full request payload (without sensitive data in production)
    if (__DEV__) {
      console.log('📤 Full Request Payload:', JSON.stringify(requestPayload, null, 2));
    }

    // Make API request
    const response = await fetch(WAAFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    // Check response status and content type
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    // Log raw response for debugging
    console.log('📥 WaafiPay Raw Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200),
    });

    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ WaafiPay returned non-JSON response:', responseText.substring(0, 500));
      return {
        data: null,
        error: {
          message: `API returned invalid response (status: ${response.status}). Please check your credentials and API endpoint.`,
          code: 'INVALID_RESPONSE',
          status: response.status,
        },
      };
    }

    // Parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse WaafiPay response as JSON:', responseText.substring(0, 500));
      return {
        data: null,
        error: {
          message: 'Invalid response format from payment gateway. Please try again.',
          code: 'PARSE_ERROR',
        },
      };
    }

    console.log('📥 WaafiPay Response:', {
      responseCode: responseData.responseCode,
      responseMsg: responseData.responseMsg,
      state: responseData.params?.state,
      transactionId: responseData.params?.transactionId,
    });

    // Check response code
    if (responseData.responseCode === '2001' && responseData.params?.state === 'APPROVED') {
      // Success!
      return {
        data: {
          transactionId: responseData.params.transactionId,
          referenceId: responseData.params.referenceId || refId,
          issuerTransactionId: responseData.params.issuerTransactionId,
          state: responseData.params.state,
          amount: responseData.params.txAmount,
          merchantCharges: responseData.params.merchantCharges,
        },
        error: null,
      };
    }

    // Handle errors - check for specific error codes
    let errorMessage = responseData.responseMsg || 'Payment failed. Please try again.';
    const responseCode = responseData.responseCode;
    const errorCode = responseData.errorCode;

    // Handle specific error codes
    if (responseCode === '5038' || errorCode === 'E10214A') {
      errorMessage = 'Authorization failed. Please verify your WaafiPay credentials are correct and activated. Contact support@waafipay.com if the issue persists.';
    } else if (responseCode === '5301') {
      errorMessage = 'Invalid API key. Please check your WaafiPay credentials.';
    } else if (responseCode === '5302') {
      errorMessage = 'Invalid API token. Please check your WaafiPay credentials.';
    }

    return {
      data: null,
      error: {
        message: errorMessage,
        code: responseCode || 'WAAFI_ERROR',
        responseCode,
        errorCode,
      },
    };
  } catch (error: any) {
    console.error('❌ WaafiPay API Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      },
    };
  }
};

/**
 * Preauthorize WaafiPay Payment (Hold funds without charging)
 * Step 1 of 3-step payment process
 * 
 * @param phoneNumber - Mobile wallet phone number (e.g., "252611111111")
 * @param amount - Amount to hold (numeric, max 2 decimal places)
 * @param currency - Currency code (USD, SLSH, DJF)
 * @param description - Transaction description
 * @param referenceId - Optional reference ID (auto-generated if not provided)
 * 
 * @returns { data: { transactionId, referenceId, state }, error: null } on success
 * @returns { data: null, error: { message, code } } on failure
 */
export const waafiPreAuthorize = async ({
  phoneNumber,
  amount,
  currency = 'USD',
  description = 'HIBO Premium Subscription',
  referenceId,
}: {
  phoneNumber: string;
  amount: number;
  currency?: 'USD' | 'SLSH' | 'DJF';
  description?: string;
  referenceId?: string;
}) => {
  try {
    const { merchantUid, apiUserId, apiKey } = getWaafiCredentials();

    if (!merchantUid || !apiUserId || !apiKey) {
      return {
        data: null,
        error: {
          message: 'WaafiPay credentials not configured. Please contact support.',
          code: 'WAAFI_CONFIG_ERROR',
        },
      };
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('252') || phoneNumber.length < 10) {
      return {
        data: null,
        error: {
          message: 'Invalid phone number format. Must start with 252 (e.g., 252611111111)',
          code: 'INVALID_PHONE',
        },
      };
    }

    // Format amount to 2 decimal places
    const formattedAmount = Number(amount.toFixed(2));
    const refId = referenceId || generateReferenceId();
    const requestId = `preauth-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Log environment and credentials status (masked for security)
    const isSandbox = WAAFI_API_URL.includes('sandbox');
    console.log('🔐 WaafiPay Environment:', {
      environment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
      apiUrl: WAAFI_API_URL,
      merchantUid: merchantUid ? `${merchantUid.substring(0, 3)}***` : 'MISSING',
      apiUserId: apiUserId ? `${apiUserId.substring(0, 3)}***` : 'MISSING',
      hasApiKey: !!apiKey,
    });

    // Prepare request payload for PREAUTHORIZE
    const requestPayload = {
      schemaVersion: '1.0',
      requestId,
      timestamp: formatTimestamp(),
      channelName: 'WEB',
      serviceName: 'API_PREAUTHORIZE', // Preauthorize (not Purchase)
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        paymentMethod: 'MWALLET_ACCOUNT',
        payerInfo: {
          accountNo: phoneNumber,
        },
        transactionInfo: {
          referenceId: refId,
          invoiceId: refId,
          amount: String(formattedAmount),
          currency,
          description,
        },
      },
    };

    console.log('📤 WaafiPay Preauthorize Request:', {
      url: WAAFI_API_URL,
      phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3'),
      amount: formattedAmount,
      currency,
      referenceId: refId,
    });

    // Make API request
    const response = await fetch(WAAFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    console.log('📥 WaafiPay Preauthorize Raw Response:', {
      status: response.status,
      contentType,
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 200),
    });

    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ WaafiPay returned non-JSON response:', responseText.substring(0, 500));
      return {
        data: null,
        error: {
          message: `API returned invalid response (status: ${response.status}). Please check your credentials.`,
          code: 'INVALID_RESPONSE',
          status: response.status,
        },
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse WaafiPay response:', responseText.substring(0, 500));
      return {
        data: null,
        error: {
          message: 'Invalid response format from payment gateway.',
          code: 'PARSE_ERROR',
        },
      };
    }

    console.log('📥 WaafiPay Preauthorize Response:', {
      responseCode: responseData.responseCode,
      responseMsg: responseData.responseMsg,
      state: responseData.params?.state,
      transactionId: responseData.params?.transactionId,
    });

    // Check for success: responseCode === "2001" && state === "APPROVED"
    if (responseData.responseCode === '2001' && responseData.params?.state === 'APPROVED') {
      return {
        data: {
          transactionId: responseData.params.transactionId,
          referenceId: responseData.params.referenceId || refId,
          state: responseData.params.state,
        },
        error: null,
      };
    }

    // Handle errors
    let errorMessage = responseData.responseMsg || 'Preauthorization failed. Please try again.';
    const responseCode = responseData.responseCode;
    const errorCode = responseData.errorCode;

    if (responseCode === '5038' || errorCode === 'E10214A') {
      // Authorization error - credentials not activated or wrong environment
      const isSandbox = WAAFI_API_URL.includes('sandbox');
      errorMessage = `Authorization failed (${responseCode}/${errorCode}). ${
        isSandbox
          ? 'Please verify your WaafiPay sandbox credentials are correct and activated. Contact support@waafipay.com to activate your sandbox account.'
          : 'Please verify your WaafiPay production credentials are correct and activated. Contact support@waafipay.com if the issue persists.'
      }`;
      console.error('❌ WaafiPay Authorization Error:', {
        responseCode,
        errorCode,
        environment: isSandbox ? 'SANDBOX' : 'PRODUCTION',
        merchantUid: merchantUid ? `${merchantUid.substring(0, 3)}***` : 'MISSING',
        apiUserId: apiUserId ? `${apiUserId.substring(0, 3)}***` : 'MISSING',
        apiKey: apiKey ? `${apiKey.substring(0, 5)}***` : 'MISSING',
      });
    } else if (responseCode === '5206' || errorCode === 'E10205') {
      errorMessage = 'Insufficient balance. Please add funds to your mobile wallet and try again.';
    }

    return {
      data: null,
      error: {
        message: errorMessage,
        code: responseCode || 'WAAFI_ERROR',
        responseCode,
        errorCode,
      },
    };
  } catch (error: any) {
    console.error('❌ WaafiPay Preauthorize Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      },
    };
  }
};

/**
 * Commit WaafiPay Preauthorization (Charge the customer)
 * Step 2 of 3-step payment process
 * 
 * @param transactionId - Transaction ID from preauthorization
 * @param description - Optional description
 * 
 * @returns { data: { transactionId, state }, error: null } on success
 * @returns { data: null, error: { message, code } } on failure
 */
export const waafiPreAuthorizeCommit = async ({
  transactionId,
  description = 'Subscription payment committed',
}: {
  transactionId: string;
  description?: string;
}) => {
  try {
    const { merchantUid, apiUserId, apiKey } = getWaafiCredentials();

    if (!merchantUid || !apiUserId || !apiKey) {
      return {
        data: null,
        error: {
          message: 'WaafiPay credentials not configured.',
          code: 'WAAFI_CONFIG_ERROR',
        },
      };
    }

    const requestId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const requestPayload = {
      schemaVersion: '1.0',
      requestId,
      timestamp: formatTimestamp(),
      channelName: 'WEB',
      serviceName: 'API_PREAUTHORIZE_COMMIT', // Commit preauthorization
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        transactionId, // Use transaction ID from preauthorize
        description,
      },
    };

    console.log('📤 WaafiPay Commit Request:', {
      transactionId,
      description,
    });

    const response = await fetch(WAAFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ WaafiPay Commit returned non-JSON:', responseText.substring(0, 500));
      return {
        data: null,
        error: {
          message: 'Invalid response from payment gateway.',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      return {
        data: null,
        error: {
          message: 'Failed to parse response.',
          code: 'PARSE_ERROR',
        },
      };
    }

    console.log('📥 WaafiPay Commit Response:', {
      responseCode: responseData.responseCode,
      responseMsg: responseData.responseMsg,
      state: responseData.params?.state,
    });

    // Success: responseCode === "2001" && state === "APPROVED" (case-insensitive)
    const state = responseData.params?.state?.toUpperCase();
    if (responseData.responseCode === '2001' && state === 'APPROVED') {
      return {
        data: {
          transactionId: responseData.params.transactionId || transactionId,
          state: responseData.params.state,
        },
        error: null,
      };
    }

    // Handle errors
    const errorMessage = responseData.responseMsg || 'Failed to commit payment. Please try again.';

    return {
      data: null,
      error: {
        message: errorMessage,
        code: responseData.responseCode || 'WAAFI_ERROR',
        responseCode: responseData.responseCode,
        errorCode: responseData.errorCode,
      },
    };
  } catch (error: any) {
    console.error('❌ WaafiPay Commit Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error.',
        code: 'NETWORK_ERROR',
      },
    };
  }
};

/**
 * Cancel WaafiPay Preauthorization (Release held funds)
 * Step 3 (only if error occurs) - Releases funds back to customer
 * 
 * @param transactionId - Transaction ID from preauthorization
 * @param description - Optional cancellation reason
 * 
 * @returns { data: { transactionId, state }, error: null } on success
 * @returns { data: null, error: { message, code } } on failure
 */
export const waafiPreAuthorizeCancel = async ({
  transactionId,
  description = 'Cancelled',
}: {
  transactionId: string;
  description?: string;
}) => {
  try {
    const { merchantUid, apiUserId, apiKey } = getWaafiCredentials();

    if (!merchantUid || !apiUserId || !apiKey) {
      return {
        data: null,
        error: {
          message: 'WaafiPay credentials not configured.',
          code: 'WAAFI_CONFIG_ERROR',
        },
      };
    }

    const requestId = `cancel-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const requestPayload = {
      schemaVersion: '1.0',
      requestId,
      timestamp: formatTimestamp(),
      channelName: 'WEB',
      serviceName: 'API_PREAUTHORIZE_CANCEL', // Cancel preauthorization
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        transactionId, // Use transaction ID from preauthorize
        description,
      },
    };

    console.log('📤 WaafiPay Cancel Request:', {
      transactionId,
      description,
    });

    const response = await fetch(WAAFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const contentType = response.headers.get('content-type');
    const responseText = await response.text();

    if (!contentType || !contentType.includes('application/json')) {
      return {
        data: null,
        error: {
          message: 'Invalid response from payment gateway.',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      return {
        data: null,
        error: {
          message: 'Failed to parse response.',
          code: 'PARSE_ERROR',
        },
      };
    }

    console.log('📥 WaafiPay Cancel Response:', {
      responseCode: responseData.responseCode,
      responseMsg: responseData.responseMsg,
      state: responseData.params?.state,
    });

    // Success: responseCode === "2001" && state === "approved" (case-insensitive)
    const state = responseData.params?.state?.toUpperCase();
    if (responseData.responseCode === '2001' && (state === 'APPROVED' || state === 'CANCELLED')) {
      return {
        data: {
          transactionId: responseData.params.transactionId || transactionId,
          state: responseData.params.state,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: {
        message: responseData.responseMsg || 'Failed to cancel preauthorization.',
        code: responseData.responseCode || 'WAAFI_ERROR',
      },
    };
  } catch (error: any) {
    console.error('❌ WaafiPay Cancel Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error.',
        code: 'NETWORK_ERROR',
      },
    };
  }
};

/**
 * Reverse a WaafiPay Purchase (refund)
 * Must be done within 24 hours and before settlement
 * 
 * @param transactionId - Transaction ID from original purchase
 * @param description - Optional cancellation reason
 */
export const reverseWaafiPayPurchase = async ({
  transactionId,
  description = 'Cancelled',
}: {
  transactionId: string;
  description?: string;
}) => {
  try {
    const { merchantUid, apiUserId, apiKey } = getWaafiCredentials();

    if (!merchantUid || !apiUserId || !apiKey) {
      return {
        data: null,
        error: {
          message: 'WaafiPay credentials not configured.',
          code: 'WAAFI_CONFIG_ERROR',
        },
      };
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const requestPayload = {
      schemaVersion: '1.0',
      requestId,
      timestamp: formatTimestamp(),
      channelName: 'WEB',
      serviceName: 'API_REVERSAL',
      serviceParams: {
        merchantUid,
        apiUserId,
        apiKey,
        transactionId,
        description,
      },
    };

    const response = await fetch(WAAFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const responseData = await response.json();

    if (responseData.responseCode === '2001' && responseData.params?.state === 'approved') {
      return {
        data: {
          transactionId: responseData.params.transactionId,
          referenceId: responseData.params.referenceId,
          state: responseData.params.state,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: {
        message: responseData.responseMsg || 'Reversal failed',
        code: responseData.responseCode || 'WAAFI_ERROR',
      },
    };
  } catch (error: any) {
    console.error('❌ WaafiPay Reversal Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }
};
