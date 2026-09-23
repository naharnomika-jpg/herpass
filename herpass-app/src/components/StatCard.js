import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function StatCard({ label, value, accent = colors.white, icon }) {
  return (
    <View style={[styles.card, { borderColor: accent + '33' }]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
      </View>
      <Text style={[styles.value, { color: accent }]}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
});
