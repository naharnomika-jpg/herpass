import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_COLORS, STATUS_ICONS } from '../theme';

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_COLORS[status] || { bg: '#0F1629', text: '#94A3B8', border: '#1E2D50' };
  const iconName = STATUS_ICONS[status];
  const isLg = size === 'lg';
  const fontSize = isLg ? 13 : 11;
  const px = isLg ? 12 : 8;
  const py = isLg ? 6 : 4;
  const iconSize = isLg ? 14 : 11;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          paddingHorizontal: px,
          paddingVertical: py,
          gap: isLg ? 5 : 4,
        },
      ]}
    >
      {iconName && (
        <Ionicons name={iconName} size={iconSize} color={cfg.text} />
      )}
      <Text style={[styles.text, { color: cfg.text, fontSize }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
