import { Stack } from "expo-router";
import StatusBar from "./components/StatusBarTop";

export default function RootLayout() {
  return (
    <>
      <StatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="screens" />
        <Stack.Screen name="farmer" />
        <Stack.Screen name="buyer" />
      </Stack>
    </>
  );
}