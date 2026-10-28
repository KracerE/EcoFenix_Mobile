import { create } from 'zustand';
import { apiClient } from '../api/client';
import { UserResponseDTO } from '../types/models';

interface AuthState {
  user: UserResponseDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    birthDate: string;
    address: string;
    password: string;
  }) => Promise<void>;
  updateProfile: (updatedData: Partial<UserResponseDTO>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (emailOrUsername, password) => {
    try {
      const response = await apiClient.post('/user/login', {
        emailOrUsername,
        password,
      });
      const { token, user } = response.data;
      set({
        token,
        user: {
          ...user,
          addresses: ['Medellín'],
          roles: [{ id: 1, name: 'SELLER_DONOR' }, { id: 2, name: 'BUYER' }],
        },
        isAuthenticated: true,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al iniciar sesión con el servidor';
      throw new Error(msg);
    }
  },

  register: async (data) => {
    try {
      const response = await apiClient.post('/user/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate || null,
      });
      const savedUser = response.data;
      set({
        user: {
          ...savedUser,
          addresses: [data.address || 'Medellín'],
          roles: [{ id: 1, name: 'SELLER_DONOR' }, { id: 2, name: 'BUYER' }],
        },
        isAuthenticated: true,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'No se pudo registrar el usuario';
      throw new Error(msg);
    }
  },

  updateProfile: (updatedData) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updatedData } });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));