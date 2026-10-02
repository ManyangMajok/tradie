import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { ReviewFormScreen } from '../screens/jobs/ReviewFormScreen';
import { SubmitRequestScreen } from '../screens/submit/SubmitRequestScreen';
import { PropertyFormScreen } from '../screens/properties/PropertyFormScreen';
import { SavedTradiesScreen } from '../screens/more/SavedTradiesScreen';
import { MembershipScreen } from '../screens/more/MembershipScreen';
import { colors } from '@tradify/ui';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Tabs: undefined;
  JobDetail: { publicId: string };
  ReviewForm: { publicId: string };
  SubmitRequest: undefined;
  PropertyForm: { propertyId?: number };
  SavedTradies: undefined;
  Membership: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isReady, token } = useAuthStore();

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
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !token ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ReviewForm" component={ReviewFormScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="SubmitRequest" component={SubmitRequestScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="PropertyForm" component={PropertyFormScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SavedTradies" component={SavedTradiesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Membership" component={MembershipScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
