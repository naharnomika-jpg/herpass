import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats, getOutings, markOut, markReturned } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius, spacing, typography, TAB_BAR_HEIGHT } from '../theme';
import { POLL_INTERVAL } from '../config';
import StatCard from '../components/StatCard';
import OutingCard from '../components/OutingCard';

const FILTERS = ['ALL', 'OUT', 'RETURNED', 'UPCOMING', 'OVERDUE'];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [outings, setOutings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [s, o] = await Promise.all([getDashboardStats(), getOutings()]);
      setStats(s);
      setOutings(o);
    } catch (e) {
      if (!silent) Alert.alert('Error', 'Could not fetch dashboard data. Is the server running?');
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

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      outings.filter(o => {
        const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const matchSearch = !q ||
          o.student_name?.toLowerCase().includes(q) ||
          o.room_number?.toLowerCase().includes(q) ||
          o.outing_id?.toLowerCase().includes(q) ||
          o.destination?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
    );
  }, [outings, search, statusFilter]);

  const handleMarkOut = async (outingId) => {
    try {
      const res = await markOut(outingId, user.name);
      Alert.alert('✅ Marked OUT', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to mark OUT');
    }
  };

  const handleMarkReturned = async (outingId) => {
    try {
      const res = await markReturned(outingId, user.name);
      Alert.alert('✅ Returned', res.message);
      load(true);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to mark RETURNED');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LinearGradient colors={gradients.primary} style={styles.loadingIcon}>
          <Ionicons name="grid" size={26} color="#fff" />
        </LinearGradient>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.outing_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Page Header */}
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderLeft}>
                <View style={styles.pageTitleRow}>
                  <LinearGradient colors={gradients.primary} style={styles.titleIcon}>
                    <Ionicons name="grid" size={16} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.title}>Overview</Text>
                </View>
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTxt}>Live · auto-refreshes</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.createBtnWrap}
                onPress={() => navigation.navigate('CreateOuting')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={gradients.primary} style={styles.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>New Outing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Overdue Banner */}
            {stats?.overdue_count > 0 && (
              <TouchableOpacity
                style={styles.overdueBanner}
                onPress={() => setStatusFilter('OVERDUE')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['rgba(244,63,94,0.18)', 'rgba(244,63,94,0.08)']}
                  style={styles.overdueBannerInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.overdueIconWrap}>
                    <Ionicons name="warning" size={20} color={colors.rose} />
                  </View>
                  <Text style={styles.overdueText}>
                    {stats.overdue_count} OVERDUE student{stats.overdue_count > 1 ? 's' : ''} — tap to review
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.rose} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* KPI Stats */}
            {stats && (
              <View style={styles.statsRow}>
                <StatCard label="Today's Outings" value={stats.todays_outings} icon="📅" accent={colors.primary} />
                <StatCard label="Currently Out" value={stats.currently_outside} accent={colors.amber} icon="🟠" />
                <StatCard label="Returned" value={stats.returned_today} accent={colors.emerald} icon="✅" />
              </View>
            )}

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={17} color={colors.dim} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search student, room, destination..."
                placeholderTextColor={colors.dim}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={colors.dim} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
                  onPress={() => setStatusFilter(f)}
                  activeOpacity={0.75}
                >
                  {statusFilter === f ? (
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.filterBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.filterBtnTextActive}>{f}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.filterBtnText}>{f}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Live Register</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filtered.length}</Text>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <OutingCard
            outing={item}
            onMarkOut={handleMarkOut}
            onMarkReturned={handleMarkReturned}
            onResolve={(o) => navigation.navigate('ResolveOverdue', { outing: o })}
            onExtend={(o) => navigation.navigate('ExtendDeadline', { outing: o })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient colors={['rgba(99,102,241,0.12)', 'transparent']} style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyText}>No outings match your current filter.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted, fontSize: typography.sm },
  listContent: { padding: spacing.base, paddingBottom: TAB_BAR_HEIGHT + 16 },

  // Page Header
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  pageHeaderLeft: { gap: 5 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  titleIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: typography.xxl, fontWeight: '900', letterSpacing: -0.5 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 38 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald },
  liveTxt: { color: colors.muted, fontSize: 12 },
  createBtnWrap: { borderRadius: radius.md, overflow: 'hidden' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Overdue banner
  overdueBanner: { borderRadius: radius.md, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: colors.rose + '44' },
  overdueBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  overdueIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(244,63,94,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  overdueText: { color: colors.rose, fontSize: 14, fontWeight: '700', flex: 1 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: spacing.md },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, height: 50, marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 14 },
  clearBtn: { padding: 4 },

  // Filters
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.base },
  filterBtn: {
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
  },
  filterBtnActive: { borderColor: 'transparent' },
  filterBtnGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  filterBtnText: { color: colors.muted, fontSize: 12, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 8 },
  filterBtnTextActive: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Section label
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { color: colors.dim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  countBadge: {
    backgroundColor: colors.primaryGlow, borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  countBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 14 },
});
