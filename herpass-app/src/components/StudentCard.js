import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius } from '../theme';

const AVATAR_GRADIENTS = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#8B5CF6'],
  ['#3B82F6', '#6366F1'],
  ['#10B981', '#3B82F6'],
  ['#F59E0B', '#EF4444'],
];

function getGradient(name) {
  const code = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[code];
}

export default function StudentCard({ student }) {
  const grad = getGradient(student.name);
  const isOutside = student.status === 'OUTSIDE';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <LinearGradient colors={grad} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.avatarText}>{student.name?.charAt(0)?.toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.roomBadge}>
              <Ionicons name="home" size={10} color={colors.primary} />
              <Text style={styles.roomText}>Room {student.room_number}</Text>
            </View>
            <Text style={styles.courseMeta}>{student.course} · {student.year}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, {
          backgroundColor: isOutside ? colors.amberDim : colors.emeraldDim,
          borderColor: isOutside ? colors.amber + '44' : colors.emerald + '44'
        }]}>
          <View style={[styles.statusDot, { backgroundColor: isOutside ? colors.amber : colors.emerald }]} />
          <Text style={[styles.statusText, { color: isOutside ? colors.amber : colors.emerald }]}>
            {isOutside ? 'OUT' : 'IN'}
          </Text>
        </View>
      </View>

      {/* ID Row */}
      <View style={styles.idRow}>
        <Ionicons name="id-card-outline" size={13} color={colors.dim} />
        <Text style={styles.idText}>{student.student_id}</Text>
      </View>

      {/* Contact Cards */}
      <View style={styles.contacts}>
        <ContactCard
          icon="call"
          label="Student"
          value={student.phone}
          color={colors.emerald}
          gradColors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.04)']}
        />
        <ContactCard
          icon="people"
          label="Guardian"
          value={student.guardian_contact}
          color={colors.blue}
          gradColors={['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.04)']}
        />
      </View>
    </View>
  );
}

function ContactCard({ icon, label, value, color, gradColors }) {
  return (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => value && Linking.openURL(`tel:${value}`)}
      activeOpacity={0.75}
    >
      <LinearGradient colors={gradColors} style={styles.contactGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.contactIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={styles.contactValue}>{value || '—'}</Text>
        </View>
        {value && <Ionicons name="call-outline" size={14} color={color} style={{ opacity: 0.7 }} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
    gap: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  info: { flex: 1 },
  name: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  roomBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryGlow, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  roomText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  courseMeta: { color: colors.muted, fontSize: 11 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '800' },

  idRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.bgMuted, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.borderDim,
  },
  idText: { color: colors.muted, fontSize: 12, fontFamily: 'monospace' },

  contacts: { gap: 10 },
  contactCard: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderDim,
  },
  contactGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  contactIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { color: colors.dim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { color: colors.white, fontSize: 13, fontWeight: '600', marginTop: 2 },
});
