/**
 * Personal Info / Onboarding Screen - HIBO Dating App
 * Multi-step onboarding flow for user profile setup
 */

import { Colors } from '@/constants/theme';
import {
    createUserProfile,
    signUpWithEmail,
    uploadDocument,
    uploadPhotos
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width } = Dimensions.get('window');

// Simple responsive sizing helpers based on device width
const isSmallWidth = width < 360;
const titleFontSize = isSmallWidth ? 20 : width < 400 ? 22 : 24;
const optionFontSize = isSmallWidth ? 14 : 16;
const inputFontSize = isSmallWidth ? 24 : width < 400 ? 28 : 32;
const verticalGapAfterTitle = isSmallWidth ? 16 : 20;

// Countries list for nationality selection
const COUNTRIES = [
  'Afghan', 'Albanian', 'Algerian', 'Argentine', 'Australian', 'Austrian',
  'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Burundian',
  'Canadian', 'Chinese', 'Colombian', 'Croatian', 'Czech',
  'Danish', 'Dutch',
  'Egyptian', 'Ethiopian',
  'Finnish', 'French',
  'German', 'Greek',
  'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian',
  'Japanese', 'Jordanian',
  'Kenyan', 'Korean', 'Kuwaiti',
  'Lebanese', 'Libyan',
  'Malaysian', 'Mexican', 'Moroccan',
  'Nepalese', 'Nigerian', 'Norwegian',
  'Pakistani', 'Palestinian', 'Philippine', 'Polish', 'Portuguese',
  'Qatari',
  'Romanian', 'Russian',
  'Saudi', 'Singaporean', 'Somali', 'South African', 'Spanish', 'Sudanese', 'Swedish', 'Swiss', 'Syrian',
  'Tanzanian', 'Thai', 'Tunisian', 'Turkish',
  'Ugandan', 'Ukrainian', 'Emirati', 'American',
  'Venezuelan', 'Vietnamese',
  'Yemeni',
  'Zimbabwean'
].sort();

// Professions list
const PROFESSIONS = [
  'Accountant', 'Acting Professional', 'Actor', 'Actuary', 'Administration Employee', 
  'Administration Professional', 'Advertising Professional', 'Air Hostess', 'Alim',
  'Architect', 'Artist', 'Athlete', 'Attorney', 'Baker', 'Banker', 'Barber',
  'Biologist', 'Business Analyst', 'Business Owner', 'Carpenter', 'Chef', 'Chemist',
  'Civil Engineer', 'Coach', 'Consultant', 'Counselor', 'Dentist', 'Designer',
  'Developer', 'Doctor', 'Driver', 'Economist', 'Editor', 'Electrician', 'Engineer',
  'Entrepreneur', 'Farmer', 'Financial Advisor', 'Firefighter', 'Fitness Trainer',
  'Flight Attendant', 'Graphic Designer', 'Hairdresser', 'HR Professional',
  'Interior Designer', 'Journalist', 'Judge', 'Lawyer', 'Lecturer', 'Manager',
  'Marketing Professional', 'Mechanic', 'Medical Professional', 'Musician',
  'Nurse', 'Nutritionist', 'Pharmacist', 'Photographer', 'Physician', 'Pilot',
  'Plumber', 'Police Officer', 'Professor', 'Psychologist', 'Real Estate Agent',
  'Researcher', 'Sales Professional', 'Scientist', 'Social Worker', 'Software Engineer',
  'Student', 'Teacher', 'Therapist', 'Translator', 'Veterinarian', 'Writer'
].sort();

// Personality traits with emojis
const PERSONALITY_TRAITS = [
  { trait: 'Active Listener', emoji: '👂' },
  { trait: 'Adventurous', emoji: '🤠' },
  { trait: 'Affectionate', emoji: '🥰' },
  { trait: 'Ambitious', emoji: '🎯' },
  { trait: 'Animal lover', emoji: '😻' },
  { trait: 'Assertive', emoji: '💪' },
  { trait: 'Bookworm', emoji: '🐛' },
  { trait: 'Brunch Lover', emoji: '🍳' },
  { trait: 'Carefree', emoji: '😊' },
  { trait: 'Charismatic', emoji: '🤩' },
  { trait: 'Cheerful', emoji: '😁' },
  { trait: 'Competitive', emoji: '💪' },
  { trait: 'Confident', emoji: '✋' },
  { trait: 'Conservative', emoji: '☁️' },
  { trait: 'Creative', emoji: '🎨' },
  { trait: 'Cultural', emoji: '🏛️' },
  { trait: 'Empathetic', emoji: '💖' },
  { trait: 'ENFJ', emoji: '🧠' },
  { trait: 'ENFP', emoji: '🧠' },
  { trait: 'ENTJ', emoji: '🧠' },
  { trait: 'ENTP', emoji: '🧠' },
  { trait: 'Entrepreneurial', emoji: '🚶' },
  { trait: 'Funny', emoji: '😄' },
  { trait: 'Generous', emoji: '🤲' },
  { trait: 'Honest', emoji: '💎' },
  { trait: 'Independent', emoji: '🦅' },
  { trait: 'Intellectual', emoji: '🧠' },
  { trait: 'Kind', emoji: '💝' },
  { trait: 'Laid-back', emoji: '🌴' },
  { trait: 'Optimistic', emoji: '☀️' },
  { trait: 'Passionate', emoji: '🔥' },
  { trait: 'Patient', emoji: '⏳' },
  { trait: 'Romantic', emoji: '💕' },
  { trait: 'Spontaneous', emoji: '✨' },
  { trait: 'Thoughtful', emoji: '🤔' },
  { trait: 'Witty', emoji: '😏' },
];

// Return emoji for option groups
const getOptionEmoji = (key: string, option: string): string | undefined => {
  if (key === 'lookingFor') {
    switch (option) {
      case 'Serious relationship':
        return '💍';
      case 'Casual dating':
        return '☕';
      case 'Friendship':
        return '👫';
      case 'Something casual':
        return '🎯';
      default:
        return undefined;
    }
  }
  if (key === 'interests') {
    switch (option) {
      case 'Travel':
        return '✈️';
      case 'Music':
        return '🎵';
      case 'Fitness':
        return '💪';
      case 'Food':
        return '🍕';
      case 'Movies':
        return '🎬';
      case 'Sports':
        return '⚽';
      default:
        return undefined;
    }
  }
  if (key === 'personality') {
    const trait = PERSONALITY_TRAITS.find(t => t.trait === option);
    return trait?.emoji;
  }
  return undefined;
};

// Color Palette for consistency
const theme = {
  primary: Colors.background,
  secondary: Colors.cardBackground,
  white: '#FFFFFF',
  black: Colors.textDark,
  lightText: Colors.textLight,
  placeholder: 'rgba(0, 0, 0, 0.4)',
  gray: Colors.textLight,
  lightGray: Colors.borderLight,
  error: Colors.red,
  buttonInactive: Colors.borderLight,
  buttonActive: Colors.primary,
};

