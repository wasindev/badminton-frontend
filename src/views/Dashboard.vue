<script setup>
import { ref, onMounted, watch, computed } from "vue";
import api from "../services/api";
import Swal from 'sweetalert2';


const getCountClass = (count) => {
  // ใช้ parseInt เพื่อดึงเฉพาะตัวเลขตัวแรกออกมา (ป้องกันกรณี count ส่งมาเป็น "1/2")
  const num = parseInt(count);

  if (isNaN(num)) return 'bg-slate-100 text-slate-400'; // ถ้าไม่ใช่ตัวเลขให้เป็นสีเทา
  if (num <= 1) return 'bg-green-100 text-green-700 border-green-200';
  if (num === 2) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};


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


const props = defineProps(['historySignal']); // รับสัญญาณจาก App.vue
const players = ref([]);
const matches = ref([]);
const loading = ref(false);

watch(() => props.historySignal, (newVal) => {
  if (newVal > 0) {
    showHistory.value = true;
  }
});

const showHistory = ref(false);
const historyData = ref([]);

// --- ระบบประวัติ (History) ---
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

const markWinner = (match, team) => {
  // ตรรกะคือ: ถ้าค่าที่กด (team) ตรงกับค่าที่มีอยู่แล้ว (match.winner)
  // ให้เปลี่ยนเป็น null (เพื่อเอา active ออก)
  // แต่ถ้าไม่ตรง ให้เปลี่ยนเป็นทีมที่กดมาใหม่
  if (match.winner === team) {
    match.winner = null;

    // แจ้งเตือนแบบ Toast สั้นๆ ว่ายกเลิกแล้ว
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'ยกเลิกการบันทึกผลชนะ',
      showConfirmButton: false,
      timer: 800
    });
  } else {
    match.winner = team;

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `บันทึกผล ${team === 'team_a' ? 'ฝั่งซ้าย' : 'ฝั่งขวา'} ชนะ`,
      showConfirmButton: false,
      timer: 1000
    });
  }
};

const archiveSession = async () => {
  if (matches.value.length === 0) return;

  const result = await Swal.fire({
    title: 'จบเซสชั่นวันนี้?',
    text: "ระบบจะบันทึกแมตช์ที่มีผลแพ้ชนะลงในประวัติ และล้างหน้าจอ",
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'บันทึกและล้างหน้าจอ',
    cancelButtonText: 'ยกเลิก',
    customClass: { popup: 'font-itim' }
  });

  if (result.isConfirmed) {
    try {
      await api.post('/session/archive', { matches: matches.value });
      matches.value = [];
      Swal.fire({ title: 'สำเร็จ', text: 'เก็บประวัติการแข่งขันแล้ว', icon: 'success', customClass: { popup: 'font-itim' } });
    } catch (err) {
      Swal.fire('Error', 'ไม่สามารถบันทึกประวัติได้', 'error');
    }
  }
};

// --- ระบบสุ่ม (Simulate) ---
const simulateMatches = async () => {
  loading.value = true;
  try {
    const res = await api.post("/session/simulate", {
      players: players.value,
      court_count: 2
    });
    if (res.data?.success) {
      matches.value = res.data.data;
    }
  } catch (err) {
    Swal.fire({ title: 'เกิดข้อผิดพลาด', icon: 'error', customClass: { popup: 'font-itim' } });
  } finally {
    loading.value = false;
  }
};

