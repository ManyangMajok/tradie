import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, Briefcase, BarChart2, User } from 'lucide-react-native';
import { colors, radii } from '@tradify/ui';
import { LeadsInboxScreen } from '../screens/leads/LeadsInboxScreen';
import { JobsInboxScreen } from '../screens/jobs/JobsInboxScreen';
import { PerformanceScreen } from '../screens/performance/PerformanceScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type TabParamList = {
  Leads: undefined;
  Jobs: undefined;
  Performance: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(35, 30, 37, 0.95)',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, typeof Inbox> = {
            Leads: Inbox,
            Jobs: Briefcase,
            Performance: BarChart2,
            Profile: User,
          };
          const Icon = icons[route.name];
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Leads" component={LeadsInboxScreen} options={{ tabBarLabel: 'Leads' }} />
      <Tab.Screen name="Jobs" component={JobsInboxScreen} options={{ tabBarLabel: 'Jobs' }} />
      <Tab.Screen name="Performance" component={PerformanceScreen} options={{ tabBarLabel: 'Performance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  iconWrapActive: {
    backgroundColor: `${colors.primary}20`,
  },
});
