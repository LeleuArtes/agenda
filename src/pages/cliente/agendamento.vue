<template>
  <div class="agendamento-bg">
    <div class="agendamento-card card">
      <div class="leleuartes-titulo">LeleuArtes</div>
      <h1 class="highlight">Agendamento de Serviços</h1>
      <div class="calendar-section calendar-center">
        <label class="data-label">Escolha a data:</label>
        <VueDatePicker
          v-model="dataSelecionada"
          :format="'dd/MM/yyyy'"
          :enable-time-picker="false"
          :locale="'pt-BR'"
          :dark="true"
          :inline="true"
          :auto-apply="true"
          :min-date="new Date()"
          :month-change-on-scroll="false"
          class="vuepic-datepicker"
        />
        <div style="margin-top:8px;color:#FFD700;font-weight:bold;">
          Data selecionada: {{ formatarDataPtBr(dataSelecionada) }}
          <div style="font-size:1.1rem;margin-top:2px;text-align:center;">
            {{ diaSemanaPtBr(dataSelecionada) }}
          </div>
        </div>
      </div>
      <div class="horarios-section">
        <label class="destaque-label">Horário:</label>
        <div class="horarios-list">
          <button v-for="hora in horarios" :key="hora" :disabled="!horarioDisponivel(hora)" :class="horarioClass(hora)" @click="selecionarHorario(hora)">
            {{ hora }}
          </button>
        </div>
      </div>
      <div class="servicos-section">
        <label class="destaque-label">Serviços:</label>
        <div class="servicos-list">
          <button
            v-for="servico in servicos"
            :key="servico.nome"
            type="button"
            :class="servicoClass(servico) + ' servico-btn'"
            @click="toggleServico(servico)"
          >
            {{ servico.nome }} - R$ {{ servico.preco.toFixed(2) }}
          </button>
        </div>
      </div>
      <div class="total-section">
        <span>Total: R$ {{ totalServicos.toFixed(2) }}</span>
      </div>
      <button class="agendar-btn" :disabled="!podeAgendar" @click="agendar">Agendar</button>
      <button class="historico-btn" @click="irParaHistorico">Histórico</button>
      <button class="sair-btn" @click="sair">Sair</button>
      <p v-if="!userStore.user" class="mensagem">Faça login para agendar.</p>
      <p v-else-if="mensagem" class="mensagem">{{ mensagem }}</p>
    </div>
  </div>
</template>

<script setup>
// Botão de seleção de serviço
function toggleServico(servico) {
  const idx = servicosSelecionados.value.findIndex(s => s.nome === servico.nome);
  if (idx === -1) {
    servicosSelecionados.value.push(servico);
  } else {
    servicosSelecionados.value.splice(idx, 1);
  }
}

function servicoClass(servico) {
  return servicosSelecionados.value.some(s => s.nome === servico.nome)
    ? 'servico-selecionado' : 'servico-disponivel';
}
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../supabase/supabase';
import { useUserStore } from '../../store/user';

import { format } from 'date-fns';

