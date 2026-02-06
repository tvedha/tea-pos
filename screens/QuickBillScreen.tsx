import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Button, DataTable, Card, Text, Snackbar, SegmentedButtons, IconButton } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import { formatCurrency } from '../utils/dateUtils';
import { NumberPad } from '../components/NumberPad';
import { BillItem } from '../types/database';

export const QuickBillScreen: React.FC = () => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay'>('cash');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [loading, setLoading] = useState(false);

  const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddQuickAmount = (amount: string) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    const description = `Quick Entry ${new Date().toLocaleTimeString()}`;
    const newItem: BillItem = {
      id: Date.now().toString(),
      description,
      quantity: 1,
      rate: parsedAmount,
      total: parsedAmount,
    };

    setBillItems([...billItems, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setBillItems(billItems.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setBillItems(
      billItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.total = updated.quantity * updated.rate;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleClearBill = () => {
    Alert.alert('Clear Bill', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => setBillItems([]),
        style: 'destructive',
      },
    ]);
  };

  const handleSave = async () => {
    if (billItems.length === 0) {
      setSnackbar({ visible: true, message: 'Add items to save bill' });
      return;
    }

    setLoading(true);
    try {
      // Insert transaction
      const { data: txn, error: txnError } = await supabase
        .from('transactions')
        .insert({
          bill_type: 'quick',
          total_amount: totalAmount,
          payment_mode: paymentMode,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Insert transaction items
      const itemsToInsert = billItems.map((item) => ({
        transaction_id: txn.id,
        product_id: item.productId || null,
        quantity: item.quantity,
        rate: item.rate,
        total: item.total,
        description: item.description,
      }));

      const { error: itemError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

      if (itemError) throw itemError;

      setSnackbar({
        visible: true,
        message: `Bill saved successfully! Total: ${formatCurrency(totalAmount)}`,
      });

      // Clear bill
      setBillItems([]);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to save bill',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Bill Items List */}
      <ScrollView style={styles.billItems} contentContainerStyle={styles.billItemsContent}>
        {billItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items added. Use the number pad below.</Text>
          </View>
        ) : (
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.col0}>SR</DataTable.Title>
                <DataTable.Title style={styles.col1}>DETAILS</DataTable.Title>
                <DataTable.Title numeric style={styles.col2}>
                  QTY
                </DataTable.Title>
                <DataTable.Title numeric style={styles.col3}>
                  RATE
                </DataTable.Title>
                <DataTable.Title numeric style={styles.col4}>
                  TOTAL
                </DataTable.Title>
                <DataTable.Title style={styles.col5}>Action</DataTable.Title>
              </DataTable.Header>

              {billItems.map((item, idx) => (
                <DataTable.Row key={item.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.col0}>
                    <Text style={styles.cellText}>{idx + 1}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col1}>
                    <Text style={styles.cellText}>{item.description.substring(0, 20)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.col2}>
                    <Text style={styles.cellText}>{item.quantity}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.col3}>
                    <Text style={styles.cellText}>{formatCurrency(item.rate)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.col4}>
                    <Text style={styles.cellText}>{formatCurrency(item.total)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.col5}>
                    <IconButton
                      icon="delete"
                      iconColor={colors.error}
                      size={16}
                      onPress={() => handleDeleteItem(item.id)}
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
          </DataTable>
        )}
      </ScrollView>

      {/* Payment Mode Selector */}
      <View style={styles.paymentMode}>
        <Text style={styles.label}>Payment Mode:</Text>
        <SegmentedButtons
          value={paymentMode}
          onValueChange={(value) => setPaymentMode(value as 'cash' | 'gpay')}
          buttons={[
            { value: 'cash', label: 'Cash', icon: 'cash' },
            { value: 'gpay', label: 'GPay', icon: 'mobile-pay' },
          ]}
          style={styles.segmentButtons}
        />
      </View>

      {/* Summary Bar */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{billItems.length}</Text>
          </View>
          <View style={styles.totalSection}>
            <Text style={styles.summaryLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          mode="outlined"
          onPress={handleClearBill}
          style={styles.buttonHalf}
          labelStyle={styles.buttonLabel}
          textColor={colors.error}
        >
          Clear
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || billItems.length === 0}
          style={styles.buttonHalf}
          labelStyle={styles.buttonLabel}
        >
          Save Bill
        </Button>
      </View>

      {/* Number Pad */}
      <ScrollView style={styles.numberPadContainer} nestedScrollEnabled={true}>
        <NumberPad onAddAmount={handleAddQuickAmount} />
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  billItems: {
    flex: 1,
  },
  billItemsContent: {
    padding: spacing.md,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  tableHeader: {
    backgroundColor: colors.primary,
  },
  tableRow: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  col0: { flex: 0.4 },
  col1: { flex: 1.8 },
  col2: { flex: 0.8 },
  col3: { flex: 0.8 },
  col4: { flex: 0.9 },
  col5: { flex: 0.6 },
  cellText: {
    color: colors.text,
    fontSize: 12,
  },
  paymentMode: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  segmentButtons: {
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  totalSection: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  numberPadContainer: {
    maxHeight: 240,
    backgroundColor: colors.surface,
  },
});