import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { industry, label } from '@/config/industry';
import { colors } from '@/core/theme';
import { isSupabaseConfigured } from '@/data/supabase';

function TabIcon({ label: text, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? '700' : '500', color: focused ? colors.accent : '#B7C4BC' }}>
      {text}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: '#0A2A1F',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#B7C4BC',
        headerRight: () =>
          !isSupabaseConfigured ? (
            <Text style={{ color: '#B7C4BC', marginRight: 12, fontSize: 11 }}>Local</Text>
          ) : (
            <Text style={{ color: '#B7C4BC', marginRight: 12, fontSize: 11 }}>Cloud</Text>
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: label('rental', 'plural'),
          tabBarLabel: label('rental', 'plural'),
          tabBarIcon: ({ focused }) => <TabIcon label="Alq" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          href: industry.features.map ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon label="Map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: label('asset', 'plural'),
          tabBarLabel: label('asset', 'plural'),
          tabBarIcon: ({ focused }) => <TabIcon label="Act" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="operators"
        options={{
          title: label('operator', 'plural'),
          tabBarLabel: label('operator', 'plural'),
          tabBarIcon: ({ focused }) => <TabIcon label="Op" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
