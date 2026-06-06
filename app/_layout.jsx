import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StatusBar from "./components/StatusBarTop";
import { supabase } from "../lib/supabaseClient";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) {
        return;
      }

      const isRecoveryLink = url.includes("new-password") || url.includes("reset-password");
      if (isRecoveryLink) {
        router.push("/new-password");
      }
    };

    const urlSubscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    const authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/new-password");
      }
    });

    Linking.getInitialURL().then(handleUrl);

    return () => {
      urlSubscription.remove();
      authSubscription.data.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <StatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LandScreens" />
        <Stack.Screen name="farmer" />
        <Stack.Screen name="buyer" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="new-password" />
        <Stack.Screen name="admin" />
      </Stack>
    </SafeAreaProvider>
  );
}