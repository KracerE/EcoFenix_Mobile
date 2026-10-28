import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export const AuthScreen = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const { login, register } = useAuthStore();

  // Estados para el formulario de Inicio de Sesión (Requisito F-02)
  const [emailOrUser, setEmailOrUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Estados para el formulario de Registro (Requisito F-01)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(emailOrUser, loginPass);
      Alert.alert('¡Bienvenido!', 'Has iniciado sesión correctamente en EcoFénix.');
    } catch (err: any) {
      Alert.alert('Error de acceso', err.message);
    }
  };

  const handleRegister = async () => {
    try {
      await register({
        firstName,
        lastName,
        username,
        email,
        birthDate,
        address,
        password,
      });
      Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada y verificada en el sistema.');
    } catch (err: any) {
      Alert.alert('Validación de registro', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Banner de Cabecera (Basado en la Vista 14.2 del documento) */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroBannerTitle}>
          {mode === 'LOGIN' ? 'Accede a tu comunidad' : 'Únete a Segunda Vida'}
        </Text>
        <Text style={styles.heroBannerSub}>
          {mode === 'LOGIN'
            ? 'Entra y sigue compartiendo solidaridad y consumo responsable.'
            : 'Crea tu cuenta y empieza a donar o encontrar lo que necesitas.'}
        </Text>
      </View>

      <View style={styles.card}>
        {/* Pestañas de Navegación: Iniciar sesión / Registrarse */}
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'LOGIN' && styles.tabBtnActive]}
            onPress={() => setMode('LOGIN')}
          >
            <Text style={[styles.tabText, mode === 'LOGIN' && styles.tabTextActive]}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'REGISTER' && styles.tabBtnActive]}
            onPress={() => setMode('REGISTER')}
          >
            <Text style={[styles.tabText, mode === 'REGISTER' && styles.tabTextActive]}>
              Registrarse
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'LOGIN' ? (
          <View>
            <Text style={styles.label}>Usuario o correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={emailOrUser}
              onChangeText={setEmailOrUser}
              autoCapitalize="none"
              placeholder="Ej. mariag o maria@example.com"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={loginPass}
              onChangeText={setLoginPass}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
              <Text style={styles.submitBtnText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="María" />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="García" />
              </View>
            </View>

            <Text style={styles.label}>Nombre de usuario (username)</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="mariag"
            />

            <Text style={styles.label}>Fecha de nacimiento (aaaa-mm-dd)</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1990-05-15"
            />

            <Text style={styles.label}>Dirección principal</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Calle Principal 123, Medellín"
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="maria@example.com"
            />

            <Text style={styles.label}>Contraseña (mínimo 6 caracteres)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
              <Text style={styles.submitBtnText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9F6' },
  heroBanner: {
    backgroundColor: '#234F32',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroBannerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  heroBannerSub: { color: '#DDF3E4', fontSize: 13, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0EAE2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EAF4EC',
    borderRadius: 25,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 22, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#375142' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '600', color: '#5A7063', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#F5F9F6',
    borderWidth: 1,
    borderColor: '#D5E2D9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1B3B2B',
  },
  submitBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 22,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});