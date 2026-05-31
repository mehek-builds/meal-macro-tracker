// ============================================================
// App.tsx - navigation root
// Uses @react-navigation/native-stack for screen routing.
// Onboarding shown once; all other screens accessible from tab bar.
// ============================================================

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { SupplementsScreen } from './src/screens/SupplementsScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// TODO(Section 17) - replace with tab navigator once screens are wired to
// real data. Current stub uses a flat stack for simple development testing.

export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  Scan: undefined;
  Supplements: undefined;
  Progress: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.ReactElement {
  // TODO(Section 6) - persist onboarding state via MMKV or AsyncStorage
  const [onboardingDone, setOnboardingDone] = useState(false);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        initialRouteName={onboardingDone ? 'Dashboard' : 'Onboarding'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
          )}
        </Stack.Screen>

        {/* TODO(Section 5) - wrap Dashboard/Supplements/Progress/Settings in a
            bottom tab navigator once TanStack Query provider is set up */}
        <Stack.Screen name="Dashboard">
          {({ navigation }) => (
            <DashboardScreen
              onPressScan={() => navigation.navigate('Scan')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Scan"
          options={{ presentation: 'fullScreenModal' }}
        >
          {({ navigation }) => (
            <ScanScreen
              onClose={() => navigation.goBack()}
              onConfirm={(_items, _meal) => {
                // TODO(Section 7.8) - call createLogEntry() for each confirmed item
                navigation.goBack();
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Supplements" component={SupplementsScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
