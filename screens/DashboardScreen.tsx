import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { endOfDay, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import { DailyStats } from '../types/database';
import { formatCurrency, formatDate } from '../utils/dateUtils';

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
  // Added for feature 1: Dashboard calendar date picker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        // Added for feature 1: Calendar icon button in header
        headerRight: () => (
          <IconButton
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={{ marginRight: 10 }}
          />
        ),
      });
      fetchStats(selectedDate);
    }, [navigation, selectedDate])
  );

  // Added for feature 1: Fetch stats for selected date
  const fetchStats = async (date: Date) => {
    try {
      setLoading(true);
      const TIMEZONE = 'Asia/Kolkata';
      const zonedDate = utcToZonedTime(date, TIMEZONE);
      const start = zonedTimeToUtc(startOfDay(zonedDate), TIMEZONE).toISOString();
      const end = zonedTimeToUtc(endOfDay(zonedDate), TIMEZONE).toISOString();

      // Fetch transactions for selected date
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

      console.log(`✓ Dashboard stats loaded for ${formatDate(date)}`);
    } catch (error: any) {
      setSnackbar({ visible: true, message: error.message || 'Failed to load stats' });
    } finally {
      setLoading(false);
    }
  };

  // Added for feature 1: Handle date picker change
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        {/* Added for feature 1: Display selected date */}
        <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
      </View>

      {/* Added for feature 1: Date picker modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}

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
          onPress={() => {
            // Correct way to navigate to the nested Quick Bill tab
            navigation.navigate('BillingGroup', { screen: 'QuickBillTab' });
          }}
        >
          Quick Bill
        </Button>
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => {
            // Correct way to navigate to the nested Report tab
            navigation.navigate('BillingGroup', { screen: 'ReportTab' });
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
