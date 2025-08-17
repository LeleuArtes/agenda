<template>
  <div class="agendamento-bg">
    <div class="agendamento-card">
      <h1 class="highlight">Agenda Completa</h1>
      <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 16px;">
        <button @click="irParaServicos" class="servicos-btn">Painel de Serviços</button>
      </div>
      <div class="periodo-section">
        <label class="destaque-label">Filtrar por período:</label>
        <VueDatePicker
          v-model="periodoSelecionado"
          :range="true"
          :format="'dd/MM/yyyy'"
          :enable-time-picker="false"
          :locale="'pt-BR'"
          :dark="true"
          :auto-apply="true"
          class="vuepic-datepicker"
        />
      </div>
      <div v-if="agendamentos.length === 0">Nenhum agendamento encontrado.</div>
      <div v-for="(ags, dia) in agendamentosPorDia" :key="dia" class="dia-section">
        <h2 class="dia-titulo">{{ dia }} — Total: R$ {{ somaPorDia[dia]?.toFixed(2) || '0.00' }}</h2>
        <div v-for="ag in ags" :key="ag.id" class="agendamento-item">
          <div>
            <strong>Data:</strong> {{ ag.data }}<br>
            <strong>Horário:</strong> {{ ag.horario }}<br>
            <strong>Cliente:</strong> {{ ag.cliente_nome || '-' }}<br>
            <strong>Telefone:</strong> {{ ag.cliente_telefone ? ag.cliente_telefone : '-' }}<br>
            <strong>Bairro:</strong> {{ ag.cliente_bairro || '-' }}<br>
            <strong>Serviços:</strong> {{ JSON.parse(ag.servicos).join(', ') }}<br>
            <strong>Total:</strong> R$ {{ ag.valor_total.toFixed(2) }}<br>
            <div v-if="abatimentosPorAgendamento[ag.id]?.lista?.length">
              <h4>Histórico de Abatimentos</h4>
              <div v-for="ab in abatimentosPorAgendamento[ag.id].lista" :key="ab.id" class="abatimento-item">
                <strong>Valor:</strong> R$ {{ ab.valor.toFixed(2) }}<br>
                <strong>Data:</strong> {{ new Date(ab.data).toLocaleDateString('pt-BR') }}<br>
                <span v-if="ab.observacao"><strong>Obs:</strong> {{ ab.observacao }}</span>
              </div>
            </div>
            <strong>Status:</strong> <span :class="ag.status === 'ativo' ? 'ativo' : 'cancelado'">{{ ag.status }}</span><br>
            <strong>Pagamento:</strong> <span :class="ag.pagamento === 'PG' ? 'pg' : ag.pagamento === 'AG' ? 'ag' : ''">{{ ag.pagamento || '-' }}</span><br>
            <div class="botoes-agendamento" style="display: flex; gap: 10px; margin-top: 8px;">
              <button v-if="ag.status === 'ativo'" @click="alterarPagamento(ag.id, 'PG')" class="pg-btn">PG</button>
              <button v-if="ag.status === 'ativo'" @click="alterarPagamento(ag.id, 'AG')" class="ag-btn">AG</button>
              <button v-if="ag.status === 'ativo'" @click="cancelarAgendamento(ag.id)" class="cancelar-btn">Cancelar</button>
              <button @click="abrirHistoricoPagamento(ag.user_id)" class="historico-pag-btn">Histórico</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showHistoricoPagamento" class="modal-bg">
    <div class="modal">
      <h2>Histórico de Pagamento do Cliente</h2>
      <div class="filtro-pag">
        <button @click="filtroPagamento = 'PG'" :class="filtroPagamento === 'PG' ? 'pg-btn' : ''">PG</button>
        <button @click="filtroPagamento = 'AG'" :class="filtroPagamento === 'AG' ? 'ag-btn' : ''">AG</button>
      </div>
      <div style="margin-bottom: 12px; font-weight: bold;">
        Valor Total: R$ {{ somaTotalHistoricoPagamento.toFixed(2) }}
      </div>
      <div v-if="historicoPagamentos.length === 0">Nenhum registro encontrado.</div>
      <div v-for="pag in historicoPagamentosFiltrado" :key="pag.id" class="historico-pag-item">
        <strong>Data:</strong> {{ pag.data }}<br>
        <strong>Horário:</strong> {{ pag.horario }}<br>
        <strong>Serviços:</strong> {{ JSON.parse(pag.servicos).join(', ') }}<br>
        <strong>Total:</strong> R$ {{ pag.valor_total.toFixed(2) }}<br>
        <strong>Status:</strong> <span :class="pag.status === 'ativo' ? 'ativo' : 'cancelado'">{{ pag.status }}</span><br>
        <strong>Pagamento:</strong> <span :class="pag.pagamento === 'PG' ? 'pg' : pag.pagamento === 'AG' ? 'ag' : ''">{{ pag.pagamento || '-' }}</span><br>
      </div>
      <button @click="fecharHistoricoPagamento" class="voltar-btn">Fechar</button>
    </div>
  </div>
