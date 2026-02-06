import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { theme } from '@/constants/theme';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AuthProvider>
          <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
