// ============================================================
// App.tsx - navigation root ("Nourish" design)
// 5-tab bottom bar (Home / Plan / [Scan] / Progress / Me) with a
// raised terracotta scan FAB that opens the camera as a full-screen
// modal. Onboarding is a pre-tab gate controlled by the store.
// ============================================================

import React from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  HankenGrotesk_500Medium,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';

import { useAppStore } from '@/state/useAppStore';
import { tokens, font, radius, shadow, withAlpha } from '@/theme/tokens';
import { Camera, House, ClipboardList, LineChart, User } from '@/theme/icons';

import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { ScanScreen } from '@/screens/ScanScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SupplementsScreen } from '@/screens/SupplementsScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Scan: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const MeStack = createNativeStackNavigator();

// --- Home tab: Dashboard, with scan reachable from meal "+" buttons ---
function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  return <DashboardScreen onPressScan={() => navigation.navigate('Scan')} />;
}

// --- Me tab: Settings, with Supplements pushed on top ---
function MeTab(): React.ReactElement {
  return (
    <MeStack.Navigator>
      <MeStack.Screen
        name="MeHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <MeStack.Screen
        name="Supplements"
        component={SupplementsScreen}
        options={{
          title: '',
          headerShadowVisible: false,
          headerTintColor: tokens.accent,
          headerStyle: { backgroundColor: tokens.bg },
        }}
      />
    </MeStack.Navigator>
  );
}

// --- The raised terracotta scan FAB that lives in the center tab slot ---
function ScanTabButton(): React.ReactElement {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.fabSlot} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Scan food"
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => navigation.navigate('Scan')}
      >
        <Camera size={26} color={tokens.surface} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

function MainTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.inkFaint,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={EmptyScanRoute}
        options={{
          tabBarLabel: () => null,
          tabBarButton: () => <ScanTabButton />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <LineChart size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Me"
        component={MeTab}
        options={{
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Placeholder route component for the center scan slot. The FAB opens the
// Scan modal directly, so this is never actually shown.
function EmptyScanRoute(): React.ReactElement {
  return <View />;
}

// --- Scan opens as a full-screen modal from the root stack ---
function ScanModal(): React.ReactElement {
  const navigation = useNavigation<any>();
  return (
    <ScanScreen
      onClose={() => navigation.goBack()}
      onConfirm={() => navigation.goBack()}
    />
  );
}

export default function App(): React.ReactElement | null {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    HankenGrotesk_500Medium,
    HankenGrotesk_700Bold,
    SpaceGrotesk_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      {!onboardingComplete ? (
        <OnboardingScreen onComplete={() => undefined} />
      ) : (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs" component={MainTabs} />
          <RootStack.Screen
            name="Scan"
            component={ScanModal}
            options={{ presentation: 'fullScreenModal' }}
          />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: withAlpha(tokens.bg, 0.94),
    borderTopColor: tokens.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabLabel: {
    fontFamily: font.body,
    fontSize: 10,
    marginTop: 2,
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -16,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: radius.fab,
    backgroundColor: tokens.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
