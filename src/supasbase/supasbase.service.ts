// src/supabase-auth/supabase-auth.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or Anon Key environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async signUpWithEmail(email: string, password: string) {
    //console.log('Signing in with email:', email, "password:", password);
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
