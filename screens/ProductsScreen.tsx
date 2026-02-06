import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { Button, Card, Text, TextInput, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import { Product } from '../types/database';

export const ProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Tea',
    unit: 'cup',
  });

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
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to load products',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        unit: product.unit,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', category: 'Tea', unit: 'cup' });
    }
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      setSnackbar({ visible: true, message: 'Please fill all fields' });
      return;
    }

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setSnackbar({ visible: true, message: 'Please enter valid price' });
        return;
      }

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            price,
            category: formData.category,
            unit: formData.unit,
          })
          .eq('id', editingId);

        if (error) throw error;
        setSnackbar({ visible: true, message: 'Product updated' });
      } else {
        // Insert
        const { error } = await supabase.from('products').insert({
          name: formData.name,
          price,
          category: formData.category,
          unit: formData.unit,
        });

        if (error) throw error;
        setSnackbar({ visible: true, message: 'Product added' });
      }

      setShowModal(false);
      fetchProducts();
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Failed to save product',
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id);

            if (error) throw error;
            setSnackbar({ visible: true, message: 'Product deleted' });
            fetchProducts();
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Button
          mode="contained"
          onPress={() => handleOpenForm()}
          style={styles.addButton}
          labelStyle={styles.addButtonLabel}
        >
          + Add Product
        </Button>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          animating
          size="large"
          color={colors.primary}
        />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No products yet</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: product }) => (
            <Card style={styles.productCard}>
              <View style={styles.productContent}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.metaText}>{product.category}</Text>
                    <Text style={styles.metaText}>·</Text>
                    <Text style={styles.metaText}>{product.unit}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
                </View>
                <View style={styles.productActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor={colors.primary}
                    onPress={() => handleOpenForm(product)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => handleDeleteProduct(product.id)}
                  />
                </View>
              </View>
            </Card>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Product' : 'Add Product'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={colors.text}
                onPress={() => setShowModal(false)}
              />
            </View>

            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent}>
              <TextInput
                label="Product Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                mode="outlined"
                style={styles.input}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                label="Price (₹)"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                label="Category"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                mode="outlined"
                style={styles.input}
                placeholder="Tea, Biscuit, Lunch, Milk"
              />

              <TextInput
                label="Unit"
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                mode="outlined"
                style={styles.input}
                placeholder="cup, pack, etc."
              />

              <Button
                mode="contained"
                onPress={handleSaveProduct}
                style={styles.saveButton}
              >
                {editingId ? 'Update' : 'Add'} Product
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  productCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
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
  productMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
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
  modalFormContent: {
    paddingBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
});
