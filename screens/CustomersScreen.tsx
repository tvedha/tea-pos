import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { Button, Card, Text, TextInput, Snackbar, ActivityIndicator, IconButton, DataTable } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import { formatCurrency } from '../utils/dateUtils';
import { Customer, BulkLedger } from '../types/database';

type TabType = 'customers' | 'settlement';

export const CustomersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bulkLedgers, setBulkLedgers] = useState<BulkLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [bulkForm, setBulkForm] = useState({
    customerId: '',
    quantity: '',
    pricePerUnit: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, bulkRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('bulk_ledger').select('*').order('created_at', { ascending: false }),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (bulkRes.error) throw bulkRes.error;

      setCustomers(customersRes.data || []);
      setBulkLedgers(bulkRes.data || []);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!formData.name) {
      setSnackbar({ visible: true, message: 'Please enter customer name' });
      return;
    }

    try {
      const { error } = await supabase.from('customers').insert({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        bulk_ledger_type: 'postpaid',
      });

      if (error) throw error;
      setSnackbar({ visible: true, message: 'Customer added' });
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '' });
      fetchData();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to save customer',
      });
    }
  };

  const handleAddBulkEntry = async () => {
    if (!bulkForm.customerId || !bulkForm.quantity || !bulkForm.pricePerUnit) {
      setSnackbar({ visible: true, message: 'Please fill all fields' });
      return;
    }

    try {
      const quantity = parseInt(bulkForm.quantity);
      const pricePerUnit = parseFloat(bulkForm.pricePerUnit);
      const totalAmount = quantity * pricePerUnit;

      const { error } = await supabase.from('bulk_ledger').insert({
        customer_id: bulkForm.customerId,
        quantity,
        price_per_unit: pricePerUnit,
        total_amount: totalAmount,
        settled: false,
      });

      if (error) throw error;
      setSnackbar({ visible: true, message: 'Bulk entry added' });
      setBulkForm({ customerId: '', quantity: '', pricePerUnit: '' });
      fetchData();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to add bulk entry',
      });
    }
  };

  const handleSettleBulk = async (ledgerId: string) => {
    try {
      const { error } = await supabase
        .from('bulk_ledger')
        .update({ settled: true, settled_on: new Date().toISOString() })
        .eq('id', ledgerId);

      if (error) throw error;
      setSnackbar({ visible: true, message: 'Bulk entry settled' });
      fetchData();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to settle',
      });
    }
  };

  const unsettledEntries = bulkLedgers.filter((entry) => !entry.settled);
  const unsettledTotal = unsettledEntries.reduce((sum, entry) => sum + entry.total_amount, 0);

  return (
    <View style={styles.container}>
      {/* Tab Buttons */}
      <View style={styles.tabs}>
        <Button
          mode={activeTab === 'customers' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('customers')}
          style={styles.tabButton}
        >
          Customers
        </Button>
        <Button
          mode={activeTab === 'settlement' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('settlement')}
          style={styles.tabButton}
        >
          Settlement
        </Button>
      </View>

      {activeTab === 'customers' ? (
        // Customers Tab
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Customers ({customers.length})</Text>
            <Button
              mode="contained"
              onPress={() => {
                setFormData({ name: '', phone: '', email: '' });
                setShowModal(true);
              }}
              style={styles.addButton}
            >
              + Add
            </Button>
          </View>

          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              animating
              size="large"
              color={colors.primary}
            />
          ) : customers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No customers yet</Text>
            </View>
          ) : (
            <FlatList
              data={customers}
              scrollEnabled={true}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: customer }) => (
                <Card style={styles.customerCard}>
                  <View style={styles.customerContent}>
                    <View>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      {customer.phone && (
                        <Text style={styles.customerPhone}>{customer.phone}</Text>
                      )}
                      {customer.email && (
                        <Text style={styles.customerEmail}>{customer.email}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              )}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
      ) : (
        // Settlement Tab
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {/* Unsettled Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Pending Settlement</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(unsettledTotal)}</Text>
              <Text style={styles.summaryCount}>{unsettledEntries.length} entries</Text>
            </Card.Content>
          </Card>

          {/* Add Bulk Entry Form */}
          <Card style={styles.formCard}>
            <Card.Title title="Add Bulk Entry" />
            <Card.Content>
              <Text style={styles.formLabel}>Select Customer:</Text>
              <FlatList
                data={customers}
                horizontal
                scrollEnabled={true}
                contentContainerStyle={styles.customerList}
                renderItem={({ item }) => (
                  <Button
                    mode={bulkForm.customerId === item.id ? 'contained' : 'outlined'}
                    onPress={() => setBulkForm({ ...bulkForm, customerId: item.id })}
                    style={styles.customerButton}
                  >
                    {item.name.substring(0, 10)}
                  </Button>
                )}
                keyExtractor={(item) => item.id}
              />

              <TextInput
                label="Quantity"
                value={bulkForm.quantity}
                onChangeText={(text) => setBulkForm({ ...bulkForm, quantity: text })}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Price per Unit (₹)"
                value={bulkForm.pricePerUnit}
                onChangeText={(text) => setBulkForm({ ...bulkForm, pricePerUnit: text })}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleAddBulkEntry}
                style={styles.submitButton}
              >
                Add Bulk Entry
              </Button>
            </Card.Content>
          </Card>

          {/* Pending Entries */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Pending Entries</Text>
          </View>

          {unsettledEntries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>All settled!</Text>
              </Card.Content>
            </Card>
          ) : (
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.tableCol1}>Customer</DataTable.Title>
                <DataTable.Title numeric style={styles.tableCol2}>
                  Qty
                </DataTable.Title>
                <DataTable.Title numeric style={styles.tableCol3}>
                  Amount
                </DataTable.Title>
                <DataTable.Title style={styles.tableCol4}>Action</DataTable.Title>
              </DataTable.Header>

              {unsettledEntries.map((entry) => {
                const customer = customers.find((c) => c.id === entry.customer_id);
                return (
                  <DataTable.Row key={entry.id} style={styles.tableRow}>
                    <DataTable.Cell style={styles.tableCol1}>
                      <Text style={styles.tableCellText}>{customer?.name.substring(0, 10)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.tableCol2}>
                      <Text style={styles.tableCellText}>{entry.quantity}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.tableCol3}>
                      <Text style={styles.tableCellText}>
                        {formatCurrency(entry.total_amount)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.tableCol4}>
                      <IconButton
                        icon="check"
                        size={16}
                        iconColor={colors.success}
                        onPress={() => handleSettleBulk(entry.id)}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          )}
        </ScrollView>
      )}

      {/* Add Customer Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.text}
                onPress={() => setShowModal(false)}
              />
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput
                label="Customer Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Phone (optional)"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Email (optional)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                mode="outlined"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleSaveCustomer}
                style={styles.submitButton}
              >
                Add Customer
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: spacing.md,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
  customerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  customerContent: {
    padding: spacing.md,
  },
  customerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  customerPhone: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  customerEmail: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  summaryLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  summaryAmount: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  summaryCount: {
    color: colors.white,
    fontSize: 12,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    borderColor: colors.border,
    borderWidth: 1,
  },
  formLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  customerList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customerButton: {
    marginRight: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.surface,
  },
  tableHeader: {
    backgroundColor: colors.primary,
  },
  tableRow: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  tableCol1: { flex: 1.5 },
  tableCol2: { flex: 1 },
  tableCol3: { flex: 1.2 },
  tableCol4: { flex: 0.8 },
  tableCellText: {
    color: colors.text,
    fontSize: 12,
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
    maxHeight: '80%',
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
});