// Validation functions
const validateFirstName = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'First name is required' };
  }
  if (value.trim().length < 2) {
    return { isValid: false, error: 'First name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
    return { isValid: false, error: 'Only alphabetic characters are allowed' };
  }
  return { isValid: true, error: '' };
};

const validateAge = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Age is required' };
  }
  const numValue = parseInt(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Age must be a number' };
  }
  if (numValue < 18 || numValue > 100) {
    return { isValid: false, error: 'Age must be between 18 and 100' };
  }
  return { isValid: true, error: '' };
};

const validateLocation = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Location is required' };
  }
  if (value.trim().length < 2) {
    return { isValid: false, error: 'Location must be at least 2 characters' };
  }
  return { isValid: true, error: '' };
};

const validateLastName = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Last name is required' };
  }
  if (value.trim().length < 2) {
    return { isValid: false, error: 'Last name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
    return { isValid: false, error: 'Only alphabetic characters are allowed' };
  }
  return { isValid: true, error: '' };
};

const validateHeight = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Height is required' };
  }
  const numValue = parseInt(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Height must be a number' };
  }
  if (numValue < 100 || numValue > 250) {
    return { isValid: false, error: 'Height must be between 100 and 250 cm' };
  }
  return { isValid: true, error: '' };
};

const validateNationalIdNumber = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'National ID number is required' };
  }
  // Remove any spaces or dashes
  const cleanedValue = value.replace(/\s|-/g, '');
  // Check if it's exactly 11 digits
  if (!/^\d{11}$/.test(cleanedValue)) {
    if (cleanedValue.length < 11) {
      return { isValid: false, error: 'National ID must be exactly 11 digits' };
    } else if (cleanedValue.length > 11) {
      return { isValid: false, error: 'National ID must be exactly 11 digits' };
    } else {
      return { isValid: false, error: 'National ID must contain only numbers' };
    }
  }
  return { isValid: true, error: '' };
};

const validatePhoneNumber = (phone: string, countryCode: string): { isValid: boolean; error: string } => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  // Remove any spaces, dashes, or parentheses
  const cleanedPhone = phone.replace(/\s|-|\(|\)/g, '');
  // Check if it contains only digits
  if (!/^\d+$/.test(cleanedPhone)) {
    return { isValid: false, error: 'Phone number must contain only numbers' };
  }
  // Check minimum length (at least 7 digits)
  if (cleanedPhone.length < 7) {
    return { isValid: false, error: 'Phone number is too short' };
  }
  // Check maximum length (max 15 digits including country code)
  if (cleanedPhone.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }
  return { isValid: true, error: '' };
};

const validateEmail = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: '' };
};

const validatePassword = (value: string): { isValid: boolean; error: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Password is required' };
  }
  if (value.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (value.length > 50) {
    return { isValid: false, error: 'Password is too long' };
  }
  return { isValid: true, error: '' };
};

