<template>
  <div class="container">
    <h1 class="highlight">LeleuArtes - Cadastro</h1>
    <form @submit.prevent="signup">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="nome" type="text" placeholder="Nome" required />
      <input v-model="bairro" type="text" placeholder="Bairro" required />
      <input v-model="telefone" type="text" placeholder="Telefone" required />
      <input v-model="password" type="password" placeholder="Senha" required />
      <button type="submit">Cadastrar</button>
    </form>
    <router-link to="/login">Já tem conta? Login</router-link>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase/supabase';

const email = ref('');
const nome = ref('');
const bairro = ref('');
const telefone = ref('');
const password = ref('');
const error = ref('');
const success = ref('');

async function signup() {
  error.value = '';
  success.value = '';
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { nome: nome.value } }
  });
  if (signUpError) {
    error.value = signUpError.message;
    return;
  }
  // Cria perfil na tabela profiles
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: email.value,
      nome: nome.value,
      bairro: bairro.value,
      telefone: telefone.value,
      role: 'user'
    });
    if (profileError) {
      error.value = profileError.message;
      return;
    }
    success.value = 'Cadastro realizado! Confirme seu e-mail antes de logar.';
  }
}
</script>

<style scoped>
.container { max-width: 400px; margin: 40px auto; background: #222; padding: 32px; border-radius: 12px; }
.highlight { color: #FFD700; }
button { width: 100%; }
.error { color: #FFA500; margin-top: 10px; }
.success { color: #FFD700; margin-top: 10px; }
</style>
