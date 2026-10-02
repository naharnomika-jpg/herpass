import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius, shadows } from '../theme';
import { DEMO_USERS } from '../config';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid email or password.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  return (
    <LinearGradient colors={gradients.hero} style={styles.gradient}>
      {/* Decorative orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoRing}>
              <LinearGradient colors={gradients.primary} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="shield-checkmark" size={34} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.logoTitle}>HERPASS</Text>
            <Text style={styles.logoSub}>Girls Hostel Outing Management</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>SECURE · SMART · REAL-TIME</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Card accent strip */}
            <LinearGradient
              colors={gradients.primary}
              style={styles.cardAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />

            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="mail" size={16} color={focusedField === 'email' ? colors.primary : colors.dim} />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.edu"
                  placeholderTextColor={colors.dim}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="lock-closed" size={16} color={focusedField === 'password' ? colors.primary : colors.dim} />
                </View>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.dim}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtnWrap} activeOpacity={0.85}>
              <LinearGradient colors={gradients.primary} style={styles.loginBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <View style={styles.loginBtnInner}>
                      <Text style={styles.loginBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Quick Demo</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Users */}
            <View style={styles.demoGrid}>
              {DEMO_USERS.map((u, i) => (
                <TouchableOpacity
                  key={u.role}
                  style={[styles.demoBtn, i === 0 && styles.demoBtnFirst]}
                  onPress={() => quickLogin(u)}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={i === 0 ? ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.06)'] : ['rgba(139,92,246,0.12)', 'rgba(139,92,246,0.06)']}
                    style={styles.demoBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.demoIcon, { backgroundColor: i === 0 ? colors.primaryGlow : colors.accentGlow }]}>
                      <Ionicons name={i === 0 ? 'person-circle' : 'shield-half'} size={18} color={i === 0 ? colors.primary : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.demoRole}>{u.label}</Text>
                      <Text style={styles.demoEmail}>{u.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.dim} />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 48 },

  // Decorative
  orb1: {
    position: 'absolute', top: -80, left: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  orb2: {
    position: 'absolute', bottom: 60, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(139,92,246,0.06)',
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    width: 96, height: 96, borderRadius: 28,
    borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, backgroundColor: 'rgba(99,102,241,0.08)',
  },
  logoBox: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.primary,
  },
  logoTitle: {
    fontSize: 32, fontWeight: '900', letterSpacing: 6, color: '#F1F5F9',
    textShadowColor: 'rgba(99,102,241,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  logoSub: { color: colors.muted, fontSize: 13, marginTop: 6, letterSpacing: 0.3 },
  versionBadge: {
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  versionText: { color: colors.dim, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 24, gap: 16, overflow: 'hidden',
    ...shadows.card,
  },
  cardAccent: { height: 3, borderRadius: 2, marginBottom: 4 },
  cardTitle: { color: colors.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  cardSubtitle: { color: colors.muted, fontSize: 13, marginTop: -10 },

  // Fields
  field: { gap: 7 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgMuted, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    height: 50,
  },
  inputWrapFocused: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.05)' },
  inputIconWrap: {
    width: 44, alignItems: 'center', justifyContent: 'center',
  },
  input: { flex: 1, color: colors.white, fontSize: 14, paddingRight: 12 },
  eyeBtn: { paddingHorizontal: 14 },

  // Login button
  loginBtnWrap: { marginTop: 4 },
  loginBtn: {
    height: 54, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.primary,
  },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Demo
  demoGrid: { gap: 8 },
  demoBtn: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  demoBtnFirst: { borderColor: 'rgba(99,102,241,0.3)' },
  demoBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  demoIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  demoRole: { color: colors.white, fontSize: 13, fontWeight: '700' },
  demoEmail: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
