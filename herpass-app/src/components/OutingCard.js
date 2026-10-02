import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, STATUS_COLORS } from '../theme';
import StatusBadge from './StatusBadge';

export default function OutingCard({ outing, onMarkOut, onMarkReturned, onResolve, onExtend }) {
  const isOverdue = outing.status === 'OVERDUE';
  const isOut = outing.status === 'OUT';
  const isUpcoming = outing.status === 'UPCOMING';
  const isReturned = outing.status === 'RETURNED';

  const statusCfg = STATUS_COLORS[outing.status] || {};
  const borderColor = isOverdue ? colors.rose : statusCfg.border || colors.border;

  return (
    <View style={[styles.card, { borderColor }, isOverdue && styles.overdueCard]}>
      {/* Status color bar */}
      <View style={[styles.statusBar, { backgroundColor: statusCfg.text || colors.primary }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <LinearGradient
            colors={isOverdue ? [colors.rose, '#BE123C'] : gradients.primary}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{outing.student_name?.charAt(0)?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{outing.student_name}</Text>
            <Text style={styles.studentMeta}>Room {outing.room_number} · {outing.student_code}</Text>
          </View>
          <StatusBadge status={outing.status} size="sm" />
        </View>

        {/* Destination */}
        <View style={styles.destRow}>
          <View style={styles.destIconWrap}>
            <Ionicons name="location" size={13} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destValue}>{outing.destination}</Text>
            {outing.reason ? <Text style={styles.destReason}>{outing.reason}</Text> : null}
          </View>
        </View>

        {/* Time Chips */}
        <View style={styles.timeRow}>
          <TimeChip
            icon="log-out-outline"
            label="Departs"
            value={outing.departure_time}
            color={colors.blue}
          />
          <TimeChip
            icon="time"
            label="Return By"
            value={outing.return_deadline}
            color={isOverdue ? colors.rose : colors.amber}
            highlight={isOverdue}
          />
          <TimeChip
            icon="calendar-outline"
            label="Date"
            value={outing.outing_date}
            color={colors.muted}
          />
        </View>

        {/* Actions */}
        {(isUpcoming || isOut || isOverdue) && (
          <View style={styles.actionRow}>
            {isUpcoming && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => onMarkOut(outing.outing_id)} activeOpacity={0.85}>
                <LinearGradient colors={gradients.success} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="log-out-outline" size={15} color="#fff" />
                  <Text style={styles.btnText}>Mark OUT</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {(isOut || isOverdue) && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => onMarkReturned(outing.outing_id)} activeOpacity={0.85}>
                <LinearGradient colors={gradients.blue} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="log-in-outline" size={15} color="#fff" />
                  <Text style={styles.btnText}>Returned</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {isOverdue && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => onResolve(outing)} activeOpacity={0.85}>
                <LinearGradient colors={gradients.danger} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                  <Text style={styles.btnText}>Resolve</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <View style={styles.secondaryActions}>
              {(isOut || isOverdue || isUpcoming) && (
                <TouchableOpacity style={styles.btnSecondary} onPress={() => onExtend(outing)} activeOpacity={0.75}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.btnSecondaryText}>Extend</Text>
                </TouchableOpacity>
              )}
              {(isOut || isOverdue) && outing.student_phone ? (
                <TouchableOpacity
                  style={[styles.btnSecondary, { borderColor: colors.emerald + '44' }]}
                  onPress={() => Linking.openURL(`tel:${outing.student_phone}`)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="call" size={14} color={colors.emerald} />
                  <Text style={[styles.btnSecondaryText, { color: colors.emerald }]}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function TimeChip({ icon, label, value, color, highlight }) {
  return (
    <View style={[styles.timeChip, highlight && styles.timeChipHighlight]}>
      <Ionicons name={icon} size={11} color={color} style={{ marginBottom: 3 }} />
      <Text style={styles.timeChipLabel}>{label}</Text>
      <Text style={[styles.timeChipValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  overdueCard: {
    backgroundColor: 'rgba(244,63,94,0.05)',
  },
  statusBar: {
    width: 5,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    opacity: 0.9,
  },
  content: { flex: 1, padding: 16, gap: 12 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  studentInfo: { flex: 1 },
  studentName: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  studentMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },

  // Destination
  destRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm, padding: 12,
    borderWidth: 1, borderColor: colors.borderDim,
  },
  destIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  destValue: { color: colors.white, fontSize: 14, fontWeight: '600' },
  destReason: { color: colors.muted, fontSize: 12, marginTop: 3 },

  // Times
  timeRow: { flexDirection: 'row', gap: 7 },
  timeChip: {
    flex: 1, backgroundColor: colors.bgMuted,
    borderRadius: radius.sm, padding: 9,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderDim,
  },
  timeChipHighlight: { borderColor: colors.rose + '44', backgroundColor: 'rgba(244,63,94,0.06)' },
  timeChipLabel: { color: colors.dim, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  timeChipValue: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  // Actions
  actionRow: { gap: 8 },
  btnPrimary: { borderRadius: radius.sm, overflow: 'hidden' },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, paddingHorizontal: 16,
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  secondaryActions: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.bgMuted, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 10,
  },
  btnSecondaryText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
