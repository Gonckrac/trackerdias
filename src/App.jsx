import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { loadData, saveData } from "./supabase.js";

const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAY_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const SUBJECTS = ["Cálculo","Química","Complementos","Informática","Filosofía","Intro Ing."];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

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
    { id: "dom-0", time: "9:30 – 10:00",  cat: "pausa",   text: "Levantarse + desayuno", hrs: 0.5 },
    { id: "dom-1", time: "10:00 – 13:45", cat: "estudio", text: "Estudio — repaso semanal / temas flojos", hrs: 3.25, sessions: 3 },
    { id: "dom-2", time: "13:45 – 15:00", cat: "pausa",   text: "Almuerzo + descanso", hrs: 1.25 },
    { id: "dom-3", time: "15:00 – 20:00", cat: "libre",   text: "Tiempo libre", hrs: 5 },
    { id: "dom-4", time: "20:00 – 23:20", cat: "libre",   text: "Cena + relax", hrs: 3.33 },
  ],
  Lunes: [
    { id: "lun-0", time: "8:00 – 13:00",  cat: "clase",   text: "Química (teórico + práctico)", hrs: 5 },
    { id: "lun-1", time: "13:00 – 14:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { id: "lun-2", time: "14:30 – 18:15", cat: "estudio", text: "Estudio — Química / Cálculo", hrs: 3.25, sessions: 3 },
    { id: "lun-3", time: "18:15 – 19:00", cat: "libre",   text: "Tiempo libre", hrs: 0.75 },
    { id: "lun-4", time: "19:00 – 20:00", cat: "pausa",   text: "Cena + ir al fútbol", hrs: 1 },
    { id: "lun-5", time: "20:00 – 21:30", cat: "futbol",  text: "Fútbol", hrs: 1.5 },
    { id: "lun-6", time: "21:30 – 23:20", cat: "libre",   text: "Relax", hrs: 1.83 },
  ],
  Martes: [
    { id: "mar-0", time: "8:00 – 12:00",  cat: "clase",   text: "Cálculo Elemental", hrs: 4 },
    { id: "mar-1", time: "12:00 – 13:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { id: "mar-2", time: "13:30 – 17:15", cat: "estudio", text: "Estudio — Complementos / Cálculo / Informática", hrs: 3.25, sessions: 3 },
    { id: "mar-3", time: "17:15 – 20:00", cat: "libre",   text: "Tiempo libre", hrs: 2.75 },
    { id: "mar-4", time: "20:00 – 23:20", cat: "libre",   text: "Cena + ocio nocturno", hrs: 3.33 },
  ],
  Miércoles: [
    { id: "mie-0", time: "8:00 – 10:00",  cat: "clase",   text: "Intro a la Ingeniería", hrs: 2 },
    { id: "mie-1", time: "10:00 – 11:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { id: "mie-2", time: "11:00 – 13:00", cat: "clase",   text: "Filosofía", hrs: 2 },
    { id: "mie-3", time: "13:00 – 14:30", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { id: "mie-4", time: "14:30 – 18:15", cat: "estudio", text: "Estudio — Química / Cálculo / Filosofía", hrs: 3.25, sessions: 3 },
    { id: "mie-5", time: "18:15 – 23:20", cat: "libre",   text: "Tiempo libre + cena + relax", hrs: 5.08 },
  ],
  Jueves: [
    { id: "jue-0", time: "8:00 – 10:00",  cat: "clase",   text: "Informática General", hrs: 2 },
    { id: "jue-1", time: "10:00 – 11:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { id: "jue-2", time: "11:00 – 14:30", cat: "clase",   text: "Complementos de Matemática", hrs: 3.5 },
    { id: "jue-3", time: "14:30 – 16:00", cat: "pausa",   text: "Vuelta a casa + almuerzo", hrs: 1.5 },
    { id: "jue-4", time: "16:00 – 17:05", cat: "estudio", text: "Repaso liviano del día", hrs: 1.08, sessions: 1 },
    { id: "jue-5", time: "17:05 – 23:20", cat: "libre",   text: "Tiempo libre + cena + relax", hrs: 6.25 },
  ],
  Viernes: [
    { id: "vie-0", time: "8:00 – 11:00",  cat: "clase",   text: "Informática General", hrs: 3 },
    { id: "vie-1", time: "11:00 – 12:00", cat: "libre",   text: "Relax en la facu", hrs: 1 },
    { id: "vie-2", time: "12:00 – 16:30", cat: "clase",   text: "Cálculo Elemental", hrs: 4.5 },
    { id: "vie-3", time: "16:30 – 18:00", cat: "pausa",   text: "Vuelta a casa + merienda", hrs: 1.5 },
    { id: "vie-4", time: "18:00 – 20:00", cat: "libre",   text: "Relax antes del fútbol", hrs: 2 },
    { id: "vie-5", time: "20:00 – 21:30", cat: "futbol",  text: "Fútbol", hrs: 1.5 },
    { id: "vie-6", time: "21:30 – 23:20", cat: "libre",   text: "Cena + relax", hrs: 1.83 },
  ],
  Sábado: [
    { id: "sab-0", time: "9:30 – 10:00",  cat: "pausa",   text: "Levantarse + desayuno", hrs: 0.5 },
    { id: "sab-1", time: "10:00 – 13:45", cat: "estudio", text: "Estudio fuerte — Cálculo / Química", hrs: 3.25, sessions: 3 },
    { id: "sab-2", time: "13:45 – 15:00", cat: "pausa",   text: "Almuerzo + descanso", hrs: 1.25 },
    { id: "sab-3", time: "15:00 – 17:30", cat: "estudio", text: "Estudio — Complementos / Informática + ejercicios", hrs: 2.17, sessions: 2 },
    { id: "sab-4", time: "17:30 – 23:20", cat: "libre",   text: "Resto del día libre", hrs: 5.83 },
  ],
};

function localDateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayKey() { return localDateKey(); }
function dayOfWeek() { return new Date().getDay(); }
function fmtHrs(h) { const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); if (hrs === 0) return `${mins}min`; if (mins === 0) return `${hrs}h`; return `${hrs}h ${mins}m`; }
function fmtTimer(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
function getTotalSessions(d) { return schedule[d].filter(b => b.cat === "estudio").reduce((s, b) => s + (b.sessions || 0), 0); }

// --- Helper functions (change 1) ---
function calcStreak(days, fromKey) {
  let streak = 0;
  let checkDate = new Date(fromKey + 'T12:00:00');
  for (let i = 0; i < 3650; i++) {
    const k = localDateKey(checkDate);
    if (days[k]?.completed > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function parseBlockTime(timeStr) {
  const parts = timeStr.split('–');
  if (parts.length < 2) return null;
  const parseHM = (s) => {
    const [h, m] = s.trim().split(':').map(Number);
    return h * 60 + (m || 0);
  };
  return { from: parseHM(parts[0]), to: parseHM(parts[1]) };
}

function isBlockActive(block) {
  const parsed = parseBlockTime(block.time);
  if (!parsed) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= parsed.from && nowMins < parsed.to;
}

function isBlockPast(block) {
  const parsed = parseBlockTime(block.time);
  if (!parsed) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= parsed.to;
}

// --- Module-level computed constants (change 1) ---
const WEEKLY_TARGET_SESSIONS = DAY_FULL.reduce((sum, day) => sum + getTotalSessions(day), 0);
const WEEKLY_STUDY_HOURS = Object.values(schedule).flat().filter(b => b.cat === 'estudio').reduce((sum, b) => sum + b.hrs, 0);

const VIEW = { RUTINA: 0, TIMER: 1, STATS: 2 };
// Change 2: add bestStreak to DEFAULT_DATA
const DEFAULT_DATA = { days: {}, streak: 0, bestStreak: 0, lastStudy: null, totalSessions: 0, checked: {}, subjectSessions: {}, parciales: [] };

export default function App() {
  const [view, setView] = useState(VIEW.RUTINA);
  const [selDay, setSelDay] = useState(dayOfWeek());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPhase, setTimerPhase] = useState("study");
  const [timerSecs, setTimerSecs] = useState(STUDY_ON * 60);
  const [timerSubject, setTimerSubject] = useState("Cálculo");
  const [parcialesForm, setParcialesForm] = useState({ materia: "Cálculo", fecha: "" });
  // Change 3: new state
  const [timerNotif, setTimerNotif] = useState(null);
  const [pendingSubjectBlock, setPendingSubjectBlock] = useState(null);
  const [showPastParciales, setShowPastParciales] = useState(false);
  const [, forceTimeTick] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const timerSecsRef = useRef(STUDY_ON * 60);
  useEffect(() => { timerSecsRef.current = timerSecs; }, [timerSecs]);

  // Change 4: initial load + restore timer from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rutina-timer');
    if (saved) {
      try {
        const t = JSON.parse(saved);
        if (t.endTime > Date.now() + 2000) {
          const remaining = Math.round((t.endTime - Date.now()) / 1000);
          setTimerPhase(t.phase);
          setTimerSecs(remaining);
          timerSecsRef.current = remaining;
          endTimeRef.current = t.endTime;
          if (t.subject) setTimerSubject(t.subject);
        } else {
          localStorage.removeItem('rutina-timer');
        }
      } catch {}
    }
    loadData().then(d => { setData(d ? { ...DEFAULT_DATA, ...d } : DEFAULT_DATA); setLoading(false); });
  }, []);

  const persist = useCallback(async (nd) => { setData(nd); setSaving(true); await saveData(nd); setSaving(false); }, []);

  // Change 5: 30-second tick for active block indicator
  useEffect(() => {
    if (view !== VIEW.RUTINA) return;
    const id = setInterval(() => forceTimeTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, [view]);

  // Change 7: toggleCheck
  const toggleCheck = useCallback((block) => {
    if (!data) return;
    // Clear any pending subject picker
    setPendingSubjectBlock(null);
    const key = todayKey();
    const checkedToday = { ...(data.checked?.[key] || {}) };
    const wasChecked = !!checkedToday[block.id];
    checkedToday[block.id] = !wasChecked;
    let updatedData = { ...data, checked: { ...data.checked, [key]: checkedToday } };
    if (block.cat === 'estudio' && block.sessions) {
      const delta = wasChecked ? -block.sessions : block.sessions;
      const target = getTotalSessions(DAY_FULL[dayOfWeek()]);
      const dd = { ...(data.days[key] || { completed: 0, target }), target };
      dd.completed = Math.max(0, dd.completed + delta);
      const newDays = { ...data.days, [key]: dd };
      let streak = data.streak || 0;
      if (!wasChecked) {
        // Use calcStreak for unified recalc
        streak = calcStreak(newDays, key);
      }
      const bestStreak = Math.max(data.bestStreak || 0, streak);
      updatedData = { ...updatedData, days: newDays, streak, bestStreak, lastStudy: !wasChecked ? key : data.lastStudy, totalSessions: Math.max(0, (data.totalSessions || 0) + delta) };
    }
    persist(updatedData);
    // Change 7: trigger subject picker after checking a study block
    if (!wasChecked && block.cat === 'estudio' && block.sessions) {
      setPendingSubjectBlock(block.id);
    }
  }, [data, persist]);

  const isChecked = (blockId) => data?.checked?.[todayKey()]?.[blockId] || false;

  // Change 15: getDayProgress counts only study blocks
  const getDayProgress = () => {
    const studyBlocks = schedule[DAY_FULL[dayOfWeek()]].filter(b => b.cat === 'estudio');
    const checkedToday = data?.checked?.[todayKey()] || {};
    const done = studyBlocks.filter(b => checkedToday[b.id]).length;
    const total = studyBlocks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  };

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, start, duration) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.3, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        o.start(ctx.currentTime + start);
        o.stop(ctx.currentTime + start + duration);
      };
      beep(700, 0, 0.3);
      beep(900, 0.35, 0.3);
      beep(1100, 0.7, 0.4);
    } catch {}
  }, []);

  // Change 6: timer interval effect — save to localStorage on start
  useEffect(() => {
    if (timerActive && timerSecsRef.current > 0) {
      endTimeRef.current = Date.now() + timerSecsRef.current * 1000;
      localStorage.setItem('rutina-timer', JSON.stringify({ phase: timerPhase, endTime: endTimeRef.current, subject: timerSubject }));
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimerSecs(remaining);
        if (remaining <= 0) clearInterval(intervalRef.current);
      }, 500);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && timerActive && endTimeRef.current) {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimerSecs(remaining);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [timerActive]);

  // Change 9: completeSession
  const completeSession = useCallback(() => {
    if (!data) return;
    const key = todayKey();
    const target = getTotalSessions(DAY_FULL[dayOfWeek()]);
    const dd = { ...(data.days[key] || { completed: 0, target }) };
    dd.completed += 1; dd.target = target;
    const newDays = { ...data.days, [key]: dd };
    const streak = calcStreak(newDays, key);
    const bestStreak = Math.max(data.bestStreak || 0, streak);
    const prevSubjDay = data.subjectSessions?.[key] || {};
    const newSubjDay = { ...prevSubjDay, [timerSubject]: (prevSubjDay[timerSubject] || 0) + 1 };
    persist({ ...data, days: newDays, streak, bestStreak, lastStudy: key, totalSessions: (data.totalSessions || 0) + 1, subjectSessions: { ...data.subjectSessions, [key]: newSubjDay } });
    setTimerNotif('🎯 Sesión ' + (dd.completed) + ' registrada');
    setTimeout(() => setTimerNotif(null), 2500);
    localStorage.removeItem('rutina-timer');
  }, [data, persist, timerSubject]);

  // Change 12: timer completion effect — break→study branch also removes localStorage
  useEffect(() => {
    if (timerSecs === 0 && timerActive) {
      setTimerActive(false);
      playBeep();
      if (timerPhase === "study") {
        completeSession();
        setTimerPhase("break");
        setTimerSecs(STUDY_BREAK * 60);
      } else {
        setTimerPhase("study");
        setTimerSecs(STUDY_ON * 60);
        localStorage.removeItem('rutina-timer');
      }
    }
  }, [timerSecs, timerActive, completeSession, timerPhase, playBeep]);

  const toggleTimer = () => setTimerActive(p => !p);

  // Change 10: resetTimer removes localStorage
  const resetTimer = () => {
    setTimerActive(false);
    setTimerPhase("study");
    setTimerSecs(STUDY_ON * 60);
    localStorage.removeItem('rutina-timer');
  };

  // Change 11: skipPhase break→study branch removes localStorage
  const skipPhase = () => {
    setTimerActive(false);
    if (timerPhase === "study") {
      completeSession();
      setTimerPhase("break");
      setTimerSecs(STUDY_BREAK * 60);
    } else {
      setTimerPhase("study");
      setTimerSecs(STUDY_ON * 60);
      localStorage.removeItem('rutina-timer');
    }
  };

  // Change 14: addPastSession uses calcStreak + bestStreak
  const addPastSession = useCallback((key, dayIdx) => {
    if (!data) return;
    const target = getTotalSessions(DAY_FULL[dayIdx]);
    const dd = { ...(data.days[key] || { completed: 0, target }), target };
    dd.completed += 1;
    const newDays = { ...data.days, [key]: dd };
    const newLastStudy = (!data.lastStudy || key > data.lastStudy) ? key : data.lastStudy;
    const streak = calcStreak(newDays, newLastStudy);
    const bestStreak = Math.max(data.bestStreak || 0, streak);
    persist({ ...data, days: newDays, streak, bestStreak, lastStudy: newLastStudy, totalSessions: (data.totalSessions || 0) + 1 });
  }, [data, persist]);

  // Change 13: markDayDone uses calcStreak + bestStreak
  const markDayDone = useCallback(() => {
    if (!data) return;
    const key = todayKey();
    const target = getTotalSessions(DAY_FULL[dayOfWeek()]);
    const prev = data.days[key]?.completed || 0;
    const newDays = { ...data.days, [key]: { completed: target, target } };
    const streak = calcStreak(newDays, key);
    const bestStreak = Math.max(data.bestStreak || 0, streak);
    const allChecked = {};
    schedule[DAY_FULL[dayOfWeek()]].forEach(b => { allChecked[b.id] = true; });
    persist({ ...data, days: newDays, streak, bestStreak, lastStudy: key, totalSessions: (data.totalSessions || 0) + Math.max(0, target - prev), checked: { ...data.checked, [key]: { ...(data.checked?.[key] || {}), ...allChecked } } });
  }, [data, persist]);

  // Change 8: registerSubject callback
  const registerSubject = useCallback((subject) => {
    if (!data) return;
    const key = todayKey();
    const prev = data.subjectSessions?.[key] || {};
    persist({ ...data, subjectSessions: { ...data.subjectSessions, [key]: { ...prev, [subject]: (prev[subject] || 0) + 1 } } });
    setPendingSubjectBlock(null);
  }, [data, persist]);

  const addParcial = useCallback(() => {
    if (!parcialesForm.fecha) return;
    const newParciales = [...(data.parciales || []), { materia: parcialesForm.materia, fecha: parcialesForm.fecha }];
    persist({ ...data, parciales: newParciales });
    setParcialesForm(f => ({ ...f, fecha: "" }));
  }, [data, persist, parcialesForm]);

  const removeParcial = useCallback((index) => {
    const newParciales = (data.parciales || []).filter((_, i) => i !== index);
    persist({ ...data, parciales: newParciales });
  }, [data, persist]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c1222", color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>Cargando...</div>;

  const todayDayName = DAY_FULL[dayOfWeek()];
  const todayTarget = getTotalSessions(todayDayName);
  const todayD = data?.days?.[todayKey()] || { completed: 0, target: todayTarget };
  const studyPct = todayTarget > 0 ? Math.min(100, Math.round((todayD.completed / todayTarget) * 100)) : (todayD.completed > 0 ? 100 : 0);
  const totalPhaseTime = timerPhase === "study" ? STUDY_ON * 60 : STUDY_BREAK * 60;
  const timerPct = ((totalPhaseTime - timerSecs) / totalPhaseTime) * 100;
  const navItems = [{ id: VIEW.RUTINA, label: "Rutina", icon: "📋" }, { id: VIEW.TIMER, label: "Timer", icon: "⏱️" }, { id: VIEW.STATS, label: "Stats", icon: "📊" }];
  const isToday = selDay === dayOfWeek();
  const dayProgress = isToday ? getDayProgress() : null;

  // Change 27: unified last7 array
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { key: localDateKey(d), dayIdx: d.getDay(), date: d.getDate(), month: d.getMonth() };
  });

  // --- Stats computations ---
  const weekSubjectTotals = {};
  SUBJECTS.forEach(s => { weekSubjectTotals[s] = 0; });
  last7.forEach(({ key }) => {
    const daySubs = data.subjectSessions?.[key] || {};
    SUBJECTS.forEach(s => { weekSubjectTotals[s] += daySubs[s] || 0; });
  });
  const maxSubjSessions = Math.max(1, ...SUBJECTS.map(s => weekSubjectTotals[s]));

  // Change 21: weekly summary stats
  const weekDaysStudied = last7.filter(({ key }) => (data.days[key]?.completed || 0) > 0).length;
  const weekSessionsTotal = last7.reduce((sum, { key }) => sum + (data.days[key]?.completed || 0), 0);

  const now = new Date();
  const heatYear = now.getFullYear();
  const heatMonth = now.getMonth();
  const daysInMonth = new Date(heatYear, heatMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(heatYear, heatMonth, 1).getDay();

  const sortedParciales = [...(data.parciales || [])].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // Change 24: split parciales into upcoming and past
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const upcomingParciales = sortedParciales.filter(p => new Date(p.fecha + 'T00:00:00') >= todayMid);
  const pastParciales = sortedParciales.filter(p => new Date(p.fecha + 'T00:00:00') < todayMid).reverse();

  // Change 23: parcial dates set for heatmap markers
  const parcialDatesSet = new Set((data.parciales || []).map(p => p.fecha));

  return (
    // Change 26: safe area iOS paddingBottom
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "linear-gradient(150deg,#0c1222,#162032)", minHeight: "100vh", color: "#e2e8f0", paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
<div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>Mi Rutina</h1>
            {/* Change 16: dynamic weekly stats */}
            <p style={{ fontSize: 11, color: "#475569", margin: "2px 0 0" }}>{`${WEEKLY_TARGET_SESSIONS} sesiones · ${fmtHrs(WEEKLY_STUDY_HOURS)}/semana`}{saving && <span style={{ marginLeft: 8, color: "#f59e0b" }}>💾</span>}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {data.streak > 0 && <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}><div style={{ fontSize: 16 }}>🔥</div><div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{data.streak}</div></div>}
            <div style={{ background: studyPct >= 100 ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", border: `1px solid ${studyPct >= 100 ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)"}`, borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{studyPct >= 100 ? "✅" : "📈"}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: studyPct >= 100 ? "#34d399" : "#60a5fa" }}>{studyPct}%</div>
            </div>
          </div>
        </div>

        {view === VIEW.RUTINA && (<>
          <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
            {DAYS.map((d, i) => {
              const active = selDay === i; const isTodayTab = i === dayOfWeek(); const sess = getTotalSessions(DAY_FULL[i]);
              return (<button key={d} onClick={() => setSelDay(i)} style={{ flex: 1, padding: "8px 0 5px", borderRadius: 8, border: isTodayTab && !active ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent", cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "'DM Sans',sans-serif", background: active ? "#1e3a5f" : "rgba(255,255,255,0.03)", color: active ? "#60a5fa" : "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {d}<span style={{ fontSize: 8, color: active ? "#34d399" : "#334155", fontWeight: 600 }}>{sess > 0 ? `${sess} ses` : "—"}</span>
              </button>);
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
              {DAY_FULL[selDay]}{isToday && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginLeft: 8 }}>hoy</span>}
            </h2>
            {isToday && dayProgress && <span style={{ fontSize: 11, fontWeight: 600, color: dayProgress.pct >= 100 ? "#34d399" : "#94a3b8" }}>{dayProgress.done}/{dayProgress.total} hechos</span>}
          </div>

          {isToday && dayProgress && (
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${dayProgress.pct}%`, background: dayProgress.pct >= 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #a78bfa)", transition: "width 0.4s ease" }} />
            </div>
          )}

          {/* Change 17+18: block list with active indicator and subject picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {schedule[DAY_FULL[selDay]].map((block) => {
              const cat = CAT[block.cat];
              const checked = isToday && isChecked(block.id);
              // Change 17: active/past block indicators
              const active = isToday && isBlockActive(block);
              const past = isToday && !checked && block.cat === 'estudio' && isBlockPast(block);

              // Build dynamic style for the block
              const blockStyle = {
                display: "flex", alignItems: "center", gap: 10,
                background: active ? "rgba(16,185,129,0.06)" : checked ? "rgba(255,255,255,0.02)" : cat.bg,
                border: active
                  ? "1px solid rgba(16,185,129,0.2)"
                  : `1px solid ${checked ? "rgba(255,255,255,0.06)" : cat.color + "20"}`,
                borderLeft: active ? "3px solid #10b981" : undefined,
                borderRadius: 10, padding: "10px 12px",
                cursor: isToday ? "pointer" : "default",
                opacity: checked ? 0.45 : past ? 0.55 : 1,
                transition: "all 0.25s ease",
              };

              return (
                // Change 18: wrap in Fragment for subject picker
                <Fragment key={block.id}>
                  <div onClick={() => { if (isToday) toggleCheck(block); }} style={blockStyle}>
                    {isToday ? (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: checked ? "none" : "2px solid rgba(255,255,255,0.15)", background: checked ? cat.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}>
                        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    ) : (
                      <div style={{ width: 3, height: 30, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, textDecoration: checked ? "line-through" : "none", color: checked ? "#475569" : "#e2e8f0", display: "flex", alignItems: "center" }}>
                        {cat.emoji} {block.text}
                        {/* Change 17: AHORA badge */}
                        {active && (
                          <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '1px 5px', borderRadius: 4 }}>AHORA</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: checked ? "#334155" : "#64748b", marginTop: 1 }}>{block.time}{block.sessions && <span style={{ marginLeft: 6, color: checked ? "#334155" : "#10b981" }}>· {block.sessions} × 1:05 + descansos</span>}</div>
                    </div>
                  </div>
                  {/* Change 18: inline subject picker */}
                  {pendingSubjectBlock === block.id && (
                    <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 12px', marginTop: -4 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#94a3b8' }}>📖 ¿Qué materia estudiaste?</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {SUBJECTS.map(s => (
                          <button key={s} onClick={() => registerSubject(s)} style={{ padding: '5px 10px', borderRadius: 16, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{s}</button>
                        ))}
                        <button onClick={() => setPendingSubjectBlock(null)} style={{ padding: '5px 10px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#475569', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Saltar →</button>
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>

          {isToday && dayProgress && dayProgress.pct >= 100 && (
            <div style={{ marginTop: 16, padding: "14px", borderRadius: 12, textAlign: "center", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>¡Día completado!</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Todos los bloques tachados. A descansar.</div>
            </div>
          )}

          {/* Change 19: "Marcar todo hoy" moved to Rutina view */}
          {isToday && studyPct < 100 && todayTarget > 0 && (
            <button onClick={markDayDone} style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)', color: '#34d399', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>✓ Marcar todo el estudio como hecho</button>
          )}
        </>)}

        {view === VIEW.TIMER && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{todayDayName} — {todayTarget > 0 ? `${todayTarget} sesiones hoy` : "Sin estudio hoy"}</p>
            <p style={{ fontSize: 12, color: timerPhase === "study" ? "#10b981" : "#a78bfa", fontWeight: 600, marginBottom: 16 }}>{timerPhase === "study" ? "🎯 Sesión de estudio (1:05)" : "☕ Descanso (10 min)"}</p>

            {/* Change 20: timerNotif */}
            {timerNotif && (
              <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                {timerNotif}
              </div>
            )}

            {timerPhase === "study" && (
              <div style={{ width: "100%", marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: "#475569", margin: "0 0 8px", textAlign: "center" }}>📖 Estudiando para</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => setTimerSubject(s)} style={{
                      padding: "5px 11px", borderRadius: 20,
                      border: timerSubject === s ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                      background: timerSubject === s ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: timerSubject === s ? "#60a5fa" : "#64748b",
                      fontSize: 11, fontWeight: timerSubject === s ? 700 : 500,
                      cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s ease",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ position: "relative", width: 220, height: 220, marginBottom: 24 }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="110" cy="110" r="96" fill="none" stroke={timerPhase === "study" ? "#10b981" : "#8b5cf6"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 96}`} strokeDashoffset={`${2 * Math.PI * 96 * (1 - timerPct / 100)}`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 44, fontWeight: 500, color: "#f1f5f9", letterSpacing: "-2px" }}>{fmtTimer(timerSecs)}</span>
                <span style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{todayD.completed}/{todayTarget} completadas</span>
                {timerPhase === "study" && <span style={{ fontSize: 10, color: "#3b82f6", marginTop: 2, fontWeight: 600 }}>{timerSubject}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <button onClick={resetTimer} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↺</button>
              <button onClick={toggleTimer} style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: timerActive ? "rgba(239,68,68,0.8)" : timerPhase === "study" ? "rgba(16,185,129,0.8)" : "rgba(139,92,246,0.8)", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: timerActive ? "0 0 30px rgba(239,68,68,0.3)" : "0 0 30px rgba(16,185,129,0.3)" }}>{timerActive ? "❚❚" : "▶"}</button>
              <button onClick={skipPhase} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⏭</button>
            </div>
            <div style={{ width: "100%", maxWidth: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Progreso estudio</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: studyPct >= 100 ? "#34d399" : "#60a5fa" }}>{todayD.completed}/{todayTarget} sesiones</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${studyPct}%`, background: studyPct >= 100 ? "#10b981" : "linear-gradient(90deg,#3b82f6,#60a5fa)", transition: "width 0.3s" }} />
              </div>
            </div>
            {/* Change 19: "Marcar todo hoy" removed from Timer view */}
          </div>
        )}

        {view === VIEW.STATS && (
          <div style={{ paddingTop: 8 }}>

            {/* Change 21: weekly summary card */}
            {weekSessionsTotal > 0 && (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Esta semana</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>{weekDaysStudied} días · {weekSessionsTotal} sesiones</span>
              </div>
            )}

            {/* Change 22: KPI cards — streak card shows bestStreak */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🔥</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b", fontFamily: "'DM Mono',monospace" }}>{data.streak || 0}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>días racha</div>
                <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>récord: {data.bestStreak || data.streak || 0}</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📚</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", fontFamily: "'DM Mono',monospace" }}>{data.totalSessions || 0}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>sesiones total</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{studyPct >= 100 ? "✅" : "📈"}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: studyPct >= 100 ? "#10b981" : "#60a5fa", fontFamily: "'DM Mono',monospace" }}>{studyPct}%</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>estudio hoy</div>
              </div>
            </div>

            {/* Materias esta semana */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Materias esta semana</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
              {SUBJECTS.map(s => {
                const count = weekSubjectTotals[s];
                const barPct = (count / maxSubjSessions) * 100;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 88, fontSize: 11, color: count > 0 ? "#94a3b8" : "#334155", flexShrink: 0, textAlign: "right" }}>{s}</span>
                    <div style={{ flex: 1, height: 20, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barPct}%`, background: count > 0 ? "linear-gradient(90deg,#3b82f6,#818cf8)" : "transparent", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: count > 0 ? 8 : 0, transition: "width 0.4s ease", minWidth: count > 0 ? 32 : 0 }}>
                        {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{count}</span>}
                      </div>
                    </div>
                    <span style={{ width: 24, fontSize: 11, color: count > 0 ? "#60a5fa" : "#1e293b", textAlign: "right", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{count || ""}</span>
                  </div>
                );
              })}
              {SUBJECTS.every(s => weekSubjectTotals[s] === 0) && (
                <p style={{ fontSize: 12, color: "#334155", textAlign: "center", margin: "4px 0" }}>Sin sesiones registradas esta semana</p>
              )}
            </div>

            {/* Últimos 7 días — uses unified last7 array */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Últimos 7 días</h3>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {[...last7].reverse().map(({ key, dayIdx, date, month }, i) => {
                const target = getTotalSessions(DAY_FULL[dayIdx]);
                const completed = data.days?.[key]?.completed || 0;
                const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : (completed > 0 ? 100 : 0);
                const isTodayDot = key === todayKey();
                return (<div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0", background: isTodayDot ? "rgba(96,165,250,0.08)" : "transparent", borderRadius: 8, border: isTodayDot ? "1px solid rgba(96,165,250,0.2)" : "1px solid transparent" }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>{DAYS[dayIdx]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", background: pct >= 100 ? "rgba(16,185,129,0.2)" : pct > 0 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)", border: `2px solid ${pct >= 100 ? "#10b981" : pct > 0 ? "#3b82f6" : "transparent"}`, fontSize: 11, fontWeight: 700, color: pct >= 100 ? "#34d399" : pct > 0 ? "#60a5fa" : "#334155" }}>
                    {pct >= 100 ? "✓" : target === 0 ? "—" : pct > 0 ? pct : "·"}
                  </div>
                  <div style={{ fontSize: 9, color: "#334155" }}>{date}/{month + 1}</div>
                  {!isTodayDot && target > 0 && (
                    <div onClick={() => addPastSession(key, dayIdx)} style={{ fontSize: 10, color: "#475569", cursor: "pointer", marginTop: 3, lineHeight: 1 }} title="Agregar sesión">+</div>
                  )}
                </div>);
              })}
            </div>

            {/* Change 23: Heatmap mensual con marcadores de parciales */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Actividad — {MONTH_NAMES[heatMonth]}</h3>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 12px", marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
                {["D","L","M","X","J","V","S"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#334155", paddingBottom: 2 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const mm = String(heatMonth + 1).padStart(2, "0");
                  const dd = String(day).padStart(2, "0");
                  const dateKey = `${heatYear}-${mm}-${dd}`;
                  const cellDate = new Date(heatYear, heatMonth, day);
                  const isFuture = cellDate > now;
                  const isTodayCell = dateKey === todayKey();
                  const dayIdx = cellDate.getDay();
                  const target = getTotalSessions(DAY_FULL[dayIdx]);
                  const completed = data.days?.[dateKey]?.completed || 0;
                  const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : (completed > 0 ? 100 : 0);

                  let bg;
                  if (isFuture) bg = "rgba(255,255,255,0.02)";
                  else if (target === 0 && completed === 0) bg = "rgba(255,255,255,0.05)";
                  else if (pct === 0) bg = "rgba(255,255,255,0.07)";
                  else if (pct < 50) bg = "rgba(16,185,129,0.28)";
                  else if (pct < 100) bg = "rgba(16,185,129,0.58)";
                  else bg = "#10b981";

                  return (
                    <div key={day} title={isFuture ? "" : `${day}/${heatMonth + 1}: ${completed}/${target} sesiones`} style={{
                      aspectRatio: "1", borderRadius: 3,
                      background: bg,
                      border: isTodayCell ? "1px solid #60a5fa" : "1px solid transparent",
                      position: "relative",
                    }}>
                      {isTodayCell && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{day}</div>}
                      {/* Change 23: parcial marker dot */}
                      {parcialDatesSet.has(dateKey) && !isFuture && (
                        <div style={{ position: 'absolute', top: 1, right: 1, width: 3, height: 3, borderRadius: '50%', background: '#f59e0b' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 9, color: "#334155" }}>menos</span>
                {["rgba(255,255,255,0.07)","rgba(16,185,129,0.28)","rgba(16,185,129,0.58)","#10b981"].map((c, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
                ))}
                <span style={{ fontSize: 9, color: "#334155" }}>más</span>
              </div>
            </div>

            {/* Change 24: Parciales split into upcoming and past */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Parciales</h3>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <select
                value={parcialesForm.materia}
                onChange={e => setParcialesForm(f => ({ ...f, materia: e.target.value }))}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: "8px 10px", fontFamily: "'DM Sans',sans-serif", cursor: "pointer", outline: "none" }}
              >
                {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0f1923" }}>{s}</option>)}
              </select>
              <input
                type="date"
                value={parcialesForm.fecha}
                onChange={e => setParcialesForm(f => ({ ...f, fecha: e.target.value }))}
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: "8px 10px", fontFamily: "'DM Sans',sans-serif", colorScheme: "dark", outline: "none" }}
              />
              <button onClick={addParcial} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+</button>
            </div>

            {upcomingParciales.length === 0 && pastParciales.length === 0 ? (
              <p style={{ fontSize: 12, color: "#334155", textAlign: "center", marginBottom: 24, marginTop: 8 }}>Sin parciales cargados</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {upcomingParciales.map((p) => {
                  const examDate = new Date(p.fecha + "T00:00:00");
                  const daysLeft = Math.ceil((examDate - todayMid) / 86400000);
                  const isUrgent = daysLeft < 7;
                  const isWarning = daysLeft >= 7 && daysLeft < 14;
                  const color = isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#34d399";
                  const bg = isUrgent ? "rgba(239,68,68,0.08)" : isWarning ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.06)";
                  const border = isUrgent ? "rgba(239,68,68,0.25)" : isWarning ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.18)";
                  const dateLabel = examDate.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
                  // Use original index for removal
                  const origIdx = data.parciales.findIndex(orig => orig.materia === p.materia && orig.fecha === p.fecha);
                  return (
                    <div key={`${p.materia}-${p.fecha}`} style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{p.materia}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{dateLabel}</div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 44 }}>
                        {daysLeft > 0 ? (
                          <>
                            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{daysLeft}</div>
                            <div style={{ fontSize: 9, color: "#64748b" }}>días</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>hoy</div>
                        )}
                      </div>
                      <button onClick={() => removeParcial(origIdx)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1 }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Change 24: past parciales toggle */}
            {pastParciales.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <button onClick={() => setShowPastParciales(p => !p)} style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#475569', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'left' }}>
                  {showPastParciales ? '▲ Ocultar pasados' : `▼ Ver pasados (${pastParciales.length})`}
                </button>
                {showPastParciales && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                    {pastParciales.map((p) => {
                      const examDate = new Date(p.fecha + "T00:00:00");
                      const dateLabel = examDate.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
                      const origIdx = data.parciales.findIndex(orig => orig.materia === p.materia && orig.fecha === p.fecha);
                      return (
                        <div key={`past-${p.materia}-${p.fecha}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", opacity: 0.5 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{p.materia}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{dateLabel}</div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: 44 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>Pasado</div>
                          </div>
                          <button onClick={() => removeParcial(origIdx)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 18, padding: "0 2px", lineHeight: 1 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Change 25: rename "Sesiones por día" to "Objetivo diario de estudio" */}
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#94a3b8" }}>Objetivo diario de estudio</h3>
            <p style={{ fontSize: 10, color: '#334155', margin: '-8px 0 12px' }}>Sesiones planificadas en tu rutina</p>
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
            <button onClick={() => { if (window.confirm("¿Borrar todos los datos?")) { persist({ ...DEFAULT_DATA }); } }} style={{ marginTop: 28, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Resetear datos</button>
          </div>
        )}
      </div>

      {/* Change 26: nav bar with iOS safe area */}
      <div style={{ position: "fixed", bottom: 'max(16px, env(safe-area-inset-bottom, 16px))', left: 16, right: 16, background: "rgba(12,18,34,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, display: "flex", justifyContent: "center", padding: "8px 0 10px", paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
