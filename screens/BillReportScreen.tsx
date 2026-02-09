import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { endOfDay, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, DataTable, Divider, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import { Transaction } from '../types/database';
import { formatCurrency, formatDate, formatTimeIST } from '../utils/dateUtils';

export const BillReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    cashTotal: 0,
    gpayTotal: 0,
    transactionCount: 0,
  });
  // Added for feature 1: Bill Report calendar date picker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Added for feature 8: Payment mode filter
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'gpay'>('all');

  useFocusEffect(
    React.useCallback(() => {
      // Added for feature 1: Setup header with calendar icon
      navigation.setOptions({
        headerRight: () => (
          <IconButton
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={{ marginRight: 10 }}
          />
        ),
      });

      fetchReport(selectedDate);
      // Subscribe to realtime updates
      const subscription = supabase
        .channel('transactions_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => {
            fetchReport(selectedDate);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }, [navigation, selectedDate])
  );

  // Added for feature 1: Fetch report for selected date
  const fetchReport = async (date: Date) => {
    try {
      setLoading(true);
      const TIMEZONE = 'Asia/Kolkata';
      const zonedDate = utcToZonedTime(date, TIMEZONE);
      const start = zonedTimeToUtc(startOfDay(zonedDate), TIMEZONE).toISOString();
      const end = zonedTimeToUtc(endOfDay(zonedDate), TIMEZONE).toISOString();

      // Fetch transactions for selected date
      const { data: txns, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (txnError) throw txnError;

      setTransactions(txns || []);

      // Calculate stats
      let totalSales = 0;
      let cashTotal = 0;
      let gpayTotal = 0;

      txns?.forEach((txn) => {
        totalSales += txn.total_amount;
        if (txn.payment_mode === 'cash') {
          cashTotal += txn.total_amount;
        } else if (txn.payment_mode === 'gpay') {
          gpayTotal += txn.total_amount;
        }
      });

      setStats({
        totalSales,
        cashTotal,
        gpayTotal,
        transactionCount: txns?.length || 0,
      });

      console.log(`✓ Bill Report loaded for ${formatDate(date)}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Added for feature 1: Handle date picker change
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReport(selectedDate);
  };

  const difference = stats.cashTotal - stats.gpayTotal;

  // Added for feature 8: Filter transactions by payment mode
  const filteredTransactions = 
    paymentFilter === 'all' 
      ? transactions 
      : transactions.filter((txn) => txn.payment_mode === paymentFilter);

  // Added for feature 8: Calculate filtered stats
  const filteredStats = {
    totalSales: filteredTransactions.reduce((sum, txn) => sum + txn.total_amount, 0),
    cashTotal: filteredTransactions
      .filter((txn) => txn.payment_mode === 'cash')
      .reduce((sum, txn) => sum + txn.total_amount, 0),
    gpayTotal: filteredTransactions
      .filter((txn) => txn.payment_mode === 'gpay')
      .reduce((sum, txn) => sum + txn.total_amount, 0),
    transactionCount: filteredTransactions.length,
  };

  const filteredDifference = filteredStats.cashTotal - filteredStats.gpayTotal;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Added for feature 1: Date picker modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}

      {/* Summary Cards */}
      <Card style={styles.card}>
        <Card.Content>
          {/* Added for feature 1: Display selected date in header */}
          <Text style={styles.dateLabel}>{formatDate(selectedDate)} Summary</Text>
          <Divider style={styles.divider} />

          {/* Added for feature 8: Payment mode filter */}
          <Text style={styles.filterLabel}>Filter by Type:</Text>
          <SegmentedButtons
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value as 'all' | 'cash' | 'gpay')}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'cash', label: 'Cash' },
              { value: 'gpay', label: 'GPay' },
            ]}
            style={styles.filterSegments}
          />
          <Divider style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(filteredStats.totalSales)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{filteredStats.transactionCount}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cash</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(filteredStats.cashTotal)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>GPay</Text>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {formatCurrency(filteredStats.gpayTotal)}
              </Text>
            </View>
          </View>

          {/* GPay Reconciliation */}
          <Divider style={styles.divider} />
          <View style={styles.reconciliationBox}>
            <Text style={styles.reconLabel}>Cash/GPay Difference</Text>
            <Text
              style={[
                styles.reconValue,
                { color: filteredDifference >= 0 ? colors.success : colors.error },
              ]}
            >
              {formatCurrency(Math.abs(filteredDifference))}
            </Text>
            <Text style={styles.reconNote}>
              {filteredDifference > 0
                ? '₹' + Math.abs(filteredDifference).toFixed(0) + ' more cash'
                : 'Extra payment received'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Transactions List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Transactions ({filteredTransactions.length})</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} animating size="large" color={colors.primary} />
      ) : filteredTransactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No transactions {paymentFilter !== 'all' ? 'for selected filter' : 'today'}</Text>
          </Card.Content>
        </Card>
      ) : (
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={styles.col1}>Type</DataTable.Title>
            <DataTable.Title style={styles.col2}>Time</DataTable.Title>
            <DataTable.Title numeric style={styles.col3}>
              Amount
            </DataTable.Title>
            <DataTable.Title style={styles.col4}>Mode</DataTable.Title>
          </DataTable.Header>

          {filteredTransactions.map((txn) => (
            <DataTable.Row key={txn.id} style={styles.tableRow}>
              <DataTable.Cell style={styles.col1}>
                <Text style={styles.cellText}>{txn.bill_type}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.col2}>
                <Text style={styles.cellText}>{formatTimeIST(txn.created_at)}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.col3}>
                <Text style={styles.cellText}>{formatCurrency(txn.total_amount)}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.col4}>
                <Text
                  style={[
                    styles.cellText,
                    {
                      color:
                        txn.payment_mode === 'cash' ? colors.success : colors.secondary,
                    },
                  ]}
                >
                  {txn.payment_mode}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  // Added for feature 8: Filter label and segments styling
  filterLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  filterSegments: {
    marginBottom: spacing.md,
  },
  divider: {
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  reconciliationBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    borderColor: colors.secondary,
    borderWidth: 1,
  },
  reconLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  reconValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  reconNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
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
  col1: { flex: 1.2 },
  col2: { flex: 1.2 },
  col3: { flex: 1 },
  col4: { flex: 1 },
  cellText: {
    color: colors.text,
    fontSize: 12,
  },
});
