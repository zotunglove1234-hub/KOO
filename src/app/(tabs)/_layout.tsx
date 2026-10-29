import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/context/CartContext';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type Tab = {
  name: string;
  labelKey: 'home' | 'search' | 'cart' | 'account';
  active: IconName;
  inactive: IconName;
};

const tabs: Tab[] = [
  { name: 'index', labelKey: 'home', active: 'home', inactive: 'home-outline' },
  { name: 'search', labelKey: 'search', active: 'search', inactive: 'search-outline' },
  { name: 'cart', labelKey: 'cart', active: 'cart', inactive: 'cart-outline' },
  { name: 'account', labelKey: 'account', active: 'person', inactive: 'person-outline' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { totals } = useCart();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: styles.label,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: t.tabs[tab.labelKey],
            tabBarBadge: tab.name === 'cart' && totals.itemCount > 0 ? totals.itemCount : undefined,
            tabBarBadgeStyle: styles.badge,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={typeof color === 'string' ? color : colors.ink}
                name={focused ? tab.active : tab.inactive}
                size={24}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  badge: {
    backgroundColor: colors.brand,
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    padding: spacing.xs / 2,
  },
});
