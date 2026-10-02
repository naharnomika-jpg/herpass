import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius, spacing, typography, TAB_BAR_HEIGHT } from '../theme';
import { POLL_INTERVAL } from '../config';

const PRIORITY_CONFIG = {
  CRITICAL: {
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.4)',
    accentBar: colors.rose,
    icon: 'warning',
    iconColor: colors.rose,
    iconBg: 'rgba(244,63,94,0.15)',
  },
  HIGH: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
    accentBar: colors.amber,
    icon: 'alert-circle',
    iconColor: colors.amber,
    iconBg: 'rgba(245,158,11,0.15)',
  },
  INFO: {
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.25)',
    accentBar: colors.blue,
    icon: 'information-circle',
    iconColor: colors.blue,
    iconBg: 'rgba(59,130,246,0.15)',
  },
};

function NotifCard({ notif }) {
  const cfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.INFO;

  return (
    <View style={[styles.notifCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[styles.notifAccentBar, { backgroundColor: cfg.accentBar }]} />
      <View style={styles.notifBody}>
        <View style={styles.notifTop}>
          <View style={[styles.notifIconWrap, { backgroundColor: cfg.iconBg }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifType, { color: cfg.iconColor }]}>{notif.type}</Text>
            <Text style={styles.notifTime}>{notif.created_at?.split(' ')[1] || ''}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: cfg.iconBg, borderColor: cfg.border }]}>
            <Text style={[styles.priorityText, { color: cfg.iconColor }]}>{notif.priority}</Text>
          </View>
        </View>
        <Text style={styles.notifMessage}>{notif.message}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getNotifications(user?.role);
      setNotifications(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => load(true), POLL_INTERVAL);
      return () => clearInterval(timer);
    }, [load])
  );

  const criticalCount = notifications.filter(n => n.priority === 'CRITICAL').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <LinearGradient colors={gradients.primary} style={styles.loadingIcon}>
          <Ionicons name="notifications" size={26} color="#fff" />
        </LinearGradient>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={n => String(n.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.pageTitleRow}>
                <LinearGradient colors={gradients.primary} style={styles.titleIcon}>
                  <Ionicons name="notifications" size={16} color="#fff" />
                </LinearGradient>
                <Text style={styles.title}>Alerts</Text>
              </View>
              <View style={styles.badgeRow}>
                {criticalCount > 0 && (
                  <View style={styles.criticalBadge}>
                    <Ionicons name="warning" size={12} color="#fff" />
                    <Text style={styles.criticalBadgeText}>{criticalCount} critical</Text>
                  </View>
                )}
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>{notifications.length}</Text>
                </View>
              </View>
            </View>

            {/* Critical Alert Banner */}
            {criticalCount > 0 && (
              <LinearGradient
                colors={['rgba(244,63,94,0.14)', 'rgba(244,63,94,0.06)']}
                style={styles.criticalBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.criticalIconWrap}>
                  <Ionicons name="warning" size={20} color={colors.rose} />
                </View>
                <Text style={styles.criticalBannerText}>
                  {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require immediate attention
                </Text>
              </LinearGradient>
            )}
          </View>
        )}
        renderItem={({ item }) => <NotifCard notif={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient colors={['rgba(16,185,129,0.12)', 'transparent']} style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={36} color={colors.emerald} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>No notifications at this time.</Text>
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
  listContent: { padding: spacing.base, paddingBottom: TAB_BAR_HEIGHT + 16 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  titleIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: typography.xxl, fontWeight: '900', letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  criticalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.rose, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  criticalBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  totalBadge: {
    backgroundColor: colors.primaryGlow, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  totalBadgeText: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  // Critical banner
  criticalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, padding: 14, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.rose + '40',
  },
  criticalIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(244,63,94,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  criticalBannerText: { color: colors.rose, fontSize: 14, fontWeight: '700', flex: 1 },

  // Notification Card
  notifCard: {
    borderRadius: radius.md, borderWidth: 1.5,
    marginBottom: 12, flexDirection: 'row', overflow: 'hidden',
  },
  notifAccentBar: { width: 5 },
  notifBody: { flex: 1, padding: 16, gap: 12 },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notifIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  notifType: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifTime: { color: colors.dim, fontSize: 11, marginTop: 3 },
  priorityBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 7, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  priorityText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifMessage: { color: colors.textPrimary, fontSize: 14, lineHeight: 22 },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.white, fontSize: 19, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 14 },
});
