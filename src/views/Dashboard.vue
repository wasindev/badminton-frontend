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
  <div class="min-h-screen bg-[#F1F5F9] pb-12 font-sans antialiased text-slate-800">
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <div>
          <h1 class="text-lg md:text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
            Match <span class="text-blue-600">Day</span>
          </h1>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">14 Players / 2 Courts</span>
          </div>
        </div>
        <button @click="simulateMatches" :disabled="loading"
          class="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-widest">
          {{ loading ? '...' : '🔄 สุ่มใหม่' }}
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

        <div v-for="(m, i) in matches" :key="i"
          class="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200/60 transition-all duration-300 overflow-hidden">

          <div class="px-5 py-3 md:px-8 md:py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <p class="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest">Session</p>
              <h3 class="text-base md:text-xl font-black italic uppercase text-slate-900">รอบที่ {{ m.round }}</h3>
            </div>
            <div class="text-right">
              <span class="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic uppercase">
                คอร์ด {{ m.court }}
              </span>
            </div>
          </div>

          <div class="p-4 md:p-8 relative">
            <div v-if="!m.is_empty" class="grid grid-cols-[1fr_auto_1fr] items-center gap-1 md:gap-3">

              <div class="space-y-4 md:space-y-6">
                <div v-for="p in m.team_a" :key="p.name" class="relative pl-3 md:pl-4 border-l-[3px] md:border-l-4 border-blue-500">
                  <div class="flex flex-wrap items-center gap-1.5 md:gap-3">
                    <span class="text-sm md:text-base font-black text-slate-800 tracking-tight leading-tight">{{ p.name }}</span>
                    <span :class="[
                      'text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md border whitespace-nowrap',
                      p.count.includes('1/2') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    ]">
                      {{ p.count }}
                    </span>
                  </div>
                  <p v-if="p.is_controller" class="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5 italic">👑</p>
                </div>
              </div>

              <div class="flex flex-col items-center justify-center px-1">
                <div class="h-4 w-[1px] bg-slate-100 hidden md:block"></div>
                <div class="bg-slate-50 w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                  <span class="text-[8px] md:text-[10px] font-black italic text-slate-400">VS</span>
                </div>
                <div class="h-4 w-[1px] bg-slate-100 hidden md:block"></div>
              </div>

              <div class="space-y-4 md:space-y-6">
                <div v-for="p in m.team_b" :key="p.name" class="relative pr-3 md:pr-4 border-r-[3px] md:border-r-4 border-indigo-500 text-right">
                  <div class="flex flex-wrap items-center justify-end gap-1.5 md:gap-3">
                    <span :class="[
                      'text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded-md border whitespace-nowrap',
                      p.count.includes('1/2') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    ]">
                      {{ p.count }}
                    </span>
                    <span class="text-sm md:text-base font-black text-slate-800 tracking-tight leading-tight">{{ p.name }}</span>
                  </div>
                  <p v-if="p.is_controller" class="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 italic">👑</p>
                </div>
              </div>

            </div>

            <div v-else class="py-8 md:py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
              <span class="text-sm font-black text-slate-400 uppercase italic tracking-tighter">สนามว่าง</span>
            </div>
          </div>
        </div>

      </div>
    </main>

    <footer class="mt-12 py-8 border-t border-slate-200 text-center px-4">
      <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
        System generated • Fixed Pairing • 2026
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