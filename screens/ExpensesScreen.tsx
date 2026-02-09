import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import { Expense } from '../types/database';
import { formatCurrency, formatDate } from '../utils/dateUtils';

// Added for feature 5: Expenses screen
export const ExpensesScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const expenseCategories = ['milk', 'tea_leaves', 'gas', 'rent', 'misc'];

  const [formData, setFormData] = useState({
    category: 'misc',
    amount: '',
    date: new Date(),
    description: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchExpenses();
    }, [])
  );

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      console.log(`✓ Expenses loaded (${data?.length || 0} entries)`);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to load expenses',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!formData.category || !formData.amount) {
      setSnackbar({ visible: true, message: 'Please fill required fields' });
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setSnackbar({ visible: true, message: 'Please enter valid amount' });
        return;
      }

      const { error } = await supabase.from('expenses').insert({
        category: formData.category,
        amount,
        description: formData.description || null,
      });

      if (error) throw error;
      setSnackbar({ visible: true, message: 'Expense added' });
      setShowModal(false);
      setFormData({ category: 'misc', amount: '', date: new Date(), description: '' });
      fetchExpenses();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to save expense',
      });
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);

            if (error) throw error;
            setSnackbar({ visible: true, message: 'Expense deleted' });
            fetchExpenses();
          } catch (error: any) {
            setSnackbar({
              visible: true,
              message: error.message || 'Failed to delete',
            });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.totalLabel}>Total: {formatCurrency(totalExpenses)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => {
            setFormData({ category: 'misc', amount: '', date: new Date(), description: '' });
            setShowModal(true);
          }}
          style={styles.addButton}
        >
          + Add
        </Button>
      </View>

      {/* Expenses List */}
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          animating
          size="large"
          color={colors.primary}
        />
      ) : expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No expenses yet</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: expense }) => (
            <Card style={styles.expenseCard}>
              <View style={styles.expenseContent}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.categoryLabel}>{expense.category}</Text>
                  {expense.description && (
                    <Text style={styles.description}>{expense.description}</Text>
                  )}
                  <Text style={styles.dateText}>
                    {formatDate(new Date(expense.created_at))}
                  </Text>
                </View>
                <View style={styles.amountSection}>
                  <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
                  <IconButton
                    icon="delete"
                    iconColor={colors.error}
                    size={20}
                    onPress={() => handleDeleteExpense(expense.id)}
                  />
                </View>
              </View>
            </Card>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.text}
                onPress={() => setShowModal(false)}
              />
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Category */}
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {expenseCategories.map((cat) => (
                  <Button
                    key={cat}
                    mode={formData.category === cat ? 'contained' : 'outlined'}
                    onPress={() => setFormData({ ...formData, category: cat })}
                    style={styles.categoryButton}
                  >
                    {cat.replace('_', ' ')}
                  </Button>
                ))}
              </View>

              {/* Amount */}
              <TextInput
                label="Amount (₹)"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
              />

              {/* Date */}
              <Text style={styles.formLabel}>Date</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                {formatDate(formData.date)}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setFormData({ ...formData, date });
                    }
                  }}
                />
              )}

              {/* Notes */}
              <TextInput
                label="Notes (optional)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />

              <Button
                mode="contained"
                onPress={handleSaveExpense}
                style={styles.submitButton}
              >
                Add Expense
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  expenseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  expenseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalForm: {
    padding: spacing.md,
  },
  formLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  dateButton: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
});
