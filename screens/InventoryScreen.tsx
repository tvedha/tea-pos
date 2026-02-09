import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import { Product } from '../types/database';
import { formatDate } from '../utils/dateUtils';

// Added for feature 6: Inventory screen
interface InventoryLog {
  id: string;
  product_id: string;
  change_type: 'add' | 'reduce';
  quantity: number;
  cost: number | null;
  change_date: string;
  notes: string | null;
}

export const InventoryScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const [addStockForm, setAddStockForm] = useState({
    quantity: '',
    cost: '',
    notes: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchInventoryData();
    }, [])
  );

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      // Fetch products with current_stock
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productError) throw productError;
      setProducts(productData || []);

      // Fetch inventory logs
      const { data: logData, error: logError } = await supabase
        .from('inventory_logs')
        .select('*')
        .order('change_date', { ascending: false });

      if (logError) throw logError;
      setInventoryLogs(logData || []);
      console.log(`✓ Inventory data loaded (${productData?.length || 0} products)`);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to load inventory',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct || !addStockForm.quantity) {
      setSnackbar({ visible: true, message: 'Please fill required fields' });
      return;
    }

    try {
      const quantity = parseInt(addStockForm.quantity);
      const cost = addStockForm.cost ? parseFloat(addStockForm.cost) : null;

      if (isNaN(quantity) || quantity <= 0) {
        setSnackbar({ visible: true, message: 'Please enter valid quantity' });
        return;
      }

      // Add inventory log
      const { error: logError } = await supabase.from('inventory_logs').insert({
        product_id: selectedProduct.id,
        change_type: 'add',
        quantity,
        cost,
        notes: addStockForm.notes || null,
      });

      if (logError) throw logError;

      // Update product current_stock
      const currentStock = (selectedProduct as any).current_stock || 0;
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: currentStock + quantity })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      setSnackbar({ visible: true, message: 'Stock added successfully' });
      setShowAddStockModal(false);
      setSelectedProduct(null);
      setAddStockForm({ quantity: '', cost: '', notes: '' });
      fetchInventoryData();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to add stock',
      });
    }
  };

  const handleReduceStock = async (product: Product, quantity: number) => {
    try {
      const currentStock = (product as any).current_stock || 0;
      if (currentStock < quantity) {
        setSnackbar({ visible: true, message: 'Insufficient stock' });
        return;
      }

      // Add inventory log for reduction
      const { error: logError } = await supabase.from('inventory_logs').insert({
        product_id: product.id,
        change_type: 'reduce',
        quantity,
        cost: null,
        notes: 'Sold via transaction',
      });

      if (logError) throw logError;

      // Update product current_stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: currentStock - quantity })
        .eq('id', product.id);

      if (updateError) throw updateError;

      fetchInventoryData();
    } catch (error: any) {
      console.error('Failed to reduce stock:', error);
    }
  };

  const getProductLogsHistory = (productId: string) => {
    return inventoryLogs.filter((log) => log.product_id === productId);
  };

  const getProductStock = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return (product as any)?.current_stock || 0;
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 0 ? 'contained' : 'outlined'}
          onPress={() => setActiveTab(0)}
          style={styles.tabButton}
        >
          Stock
        </Button>
        <Button
          mode={activeTab === 1 ? 'contained' : 'outlined'}
          onPress={() => setActiveTab(1)}
          style={styles.tabButton}
        >
          History
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          animating
          size="large"
          color={colors.primary}
        />
      ) : activeTab === 0 ? (
        // Stock Tab
        <FlatList
          data={products}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: product }) => {
            const stock = getProductStock(product.id);
            const isLowStock = stock < 10;
            return (
              <Card
                style={[
                  styles.productCard,
                  isLowStock && styles.lowStockCard,
                ]}
              >
                <View style={styles.productContent}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <View style={styles.stockRow}>
                      <Text style={styles.stockLabel}>Stock: </Text>
                      <Text
                        style={[
                          styles.stockValue,
                          isLowStock && styles.lowStockValue,
                        ]}
                      >
                        {stock} {product.unit}
                      </Text>
                      {isLowStock && (
                        <Text style={styles.lowStockWarning}> ⚠️ Low</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setSelectedProduct(product);
                        setShowAddStockModal(true);
                      }}
                      style={styles.actionButton}
                    >
                      Add
                    </Button>
                    <IconButton
                      icon="history"
                      size={20}
                      iconColor={colors.primary}
                      onPress={() => {
                        setSelectedProduct(product);
                        setShowHistoryModal(true);
                      }}
                    />
                  </View>
                </View>
              </Card>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      ) : (
        // History Tab
        <FlatList
          data={inventoryLogs}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: log }) => {
            const product = products.find((p) => p.id === log.product_id);
            return (
              <Card style={styles.logCard}>
                <View style={styles.logContent}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logProduct}>
                      {product?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.logType}>
                      {log.change_type === 'add' ? '➕ Stock Added' : '➖ Sold'}
                    </Text>
                    {log.notes && (
                      <Text style={styles.logNotes}>{log.notes}</Text>
                    )}
                    <Text style={styles.logDate}>
                      {formatDate(new Date(log.change_date))}
                    </Text>
                  </View>
                  <View style={styles.logAmount}>
                    <Text
                      style={[
                        styles.logQuantity,
                        log.change_type === 'add'
                          ? styles.addQuantity
                          : styles.reduceQuantity,
                      ]}
                    >
                      {log.change_type === 'add' ? '+' : '−'} {log.quantity}{' '}
                      {product?.unit}
                    </Text>
                    {log.cost && (
                      <Text style={styles.logCost}>
                        ₹{(log.cost * log.quantity).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Add Stock Modal */}
      <Modal
        visible={showAddStockModal && selectedProduct !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowAddStockModal(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Stock: {selectedProduct?.name}
              </Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.text}
                onPress={() => {
                  setShowAddStockModal(false);
                  setSelectedProduct(null);
                }}
              />
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput
                label="Quantity"
                value={addStockForm.quantity}
                onChangeText={(text) =>
                  setAddStockForm({ ...addStockForm, quantity: text })
                }
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Cost per Unit (₹) - optional"
                value={addStockForm.cost}
                onChangeText={(text) =>
                  setAddStockForm({ ...addStockForm, cost: text })
                }
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Notes (optional)"
                value={addStockForm.notes}
                onChangeText={(text) =>
                  setAddStockForm({ ...addStockForm, notes: text })
                }
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />

              <Button
                mode="contained"
                onPress={handleAddStock}
                style={styles.submitButton}
              >
                Add Stock
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal && selectedProduct !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowHistoryModal(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                History: {selectedProduct?.name}
              </Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.text}
                onPress={() => {
                  setShowHistoryModal(false);
                  setSelectedProduct(null);
                }}
              />
            </View>

            <FlatList
              data={getProductLogsHistory(selectedProduct?.id || '')}
              scrollEnabled={true}
              contentContainerStyle={styles.historyContent}
              renderItem={({ item: log }) => (
                <Card style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Text
                      style={[
                        styles.historyChange,
                        log.change_type === 'add'
                          ? styles.addChange
                          : styles.reduceChange,
                      ]}
                    >
                      {log.change_type === 'add' ? '➕' : '➖'} {log.quantity} {selectedProduct?.unit}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(new Date(log.change_date))}
                    </Text>
                  </View>
                </Card>
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Card style={styles.emptyCard}>
                  <Card.Content>
                    <Text style={styles.emptyText}>No history yet</Text>
                  </Card.Content>
                </Card>
              }
            />
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
  tabsContainer: {
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
  loader: {
    marginVertical: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  lowStockCard: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  productContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productCategory: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  stockValue: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  lowStockValue: {
    color: colors.error,
    fontWeight: '700',
  },
  lowStockWarning: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  logContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logProduct: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  logType: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  logNotes: {
    color: colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  logDate: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  logAmount: {
    alignItems: 'flex-end',
  },
  logQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  addQuantity: {
    color: colors.success,
  },
  reduceQuantity: {
    color: colors.error,
  },
  logCost: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
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
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  historyContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  historyChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  addChange: {
    color: colors.success,
  },
  reduceChange: {
    color: colors.error,
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: colors.surface,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
  },
});
