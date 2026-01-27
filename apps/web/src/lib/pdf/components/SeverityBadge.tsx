/**
 * SeverityBadge Component
 *
 * Badge component for severity indicators (LOW, MEDIUM, HIGH, CRITICAL)
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { severityStyles, fontSize, spacing } from '../styles/pdfStyles';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SeverityBadgeProps {
  severity: Severity;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: fontSize.xs,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
});

export const SeverityBadge = ({ severity }: SeverityBadgeProps) => {
  const style = severityStyles[severity];

  return (
    <View style={[styles.badge, style]}>
      <Text>{severity}</Text>
    </View>
  );
};