const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [currentValue, setCurrentValue] = useState('');
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [professionSearch, setProfessionSearch] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Base questions
  const baseQuestions = [
    { key: 'firstName', title: "What's your first name?", type: 'input', keyboard: 'default' as const, placeholder: 'John' },
    { key: 'lastName', title: "What's your last name?", type: 'input', keyboard: 'default' as const, placeholder: 'Doe' },
    { key: 'phoneNumber', title: "What's your phone number?", type: 'phoneInput' },
    { key: 'age', title: 'How old are you?', type: 'input', keyboard: 'numeric' as const, placeholder: '25' },
    { key: 'height', title: 'What\'s your height (cm)?', type: 'input', keyboard: 'numeric' as const, placeholder: '175' },
    { key: 'location', title: 'Where are you located?', type: 'input', keyboard: 'default' as const, placeholder: 'New York' },
    { key: 'profession', title: "What's your profession?", type: 'professionSelect' },
    { key: 'educationLevel', title: "What's your education level?", type: 'select', options: ['High school', 'Non-degree qualification', 'Undergraduate degree', 'Postgraduate degree', 'Doctorate', 'Other education level'] },
    { key: 'nationality', title: "What's your nationality?", type: 'nationalitySelect', maxSelections: 1 },
    { key: 'growUp', title: 'Where did you grow up?', type: 'input', keyboard: 'default' as const, placeholder: 'City, Country' },
    { key: 'smoke', title: 'Do you smoke?', type: 'select', options: ['Yes', 'No'] },
    { key: 'hasChildren', title: 'Do you have children?', type: 'select', options: ['Yes', 'No'] },
    { key: 'gender', title: 'What is your gender?', type: 'select', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'] },
    { key: 'interestedIn', title: 'Who are you interested in?', type: 'select', options: ['Women', 'Men', 'Everyone'] },
    { key: 'lookingFor', title: 'What are you looking for?', type: 'select', options: ['Serious relationship', 'Casual dating', 'Friendship', 'Something casual'] },
    { key: 'personality', title: "How would you describe your personality?", type: 'personalitySelect', maxSelections: 5, subtitle: 'Select up to 5 traits to show off your personality!' },
    { key: 'marriageIntentions', title: "What are your intentions for marriage?", type: 'marriageIntentions', 
      section1: { title: "I'd like to know someone on HIBO for", options: ['1-2 months', '3-4 months', '4-12 months', '1-2 years'] },
      section2: { title: "I'd like to be married within", options: ['1-2 months', '3-4 months', '4-12 months', '1-2 years', '3-4 years', '4+ years', 'Agree together'] }
    },
    { key: 'interests', title: 'What are your interests? (Select all that apply)', type: 'multiSelect', options: ['Travel', 'Music', 'Fitness', 'Food', 'Movies', 'Sports', 'Art', 'Reading', 'Gaming', 'Outdoor activities'] },
    { key: 'photos', title: 'Upload 3 photos', type: 'imageUpload', required: 3 },
    { key: 'source', title: 'How did you hear about HIBO?', type: 'select', options: ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Friend', 'Other'] },
    { key: 'documentType', title: 'What document do you have?', type: 'select', options: ['Passport', 'Driver License', 'National ID'] },
  ];

  // Get dynamic questions based on selected document type
  const dynamicQuestions = useMemo(() => {
    const documentType = onboardingData.documentType;
    const questions: any[] = [];
    
    if (documentType === 'Passport') {
      questions.push({ key: 'passport', title: 'Upload your passport', type: 'documentUpload', documentType: 'passport' });
    } else if (documentType === 'Driver License') {
      questions.push({ key: 'driverLicense', title: 'Upload driver license', type: 'documentUploadDouble', documentType: 'driverLicense', frontKey: 'driverLicenseFront', backKey: 'driverLicenseBack' });
    } else if (documentType === 'National ID') {
      questions.push({ key: 'nationalityId', title: 'Upload Nationality ID', type: 'documentUploadDouble', documentType: 'nationalityId', frontKey: 'nationalityIdFront', backKey: 'nationalityIdBack' });
      questions.push({ key: 'nationalIdNumber', title: 'Enter your National ID number', type: 'input', keyboard: 'numeric', placeholder: '12345678901' });
    }
    
    return questions;
  }, [onboardingData.documentType]);

  // Combine base questions with dynamic questions
  const questions = useMemo(() => [
    ...baseQuestions,
    ...dynamicQuestions,
    { key: 'bio', title: 'Tell us about yourself', type: 'input', keyboard: 'default' as const, placeholder: 'Write a short bio...' },
  ], [dynamicQuestions]);

  // Request image picker permissions
  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to upload images.');
        return false;
      }
    }
    return true;
  };

  // Request camera permissions
  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your camera to take photos.');
        return false;
      }
    }
    return true;
  };

  // Handle image picker
  const handlePickImage = async () => {
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentPhotos = onboardingData.photos || [];
        if (currentPhotos.length < 3) {
          const imageUri = result.assets[0].uri;
          if (imageUri) {
            setOnboardingData({
              ...onboardingData,
              photos: [...currentPhotos, imageUri]
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || 'Failed to pick image. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle document picker with camera or gallery option
  const handlePickDocument = async (documentType: string) => {
    Alert.alert(
      'Select Source',
      'Choose how you want to upload the document',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const hasPermission = await requestCameraPermissions();
            if (!hasPermission) return;
            
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                if (imageUri) {
                  setOnboardingData({
                    ...onboardingData,
                    [documentType]: imageUri
                  });
                }
              }
            } catch (error: any) {
              console.error('Camera error:', error);
              const errorMessage = error?.message || 'Failed to take photo. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const hasPermission = await requestImagePermissions();
            if (!hasPermission) return;
            
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
                selectionLimit: 1,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                if (imageUri) {
                  setOnboardingData({
                    ...onboardingData,
                    [documentType]: imageUri
                  });
                }
              }
            } catch (error: any) {
              console.error('Image picker error:', error);
              const errorMessage = error?.message || 'Failed to pick image. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const currentPhotos = onboardingData.photos || [];
    setOnboardingData({
      ...onboardingData,
      photos: currentPhotos.filter((_: any, i: number) => i !== index)
    });
  };

  // Remove document
  const handleRemoveDocument = (documentType: string) => {
    setOnboardingData({
      ...onboardingData,
      [documentType]: null
    });
  };

  // Validation function based on current step
  const validateCurrentInput = (value: string): boolean => {
    const currentQuestion = questions[step];
    let validationResult;

    switch (currentQuestion.key) {
      case 'firstName':
        validationResult = validateFirstName(value);
        break;
      case 'lastName':
        validationResult = validateLastName(value);
        break;
      case 'age':
        validationResult = validateAge(value);
        break;
      case 'height':
        validationResult = validateHeight(value);
        break;
      case 'location':
        validationResult = validateLocation(value);
        break;
      case 'bio':
        if (!value.trim()) {
          validationResult = { isValid: false, error: 'Bio is required' };
        } else if (value.trim().length < 10) {
          validationResult = { isValid: false, error: 'Bio must be at least 10 characters' };
        } else {
          validationResult = { isValid: true, error: '' };
        }
        break;
      case 'nationalIdNumber':
        validationResult = validateNationalIdNumber(value);
        break;
      case 'phoneNumber':
        validationResult = validatePhoneNumber(phoneNumber, countryCode);
        break;
      default:
        return true;
    }

    setValidationErrors(prev => ({
      ...prev,
      [currentQuestion.key]: validationResult.error
    }));

    return validationResult.isValid;
  };

  // Handle input change with real-time validation
  const handleInputChange = (value: string) => {
    setCurrentValue(value);
    
    // Clear error when user starts typing
    if (value.trim() === '') {
      setValidationErrors(prev => ({
        ...prev,
        [questions[step].key]: ''
      }));
    } else {
      // Validate in real-time
      validateCurrentInput(value);
    }
  };

  const proceedToNextStep = () => {
    const currentQuestion = questions[step];
    // Validate multiSelect has minimum 3 selections
    if (currentQuestion.type === 'multiSelect') {
      const selections = onboardingData[currentQuestion.key] || [];
      if (selections.length < 3) {
        return; // Don't proceed if less than 3 selections
      }
    }
    // Validate nationalitySelect has exactly 1 selection
    if (currentQuestion.type === 'nationalitySelect') {
      const selections = onboardingData[currentQuestion.key] || [];
      if (selections.length !== 1) {
        Alert.alert('Required', 'Please select your nationality');
        return;
      }
    }
    // Validate image upload has required number of photos
    if (currentQuestion.type === 'imageUpload') {
      const photos = onboardingData.photos || [];
      if (photos.length < (currentQuestion.required || 3)) {
        Alert.alert('Required', `Please upload ${currentQuestion.required || 3} photos`);
        return;
      }
    }
    // Validate document upload
    if (currentQuestion.type === 'documentUpload') {
      const document = onboardingData[currentQuestion.key];
      if (!document) {
        Alert.alert('Required', 'Please upload the required document');
        return;
      }
    }
    // Validate double document upload (front and back)
    if (currentQuestion.type === 'documentUploadDouble') {
      const frontDocument = onboardingData[currentQuestion.frontKey];
      const backDocument = onboardingData[currentQuestion.backKey];
      if (!frontDocument || !backDocument) {
        Alert.alert('Required', 'Please upload both front and back of the document');
        return;
      }
    }
    
    if (step === questions.length - 1) {
      // Last step - show create account screen
      setShowCreateAccount(true);
    } else {
      setStep(step + 1);
      setCurrentValue('');
      setValidationErrors({});
    }
  };

  const handleCreateProfile = async () => {
    if (!email.trim() || !password.trim()) {
      setAccountError('Please enter email and password');
      return;
    }

    // Validate email and password
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      setAccountError(emailValidation.error);
      return;
    }

    if (!passwordValidation.isValid) {
      setAccountError(passwordValidation.error);
      return;
    }

    setAccountError('');
    setAccountLoading(true);
    
    try {
      // Step 1: Sign up user with Supabase Auth
      const { data: authData, error: authError } = await signUpWithEmail(email.trim(), password);
      
      if (authError) {
        console.error('Auth error:', authError);
        setAccountError(authError.message || 'Failed to create account. Please try again.');
        setAccountLoading(false);
        return;
      }

      if (!authData.user) {
        setAccountError('Failed to create account. Please try again.');
        setAccountLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Wait for session to be fully established
      console.log('✅ Account created! Waiting for session...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Upload photos to Supabase Storage
      // Validate photos before upload
      if (!onboardingData.photos || onboardingData.photos.length < 3) {
        console.error('❌ Need at least 3 photos');
        Alert.alert('Photos Required', 'Please add at least 3 photos to continue.');
        setLoading(false);
        return;
      }
      
      // Upload photos to Supabase Storage
      console.log('📸 Uploading', onboardingData.photos.length, 'photos...');
      
      const { data: photoData, error: photoError } = await uploadPhotos(userId, onboardingData.photos);
      
      if (photoError) {
        console.error('❌ Photo upload error:', photoError);
        Alert.alert(
          'Photo Upload Failed',
          'Failed to upload your photos. Please check your connection and try again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
              }
            },
            {
              text: 'Retry',
              onPress: () => {
                handleCreateProfile();
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      if (!photoData || photoData.length === 0) {
        console.error('❌ No photo URLs returned');
        Alert.alert('Upload Error', 'Failed to get photo URLs. Please try again.');
        setLoading(false);
        return;
      }
      
      const uploadedPhotoUrls = photoData as string[];
      console.log('✅ Photos uploaded successfully!', uploadedPhotoUrls.length, 'photos');
      console.log('📸 Photo URLs:', uploadedPhotoUrls);

      // Step 3: Upload documents to Supabase Storage
      let documentUrls: Record<string, string> = {};
      console.log('📄 Uploading documents...');
      
      if (onboardingData.passport) {
        const { data: passportData, error: passportError } = await uploadDocument(userId, onboardingData.passport, `passport_${Date.now()}.jpg`);
        if (passportError) {
          console.error('❌ Passport upload error:', passportError);
        } else if (passportData?.publicUrl) {
          documentUrls.passport = passportData.publicUrl;
          console.log('✅ Passport uploaded');
        }
      }
      
      if (onboardingData.driverLicenseFront) {
        const { data: dlFrontData, error: dlFrontError } = await uploadDocument(userId, onboardingData.driverLicenseFront, `dl_front_${Date.now()}.jpg`);
        if (dlFrontError) {
          console.error('❌ Driver license front upload error:', dlFrontError);
        } else if (dlFrontData?.publicUrl) {
          documentUrls.driver_license_front = dlFrontData.publicUrl;
          console.log('✅ Driver license front uploaded');
        }
      }
      
      if (onboardingData.driverLicenseBack) {
        const { data: dlBackData, error: dlBackError } = await uploadDocument(userId, onboardingData.driverLicenseBack, `dl_back_${Date.now()}.jpg`);
        if (dlBackError) {
          console.error('❌ Driver license back upload error:', dlBackError);
        } else if (dlBackData?.publicUrl) {
          documentUrls.driver_license_back = dlBackData.publicUrl;
          console.log('✅ Driver license back uploaded');
        }
      }
      
      if (onboardingData.nationalityIdFront) {
        const { data: nidFrontData, error: nidFrontError } = await uploadDocument(userId, onboardingData.nationalityIdFront, `nid_front_${Date.now()}.jpg`);
        if (nidFrontError) {
          console.error('❌ Nationality ID front upload error:', nidFrontError);
        } else if (nidFrontData?.publicUrl) {
          documentUrls.nationality_id_front = nidFrontData.publicUrl;
          console.log('✅ Nationality ID front uploaded');
        }
      }
      
      if (onboardingData.nationalityIdBack) {
        const { data: nidBackData, error: nidBackError } = await uploadDocument(userId, onboardingData.nationalityIdBack, `nid_back_${Date.now()}.jpg`);
        if (nidBackError) {
          console.error('❌ Nationality ID back upload error:', nidBackError);
        } else if (nidBackData?.publicUrl) {
          documentUrls.nationality_id_back = nidBackData.publicUrl;
          console.log('✅ Nationality ID back uploaded');
        }
      }

      // Step 4: Prepare profile data
      const profileData = {
        email: email.trim(),
        first_name: onboardingData.firstName || '',
        last_name: onboardingData.lastName || '',
        phone_number: onboardingData.phoneNumber || '',
        age: parseInt(onboardingData.age) || 18,
        height: parseInt(onboardingData.height) || 170,
        location: onboardingData.location || '',
        profession: onboardingData.profession || '',
        education_level: onboardingData.educationLevel || '',
        nationality: onboardingData.nationality || [],
        grow_up: onboardingData.growUp || '',
        smoke: onboardingData.smoke || '',
        has_children: onboardingData.hasChildren || '',
        gender: onboardingData.gender || '',
        interested_in: onboardingData.interestedIn || '',
        looking_for: onboardingData.lookingFor || '',
        personality: onboardingData.personality || [],
        marriage_know_time: onboardingData.marriageIntentions_know || '',
        marriage_married_time: onboardingData.marriageIntentions_married || '',
        interests: onboardingData.interests || [],
        photos: uploadedPhotoUrls,
        source: onboardingData.source || '',
        document_type: onboardingData.documentType || '',
        ...documentUrls,
        national_id_number: onboardingData.nationalIdNumber || null,
        bio: onboardingData.bio || '',
      };

      // Step 5: Create user profile in database
      const { data: profileResult, error: profileError } = await createUserProfile(userId, profileData);
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        setAccountError('Account created but failed to save profile. Please contact support.');
        setAccountLoading(false);
        return;
      }

      // Success!
      console.log('🎉 Profile creation complete! Navigating to home...');
      setAccountLoading(false);
      setProfileCreated(true);
      
      // Navigate to home immediately
      console.log('🚀 Attempting navigation to home screen...');
        router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      setAccountError(error.message || 'An unexpected error occurred. Please try again.');
      setAccountLoading(false);
    }
  };

  const handleNextInput = () => {
    const currentQuestion = questions[step];
    
    // Handle phone number separately
    if (currentQuestion.type === 'phoneInput') {
      const validationResult = validatePhoneNumber(phoneNumber, countryCode);
      if (!validationResult.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          [currentQuestion.key]: validationResult.error
        }));
        return;
      }
      // Save phone number with country code
      setOnboardingData({ 
        ...onboardingData, 
        [currentQuestion.key]: `${countryCode}${phoneNumber.trim()}` 
      });
      setPhoneNumber('');
      setCountryCode('+1');
      setValidationErrors(prev => ({
        ...prev,
        [currentQuestion.key]: ''
      }));
      proceedToNextStep();
      return;
    }
    
    if (currentValue.trim() === '') return;
    
    const isValid = validateCurrentInput(currentValue);
    
    if (!isValid) return;
    
    // Save value as user typed it (no automatic capitalization)
    setOnboardingData({ ...onboardingData, [currentQuestion.key]: currentValue.trim() });
    setCurrentValue('');
    setValidationErrors(prev => ({
      ...prev,
      [currentQuestion.key]: ''
    }));
    proceedToNextStep();
  };
  
  const handleSelectOption = (key: string, option: string, section?: string) => {
    if (questions[step].type === 'marriageIntentions') {
      // Handle marriage intentions - store in separate keys
      setOnboardingData({ 
        ...onboardingData, 
        [key + '_' + section]: option 
      });
      return;
    }
    if (questions[step].type === 'multiSelect' || questions[step].type === 'nationalitySelect' || questions[step].type === 'personalitySelect') {
      // Handle multiple selections
      const currentSelections = onboardingData[key] || [];
      const maxSelections = questions[step].type === 'nationalitySelect' 
        ? 1
        : questions[step].type === 'personalitySelect'
        ? (questions[step].maxSelections || 5)
        : Infinity;
      
      let newSelections;
      if (currentSelections.includes(option)) {
        // Remove if already selected
        newSelections = currentSelections.filter((item: string) => item !== option);
      } else {
        // For nationalitySelect, replace the selection (only 1 allowed)
        if (questions[step].type === 'nationalitySelect') {
          newSelections = [option];
        } else if (currentSelections.length < maxSelections) {
          // Add if not selected and under max limit
          newSelections = [...currentSelections, option];
        } else {
          // Replace oldest selection if at max
          newSelections = [...currentSelections.slice(1), option];
        }
      }
      
      setOnboardingData({ ...onboardingData, [key]: newSelections });
    } else {
      // Single selection
      setOnboardingData({ ...onboardingData, [key]: option });
      // Auto-proceed after selection (for source, it will show email/password next if social media)
        setTimeout(proceedToNextStep, 200);
    }
  };

  const handleBack = () => {
    if (showCreateAccount) {
      // Go back from create account screen to last question
      setShowCreateAccount(false);
      setEmail('');
      setPassword('');
      setAccountError('');
      return;
    }
    if (step > 0) {
      setCurrentValue('');
      const prevKey = questions[step - 1].key;
      // Clear previous answer to allow re-selection
      setOnboardingData(prevData => {
        const newData = { ...prevData };
        delete newData[prevKey];
        return newData;
      });
      setStep(step - 1);
      setValidationErrors({});
    }
  };

  // Check if current input is valid
  const isCurrentInputValid = () => {
    const currentQuestion = questions[step];
    if (currentQuestion.type === 'phoneInput') {
      return validatePhoneNumber(phoneNumber, countryCode).isValid;
    }
    if (currentQuestion.type === 'select' || currentQuestion.type === 'multiSelect' || currentQuestion.type === 'nationalitySelect' || currentQuestion.type === 'personalitySelect' || currentQuestion.type === 'marriageIntentions' || currentQuestion.type === 'professionSelect') {
      if (currentQuestion.type === 'marriageIntentions') {
        const knowSomeone = onboardingData[currentQuestion.key + '_know'] || '';
        const marriedWithin = onboardingData[currentQuestion.key + '_married'] || '';
        return !!(knowSomeone && marriedWithin);
      }
      if (currentQuestion.type === 'professionSelect') {
        return !!onboardingData[currentQuestion.key];
      }
      if (currentQuestion.type === 'multiSelect') {
        const selections = onboardingData[currentQuestion.key] || [];
        // Require minimum 3 selections for interests
        return selections.length >= 3;
      }
      if (currentQuestion.type === 'nationalitySelect') {
        const selections = onboardingData[currentQuestion.key] || [];
        // Require exactly 1 selection
        return selections.length === 1;
      }
      if (currentQuestion.type === 'personalitySelect') {
        const selections = onboardingData[currentQuestion.key] || [];
        // Optional selection, max 5
        return selections.length <= (currentQuestion.maxSelections || 5);
      }
      return true;
    }
    
    if (currentQuestion.type === 'imageUpload') {
      const photos = onboardingData.photos || [];
      return photos.length >= (currentQuestion.required || 3);
    }
    
    if (currentQuestion.type === 'documentUpload') {
      return !!onboardingData[currentQuestion.key];
    }
    
    if (currentQuestion.type === 'documentUploadDouble') {
      const frontDocument = onboardingData[currentQuestion.frontKey];
      const backDocument = onboardingData[currentQuestion.backKey];
      return !!(frontDocument && backDocument);
    }
    
    if (currentValue.trim() === '') return false;
    
    switch (currentQuestion.key) {
      case 'firstName':
        return validateFirstName(currentValue).isValid;
      case 'lastName':
        return validateLastName(currentValue).isValid;
      case 'age':
        return validateAge(currentValue).isValid;
      case 'height':
        return validateHeight(currentValue).isValid;
      case 'location':
        return validateLocation(currentValue).isValid;
      case 'bio':
        return currentValue.trim().length >= 10;
      case 'nationalIdNumber':
        return validateNationalIdNumber(currentValue).isValid;
      default:
        return true;
    }
  };

  const renderContent = () => {
    if (accountLoading) {
      return (
        <View style={styles.centeredResult}>
          <ActivityIndicator size="large" color={theme.black} />
          <Text style={styles.loadingText}>Creating your account...</Text>
        </View>
      );
    }

    if (profileCreated) {
      return (
        <View style={styles.centeredResult}>
          <View style={styles.completionMessage}>
            <View style={styles.checkmarkIcon}>
              <Text style={styles.checkmarkSymbol}>✓</Text>
            </View>
            <Text style={styles.allDoneText}>Welcome to HIBO!</Text>
          </View>
          <Text style={styles.successSubtext}>Your profile has been created successfully</Text>
        </View>
      );
    }

    if (showCreateAccount) {
      return (
        <ScrollView 
          contentContainerStyle={[styles.createAccountContainer, { paddingTop: Math.max(24, insets.top + 8), paddingBottom: Math.max(40, insets.bottom + 20) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.createAccountTitleContainer}>
            <TouchableOpacity 
              style={styles.createAccountBackButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color={theme.black} />
            </TouchableOpacity>
            <Text style={styles.createAccountTitle}>Create an account</Text>
          </View>
          <View style={{ width: '100%', marginBottom: 16 }}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.modalInput, { width: '100%' }]}
              placeholder="Enter your email"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (text.trim() === '') {
                  setAccountError('');
                } else {
                  const validationResult = validateEmail(text);
                  if (!validationResult.isValid) {
                    setAccountError(validationResult.error);
                  } else {
                    setAccountError('');
                  }
                }
              }}
            />
          </View>
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.modalInput, { width: '100%', paddingRight: 50 }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (text.trim() === '') {
                    setAccountError('');
                  } else {
                    const validationResult = validatePassword(text);
                    if (!validationResult.isValid) {
                      setAccountError(validationResult.error);
                    } else {
                      setAccountError('');
                    }
                  }
                }}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={theme.gray} 
                />
              </TouchableOpacity>
            </View>
          </View>
          {!!accountError && (
            <Text style={styles.accountErrorText}>{accountError}</Text>
          )}
          <TouchableOpacity 
            style={[
              styles.finalContinueButton, 
              (accountLoading || !email.trim() || !password.trim() || !!accountError) && styles.continueButtonInactive
            ]} 
            onPress={handleCreateProfile}
            disabled={accountLoading || !email.trim() || !password.trim() || !!accountError}
          >
            {accountLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.white} style={{ marginRight: 8 }} />
                <Text style={styles.finalContinueText}>Creating...</Text>
              </View>
            ) : (
              <Text style={(accountLoading || !email.trim() || !password.trim() || !!accountError) ? [styles.finalContinueText, { color: theme.gray }] : styles.finalContinueText}>Create account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      );
    }
    
    const currentQuestion = questions[step];
    const currentError = validationErrors[currentQuestion.key];
    const isMultiSelect = currentQuestion.type === 'multiSelect';
    const currentSelections = isMultiSelect ? (onboardingData[currentQuestion.key] || []) : [];
    
    return (
      <View style={styles.onboardingContent}>
        <Text style={styles.questionText}>{currentQuestion.title}</Text>
        {currentQuestion.type === 'nationalitySelect' ? (
          <View style={styles.nationalityContainer}>
            <Text style={styles.nationalitySubtitle}>Please select your nationality.</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for nationalities"
                placeholderTextColor={theme.placeholder}
                value={nationalitySearch}
                onChangeText={setNationalitySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView 
              style={[styles.scrollContainer, { marginBottom: 0 }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {nationalitySearch.trim() && (
                <View style={styles.suggestedSection}>
                  <Text style={styles.sectionTitle}>Suggested</Text>
                  {COUNTRIES.filter(country => 
                    country.toLowerCase().includes(nationalitySearch.toLowerCase())
                  ).slice(0, 1).map(country => {
                    const isSelected = (onboardingData[currentQuestion.key] || []).includes(country);
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.nationalityOption, isSelected && styles.selectedNationalityOption]}
                        onPress={() => handleSelectOption(currentQuestion.key, country)}
                      >
                        <Text style={[styles.nationalityText, isSelected && styles.selectedNationalityText]}>
                          {country}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color={theme.white} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={styles.allSection}>
                <Text style={styles.sectionTitle}>All</Text>
                {COUNTRIES.filter(country => 
                  nationalitySearch.trim() === '' || country.toLowerCase().includes(nationalitySearch.toLowerCase())
                ).map(country => {
                  const isSelected = (onboardingData[currentQuestion.key] || []).includes(country);
                  return (
                    <TouchableOpacity
                      key={country}
                      style={[styles.nationalityOption, isSelected && styles.selectedNationalityOption]}
                      onPress={() => handleSelectOption(currentQuestion.key, country)}
                    >
                      <Text style={[styles.nationalityText, isSelected && styles.selectedNationalityText]}>
                        {country}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={theme.white} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : currentQuestion.type === 'professionSelect' ? (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search jobs"
                placeholderTextColor={theme.placeholder}
                value={professionSearch}
                onChangeText={setProfessionSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView 
              style={[styles.scrollContainer, { marginBottom: 0 }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {PROFESSIONS.filter(profession => 
                professionSearch.trim() === '' || profession.toLowerCase().includes(professionSearch.toLowerCase())
              ).map(profession => {
                const isSelected = onboardingData[currentQuestion.key] === profession;
                return (
                  <TouchableOpacity
                    key={profession}
                    style={[
                      styles.professionOption,
                      isSelected && styles.selectedProfessionOption
                    ]}
                    onPress={() => handleSelectOption(currentQuestion.key, profession)}
                  >
                    <Text style={[
                      styles.professionText,
                      isSelected && styles.selectedProfessionText
                    ]}>
                      {profession}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={theme.buttonActive} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        ) : currentQuestion.type === 'personalitySelect' ? (
          <View style={styles.personalityContainer}>
            {currentQuestion.subtitle && (
              <Text style={styles.personalitySubtitle}>{currentQuestion.subtitle}</Text>
            )}
            <ScrollView 
              style={[styles.scrollContainer, { marginBottom: 0 }]}
              contentContainerStyle={styles.personalityGrid}
              showsVerticalScrollIndicator={false}
            >
              {PERSONALITY_TRAITS.map(({ trait, emoji }) => {
                const isSelected = (onboardingData[currentQuestion.key] || []).includes(trait);
                return (
                  <TouchableOpacity
                    key={trait}
                    style={[
                      styles.personalityButton,
                      isSelected && styles.selectedPersonalityButton
                    ]}
                    onPress={() => handleSelectOption(currentQuestion.key, trait)}
                  >
                    <Text style={styles.personalityEmoji}>{emoji}</Text>
                    <Text style={[
                      styles.personalityText,
                      isSelected && styles.selectedPersonalityText
                    ]}>
                      {trait}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : currentQuestion.type === 'marriageIntentions' ? (
          <ScrollView 
            style={[styles.scrollContainer, { marginBottom: 0 }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: I'd like to know someone on HIBO for */}
            <View style={styles.marriageSection}>
              <Text style={styles.marriageSectionTitle}>{currentQuestion.section1.title}</Text>
              <View style={styles.marriageOptionsContainer}>
                {currentQuestion.section1.options?.map((opt: string) => {
                  const isSelected = onboardingData[currentQuestion.key + '_know'] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.marriageOption,
                        isSelected && styles.selectedMarriageOption
                      ]}
                      onPress={() => handleSelectOption(currentQuestion.key, opt, 'know')}
                    >
                      <Ionicons 
                        name="calendar-outline" 
                        size={18} 
                        color={isSelected ? theme.white : theme.gray} 
                        style={styles.marriageOptionIcon}
                      />
                      <Text style={[
                        styles.marriageOptionText,
                        isSelected && styles.selectedMarriageOptionText
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: I'd like to be married within */}
            <View style={styles.marriageSection}>
              <Text style={styles.marriageSectionTitle}>{currentQuestion.section2.title}</Text>
              <View style={styles.marriageOptionsContainer}>
                {currentQuestion.section2.options?.map((opt: string) => {
                  const isSelected = onboardingData[currentQuestion.key + '_married'] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.marriageOption,
                        isSelected && styles.selectedMarriageOption
                      ]}
                      onPress={() => handleSelectOption(currentQuestion.key, opt, 'married')}
                    >
                      <Ionicons 
                        name="heart-outline" 
                        size={18} 
                        color={isSelected ? theme.white : theme.gray} 
                        style={styles.marriageOptionIcon}
                      />
                      <Text style={[
                        styles.marriageOptionText,
                        isSelected && styles.selectedMarriageOptionText
                      ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : currentQuestion.type === 'select' || currentQuestion.type === 'multiSelect' ? (
          <ScrollView 
            style={[styles.scrollContainer, { marginBottom: 0 }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsContainer}>
              {currentQuestion.options?.map((opt: string) => {
                const isSelected = isMultiSelect 
                  ? currentSelections.includes(opt)
                  : onboardingData[currentQuestion.key] === opt;
                const emoji = getOptionEmoji(currentQuestion.key, opt);
                return (
                  <TouchableOpacity 
                    key={opt} 
                    style={[
                      styles.optionButton, 
                      isSelected && styles.selectedOptionButton
                    ]} 
                    onPress={() => handleSelectOption(currentQuestion.key, opt)}
                  >
                    <View style={styles.optionContent}>
                      {emoji && (
                        <Text style={[styles.optionEmoji, isSelected && styles.selectedOptionText]}>
                          {emoji}
                        </Text>
                      )}
                      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                        {opt}
                      </Text>
                      {isMultiSelect && isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.white} style={styles.checkIcon} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isMultiSelect && currentSelections.length > 0 && currentSelections.length < 3 && (
              <Text style={styles.minSelectionText}>
                Select at least 3 interests ({currentSelections.length}/3)
              </Text>
            )}
          </ScrollView>
        ) : currentQuestion.type === 'imageUpload' ? (
          <ScrollView 
            style={[styles.scrollContainer, { marginBottom: 0 }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadSubtitle}>
                Upload {currentQuestion.required || 3} photos ({onboardingData.photos?.length || 0}/{currentQuestion.required || 3})
              </Text>
              <View style={styles.photosGrid}>
                {Array.from({ length: currentQuestion.required || 3 }).map((_, index) => {
                  const photo = onboardingData.photos?.[index];
                  return (
                    <View key={index} style={styles.photoSlot}>
                      {photo ? (
                        <>
                          <Image source={{ uri: photo }} style={styles.photoPreview} />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color={theme.error} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={handlePickImage}
                        >
                          <Ionicons name="camera" size={32} color={theme.gray} />
                          <Text style={styles.uploadButtonText}>Add Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : currentQuestion.type === 'documentUpload' ? (
          <ScrollView 
            style={[styles.scrollContainer, { marginBottom: 0 }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadSubtitle}>
                {currentQuestion.title}
              </Text>
              {onboardingData[currentQuestion.key] ? (
                <View style={styles.documentPreview}>
                  <Ionicons name="document" size={48} color={theme.black} />
                  <Text style={styles.documentName}>Document uploaded</Text>
                  <TouchableOpacity
                    style={styles.removeDocumentButton}
                    onPress={() => handleRemoveDocument(currentQuestion.key)}
                  >
                    <Text style={styles.removeDocumentText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={() => handlePickDocument(currentQuestion.key)}
                  >
                    <Ionicons name="document-outline" size={48} color={theme.gray} />
                    <Text style={styles.documentUploadText}>Tap to upload document</Text>
                    <Text style={styles.documentUploadHint}>Camera or Gallery</Text>
                  </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : currentQuestion.type === 'documentUploadDouble' ? (
          <ScrollView 
            style={[styles.scrollContainer, { marginBottom: 0 }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.uploadContainer}>
              <Text style={styles.uploadSubtitle}>
                {currentQuestion.title} - Upload Front and Back
              </Text>
              
              {/* Front Upload */}
              <View style={styles.doubleDocumentSection}>
                <Text style={styles.documentSectionTitle}>Front</Text>
                {onboardingData[currentQuestion.frontKey] ? (
                  <View style={styles.documentPreview}>
                    <Ionicons name="document" size={48} color={theme.black} />
                    <Text style={styles.documentName}>Front uploaded</Text>
                    <TouchableOpacity
                      style={styles.removeDocumentButton}
                      onPress={() => handleRemoveDocument(currentQuestion.frontKey)}
                    >
                      <Text style={styles.removeDocumentText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={() => handlePickDocument(currentQuestion.frontKey)}
                  >
                    <Ionicons name="document-outline" size={48} color={theme.gray} />
                    <Text style={styles.documentUploadText}>Upload Front</Text>
                    <Text style={styles.documentUploadHint}>Camera or Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Back Upload */}
              <View style={styles.doubleDocumentSection}>
                <Text style={styles.documentSectionTitle}>Back</Text>
                {onboardingData[currentQuestion.backKey] ? (
                  <View style={styles.documentPreview}>
                    <Ionicons name="document" size={48} color={theme.black} />
                    <Text style={styles.documentName}>Back uploaded</Text>
                    <TouchableOpacity
                      style={styles.removeDocumentButton}
                      onPress={() => handleRemoveDocument(currentQuestion.backKey)}
                    >
                      <Text style={styles.removeDocumentText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.documentUploadButton}
                    onPress={() => handlePickDocument(currentQuestion.backKey)}
                  >
                    <Ionicons name="document-outline" size={48} color={theme.gray} />
                    <Text style={styles.documentUploadText}>Upload Back</Text>
                    <Text style={styles.documentUploadHint}>Camera or Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        ) : currentQuestion.type === 'phoneInput' ? (
          <>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  value={countryCode}
                  onChangeText={setCountryCode}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="+1"
                  placeholderTextColor={theme.placeholder}
                  maxLength={5}
                />
              </View>
              <TextInput
                style={[styles.phoneNumberInput, currentError && styles.textInputError]}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (text.trim() === '') {
                    setValidationErrors(prev => ({
                      ...prev,
                      [currentQuestion.key]: ''
                    }));
                  } else {
                    const validationResult = validatePhoneNumber(text, countryCode);
                    setValidationErrors(prev => ({
                      ...prev,
                      [currentQuestion.key]: validationResult.error
                    }));
                  }
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                selectionColor={theme.black}
                placeholder="1234567890"
                placeholderTextColor={theme.placeholder}
                maxLength={15}
              />
            </View>
            {currentError && (
              <Text style={styles.errorText}>{currentError}</Text>
            )}
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                isCurrentInputValid() ? styles.continueButtonActive : styles.continueButtonInactive
              ]} 
              onPress={handleNextInput} 
              disabled={!isCurrentInputValid()}
            >
              <Text style={isCurrentInputValid() ? styles.continueTextActive : styles.continueTextInactive}>
                continue
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[
                styles.textInput,
                currentQuestion.key === 'bio' && styles.bioInput,
                currentError && styles.textInputError
              ]}
              value={currentValue}
              onChangeText={handleInputChange}
              keyboardType={currentQuestion.keyboard}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
              selectionColor={theme.black}
              placeholder={currentQuestion.placeholder}
              placeholderTextColor={theme.placeholder}
              multiline={currentQuestion.key === 'bio'}
              numberOfLines={currentQuestion.key === 'bio' ? 4 : 1}
              textAlignVertical={currentQuestion.key === 'bio' ? 'top' : 'center'}
              spellCheck={false}
            />
            {currentError && (
              <Text style={styles.errorText}>{currentError}</Text>
            )}
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                isCurrentInputValid() ? styles.continueButtonActive : styles.continueButtonInactive
              ]} 
              onPress={handleNextInput} 
              disabled={!isCurrentInputValid()}
            >
              <Text style={isCurrentInputValid() ? styles.continueTextActive : styles.continueTextInactive}>
                continue
              </Text>
            </TouchableOpacity>
          </>
        )}
        {/* Continue button for multiSelect, personalitySelect, nationalitySelect, marriageIntentions, imageUpload, documentUpload, and documentUploadDouble at bottom */}
        {(isMultiSelect || currentQuestion.type === 'personalitySelect' || currentQuestion.type === 'nationalitySelect' || currentQuestion.type === 'marriageIntentions' || currentQuestion.type === 'imageUpload' || currentQuestion.type === 'documentUpload' || currentQuestion.type === 'documentUploadDouble') && (
          <>
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                { bottom: 0 + insets.bottom },
                currentQuestion.type === 'personalitySelect' 
                  ? styles.continueButtonActive 
                  : (isCurrentInputValid() ? styles.continueButtonActive : styles.continueButtonInactive)
              ]} 
              onPress={proceedToNextStep} 
              disabled={currentQuestion.type === 'personalitySelect' ? false : !isCurrentInputValid()}
            >
              <Text style={currentQuestion.type === 'personalitySelect' 
                ? styles.continueTextActive 
                : (isCurrentInputValid() ? styles.continueTextActive : styles.continueTextInactive)}>
                {currentQuestion.type === 'personalitySelect'
                  ? `Select (${(onboardingData[currentQuestion.key] || []).length})`
                  : currentQuestion.type === 'nationalitySelect'
                  ? (isCurrentInputValid()
                      ? `continue`
                      : `Select nationality`)
                  : isMultiSelect 
                  ? (isCurrentInputValid() 
                      ? `continue (${currentSelections.length} selected)`
                      : `select at least 3 (${currentSelections.length}/3)`)
                  : currentQuestion.type === 'imageUpload'
                  ? (isCurrentInputValid()
                      ? `continue (${onboardingData.photos?.length || 0}/${currentQuestion.required || 3} photos)`
                      : `upload ${currentQuestion.required || 3} photos (${onboardingData.photos?.length || 0}/${currentQuestion.required || 3})`)
                  : currentQuestion.type === 'documentUploadDouble'
                  ? (isCurrentInputValid()
                      ? 'continue'
                      : 'upload front and back')
                  : (isCurrentInputValid()
                      ? 'continue'
                      : 'upload document')
                }
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />
      {!profileCreated && !accountLoading && !showCreateAccount && step > 0 && (
        <TouchableOpacity 
          style={[styles.backButton, { top: Math.max(insets.top + 10, 50) }]} 
          onPress={handleBack}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      )}
      {!profileCreated && !accountLoading && !showCreateAccount && (
        <View style={[styles.progressContainer, { paddingTop: Math.max(insets.top + 20, 60) }]}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>
      )}
      {renderContent()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backIcon: {
    color: theme.black,
    fontSize: 34,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.lightGray,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.black,
    borderRadius: 2,
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 100, // Space for continue button at bottom
  },
  questionText: {
    color: theme.black,
    fontSize: titleFontSize,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    lineHeight: titleFontSize * 1.2,
    marginBottom: verticalGapAfterTitle,
  },
  textInput: {
    color: theme.black,
    fontSize: inputFontSize,
    fontWeight: '400',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.black,
    paddingBottom: 10,
    marginBottom: 10,
    width: '100%',
  },
  textInputError: {
    borderBottomColor: theme.error,
  },
  bioInput: {
    fontSize: 16,
    textAlign: 'left',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.lightGray,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightGray,
    minHeight: 100,
    maxHeight: 150,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 100, // Space for continue button at bottom
  },
  scrollContent: {
    paddingBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    marginTop: 0,
  },
  minSelectionText: {
    color: theme.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  optionButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    marginRight: 8,
    fontSize: optionFontSize,
  },
  selectedOptionButton: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  optionText: {
    fontSize: 15,
    color: theme.black,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: theme.white,
  },
  checkIcon: {
    marginLeft: 8,
  },
  continueButton: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.9,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonInactive: {
    backgroundColor: theme.buttonInactive,
  },
  continueButtonActive: {
    backgroundColor: theme.buttonActive,
  },
  continueTextInactive: {
    color: theme.gray,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  continueTextActive: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  skipButton: {
    position: 'absolute',
    bottom: 10,
    width: width * 0.9,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: theme.black,
    fontSize: 16,
    fontWeight: '500',
  },
  centeredResult: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: theme.black,
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  completionMessage: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmarkIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmarkSymbol: {
    fontSize: 40,
    color: theme.white,
  },
  allDoneText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.black,
  },
  successSubtext: {
    fontSize: 16,
    color: theme.gray,
    textAlign: 'center',
    marginTop: 10,
  },
  uploadContainer: {
    width: '100%',
    alignItems: 'center',
  },
  uploadSubtitle: {
    fontSize: 16,
    color: theme.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  photoSlot: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 15,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadButton: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 12,
    color: theme.gray,
    marginTop: 8,
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.white,
    borderRadius: 12,
  },
  documentPreview: {
    width: '100%',
    padding: 20,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  documentName: {
    fontSize: 16,
    color: theme.black,
    marginTop: 10,
    fontWeight: '500',
  },
  removeDocumentButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeDocumentText: {
    color: theme.error,
    fontSize: 14,
    fontWeight: '600',
  },
  documentUploadButton: {
    width: '100%',
    padding: 40,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentUploadText: {
    fontSize: 16,
    color: theme.black,
    marginTop: 12,
    fontWeight: '500',
  },
  documentUploadHint: {
    fontSize: 14,
    color: theme.gray,
    marginTop: 4,
  },
  doubleDocumentSection: {
    width: '100%',
    marginBottom: 24,
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  nationalityContainer: {
    flex: 1,
    width: '100%',
  },
  nationalitySubtitle: {
    fontSize: 14,
    color: theme.gray,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.secondary,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.black,
  },
  suggestedSection: {
    marginBottom: 20,
  },
  allSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.black,
    marginBottom: 12,
  },
  nationalityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  selectedNationalityOption: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  nationalityText: {
    fontSize: 15,
    color: theme.black,
    fontWeight: '500',
  },
  selectedNationalityText: {
    color: theme.white,
  },
  personalityContainer: {
    flex: 1,
    width: '100%',
  },
  personalitySubtitle: {
    fontSize: 14,
    color: theme.black,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  personalityButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  selectedPersonalityButton: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  personalityEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  personalityText: {
    fontSize: 15,
    color: theme.black,
    fontWeight: '500',
    flex: 1,
  },
  selectedPersonalityText: {
    color: theme.white,
  },
  marriageSection: {
    width: '100%',
    marginBottom: 32,
  },
  marriageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.black,
    marginBottom: 16,
  },
  marriageOptionsContainer: {
    width: '100%',
  },
  marriageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  selectedMarriageOption: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  marriageOptionIcon: {
    marginRight: 12,
  },
  marriageOptionText: {
    fontSize: 15,
    color: theme.black,
    fontWeight: '500',
  },
  selectedMarriageOptionText: {
    color: theme.white,
  },
  professionContainer: {
    flex: 1,
    width: '100%',
  },
  professionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.secondary,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.lightGray,
  },
  selectedProfessionOption: {
    backgroundColor: theme.white,
    borderColor: theme.buttonActive,
  },
  professionText: {
    fontSize: 15,
    color: theme.black,
    fontWeight: '500',
  },
  selectedProfessionText: {
    color: theme.buttonActive,
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  countryCodeContainer: {
    marginRight: 12,
  },
  countryCodeInput: {
    color: theme.black,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.black,
    paddingBottom: 10,
    width: 80,
  },
  phoneNumberInput: {
    flex: 1,
    color: theme.black,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.black,
    paddingBottom: 10,
  },
  passwordInputContainer: {
    width: '100%',
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  createAccountContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: theme.primary,
  },
  createAccountTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  createAccountBackButton: {
    marginRight: 12,
    padding: 4,
  },
  createAccountTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.black,
    textAlign: 'left',
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.lightGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.black,
    backgroundColor: theme.secondary,
  },
  accountErrorText: {
    color: theme.error,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  finalContinueButton: {
    backgroundColor: theme.buttonActive,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  finalContinueText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;

