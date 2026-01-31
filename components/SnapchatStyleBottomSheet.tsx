/**
 * Snapchat-style Bottom Sheet
 * Modal that slides up from bottom with Snapchat-like UI:
 * - Rounded white sheet, dimmed overlay
 * - Close X in grey circle (top right)
 * - Header icon (orange circle + icon)
 * - Bold title, grey description
 * - Selectable card(s): single option OR monthly/yearly plans with choose
 * - Full-width orange primary button
 * - Footer with grey text + optional blue links
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SNAP_ORANGE = '#FF6B35';
const SNAP_ORANGE_LIGHT = '#FF8F66';
const SNAP_GREY = '#8E8E93';
const SNAP_LINK = '#007AFF';

export interface PlanOption {
  id: string;
  label: string;
  price: string;
  /** e.g. "Save 50%" */
  badge?: string;
}

/** Single source of truth: plan + amount for bottom sheet and premium screen */
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

export interface SnapchatStyleBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Icon name for header (e.g. 'flame', 'person') */
  headerIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** Monthly + yearly (or more) plans – when set, user picks one */
  plans?: PlanOption[];
  /** Which plan is selected when sheet opens (default: first plan) */
  initialSelectedPlanId?: string;
  /** Legacy: single option when plans not used */
  optionLabel?: string;
  optionPrice?: string;
  /** Primary button label */
  primaryButtonText: string;
  /** Called with selected plan id when plans provided, else no arg */
  onPrimaryPress: (selectedPlanId?: string) => void;
  /** Footer: array of segments - either { type: 'text', value } or { type: 'link', label, onPress } */
  footerSegments?: Array<
    | { type: 'text'; value: string }
    | { type: 'link'; label: string; onPress: () => void }
  >;
}

export function SnapchatStyleBottomSheet({
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
}: SnapchatStyleBottomSheetProps) {
  const hasPlans = plans && plans.length > 0;
  const defaultSelected = hasPlans
    ? (initialSelectedPlanId ?? plans[0].id)
    : null;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(defaultSelected);

  useEffect(() => {
    if (visible && hasPlans) {
      setSelectedPlanId(initialSelectedPlanId ?? plans[0].id);
    }
  }, [visible, hasPlans, initialSelectedPlanId, plans?.[0]?.id]);

  const handlePrimaryPress = () => {
    if (hasPlans && selectedPlanId) {
      onPrimaryPress(selectedPlanId);
    } else {
      onPrimaryPress();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Close - X in grey circle */}
          <TouchableOpacity
            style={styles.closeCircle}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={SNAP_GREY} />
          </TouchableOpacity>

          {/* Header icon - orange circle with person + flame */}
          <View style={styles.headerIconWrap}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="person" size={30} color="#fff" />
              <View style={styles.headerIconBadge}>
                <Ionicons name={headerIcon} size={16} color="#fff" />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Plan options: monthly + yearly (or single legacy card) */}
          {hasPlans ? (
            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const selected = selectedPlanId === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.optionCard,
                      !selected && styles.optionCardUnselected,
                    ]}
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
                    <View
                      style={[
                        styles.optionCheckWrap,
                        !selected && styles.optionCheckWrapEmpty,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={22} color="#fff" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.optionCard}>
              <View style={styles.optionCardContent}>
                <Text style={styles.optionLabel}>{optionLabel}</Text>
                {optionPrice != null && (
                  <Text style={styles.optionPrice}>{optionPrice}</Text>
                )}
              </View>
              <View style={styles.optionCheckWrap}>
                <Ionicons name="checkmark" size={22} color="#fff" />
              </View>
            </View>
          )}

          {/* Primary button - full width orange */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePrimaryPress}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
          </TouchableOpacity>

          {/* Footer - grey text + blue links inline */}
          {footerSegments.length > 0 && (
            <View style={styles.footer}>
              {footerSegments.map((seg, i) =>
                seg.type === 'text' ? (
                  <Text key={i} style={styles.footerText}>
                    {seg.value}
                  </Text>
                ) : (
                  <TouchableOpacity
                    key={i}
                    onPress={seg.onPress}
                    activeOpacity={0.7}
                    style={styles.footerLinkWrap}
                  >
                    <Text style={styles.footerLink}>{seg.label}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  closeCircle: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerIconWrap: {
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SNAP_ORANGE,
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
    backgroundColor: SNAP_ORANGE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: SNAP_GREY,
    lineHeight: 22,
    marginBottom: 24,
  },
  plansContainer: {
    marginBottom: 24,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SNAP_ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionCardUnselected: {
    borderColor: '#E5E5EA',
  },
  optionCardContent: {
    flex: 1,
  },
  optionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  planBadge: {
    backgroundColor: SNAP_ORANGE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  optionPrice: {
    fontSize: 14,
    color: SNAP_GREY,
    marginTop: 4,
  },
  optionCheckWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SNAP_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  optionCheckWrapEmpty: {
    backgroundColor: '#E5E5EA',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: SNAP_ORANGE,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    color: SNAP_GREY,
  },
  footerLinkWrap: {
    marginHorizontal: 2,
  },
  footerLink: {
    fontSize: 12,
    color: SNAP_LINK,
    textDecorationLine: 'underline',
  },
});
