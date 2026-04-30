<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 px-3 py-3 md:px-6 md:py-4 transition-transform duration-500 ease-in-out',
      isVisible ? 'translate-y-0' : '-translate-y-full'
    ]"
  >
    <div class="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 font-itim">
      <div class="flex justify-between items-center h-16 md:h-20">
    <router-link to="/" >
        <div class="flex items-center gap-2 md:gap-3">
          <div class="bg-gradient-to-br from-blue-600 to-blue-700 w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 rotate-3 shrink-0">
            <span class="text-lg md:text-xl">🏸</span>
          </div>
          <div class="leading-tight hidden xs:block">
            <h1 class="text-sm md:text-xl font-black text-slate-900 tracking-tighter italic uppercase">BADMINTON</h1>
            <p class="text-[8px] md:text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase ml-0.5">Pro System</p>
          </div>
        </div>
              </router-link>

        <div class="flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-full">

               <router-link to="/" class="nav-item group" active-class="active">
            <span class="text-xl md:text-lg">👥</span>
            <span class="text-[10px] md:text-sm font-black uppercase tracking-wider hidden md:inline ml-1">Players</span>
          </router-link>

          <router-link to="/dashboard" class="nav-item group" active-class="active">
            <span class="text-xl md:text-lg">📊</span>
            <span class="text-[10px] md:text-sm font-black uppercase tracking-wider hidden md:inline ml-1">Dashboard</span>
          </router-link>



       <button @click="$emit('openHistory')" class="nav-item group">
  <span>📜</span>
              <span class="text-[10px] md:text-sm font-black uppercase tracking-wider hidden md:inline ml-1">History</span>

</button>
        </div>

        <div class="hidden lg:flex items-center gap-4 border-l border-slate-200 pl-6">
          <div class="flex flex-col items-end">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server Status</span>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span class="text-xs font-bold text-slate-700">Online</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </nav>

  <div class="h-24 md:h-28"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ส่ง Event นี้ออกไปให้ Dashboard รับทราบ
defineEmits(['openHistory'])

const isVisible = ref(true)
const lastScrollPosition = ref(0)

const handleScroll = () => {
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
  if (currentScrollPosition < 0) return
  if (currentScrollPosition < lastScrollPosition.value) {
    isVisible.value = true
  } else if (currentScrollPosition > 100) {
    isVisible.value = false
  }
  lastScrollPosition.value = currentScrollPosition
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
@reference "tailwindcss";
.nav-item {
  @apply flex items-center justify-center gap-1 px-3 py-2 md:px-5 md:py-3 rounded-full text-slate-500 transition-all duration-300 ease-out cursor-pointer border-none bg-transparent;
}
.nav-item:hover {
  @apply text-slate-900 bg-white/50;
}
.active {
  @apply bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50;
}
.font-itim {
  font-family: 'Itim', cursive !important;
}
</style>