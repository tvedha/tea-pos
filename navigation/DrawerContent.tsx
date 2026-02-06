import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Drawer as PaperDrawer, 
  Avatar, 
  Text, 
  Divider, 
  useTheme,
  Surface,
  TouchableRipple
} from 'react-native-paper';
import { 
  DrawerContentComponentProps, 
  DrawerContentScrollView 
} from '@react-navigation/drawer';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext'; // Added back

export const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const theme = useTheme();
  const { state, navigation } = props;
  const { signOut, user } = useAuth(); // Destructure auth functions
  
  const activeRouteName = state.routeNames[state.index];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* Header Section with User Info */}
        <Surface style={styles.headerSection} elevation={1}>
          <Avatar.Icon 
            size={54} 
            icon="account" 
            style={{ backgroundColor: colors.primary }} 
            color="white" 
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.brandName}>Tea POS</Text>
            {user?.email && (
              <Text numberOfLines={1} style={styles.userEmail}>
                {user.email}
              </Text>
            )}
          </View>
        </Surface>

        <View style={styles.drawerContent}>
          <PaperDrawer.Section title="Main Menu" showDivider={false}>
            <PaperDrawer.Item
              icon="view-dashboard"
              label="Dashboard"
              active={activeRouteName === 'Dashboard'}
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.drawerItem}
            />
            <PaperDrawer.Item
              icon="calculator"
              label="Quick Bill"
              active={activeRouteName === 'BillTabNavigator'}
              onPress={() => navigation.navigate('BillTabNavigator', { screen: 'QuickBill' })}
              style={styles.drawerItem}
            />
            <PaperDrawer.Item
              icon="food-outline"
              label="Products"
              active={activeRouteName === 'Products'}
              onPress={() => navigation.navigate('Products')}
              style={styles.drawerItem}
            />
          </PaperDrawer.Section>

          <Divider style={styles.divider} />

          <PaperDrawer.Section title="Analytics" showDivider={false}>
            <PaperDrawer.Item
              icon="file-chart"
              label="Reports"
              onPress={() => navigation.navigate('BillTabNavigator', { screen: 'BillReport' })}
              style={styles.drawerItem}
            />
            <PaperDrawer.Item
              icon="account-group"
              label="Customers"
              active={activeRouteName === 'Customers'}
              onPress={() => navigation.navigate('Customers')}
              style={styles.drawerItem}
            />
          </PaperDrawer.Section>

          <Divider style={styles.divider} />

          <PaperDrawer.Section showDivider={false}>
            <PaperDrawer.Item
              icon="cog"
              label="Settings"
              active={activeRouteName === 'Settings'}
              onPress={() => navigation.navigate('Settings')}
              style={styles.drawerItem}
            />
          </PaperDrawer.Section>
        </View>
      </DrawerContentScrollView>

      {/* Logout & Footer Section */}
      <View style={styles.footerSection}>
        <PaperDrawer.Item
          icon="logout"
          label="Sign Out"
          onPress={handleLogout}
          style={[styles.drawerItem, { backgroundColor: '#fff5f5' }]}
        />
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.4 Beta</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: spacing.sm,
  },
  divider: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    height: 0.5,
  },
  footerSection: {
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  versionText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});