import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Switch, Card, Text, TextInput, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../constants/theme';

export const SettingsScreen: React.FC = () => {
  const { signOut, user } = useAuth();
  const [printerSettings, setPrinterSettings] = useState({
    enablePrinter: false,
    printerAddress: '',
    paperWidth: '80',
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Logout failed');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account Section */}
      <Card style={styles.card}>
        <Card.Title title="Account" subtitle={user?.email} />
        <Card.Content>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            textColor={colors.error}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Printer Settings */}
      <Card style={styles.card}>
        <Card.Title title="Printer Settings" />
        <Card.Content>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Thermal Printer</Text>
            <Switch
              value={printerSettings.enablePrinter}
              onValueChange={(val) =>
                setPrinterSettings({ ...printerSettings, enablePrinter: val })
              }
            />
          </View>

          {printerSettings.enablePrinter && (
            <>
              <Divider style={styles.divider} />
              <TextInput
                label="Printer Address (Bluetooth MAC)"
                value={printerSettings.printerAddress}
                onChangeText={(text) =>
                  setPrinterSettings({ ...printerSettings, printerAddress: text })
                }
                mode="outlined"
                style={styles.input}
                placeholder="00:1A:7D:DA:71:13"
              />

              <TextInput
                label="Paper Width (mm)"
                value={printerSettings.paperWidth}
                onChangeText={(text) =>
                  setPrinterSettings({ ...printerSettings, paperWidth: text })
                }
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                placeholder="80"
              />

              <Button
                mode="contained"
                onPress={() => {
                  Alert.alert(
                    'Test Printer',
                    'Testing printer connection... (Placeholder)'
                  );
                }}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Test Print
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Title title="App Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.label}>App Name:</Text>
            <Text style={styles.value}>Chai POS</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Build Date:</Text>
            <Text style={styles.value}>Feb 6, 2026</Text>
          </View>
        </Card.Content>
      </Card>
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
    marginBottom: spacing.lg,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: colors.border,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
});
