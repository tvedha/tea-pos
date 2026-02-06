import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Button, Card, Text, DataTable, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import { formatCurrency, formatTimeIST, getTodayStartEnd } from '../utils/dateUtils';
import { Transaction } from '../types/database';

export const BillReportScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    cashTotal: 0,
    gpayTotal: 0,
    transactionCount: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchTodayReport();
      // Subscribe to realtime updates
      const subscription = supabase
        .channel('transactions_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => {
            fetchTodayReport();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }, [])
  );

  const fetchTodayReport = async () => {
    try {
      setLoading(true);
      const { start, end } = getTodayStartEnd();

      // Fetch today's transactions
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodayReport();
  };

  const difference = stats.cashTotal - stats.gpayTotal;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Summary Cards */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.dateLabel}>Today's Summary</Text>
          <Divider style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(stats.totalSales)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{stats.transactionCount}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cash</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(stats.cashTotal)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>GPay</Text>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {formatCurrency(stats.gpayTotal)}
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
                { color: difference >= 0 ? colors.success : colors.error },
              ]}
            >
              {formatCurrency(Math.abs(difference))}
            </Text>
            <Text style={styles.reconNote}>
              {difference > 0
                ? '₹' + Math.abs(difference).toFixed(0) + ' more cash'
                : 'Extra payment received'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Transactions List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Transactions ({stats.transactionCount})</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} animating size="large" color={colors.primary} />
      ) : transactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No transactions today</Text>
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

          {transactions.map((txn) => (
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
