'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Sphère 3D ────────────────────────────────────────────────────────────────

function Sphere({ size, pulse }: { size: number; pulse: boolean }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: 'radial-gradient(circle at 32% 28%, #f8fafc 0%, #cbd5e1 25%, #94a3b8 55%, #475569 85%, #1e293b 100%)',
      boxShadow: `
        0 ${size * 0.15}px ${size * 0.4}px rgba(0,0,0,0.8),
        inset 0 ${size * 0.06}px ${size * 0.12}px rgba(255,255,255,0.25)
      `,
      opacity: pulse ? 1 : 0.35,
      transition: 'opacity 0.3s ease',
    }} />
  )
}

// ─── Chiffre flottant ─────────────────────────────────────────────────────────

function FloatNumber({ value, px, py, zIndex, bright }: {
  value: string; px: number; py: number; zIndex: number; bright: boolean
}) {
  const size = 'clamp(130px, 27vw, 400px)'

  return (
    <div style={{
      fontSize: size,
      fontWeight: 900,
      lineHeight: 0.9,
      letterSpacing: '-0.04em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      background: bright
        ? 'linear-gradient(170deg, #93c5fd 0%, #60a5fa 20%, #3b82f6 50%, #2563eb 75%, #1d4ed8 100%)'
        : 'linear-gradient(170deg, #60a5fa 0%, #3b82f6 30%, #2563eb 60%, #1e40af 85%, #1e3a8a 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      filter: bright
        ? 'drop-shadow(0 0 30px rgba(59,130,246,0.7)) drop-shadow(0 4px 20px rgba(29,78,216,0.5))'
        : 'drop-shadow(0 0 20px rgba(29,78,216,0.5)) drop-shadow(0 6px 30px rgba(0,0,0,0.9))',
      transform: `translate(${px}px, ${py}px)`,
      transition: 'transform 0.12s ease-out',
      position: 'relative',
      zIndex,
      userSelect: 'none',
    }}>
      {value}
    </div>
  )
}

// ─── Screensaver ──────────────────────────────────────────────────────────────

export function Screensaver({ timeoutSeconds }: { timeoutSeconds: number }) {
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(new Date())
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const activeRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const dismiss = useCallback(() => {
    if (!activeRef.current) return
    setVisible(false)
    setTimeout(() => { setActive(false); activeRef.current = false }, 450)
  }, [])

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (timeoutSeconds <= 0) return
    timerRef.current = setTimeout(() => {
      setActive(true); activeRef.current = true
      setTimeout(() => setVisible(true), 30)
    }, timeoutSeconds * 1000)
  }, [timeoutSeconds])

  const reset = useCallback(() => {
    dismiss(); schedule()
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

  // Parallaxe douce : heures et minutes bougent en sens opposé
  const px = (mouse.x - 0.5) * 22
  const py = (mouse.y - 0.5) * 14

  // Taille des sphères en vw (rem pour calcul)
  const sphereSize = Math.min(Math.max(window.innerWidth * 0.038, 28), 58)
  const gap = sphereSize * 0.5

  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.45s ease',
        cursor: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onClick={dismiss}
    >
      {/* Halo ambiant bleu */}
      <div style={{
        position: 'absolute',
        width: '80vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        transform: `translate(${px * 0.3}px, ${py * 0.3}px)`,
        transition: 'transform 0.2s ease-out',
      }} />

      {/* Horloge */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>

        {/* Heures — derrière les sphères (z:1) */}
        <FloatNumber value={h} px={-px * 0.6} py={-py * 0.6} zIndex={1} bright={false} />

        {/* Colonne sphères — z:2, se superposent aux deux chiffres */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap, flexShrink: 0,
          marginLeft: -sphereSize * 0.55,
          marginRight: -sphereSize * 0.55,
          zIndex: 2, position: 'relative',
          transform: `translate(${px * 1.4}px, ${py * 1.4}px)`,
          transition: 'transform 0.1s ease-out',
        }}>
          <Sphere size={sphereSize} pulse={s % 2 === 0} />
          <Sphere size={sphereSize} pulse={s % 2 !== 0} />
        </div>

        {/* Minutes — devant les sphères (z:3) */}
        <FloatNumber value={m} px={px * 0.6} py={py * 0.6} zIndex={3} bright={true} />
      </div>

      {/* Date */}
      <div style={{
        marginTop: 'clamp(24px, 4vh, 56px)',
        color: '#334155',
        fontSize: 'clamp(13px, 1.5vw, 22px)',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontWeight: 300,
        transform: `translate(${px * 0.15}px, ${py * 0.15}px)`,
        transition: 'transform 0.18s ease-out',
      }}>
        {dateStr}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 'clamp(14px, 2.5vh, 28px)',
        color: '#1e293b', fontSize: '11px', letterSpacing: '0.18em',
        fontWeight: 400, textTransform: 'uppercase',
      }}>
        Toucher pour quitter
      </div>
    </div>
  )
}
