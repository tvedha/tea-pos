import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text, Divider, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../constants/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

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
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Avatar.Icon
              size={56}
              icon="account-circle"
              style={{ backgroundColor: colors.primary }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] || 'Shop Owner'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'loading...'}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          labelStyle={styles.logoutLabel}
          icon={() => <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />}
        >
          Logout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    backgroundColor: colors.border,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  logoutButton: {
    borderColor: colors.primary,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
