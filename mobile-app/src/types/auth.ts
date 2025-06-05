import { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: {
    access_token: string | null;
    refresh_token: string | null;
  } | null;
  isLoading: boolean;
}

export interface Profile {
  id: string;
  username: string;
  preferences: {
    autoPlay?: boolean;
    favoriteTeams?: string[];
  };
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
} 