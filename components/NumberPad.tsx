import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';

interface NumberPadProps {
  onAddAmount: (amount: string) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({ onAddAmount }) => {
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('0');
  const [activeField, setActiveField] = useState<'qty' | 'price'>('price');

  const handleNumber = (num: string) => {
    if (activeField === 'price') {
      setPrice((prev) => (prev === '0' ? num : prev + num).slice(0, 10));
    } else {
      setQty((prev) => (prev === '1' ? num : prev + num).slice(0, 5));
    }
  };

  const handleDecimal = () => {
    if (activeField === 'price' && !price.includes('.')) {
      setPrice((prev) => prev + '.');
    }
  };

  const handleClear = () => {
    setPrice('0');
    setQty('1');
    setActiveField('price');
  };

  const handleDeleteLast = () => {
    if (activeField === 'price') {
      setPrice((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else {
      setQty((prev) => (prev.length > 1 ? prev.slice(0, -1) : '1'));
    }
  };

  const handleEnter = () => {
    const p = parseFloat(price);
    const q = parseFloat(qty);
    if (p > 0) {
      // Send as "qty*price" format
      onAddAmount(`${q}*${p}`);
      handleClear();
    }
  };

  const buttons = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['C', '0', '.']];

  return (
    <View style={styles.container}>
      {/* Dual Display Area */}
      <View style={styles.displayWrapper}>
        <TouchableOpacity 
          style={[styles.displayBox, activeField === 'qty' && styles.activeBox]} 
          onPress={() => setActiveField('qty')}
        >
          <Text style={styles.label}>QTY</Text>
          <Text style={styles.valueText}>{qty}</Text>
        </TouchableOpacity>

        <Text style={styles.multiplierSymbol}>×</Text>

        <TouchableOpacity 
          style={[styles.displayBox, activeField === 'price' && styles.activeBox]} 
          onPress={() => setActiveField('price')}
        >
          <Text style={styles.label}>PRICE</Text>
          <Text style={styles.valueText}>{price}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {buttons.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.button, b === 'C' && styles.clearButton]}
                onPress={() => {
                  if (b === 'C') return handleClear();
                  if (b === '.') return handleDecimal();
                  return handleNumber(b);
                }}
              >
                <Text style={styles.buttonText}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actionsRowBottom}>
        <TouchableOpacity 
          style={[styles.actionButton, activeField === 'qty' && { backgroundColor: colors.primary }]} 
          onPress={() => setActiveField(activeField === 'price' ? 'qty' : 'price')}
        >
          <Text style={styles.operationButtonText}>{activeField === 'price' ? 'Edit Qty' : 'Edit Price'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteLast}>
          <Text style={styles.operationButtonText}>⌫</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.enterButtonLarge} onPress={handleEnter}>
          <Text style={styles.enterButtonText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  displayWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 10 },
  displayBox: { flex: 1, backgroundColor: colors.background, padding: 8, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  activeBox: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  label: { fontSize: 10, color: colors.textSecondary, fontWeight: 'bold' },
  valueText: { fontSize: 12, fontWeight: 'bold', color: colors.primary, textAlign: 'right' },
  multiplierSymbol: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary },
  grid: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  button: { flex: 1, height: 48, marginHorizontal: 4, backgroundColor: colors.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clearButton: { backgroundColor: colors.error },
  actionsRowBottom: { flexDirection: 'row', gap: 8, marginTop: 5 },
  actionButton: { flex: 1.2, backgroundColor: '#555', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  operationButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  enterButtonLarge: { flex: 1, backgroundColor: colors.success, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  enterButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});