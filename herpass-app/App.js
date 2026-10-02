import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StatusBar, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, gradients, TAB_BAR_HEIGHT, SAFE_BOTTOM } from './src/theme';

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
    primary: colors.primary,
  },
};

const TAB_ICONS = {
  Dashboard:  { focused: 'grid',              unfocused: 'grid-outline' },
  'Gate Desk':{ focused: 'shield-checkmark',  unfocused: 'shield-checkmark-outline' },
  Students:   { focused: 'people',            unfocused: 'people-outline' },
  Alerts:     { focused: 'notifications',     unfocused: 'notifications-outline' },
};

function TabIcon({ routeName, focused, color }) {
  const icons = TAB_ICONS[routeName] || { focused: 'ellipse', unfocused: 'ellipse-outline' };
  const iconName = focused ? icons.focused : icons.unfocused;
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      {focused && (
        <LinearGradient
          colors={gradients.primary}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons name={iconName} size={focused ? 22 : 23} color={focused ? '#fff' : color} />
    </View>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isWarden = user?.role === 'warden';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT,
          paddingBottom: SAFE_BOTTOM,
          paddingTop: 10,
          // Subtle top glow
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 16,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 3,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon routeName={route.name} focused={focused} color={color} />
        ),
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
      <LinearGradient colors={gradients.hero} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <LinearGradient colors={gradients.primary} style={loadStyles.logoBox}>
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
          </LinearGradient>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Loading Herpass...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800', fontSize: 17, letterSpacing: 0.2 },
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
            options={{
              title: 'New Outing',
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.bgCard },
              headerTintColor: colors.white,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="ResolveOverdue"
            component={ResolveOverdueModal}
            options={{ title: 'Resolve Overdue', presentation: 'modal', headerStyle: { backgroundColor: colors.bgCard }, headerTintColor: colors.white, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="ExtendDeadline"
            component={ExtendDeadlineModal}
            options={{ title: 'Extend Deadline', presentation: 'modal', headerStyle: { backgroundColor: colors.bgCard }, headerTintColor: colors.white, headerShadowVisible: false }}
          />
          <Stack.Screen
            name="AddStudent"
            component={AddStudentModal}
            options={{ title: 'Add Student', presentation: 'modal', headerStyle: { backgroundColor: colors.bgCard }, headerTintColor: colors.white, headerShadowVisible: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={false} />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWrapActive: {
    borderRadius: 12,
  },
});

const loadStyles = StyleSheet.create({
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
});
