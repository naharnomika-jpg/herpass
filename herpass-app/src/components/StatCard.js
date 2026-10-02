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
        colors={[accent + '22', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon && (
          <View style={[styles.iconBadge, { backgroundColor: accentGlow }]}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: accent }]}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: 14,
    marginHorizontal: 4,
    overflow: 'hidden',
    minHeight: 82,
    justifyContent: 'space-between',
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  iconBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
