import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Snackbar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import { formatCurrency, getTodayStartEnd } from '../utils/dateUtils';
import { DailyStats } from '../types/database';
import { IconButton } from 'react-native-paper';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [stats, setStats] = useState<DailyStats>({
    totalSales: 0,
    cashTotal: 0,
    gpayTotal: 0,
    itemCount: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useFocusEffect(
  React.useCallback(() => {
    // Manually add the menu button to the header
    navigation.setOptions({
      headerLeft: () => (
        <IconButton
          icon="menu"
          onPress={() => (navigation as any).openDrawer()}
        />
      ),
    });
    fetchTodayStats();
  }, [navigation])
);

  const fetchTodayStats = async () => {
    try {
      setLoading(true);
      const { start, end } = getTodayStartEnd();

      // Fetch today's transactions
      const { data: transactions, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      if (txnError) throw txnError;

      let totalSales = 0;
      let cashTotal = 0;
      let gpayTotal = 0;

      transactions?.forEach((txn) => {
        totalSales += txn.total_amount;
        if (txn.payment_mode === 'cash') {
          cashTotal += txn.total_amount;
        } else if (txn.payment_mode === 'gpay') {
          gpayTotal += txn.total_amount;
        }
      });

      // Fetch item count
      const { data: items, error: itemError } = await supabase
        .from('transaction_items')
        .select('id')
        .gte('created_at', start)
        .lte('created_at', end);

      if (itemError) throw itemError;

      setStats({
        totalSales,
        cashTotal,
        gpayTotal,
        itemCount: items?.length || 0,
        transactionCount: transactions?.length || 0,
      });
    } catch (error: any) {
      setSnackbar({ visible: true, message: error.message || 'Failed to load stats' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Today's Summary</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>Total Sales</Text>
          <Text style={styles.amount}>{formatCurrency(stats.totalSales)}</Text>
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Card style={[styles.card, styles.halfCard]}>
          <Card.Content>
            <Text style={styles.label}>Cash</Text>
            <Text style={[styles.amount, styles.cashAmount]}>
              {formatCurrency(stats.cashTotal)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, styles.halfCard]}>
          <Card.Content>
            <Text style={styles.label}>GPay</Text>
            <Text style={[styles.amount, styles.gpayAmount]}>
              {formatCurrency(stats.gpayTotal)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.row}>
        <Card style={[styles.card, styles.halfCard]}>
          <Card.Content>
            <Text style={styles.label}>Transactions</Text>
            <Text style={styles.amount}>{stats.transactionCount}</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, styles.halfCard]}>
          <Card.Content>
            <Text style={styles.label}>Items Sold</Text>
            <Text style={styles.amount}>{stats.itemCount}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          style={styles.button}
          labelStyle={styles.buttonLabel}
          onPress={() => {
            console.log('Quick Bill pressed - Navigating to BillTabNavigator');
            navigation.navigate('Billing', { screen: 'QuickBill' });
          }}
        >
          Quick Bill
        </Button>
        <Button
          mode="contained"
          style={styles.button}
          labelStyle={styles.buttonLabel}
          onPress={() => {
            console.log('View Report pressed - Navigating to BillReport');
            navigation.navigate('Billing', { screen: 'BillReport' });
          }}
        >
          View Report
        </Button>
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
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
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  halfCard: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  cashAmount: {
    color: colors.success,
  },
  gpayAmount: {
    color: colors.secondary,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
