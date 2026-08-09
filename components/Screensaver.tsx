'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const BLUE = '#7ab8f5'
const FONT = 'ui-rounded, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif'

interface Props {
  timeoutSeconds: number
  weatherLat?: string
  weatherLon?: string
}

export function Screensaver({ timeoutSeconds, weatherLat = '48.8566', weatherLon = '2.3522' }: Props) {
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(new Date())
  const [temp, setTemp] = useState<number | null>(null)
  const activeRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Horloge
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Météo — chargée une fois à l'activation
  useEffect(() => {
    if (!active) return
    fetch(`/api/weather?lat=${weatherLat}&lon=${weatherLon}`)
      .then(r => r.json())
      .then(d => { if (d.temp != null) setTemp(d.temp) })
      .catch(() => {})
  }, [active, weatherLat, weatherLon])

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
      setActive(true); activeRef.current = true
      setTimeout(() => setVisible(true), 30)
    }, timeoutSeconds * 1000)
  }, [timeoutSeconds])

  const reset = useCallback(() => { dismiss(); schedule() }, [dismiss, schedule])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    schedule()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [reset, schedule])

  if (!active) return null

  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds()

  const DAY = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayStr = `${DAY[now.getDay()]} ${now.getDate()}`

  const clockSize = 'clamp(100px, 28vw, 420px)'
  const dotSize = 'clamp(8px, 1.2vw, 18px)'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        cursor: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
      onClick={dismiss}
    >
      {/* Date + météo — coin haut droit */}
      <div style={{
        position: 'absolute',
        top: '8%', right: '8%',
        textAlign: 'right',
        lineHeight: 1.4,
      }}>
        <p style={{ color: BLUE, fontSize: 'clamp(14px, 1.8vw, 26px)', fontWeight: 600, margin: 0 }}>
          {dayStr}
        </p>
        {temp !== null && (
          <p style={{ color: BLUE, fontSize: 'clamp(14px, 1.8vw, 26px)', fontWeight: 300, margin: 0, opacity: 0.85 }}>
            {temp}°C
          </p>
        )}
      </div>

      {/* Horloge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 24px)' }}>

        {/* Heures */}
        <span style={{
          fontSize: clockSize,
          fontWeight: 700,
          color: BLUE,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {h}
        </span>

        {/* Séparateur deux-points */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(6px, 1vw, 16px)',
          paddingBottom: '2%',
        }}>
          <div style={{
            width: dotSize, height: dotSize,
            borderRadius: '50%',
            background: BLUE,
            opacity: s % 2 === 0 ? 1 : 0.3,
            transition: 'opacity 0.2s',
          }} />
          <div style={{
            width: dotSize, height: dotSize,
            borderRadius: '50%',
            background: BLUE,
            opacity: s % 2 === 0 ? 0.3 : 1,
            transition: 'opacity 0.2s',
          }} />
        </div>

        {/* Minutes */}
        <span style={{
          fontSize: clockSize,
          fontWeight: 700,
          color: BLUE,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {m}
        </span>
      </div>
    </div>
  )
}
