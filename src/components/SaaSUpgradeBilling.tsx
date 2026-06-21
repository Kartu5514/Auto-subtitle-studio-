import React, { useState } from "react";
import { 
  Sparkles, 
  CreditCard, 
  Coins, 
  History, 
  Award, 
  Zap, 
  ShieldCheck, 
  Check, 
  Clock,
  Tv,
  ArrowRight
} from "lucide-react";
import { UserBillingState } from "../types";

interface SaaSUpgradeBillingProps {
  userBilling: UserBillingState;
  onClaimDaily: () => void;
  onPurchasePackage: (pkg: any) => void;
}

export const PACKAGES = [
  {
    id: "starter",
    name: "Paket Starter",
    price: 15000,
    credits: 10,
    bonus: 2,
    color: "from-[#00f0ff] to-[#0072ff]",
    borderColor: "border-[#00f0ff]/30 hover:border-[#00f0ff]",
    shadowColor: "shadow-[#00f0ff]/10",
    glowColor: "text-[#00f0ff]"
  },
  {
    id: "basic",
    name: "Paket Basic",
    price: 39000,
    credits: 30,
    bonus: 5,
    color: "from-[#00f0ff] via-[#6d28d9] to-[#bfdbfe]",
    borderColor: "border-purple-500/30 hover:border-purple-400",
    shadowColor: "shadow-purple-500/10",
    glowColor: "text-purple-400"
  },
  {
    id: "creator",
    name: "Paket Creator",
    price: 89000,
    credits: 80,
    bonus: 15,
    badge: "Paling Populer",
    color: "from-[#a855f7] to-[#ec4899]",
    borderColor: "border-[#ec4899]/30 hover:border-[#ec4899]",
    shadowColor: "shadow-[#ec4899]/20",
    glowColor: "text-[#ec4899]"
  },
  {
    id: "pro",
    name: "Paket Pro",
    price: 199000,
    credits: 200,
    bonus: 50,
    badge: "Harga Terbaik",
    color: "from-[#eab308] via-[#f97316] to-[#ef4444]",
    borderColor: "border-[#eab308]/30 hover:border-[#eab308]",
    shadowColor: "shadow-[#eab308]/15",
    glowColor: "text-[#eab308]"
  }
];

