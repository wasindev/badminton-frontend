<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const players = ref([]);
const matches = ref([]);
const loading = ref(false);

const simulateMatches = async () => {
  loading.value = true;
  try {
    const res = await api.post("/session/simulate", {
      players: players.value,
      court_count: 2,
      _t: Date.now() // บังคับ Backend สุ่มใหม่
    });

    if (res.data?.success) {
      matches.value = res.data.data;
      // เซฟลงเครื่องทันที
      window.localStorage.setItem('badminton_matches', JSON.stringify(res.data.data));
    }
  } catch (err) {
    alert("เกิดข้อผิดพลาด");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // โหลดรายชื่อผู้เล่นเฉยๆ
  const res = await api.get("/players");
  players.value = Array.isArray(res.data) ? res.data : (res.data.data || []);

  // เช็คว่าในเครื่องมีคู่เดิมไหม
  const saved = window.localStorage.getItem('badminton_matches');
  if (saved) {
    matches.value = JSON.parse(saved);
  } else {
    // ถ้าไม่เคยสุ่มเลย ครั้งแรกสุดค่อยสั่งสุ่ม
    await simulateMatches();
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#F1F5F9] pb-20 font-sans antialiased text-slate-800">
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">
            Match <span class="text-blue-600">Day</span>
          </h1>
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">14 Players / 2 Courts</span>
          </div>
        </div>
        <button @click="simulateMatches" :disabled="loading"
          class="bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-widest">
          {{ loading ? 'Generating...' : '🔄 สุ่มแมตช์ใหม่' }}
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 pt-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div v-for="(m, i) in matches" :key="i"
          class="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 border border-slate-200/60 transition-all duration-300 overflow-hidden">

          <div class="px-8 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-end">
            <div>
              <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Badminton Session</p>
              <h3 class="text-xl font-black italic uppercase text-slate-900">รอบที่ {{ m.round }}</h3>
            </div>
            <div class="text-right">
              <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</span>
              <span class="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black italic uppercase">
                คอร์ด {{ m.court }}
              </span>
            </div>
          </div>


           <div class="p-8 relative">
  <div v-if="!m.is_empty" class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

    <div class="space-y-6">
      <div v-for="p in m.team_a" :key="p.name" class="relative pl-4 border-l-4 border-blue-500">
        <div class="flex items-center gap-3">
          <span class="text-base font-black text-slate-800 tracking-tight">{{ p.name }}</span>
        <span :class="[
  'text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap',
  p.count.includes('1/2') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
]">
  {{ p.count }}
</span>
        </div>
        <p v-if="p.is_controller" class="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1 italic">
          👑 Controller
        </p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center gap-2 px-2">
      <div class="h-8 w-[1px] bg-slate-100"></div>
      <div class="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
        <span class="text-[10px] font-black italic text-slate-400">VS</span>
      </div>
      <div class="h-8 w-[1px] bg-slate-100"></div>
    </div>

    <div class="space-y-6">
      <div v-for="p in m.team_b" :key="p.name" class="relative pr-4 border-r-4 border-indigo-500 text-right">
        <div class="flex items-center justify-end gap-3">
       <span :class="[
  'text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap',
  p.count.includes('1/2') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
]">
  {{ p.count }}
</span>
          <span class="text-base font-black text-slate-800 tracking-tight">{{ p.name }}</span>
        </div>
        <p v-if="p.is_controller" class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">
          👑 Controller
        </p>
      </div>
    </div>

  </div>
</div>
        </div>

      </div>
    </main>

    <footer class="mt-20 py-10 border-t border-slate-200 text-center">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        System generated • Fixed Pairing Mode • 2026
      </p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');

:deep(body) {
  font-family: 'Outfit', sans-serif;
}

/* ทำให้ Card ดูมีมิติขึ้นเวลา Hover */
.group:hover {
  border-color: rgba(59, 130, 246, 0.5);
}
</style>