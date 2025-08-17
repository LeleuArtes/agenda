<template>
  <div class="agendamento-bg">
    <div class="agendamento-card card">
      <h1 class="highlight">Histórico de Agendamentos</h1>
      <div v-if="agendamentos.length === 0">Nenhum agendamento encontrado.</div>
      <div v-for="ag in agendamentos" :key="ag.id" class="agendamento-item">
        <div>
          <strong>Data:</strong> {{ ag.data }}<br>
          <strong>Horário:</strong> {{ ag.horario }}<br>
          <strong>Serviços:</strong> {{ JSON.parse(ag.servicos).join(', ') }}<br>
          <strong>Total:</strong> R$ {{ ag.valor_total.toFixed(2) }}<br>
          <strong>Status:</strong> <span :class="ag.status === 'ativo' ? 'ativo' : 'cancelado'">{{ ag.status }}</span>
        </div>
        <button v-if="ag.status === 'ativo'" @click="cancelarAgendamento(ag.id)" class="cancelar-btn">Cancelar</button>
      </div>
      <button class="voltar-btn" @click="voltar">Voltar</button>
      <p v-if="mensagem" class="mensagem">{{ mensagem }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../supabase/supabase';
import { useUserStore } from '../../store/user';

const router = useRouter();
const userStore = useUserStore();
const agendamentos = ref([]);
const mensagem = ref('');

async function carregarHistorico() {
  if (!userStore.user) return;
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('user_id', userStore.user.id)
    .order('data', { ascending: false });
  agendamentos.value = data || [];
}
onMounted(carregarHistorico);

async function cancelarAgendamento(id) {
  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', id);
  if (error) {
    mensagem.value = 'Erro ao cancelar: ' + error.message;
  } else {
    mensagem.value = 'Agendamento cancelado!';
    await carregarHistorico();
  }
}
function voltar() {
  router.push('/cliente/agendamento');
}
</script>

<style scoped>
.agendamento-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #23243a 0%, #121212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.agendamento-card {
  background: #181a24;
  border: 2px solid #FFA500;
  border-radius: 18px;
  box-shadow: 0 8px 32px #0006;
  padding: 36px 32px 24px 32px;
  max-width: 500px;
  width: 100%;
  text-align: center;
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
  margin-bottom: 16px;
}
.agendamento-item {
  background: #23243a;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  text-align: left;
}
.ativo {
  color: #00e676;
}
.cancelado {
  color: #ff1744;
}
.voltar-btn {
  background: none;
  color: #FFD700;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
}
.mensagem {
  color: #FFD700;
  margin-top: 10px;
}
.cancelar-btn {
  background: #ff1744;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
}
</style>
