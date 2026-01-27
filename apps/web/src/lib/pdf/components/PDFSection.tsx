/**
 * PDFSection Component
 *
 * Reusable section container with title and optional styling
 */

import { View, Text } from '@react-pdf/renderer';
import { baseStyles, colors } from '../styles/pdfStyles';

interface PDFSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
}

export const PDFSection = ({
  title,
  children,
  variant = 'default',
  icon
}: PDFSectionProps) => {
  const getSectionStyle = () => {
    switch (variant) {
      case 'success':
        return baseStyles.successSection;
      case 'warning':
        return baseStyles.warningSection;
      case 'danger':
        return baseStyles.dangerSection;
      case 'info':
        return baseStyles.infoSection;
      default:
        return baseStyles.section;
    }
  };

  const getTitleColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'info':
        return colors.info;
      default:
        return colors.gray[800];
    }
  };

  return (
    <View style={getSectionStyle()}>
      <Text style={[baseStyles.h3, { color: getTitleColor() }]}>
        {icon && `${icon} `}{title}
      </Text>
      {children}
    </View>
  );
};