</template>

<script setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../supabase/supabase';

const router = useRouter();

function irParaServicos() {
  router.push({ path: '/barbeiro/servicos' });
}

const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 1);
const endOfYear = new Date(now.getFullYear(), 11, 31);
const agendamentos = ref([]);
const periodoSelecionado = ref([now, endOfYear]);
const abatimentosPorAgendamento = ref({});
const abatimentoAberto = ref(null);
const valorAbatimento = ref(0);
const observacaoAbatimento = ref('');
const showHistoricoPagamento = ref(false);
const historicoPagamentos = ref([]);
const filtroPagamento = ref('');

async function carregarAbatimentos(agendamentos) {
  const ids = agendamentos.map(a => a.id);
  if (!ids.length) return;
  const { data } = await supabase
    .from('abatimentos')
    .select('*')
    .in('agendamento_id', ids);
  const agrupados = {};
  ids.forEach(id => {
    const lista = (data || []).filter(ab => ab.agendamento_id === id);
    agrupados[id] = {
      lista,
      valorAbatido: lista.reduce((acc, ab) => acc + ab.valor, 0)
    };
  });
  abatimentosPorAgendamento.value = agrupados;
}

const historicoPagamentosFiltrado = computed(() => {
  if (!filtroPagamento.value) return historicoPagamentos.value;
  return historicoPagamentos.value.filter(p => p.pagamento === filtroPagamento.value);
});

const totalHistoricoPagamento = computed(() => {
  return historicoPagamentosFiltrado.value.reduce((acc, pag) => acc + pag.valor_total, 0);
});

const somaTotalHistoricoPagamento = computed(() => {
  return historicoPagamentosFiltrado.value.reduce((acc, ag) => acc + (ag.valor_total || 0), 0);
});

const agendamentosFiltrados = computed(() => {
  return agendamentos.value.filter(ag => {
    const dataAgendamento = new Date(ag.data);
    return dataAgendamento >= periodoSelecionado.value[0] && dataAgendamento <= periodoSelecionado.value[1];
  });
});

const agendamentosPorDia = computed(() => {
  const grupos = {};
  agendamentos.value.forEach(ag => {
    if (!grupos[ag.data]) grupos[ag.data] = [];
    grupos[ag.data].push(ag);
  });
  return grupos;
});

const somaPorDia = computed(() => {
  const soma = {};
  agendamentos.value.forEach(ag => {
    if (ag.status === 'ativo') {
      if (!soma[ag.data]) soma[ag.data] = 0;
      soma[ag.data] += ag.valor_total;
    }
  });
  return soma;
});

async function carregarAgenda() {
  // Busca agendamentos
  let query = supabase.from('agendamentos').select('*').order('data', { ascending: true });
  if (periodoSelecionado.value && periodoSelecionado.value.length === 2) {
    const dataIni = new Date(periodoSelecionado.value[0]);
    dataIni.setHours(0,0,0,0);
    const dataFim = new Date(periodoSelecionado.value[1]);
    dataFim.setHours(0,0,0,0);
    query = query.gte('data', dataIni.toISOString().slice(0,10)).lte('data', dataFim.toISOString().slice(0,10));
  }
  const { data, error } = await query;
  if (!data) {
    agendamentos.value = [];
    return;
  }
  // Busca perfis dos clientes
  const userIds = [...new Set(data.map(ag => ag.user_id))];
  let perfis = [];
  if (userIds.length > 0) {
    const { data: perfisData } = await supabase
      .from('profiles')
      .select('id, nome, telefone, email, bairro, role')
      .in('id', userIds);
    perfis = perfisData || [];
  }
  console.log('userIds:', userIds);
  console.log('perfis:', perfis);
  console.log('agendamentos:', data);
  // Associa nome e telefone ao agendamento, trata nulos
  agendamentos.value = data.map(ag => {
    const perfil = perfis.find(p => p.id === ag.user_id);
    return {
      ...ag,
      cliente_nome: perfil?.nome || '',
      cliente_telefone: perfil?.telefone || '',
      cliente_email: perfil?.email || '',
      cliente_bairro: perfil?.bairro || '',
      cliente_role: perfil?.role || ''
    };
  });
}

