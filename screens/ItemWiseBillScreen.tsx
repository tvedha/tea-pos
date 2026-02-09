import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  DataTable,
  IconButton,
  SegmentedButtons,
  Snackbar,
  Text
} from 'react-native-paper';
import { colors, spacing } from '../constants/theme';
import { supabase } from '../services/supabase';
import { BillItem, Product } from '../types/database';
import { formatCurrency } from '../utils/dateUtils';

type Category = 'ALL' | 'Tea' | 'Biscuit' | 'Lunch' | 'Milk';

export const ItemWiseBillScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('ALL');
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  // Added for feature 4: Payment mode selector
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay'>('cash');

  const categories: Category[] = ['ALL', 'Tea', 'Biscuit', 'Lunch', 'Milk'];

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').order('name');

      if (error) throw error;
      setProducts(data || []);
      filterByCategory('ALL', data || []);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to load products',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (category: Category, productsList: Product[]) => {
    setSelectedCategory(category);
    if (category === 'ALL') {
      setFilteredProducts(productsList);
    } else {
      setFilteredProducts(productsList.filter((p) => p.category === category));
    }
  };

  const handleAddProduct = (product: Product) => {
    const existingItem = cartItems.find((item) => item.productId === product.id);

    if (existingItem) {
      // Increase quantity
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.rate }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: BillItem = {
        id: product.id,
        productId: product.id,
        description: product.name,
        quantity: 1,
        rate: product.price,
        total: product.price,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(
      cartItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, total: newQty * item.rate }
              : null;
          }
          return item;
        })
        .filter((item) => item !== null) as BillItem[]
    );
  };

  const handleDeleteItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => setCartItems([]),
        style: 'destructive',
      },
    ]);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handleSave = async () => {
    if (cartItems.length === 0) {
      setSnackbar({ visible: true, message: 'Add items to save bill' });
      return;
    }

    setSaving(true);
    try {
      // Insert transaction
      const { data: txn, error: txnError } = await supabase
        .from('transactions')
        .insert({
          bill_type: 'products',
          total_amount: totalAmount,
          payment_mode: paymentMode,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Insert transaction items
      const itemsToInsert = cartItems.map((item) => ({
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

      setCartItems([]);
      console.log(`✓ Item Wise Bill saved with ${paymentMode} payment mode`);
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to save bill',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => filterByCategory(cat, products)}
            style={[
              styles.chip,
              selectedCategory === cat && styles.chipSelected,
            ]}
            textStyle={[
              styles.chipText,
              selectedCategory === cat && styles.chipTextSelected,
            ]}
          >
            {cat}
          </Chip>
        ))}
      </ScrollView> */}

      {/* Products Grid */}
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          animating
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productGrid}
          renderItem={({ item: product }) => (
            <Card style={styles.productCard} onPress={() => handleAddProduct(product)}>
              <View style={styles.productCardContent}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                <Button
                  mode="contained"
                  onPress={() => handleAddProduct(product)}
                  style={styles.addButton}
                  labelStyle={styles.addButtonLabel}
                >
                  Add
                </Button>
              </View>
            </Card>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Bottom Cart Section */}
      <View style={styles.bottomContainer}>
        {/* Cart Items Preview */}
        {cartItems.length > 0 && (
          <ScrollView
            style={styles.cartPreview}
            contentContainerStyle={styles.cartPreviewContent}
          >
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.colName}>Item</DataTable.Title>
                <DataTable.Title numeric style={styles.colQty}>
                  Qty
                </DataTable.Title>
                <DataTable.Title numeric style={styles.colRate}>
                  Rate
                </DataTable.Title>
                <DataTable.Title style={styles.colAction}>Action</DataTable.Title>
              </DataTable.Header>

              {cartItems.map((item) => (
                <DataTable.Row key={item.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.colName}>
                    <Text style={styles.cellText}>{item.description.substring(0, 12)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.colQty}>
                    <Text style={styles.cellText}>{item.quantity}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.colRate}>
                    <Text style={styles.cellText}>{formatCurrency(item.rate)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.colAction}>
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
          </ScrollView>
        )}

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View>
              <Text style={styles.summaryLabel}>Items: {cartItems.length}</Text>
              <Text style={styles.summaryLabel}>Total: {formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </Card>

        {/* Added for feature 4: Payment Mode Selector */}
        {cartItems.length > 0 && (
          <Card style={styles.paymentCard}>
            <Card.Content>
              <Text style={styles.paymentLabel}>Payment Mode</Text>
              <SegmentedButtons
                value={paymentMode}
                onValueChange={(value) => setPaymentMode(value as 'cash' | 'gpay')}
                buttons={[
                  { value: 'cash', label: 'Cash', icon: 'cash' },
                  { value: 'gpay', label: 'GPay', icon: 'google-pay' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleClearCart}
            disabled={cartItems.length === 0}
            textColor={colors.error}
            style={styles.actionButton}
          >
            Clear
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || cartItems.length === 0}
            style={styles.actionButton}
          >
            Save
          </Button>
        </View>
      </View>

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
  categoryScroll: {
    backgroundColor: colors.surface,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  productGrid: {
    padding: spacing.md,
    gap: spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  productCardContent: {
    padding: spacing.md,
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productCategory: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomContainer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: spacing.md,
  },
  cartPreview: {
    maxHeight: 150,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  cartPreviewContent: {
    minHeight: 150,
  },
  tableHeader: {
    backgroundColor: colors.primary,
  },
  tableRow: {
    backgroundColor: colors.background,
  },
  colName: { flex: 1.5 },
  colQty: { flex: 0.8 },
  colRate: { flex: 1 },
  colAction: { flex: 0.6 },
  cellText: {
    color: colors.text,
    fontSize: 11,
  },
  summaryCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderColor: colors.primary,
    borderWidth: 2,
  },  // Added for feature 4: Payment mode styles
  paymentCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  paymentLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    marginBottom: 0,
  },  summaryContent: {
    padding: spacing.md,
  },
  summaryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
