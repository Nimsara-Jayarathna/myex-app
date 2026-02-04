import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { refreshSession } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
// eslint-disable-next-line import/no-unresolved
import { getAllRows, getCounts, getMetaValue, initDb } from '@/utils/local-db';

const TABLES: ('transactions' | 'categories' | 'profile')[] = [
  'transactions',
  'categories',
  'profile',
];

export default function DebugDbScreen() {
  const { colors } = useAppTheme();
  const [selectedTable, setSelectedTable] = useState<'transactions' | 'categories' | 'profile'>(
    'transactions'
  );
  const [rows, setRows] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [counts, setCounts] = useState<{ transactions: number; categories: number; profile: number } | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>();

  useEffect(() => {
    void initDb();
  }, []);

  const handleLoad = async () => {
    setStatusMessage('');
    const nextCounts = await getCounts();
    const lastSync = await getMetaValue('lastSyncAt');
    const data = await getAllRows(selectedTable);
    setCounts(nextCounts);
    setLastSyncAt(lastSync);
    setRows(data);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setStatusMessage('Syncing...');
    try {
      await refreshSession();
      await handleLoad();
      setStatusMessage('Sync complete.');
    } catch {
      setStatusMessage('Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!__DEV__) {
    return (
      <View style={styles.container}>
        <ThemedText>Debug screen is disabled.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Local DB Debug</ThemedText>

      <View style={styles.tableRow}>
        {TABLES.map(table => (
          <Pressable
            key={table}
            onPress={() => setSelectedTable(table)}
            style={[
              styles.tableChip,
              {
                backgroundColor:
                  selectedTable === table ? colors.primaryAccent : colors.surface2,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            <ThemedText style={{ color: selectedTable === table ? '#fff' : colors.textMuted }}>
              {table}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleLoad}
        style={[styles.loadButton, { backgroundColor: colors.primaryAccent }]}
      >
        <ThemedText style={styles.loadText}>Load</ThemedText>
      </Pressable>
      <Pressable
        onPress={handleSync}
        disabled={isSyncing}
        style={[
          styles.loadButton,
          { backgroundColor: isSyncing ? colors.surface2 : colors.surface3 },
        ]}
      >
        <ThemedText style={[styles.loadText, { color: colors.textMain }]}>
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </ThemedText>
      </Pressable>

      {statusMessage ? (
        <ThemedText style={{ color: colors.textMuted }}>{statusMessage}</ThemedText>
      ) : null}

      {counts ? (
        <ThemedText style={{ color: colors.textMuted }}>
          Rows — transactions: {counts.transactions}, categories: {counts.categories}, profile: {counts.profile}
        </ThemedText>
      ) : null}
      {lastSyncAt ? (
        <ThemedText style={{ color: colors.textMuted }}>Last sync: {lastSyncAt}</ThemedText>
      ) : null}

      <ScrollView style={styles.results}>
        {rows.length === 0 ? (
          <ThemedText style={{ color: colors.textMuted }}>No rows.</ThemedText>
        ) : (
          rows.map((row, index) => (
            <View key={`${selectedTable}-${index}`} style={styles.rowBlock}>
              <ThemedText style={styles.rowText}>{JSON.stringify(row, null, 2)}</ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  tableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadText: {
    color: '#fff',
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  rowBlock: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  rowText: {
    fontSize: 12,
  },
});
