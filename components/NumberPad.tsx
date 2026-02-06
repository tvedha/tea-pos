import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../constants/theme';

interface NumberPadProps {
  onAddAmount: (amount: string) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({ onAddAmount }) => {
  const [display, setDisplay] = useState('0');

  const handleNumber = (num: string) => {
    console.log(`Number ${num} pressed`);
    setDisplay((prev) => (prev === '0' ? num : prev + num).slice(0, 12));
  };

  const handleDecimal = () => {
    if (!display.includes('.')) setDisplay((prev) => prev + '.');
  };

  const handleClear = () => {
    console.log('Clear (C) pressed');
    setDisplay('0');
  };

  const handleDeleteLast = () => {
    console.log('Delete/Backspace pressed');
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEnter = () => {
    console.log(`Enter pressed - finalizing amount: ${display}`);
    const val = parseFloat(display.replace(/,/g, '')) || 0;
    if (val > 0) {
      onAddAmount(val.toString());
      setDisplay('0');
    }
  };

  const buttons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '.'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.displayText}>{display}</Text>
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
                <Text style={[styles.buttonText, b === 'C' && styles.clearButtonText]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actionsRowBottom}>
        <TouchableOpacity style={[styles.actionButton]} onPress={handleDeleteLast}>
          <Text style={styles.operationButtonText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.enterButtonLarge]} onPress={handleEnter}>
          <Text style={styles.enterButtonText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  displayContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  displayText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  grid: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  button: {
    minWidth: 56,
    minHeight: 56,
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.error,
  },
  clearButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  operationButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  enterButtonLarge: {
    flex: 2,
    backgroundColor: colors.success,
    minHeight: 56,
    marginLeft: spacing.xs,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsRowBottom: {
    flexDirection: 'row',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    minHeight: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
});

export default NumberPad;
