<template>
  <div class="bg-gradient-full">
    <div class="card">
      <h1 class="highlight">Barbearia LeleuArtes</h1>
      <p class="subtitle">Cadastro</p>
      <p class="subtitle">Crie sua conta para agendar</p>
      <form @submit.prevent="signup">
        <label>Nome completo*</label>
        <input v-model="nome" type="text" placeholder="Digite seu nome" required />
        <label>Email*</label>
        <input v-model="email" type="email" placeholder="Digite seu email" required />
        <label>Telefone*</label>
        <input v-model="telefone" type="text" placeholder="(00) 00000-0000" required />
        <label>Bairro (opcional)</label>
        <input v-model="bairro" type="text" placeholder="Digite seu bairro" />
        <label>Senha*</label>
        <input v-model="password" type="password" placeholder="Digite sua senha" required />
        <button type="submit">Cadastrar</button>
      </form>
      <p class="link-text">Já tem uma conta? <router-link to="/login">Entrar</router-link></p>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </div>
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
  // Salva dados no localStorage para uso no login
  localStorage.setItem('leleu_bairro', bairro.value);
  localStorage.setItem('leleu_telefone', telefone.value);
  localStorage.setItem('leleu_nome', nome.value);
  localStorage.setItem('leleu_email', email.value);
  success.value = 'Cadastro realizado! Verifique seu e-mail para confirmar e depois faça login.';
}
</script>

<style scoped>
.bg-gradient-full {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(180deg, #23243a 0%, #121212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  background: #181a24;
  border: 2px solid #FFA500;
  border-radius: 18px;
  box-shadow: 0 8px 32px #0006;
  padding: 36px 32px 24px 32px;
  max-width: 350px;
  width: 100%;
  text-align: center;
}
.highlight {
  color: #FFD700;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.subtitle {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 18px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 10px;
}
label {
  color: #FFD700;
  font-size: 0.95rem;
  text-align: left;
  margin-bottom: 2px;
}
input {
  background: #23243a;
  color: #fff;
  border: 1.5px solid #FFA500;
  border-radius: 8px;
  padding: 10px;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
input:focus {
  border-color: #FFD700;
}
button {
  background: linear-gradient(90deg, #FFD700, #FFA500);
  color: #181a24;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
button:hover {
  background: linear-gradient(90deg, #FFA500, #FFD700);
}
.link-text {
  margin-top: 10px;
  color: #FFD700;
  font-size: 1rem;
}
.link-text a {
  color: #FFA500;
  font-weight: bold;
  text-decoration: none;
}
.error {
  color: #FF4081;
  margin-top: 10px;
}
.success {
  color: #FFD700;
  margin-top: 10px;
}
</style>
