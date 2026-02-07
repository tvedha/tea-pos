import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useWindowDimensions, TouchableOpacity } from 'react-native';
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
import { CustomDrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarStyle: { height: 60, paddingBottom: 10 },
    }}
  >
    <Tab.Screen 
      name="QuickBill" 
      component={QuickBillScreen} 
      options={{ tabBarIcon: ({color}) => <MaterialCommunityIcons name="lightning-bolt" color={color} size={24}/> }}
    />
    <Tab.Screen 
      name="ItemWise" 
      component={ItemWiseBillScreen} 
      options={{ tabBarIcon: ({color}) => <MaterialCommunityIcons name="basket" color={color} size={24}/> }}
    />
    <Tab.Screen 
      name="Report" 
      component={BillReportScreen} 
      options={{ tabBarIcon: ({color}) => <MaterialCommunityIcons name="chart-box" color={color} size={24}/> }}
    />
  </Tab.Navigator>
);

// Main Drawer
export const MainTabNavigator = () => {
  const { width } = useWindowDimensions();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        drawerStyle: { width: width * 0.75 }, // Sidebar width fixed
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
      <Drawer.Screen name="Billing" component={TabNavigator} />
      <Drawer.Screen name="Products" component={ProductsScreen} />
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};