const router = useRouter();
const userStore = useUserStore();
const dataSelecionada = ref(new Date());
const horarioSelecionado = ref('');
const servicosSelecionados = ref([]);
const mensagem = ref('');
const horarios = Array.from({ length: 16 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
// ...existing code...
const servicos = ref([]);

async function carregarServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('id, nome, valor');
  if (!error && data) {
    servicos.value = data.map(s => ({ nome: s.nome, preco: Number(s.valor) }));
  }
}

onMounted(() => {
  userStore.fetchProfile();
  carregarAgendamentos();
  carregarServicos();
});
const agendamentosDia = ref([]);

function formatarDataPtBr(date) {
  if (!date) return '';
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (e) {
    return '';
  }
}

// Função para retornar o dia da semana em pt-BR
function diaSemanaPtBr(date) {
  if (!date) return '';
  try {
    const dias = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
    return dias[date.getDay()];
  } catch (e) {
    return '';
  }
}

watch(dataSelecionada, (novaData) => {
  console.log('Data selecionada:', novaData);
});

const totalServicos = computed(() => servicosSelecionados.value.reduce((acc, s) => acc + s.preco, 0));
const podeAgendar = computed(() => userStore.user && dataSelecionada.value && horarioSelecionado.value && servicosSelecionados.value.length > 0);

function horarioDisponivel(hora) {
  // Se for hoje, bloqueia horários que já passaram ou são iguais à hora atual
  const hoje = new Date();
  const selecionada = dataSelecionada.value;
  const ehHoje = selecionada.getFullYear() === hoje.getFullYear() &&
    selecionada.getMonth() === hoje.getMonth() &&
    selecionada.getDate() === hoje.getDate();
  const horaInt = parseInt(hora.split(':')[0], 10);
  if (ehHoje && horaInt <= hoje.getHours()) return false;
  // Bloqueia horários já agendados
  return !agendamentosDia.value.some(a => a.horario === hora && a.status === 'ativo');
}
function horarioClass(hora) {
  const hoje = new Date();
  const selecionada = dataSelecionada.value;
  const ehHoje = selecionada.getFullYear() === hoje.getFullYear() &&
    selecionada.getMonth() === hoje.getMonth() &&
    selecionada.getDate() === hoje.getDate();
  const horaInt = parseInt(hora.split(':')[0], 10);
  if (ehHoje && horaInt <= hoje.getHours()) return 'horario-passado';
  if (agendamentosDia.value.some(a => a.horario === hora && a.status === 'ativo')) return 'horario-agendado';
  if (hora === horarioSelecionado.value) return 'horario-selecionado';
  return 'horario-disponivel';
}
function selecionarHorario(hora) {
  if (horarioDisponivel(hora)) horarioSelecionado.value = hora;
}
async function carregarAgendamentos() {
  const data = new Date(dataSelecionada.value);
  data.setHours(0, 0, 0, 0);
  const dataFormatada = data.toISOString().slice(0, 10);
  const { data: agData, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('data', dataFormatada);
  agendamentosDia.value = agData || [];
}
onMounted(() => {
  userStore.fetchProfile();
  carregarAgendamentos();
});
watch(dataSelecionada, carregarAgendamentos);

async function agendar() {
  if (!userStore.user) {
    mensagem.value = 'Faça login para agendar.';
    return;
  }
  const data = new Date(dataSelecionada.value);
  data.setHours(0, 0, 0, 0);
  const dataFormatada = data.toISOString().slice(0, 10);
  const { error } = await supabase.from('agendamentos').insert({
    user_id: userStore.user.id,
    data: dataFormatada,
    horario: horarioSelecionado.value,
    servicos: JSON.stringify(servicosSelecionados.value.map(s => s.nome)),
    valor_total: totalServicos.value,
    status: 'ativo',
    pagamento: 'AG'
  });
  if (error) {
    mensagem.value = 'Erro ao agendar: ' + error.message;
  } else {
    mensagem.value = 'Agendamento realizado com sucesso!';
    await carregarAgendamentos();
    horarioSelecionado.value = '';
    servicosSelecionados.value = [];
  }
}
function sair() {
  router.push('/login');
}
function irParaHistorico() {
  router.push('/cliente/historico');
}
</script>

<style scoped>
/* Centraliza o calendário VueDatePicker */
.calendar-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
/* Destaque para Horário e Serviços */
.destaque-label {
  color: #FFD700;
  font-weight: bold;
  font-size: 1.15rem;
  letter-spacing: 1px;
}
/* Título LeleuArtes igual ao login */
.leleuartes-titulo {
  color: #FFD700;
  font-size: 2.4rem;
  font-weight: 900;
  text-align: center;
  margin-bottom: 18px;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px #0008;
}
.calendar-section {
  position: relative;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}
/* Estilização do Datepicker */
/* Estilização do VuePic Datepicker */
.vuepic-datepicker {
  /* border e box-shadow removidos para visual totalmente limpo */
  border-radius: 16px;
  padding: 12px 8px;
  margin-top: 10px;
  margin-bottom: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
/* Label amarelo igual ao texto de data selecionada */
.data-label {
  color: #FFD700;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 8px;
  text-align: center;
}
/* Oculta o input do Datepicker, mostrando apenas o calendário visual */
.dp__input {
  display: none !important;
}
.dp__theme_dark {
  --dp-background-color: #181a24;
  --dp-text-color: #FFD700;
  --dp-hover-color: #23243a;
  --dp-primary-color: #FFA500;
  --dp-secondary-color: #FFD700;
  --dp-border-radius: 12px;
  --dp-border-color: #FFA500;
}
.agendamento-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #23243a 0%, #121212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Box de agendamento restaurada */
.agendamento-card {
  background: #181a24;
  border: 2px solid #FFA500;
  border-radius: 18px;
  /* box-shadow removido para efeito limpo */
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
.calendar-section,
.horarios-section,
.servicos-section {
  margin-bottom: 18px;
  text-align: left;
}
.horarios-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}
.horarios-list button {
  min-width: 70px;
  padding: 8px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.horario-disponivel {
  background: #23243a;
  color: #00e676;
  border: 2px solid #00e676;
}
.horario-agendado {
  background: #23243a;
  color: #ff1744;
  border: 2px solid #ff1744;
  cursor: not-allowed;
}
.horario-selecionado {
  background: #FFD700;
  color: #23243a;
  border: 2px solid #FFD700;
}
/* Horário passado: cinza e não clicável */
.horario-passado {
  background: #444;
  color: #bbb;
  border: 2px solid #888;
  cursor: not-allowed;
}
/* Serviços em lista vertical com checkboxes */
/* Serviços como botões de seleção em lista vertical */
.servicos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.servico-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0px;
  text-align: left;
  font-size: 1rem;
}
.servico-disponivel {
  background: #23243a;
  color: #FFD700;
  border: 2px solid #FFD700;
}
.servico-selecionado {
  background: #FFD700;
  color: #23243a;
  border: 2px solid #FFD700;
}
.total-section {
  margin: 18px 0 10px 0;
  font-size: 1.2rem;
  color: #FFD700;
}
.agendar-btn {
  background: linear-gradient(90deg, #FFD700, #FFA500);
  color: #181a24;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 0px;
  transition: background 0.2s;
}
.agendar-btn:disabled {
  background: #888;
  color: #fff;
  cursor: not-allowed;
}
.historico-btn {
  background: none;
  color: #FFD700;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-left: 12px;
  margin-bottom: 8px;
}
.calendar-section {
  position: relative;
}
.calendar-popup {
  position: absolute;
  top: 40px;
  left: 0;
  z-index: 10;
}
.mensagem {
  color: #FFD700;
  margin-top: 10px;
}
.sair-btn {
  background: none;
  color: #ff1744;
  border: 2px solid #ff1744;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-left: 12px;
  margin-bottom: 8px;
  transition: background 0.2s;
}
.sair-btn:hover {
  background: #ff1744;
  color: #fff;
}
</style>
