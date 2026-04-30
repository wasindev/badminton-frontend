<script setup>
import { ref, computed, onMounted, watch } from "vue"; // เพิ่ม watch ตรงนี้
import api from "../services/api";
import Swal from 'sweetalert2'; // เพิ่ม import swal มาด้วยเพื่อทำหน้า history

// ฟังก์ชันล้างประวัติทั้งหมด
const clearAllHistory = async () => {
  const SECRET_PIN = "0000"; // รหัสผ่านเดียวกับตอนสุ่มทีม

  // ขั้นที่ 1: กรอกรหัสผ่าน
  const { value: pass } = await Swal.fire({
    title: 'ยืนยันรหัสผ่านเพื่อล้างประวัติ 🔒',
    text: "ข้อมูลประวัติทั้งหมดจะถูกลบถาวร!",
    input: 'password',
    inputAttributes: { maxlength: 4, textAlign: 'center' },
    showCancelButton: true,
    confirmButtonText: 'ถัดไป',
    confirmButtonColor: '#ef4444', // สีแดง
    customClass: { popup: 'font-itim', input: 'font-itim text-center text-2xl' },
    preConfirm: (value) => {
      if (value !== SECRET_PIN) {
        Swal.showValidationMessage('รหัสไม่ถูกต้อง!');
        return false;
      }
      return true;
    }
  });

  // ขั้นที่ 2: ยืนยันอีกครั้งเพื่อความแน่ใจ
  if (pass) {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ล้างข้อมูลเลย!',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'font-itim' }
    });

    if (result.isConfirmed) {
      try {
        // เรียก API ลบข้อมูล (ต้องสร้าง Route ใน Backend เพิ่ม)
        await api.delete("/session/history/clear");

        historyData.value = []; // ล้างค่าในหน้าจอทันที

        Swal.fire({
          title: 'ล้างข้อมูลสำเร็จ',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'font-itim' }
        });
      } catch (err) {
        Swal.fire('Error', 'ไม่สามารถล้างข้อมูลได้', 'error');
      }
    }
  }
};

const topPlayers = computed(() => {
  const stats = {};

  historyData.value.forEach(match => {
    if (!match.winner) return;

    // ตรวจสอบว่าทีมไหนชนะ (team_a หรือ team_b)
    const winningTeam = JSON.parse(match[match.winner]);

    winningTeam.forEach(player => {
      if (!stats[player.name]) {
        stats[player.name] = { name: player.name, wins: 0 };
      }
      stats[player.name].wins += 1;
    });
  });

  // แปลงเป็น Array, เรียงลำดับจากมากไปน้อย และตัดเอาแค่ 4 อันดับแรก
  return Object.values(stats)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 4);
});

const props = defineProps(['historySignal']);
const showHistory = ref(false); // ตัวแปรควบคุมการเปิด/ปิด Popup ประวัติ
const historyData = ref([]);
// --- สัญญาณเปิด History จาก Navbar ---
watch(() => props.historySignal, (newVal) => {
  if (newVal > 0) {
    showHistory.value = true;
  }
});

// --- โหลดข้อมูลประวัติ (ก๊อปจาก Dashboard มาได้เลย) ---
const fetchHistory = async () => {
  try {
    const res = await api.get("/session/history");
    historyData.value = res.data;
  } catch (err) {
    console.error("โหลดประวัติไม่สำเร็จ");
  }
};

watch(showHistory, (newVal) => {
  if (newVal) fetchHistory();
});

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
};

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
        <h1 class="text-blue-600 text-xl md:text-2xl  tracking-tight uppercase italic">
          BUAJAI <span class="text-slate-900">Player</span>
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
              {{ loading ? '...' : 'เพิ่ม' }}
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


  <Transition name="fade">
  <div v-if="showHistory" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showHistory = false"></div>

    <div class="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col font-itim">

      <div class="p-6 border-b flex justify-between items-start bg-white">
        <div>
          <h2 class="text-2xl font-black italic text-slate-900 leading-none">MATCH HISTORY 📜</h2>
          <button @click="clearAllHistory"
            class="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-1 hover:text-rose-700 transition-colors group">
            <span class="group-hover:scale-110 transition-transform">🗑️</span>
            <span>Clear All History</span>
          </button>
        </div>
        <button @click="showHistory = false"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all text-xl">
          ✕
        </button>
      </div>

      <div v-if="topPlayers.length > 0" class="px-6 py-4 bg-slate-50/80 border-b border-slate-100">
        <p class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Hall of Fame (Top 4)</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="(p, index) in topPlayers" :key="p.name"
            class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden group">
            <span class="text-lg group-hover:scale-125 transition-transform duration-300">
              {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅' }}
            </span>
            <div class="min-w-0">
              <p class="text-xs font-black text-slate-800 truncate">{{ p.name }}</p>
              <p class="text-[9px] font-black text-blue-600 uppercase">{{ p.wins }} Wins</p>
            </div>
            <span class="absolute -right-2 -bottom-2 text-4xl font-black italic text-slate-100 select-none group-hover:text-blue-50 transition-colors">
              {{ index + 1 }}
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-y-auto p-4 flex-1 bg-white">
        <table v-if="historyData.length > 0" class="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr class="text-[10px] uppercase font-black text-slate-400">
              <th class="px-4">Date</th>
              <th class="px-4">Match</th>
              <th class="px-4 text-center">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in historyData" :key="h.id" class="bg-slate-50 group hover:bg-blue-50/50 transition-colors">
              <td class="px-4 py-3 rounded-l-2xl">
                <p class="text-[11px] font-black text-slate-700 leading-none">{{ formatDate(h.created_at) }}</p>
                <p class="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">{{ formatTime(h.created_at) }}</p>
              </td>
              <td class="px-4 py-3 border-slate-100">
                <div class="flex items-center gap-2 text-[11px] text-center">
                  <span class="font-black transition-colors" :class="h.winner === 'team_a' ? 'text-blue-600' : 'text-slate-500'">
                    {{ JSON.parse(h.team_a).map(p=>p.name).join(', ') }}
                  </span>
                  <span class="text-slate-300 font-black italic text-[9px]">VS</span>
                  <span class="font-black transition-colors" :class="h.winner === 'team_b' ? 'text-blue-600' : 'text-slate-500'">
                    {{ JSON.parse(h.team_b).map(p=>p.name).join(', ') }}
                  </span>
                </div>
              </td>
              <td class="px-2 py-3 rounded-r-2xl text-center">
                <span v-if="h.winner" class="bg-green-100 text-green-600 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border border-green-200">
                  Winner
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="h-full flex flex-col items-center justify-center py-20 opacity-30">
          <span class="text-6xl mb-4">🏸</span>
          <p class="font-black italic uppercase tracking-[0.3em] text-slate-400">No History Recorded</p>
        </div>
      </div>

    </div>
  </div>
</Transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
:deep(body) { font-family: 'Outfit', sans-serif; }
</style>


