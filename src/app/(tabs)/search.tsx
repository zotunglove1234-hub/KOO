import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ChipRow, EmptyState, SearchField } from '@/components/Filters';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { useCart } from '@/context/CartContext';
import { categories, products, searchProducts, sortOptions, type CategoryId, type Product, type SortKey } from '@/data/catalog';
import type { ChipOption } from '@/components/Filters';
import { useI18n, type Dictionary } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type PriceKey = 'any' | 'under50' | 'under100' | 'under200';
type SortLabelKey = keyof Dictionary['catalog']['sort'];

/** Filter thresholds are behaviour, not copy — only the labels are translated. */
const priceOptions: { id: PriceKey; maxCents?: number }[] = [
  { id: 'any' },
  { id: 'under50', maxCents: 5000 },
  { id: 'under100', maxCents: 10000 },
  { id: 'under200', maxCents: 20000 },
];

const sortLabelKey: Record<SortKey, SortLabelKey> = {
  relevance: 'relevance',
  'price-asc': 'priceAsc',
  'price-desc': 'priceDesc',
  rating: 'rating',
  newest: 'newest',
};

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { t } = useI18n();
  const [query, setQuery] = useState(params.q ?? '');
  const [sort, setSort] = useState<SortKey>('relevance');
  const [price, setPrice] = useState<PriceKey>('any');
  const { add } = useCart();

  const categoryOptions = useMemo<ChipOption<CategoryId | 'all'>[]>(
    () => [
      { id: 'all', label: t.catalog.all },
      ...categories.map((category) => ({ id: category.id, label: t.catalog.category[category.id] })),
    ],
    [t]
  );

  const priceChips = useMemo<ChipOption<PriceKey>[]>(
    () => priceOptions.map((option) => ({ id: option.id, label: t.search.price[option.id] })),
    [t]
  );

  const sortChips = useMemo<ChipOption<SortKey>[]>(
    () => sortOptions.map((option) => ({ id: option.id, label: t.catalog.sort[sortLabelKey[option.id]] })),
    [t]
  );

  // Category lives in the URL so Home chips can deep-link into a filtered view.
  const category = (params.category as CategoryId | undefined) ?? 'all';
  const setCategory = (next: CategoryId | 'all') =>
    router.setParams({ category: next === 'all' ? undefined : next });

  const results = useMemo(
    () =>
      searchProducts({
        query,
        category,
        sort,
        maxPriceCents: priceOptions.find((option) => option.id === price)?.maxCents,
      }),
    [category, price, query, sort]
  );

  const rows = useMemo(() => {
    const grouped: Product[][] = [];
    for (let index = 0; index < results.length; index += 2) grouped.push(results.slice(index, index + 2));
    return grouped;
  }, [results]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setSort('relevance');
    setPrice('any');
    router.setParams({ category: undefined, q: undefined });
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.search.title}</Text>
        <SearchField onChange={setQuery} placeholder={t.search.placeholder(products.length)} value={query} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={rows}
        keyExtractor={(row) => row.map((product) => product.id).join('-')}
        ListEmptyComponent={
          <EmptyState
            action={<Text onPress={resetFilters} style={styles.reset}>{t.search.resetFilters}</Text>}
            body={t.search.emptyBody}
            icon="search-outline"
            title={t.search.nothingFound}
          />
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
        ListHeaderComponent={
          <View style={styles.filters}>
            <ChipRow
              onSelect={(id) => setCategory(id as CategoryId | 'all')}
              options={categoryOptions}
              selected={category}
              style={styles.chipBlock}
            />
            <ChipRow
              onSelect={setPrice}
              options={priceChips}
              selected={price}
              style={styles.chipBlock}
            />
            <View style={styles.sortRow}>
              <Text style={styles.count}>
                {results.length} {t.plural.result(results.length)}
              </Text>
              <ChipRow
                onSelect={setSort}
                options={sortChips}
                selected={sort}
                style={styles.sortChips}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridRow}>
            {item.map((product) => (
              <ProductCard
                key={product.id}
                onQuickAdd={(candidate) => add(candidate.id, { optionValue: candidate.option?.values[0] })}
                product={product}
              />
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.display },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  filters: { gap: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  chipBlock: { paddingHorizontal: 0 },
  sortRow: { gap: spacing.sm },
  count: { ...typography.caption, fontSize: 13 },
  sortChips: { paddingLeft: 0 },
  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  footerSpacer: { height: spacing.lg },
  reset: { ...typography.bodyStrong, color: colors.brandDark },
});
