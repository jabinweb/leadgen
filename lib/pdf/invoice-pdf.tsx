import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (optional)
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #333',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'right',
    marginTop: -40,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  customerBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  infoBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  label: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 11,
    color: '#333',
    marginBottom: 6,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 10,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    fontSize: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    fontSize: 10,
  },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    fontSize: 11,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    fontSize: 13,
    fontWeight: 'bold',
    backgroundColor: '#2563eb',
    color: '#fff',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginBottom: 3,
  },
  statusBadge: {
    padding: '5 10',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#22c55e',
    color: '#fff',
  },
  statusOverdue: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  statusPartial: {
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
  statusDraft: {
    backgroundColor: '#6b7280',
    color: '#fff',
  },
});

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  createdAt: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  terms?: string;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyTaxId?: string;
  // Payment Details
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  paymentInstructions?: string;
  // Template Customization
  templateStyle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
}

const getStatusStyle = (status: string) => {
  const baseStyle = styles.statusBadge;
  switch (status) {
    case 'PAID':
      return { ...baseStyle, ...styles.statusPaid };
    case 'OVERDUE':
      return { ...baseStyle, ...styles.statusOverdue };
    case 'PARTIAL':
      return { ...baseStyle, ...styles.statusPartial };
    default:
      return { ...baseStyle, ...styles.statusDraft };
  }
};

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const InvoicePDF: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const primaryColor = invoice.primaryColor || '#2563eb';
  const footerMessage = invoice.footerText || 'Thank you for your business!';
  
  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.row}>
          <View>
            <Text style={styles.companyName}>
              {invoice.companyName || 'Your Company Name'}
            </Text>
            {invoice.companyAddress && (
              <Text style={styles.companyDetails}>{invoice.companyAddress}</Text>
            )}
            {invoice.companyEmail && (
              <Text style={styles.companyDetails}>{invoice.companyEmail}</Text>
            )}
            {invoice.companyPhone && (
              <Text style={styles.companyDetails}>{invoice.companyPhone}</Text>
            )}
            {invoice.companyTaxId && (
              <Text style={styles.companyDetails}>Tax ID: {invoice.companyTaxId}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={getStatusStyle(invoice.status)}>
              <Text>{invoice.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Customer & Invoice Info */}
      <View style={styles.row}>
        <View style={styles.customerBox}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.value}>{invoice.customerName}</Text>
          {invoice.customerEmail && (
            <Text style={styles.value}>{invoice.customerEmail}</Text>
          )}
          {invoice.customerPhone && (
            <Text style={styles.value}>{invoice.customerPhone}</Text>
          )}
          {invoice.customerAddress && (
            <Text style={styles.value}>{invoice.customerAddress}</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.label}>Currency:</Text>
            <Text style={styles.value}>{invoice.currency}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={{ ...styles.tableHeader, backgroundColor: primaryColor }}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Unit Price</Text>
          <Text style={styles.col4}>Amount</Text>
        </View>

        {invoice.items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <View style={styles.col1}>
              <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{item.name}</Text>
              {item.description && (
                <Text style={{ fontSize: 8, color: '#666' }}>{item.description}</Text>
              )}
            </View>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
            <Text style={styles.col4}>{formatCurrency(item.amount, invoice.currency)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
        </View>

        {invoice.discount > 0 && (
          <View style={styles.totalRow}>
            <Text>Discount:</Text>
            <Text>-{formatCurrency(invoice.discount, invoice.currency)}</Text>
          </View>
        )}

        {invoice.taxRate > 0 && (
          <View style={styles.totalRow}>
            <Text>Tax ({invoice.taxRate}%):</Text>
            <Text>{formatCurrency(invoice.taxAmount, invoice.currency)}</Text>
          </View>
        )}

        <View style={{ ...styles.totalRowFinal, backgroundColor: primaryColor }}>
          <Text>TOTAL:</Text>
          <Text>{formatCurrency(invoice.total, invoice.currency)}</Text>
        </View>

        {invoice.amountPaid > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text>Amount Paid:</Text>
              <Text style={{ color: '#22c55e' }}>
                -{formatCurrency(invoice.amountPaid, invoice.currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 'bold' }}>Amount Due:</Text>
              <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>
                {formatCurrency(invoice.amountDue, invoice.currency)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Terms & Notes */}
      {(invoice.terms || invoice.notes) && (
        <View style={styles.section}>
          {invoice.terms && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
              <Text style={{ fontSize: 9, color: '#666' }}>{invoice.terms}</Text>
            </View>
          )}
          {invoice.notes && (
            <View>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={{ fontSize: 9, color: '#666' }}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Payment Information */}
      {(invoice.bankName || invoice.accountNumber || invoice.paymentInstructions) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={{ 
            padding: 12, 
            backgroundColor: '#f0f9ff', 
            borderRadius: 4,
            borderLeft: `3 solid ${invoice.primaryColor || '#2563eb'}` 
          }}>
            {invoice.bankName && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Bank Name: </Text>
                <Text style={{ fontSize: 10, color: '#333', fontWeight: 'bold' }}>{invoice.bankName}</Text>
              </View>
            )}
            {invoice.accountName && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Account Name: </Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{invoice.accountName}</Text>
              </View>
            )}
            {invoice.accountNumber && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Account Number: </Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{invoice.accountNumber}</Text>
              </View>
            )}
            {invoice.routingNumber && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Routing Number: </Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{invoice.routingNumber}</Text>
              </View>
            )}
            {invoice.swiftCode && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>SWIFT/BIC: </Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{invoice.swiftCode}</Text>
              </View>
            )}
            {invoice.iban && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#666' }}>IBAN: </Text>
                <Text style={{ fontSize: 10, color: '#333' }}>{invoice.iban}</Text>
              </View>
            )}
            {invoice.paymentInstructions && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTop: '1 solid #cbd5e1' }}>
                <Text style={{ fontSize: 9, color: '#666', lineHeight: 1.4 }}>
                  {invoice.paymentInstructions}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {footerMessage}
        </Text>
        {!invoice.footerText && (
          <Text style={styles.footerText}>
            This is a computer-generated invoice and does not require a signature.
          </Text>
        )}
      </View>
    </Page>
  </Document>
  );
};
