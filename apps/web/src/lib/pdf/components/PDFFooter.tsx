/**
 * PDFFooter Component
 *
 * Reusable footer with page numbers and generation timestamp
 */

import { View, Text } from '@react-pdf/renderer';
import { baseStyles } from '../styles/pdfStyles';

interface PDFFooterProps {
  generatedAt?: Date | string;
}

export const PDFFooter = ({ generatedAt }: PDFFooterProps) => {
  const timestamp = generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString();

  return (
    <View style={baseStyles.footer} fixed>
      <Text style={baseStyles.footerText}>
        Generated: {timestamp}
      </Text>
      <Text style={baseStyles.footerText} render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} of ${totalPages}`
      )} />
    </View>
  );
};
