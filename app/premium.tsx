import { Colors } from '@/constants/theme';
import { createSubscription, type PaymentMethod } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
            $9.99 /mo
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
            $99.99 /yr
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
        {selectedPlan === 'monthly' ? '$9.99 per month' : '$99.99 per year'}
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
    monthly: { name: 'HIBO Monthly Plan', price: '$9.99/month' },
    yearly: { name: 'HIBO Yearly Plan', price: '$99.99/year' },
  };

  const currentPlan = planDetails[selectedPlan];
  const isApplePayAvailable = Platform.OS === 'ios';
  const isGooglePayAvailable = Platform.OS === 'android';

  const payButtonLabel =
    paymentMethod === 'hormuud'
      ? 'Continue'
      : paymentMethod === 'apple_pay'
        ? 'Pay with Apple Pay'
        : 'Pay with Google Pay';

  return (
    <View style={styles.paymentViewContainer}>
      <Text style={styles.paymentTitle}>{currentPlan.name}</Text>
      <Text style={styles.paymentPrice}>Starting today {currentPlan.price}</Text>

      <View style={styles.paymentForm}>
        <Text style={styles.inputLabel}>Choose payment method</Text>

        {/* Hormuud */}
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

        {/* Apple Pay – iOS only */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'apple_pay' && styles.paymentOptionSelected,
            !isApplePayAvailable && styles.paymentOptionDisabled,
          ]}
          onPress={() => isApplePayAvailable && onPaymentMethodChange('apple_pay')}
          activeOpacity={0.8}
          disabled={!isApplePayAvailable}
        >
          <Ionicons name="logo-apple" size={24} color={paymentMethod === 'apple_pay' ? Colors.textDark : Colors.textLight} />
          <View style={styles.paymentOptionText}>
            <Text style={[styles.paymentOptionTitle, paymentMethod === 'apple_pay' && styles.paymentOptionTitleSelected]}>Apple Pay</Text>
            <Text style={styles.paymentOptionSub}>{isApplePayAvailable ? 'Pay with Face ID / Touch ID' : 'iOS only'}</Text>
          </View>
          {paymentMethod === 'apple_pay' && <Ionicons name="checkmark-circle" size={24} color={Colors.textDark} />}
        </TouchableOpacity>

        {/* Google Pay – Android only */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'google_pay' && styles.paymentOptionSelected,
            !isGooglePayAvailable && styles.paymentOptionDisabled,
          ]}
          onPress={() => isGooglePayAvailable && onPaymentMethodChange('google_pay')}
          activeOpacity={0.8}
          disabled={!isGooglePayAvailable}
        >
          <Ionicons name="logo-google" size={24} color={paymentMethod === 'google_pay' ? Colors.textDark : Colors.textLight} />
          <View style={styles.paymentOptionText}>
            <Text style={[styles.paymentOptionTitle, paymentMethod === 'google_pay' && styles.paymentOptionTitleSelected]}>Google Pay</Text>
            <Text style={styles.paymentOptionSub}>{isGooglePayAvailable ? 'Pay with Google' : 'Android only'}</Text>
          </View>
          {paymentMethod === 'google_pay' && <Ionicons name="checkmark-circle" size={24} color={Colors.textDark} />}
        </TouchableOpacity>

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
    </View>
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

  const handleSubscribe = async () => {
    if (paymentMethod === 'hormuud' && phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g., 25261xxxxxxx).');
      return;
    }

    setIsSubscribing(true);
    try {
      const { data, error } = await createSubscription({
        planType: selectedPlan,
        phoneNumber: paymentMethod === 'hormuud' ? phoneNumber : '',
        paymentMethod,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create subscription. Please try again.');
        setIsSubscribing(false);
        return;
      }

      Alert.alert(
        'Success!',
        `You have subscribed to the ${selectedPlan} plan! Enjoy all premium features.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error subscribing:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
          <View style={[styles.contentContainer, { paddingTop: 4 }]}>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    width: '100%',
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
