/**
 * HIBO Premium Plan Bottom Sheet (using @gorhom/bottom-sheet)
 * Rounded sheet, plan selection, primary button
 */

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

const HIBO_PRIMARY = '#E8DAEF';    // lavender
const HIBO_SECONDARY = '#DAEFDA';  // mint green
const HIBO_ACCENT = '#F4E4BC';     // cream
const HIBO_GREY = '#8E8E93';
const HIBO_LINK = '#007AFF';

export interface PlanOption {
  id: string;
  label: string;
  price: string;
  badge?: string;
}

export type PremiumPlanId = 'monthly' | 'yearly';

export interface PremiumPlanConfig {
  id: PremiumPlanId;
  label: string;
  price: string;
  badge?: string;
  amount: number;
  name: string;
}

export const PREMIUM_PLANS: PremiumPlanConfig[] = [
  { id: 'monthly', label: 'Monthly', price: '$0.01/month', amount: 0.01, name: 'HIBO Monthly Plan' },
  { id: 'yearly', label: 'Yearly', price: '$0.10/year', badge: '3 DAYS FREE', amount: 0.1, name: 'HIBO Yearly Plan' },
];

export const PREMIUM_PLANS_FOR_SHEET: PlanOption[] = PREMIUM_PLANS.map(({ id, label, price, badge }) => ({
  id,
  label,
  price,
  ...(badge != null && { badge }),
}));

export function getPremiumPlanById(id: string): PremiumPlanConfig | undefined {
  return PREMIUM_PLANS.find((p) => p.id === id);
}

export interface HiboBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  headerIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  plans?: PlanOption[];
  initialSelectedPlanId?: string;
  optionLabel?: string;
  optionPrice?: string;
  primaryButtonText: string;
  onPrimaryPress: (selectedPlanId?: string) => void;
  footerSegments?: Array<
    | { type: 'text'; value: string }
    | { type: 'link'; label: string; onPress: () => void }
  >;
}

export function HiboBottomSheet({
  visible,
  onClose,
  headerIcon = 'flame',
  title,
  description,
  plans,
  initialSelectedPlanId,
  optionLabel = '',
  optionPrice,
  primaryButtonText,
  onPrimaryPress,
  footerSegments = [],
}: HiboBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const hasPlans = plans && plans.length > 0;
  const defaultSelected = hasPlans ? (initialSelectedPlanId ?? plans[0].id) : null;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(defaultSelected);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && hasPlans) {
      setSelectedPlanId(initialSelectedPlanId ?? plans[0].id);
    }
  }, [visible, hasPlans, initialSelectedPlanId, plans?.[0]?.id]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePrimaryPress = useCallback(() => {
    if (hasPlans && selectedPlanId) {
      onPrimaryPress(selectedPlanId);
    } else {
      onPrimaryPress();
    }
  }, [hasPlans, selectedPlanId, onPrimaryPress]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['70%']}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheet}
    >
      <BottomSheetView style={styles.content}>
        <TouchableOpacity style={styles.closeCircle} onPress={handleDismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={HIBO_GREY} />
        </TouchableOpacity>

        <View style={styles.headerIconWrap}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="person" size={30} color="#333" />
            <View style={styles.headerIconBadge}>
              <Ionicons name={headerIcon} size={16} color="#333" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {hasPlans ? (
          <View style={styles.plansContainer}>
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.optionCard, !selected && styles.optionCardUnselected]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionCardContent}>
                    <View style={styles.optionCardRow}>
                      <Text style={styles.optionLabel}>{plan.label}</Text>
                      {plan.badge ? (
                        <View style={styles.planBadge}>
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.optionPrice}>{plan.price}</Text>
                  </View>
                  <View style={[styles.optionCheckWrap, !selected && styles.optionCheckWrapEmpty]}>
                    {selected ? <Ionicons name="checkmark" size={22} color="#333" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.optionCard}>
            <View style={styles.optionCardContent}>
              <Text style={styles.optionLabel}>{optionLabel}</Text>
              {optionPrice != null && <Text style={styles.optionPrice}>{optionPrice}</Text>}
            </View>
            <View style={styles.optionCheckWrap}>
              <Ionicons name="checkmark" size={22} color="#333" />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryPress} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
        </TouchableOpacity>

        {footerSegments.length > 0 && (
          <View style={styles.footer}>
            {footerSegments.map((seg, i) =>
              seg.type === 'text' ? (
                <Text key={i} style={styles.footerText}>
                  {seg.value}
                </Text>
              ) : (
                <TouchableOpacity key={i} onPress={seg.onPress} activeOpacity={0.7} style={styles.footerLinkWrap}>
                  <Text style={styles.footerLink}>{seg.label}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: { backgroundColor: '#E5E5EA', width: 40 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  closeCircle: {
    position: 'absolute',
    top: 8,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerIconWrap: { marginBottom: 16 },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: HIBO_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: HIBO_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12 },
  description: { fontSize: 15, color: HIBO_GREY, lineHeight: 22, marginBottom: 24 },
  plansContainer: { marginBottom: 24, gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: HIBO_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionCardUnselected: { borderColor: '#E5E5EA' },
  optionCardContent: { flex: 1 },
  optionCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  planBadge: {
    backgroundColor: HIBO_SECONDARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: { fontSize: 11, fontWeight: '700', color: '#333' },
  optionPrice: { fontSize: 14, color: HIBO_GREY, marginTop: 4 },
  optionCheckWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HIBO_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  optionCheckWrapEmpty: { backgroundColor: '#E5E5EA' },
  primaryButton: {
    width: '100%',
    backgroundColor: HIBO_ACCENT,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: '#333333' },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  footerText: { fontSize: 12, color: HIBO_GREY },
  footerLinkWrap: { marginHorizontal: 2 },
  footerLink: { fontSize: 12, color: HIBO_LINK, textDecorationLine: 'underline' },
});
