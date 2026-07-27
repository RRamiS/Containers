import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { label } from '@/config/industry';
import { colors } from '@/core/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="assets/[id]"
          options={{
            headerShown: true,
            title: label('asset'),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="operators/[id]"
          options={{
            headerShown: true,
            title: label('operator'),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="rentals/[id]"
          options={{
            headerShown: true,
            title: label('rental'),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
      </Stack>
    </>
  );
}
