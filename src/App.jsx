import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "./supabase.js";

const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAY_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const CAT = {
  clase:   { label: "Clase",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)", emoji: "📚" },
  estudio: { label: "Estudio", color: "#10b981", bg: "rgba(16,185,129,0.12)", emoji: "✏️" },
  futbol:  { label: "Fútbol",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",  emoji: "⚽" },
  libre:   { label: "Libre",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", emoji: "🎮" },
  pausa:   { label: "Pausa",   color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", emoji: "☕" },
};

const STUDY_ON = 65;
const STUDY_BREAK = 10;

const schedule = {
  Domingo: [
    { time: "9:30 – 10:00",  cat: "pausa",   text: "Levantarse + desayuno", hrs: 0.5 },
    { time: "10:00 – 13:45", cat: "estudio", text: "Estudio — repaso semanal / temas flojos", hrs: 3.25, sessions: 3 },
    { time: "13:45 – 15:00", cat: "pausa",   text: "Almuerzo + descanso", hrs: 1.25 },
    { time: "15:00 – 20:00", cat: "libre",   text: "Tiempo libre", hrs: 5 },
    { time: "20:00 – 23:20", cat: "libre",   text: "Cena + relax", hrs: 3.33 },
  ],
  Lunes: [
    { time: "8:00 – 13:00",  cat: "clase",   text: "Química (teórico + práctico)", hrs: 5 },
    { time: "13:00 – 14:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { time: "14:30 – 18:15", cat: "estudio", text: "Estudio — Química / Cálculo", hrs: 3.25, sessions: 3 },
    { time: "18:15 – 19:00", cat: "libre",   text: "Tiempo libre", hrs: 0.75 },
    { time: "19:00 – 20:00", cat: "pausa",   text: "Cena + ir al fútbol", hrs: 1 },
    { time: "20:00 – 21:30", cat: "futbol",  text: "Fútbol", hrs: 1.5 },
    { time: "21:30 – 23:20", cat: "libre",   text: "Relax", hrs: 1.83 },
  ],
  Martes: [
    { time: "8:00 – 12:00",  cat: "clase",   text: "Cálculo Elemental", hrs: 4 },
    { time: "12:00 – 13:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { time: "13:30 – 17:15", cat: "estudio", text: "Estudio — Complementos / Cálculo / Informática", hrs: 3.25, sessions: 3 },
    { time: "17:15 – 20:00", cat: "libre",   text: "Tiempo libre", hrs: 2.75 },
    { time: "20:00 – 23:20", cat: "libre",   text: "Cena + ocio nocturno", hrs: 3.33 },
  ],
  Miércoles: [
    { time: "8:00 – 10:00",  cat: "clase",   text: "Intro a la Ingeniería", hrs: 2 },
    { time: "10:00 – 11:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { time: "11:00 – 13:00", cat: "clase",   text: "Filosofía", hrs: 2 },
    { time: "13:00 – 14:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { time: "14:30 – 18:15", cat: "estudio", text: "Estudio — Química / Cálculo / Filosofía", hrs: 3.25, sessions: 3 },
    { time: "18:15 – 23:20", cat: "libre",   text: "Tiempo libre + cena + relax", hrs: 5.08 },
  ],
  Jueves: [
    { time: "8:00 – 10:00",  cat: "clase",   text: "Informática General", hrs: 2 },
    { time: "10:00 – 11:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { time: "11:00 – 14:30", cat: "clase",   text: "Complementos de Matemática", hrs: 3.5 },
    { time: "14:30 – 16:00", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { time: "16:00 – 17:05", cat: "estudio", text: "Repaso liviano del día", hrs: 1.08, sessions: 1 },
    { time: "17:05 – 23:20", cat: "libre",   text: "Tiempo libre + cena + relax", hrs: 6.25 },
  ],
  Viernes: [
    { time: "8:00 – 11:00",  cat: "clase",   text: "Informática General", hrs: 3 },
    { time: "11:00 – 12:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { time: "12:00 – 16:30", cat: "clase",   text: "Cálculo Elemental", hrs: 4.5 },
    { time: "16:30 – 18:00", cat: "pausa",   text: "Vuelta a casa + merienda", hrs: 1.5 },
    { time: "18:00 – 20:00", cat: "libre",   text: "Relax antes del fútbol", hrs: 2 },
    { time: "20:00 – 21:30", cat: "futbol",  text: "Fútbol", hrs: 1.5 },
    { time: "21:30 – 23:20", cat: "libre",   text: "Cena + relax", hrs: 1.83 },
  ],
  Sábado: [
    { time: "9:30 – 10:00",  cat: "pausa",   text: "Levantarse + desayuno", hrs: 0.5 },
    { time: "10:00 – 13:45", cat: "estudio", text: "Estudio fuerte — Cálculo / Química", hrs: 3.25, sessions: 3 },
    { time: "13:45 – 15:00", cat: "pausa",   text: "Almuerzo + descanso", hrs: 1.25 },
    { time: "15:00 – 17:30", cat: "estudio", text: "Estudio — Complementos / Informática + ejercicios", hrs: 2.17, sessions: 2 },
    { time: "17:30 – 23:20", cat: "libre",   text: "Resto del día libre", hrs: 5.83 },
  ],
};

function todayKey() { return new Date().toISOString().slice(0, 10); }
function dayOfWeek() { return new Date().getDay(); }
function fmtHrs(h) { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); if (hrs === 0) return `${mins}min`; if (mins === 0) return `${hrs}h`; return `${hrs}h ${mins}m`; }
function fmtTimer(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
function getStudyBlocks(d) { return schedule[d].filter(b => b.cat === "estudio"); }
function getStudyHours(d) { return getStudyBlocks(d).reduce((s, b) => s + b.hrs, 0); }
function getTotalSessions(d) { return getStudyBlocks(d).reduce((s, b) => s + (b.sessions || 0), 0); }

const VIEW = { RUTINA: 0, TIMER: 1, STATS: 2 };

export default function App() {
  const [view, setView] = useState(VIEW.RUTINA);
  const [selDay, setSelDay] = useState(dayOfWeek());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPhase, setTimerPhase] = useState("study");
  const [timerSecs, setTimerSecs] = useState(STUDY_ON * 60);
  const intervalRef = useRef(null);

  useEffect(() => { loadData().then(d => { setData(d || { days: {}, streak: 0, lastStudy: null, totalSessions: 0 }); setLoading(false); }); }, []);

  const persist = useCallback(async (nd) => { setData(nd); setSaving(true); await saveData(nd); setSaving(false); }, []);

  useEffect(() => {
    if (timerActive && timerSecs > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSecs(p => {
          if (p <= 1) {
            clearInterval(intervalRef.current);
            try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 700; g.gain.value = 0.25; o.start(); o.stop(ctx.currentTime + 0.4); setTimeout(() => { try { const o2 = ctx.createOscillator(); const g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination); o2.frequency.value = 900; g2.gain.value = 0.25; o2.start(); o2.stop(ctx.currentTime + 0.3); } catch {} }, 500); } catch {}
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  const completeSession = useCallback(() => {
    if (!data) return;
    const key = todayKey(); const target = getTotalSessions(DAY_FULL[dayOfWeek()]);
    const dd = data.days[key] || { completed: 0, target }; dd.completed += 1; dd.target = target;
    let streak = data.streak || 0; const last = data.lastStudy;
    if (last) { const diff = Math.floor((new Date(key) - new Date(last)) / 86400000); if (diff === 1) streak += 1; else if (diff > 1) streak = 1; } else streak = 1;
    persist({ ...data, days: { ...data.days, [key]: dd }, streak, lastStudy: key, totalSessions: (data.totalSessions || 0) + 1 });
  }, [data, persist]);

  useEffect(() => {
    if (timerSecs === 0 && timerActive) {
      setTimerActive(false);
      if (timerPhase === "study") { completeSession(); setTimerPhase("break"); setTimerSecs(STUDY_BREAK * 60); }
      else { setTimerPhase("study"); setTimerSecs(STUDY_ON * 60); }
    }
  }, [timerSecs, timerActive, completeSession, timerPhase]);

  const toggleTimer = () => setTimerActive(p => !p);
  const resetTimer = () => { setTimerActive(false); setTimerPhase("study"); setTimerSecs(STUDY_ON * 60); };
  const skipPhase = () => { setTimerActive(false); if (timerPhase === "study") { completeSession(); setTimerPhase("break"); setTimerSecs(STUDY_BREAK * 60); } else { setTimerPhase("study"); setTimerSecs(STUDY_ON * 60); } };

  const markDayDone = useCallback(() => {
    if (!data) return;
    const key = todayKey(); const target = getTotalSessions(DAY_FULL[dayOfWeek()]); const prev = data.days[key]?.completed || 0;
    let streak = data.streak || 0; const last = data.lastStudy;
    if (last) { const diff = Math.floor((new Date(key) - new Date(last)) / 86400000); if (diff === 1) streak += 1; else if (diff > 1) streak = 1; } else streak = 1;
    persist({ ...data, days: { ...data.days, [key]: { completed: target, target } }, streak, lastStudy: key, totalSessions: (data.totalSessions || 0) + Math.max(0, target - prev) });
  }, [data, persist]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c1222", color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>Cargando...</div>;

  const todayDayName = DAY_FULL[dayOfWeek()];
  const todayTarget = getTotalSessions(todayDayName);
  const todayD = data?.days?.[todayKey()] || { completed: 0, target: todayTarget };
  const todayPct = todayTarget > 0 ? Math.min(100, Math.round((todayD.completed / todayTarget) * 100)) : (todayD.completed > 0 ? 100 : 0);
  const totalPhaseTime = timerPhase === "study" ? STUDY_ON * 60 : STUDY_BREAK * 60;
  const timerPct = ((totalPhaseTime - timerSecs) / totalPhaseTime) * 100;
  const navItems = [{ id: VIEW.RUTINA, label: "Rutina", icon: "📋" }, { id: VIEW.TIMER, label: "Timer", icon: "⏱️" }, { id: VIEW.STATS, label: "Stats", icon: "📊" }];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "linear-gradient(150deg,#0c1222,#162032)", minHeight: "100vh", color: "#e2e8f0", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>Mi Rutina</h1>
            <p style={{ fontSize: 11, color: "#475569", margin: "2px 0 0" }}>18 sesiones · 19h 30m/semana{saving && <span style={{ marginLeft: 8, color: "#f59e0b" }}>guardando...</span>}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {data.streak > 0 && <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}><div style={{ fontSize: 16 }}>🔥</div><div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{data.streak}</div></div>}
            <div style={{ background: todayPct >= 100 ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", border: `1px solid ${todayPct >= 100 ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)"}`, borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{todayPct >= 100 ? "✅" : "📈"}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: todayPct >= 100 ? "#34d399" : "#60a5fa" }}>{todayPct}%</div>
            </div>
          </div>
        </div>

        {view === VIEW.RUTINA && (<>
          <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
            {DAYS.map((d, i) => {
              const active = selDay === i; const isToday = i === dayOfWeek(); const sess = getTotalSessions(DAY_FULL[i]);
              return (<button key={d} onClick={() => setSelDay(i)} style={{ flex: 1, padding: "8px 0 5px", borderRadius: 8, border: isToday && !active ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent", cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans',sans-serif", background: active ? "#1e3a5f" : "rgba(255,255,255,0.03)", color: active ? "#60a5fa" : "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {d}<span style={{ fontSize: 8, color: active ? "#34d399" : "#334155", fontWeight: 600 }}>{sess > 0 ? `${sess} ses` : "—"}</span>
              </button>);
            })}
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "#f1f5f9" }}>{DAY_FULL[selDay]}{selDay === dayOfWeek() && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginLeft: 8 }}>hoy</span>}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {schedule[DAY_FULL[selDay]].map((block, i) => {
              const cat = CAT[block.cat];
              return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: cat.bg, border: `1px solid ${cat.color}20`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ width: 3, height: 30, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.emoji} {block.text}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{block.time}{block.sessions && <span style={{ marginLeft: 6, color: "#10b981" }}>· {block.sessions} × 1:05 + descansos</span>}</div>
                </div>
              </div>);
            })}
          </div>
        </>)}

        {view === VIEW.TIMER && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{todayDayName} — {todayTarget > 0 ? `${todayTarget} sesiones hoy` : "Sin estudio hoy"}</p>
            <p style={{ fontSize: 12, color: timerPhase === "study" ? "#10b981" : "#a78bfa", fontWeight: 600, marginBottom: 20 }}>{timerPhase === "study" ? "🎯 Sesión de estudio (1:05)" : "☕ Descanso (10 min)"}</p>
            <div style={{ position: "relative", width: 220, height: 220, marginBottom: 24 }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="110" cy="110" r="96" fill="none" stroke={timerPhase === "study" ? "#10b981" : "#8b5cf6"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 96}`} strokeDashoffset={`${2 * Math.PI * 96 * (1 - timerPct / 100)}`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 44, fontWeight: 500, color: "#f1f5f9", letterSpacing: "-2px" }}>{fmtTimer(timerSecs)}</span>
                <span style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{todayD.completed}/{todayTarget} completadas</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <button onClick={resetTimer} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↺</button>
              <button onClick={toggleTimer} style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: timerActive ? "rgba(239,68,68,0.8)" : timerPhase === "study" ? "rgba(16,185,129,0.8)" : "rgba(139,92,246,0.8)", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: timerActive ? "0 0 30px rgba(239,68,68,0.3)" : "0 0 30px rgba(16,185,129,0.3)" }}>{timerActive ? "❚❚" : "▶"}</button>
              <button onClick={skipPhase} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⏭</button>
            </div>
            <div style={{ width: "100%", maxWidth: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Progreso de hoy</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: todayPct >= 100 ? "#34d399" : "#60a5fa" }}>{todayD.completed}/{todayTarget} sesiones</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${todayPct}%`, background: todayPct >= 100 ? "#10b981" : "linear-gradient(90deg,#3b82f6,#60a5fa)", transition: "width 0.3s" }} />
              </div>
            </div>
            {todayPct < 100 && todayTarget > 0 && <button onClick={markDayDone} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#34d399", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✓ Marcar todo hoy como hecho</button>}
          </div>
        )}

        {view === VIEW.STATS && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ value: `${data.streak || 0}`, sub: "días racha", color: "#f59e0b", icon: "🔥" }, { value: `${data.totalSessions || 0}`, sub: "sesiones total", color: "#3b82f6", icon: "📚" }, { value: `${todayPct}%`, sub: "hoy", color: todayPct >= 100 ? "#10b981" : "#60a5fa", icon: todayPct >= 100 ? "✅" : "📈" }].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Últimos 7 días</h3>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = d.toISOString().slice(0, 10); const dayIdx = d.getDay();
                const target = getTotalSessions(DAY_FULL[dayIdx]); const completed = data.days?.[key]?.completed || 0;
                const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : (completed > 0 ? 100 : 0); const isToday = key === todayKey();
                return (<div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0", background: isToday ? "rgba(96,165,250,0.08)" : "transparent", borderRadius: 8, border: isToday ? "1px solid rgba(96,165,250,0.2)" : "1px solid transparent" }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>{DAYS[dayIdx]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", background: pct >= 100 ? "rgba(16,185,129,0.2)" : pct > 0 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)", border: `2px solid ${pct >= 100 ? "#10b981" : pct > 0 ? "#3b82f6" : "transparent"}`, fontSize: 11, fontWeight: 700, color: pct >= 100 ? "#34d399" : pct > 0 ? "#60a5fa" : "#334155" }}>
                    {pct >= 100 ? "✓" : target === 0 ? "—" : pct > 0 ? pct : "·"}
                  </div>
                  <div style={{ fontSize: 9, color: "#334155" }}>{d.getDate()}/{d.getMonth() + 1}</div>
                </div>);
              })}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Sesiones por día</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DAY_FULL.map((dn, i) => {
                const sess = getTotalSessions(dn);
                return (<div key={dn} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 30, fontSize: 11, color: "#64748b", textAlign: "right" }}>{DAYS[i]}</span>
                  <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, width: `${(sess / 5) * 100}%`, background: sess === 0 ? "rgba(255,255,255,0.06)" : "linear-gradient(90deg,#10b981,#34d399)", display: "flex", alignItems: "center", paddingLeft: 8 }}>
                      {sess > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>{sess} × 1:05</span>}
                    </div>
                  </div>
                  <span style={{ width: 40, fontSize: 10, color: "#475569", textAlign: "right" }}>{sess > 0 ? fmtHrs(sess * STUDY_ON / 60) : "—"}</span>
                </div>);
              })}
            </div>
            <button onClick={() => { if (window.confirm('¿Borrar todos los datos?')) { persist({ days: {}, streak: 0, lastStudy: null, totalSessions: 0 }); } }} style={{ marginTop: 28, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Resetear datos</button>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(12,18,34,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", padding: "8px 0 env(safe-area-inset-bottom, 12px)" }}>
        <div style={{ display: "flex", gap: 0, maxWidth: 480, width: "100%" }}>
          {navItems.map(item => (<button key={item.id} onClick={() => setView(item.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
            <span style={{ fontSize: 20, opacity: view === item.id ? 1 : 0.4 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === item.id ? 700 : 500, color: view === item.id ? "#60a5fa" : "#475569" }}>{item.label}</span>
          </button>))}
        </div>
      </div>
    </div>
  );
}
