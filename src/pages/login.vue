<template>
  <div class="bg-gradient-full">
    <div class="card">
      <h1 class="highlight">Barbearia LeleuArtes</h1>
      <p class="subtitle">Login</p>
      <p class="subtitle">Entre para acessar sua conta</p>
      <form @submit.prevent="login">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="Digite seu email" required />
        <label>Senha</label>
        <input v-model="password" type="password" placeholder="Digite sua senha" required />
        <button type="submit">Entrar</button>
      </form>
      <p class="link-text">Não tem uma conta? <router-link to="/cadastro">Cadastre-se</router-link></p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
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
  // Buscar perfil atualizado SEM CACHE
  const userId = data.user?.id;
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  // Só insere se não existir e não houve erro de chave duplicada
  if (!profile && (!profileError || (profileError.code !== '23505' && !profileError.message?.includes('duplicate key value')))) {
    const nomeLS = localStorage.getItem('leleu_nome') || data.user?.user_metadata?.nome || '';
    const bairroLS = localStorage.getItem('leleu_bairro') || '';
    const telefoneLS = localStorage.getItem('leleu_telefone') || '';
    const emailLS = localStorage.getItem('leleu_email') || email.value;
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email: emailLS,
      nome: nomeLS,
      bairro: bairroLS,
      telefone: telefoneLS,
      role: 'user'
    });
    if (insertError && insertError.message?.includes('duplicate key value')) {
      // Se duplicado, ignora e segue
    } else if (insertError) {
      error.value = 'Erro ao criar perfil: ' + insertError.message;
      return;
    }
    // Buscar novamente após criar
    ({ data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single());
    // Limpa dados do localStorage
    localStorage.removeItem('leleu_nome');
    localStorage.removeItem('leleu_bairro');
    localStorage.removeItem('leleu_telefone');
    localStorage.removeItem('leleu_email');
  }
  // Buscar perfil novamente para garantir role atualizada
  ({ data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single());
  userStore.profile = profile;
  if (profile?.role === 'admin') {
    router.push('/barbeiro/modobarbeiro');
  } else {
    router.push('/cliente/agendamento');
  }
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
  padding: 36px 16px 24px 16px;
  max-width: 320px;
  width: 90vw;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
@media (max-width: 600px) {
  .card {
    max-width: 320px;
    width: 90vw;
    padding: 24px 8px 16px 8px;
    margin-left: auto;
    margin-right: auto;
  }
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
</style>
