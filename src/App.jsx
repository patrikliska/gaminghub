import { useState, useEffect, useCallback } from 'react'
import { fetchGames, addGame, updateGame, deleteGame } from './firebase'

// ─── Sample data for offline/demo mode ──────────────────────
const DEMO_GAMES = [
  {
    id: 'demo-1',
    name: 'RUST',
    cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg',
    genre: 'Survival',
    players: ['Patrik', 'Kamarád'],
    status: 'Hrajeme',
    note: 'Wipe každý čtvrtek',
    screenshots: [
      'https://cdn.cloudflare.steamstatic.com/steam/apps/252490/ss_0b6e50e2b1c5a952ef3842a945459ab87b60e78c.600x338.jpg',
    ],
    videos: ['https://www.youtube.com/watch?v=LGcECozNXFc'],
  },
  {
    id: 'demo-2',
    name: 'Victoria 3',
    cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/529340/header.jpg',
    genre: 'Strategy',
    players: ['Patrik'],
    status: 'Hrajeme',
    note: 'Norsko campaign',
    screenshots: [
      'https://cdn.cloudflare.steamstatic.com/steam/apps/529340/ss_7e20ba2c1c04d31672f89763236139e45e1e9490.600x338.jpg',
    ],
    videos: [],
  },
  {
    id: 'demo-3',
    name: 'Albion Online',
    cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/761890/header.jpg',
    genre: 'MMORPG',
    players: ['Patrik', 'Kamarád'],
    status: 'Pauza',
    note: 'Zvl tiers, vrátíme se',
    screenshots: [],
    videos: ['https://www.youtube.com/watch?v=OSKnV6ECQHE'],
  },
  {
    id: 'demo-4',
    name: 'Travian Kingdoms',
    cover: 'https://images.travian.com/kingdoms/og-image.jpg',
    genre: 'Strategy',
    players: ['Patrik'],
    status: 'Hrajeme',
    note: 'Defenzivní strategie',
    screenshots: [],
    videos: [],
  },
]

// ─── Helpers ────────────────────────────────────────────────

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function getMedalClipId(url) {
  // Matches: medal.tv/games/GAME/clips/CLIP_ID or medal.tv/clips/CLIP_ID
  const m = url.match(/medal\.tv\/(?:games\/[^/]+\/)?clips\/([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function isDirectVideo(url) {
  try {
    const u = new URL(url)
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u.pathname)
  } catch { return false }
}

// ─── StatusBadge ────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Hrajeme: { bg: 'rgba(0,255,136,0.15)', fg: '#00ff88', bd: 'rgba(0,255,136,0.3)' },
    Pauza:   { bg: 'rgba(255,170,0,0.15)', fg: '#ffaa00', bd: 'rgba(255,170,0,0.3)' },
    Dohráno: { bg: 'rgba(120,120,140,0.15)', fg: '#9999aa', bd: 'rgba(120,120,140,0.3)' },
  }
  const c = map[status] || map.Pauza
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
      }}
    >
      {status}
    </span>
  )
}

