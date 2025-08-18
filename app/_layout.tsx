import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LimnusProvider } from "@/providers/limnus-provider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: {
        backgroundColor: '#1a1a2e',
      },
      headerTintColor: '#fff',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="session" options={{ headerShown: false }} />
      <Stack.Screen name="reflection" options={{ title: "Reflection Engine" }} />
      <Stack.Screen name="patch" options={{ title: "Patch Composer" }} />
      <Stack.Screen name="sync" options={{ title: "Interpersonal Sync" }} />
      <Stack.Screen name="loop" options={{ title: "Loop Closure" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <LimnusProvider>
            <RootLayoutNav />
          </LimnusProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}