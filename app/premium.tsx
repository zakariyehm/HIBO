import { Colors } from '@/constants/theme';
import { getProductIdForPlan, purchaseSubscription, setOnPurchaseError, setOnPurchaseSuccess } from '@/lib/iap';
import { createSubscription, type PaymentMethod } from '@/lib/supabase';
import { waafiPreAuthorize, waafiPreAuthorizeCommit, waafiPreAuthorizeCancel } from '@/lib/waafipay';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type PlanType = 'monthly' | 'yearly';
type ScreenType = 'initial' | 'plan-selection' | 'payment';

// Initial View Component
const InitialView = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <View style={styles.initialViewContainer}>
      {/* Mascot/Icon - At Top */}
      <View style={styles.mascotContainer}>
        <View style={styles.mascot}>
          <Text style={styles.mascotLetter}>H</Text>
          <View style={styles.mascotEyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
        </View>
      </View>

      {/* Headline - Below Mascot */}
      <Text style={styles.headline}>
        Subscribers go on twice as many dates.
      </Text>
    </View>
  );
};

// Plan Selection View Component
const PlanSelectionView = ({
  selectedPlan,
  onSelectPlan,
  onStart,
}: {
  selectedPlan: PlanType;
  onSelectPlan: (p: PlanType) => void;
  onStart: () => void;
}) => {
  return (
    <>
      <Text style={styles.trialTitle}>
        Start your 3-day FREE trial to continue.
      </Text>

      {/* Features List */}
      <View style={styles.trialFeaturesList}>
        <View style={styles.trialFeatureItem}>
          <Ionicons name="flash" size={24} color={Colors.textDark} style={styles.trialFeatureIcon} />
          <View style={styles.trialFeatureContent}>
            <Text style={styles.trialFeatureTitle}>Skip the line</Text>
            <Text style={styles.trialFeatureDescription}>Get recommended sooner</Text>
          </View>
        </View>

        <View style={styles.trialFeatureItem}>
          <Ionicons name="star" size={24} color={Colors.textDark} style={styles.trialFeatureIcon} />
          <View style={styles.trialFeatureContent}>
            <Text style={styles.trialFeatureTitle}>Priority likes</Text>
            <Text style={styles.trialFeatureDescription}>Stay toward the top of their list</Text>
          </View>
        </View>

        <View style={styles.trialFeatureItem}>
          <Ionicons name="heart" size={24} color={Colors.textDark} style={styles.trialFeatureIcon} />
          <View style={styles.trialFeatureContent}>
            <Text style={styles.trialFeatureTitle}>Send unlimited likes</Text>
          </View>
        </View>

        <View style={styles.trialFeatureItem}>
          <Ionicons name="eye" size={24} color={Colors.textDark} style={styles.trialFeatureIcon} />
          <View style={styles.trialFeatureContent}>
            <Text style={styles.trialFeatureTitle}>See everyone who likes you</Text>
          </View>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            selectedPlan === 'monthly' && styles.selectedOption,
          ]}
          onPress={() => onSelectPlan('monthly')}
        >
          <Text
            style={[
              styles.optionTitle,
              selectedPlan === 'monthly' && styles.selectedText,
            ]}
          >
            Monthly
          </Text>
          <Text
            style={[
              styles.optionPrice,
              selectedPlan === 'monthly' && styles.selectedText,
            ]}
          >
            $0.01 /mo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            selectedPlan === 'yearly' && styles.selectedOption,
          ]}
          onPress={() => onSelectPlan('yearly')}
        >
          <Text
            style={[
              styles.optionTitle,
              selectedPlan === 'yearly' && styles.selectedText,
            ]}
          >
            Yearly
          </Text>
          <Text
            style={[
              styles.optionPrice,
              selectedPlan === 'yearly' && styles.selectedText,
            ]}
          >
            $0.10 /yr
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3 DAYS FREE</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.checkmarkText}>✓ No Payment Due Now</Text>

      <TouchableOpacity style={styles.ctaButton} onPress={onStart}>
        <Text style={styles.ctaButtonText}>Start My 3-Day Free Trial</Text>
      </TouchableOpacity>

      <Text style={styles.subscriptionInfo}>
        3 days free, then{' '}
        {selectedPlan === 'monthly' ? '$0.01 per month' : '$0.10 per year'}
      </Text>
    </>
  );
};

