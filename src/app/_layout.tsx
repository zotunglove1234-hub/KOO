import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/i18n';
import { initSupabaseAuth } from '@/lib/supabase';
import { colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    // Restore a persisted Supabase session (no-op when Supabase is unconfigured,
    // and it never throws, so the storefront boots either way).
    void initSupabaseAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.canvas },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="order/[id]" options={{ animation: 'fade' }} />
              <Stack.Screen name="settings" />
              {/* Auth and messaging: pushed modally-ish over the storefront, so a
                  sign-in never replaces the page the user came from. */}
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="chat" />
              <Stack.Screen name="chat/[id]" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
