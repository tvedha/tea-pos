import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import { colors } from '../constants/theme';

// Screens
import { BillReportScreen } from '../screens/BillReportScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ItemWiseBillScreen } from '../screens/ItemWiseBillScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { QuickBillScreen } from '../screens/QuickBillScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CustomDrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarStyle: { height: 60, paddingBottom: 10 },
    }}
  >
     <Tab.Screen 
      name="DashboardTab" 
      component={DashboardScreen} 
      options={{ 
        title: 'Dashboard',
        tabBarIcon: ({color}) => <MaterialCommunityIcons name="view-dashboard" color={color} size={24}/> 
      }}
    />
    <Tab.Screen 
      name="QuickBillTab" 
      component={QuickBillScreen} 
      options={{ 
        title: 'Quick Bill',
        tabBarIcon: ({color}) => <MaterialCommunityIcons name="lightning-bolt" color={color} size={24}/> 
      }}
    />
    <Tab.Screen 
      name="ItemWiseTab" 
      component={ItemWiseBillScreen} 
      options={{ 
        title: 'Item Wise',
        tabBarIcon: ({color}) => <MaterialCommunityIcons name="basket" color={color} size={24}/> 
      }}
    />
    <Tab.Screen 
      name="ReportTab" 
      component={BillReportScreen} 
      options={{ 
        title: 'Reports',
        tabBarIcon: ({color}) => <MaterialCommunityIcons name="chart-box" color={color} size={24}/> 
      }}
    />
  </Tab.Navigator>
);

export const MainTabNavigator = () => {
  const { width } = useWindowDimensions();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        drawerStyle: { width: width * 0.75 },
        drawerType: 'front',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.toggleDrawer()} 
            style={{ marginLeft: 15 }}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.primary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen 
        name="BillingGroup" 
        component={TabNavigator} 
        options={{ title: 'Billing & Reports' }} 
      />
      <Drawer.Screen name="Products" component={ProductsScreen} />
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      {/* Added for feature 5: Expenses route */}
      <Drawer.Screen name="Expenses" component={ExpensesScreen} />
      {/* Added for feature 6: Inventory route */}
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};