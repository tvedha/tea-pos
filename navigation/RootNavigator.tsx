import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Splash screen or loading indicator could be shown here
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};
