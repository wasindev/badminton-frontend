<script setup>
import { ref, onMounted } from "vue";
import api from "../services/api";

const players = ref([]);
const matches = ref([]);
const loading = ref(false);

const simulateMatches = async () => {
  if (players.value.length < 12) {
    alert("ต้องมีมือคุมและมือทั่วไปอย่างน้อยฝ่ายละ 6 คน");
    return;
  }

  loading.value = true;
  matches.value = [];
  window.localStorage.removeItem('badminton_matches');

  try {
    const res = await api.post("/session/simulate", {
      players: players.value,
      court_count: 2,
      _t: Date.now()
    });

    if (res.data?.success) {
      matches.value = res.data.data;
      window.localStorage.setItem('badminton_matches', JSON.stringify(res.data.data));
    }
  } catch (err) {
    alert("เกิดข้อผิดพลาดในการสุ่ม");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const res = await api.get("/players");
  players.value = Array.isArray(res.data) ? res.data : (res.data.data || []);

  const saved = window.localStorage.getItem('badminton_matches');
  if (saved) matches.value = JSON.parse(saved);
  else await simulateMatches();
});
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
    <div class="max-w-7xl mx-auto px-4 pt-8">

      <div class="flex justify-between items-center mb-10">
        <h1 class="text-3xl font-black italic uppercase italic">Match Day</h1>
        <button @click="simulateMatches" :disabled="loading"
          class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg active:scale-95 disabled:opacity-50 transition-all">
          {{ loading ? 'จัดทีม...' : '🔄 สุ่มแมตช์ใหม่' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div v-for="(m, i) in matches" :key="i" class="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
          <div class="bg-slate-900 text-white px-8 py-4 flex justify-between items-center">
            <span class="bg-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">รอบที่ {{ m.round }}</span>
            <span class="font-black italic uppercase text-sm tracking-widest">คอร์ด {{ m.court }}</span>
          </div>

          <div class="p-10">
            <div v-if="!m.is_empty" class="flex items-center justify-between">
              <div class="flex-1 space-y-6">
                <div v-for="p in m.team_a" :key="p.name" class="flex flex-col">
                  <span :class="p.is_controller ? 'text-blue-600' : 'text-slate-700'" class="text-2xl font-black">
                    {{ p.name }} <span class="text-xs text-slate-300 ml-1">{{ p.count }}</span>
                  </span>
                  <span v-if="p.is_controller" class="text-[9px] font-black text-blue-400 uppercase">คนตีคุม</span>
                </div>
              </div>

              <div class="mx-4 font-black text-slate-200 italic">VS</div>

              <div class="flex-1 space-y-6 text-right">
                <div v-for="p in m.team_b" :key="p.name" class="flex flex-col">
                  <span :class="p.is_controller ? 'text-blue-600' : 'text-slate-700'" class="text-2xl font-black">
                    <span class="text-xs text-slate-300 mr-1">{{ p.count }}</span> {{ p.name }}
                  </span>
                  <span v-if="p.is_controller" class="text-[9px] font-black text-blue-400 uppercase">คนตีคุม</span>
                </div>
              </div>
            </div>
            <div v-else class="py-10 text-center border-2 border-dashed rounded-[2rem] bg-slate-50/50 text-slate-400 font-black italic">สนามว่าง</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>