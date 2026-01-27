/**
 * PersonaBadge Component
 *
 * Badge component for persona/archetype names
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize, spacing } from '../styles/pdfStyles';

interface PersonaBadgeProps {
  name: string;
  variant?: 'default' | 'archetype';
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
  },
  default: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  archetype: {
    backgroundColor: colors.purple[50],
    color: colors.purple[700],
  },
});

export const PersonaBadge = ({ name, variant = 'default' }: PersonaBadgeProps) => {
  return (
    <View style={[styles.badge, variant === 'archetype' ? styles.archetype : styles.default]}>
      <Text>{name}</Text>
    </View>
  );
};
