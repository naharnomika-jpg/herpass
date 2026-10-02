import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getOutings, markOut, markReturned } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius, spacing, typography, TAB_BAR_HEIGHT } from '../theme';
import { POLL_INTERVAL } from '../config';
import StatusBadge from '../components/StatusBadge';

export default function GateScreen({ navigation }) {
  const { user } = useAuth();
  const [outings, setOutings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getOutings();
      setOutings(data);
    } catch {
      if (!silent) Alert.alert('Error', 'Could not load gate data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => load(true), POLL_INTERVAL);
      return () => clearInterval(timer);
    }, [load])
  );

  const q = search.toLowerCase();
  const upcoming = outings.filter(o =>
    o.status === 'UPCOMING' &&
    (!q || o.student_name?.toLowerCase().includes(q) || o.room_number?.includes(q))
  );
  const outside = outings.filter(o =>
    (o.status === 'OUT' || o.status === 'OVERDUE') &&
    (!q || o.student_name?.toLowerCase().includes(q) || o.room_number?.includes(q))
  );

  const doMarkOut = async (outingId) => {
    try {
      const res = await markOut(outingId, user.name);
      Alert.alert('✅ Marked OUT', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed');
    }
  };

  const doMarkReturned = async (outingId) => {
    try {
      const res = await markReturned(outingId, user.name);
      Alert.alert('✅ Returned', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LinearGradient colors={gradients.success} style={styles.loadingIcon}>
          <Ionicons name="shield-checkmark" size={26} color="#fff" />
        </LinearGradient>
        <ActivityIndicator color={colors.emerald} size="large" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading gate data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gate Banner */}
      <LinearGradient
        colors={['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.04)']}
        style={styles.gateBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <LinearGradient colors={gradients.success} style={styles.gateIconBox}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.gateTitle}>Gate Verification Desk</Text>
          <Text style={styles.gateSub}>Mark Departure & Return in real-time</Text>
        </View>
        <View style={styles.gateCountWrap}>
          <View style={styles.gateCountChip}>
            <Text style={styles.gateCountLabel}>Pending</Text>
            <Text style={[styles.gateCountValue, { color: colors.blue }]}>{upcoming.length}</Text>
          </View>
          <View style={[styles.gateCountChip, { borderColor: colors.amber + '40' }]}>
            <Text style={styles.gateCountLabel}>Outside</Text>
            <Text style={[styles.gateCountValue, { color: colors.amber }]}>{outside.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={colors.dim} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Quick room / student search..."
          placeholderTextColor={colors.dim}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={17} color={colors.dim} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={[{ key: 'upcoming', data: upcoming }, { key: 'outside', data: outside }]}
        keyExtractor={item => item.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />
        }
        renderItem={({ item }) => {
          if (item.key === 'upcoming') {
            return (
              <View>
                <SectionHeader
                  icon="log-out-outline"
                  title="Pending Departure"
                  subtitle="Tap MARK OUT to confirm departure"
                  count={upcoming.length}
                  color={colors.blue}
                  gradColors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.06)']}
                />
                {upcoming.length === 0
                  ? <EmptySection text="No pending departures at gate." icon="checkmark-circle-outline" color={colors.blue} />
                  : upcoming.map(o => (
                    <GateUpcomingCard
                      key={o.outing_id}
                      outing={o}
                      onMarkOut={() => doMarkOut(o.outing_id)}
                      onExtend={() => navigation.navigate('ExtendDeadline', { outing: o })}
                    />
                  ))
                }
              </View>
            );
          }
          return (
            <View style={{ marginTop: 4 }}>
              <SectionHeader
                icon="log-in-outline"
                title="Currently Outside"
                subtitle="Tap RETURNED when student arrives"
                count={outside.length}
                color={colors.amber}
                gradColors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.06)']}
              />
              {outside.length === 0
                ? <EmptySection text="No students currently outside." icon="home-outline" color={colors.emerald} />
                : outside.map(o => (
                  <GateOutsideCard
                    key={o.outing_id}
                    outing={o}
                    onMarkReturned={() => doMarkReturned(o.outing_id)}
                    onResolve={() => navigation.navigate('ResolveOverdue', { outing: o })}
                  />
                ))
              }
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function SectionHeader({ icon, title, subtitle, count, color, gradColors }) {
  return (
    <LinearGradient colors={gradColors} style={styles.sectionHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.countPill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <Text style={[styles.countPillText, { color }]}>{count}</Text>
      </View>
    </LinearGradient>
  );
}

function EmptySection({ text, icon, color }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={26} color={colors.dim} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function GateUpcomingCard({ outing, onMarkOut, onExtend }) {
  return (
    <View style={styles.gateCard}>
      <View style={[styles.cardAccentBar, { backgroundColor: colors.blue }]} />
      <View style={styles.gateCardContent}>
        {/* Header */}
        <View style={styles.cardTopRow}>
          <LinearGradient colors={['#1D4ED8', '#3B82F6']} style={styles.miniAvatar}>
            <Text style={styles.miniAvatarText}>{outing.student_name?.charAt(0)?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{outing.student_name}</Text>
            <Text style={[styles.cardMeta, { color: colors.blue }]}>
              Room {outing.room_number} · {outing.student_code}
            </Text>
          </View>
          <View style={[styles.timePill, { borderColor: colors.blue + '40', backgroundColor: colors.blueDim }]}>
            <Ionicons name="time-outline" size={11} color={colors.blue} />
            <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '800' }}>{outing.departure_time}</Text>
          </View>
        </View>

        {/* Destination */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={13} color={colors.dim} />
          <Text style={styles.infoText}>{outing.destination} · {outing.reason}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Text style={styles.deadlineText}>Return By: <Text style={{ color: colors.white }}>{outing.return_deadline}</Text></Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={onExtend} activeOpacity={0.75}>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.markOutBtnWrap} onPress={onMarkOut} activeOpacity={0.85}>
              <LinearGradient colors={gradients.success} style={styles.markBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="log-out-outline" size={15} color="#fff" />
                <Text style={styles.markBtnText}>MARK OUT</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function GateOutsideCard({ outing, onMarkReturned, onResolve }) {
  const isOverdue = outing.status === 'OVERDUE';
  return (
    <View style={[styles.gateCard, isOverdue && styles.overdueGateCard]}>
      <View style={[styles.cardAccentBar, { backgroundColor: isOverdue ? colors.rose : colors.amber }]} />
      <View style={styles.gateCardContent}>
        {/* Header */}
        <View style={styles.cardTopRow}>
          <LinearGradient
            colors={isOverdue ? gradients.danger : ['#D97706', '#F59E0B']}
            style={styles.miniAvatar}
          >
            <Text style={styles.miniAvatarText}>{outing.student_name?.charAt(0)?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{outing.student_name}</Text>
            <Text style={[styles.cardMeta, { color: isOverdue ? colors.rose : colors.amber }]}>
              Room {outing.room_number}
            </Text>
          </View>
          <StatusBadge status={outing.status} />
        </View>

        {/* Time info */}
        <View style={styles.timeInfoRow}>
          <View style={styles.timeInfoChip}>
            <Text style={styles.timeInfoLabel}>Out Since</Text>
            <Text style={styles.timeInfoValue}>
              {outing.actual_departure ? outing.actual_departure.split(' ')[1] : outing.departure_time}
            </Text>
          </View>
          <View style={[styles.timeInfoChip, isOverdue && { borderColor: colors.rose + '44', backgroundColor: 'rgba(244,63,94,0.08)' }]}>
            <Text style={[styles.timeInfoLabel, isOverdue && { color: colors.rose }]}>Deadline</Text>
            <Text style={[styles.timeInfoValue, { color: isOverdue ? colors.rose : colors.amber }]}>
              {outing.return_deadline}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${outing.student_phone}`)}
            style={styles.callBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={15} color={colors.emerald} />
            <Text style={{ color: colors.emerald, fontSize: 13, fontWeight: '700' }}>Call</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {isOverdue && (
              <TouchableOpacity style={styles.resolveWrap} onPress={onResolve} activeOpacity={0.85}>
                <LinearGradient colors={gradients.danger} style={styles.markBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.markBtnText}>Resolve</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.markOutBtnWrap} onPress={onMarkReturned} activeOpacity={0.85}>
              <LinearGradient colors={gradients.blue} style={styles.markBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="log-in-outline" size={15} color="#fff" />
                <Text style={styles.markBtnText}>RETURNED</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: typography.sm },
  listContent: { padding: spacing.base, paddingBottom: TAB_BAR_HEIGHT + 16 },

  // Gate Banner
  gateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18,
    borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.2)',
  },
  gateIconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  gateTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  gateSub: { color: colors.emerald, fontSize: 12, marginTop: 2 },
  gateCountWrap: { flexDirection: 'row', gap: 8 },
  gateCountChip: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: colors.blue + '40',
  },
  gateCountLabel: { color: colors.dim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  gateCountValue: { fontSize: 20, fontWeight: '900' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 16, height: 50,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },

  // Section Header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderDim,
  },
  sectionIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionSubtitle: { color: colors.dim, fontSize: 11, marginTop: 2 },
  countPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  countPillText: { fontSize: 14, fontWeight: '900' },

  // Empty
  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 28,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  emptyText: { color: colors.muted, fontSize: 14 },

  // Gate Card
  gateCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
  },
  overdueGateCard: {
    borderColor: colors.rose + '60',
    backgroundColor: 'rgba(244,63,94,0.05)',
  },
  cardAccentBar: { width: 5 },
  gateCardContent: { flex: 1, padding: 16, gap: 12 },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniAvatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  cardName: { color: colors.white, fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 9,
    paddingHorizontal: 9, paddingVertical: 5,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.bgMuted, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.borderDim,
  },
  infoText: { color: colors.muted, fontSize: 13, flex: 1 },

  timeInfoRow: { flexDirection: 'row', gap: 10 },
  timeInfoChip: {
    flex: 1, backgroundColor: colors.bgMuted, borderRadius: 9,
    padding: 10, borderWidth: 1, borderColor: colors.borderDim,
  },
  timeInfoLabel: { color: colors.dim, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  timeInfoValue: { color: colors.white, fontSize: 14, fontWeight: '800', marginTop: 4 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadlineText: { color: colors.muted, fontSize: 12 },
  iconBtn: {
    backgroundColor: colors.bgMuted, borderRadius: 10,
    padding: 11, borderWidth: 1, borderColor: colors.border,
  },
  markOutBtnWrap: { borderRadius: 10, overflow: 'hidden' },
  resolveWrap: { borderRadius: 10, overflow: 'hidden' },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 11 },
  markBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgMuted, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.emerald + '40',
  },
});