// Chame carregarAbatimentos sempre que agendamentos forem carregados
watch(agendamentos, (ags) => {
  carregarAbatimentos(ags);
});
watch(periodoSelecionado, carregarAgenda);
onMounted(carregarAgenda);

function abrirHistoricoPagamento(userId) {
  // Filtra os agendamentos do cliente pelo userId
  historicoPagamentos.value = agendamentos.value.filter(ag => ag.user_id === userId);
  filtroPagamento.value = 'PG'; // ou '' para mostrar todos por padrão
  showHistoricoPagamento.value = true;
}
function fecharHistoricoPagamento() {
  showHistoricoPagamento.value = false;
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
  max-width: 320px;
  width: 90vw;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  padding: 16px 16px;
  background: #181a24;
  border: 2px solid #FFA500;
  border-radius: 18px;
  padding: 36px 32px 24px 32px;
  max-width: 600px;
  width: 100%;
  text-align: center;
}
.card-agendamento {
  background: #23243a;
  border-radius: 12px;
  padding: 18px 12px;
  margin-bottom: 18px;
  color: #FFD700;
  box-shadow: 0 2px 12px #0004;
  position: relative;
}
@media (max-width: 600px) {
  .agendamento-card {
    max-width: 320px;
    width: 90vw;
    margin-left: auto;
    margin-right: auto;
    padding: 8px 8px;
  }
  .botoes-agendamento {
    justify-content: center;
    gap: 8px;
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
.pg {
  color: #00e676;
  font-weight: bold;
}
.ag {
  color: #FFD700;
  font-weight: bold;
}
.pg-btn {
  background: #00e676;
  color: #181a24;
  border: 2px solid #00e676;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-right: 8px;
  margin-top: 8px;
  transition: background 0.2s;
}
.pg-btn:hover {
  background: #00c853;
  border-color: #00c853;
}
.ag-btn {
  background: #FFD700;
  color: #181a24;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-right: 8px;
  margin-top: 8px;
  transition: background 0.2s;
}
.ag-btn:hover {
  background: #FFC300;
  border-color: #FFC300;
}
.dia-section {
  margin-bottom: 32px;
}
.dia-titulo {
  color: #FFD700;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 8px;
  margin-top: 18px;
}
.soma-dia {
  color: #FFD700;
  font-weight: bold;
  margin-top: 8px;
}
.periodo-section {
  margin-bottom: 18px;
  text-align: left;
}
.cancelar-btn {
  background: none;
  color: #ff1744;
  border: 2px solid #ff1744;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
}
.cancelar-btn:hover {
  background: #ff1744;
  color: #fff;
}
.modal-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #181a24;
  border: 2px solid #FFD700;
  border-radius: 16px;
  padding: 32px 24px 32px 24px;
  max-width: 400px;
  width: 100%;
  color: #FFD700;
  box-shadow: 0 8px 32px #0008;
  text-align: left;
  max-height: 80vh;
  overflow-y: auto;
  margin-left: 5vw;
  margin-right: 5vw;
  margin-top: 6vh;
  margin-bottom: 6vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
@media (max-width: 600px) {
  .modal {
    max-width: 98vw;
    margin-left: 3vw;
    margin-right: 3vw;
    margin-top: 3vh;
    margin-bottom: 3vh;
    padding: 18px 8px 18px 8px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
}
.filtro-pag {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.historico-pag-btn {
  background: #23243a;
  color: #FFD700;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
  align-self: center;
  margin-top: 18px;
  margin-bottom: 0;
}
.historico-pag-btn:hover {
  background: #FFD700;
  color: #181a24;
}
.historico-pag-item {
  background: #23243a;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  color: #FFD700;
}
.voltar-btn {
  background: none;
  color: #ff1744;
  border: 2px solid #ff1744;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
  align-self: center;
}
.voltar-btn:hover {
  background: #ff1744;
  color: #fff;
}
.total-historico {
  margin-top: 16px;
  font-weight: bold;
}
.total-pagamento {
  margin-top: 16px;
  font-weight: bold;
  text-align: right;
}
.abatimento-btn {
  background: #FFD700;
  color: #181a24;
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
}
.abatimento-btn:hover {
  background: #FFC300;
  border-color: #FFC300;
}
.abatimento-form {
  background: #23243a;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  color: #FFD700;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.abatimento-item {
  background: #23243a;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 6px;
  color: #FFD700;
}
.botoes-agendamento {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  justify-content: flex-start;
}
</style>
