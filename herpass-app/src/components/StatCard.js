import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

export default function StatCard({ label, value, accent = colors.primary, icon, gradient }) {
  const accentGlow = accent + '22';
  return (
    <View style={[styles.card, { borderColor: accent + '30' }]}>
      {/* Top glow accent */}
      <LinearGradient
        colors={[accent + '28', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconBadge, { backgroundColor: accentGlow }]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        )}
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
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
    borderWidth: 1.5,
    padding: 14,
    marginHorizontal: 4,
    overflow: 'hidden',
    minHeight: 92,
    justifyContent: 'space-between',
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 64,
    borderRadius: 16,
  },
  header: {
    gap: 6,
    marginBottom: 6,
  },
  iconBadge: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  value: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
