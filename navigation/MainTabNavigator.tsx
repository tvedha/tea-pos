import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../constants/theme';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { QuickBillScreen } from '../screens/QuickBillScreen';
import { ItemWiseBillScreen } from '../screens/ItemWiseBillScreen';
import { BillReportScreen } from '../screens/BillReportScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Drawer Menu
import { CustomDrawerContent } from './DrawerContent';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    height: 52,
    paddingVertical: 4,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '600' as const,
    color: colors.text,
    fontSize: 16,
  },
};

// Bill Stack (contains Quick Bill, Item Wise, Report)
const BillStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="QuickBillMain"
        component={QuickBillScreen}
        options={{ title: 'Quick Bill' }}
      />
    </Stack.Navigator>
  );
};

// Item Wise Stack
const ItemStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ItemWiseBillMain"
        component={ItemWiseBillScreen}
        options={{ title: 'Item Wise Bill' }}
      />
    </Stack.Navigator>
  );
};

// Report Stack
const ReportStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="BillReportMain"
        component={BillReportScreen}
        options={{ title: 'Bill Report' }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator (Quick Bill, Item Wise, Report)
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderRadius: 12,
          marginHorizontal: 10,
          marginBottom: 10,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="QuickBill"
        component={BillStack}
        options={{
          title: 'Quick Bill',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightning-bolt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ItemWiseBill"
        component={ItemStack}
        options={{
          title: 'Item Wise',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="basket" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="BillReport"
        component={ReportStack}
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-box" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator (Main app structure)
const DrawerNavigatorWithMenu = () => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        ...screenOptions,
        headerShown: true,
        headerLeft: ({ tintColor }) => (
          <TouchableOpacity
            onPress={() => {
              console.log('Hamburger pressed - Opening drawer');
              console.log('navigation object:', navigation);
              navigation.dispatch(DrawerActions.toggleDrawer());
            }}
            style={{ paddingLeft: 12 }}
          >
            <MaterialCommunityIcons name="menu" size={24} color={tintColor} />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="BillTabNavigator"
        component={TabNavigator}
        options={{
          title: 'Billing',
          drawerLabel: 'Billing',
          headerTitle: 'Billing',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          headerTitle: 'Products',
        }}
      />
      <Drawer.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'Customers & Bulk',
          headerTitle: 'Customers & Bulk Orders',
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
    </Drawer.Navigator>
  );
};

export const MainTabNavigator: React.FC = DrawerNavigatorWithMenu;
