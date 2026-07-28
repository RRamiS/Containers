import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/core/auth/AuthContext';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { operatorsRepo } from '@/data/repositories';
import type { Operator } from '@/data/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RoleTab = 'admin' | 'operator';

// Componente individual de Chofer con animación fluida de despliegue
function ChoferItemCard({
  op,
  isSelected,
  onSelect,
  password,
  setPassword,
  handleSubmit,
  submitting,
  isDark,
}: {
  op: Operator;
  isSelected: boolean;
  onSelect: () => void;
  password: string;
  setPassword: (val: string) => void;
  handleSubmit: () => void;
  submitting: boolean;
  isDark: boolean;
}) {
  const anim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isSelected ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isSelected, anim]);

  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 170],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View style={styles.choferCardWrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.choferItem,
          {
            backgroundColor: isSelected
              ? (isDark ? '#1F2736' : '#E6F0FF')
              : (isDark ? '#0D1117' : '#F6F8FA'),
            borderColor: isSelected
              ? '#0084FF'
              : (isDark ? '#30363D' : '#E1E4E8'),
          },
          pressed && { opacity: 0.85 },
        ]}
        onPress={onSelect}
      >
        {/* Avatar Circular */}
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.choferInfo}>
          <Text style={[styles.choferName, { color: isDark ? '#FFFFFF' : '#1F2328' }]}>
            {op.full_name}
          </Text>
          <Text style={styles.choferUsername}>
            @{op.username || 'sin_usuario'}
          </Text>
        </View>

        <Ionicons
          name={isSelected ? 'chevron-up-circle' : 'chevron-down-circle-outline'}
          size={22}
          color={isSelected ? '#0084FF' : isDark ? '#6E7681' : '#8C959F'}
        />
      </Pressable>

      {/* Despliegue Animidado del Formulario de Contraseña */}
      <Animated.View
        style={[
          styles.unfoldedFormAnimated,
          {
            maxHeight,
            opacity,
            transform: [{ translateY }],
            overflow: 'hidden',
          },
        ]}
      >
        <View
          style={[
            styles.unfoldedForm,
            {
              backgroundColor: isDark ? '#12161D' : '#F1F5F9',
              borderColor: isDark ? '#30363D' : '#D0D7DE',
            },
          ]}
        >
          <Text style={[styles.label, { color: isDark ? '#F0F6FC' : '#1F2328' }]}>
            Contraseña <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                borderColor: isDark ? '#30363D' : '#D0D7DE',
                color: isDark ? '#F0F6FC' : '#1F2328',
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Escribe tu contraseña"
            placeholderTextColor={isDark ? '#6E7681' : '#8C959F'}
            secureTextEntry
            autoFocus={isSelected}
          />

          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && { opacity: 0.85 },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-sharp"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.submitButtonText}>Iniciar</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const { loginAdmin, loginOperator } = useAuth();

  const [role, setRole] = useState<RoleTab>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lista de Choferes para el selector visual
  const [operatorsList, setOperatorsList] = useState<Operator[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  // Animación de desplazamiento entre pestañas Admin / Choferes
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void (async () => {
      setLoadingOperators(true);
      try {
        const list = await operatorsRepo.list();
        const activeOnly = list.filter((op) => op.active);
        setOperatorsList(activeOnly);
      } catch (err) {
        console.error('Error cargando choferes:', err);
      } finally {
        setLoadingOperators(false);
      }
    })();
  }, []);

  const handleRoleChange = (selectedRole: RoleTab) => {
    if (selectedRole === role) return;
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setRole(selectedRole);
    setUsername('');
    setPassword('');
    setSelectedOperator(null);

    Animated.spring(slideAnim, {
      toValue: selectedRole === 'admin' ? 0 : 1,
      useNativeDriver: false,
      tension: 68,
      friction: 11,
    }).start();
  };

  const handleSelectOperator = (op: Operator) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    if (selectedOperator?.id === op.id) {
      setSelectedOperator(null);
      setPassword('');
      return;
    }
    setSelectedOperator(op);
    setPassword('');
  };

  const handleSubmit = async () => {
    if (role === 'admin') {
      if (!username.trim()) {
        toast.warning('Campo requerido', 'Por favor ingresá tu nombre de usuario');
        return;
      }
      if (!password.trim()) {
        toast.warning('Campo requerido', 'Por favor ingresá tu contraseña');
        return;
      }
    } else {
      if (!selectedOperator) {
        toast.warning('Selección requerida', 'Por favor seleccioná un chofer de la lista');
        return;
      }
      if (!password.trim()) {
        toast.warning('Campo requerido', 'Por favor ingresá tu contraseña');
        return;
      }
    }

    setSubmitting(true);
    try {
      let success = false;
      if (role === 'admin') {
        success = await loginAdmin(username, password);
      } else if (selectedOperator) {
        success = await loginOperator(selectedOperator.id, password);
      }

      if (success) {
        toast.success(
          '¡Bienvenido!',
          role === 'admin'
            ? 'Has iniciado sesión como Administrador'
            : `Has iniciado sesión como Chofer (${selectedOperator?.full_name})`
        );
        router.replace('/');
      } else {
        toast.error(
          'Acceso denegado',
          role === 'admin'
            ? 'Usuario o contraseña de Administrador incorrectos'
            : 'Contraseña de chofer incorrecta'
        );
      }
    } catch (err) {
      toast.error('Error de autenticación', 'Ocurrió un problema al intentar iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = mode === 'dark';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0D1117' : '#F6F8FA' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBox}>
          <Ionicons name="cube-outline" size={44} color="#0084FF" />
          <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#1F2328' }]}>
            Containers App
          </Text>
          <Text style={[styles.brandSubtitle, { color: isDark ? '#8B949E' : '#6E7681' }]}>
            Sistema de Gestión de Alquileres e Inventario
          </Text>
        </View>

        {/* Card principal del Formulario (Tamaño fijo idéntico para ambas solapas) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#161B22' : '#FFFFFF',
              borderColor: isDark ? '#30363D' : '#D0D7DE',
            },
          ]}
        >
          {/* Selector de Rol: Admin vs Choferes con animación deslizante */}
          <View style={styles.roleSelectorContainer}>
            <Text style={[styles.roleSelectorLabel, { color: isDark ? '#C9D1D9' : '#24292F' }]}>
              Perfil de Acceso
            </Text>
            <View
              style={[
                styles.segmentedContainer,
                { backgroundColor: isDark ? '#0D1117' : '#EFF2F5' },
              ]}
            >
              <Animated.View
                style={[
                  styles.animatedTabPill,
                  {
                    left: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['1%', '50%'],
                    }),
                  },
                ]}
              />

              <Pressable
                style={styles.tabButton}
                onPress={() => handleRoleChange('admin')}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={role === 'admin' ? '#FFFFFF' : isDark ? '#8B949E' : '#57606A'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    role === 'admin' ? styles.tabTextActive : { color: isDark ? '#8B949E' : '#57606A' },
                  ]}
                >
                  Admin
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabButton}
                onPress={() => handleRoleChange('operator')}
              >
                <Ionicons
                  name="bus-outline"
                  size={18}
                  color={role === 'operator' ? '#FFFFFF' : isDark ? '#8B949E' : '#57606A'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    role === 'operator' ? styles.tabTextActive : { color: isDark ? '#8B949E' : '#57606A' },
                  ]}
                >
                  Choferes
                </Text>
              </Pressable>
            </View>
          </View>

          {/* CUERPO DEL CONTENEDOR */}
          <View style={styles.cardBody}>
            {role === 'admin' ? (
              /* VISTA 1: FORMULARIO ADMIN */
              <View style={styles.adminFormContainer}>
                {/* Campo: Usuario */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: isDark ? '#F0F6FC' : '#1F2328' }]}>
                    Usuario <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
                        borderColor: isDark ? '#30363D' : '#D0D7DE',
                        color: isDark ? '#F0F6FC' : '#1F2328',
                      },
                    ]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Escribe tu usuario"
                    placeholderTextColor={isDark ? '#6E7681' : '#8C959F'}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Campo: Contraseña */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: isDark ? '#F0F6FC' : '#1F2328' }]}>
                    Contraseña <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0D1117' : '#F6F8FA',
                        borderColor: isDark ? '#30363D' : '#D0D7DE',
                        color: isDark ? '#F0F6FC' : '#1F2328',
                      },
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Escribe tu contraseña"
                    placeholderTextColor={isDark ? '#6E7681' : '#8C959F'}
                    secureTextEntry
                  />
                  <Text style={[styles.helpText, { color: isDark ? '#8B949E' : '#6E7681' }]}>
                    Must be at least 6 characters
                  </Text>
                </View>

                {/* Botón de Acción Principal (Iniciar) */}
                <View style={styles.actionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.submitButton,
                      pressed && { opacity: 0.85 },
                      submitting && { opacity: 0.6 },
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.submitButtonText}>Iniciar</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              /* VISTA 2: LISTA DE CHOFERES CON SCROLL INTERNO Y ANIMACIÓN DESLIZANTE DE DESPLIEGUE */
              <View style={styles.choferesListContainer}>
                <Text style={[styles.label, { color: isDark ? '#F0F6FC' : '#1F2328', marginBottom: 10 }]}>
                  Seleccioná tu perfil de Chofer <Text style={styles.requiredAsterisk}>*</Text>
                </Text>

                {loadingOperators ? (
                  <ActivityIndicator size="small" color="#0084FF" style={{ marginVertical: 20 }} />
                ) : operatorsList.length === 0 ? (
                  <Text style={{ color: isDark ? '#8B949E' : '#6E7681', textAlign: 'center', marginVertical: 16 }}>
                    No hay choferes activos registrados en el sistema.
                  </Text>
                ) : (
                  <ScrollView
                    style={styles.innerScrollView}
                    contentContainerStyle={styles.choferesListScrollContent}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {operatorsList.map((op) => {
                      const isSelected = selectedOperator?.id === op.id;
                      return (
                        <ChoferItemCard
                          key={op.id}
                          op={op}
                          isSelected={isSelected}
                          onSelect={() => handleSelectOperator(op)}
                          password={password}
                          setPassword={setPassword}
                          handleSubmit={handleSubmit}
                          submitting={submitting}
                          isDark={isDark}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    height: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  roleSelectorContainer: {
    marginBottom: 16,
  },
  roleSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentedContainer: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  animatedTabPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '49%',
    backgroundColor: '#0084FF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
  },
  adminFormContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#F85149',
    fontWeight: 'bold',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  choferesListContainer: {
    flex: 1,
  },
  innerScrollView: {
    flex: 1,
  },
  choferesListScrollContent: {
    gap: 10,
    paddingRight: 4,
    paddingBottom: 8,
  },
  choferCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  choferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  choferInfo: {
    flex: 1,
  },
  choferName: {
    fontSize: 15,
    fontWeight: '700',
  },
  choferUsername: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '500',
  },
  unfoldedFormAnimated: {
    width: '100%',
  },
  unfoldedForm: {
    padding: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
  },
});
