import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="screens" />
      <Stack.Screen name="FarmerDashboard" />
      <Stack.Screen name="BuyersDashboard" />
    </Stack>
  );
}