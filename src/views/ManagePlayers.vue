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
  <div class="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased text-slate-800">
    <div class="max-w-4xl mx-auto px-4 pt-8 pb-6">
      <div class="text-center md:text-left mb-6">
        <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase italic">
          Player <span class="text-blue-600">Management</span>
        </h1>
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">จัดการรายชื่อนักกีฬา</p>
      </div>

      <section class="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
        <div class="flex flex-col gap-3">
          <input
            v-model="newPlayerName"
            @keyup.enter="addPlayer"
            type="text"
            placeholder="พิมพ์ชื่อนักกีฬาที่นี่..."
            class="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl flex-1">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">มือคุม?</span>
              <button
                @click="newPlayerIsController = !newPlayerIsController"
                :class="newPlayerIsController ? 'bg-blue-600' : 'bg-slate-300'"
                class="w-10 h-6 rounded-full relative transition-all"
              >
                <div :class="newPlayerIsController ? 'translate-x-4' : 'translate-x-0.5'" class="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm"></div>
              </button>
            </div>
            <button
              @click="addPlayer"
              :disabled="loading"
              class="bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:bg-black transition-all disabled:opacity-50 text-sm tracking-widest uppercase"
            >
              {{ loading ? '...' : 'ADD' }}
            </button>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-3 m-8">
        <div :class="players.length >= 12 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'"
             class="p-3 rounded-2xl border flex flex-col items-center justify-center text-center">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Players</span>
          <span class="text-base font-black" :class="players.length >= 12 ? 'text-green-600' : 'text-amber-600'">{{ players.length }} / 12+</span>
        </div>
        <div :class="controllers.length === normals.length && players.length > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'"
             class="p-3 rounded-2xl border flex flex-col items-center justify-center text-center">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Balance (ค/ท)</span>
          <span class="text-base font-black" :class="controllers.length === normals.length ? 'text-indigo-600' : 'text-amber-600'">
            {{ controllers.length }} : {{ normals.length }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div class="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
          <div class="bg-blue-600 px-6 py-3 text-white text-[11px] font-black tracking-[0.2em] uppercase flex justify-between items-center">
            <span>🏸 มือคุม</span>
            <span class="bg-white/20 px-2 py-0.5 rounded-lg">{{ controllers.length }}</span>
          </div>
          <div class="divide-y divide-slate-50">
            <div v-for="p in controllers" :key="p.id" class="flex justify-between items-center p-4 hover:bg-slate-50 transition-all">
              <div v-if="editingId === p.id" class="flex gap-2 w-full">
                <input v-model="editingName" class="flex-1 border-2 border-blue-500 rounded-lg px-3 py-1 font-bold text-sm" />
                <button @click="updatePlayer(p)" class="text-blue-600 font-bold text-xs uppercase">Save</button>
              </div>
              <template v-else>
                <span class="font-bold text-slate-700 text-sm tracking-tight">{{ p.name }}</span>
                <div class="flex gap-3">
                  <button @click="startEdit(p)" class="text-blue-400 font-black text-[10px] uppercase tracking-tighter">Edit</button>
                  <button @click="deletePlayer(p.id)" class="text-rose-300 font-black text-[10px] uppercase tracking-tighter">Del</button>
                </div>
              </template>
            </div>
            <div v-if="controllers.length === 0" class="p-8 text-center text-slate-300 text-xs italic">ไม่มีรายชื่อมือคุม</div>
          </div>
        </div>

        <div class="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
          <div class="bg-slate-800 px-6 py-3 text-white text-[11px] font-black tracking-[0.2em] uppercase flex justify-between items-center">
            <span>👤 ทั่วไป</span>
            <span class="bg-white/20 px-2 py-0.5 rounded-lg">{{ normals.length }}</span>
          </div>
          <div class="divide-y divide-slate-50">
            <div v-for="p in normals" :key="p.id" class="flex justify-between items-center p-4 hover:bg-slate-50 transition-all">
              <div v-if="editingId === p.id" class="flex gap-2 w-full">
                <input v-model="editingName" class="flex-1 border-2 border-blue-500 rounded-lg px-3 py-1 font-bold text-sm" />
                <button @click="updatePlayer(p)" class="text-blue-600 font-bold text-xs uppercase">Save</button>
              </div>
              <template v-else>
                <span class="font-bold text-slate-700 text-sm tracking-tight">{{ p.name }}</span>
                <div class="flex gap-3">
                  <button @click="startEdit(p)" class="text-blue-400 font-black text-[10px] uppercase tracking-tighter">Edit</button>
                  <button @click="deletePlayer(p.id)" class="text-rose-300 font-black text-[10px] uppercase tracking-tighter">Del</button>
                </div>
              </template>
            </div>
            <div v-if="normals.length === 0" class="p-8 text-center text-slate-300 text-xs italic">ไม่มีรายชื่อทั่วไป</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
:deep(body) { font-family: 'Outfit', sans-serif; }
</style>


