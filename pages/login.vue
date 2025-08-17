<template>
  <div class="container">
    <h1 class="highlight">LeleuArtes - Login</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </form>
    <router-link to="/cadastro">Não tem conta? Cadastre-se</router-link>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase/supabase';
import { useUserStore } from '../store/user';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const userStore = useUserStore();

async function login() {
  error.value = '';
  const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
  if (loginError) {
    error.value = loginError.message;
    return;
  }
  await userStore.fetchProfile();
  if (userStore.profile?.role === 'admin') {
    router.push('/barbeiro/dashboard');
  } else {
    router.push('/cliente/dashboard');
  }
}
</script>

<style scoped>
.container { max-width: 400px; margin: 40px auto; background: #222; padding: 32px; border-radius: 12px; }
.highlight { color: #FFD700; }
button { width: 100%; }
.error { color: #FFA500; margin-top: 10px; }
</style>
