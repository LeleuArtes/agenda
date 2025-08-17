<template>
  <div class="servicos-panel">
    <h2>Painel de Serviços</h2>
    <div class="servicos-list">
      <div v-for="servico in servicos" :key="servico.id" class="servico-card">
        <div class="servico-info">
          <span class="servico-nome">{{ servico.nome }}</span>
          <span class="servico-valor">R$ {{ servico.valor }}</span>
        </div>
        <div class="servico-actions">
          <button @click="editarServico(servico)">Editar</button>
          <button @click="excluirServico(servico.id)">Excluir</button>
        </div>
      </div>
    </div>
    <div class="servico-form">
      <h3>{{ editando ? 'Editar Serviço' : 'Adicionar Serviço' }}</h3>
      <input v-model="form.nome" placeholder="Nome do serviço" />
      <input v-model.number="form.valor" type="number" placeholder="Valor (R$)" />
      <button @click="salvarServico">{{ editando ? 'Salvar' : 'Adicionar' }}</button>
      <button v-if="editando" @click="cancelarEdicao">Cancelar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase/supabase.js';

const servicos = ref([]);
const form = ref({ nome: '', valor: null });
const editando = ref(false);
const editId = ref(null);

async function carregarServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .order('criado_em', { ascending: false });
  if (!error) servicos.value = data;
}

async function salvarServico() {
  if (!form.value.nome || !form.value.valor) return;
  if (editando.value) {
    await supabase
      .from('servicos')
      .update({ nome: form.value.nome, valor: form.value.valor })
      .eq('id', editId.value);
  } else {
    await supabase
      .from('servicos')
      .insert({ nome: form.value.nome, valor: form.value.valor });
  }
  form.value = { nome: '', valor: null };
  editando.value = false;
  editId.value = null;
  carregarServicos();
}

function editarServico(servico) {
  form.value = { nome: servico.nome, valor: servico.valor };
  editando.value = true;
  editId.value = servico.id;
}

function cancelarEdicao() {
  form.value = { nome: '', valor: null };
  editando.value = false;
  editId.value = null;
}

async function excluirServico(id) {
  await supabase.from('servicos').delete().eq('id', id);
  carregarServicos();
}

onMounted(carregarServicos);
</script>

<style scoped>
.servicos-panel {
  max-width: 500px;
  margin: 40px auto;
  background: #222;
  color: #ffd700;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 16px #000a;
}
.servicos-list {
  margin-bottom: 32px;
}
.servico-card {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  background: #333;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.servico-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.servico-nome {
  font-weight: bold;
  font-size: 1.1em;
}
.servico-valor {
  font-size: 0.95em;
}
.servico-actions button {
  margin-left: 8px;
  background: #ffd700;
  color: #222;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}
.servico-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.servico-form input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ffd700;
  background: #222;
  color: #ffd700;
}
.servico-form button {
  background: #ffd700;
  color: #222;
  border: none;
  border-radius: 4px;
  padding: 8px 0;
  font-weight: bold;
  cursor: pointer;
}
</style>