// ─── Lightbox ───────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <img
          src={images[idx]}
          alt=""
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 0 60px rgba(0,255,136,0.15)',
          }}
        />
        <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', color: '#778', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          {idx + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <>
            <NavBtn dir="left" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} />
            <NavBtn dir="right" onClick={() => setIdx((i) => (i + 1) % images.length)} />
          </>
        )}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: -40, right: -10, background: 'none', border: 'none', color: '#778', fontSize: 24, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function NavBtn({ dir, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [dir === 'left' ? 'left' : 'right']: -50,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        width: 40,
        height: 40,
        borderRadius: '50%',
        fontSize: 20,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}

// ─── GameDetail (slide-in panel) ────────────────────────────

function GameDetail({ game, onClose, onDelete, onEdit }) {
  const [lightbox, setLightbox] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
      <div className="overlay" onClick={onClose} />
      <div
        style={{
          position: 'relative',
          width: 'min(600px, 90vw)',
          height: '100%',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease',
        }}
      >
        {/* Hero */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
          <img src={game.cover} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} onError={(e) => (e.target.style.display = 'none')} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, var(--bg-panel) 100%)' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}
          >
            ✕
          </button>
          <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>
              {game.name}
            </h2>
          </div>
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          {/* Meta tags */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <StatusBadge status={game.status} />
            <Tag color="blue">{game.genre}</Tag>
            {game.players?.map((p) => <Tag key={p} color="ghost">👤 {p}</Tag>)}
          </div>

          {game.note && (
            <div
              style={{
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                borderRadius: 8, color: '#aab', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 28, lineHeight: 1.6,
              }}
            >
              {game.note}
            </div>
          )}

          {/* Screenshots */}
          {game.screenshots?.length > 0 && (
            <Section icon="⬥" iconColor="var(--accent)" title="Screenshoty">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {game.screenshots.map((url, i) => (
                  <ScreenshotThumb key={i} url={url} onClick={() => setLightbox({ images: game.screenshots, index: i })} />
                ))}
              </div>
            </Section>
          )}

          {/* Videos */}
          {game.videos?.length > 0 && (
            <Section icon="⬥" iconColor="var(--red)" title="Videa">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {game.videos.map((url, i) => {
                  const ytId = getYouTubeId(url)
                  const medalId = getMedalClipId(url)
                  const direct = isDirectVideo(url)

                  if (ytId) {
                    return (
                      <div key={i} style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={`Video ${i + 1}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )
                  }

                  if (medalId) {
                    return (
                      <div key={i} style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <iframe
                          src={`https://medal.tv/clip/${medalId}?theater=true&mute=0`}
                          title={`Medal clip ${i + 1}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="autoplay; clipboard-write; encrypted-media"
                          allowFullScreen
                        />
                      </div>
                    )
                  }

                  if (direct) {
                    return (
                      <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <video
                          src={url}
                          controls
                          preload="metadata"
                          style={{ width: '100%', display: 'block', borderRadius: 8, background: '#000' }}
                        />
                      </div>
                    )
                  }

                  // Fallback: plain link
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--blue)', fontSize: 13, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}
                    >
                      🔗 {url}
                    </a>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
            <button className="btn-accent" onClick={() => onEdit(game)}>✏️ Upravit</button>
            {!confirmDelete ? (
              <button className="btn-danger" onClick={() => setConfirmDelete(true)}>🗑 Smazat</button>
            ) : (
              <button
                className="btn-danger"
                onClick={() => { onDelete(game.id); onClose() }}
                style={{ background: 'rgba(255,68,102,0.25)' }}
              >
                Opravdu smazat?
              </button>
            )}
          </div>
        </div>
      </div>

      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function Tag({ color, children }) {
  const colors = {
    blue:  { bg: 'rgba(100,140,255,0.12)', fg: 'var(--blue)', bd: 'rgba(100,140,255,0.25)' },
    ghost: { bg: 'rgba(255,255,255,0.05)', fg: '#99a', bd: 'rgba(255,255,255,0.08)' },
  }
  const c = colors[color] || colors.ghost
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, letterSpacing: '0.3px' }}>
      {children}
    </span>
  )
}

function Section({ icon, iconColor, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#99a', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12, marginTop: 0 }}>
        <span style={{ color: iconColor }}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  )
}

function ScreenshotThumb({ url, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '16/9',
        border: `1px solid ${hov ? 'var(--accent-border)' : 'var(--border)'}`, transition: 'all 0.2s',
        transform: hov ? 'scale(1.02)' : 'none',
      }}
    >
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

// ─── GameCard ───────────────────────────────────────────────

function GameCard({ game, onClick, index }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${hov ? 'var(--accent-border)' : 'var(--border)'}`,
        background: 'var(--bg-card)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,136,0.08)' : '0 2px 8px rgba(0,0,0,0.3)',
        animation: `cardIn 0.5s ease ${index * 0.08}s both`,
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '460/215', overflow: 'hidden' }}>
        <img
          src={game.cover}
          alt={game.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
          onError={(e) => (e.target.style.display = 'none')}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(13,15,20,0.95) 100%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusBadge status={game.status} />
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {game.name}
        </h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--blue)', background: 'rgba(100,140,255,0.1)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
            {game.genre}
          </span>
          <span style={{ fontSize: 11, color: '#667' }}>•</span>
          <span style={{ fontSize: 11, color: '#667', fontFamily: 'var(--font-mono)' }}>
            {game.players?.length || 0} hráč{(game.players?.length || 0) !== 1 ? 'i' : ''}
          </span>
          {game.screenshots?.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#667' }}>•</span>
              <span style={{ fontSize: 11, color: '#556' }}>🖼 {game.screenshots.length}</span>
            </>
          )}
          {game.videos?.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#667' }}>•</span>
              <span style={{ fontSize: 11, color: '#556' }}>▶ {game.videos.length}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── GameFormModal (Add / Edit) ─────────────────────────────

const GENRES = ['Survival', 'Strategy', 'MMORPG', 'FPS', 'RPG', 'Sandbox', 'Racing', 'Horror', 'Jiné']
const STATUSES = ['Hrajeme', 'Pauza', 'Dohráno']

function GameFormModal({ onClose, onSubmit, initialData }) {
  const isEdit = !!initialData

  const [form, setForm] = useState({
    name: initialData?.name || '',
    cover: initialData?.cover || '',
    genre: initialData?.genre || 'Survival',
    players: initialData?.players?.join(', ') || '',
    status: initialData?.status || 'Hrajeme',
    note: initialData?.note || '',
    screenshots: initialData?.screenshots?.join('\n') || '',
    videos: initialData?.videos?.join('\n') || '',
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const gameData = {
      name: form.name.trim(),
      cover: form.cover.trim() || `https://placehold.co/460x215/1a1c24/334?text=${encodeURIComponent(form.name)}`,
      genre: form.genre,
      players: form.players.split(',').map((p) => p.trim()).filter(Boolean),
      status: form.status,
      note: form.note.trim(),
      screenshots: form.screenshots.split('\n').map((s) => s.trim()).filter(Boolean),
      videos: form.videos.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    await onSubmit(gameData, initialData?.id)
    setSaving(false)
    onClose()
  }

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
      <div className="overlay" onClick={onClose} />
      <div
        style={{
          position: 'relative', width: 'min(480px, 90vw)', maxHeight: '85vh', background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ color: 'var(--accent)' }}>{isEdit ? '✏️' : '+'}</span>{' '}
          {isEdit ? 'Upravit hru' : 'Přidat hru'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Název hry *" value={form.name} onChange={set('name')} placeholder="např. Rust" />
          <Field label="Cover URL (Steam header)" value={form.cover} onChange={set('cover')} placeholder="https://cdn.cloudflare.steamstatic.com/steam/apps/..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Žánr" value={form.genre} onChange={set('genre')} options={GENRES} />
            <Select label="Status" value={form.status} onChange={set('status')} options={STATUSES} />
          </div>
          <Field label="Hráči (oddělení čárkou)" value={form.players} onChange={set('players')} placeholder="Patrik, Kamarád" />
          <Field label="Poznámka" value={form.note} onChange={set('note')} placeholder="Volitelné poznámky..." />
          <Textarea label="Screenshoty (URL, jeden na řádek)" value={form.screenshots} onChange={set('screenshots')} />
          <Textarea label="Videa – YouTube / Medal.tv / .mp4 (URL, jeden na řádek)" value={form.videos} onChange={set('videos')} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Zrušit</button>
          <button className="btn-accent" onClick={handleSubmit} disabled={saving} style={{ padding: '10px 24px', fontSize: 14 }}>
            {saving ? '⏳ Ukládám...' : isEdit ? 'Uložit' : 'Přidat'}
          </button>
        </div>
      </div>
    </div>
  )
}

const fieldBaseStyle = {
  width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14,
  fontFamily: 'var(--font-display)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={fieldBaseStyle} />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldBaseStyle}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...fieldBaseStyle, resize: 'vertical', minHeight: 60, fontFamily: 'var(--font-mono)', fontSize: 12 }}
      />
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────

export default function App() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [demoMode, setDemoMode] = useState(false)

  const [selectedGame, setSelectedGame] = useState(null)
  const [editGame, setEditGame] = useState(null) // null | 'new' | game object
  const [filter, setFilter] = useState('Vše')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Load games from Firebase (fallback to demo) ──
  const loadGames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGames()
      setGames(data)
      setDemoMode(false)
    } catch (err) {
      console.warn('Firebase not configured, using demo data:', err.message)
      setGames(DEMO_GAMES)
      setDemoMode(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadGames() }, [loadGames])

  // ── CRUD handlers ──
  const handleAddOrEdit = async (gameData, existingId) => {
    if (demoMode) {
      if (existingId) {
        setGames((prev) => prev.map((g) => (g.id === existingId ? { ...g, ...gameData } : g)))
      } else {
        setGames((prev) => [{ id: `demo-${Date.now()}`, ...gameData }, ...prev])
      }
      return
    }

    try {
      if (existingId) {
        await updateGame(existingId, gameData)
      } else {
        await addGame(gameData)
      }
      await loadGames()
    } catch (err) {
      console.error('Save failed:', err)
      setError('Nepodařilo se uložit. Zkontroluj Firebase konfiguraci.')
    }
  }

  const handleDelete = async (id) => {
    if (demoMode) {
      setGames((prev) => prev.filter((g) => g.id !== id))
      return
    }
    try {
      await deleteGame(id)
      await loadGames()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // ── Filtered games ──
  const filteredGames = games.filter((g) => {
    const matchFilter = filter === 'Vše' || g.status === filter
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total: games.length,
    playing: games.filter((g) => g.status === 'Hrajeme').length,
    screenshots: games.reduce((a, g) => a + (g.screenshots?.length || 0), 0),
    videos: games.reduce((a, g) => a + (g.videos?.length || 0), 0),
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Background glow */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 400, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 30% 0%, rgba(0,255,136,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 0%, rgba(100,140,255,0.03) 0%, transparent 60%)',
        }}
      />

      {/* ─── Header ─── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(9,10,15,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000',
              }}
            >
              G
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, background: 'linear-gradient(135deg, #fff, #99a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gaming Hub
            </span>
            {demoMode && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#ffaa00', fontFamily: 'var(--font-mono)', background: 'rgba(255,170,0,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                DEMO
              </span>
            )}
          </div>

          {/* Search + Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat..."
                style={{
                  padding: '7px 14px 7px 34px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
                  fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', width: 180,
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, opacity: 0.4 }}>🔍</span>
            </div>
            <button className="btn-accent" onClick={() => setEditGame('new')}>+ Přidat hru</button>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 }}>
        {/* Error banner */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.25)', borderRadius: 8, color: 'var(--red)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Celkem her', value: stats.total, color: '#fff' },
            { label: 'Hrajeme', value: stats.playing, color: 'var(--accent)' },
            { label: 'Screenshotů', value: stats.screenshots, color: 'var(--blue)' },
            { label: 'Videí', value: stats.videos, color: 'var(--red)' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {['Vše', 'Hrajeme', 'Pauza', 'Dohráno'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                background: filter === f ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${filter === f ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 20, color: filter === f ? 'var(--accent)' : '#667',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        )}

        {/* Game grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredGames.map((game, i) => (
              <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} index={i} />
            ))}
          </div>
        )}

        {!loading && filteredGames.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
            <div style={{ fontSize: 14 }}>Žádné hry nenalezeny</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, padding: 16, textAlign: 'center', color: '#334', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
          GAMING HUB • {demoMode ? 'DEMO MODE — NAKONFIGURUJ FIREBASE' : 'FIREBASE CONNECTED'} • GITHUB PAGES
        </div>
      </main>

      {/* ─── Modals ─── */}
      {selectedGame && (
        <GameDetail
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onDelete={handleDelete}
          onEdit={(g) => { setSelectedGame(null); setEditGame(g) }}
        />
      )}
      {editGame && (
        <GameFormModal
          onClose={() => setEditGame(null)}
          onSubmit={handleAddOrEdit}
          initialData={editGame === 'new' ? null : editGame}
        />
      )}
    </div>
  )
}
