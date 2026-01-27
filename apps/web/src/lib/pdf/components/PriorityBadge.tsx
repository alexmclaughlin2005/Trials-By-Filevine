/**
 * PriorityBadge Component
 *
 * Badge component for priority indicators (LOW, MEDIUM, HIGH)
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { priorityStyles, fontSize, spacing } from '../styles/pdfStyles';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface PriorityBadgeProps {
  priority: Priority;
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

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const style = priorityStyles[priority];

  return (
    <View style={[styles.badge, style]}>
      <Text>{priority}</Text>
    </View>
  );
};
