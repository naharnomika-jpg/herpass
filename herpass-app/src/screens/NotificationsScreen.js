import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { POLL_INTERVAL } from '../config';

function NotifCard({ notif }) {
  const isCritical = notif.priority === 'CRITICAL';
  return (
    <View style={[styles.notifCard, isCritical && styles.criticalCard]}>
      <View style={styles.notifHeader}>
        <Text style={[styles.notifType, { color: isCritical ? colors.rose : colors.blue }]}>
          {notif.type}
        </Text>
        <Text style={styles.notifTime}>{notif.created_at?.split(' ')[1] || ''}</Text>
      </View>
      <Text style={styles.notifMessage}>{notif.message}</Text>
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={n => String(n.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.pink} />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Ionicons name="notifications" size={22} color={colors.pink} />
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <NotifCard notif={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.dim} />
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
  listContent: { padding: 14, paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  title: { color: colors.white, fontSize: 20, fontWeight: '800', flex: 1 },
  badgeWrap: {
    backgroundColor: colors.rose, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  notifCard: {
    backgroundColor: colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10, gap: 6,
  },
  criticalCard: {
    borderColor: colors.rose,
    backgroundColor: 'rgba(153,27,27,0.2)',
  },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifType: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifTime: { color: colors.dim, fontSize: 11 },
  notifMessage: { color: colors.white, fontSize: 13, lineHeight: 18 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 13 },
});