export default function SaaSUpgradeBilling({ 
  userBilling, 
  onClaimDaily, 
  onPurchasePackage 
}: SaaSUpgradeBillingProps) {
  const todayStr = new Date().toLocaleDateString("id-ID");
  const isDailyClaimedToday = userBilling.lastDailyClaimedDateString === todayStr;

  // Format currency to IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION 1: USER SaaS CORE DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Total Kredit */}
        <div className="cyber-panel p-5 rounded-2xl bg-slate-950/60 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coins className="w-24 h-24 text-cyan-400" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-400/25 text-cyan-400">
              <Coins className="w-5 h-5 text-glow" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Kredit Aktif</p>
              <h4 className="text-xs font-bold text-slate-300 font-mono">Total Balance</h4>
            </div>
          </div>
          <p className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-tight">
            {userBilling.credits} <span className="text-xs font-normal text-slate-500 font-sans">Kredit</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">
            * Kredit tidak memiliki kedaluwarsa &amp; permanen aktif.
          </p>
        </div>

        {/* Metric 2: Status Akun */}
        <div className="cyber-panel p-5 rounded-2xl bg-slate-950/60 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl border ${
              userBilling.isPremium 
                ? "bg-purple-500/15 border-purple-400/25 text-purple-400" 
                : "bg-slate-500/15 border-slate-400/25 text-slate-400"
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Keanggotaan</p>
              <h4 className="text-xs font-bold text-slate-300 font-mono">Status Akun</h4>
            </div>
          </div>
          <div>
            {userBilling.isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse">
                <Award className="w-3.5 h-3.5" />
                PREMIUM USER
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                FREE USER
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-mono">
            {userBilling.isPremium 
              ? "✓ Prioritas Antrian VIP + Tanpa Iklan" 
              : "Beli paket pertama untuk upgrade ke Premium permanen."}
          </p>
        </div>

        {/* Metric 3: Kredit Gratis Harian */}
        <div className="cyber-panel p-5 rounded-2xl bg-slate-950/60 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl border ${
              isDailyClaimedToday 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Kredit Harian</p>
              <h4 className="text-xs font-bold text-slate-300 font-mono">Reset Kredit Gratis</h4>
            </div>
          </div>

          <button
            onClick={onClaimDaily}
            disabled={isDailyClaimedToday}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isDailyClaimedToday
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]"
            }`}
          >
            {isDailyClaimedToday ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Kredit Hari Ini Telah Diklaim
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Klaim 1 Kredit Gratis Harian
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-500 mt-2 text-center font-mono">
            {isDailyClaimedToday ? "Reset otomatis besok hari" : "Tersedia 1 klaim harian gratis"}
          </p>
        </div>

      </div>

      {/* SECTION 2: DARK CYBERPUNK PACKAGES Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-white uppercase font-display flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-glow">
              SAAS PREMIUM PLANS
            </span>
            <span className="text-xs bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded border border-cyan-400/20 font-mono uppercase">
              Instant Upgrade
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dapatkan kredit premium tanpa kedaluwarsa. Pembelian pertama langsung upgrade status akun menjadi Premium permanen!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PACKAGES.map((pkg) => {
            const hasClaimedThisBonus = userBilling.claimedBonusPackages.includes(pkg.id);
            const isFirstPurchaseAvailable = !hasClaimedThisBonus;
            const totalOnFirst = pkg.credits + pkg.bonus;
            
            return (
              <div 
                key={pkg.id} 
                className={`cyber-panel p-6 rounded-2xl bg-slate-900/40 border transition-all duration-300 relative flex flex-col justify-between ${pkg.borderColor} ${pkg.shadowColor} hover:translate-y-[-4px]`}
              >
                {/* Popularity/Badge Indicator */}
                {pkg.badge && (
                  <span className="absolute -top-3 left-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-pink-400/30 shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                    {pkg.badge}
                  </span>
                )}

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-0.5">
                    {pkg.name}
                  </h4>
                  <p className="text-2xl font-black font-mono text-white tracking-tight mt-2">
                    {formatIDR(pkg.price)}
                  </p>

                  <div className="my-5 border-t border-white/5 pt-4 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>Kredit Inti: <strong className="text-white font-mono">{pkg.credits}</strong></span>
                    </div>

                    {isFirstPurchaseAvailable ? (
                      <div className="p-2 bg-purple-500/10 border border-purple-500/25 rounded-lg">
                        <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block font-bold">
                          🔥 BONUS PERTAMA:
                        </span>
                        <span className="text-xs text-white font-bold block">
                          +{pkg.bonus} Kredit Ekstra!
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Pertama kali beli dapat {totalOnFirst} kredit
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-800/40 border border-slate-700/20 rounded-lg">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                          Status Bonus:
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Sudah diklaim sebelumnya.
                        </span>
                      </div>
                    )}

                    <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                      <p className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Tanpa kedaluwarsa
                      </p>
                      <p className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Download tanpa iklan
                      </p>
                      <p className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Prioritas antrian VIP
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onPurchasePackage(pkg)}
                  className={`w-full py-2.5 px-4 bg-gradient-to-r ${pkg.color} text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transform active:scale-95 transition-all text-center flex items-center justify-center gap-1.5`}
                >
                  Beli Sekarang
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SYSTEM HISTORIES & BONUS LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Sub-section 1: Riwayat Pembelian */}
        <div className="cyber-panel p-5 rounded-2xl bg-slate-950/40 border border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            Riwayat Pembelian Kredit
          </h4>
          
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {userBilling.purchaseHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-white/5 rounded-xl">
                <p className="text-xs font-mono">Belum ada riwayat transaksi terenskripsi.</p>
                <p className="text-[10px] mt-1">Paket yang dibeli akan langsung dicatat secara real-time.</p>
              </div>
            ) : (
              userBilling.purchaseHistory.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{tx.packageName}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {new Date(tx.timestamp).toLocaleString("id-ID")} • ID: {tx.id.substring(0, 10)}...
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-cyan-400">+{tx.creditsGranted + tx.bonusGranted} Kredit</p>
                    <p className="text-[10px] text-slate-400">{formatIDR(tx.price)}</p>
                    {tx.bonusGranted > 0 && (
                      <span className="inline-block text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 rounded-sm">
                        Bonus +{tx.bonusGranted}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sub-section 2: Riwayat Klaim Bonus Pertama */}
        <div className="cyber-panel p-5 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Status Klaim Bonus Pembelian Pertama
            </h4>
            
            <p className="text-[11px] text-slate-400 mb-4">
              Setiap paket premium memberikan bonus spesial hanya untuk **satu kali klaim pertama saja**. Gunakan keuntungan bonus sebaik-baiknya!
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {PACKAGES.map((pkg) => {
                const claimed = userBilling.claimedBonusPackages.includes(pkg.id);
                return (
                  <div 
                    key={pkg.id} 
                    className={`p-3 rounded-xl flex items-center justify-between border ${
                      claimed 
                        ? "bg-slate-950/80 border-white/5 opacity-60" 
                        : "bg-purple-950/10 border-purple-500/20"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-bold text-slate-300">{pkg.name}</p>
                      <p className="text-[10px] text-purple-400 font-mono mt-0.5">+{pkg.bonus} Kredit</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      claimed 
                        ? "bg-slate-800 text-slate-500" 
                        : "bg-purple-500/20 text-purple-300 uppercase tracking-widest animate-pulse"
                    }`}>
                      {claimed ? "Diklaim" : "Tersedia"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-cyan-950/10 border border-cyan-400/20 p-3 rounded-xl flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono">Keamanan & Layanan</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                Platform Auto Subtitle Studio memproses transaksi secara instan menggunakan standard gateway simulasi digital. Semua paket kredit valid permanen dan tidak memiliki tenggat waktu habis.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
