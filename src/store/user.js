import { defineStore } from 'pinia';
import { supabase } from '../supabase/supabase';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
  }),
  actions: {
    async fetchProfile() {
      this.loading = true;
      const { data: { user } } = await supabase.auth.getUser();
      this.user = user;
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        this.profile = data;
      }
      this.loading = false;
    },
    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.profile = null;
    }
  }
});
