/**
 * In-App Purchases: Apple App Store & Google Play
 * Real subscriptions via react-native-iap.
 *
 * Prerequisites:
 * - Development build (no Expo Go). Run: npx expo prebuild && npx expo run:ios / run:android
 * - Create subscription products in App Store Connect (iOS) and Google Play Console (Android)
 *    with IDs: hibo_monthly, hibo_yearly
 */

import { Platform } from 'react-native';
import {
  endConnection,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
  getSubscriptions as getSubscriptionsFromStore,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  type ProductPurchase,
  type PurchaseError,
  type SubscriptionPurchase,
} from 'react-native-iap';

import { createSubscriptionFromIAP } from './supabase';

// Product IDs – must match App Store Connect & Google Play Console
export const IAP_PRODUCT_MONTHLY = 'hibo_monthly';
export const IAP_PRODUCT_YEARLY = 'hibo_yearly';

export const IAP_PRODUCT_IDS = [IAP_PRODUCT_MONTHLY, IAP_PRODUCT_YEARLY] as const;
export type IAPProductId = (typeof IAP_PRODUCT_IDS)[number];

export function getProductIdForPlan(plan: 'monthly' | 'yearly'): IAPProductId {
  return plan === 'monthly' ? IAP_PRODUCT_MONTHLY : IAP_PRODUCT_YEARLY;
}

export function getPlanFromProductId(productId: string): 'monthly' | 'yearly' {
  return productId === IAP_PRODUCT_YEARLY ? 'yearly' : 'monthly';
}

let purchaseUpdateSubscription: { remove: () => void } | null = null;
let purchaseErrorSub: { remove: () => void } | null = null;
let isIapReady = false;
let iapInitError: string | null = null;
let onPurchaseSuccess: ((plan: 'monthly' | 'yearly') => void) | null = null;
let onPurchaseError: ((err: PurchaseError) => void) | null = null;

const IAP_NOT_READY_MSG =
  'Apple Pay / Google Pay ma diyaar yihiin. Isticmaal development build (Expo Go IAP ma taageero):\n\n' +
  '  npx expo run:android   (Android)\n' +
  '  npx expo run:ios       (iOS)\n\n' +
  'Emulator-ka Android waa inuu leeyahay Google Play.';

export function setOnPurchaseSuccess(fn: ((plan: 'monthly' | 'yearly') => void) | null) {
  onPurchaseSuccess = fn;
}
export function setOnPurchaseError(fn: ((err: PurchaseError) => void) | null) {
  onPurchaseError = fn;
}

async function handlePurchaseSuccess(purchase: SubscriptionPurchase | ProductPurchase) {
  const plan = getPlanFromProductId(purchase.productId);
  const paymentMethod = Platform.OS === 'ios' ? 'apple_pay' : 'google_pay';

  const p = purchase as any;
  const iapData = {
    transactionId: String(p.transactionId || ''),
    transactionReceipt: p.transactionReceipt,
    purchaseToken: p.purchaseToken,
  };

  const { error } = await createSubscriptionFromIAP({
    planType: plan,
    paymentMethod,
    ...iapData,
  });

  if (error) {
    console.warn('IAP: createSubscriptionFromIAP failed', error);
    onPurchaseError?.({ code: 'E_UNKNOWN', message: error.message } as PurchaseError);
    return;
  }

  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch (e) {
    console.warn('IAP: finishTransaction error', e);
  }
  onPurchaseSuccess?.(plan);
}

/**
 * Initialize IAP and start listening for purchase events.
 * Call once at app launch (e.g. in _layout).
 */
export async function initIAP() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  try {
    await initConnection();

    if (Platform.OS === 'android') {
      await flushFailedPurchasesCachedAsPendingAndroid().catch(() => {});
    }

    purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: SubscriptionPurchase | ProductPurchase) => {
      await handlePurchaseSuccess(purchase);
    });

    purchaseErrorSub = purchaseErrorListener((err: PurchaseError) => {
      console.warn('IAP purchaseErrorListener', err?.code, err?.message);
      onPurchaseError?.(err);
    });

    isIapReady = true;
    iapInitError = null;
  } catch (e: any) {
    const msg = e?.message || String(e);
    iapInitError = msg;
    console.warn('IAP initConnection error', e);
  }
}

export function getIapInitError(): string | null {
  return iapInitError;
}

/**
 * Stop IAP and remove listeners. Call on app teardown if needed.
 */
export async function closeIAP() {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSub) {
    purchaseErrorSub.remove();
    purchaseErrorSub = null;
  }
  try {
    await endConnection();
  } catch (_) {}
  isIapReady = false;
}

export function isIAPReady() {
  return isIapReady;
}

/**
 * Fetch available subscription products from the store.
 */
export async function getSubscriptions(skus: string[]) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return [];
  try {
    const list = await getSubscriptionsFromStore({ skus });
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('IAP getSubscriptions error', e);
    return [];
  }
}

/**
 * Request a subscription purchase. The native pay sheet opens.
 * Result is delivered via purchaseUpdatedListener (handled in initIAP).
 *
 * Android: must call getSubscriptions first to get offerToken, then requestSubscription({ subscriptionOffers }).
 * iOS: requestSubscription({ sku }).
 */
function isIapUnavailableError(msg: string): boolean {
  const s = msg.toLowerCase();
  return (
    s.includes('not available') ||
    s.includes('unavailable') ||
    s.includes('google play services') ||
    s.includes('billing is unavailable') ||
    s.includes('e_not_prepared') ||
    s.includes('e_iap_not_available') ||
    s.includes('not a registered') ||
    s.includes('module')
  );
}

export async function purchaseSubscription(productId: IAPProductId): Promise<{ error?: string }> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { error: IAP_NOT_READY_MSG };
  }

  if (!isIapReady) {
    return { error: IAP_NOT_READY_MSG };
  }

  try {
    if (Platform.OS === 'android') {
      // Google Play: subscriptionOffers with offerToken are required. Fetch product first.
      const subs = await getSubscriptionsFromStore({ skus: [productId] });
      const sub = Array.isArray(subs) ? subs[0] : null;
      const offerToken =
        sub &&
        typeof sub === 'object' &&
        (sub as any).subscriptionOfferDetails?.[0]?.offerToken;
      if (!offerToken) {
        return {
          error: 'Product not found. Add hibo_monthly and hibo_yearly in Google Play Console and try again.',
        };
      }
      await requestSubscription({
        subscriptionOffers: [{ sku: productId, offerToken }],
      });
    } else {
      // iOS: sku only
      await requestSubscription({ sku: productId });
    }
    return {};
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes('E_USER_CANCELLED') || msg.includes('User cancelled')) {
      return { error: 'Cancelled' };
    }
    if (isIapUnavailableError(msg)) {
      return { error: IAP_NOT_READY_MSG };
    }
    return { error: msg };
  }
}
