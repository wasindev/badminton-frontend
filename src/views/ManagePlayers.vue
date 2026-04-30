<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../services/api";

// --- State Management ---
const players = ref([]);
const newPlayerName = ref("");
const newPlayerIsController = ref(false);
const loading = ref(false);

// --- Edit State ---
const editingId = ref(null);
const editingName = ref("");

/* =========================
   1. VALIDATION LOGIC
========================= */
const controllers = computed(() => players.value.filter(p => p.is_controller === 1));
const normals = computed(() => players.value.filter(p => p.is_controller === 0));

const isValidToSimulate = computed(() => {
  const isEnough = players.value.length >= 12;
  const isEqual = controllers.value.length === normals.value.length;
  return isEnough && isEqual;
});

/* =========================
   2. CRUD ACTIONS (API)
========================= */
const loadPlayers = async () => {
  try {
    const res = await api.get("/players");
    players.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (err) {
    console.error("Load Error:", err);
  }
};

const addPlayer = async () => {
  if (!newPlayerName.value.trim()) return;
  loading.value = true;
  try {
    await api.post("/players", {
      name: newPlayerName.value,
      is_controller: newPlayerIsController.value ? 1 : 0
    });
    newPlayerName.value = "";
    localStorage.removeItem('badminton_matches'); // ล้างแมตช์เก่าเมื่อคนเปลี่ยน
    await loadPlayers();
  } catch (err) {
    alert("เพิ่มไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

const startEdit = (player) => {
  editingId.value = player.id;
  editingName.value = player.name;
};

const updatePlayer = async (player) => {
  if (!editingName.value.trim()) return;
  try {
    await api.put(`/players/${player.id}`, {
      name: editingName.value,
      is_controller: player.is_controller
    });
    editingId.value = null;
    localStorage.removeItem('badminton_matches');
    await loadPlayers();
  } catch (err) {
    alert("แก้ไขไม่สำเร็จ");
  }
};

const deletePlayer = async (id) => {
  if (!confirm("ยืนยันการลบรายชื่อ?")) return;
  try {
    await api.delete(`/players/${id}`);
    localStorage.removeItem('badminton_matches');
    await loadPlayers();
  } catch (err) {
    alert("ลบไม่สำเร็จ");
  }
};

onMounted(loadPlayers);
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 md:p-10 font-sans">

    <div class="mb-10 text-center md:text-left">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight uppercase">Buajai Player Management ei ei</h1>
      <p class="text-slate-500 font-bold">เพิ่ม แก้ไข และลบรายชื่อนักกีฬา</p>
    </div>

    <section class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <input
          v-model="newPlayerName"
          @keyup.enter="addPlayer"
          type="text"
          placeholder="ชื่อนักกีฬา..."
          class="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
        >
        <div class="flex items-center gap-4 bg-slate-50 px-6 rounded-2xl">
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest">มือคุม?</span>
          <button
            @click="newPlayerIsController = !newPlayerIsController"
            :class="newPlayerIsController ? 'bg-blue-600' : 'bg-slate-300'"
            class="w-14 h-8 rounded-full relative transition-all"
          >
            <div :class="newPlayerIsController ? 'translate-x-7' : 'translate-x-1'" class="absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md"></div>
          </button>
        </div>
        <button
          @click="addPlayer"
          :disabled="loading"
          class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-black transition-all disabled:opacity-50"
        >
          {{ loading ? '...' : 'ADD' }}
        </button>
      </div>
    </section>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      <div :class="players.length >= 12 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'"
           class="p-4 rounded-2xl border-2 border-dashed flex items-center justify-between">
        <span class="font-bold text-slate-700">Total Players (12+)</span>
        <span class="text-lg font-black" :class="players.length >= 12 ? 'text-green-600' : 'text-amber-600'">{{ players.length }}</span>
      </div>
      <div :class="controllers.length === normals.length && players.length > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'"
           class="p-4 rounded-2xl border-2 border-dashed flex items-center justify-between">
        <span class="font-bold text-slate-700">Balance (คุม/ทั่วไป)</span>
        <span class="text-lg font-black" :class="controllers.length === normals.length ? 'text-green-600' : 'text-amber-600'">
          {{ controllers.length }} : {{ normals.length }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <div class="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
        <div class="bg-blue-600 p-6 text-white font-black tracking-widest uppercase">🏸 มือคุม ({{ controllers.length }})</div>
        <div class="p-4 space-y-2">
          <div v-for="p in controllers" :key="p.id" class="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl group transition-all">
            <div v-if="editingId === p.id" class="flex gap-2 w-full">
              <input v-model="editingName" class="flex-1 border-2 border-blue-500 rounded-xl px-3 py-1 font-bold" />
              <button @click="updatePlayer(p)" class="bg-blue-600 text-white px-4 py-1 rounded-xl text-sm font-bold">Save</button>
              <button @click="editingId = null" class="bg-slate-200 text-slate-600 px-4 py-1 rounded-xl text-sm font-bold">X</button>
            </div>
            <template v-else>
              <span class="font-bold text-slate-700 text-lg">{{ p.name }}</span>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button @click="startEdit(p)" class="text-blue-500 font-bold p-2 text-sm">EDIT</button>
                <button @click="deletePlayer(p.id)" class="text-red-400 font-bold p-2 text-sm">DEL</button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
        <div class="bg-slate-800 p-6 text-white font-black tracking-widest uppercase">👤 ทั่วไป ({{ normals.length }})</div>
        <div class="p-4 space-y-2">
          <div v-for="p in normals" :key="p.id" class="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl group transition-all">
            <div v-if="editingId === p.id" class="flex gap-2 w-full">
              <input v-model="editingName" class="flex-1 border-2 border-blue-500 rounded-xl px-3 py-1 font-bold" />
              <button @click="updatePlayer(p)" class="bg-blue-600 text-white px-4 py-1 rounded-xl text-sm font-bold">Save</button>
              <button @click="editingId = null" class="bg-slate-200 text-slate-600 px-4 py-1 rounded-xl text-sm font-bold">X</button>
            </div>
            <template v-else>
              <span class="font-bold text-slate-700 text-lg">{{ p.name }}</span>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button @click="startEdit(p)" class="text-blue-500 font-bold p-2 text-sm">EDIT</button>
                <button @click="deletePlayer(p.id)" class="text-red-400 font-bold p-2 text-sm">DEL</button>
              </div>
            </template>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>