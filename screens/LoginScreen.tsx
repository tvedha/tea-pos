import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Text, Snackbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../constants/theme';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setSnackbar({ visible: true, message: 'Please enter email and password' });
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      setSnackbar({ visible: true, message: 'Logged in successfully!' });
    } catch (error: any) {
      setSnackbar({
        visible: true,
        message: error.message || 'Login failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Chai POS</Text>
        <Text style={styles.subtitle}>Tea Shop Billing</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
          editable={!loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          editable={!loading}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Login
        </Button>

        <Text style={styles.footer}>
          Test user: tamil@teashop.com / Password: Test@123
        </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
