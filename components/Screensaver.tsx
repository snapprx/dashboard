'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  timeoutSeconds: number // 0 = désactivé
}

// ─── Chiffre avec effet de profondeur ────────────────────────────────────────

function FloatDigits({ value, px, py, delay }: { value: string; px: number; py: number; delay: number }) {
  const size = 'clamp(100px, 22vw, 300px)'
  const base: React.CSSProperties = {
    fontSize: size,
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
    letterSpacing: '-0.04em',
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.12s ease-out',
  }

  return (
    <div style={{ position: 'relative', width: 'clamp(110px, 23vw, 310px)', height: 'clamp(100px, 22vw, 300px)' }}>
      {/* Couche profonde — ombre */}
      <div style={{
        ...base,
        color: '#0f172a',
        transform: `translate(${(px + delay) * 0.4}px, ${py * 0.4}px)`,
        filter: 'blur(4px)',
        opacity: 0.8,
      }}>{value}</div>

      {/* Couche milieu — bleu foncé */}
      <div style={{
        ...base,
        background: 'linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transform: `translate(${(px + delay) * 0.7}px, ${py * 0.7}px)`,
        opacity: 0.65,
      }}>{value}</div>

      {/* Couche avant — bleu vif */}
      <div style={{
        ...base,
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 35%, #60a5fa 65%, #93c5fd 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transform: `translate(${(px + delay) * 1.0}px, ${py * 1.0}px)`,
        zIndex: 2,
      }}>{value}</div>
    </div>
  )
}

// ─── Séparateur sphérique ─────────────────────────────────────────────────────

function FloatDots({ px, py, tick }: { px: number; py: number; tick: number }) {
  const dot = (top: boolean): React.CSSProperties => ({
    width: 'clamp(14px, 2vw, 28px)',
    height: 'clamp(14px, 2vw, 28px)',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #f1f5f9, #94a3b8 60%, #475569)',
    boxShadow: '0 4px 16px rgba(148,163,184,0.35), inset 0 1px 2px rgba(255,255,255,0.3)',
    opacity: (top ? tick % 2 === 0 : tick % 2 !== 0) ? 1 : 0.3,
    transition: 'opacity 0.25s',
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(8px, 1.5vw, 20px)',
      margin: '0 clamp(6px, 1vw, 14px)',
      transform: `translate(${px * 1.6}px, ${py * 1.6}px)`,
      transition: 'transform 0.12s ease-out',
      zIndex: 10,
      position: 'relative',
    }}>
      <div style={dot(true)} />
      <div style={dot(false)} />
    </div>
  )
}

// ─── Screensaver principal ────────────────────────────────────────────────────

export function Screensaver({ timeoutSeconds }: Props) {
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(new Date())
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const activeRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Horloge
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Inactivité
  const dismiss = useCallback(() => {
    if (!activeRef.current) return
    setVisible(false)
    setTimeout(() => { setActive(false); activeRef.current = false }, 400)
  }, [])

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (timeoutSeconds <= 0) return
    timerRef.current = setTimeout(() => {
      setActive(true)
      activeRef.current = true
      setTimeout(() => setVisible(true), 30)
    }, timeoutSeconds * 1000)
  }, [timeoutSeconds])

  const reset = useCallback(() => {
    dismiss()
    schedule()
  }, [dismiss, schedule])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    schedule()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [reset, schedule])

  // Parallaxe souris
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!activeRef.current) return
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  if (!active) return null

  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds()
  const px = (mouse.x - 0.5) * 28
  const py = (mouse.y - 0.5) * 18

  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center select-none cursor-none overflow-hidden"
      style={{
        background: '#000',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
      onClick={dismiss}
    >
      {/* Halo d'ambiance derrière */}
      <div style={{
        position: 'absolute',
        width: '60vw',
        height: '40vh',
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)',
        transform: `translate(${px * 0.4}px, ${py * 0.4}px)`,
        transition: 'transform 0.15s ease-out',
        pointerEvents: 'none',
      }} />

      {/* Heure */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <FloatDigits value={h} px={px} py={py} delay={-6} />
        <FloatDots px={px} py={py} tick={s} />
        <FloatDigits value={m} px={px} py={py} delay={6} />
      </div>

      {/* Date */}
      <div style={{
        marginTop: 'clamp(16px, 3vh, 40px)',
        color: '#475569',
        fontSize: 'clamp(13px, 1.4vw, 20px)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontWeight: 300,
        transform: `translate(${px * 0.2}px, ${py * 0.2}px)`,
        transition: 'transform 0.18s ease-out',
      }}>
        {dateStr}
      </div>

      {/* Hint de sortie */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(16px, 3vh, 32px)',
        color: '#1e293b',
        fontSize: '12px',
        letterSpacing: '0.15em',
        fontWeight: 400,
      }}>
        TOUCHER POUR QUITTER
      </div>
    </div>
  )
}