// Payment View Component – 3 methods: Hormuud, Apple Pay, Google Pay
const PaymentView = ({
  selectedPlan,
  paymentMethod,
  onPaymentMethodChange,
  phoneNumber,
  onPhoneChange,
  onSubscribe,
  onBack,
  isSubscribing,
}: {
  selectedPlan: PlanType;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  phoneNumber: string;
  onPhoneChange: (text: string) => void;
  onSubscribe: () => void;
  onBack: () => void;
  isSubscribing: boolean;
}) => {
  const planDetails: Record<PlanType, { name: string; price: string }> = {
    monthly: { name: 'HIBO Monthly Plan', price: '$0.01/month' },
    yearly: { name: 'HIBO Yearly Plan', price: '$0.10/year' },
  };

  const currentPlan = planDetails[selectedPlan];
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.paymentScrollView}
        contentContainerStyle={[styles.paymentScrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.paymentTitle}>{currentPlan.name}</Text>
        <Text style={styles.paymentPrice}>Starting today {currentPlan.price}</Text>

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
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('initial');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('hormuud');
  const [phoneNumber, setPhoneNumber] = useState('252');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinueToPlanSelection = async () => {
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsTransitioning(false);
    setCurrentScreen('plan-selection');
  };

  const handleStartTrial = async () => {
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsTransitioning(false);
    // Reset payment method if it doesn't apply on this platform (e.g. google_pay on iOS)
    setPaymentMethod((prev) => {
      if (Platform.OS === 'android' && prev === 'apple_pay') return 'hormuud';
      if (Platform.OS === 'ios' && prev === 'google_pay') return 'hormuud';
      return prev;
    });
    setCurrentScreen('payment');
  };

  const handleBack = async () => {
    if (currentScreen === 'payment') {
      setIsTransitioning(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsTransitioning(false);
      setCurrentScreen('plan-selection');
    } else if (currentScreen === 'plan-selection') {
      setIsTransitioning(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsTransitioning(false);
      setCurrentScreen('initial');
    } else {
      router.back();
    }
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

      const result = await purchaseSubscription(getProductIdForPlan(selectedPlan));

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

    // Hormuud: 3-step WaafiPay Preauthorization flow
    setIsSubscribing(true);
    let waafiTransactionId: string | null = null;

    try {
      // Calculate amount based on plan
      const amount = selectedPlan === 'monthly' ? 0.01 : 0.10;
      const currency = 'USD';
      const referenceId = `hibo-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // STEP 1: Preauthorize (Hold funds without charging)
      console.log('[HIBO] Step 1: Preauthorizing payment...');
      const preAuthResult = await waafiPreAuthorize({
        phoneNumber,
        amount,
        currency,
        description: `HIBO ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`,
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
        description: `HIBO ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
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
        planType: selectedPlan,
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
        `Payment successful! You have subscribed to the ${selectedPlan} plan. Transaction ID: ${waafiTransactionId}. Enjoy all premium features!`,
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          {currentScreen === 'payment' ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {currentScreen === 'initial' && (
          <View style={styles.contentContainer}>
            <InitialView onContinue={handleContinueToPlanSelection} />
          </View>
        )}

        {currentScreen === 'plan-selection' && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: Math.max(insets.bottom, 20) + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <PlanSelectionView
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              onStart={handleStartTrial}
            />
          </ScrollView>
        )}

        {currentScreen === 'payment' && (
          <View style={[styles.contentContainer, styles.paymentWrapper, { paddingTop: 4 }]}>
            <PaymentView
              selectedPlan={selectedPlan}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              phoneNumber={phoneNumber}
              onPhoneChange={handlePhoneChange}
              onSubscribe={handleSubscribe}
              onBack={handleBack}
              isSubscribing={isSubscribing}
            />
          </View>
        )}

        {/* Bottom Buttons - Fixed at bottom for initial screen */}
        {currentScreen === 'initial' && (
          <View style={[styles.bottomButtonsContainer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleContinueToPlanSelection}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>Check it out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.maybeLaterButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.maybeLaterText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay */}
        {isTransitioning && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.textDark} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 4,
    zIndex: 10,
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  paymentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  mainHeading: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 40,
    marginTop: 20,
    marginBottom: 40,
  },
  offerDetails: {
    marginBottom: 30,
  },
  checkmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmarkIcon: {
    color: Colors.green,
    fontWeight: '700',
    fontSize: 18,
  },
  checkmarkText: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: Colors.textDark,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  ctaButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: '700',
  },
  subscriptionInfo: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  trialTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 38,
    color: Colors.textDark,
  },
  timelineContainer: {
    marginBottom: 30,
    width: '100%',
    alignSelf: 'flex-start',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  timelineIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  timelineTextContainer: {
    flex: 1,
  },
  timelineHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  timelineSubHeader: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  timelineConnector: {
    width: 2,
    height: 25,
    backgroundColor: Colors.borderLight,
    marginLeft: 18,
    marginBottom: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
    gap: 10,
  },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  selectedOption: {
    borderColor: Colors.textDark,
    borderWidth: 2.5,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLight,
  },
  selectedText: {
    color: Colors.textDark,
  },
  optionPrice: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.textDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.cardBackground,
    fontSize: 10,
    fontWeight: '700',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '400',
  },
  initialViewContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  mascot: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mascotLetter: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.textDark,
    letterSpacing: -2,
  },
  mascotEyes: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    gap: 30,
  },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.textDark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  middleSection: {
    marginBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
    fontFamily: 'serif',
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  featureContent: {
    flex: 1,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  bottomSection: {
    marginTop: 20,
    gap: 16,
  },
  subscribeButton: {
    backgroundColor: Colors.textDark,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  subscribeButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: '600',
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '400',
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 25,
    paddingTop: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  trialFeaturesList: {
    marginBottom: 30,
    width: '100%',
    gap: 20,
  },
  trialFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  trialFeatureIcon: {
    marginTop: 2,
  },
  trialFeatureContent: {
    flex: 1,
  },
  trialFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  trialFeatureDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
});