const SECRET_PIN = "8888";
const confirmAndSimulate = () => {
  Swal.fire({
    title: 'ยืนยันรหัสผ่าน 🔒',
    text: "กรุณาใส่รหัส 4 หลักเพื่อเริ่มสุ่มทีมใหม่",
    input: 'password',
    inputAttributes: { maxlength: 4, textAlign: 'center' },
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    preConfirm: (pass) => {
      if (pass !== SECRET_PIN) {
        Swal.showValidationMessage('รหัสไม่ถูกต้อง!');
        return false;
      }
      return true;
    },
    customClass: { popup: 'font-itim', input: 'font-itim text-center text-2xl' }
  }).then((result) => {
    if (result.isConfirmed) simulateMatches();
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    const resPlayers = await api.get("/players");
    players.value = Array.isArray(resPlayers.data) ? resPlayers.data : (resPlayers.data.data || []);
    const resMatches = await api.get("/session/latest");
    if (resMatches.data && resMatches.data.length > 0) {
      matches.value = resMatches.data;
    }
  } catch (err) {
    console.error("Fetch error:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#F1F5F9] pb-12 font-itim antialiased text-slate-800">
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div>
          <h1 class="text-lg md:text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
            Match <span class="text-blue-600">Day</span>
          </h1>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ players.length }} Players</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button @click="showHistory = true" class="p-2 hover:bg-slate-100 rounded-full transition-colors" title="ประวัติ">
            <span class="text-xl">📜</span>
          </button>
          <button v-if="matches.length > 0" @click="archiveSession" class="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all">
            Finish
          </button>
          <button @click="confirmAndSimulate" :disabled="loading"
            class="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] font-black shadow-lg active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest">
            {{ loading ? '...' : '🔄 สุ่มใหม่' }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div v-for="(m, i) in matches" :key="i"
          class="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200/60 transition-all duration-300 overflow-hidden hover:translate-y-[-2px] hover:border-blue-400/50">

          <div class="px-5 py-3 md:px-8 md:py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest">Session</p>
              <h3 class="text-base md:text-xl font-black italic uppercase text-slate-900">รอบที่ {{ m.round }}</h3>
            </div>
            <span class="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic uppercase">คอร์ด {{ m.court }}</span>
          </div>

          <div class="p-4 md:p-8">
            <div v-if="!m.is_empty" class="grid grid-cols-[1fr_auto_1fr] items-center gap-1 md:gap-3">
              <div class="space-y-4">
                <div v-for="p in m.team_a" :key="p.name" class="pl-3 border-l-4 border-blue-500">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-sm md:text-lg font-black text-slate-800">{{ p.name }}</span>
<span :class="['text-[10px] font-black px-2 py-0.5 rounded-md border', getCountClass(p.count)]">
  {{ p.count }} รอบ
</span>               </div>
                </div>
              </div>

              <div class="bg-slate-50 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-slate-200">
                <span class="text-[10px] font-black text-slate-400">VS</span>
              </div>

              <div class="space-y-4 text-right">
                <div v-for="p in m.team_b" :key="p.name" class="pr-3 border-r-4 border-indigo-500">
                  <div class="flex flex-wrap items-center justify-end gap-1.5">
<span :class="['text-[10px] font-black px-2 py-0.5 rounded-md border', getCountClass(p.count)]">
  {{ p.count }} รอบ
</span>
                    <span class="text-sm md:text-lg font-black text-slate-800">{{ p.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <span class="text-sm font-black text-slate-300 uppercase">สนามว่าง</span>
            </div>
          </div>

          <div v-if="!m.is_empty" class="px-5 py-3 bg-slate-50 border-t flex justify-center gap-3">
            <button @click="markWinner(m, 'team_a')"
              :class="m.winner === 'team_a' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-500 border-slate-200'"
              class="text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm transition-all uppercase tracking-widest">
              Left Win 🏆
            </button>
            <button @click="markWinner(m, 'team_b')"
              :class="m.winner === 'team_b' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-500 border-slate-200'"
              class="text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm transition-all uppercase tracking-widest">
              Right Win 🏆
            </button>
          </div>
        </div>
      </div>
    </main>



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
  </div>
</template>

<style scoped>
.font-itim { font-family: 'Itim', cursive !important; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
:deep(.swal2-input) { border-radius: 1rem !important; font-size: 1.5rem !important; }
</style>