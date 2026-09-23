import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { DEMO_USERS } from '../config';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    <LinearGradient colors={['#0f172a', '#1a0a2e', '#0f172a']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#ec4899', '#e11d48']} style={styles.logoBox}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoTitle}>HERPASS</Text>
            <Text style={styles.logoSub}>Girls Hostel Outing Management System</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in to your account</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
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
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.dim}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ paddingHorizontal: 10 }}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtnWrap}>
              <LinearGradient colors={['#ec4899', '#be185d']} style={styles.loginBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.loginBtnText}>Sign In</Text>
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
            {DEMO_USERS.map(u => (
              <TouchableOpacity key={u.role} style={styles.demoBtn} onPress={() => quickLogin(u)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoRole}>{u.label}</Text>
                  <Text style={styles.demoEmail}>{u.email}</Text>
                </View>
                <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.pink} />
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#ec4899', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  logoTitle: {
    fontSize: 30, fontWeight: '900', letterSpacing: 4, color: '#f8fafc',
    textShadowColor: 'rgba(236,72,153,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  logoSub: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    padding: 22, gap: 14,
  },
  cardTitle: { color: colors.white, fontSize: 17, fontWeight: '700', marginBottom: 2 },

  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 46,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.white, fontSize: 14 },

  loginBtnWrap: { marginTop: 4 },
  loginBtn: {
    height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.dim, fontSize: 11, fontWeight: '600' },

  demoBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  demoRole: { color: colors.white, fontSize: 13, fontWeight: '700' },
  demoEmail: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
