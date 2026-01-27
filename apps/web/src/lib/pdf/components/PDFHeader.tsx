/**
 * PDFHeader Component
 *
 * Reusable header for PDF documents with branding and document info
 */

import { View, Text } from '@react-pdf/renderer';
import { baseStyles } from '../styles/pdfStyles';

interface PDFHeaderProps {
  title: string;
  subtitle?: string;
}

export const PDFHeader = ({ title, subtitle }: PDFHeaderProps) => {
  return (
    <View style={baseStyles.header} fixed>
      <View style={baseStyles.row}>
        <View>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0369a1' }}>
            Juries by Filevine
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280' }}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={{ fontSize: 10, color: '#6b7280' }}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};
