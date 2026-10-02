import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, radius, shadows, spacing, typography } from '../theme';
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
      <View style={styles.orb3} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoRing}>
                <LinearGradient colors={gradients.primary} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="shield-checkmark" size={38} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.logoTitle}>HERPASS</Text>
              <Text style={styles.logoSub}>Girls Hostel Outing Management</Text>
              <View style={styles.versionBadge}>
                <View style={styles.versionDot} />
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
              <Text style={styles.cardSubtitle}>Sign in to your account</Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="mail" size={18} color={focusedField === 'email' ? colors.primary : colors.dim} />
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
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="lock-closed" size={18} color={focusedField === 'password' ? colors.primary : colors.dim} />
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
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={colors.muted} />
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
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </View>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Quick Demo Login</Text>
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
                      colors={i === 0 ? ['rgba(99,102,241,0.14)', 'rgba(99,102,241,0.06)'] : ['rgba(139,92,246,0.14)', 'rgba(139,92,246,0.06)']}
                      style={styles.demoBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.demoIcon, { backgroundColor: i === 0 ? colors.primaryGlow : colors.accentGlow }]}>
                        <Ionicons name={i === 0 ? 'person-circle' : i === 1 ? 'shield-half' : 'school'} size={20} color={i === 0 ? colors.primary : colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.demoRole}>{u.label}</Text>
                        <Text style={styles.demoEmail}>{u.email}</Text>
                      </View>
                      <View style={styles.demoArrow}>
                        <Ionicons name="chevron-forward" size={14} color={colors.dim} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.footer}>🔒 All data is encrypted & secure</Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.base, paddingVertical: spacing.xxl },

  // Decorative
  orb1: {
    position: 'absolute', top: -100, left: -70,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(99,102,241,0.09)',
  },
  orb2: {
    position: 'absolute', bottom: 80, right: -90,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.07)',
  },
  orb3: {
    position: 'absolute', top: '40%', left: '30%',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(99,102,241,0.04)',
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: spacing.xxl },
  logoRing: {
    width: 108, height: 108, borderRadius: 30,
    borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, backgroundColor: 'rgba(99,102,241,0.08)',
  },
  logoBox: {
    width: 86, height: 86, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.primary,
  },
  logoTitle: {
    fontSize: 34, fontWeight: '900', letterSpacing: 7, color: '#F1F5F9',
    textShadowColor: 'rgba(99,102,241,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  logoSub: { color: colors.muted, fontSize: 14, marginTop: 7, letterSpacing: 0.3 },
  versionBadge: {
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(99,102,241,0.07)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald },
  versionText: { color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: spacing.md, overflow: 'hidden',
    ...shadows.card,
  },
  cardAccent: { height: 3, borderRadius: 2, marginBottom: spacing.xs },
  cardTitle: { color: colors.white, fontSize: typography.xxl, fontWeight: '800', letterSpacing: -0.3 },
  cardSubtitle: { color: colors.muted, fontSize: typography.sm, marginTop: -8 },

  // Fields
  field: { gap: spacing.sm },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgMuted, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    height: 56,
  },
  inputWrapFocused: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.05)' },
  inputIconWrap: {
    width: 50, alignItems: 'center', justifyContent: 'center',
  },
  input: { flex: 1, color: colors.white, fontSize: typography.base, paddingRight: 14 },
  eyeBtn: { paddingHorizontal: 16 },

  // Login button
  loginBtnWrap: { marginTop: spacing.xs },
  loginBtn: {
    height: 58, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.primary,
  },
  loginBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtnText: { color: '#fff', fontSize: typography.md, fontWeight: '800', letterSpacing: 0.5 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Demo
  demoGrid: { gap: 10 },
  demoBtn: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  demoBtnFirst: { borderColor: 'rgba(99,102,241,0.3)' },
  demoBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  demoIcon: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  demoRole: { color: colors.white, fontSize: 14, fontWeight: '700' },
  demoEmail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  demoArrow: { paddingLeft: 4 },

  // Footer
  footer: { color: colors.dimmer, fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
