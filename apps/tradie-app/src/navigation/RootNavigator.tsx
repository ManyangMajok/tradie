import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { LeadDetailScreen } from '../screens/leads/LeadDetailScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { CompletionFormScreen } from '../screens/jobs/CompletionFormScreen';
import { ServiceAreasScreen } from '../screens/settings/ServiceAreasScreen';
import { ServiceCategoriesScreen } from '../screens/settings/ServiceCategoriesScreen';
import { AvailabilityScreen } from '../screens/settings/AvailabilityScreen';
import { SubscriptionScreen } from '../screens/settings/SubscriptionScreen';
import { colors } from '@tradify/ui';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Onboarding: undefined;
  Tabs: undefined;
  LeadDetail: { offerId: string };
  JobDetail: { publicId: string };
  CompletionForm: { publicId: string };
  ServiceAreas: undefined;
  ServiceCategories: undefined;
  Availability: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, token, isOnboardingDone } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        {!isReady ? (
          // Hydrating — show splash until secure store resolves
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !token ? (
          // Unauthenticated — Login only
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !isOnboardingDone ? (
          // Authenticated but first launch — show onboarding once
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        ) : (
          // Fully authenticated — main app
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="CompletionForm" component={CompletionFormScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="ServiceAreas" component={ServiceAreasScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ServiceCategories" component={ServiceCategoriesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
