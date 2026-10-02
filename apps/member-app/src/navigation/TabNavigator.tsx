import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Briefcase, Building2, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/home/HomeScreen';
import { JobsScreen } from '../screens/jobs/JobsScreen';
import { PropertiesScreen } from '../screens/properties/PropertiesScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { colors, typography, spacing } from '@tradify/ui';

export type TabParamList = {
  Home: undefined;
  Jobs: undefined;
  Properties: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(35,30,37,0.97)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.semiBold,
          fontSize: 11,
          marginTop: -4,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, React.ReactNode> = {
            Home: <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.75} />,
            Jobs: <Briefcase size={22} color={color} strokeWidth={focused ? 2.5 : 1.75} />,
            Properties: <Building2 size={22} color={color} strokeWidth={focused ? 2.5 : 1.75} />,
            More: <MoreHorizontal size={22} color={color} strokeWidth={focused ? 2.5 : 1.75} />,
          };
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              {icons[route.name]}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${colors.primary}20`,
  },
});
