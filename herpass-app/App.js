import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StatusBar } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GateScreen from './src/screens/GateScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

// Modals
import CreateOutingModal from './src/modals/CreateOutingModal';
import ResolveOverdueModal from './src/modals/ResolveOverdueModal';
import ExtendDeadlineModal from './src/modals/ExtendDeadlineModal';
import AddStudentModal from './src/modals/AddStudentModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgCard,
    border: colors.border,
    text: colors.white,
    primary: colors.pink,
  },
};

function MainTabs() {
  const { user } = useAuth();
  const isWarden = user?.role === 'warden';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            'Gate Desk': focused ? 'shield-checkmark' : 'shield-checkmark-outline',
            Students: focused ? 'people' : 'people-outline',
            Alerts: focused ? 'notifications' : 'notifications-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Gate Desk" component={GateScreen} />
      {isWarden && <Tab.Screen name="Students" component={StudentsScreen} />}
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="CreateOuting"
            component={CreateOutingModal}
            options={{ title: 'Create Outing', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ResolveOverdue"
            component={ResolveOverdueModal}
            options={{ title: 'Resolve Overdue', presentation: 'modal' }}
          />
          <Stack.Screen
            name="ExtendDeadline"
            component={ExtendDeadlineModal}
            options={{ title: 'Extend Deadline', presentation: 'modal' }}
          />
          <Stack.Screen
            name="AddStudent"
            component={AddStudentModal}
            options={{ title: 'Add Student', presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
