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
import { colors, gradients, radius } from '../theme';
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
            <Ionicons name={cfg.icon} size={16} color={cfg.iconColor} />
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
          <Ionicons name="notifications" size={22} color="#fff" />
        </LinearGradient>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 12 }} />
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
                  <Ionicons name="notifications" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.title}>Notifications</Text>
              </View>
              <View style={styles.badgeRow}>
                {criticalCount > 0 && (
                  <View style={styles.criticalBadge}>
                    <Ionicons name="warning" size={11} color="#fff" />
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
                colors={['rgba(244,63,94,0.12)', 'rgba(244,63,94,0.05)']}
                style={styles.criticalBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="warning" size={18} color={colors.rose} />
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
              <Ionicons name="checkmark-circle" size={32} color={colors.emerald} />
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
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  criticalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.rose, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  criticalBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  totalBadge: {
    backgroundColor: colors.primaryGlow, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  totalBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  // Critical banner
  criticalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radius.md, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: colors.rose + '40',
  },
  criticalBannerText: { color: colors.rose, fontSize: 13, fontWeight: '700', flex: 1 },

  // Notification Card
  notifCard: {
    borderRadius: radius.md, borderWidth: 1.5,
    marginBottom: 10, flexDirection: 'row', overflow: 'hidden',
  },
  notifAccentBar: { width: 4 },
  notifBody: { flex: 1, padding: 14, gap: 10 },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  notifIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  notifType: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifTime: { color: colors.dim, fontSize: 10, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  priorityText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifMessage: { color: colors.textPrimary, fontSize: 13, lineHeight: 20 },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13 },
});
