import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { operatorsRepo } from '@/data/repositories';

const AUTH_STORAGE_KEY = '@containers/auth_user';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'operator';
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAdmin: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  loginOperator: (usernameInput: string, passwordInput: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  loginAdmin: async () => false,
  loginOperator: async () => false,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
        }
      } catch (err) {
        console.error('Error cargando la sesión almacenada:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveUserSession = async (userObj: AuthUser | null) => {
    setUser(userObj);
    if (userObj) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const loginAdmin = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // El admin único es federico
    if (cleanUser === 'federico' && (cleanPass === '123456' || cleanPass === 'Admin123!')) {
      const adminUser: AuthUser = {
        id: 'admin-federico',
        name: 'Federico',
        username: 'federico',
        role: 'admin',
      };
      await saveUserSession(adminUser);
      return true;
    }
    return false;
  };

  const loginOperator = async (usernameOrIdInput: string, passwordInput: string): Promise<boolean> => {
    const cleanInput = usernameOrIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const operators = await operatorsRepo.list();
    const found = operators.find((op) => {
      if (!op.active) return false;
      const matchId = op.id === usernameOrIdInput;
      const matchUsername = op.username && op.username.trim().toLowerCase() === cleanInput;
      const matchName = op.full_name && op.full_name.trim().toLowerCase() === cleanInput;
      if (!matchId && !matchUsername && !matchName) return false;

      // Si el chofer tiene contraseña configurada, debe coincidir. Si no tiene, se acepta '123456' o cualquier clave ingresada.
      if (op.password && op.password.trim()) {
        return op.password.trim() === cleanPass;
      }
      return true;
    });

    if (found) {
      const opUser: AuthUser = {
        id: found.id,
        name: found.full_name,
        username: found.username || found.full_name,
        role: 'operator',
      };
      await saveUserSession(opUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await saveUserSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginAdmin,
        loginOperator,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
