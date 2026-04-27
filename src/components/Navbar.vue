<template>
  <nav class="sticky top-0 z-50 px-6 py-4">
    <div class="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2.5rem] px-8">
      <div class="flex justify-between items-center h-20">

        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-blue-600 to-blue-700 w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 rotate-3">
            <span class="text-xl">🏸</span>
          </div>
          <div class="leading-tight hidden sm:block">
            <h1 class="text-xl font-black text-slate-900 tracking-tighter italic uppercase">BADMINTON</h1>
            <p class="text-[10px] font-black text-blue-600 tracking-[0.3em] uppercase ml-0.5">Pro System</p>
          </div>
        </div>

        <div class="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-[2rem]">
          <router-link
            to="/"
            class="nav-item p-5"
            active-class="active"
          >
            <span class="text-sm pr-2">📊</span>
            <span class="text-sm font-black uppercase tracking-wider">Dashboard</span>
          </router-link>

          <router-link
            to="/manage-players"
            class="nav-item"
            active-class="active"
          >
            <span class="text-sm pr-2">👥</span>
            <span class="text-sm font-black uppercase tracking-wider">Players</span>
          </router-link>
        </div>

        <div class="hidden md:flex items-center gap-4 border-l border-slate-200 pl-6">
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
</template>

<style scoped>
/* สไตล์เมนูหลัก */
.nav-item {
  @apply flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-slate-500 transition-all duration-300 ease-out;
}

/* เอฟเฟกต์เมื่อ Hover */
.nav-item:hover {
  @apply text-slate-900 bg-white/50;
}

/* สไตล์เมนูเมื่อถูกเลือก (Active) */
.active {
  @apply bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50;
}

/* เพิ่มแอนิเมชันตอนเปลี่ยนหน้า */
.router-link-active {
  transform: translateY(-1px);
}
</style>