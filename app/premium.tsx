import { getPremiumPlanById } from '@/components/SnapchatStyleBottomSheet';
import { Colors } from '@/constants/theme';
import { getProductIdForPlan, purchaseSubscription, setOnPurchaseError, setOnPurchaseSuccess } from '@/lib/iap';
import { createSubscription, type PaymentMethod } from '@/lib/supabase';
import { waafiPreAuthorize, waafiPreAuthorizeCancel, waafiPreAuthorizeCommit } from '@/lib/waafipay';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Payment View – plan comes from bottom sheet (route params); 3 methods: Hormuud, Apple Pay, Google Pay
const PaymentView = ({
  planName,
  planPrice,
  paymentMethod,
  onPaymentMethodChange,
  phoneNumber,
  onPhoneChange,
  onSubscribe,
  onBack,
  isSubscribing,
  scrollRef,
  onPhoneInputFocus,
}: {
  planName: string;
  planPrice: string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  phoneNumber: string;
  onPhoneChange: (text: string) => void;
  onSubscribe: () => void;
  onBack: () => void;
  isSubscribing: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
  onPhoneInputFocus?: () => void;
}) => {
  const isApplePayAvailable = Platform.OS === 'ios';
  const isGooglePayAvailable = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  const payButtonLabel =
    paymentMethod === 'hormuud'
      ? 'Continue'
      : paymentMethod === 'apple_pay'
        ? 'Pay with Apple Pay'
        : 'Pay with Google Pay';

  return (
    <KeyboardAvoidingView
      style={styles.paymentViewContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 56}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.paymentScrollView}
        contentContainerStyle={[styles.paymentScrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 280 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.paymentTitle}>{planName}</Text>
        <Text style={styles.paymentPrice}>Starting today {planPrice}</Text>

        <View style={styles.paymentForm}>
          <Text style={styles.inputLabel}>Choose payment method</Text>

          {/* Hormuud – always */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'hormuud' && styles.paymentOptionSelected]}
            onPress={() => onPaymentMethodChange('hormuud')}
            activeOpacity={0.8}
          >
            <Ionicons name="phone-portrait" size={24} color={paymentMethod === 'hormuud' ? Colors.textDark : Colors.textLight} />
            <View style={styles.paymentOptionText}>
              <Text style={[styles.paymentOptionTitle, paymentMethod === 'hormuud' && styles.paymentOptionTitleSelected]}>Hormuud</Text>
              <Text style={styles.paymentOptionSub}>Mobile money</Text>
            </View>
            {paymentMethod === 'hormuud' && <Ionicons name="checkmark-circle" size={24} color={Colors.textDark} />}
          </TouchableOpacity>

          {/* Apple Pay – iOS only (hidden on Android) */}
          {isApplePayAvailable && (
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'apple_pay' && styles.paymentOptionSelected]}
              onPress={() => onPaymentMethodChange('apple_pay')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={24} color={paymentMethod === 'apple_pay' ? Colors.textDark : Colors.textLight} />
              <View style={styles.paymentOptionText}>
                <Text style={[styles.paymentOptionTitle, paymentMethod === 'apple_pay' && styles.paymentOptionTitleSelected]}>Apple Pay</Text>
                <Text style={styles.paymentOptionSub}>Pay with Face ID / Touch ID</Text>
              </View>
              {paymentMethod === 'apple_pay' && <Ionicons name="checkmark-circle" size={24} color={Colors.textDark} />}
            </TouchableOpacity>
          )}

          {/* Google Pay – Android only (hidden on iOS) */}
          {isGooglePayAvailable && (
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'google_pay' && styles.paymentOptionSelected]}
              onPress={() => onPaymentMethodChange('google_pay')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={24} color={paymentMethod === 'google_pay' ? Colors.textDark : Colors.textLight} />
              <View style={styles.paymentOptionText}>
                <Text style={[styles.paymentOptionTitle, paymentMethod === 'google_pay' && styles.paymentOptionTitleSelected]}>Google Pay</Text>
                <Text style={styles.paymentOptionSub}>Pay with Google</Text>
              </View>
              {paymentMethod === 'google_pay' && <Ionicons name="checkmark-circle" size={24} color={Colors.textDark} />}
            </TouchableOpacity>
          )}

          {/* Phone input – only for Hormuud */}
          {paymentMethod === 'hormuud' && (
            <>
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Enter your phone number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>+252</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="61XXXXXX"
                  placeholderTextColor="#999"
                  value={phoneNumber.startsWith('252') ? phoneNumber.substring(3) : phoneNumber}
                  onChangeText={(text) => onPhoneChange('252' + text.replace(/\D/g, '').slice(0, 9))}
                  keyboardType="phone-pad"
                  maxLength={9}
                  autoFocus={false}
                  onFocus={onPhoneInputFocus}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.continueButton, isSubscribing && { opacity: 0.7 }]}
            onPress={onSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>{payButtonLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default function PremiumScreen() {
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const selectedPlanId = planParam === 'monthly' || planParam === 'yearly' ? planParam : 'yearly';
  const planConfig = getPremiumPlanById(selectedPlanId) ?? getPremiumPlanById('yearly')!;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('hormuud');
  const [phoneNumber, setPhoneNumber] = useState('252');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToPhoneInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 220, animated: true });
    }, 100);
  };

  const handlePhoneChange = (text: string) => {
    if (text.startsWith('252')) {
      setPhoneNumber(text);
    }
  };

  useEffect(() => {
    return () => {
      setOnPurchaseSuccess(null);
      setOnPurchaseError(null);
    };
  }, []);

  const handleSubscribe = async () => {
    if (paymentMethod === 'hormuud' && phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g., 25261xxxxxxx).');
      return;
    }

    // Apple Pay / Google Pay: real in-app purchase
    if (paymentMethod === 'apple_pay' || paymentMethod === 'google_pay') {
      setIsSubscribing(true);
      setOnPurchaseSuccess((plan) => {
        setOnPurchaseSuccess(null);
        setOnPurchaseError(null);
        setIsSubscribing(false);
        Alert.alert(
          'Success!',
          `You have subscribed to the ${plan} plan! Enjoy all premium features.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      });
      setOnPurchaseError((err) => {
        setOnPurchaseSuccess(null);
        setOnPurchaseError(null);
        setIsSubscribing(false);
        const isCancel = err?.code === 'E_USER_CANCELLED' || /cancel/i.test(String(err?.message ?? ''));
        if (!isCancel) {
          Alert.alert('Payment error', err?.message || 'Purchase failed. Please try again.');
        }
      });

      const result = await purchaseSubscription(getProductIdForPlan(selectedPlanId));

      if (result.error === 'Cancelled') {
        setOnPurchaseSuccess(null);
        setOnPurchaseError(null);
        setIsSubscribing(false);
        return;
      }
      if (result.error) {
        setOnPurchaseSuccess(null);
        setOnPurchaseError(null);
        setIsSubscribing(false);
        Alert.alert('Error', result.error);
        return;
      }
      return;
    }

    // Hormuud: 3-step WaafiPay Preauthorization flow (amount from SnapchatStyleBottomSheet config)
    setIsSubscribing(true);
    let waafiTransactionId: string | null = null;

    try {
      const amount = planConfig.amount;
      const currency = 'USD';
      const referenceId = `hibo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // STEP 1: Preauthorize (Hold funds without charging)
      console.log('[HIBO] Step 1: Preauthorizing payment...');
      const preAuthResult = await waafiPreAuthorize({
        phoneNumber,
        amount,
        currency,
        description: planConfig.name,
        referenceId,
      });

      if (preAuthResult.error || !preAuthResult.data) {
        // Preauthorization failed - don't create subscription
        const errorMessage =
          preAuthResult.error?.message ||
          'Payment authorization failed. Please check your phone number and balance, then try again.';
        Alert.alert('Payment Failed', errorMessage);
        setIsSubscribing(false);
        return;
      }

      waafiTransactionId = preAuthResult.data.transactionId;
      console.log('[HIBO] ✅ Preauthorization successful, transaction ID:', waafiTransactionId);

      // STEP 2: Commit (Charge the customer)
      console.log('[HIBO] Step 2: Committing transaction...');
      if (!waafiTransactionId) {
        throw new Error('Transaction ID is missing');
      }

      const commitResult = await waafiPreAuthorizeCommit({
        transactionId: waafiTransactionId,
        description: planConfig.name,
      });

      if (commitResult.error || !commitResult.data) {
        // Commit failed - try to cancel the preauthorization
        console.log('[HIBO] ❌ Commit failed, attempting to cancel...');
        try {
          if (waafiTransactionId) {
            await waafiPreAuthorizeCancel({
              transactionId: waafiTransactionId,
              description: 'Subscription commit failed',
            });
            console.log('[HIBO] ✅ Transaction cancelled');
          }
        } catch (cancelError) {
          console.error('[HIBO] Failed to cancel after commit error:', cancelError);
        }

        const commitErrorMessage =
          commitResult.error?.message ||
          'Failed to process your payment. Please try again.';
        Alert.alert('Payment Failed', commitErrorMessage);
        setIsSubscribing(false);
        return;
      }

      console.log('[HIBO] ✅ Transaction committed successfully');

      // STEP 3: Create subscription in database (only after successful payment)
      console.log('[HIBO] Step 3: Creating subscription...');
      const { data, error } = await createSubscription({
        planType: selectedPlanId,
        phoneNumber,
        paymentMethod: 'hormuud',
      });

      if (error) {
        // Subscription creation failed - payment was successful but subscription failed
        // Note: Payment already charged, user should contact support
        Alert.alert(
          'Error',
          'Payment was successful but subscription creation failed. Please contact support with transaction ID: ' +
            waafiTransactionId
        );
        setIsSubscribing(false);
        return;
      }

      // STEP 4: All steps successful!
      console.log('[HIBO] ✅ Subscription created successfully');
      
      // Refresh subscription status immediately (no need to reload app)
      // This ensures screens will see the updated premium status when they check
      console.log('[HIBO] Refreshing subscription status...');
      
      Alert.alert(
        'Success!',
        `Payment successful! You have subscribed to the ${selectedPlanId} plan. Transaction ID: ${waafiTransactionId}. Enjoy all premium features!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back - screens will automatically refresh subscription status via useFocusEffect
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[HIBO] ❌ Subscription error:', error);

      // If we have a transaction ID, try to cancel it
      if (waafiTransactionId) {
        try {
          console.log('[HIBO] Attempting to cancel transaction:', waafiTransactionId);
          await waafiPreAuthorizeCancel({
            transactionId: waafiTransactionId,
            description: 'Subscription error - cancelling',
          });
          console.log('[HIBO] ✅ Transaction cancelled');
        } catch (cancelError) {
          console.error('[HIBO] Failed to cancel transaction:', cancelError);
        }
      }

      Alert.alert('Payment Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.contentContainer, styles.paymentWrapper]}>
        <PaymentView
          planName={planConfig.name}
          planPrice={planConfig.price}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          phoneNumber={phoneNumber}
          onPhoneChange={handlePhoneChange}
          onSubscribe={handleSubscribe}
          onBack={() => router.back()}
          isSubscribing={isSubscribing}
          scrollRef={scrollRef}
          onPhoneInputFocus={scrollToPhoneInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  paymentWrapper: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentViewContainer: {
    flex: 1,
    width: '100%',
  },
  paymentScrollView: {
    flex: 1,
  },
  paymentScrollContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 4,
  },
  paymentTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 0,
  },
  paymentPrice: {
    fontSize: 18,
    color: Colors.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  paymentForm: {
    width: '100%',
    alignItems: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  paymentOptionSelected: {
    borderColor: Colors.textDark,
    borderWidth: 2,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLight,
  },
  paymentOptionTitleSelected: {
    color: Colors.textDark,
  },
  paymentOptionSub: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    width: '100%',
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  countryCode: {
    fontSize: 18,
    color: Colors.textDark,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: Colors.textDark,
    backgroundColor: Colors.background,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  continueButton: {
    backgroundColor: Colors.textDark,
    paddingVertical: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 56,
  },
  continueButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
});
