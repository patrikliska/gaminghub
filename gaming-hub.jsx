import { useState, useEffect, useRef } from "react";

// ─── Sample Data (will be replaced with Firebase) ───
const SAMPLE_GAMES = [
  {
    id: 1,
    name: "RUST",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg",
    genre: "Survival",
    players: ["Patrik", "Kamarád"],
    status: "Hrajeme",
    note: "Wipe každý čtvrtek",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/ss_0b6e50e2b1c5a952ef3842a945459ab87b60e78c.600x338.jpg",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/ss_4fa3b5e2b1c5a952ef3842a945459ab87b60e78c.600x338.jpg",
    ],
    videos: ["https://www.youtube.com/watch?v=LGcECozNXFc"],
  },
  {
    id: 2,
    name: "Victoria 3",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/529340/header.jpg",
    genre: "Strategy",
    players: ["Patrik"],
    status: "Hrajeme",
    note: "Norsko campaign",
    screenshots: [
      "https://cdn.cloudflare.steamstatic.com/steam/apps/529340/ss_7e20ba2c1c04d31672f89763236139e45e1e9490.600x338.jpg",
    ],
    videos: [],
  },
  {
    id: 3,
    name: "Albion Online",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/761890/header.jpg",
    genre: "MMORPG",
    players: ["Patrik", "Kamarád"],
    status: "Pauza",
    note: "Zvl tiers, vrátíme se",
    screenshots: [],
    videos: ["https://www.youtube.com/watch?v=OSKnV6ECQHE"],
  },
  {
    id: 4,
    name: "Travian Kingdoms",
    cover: "https://images.travian.com/kingdoms/og-image.jpg",
    genre: "Strategy",
    players: ["Patrik"],
    status: "Hrajeme",
    note: "Defenzivní strategie",
    screenshots: [],
    videos: [],
  },
];

// ─── Helpers ───
function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function StatusBadge({ status }) {
  const colors = {
    Hrajeme: { bg: "rgba(0,255,136,0.15)", text: "#00ff88", border: "rgba(0,255,136,0.3)" },
    Pauza: { bg: "rgba(255,170,0,0.15)", text: "#ffaa00", border: "rgba(255,170,0,0.3)" },
    Dohráno: { bg: "rgba(120,120,140,0.15)", text: "#9999aa", border: "rgba(120,120,140,0.3)" },
  };
  const c = colors[status] || colors["Pauza"];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

// ─── Lightbox ───
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(20px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        <img
          src={images[idx]}
          alt=""
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: "8px",
            boxShadow: "0 0 60px rgba(0,255,136,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#778",
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {idx + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              style={{
                ...navBtnStyle,
                left: "-50px",
              }}
            >
              ‹
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              style={{
                ...navBtnStyle,
                right: "-50px",
              }}
            >
              ›
            </button>
          </>
        )}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-40px",
            right: "-10px",
            background: "none",
            border: "none",
            color: "#778",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const navBtnStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontSize: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

// ─── Game Detail Panel ───
function GameDetail({ game, onClose }) {
  const [lightbox, setLightbox] = useState(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        style={{
          position: "relative",
          width: "min(600px, 90vw)",
          height: "100%",
          background: "#0d0f14",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          overflowY: "auto",
          animation: "slideIn 0.3s ease",
        }}
      >
        {/* Hero */}
        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
          <img
            src={game.cover}
            alt={game.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.6)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(transparent 40%, #0d0f14 100%)",
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: "50%",
              fontSize: 18,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
          >
            ✕
          </button>
          <div style={{ position: "absolute", bottom: 20, left: 24 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 800,
                color: "#fff",
                fontFamily: "'Rajdhani', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "1px",
                textShadow: "0 0 30px rgba(0,255,136,0.3)",
              }}
            >
              {game.name}
            </h2>
          </div>
        </div>

        <div style={{ padding: "20px 24px 40px" }}>
          {/* Meta */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
            <StatusBadge status={game.status} />
            <span style={{ ...tagStyle, background: "rgba(100,140,255,0.12)", color: "#88aaff", borderColor: "rgba(100,140,255,0.25)" }}>
              {game.genre}
            </span>
            {game.players.map((p) => (
              <span key={p} style={{ ...tagStyle, background: "rgba(255,255,255,0.05)", color: "#99a", borderColor: "rgba(255,255,255,0.08)" }}>
                👤 {p}
              </span>
            ))}
          </div>

          {game.note && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                color: "#aab",
                fontSize: "14px",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: "28px",
                lineHeight: 1.6,
              }}
            >
              {game.note}
            </div>
          )}

          {/* Screenshots */}
          {game.screenshots?.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <h3 style={sectionTitle}>
                <span style={{ color: "#00ff88" }}>⬥</span> Screenshoty
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                {game.screenshots.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setLightbox({ images: game.screenshots, index: i })}
                    style={{
                      position: "relative",
                      borderRadius: "6px",
                      overflow: "hidden",
                      cursor: "pointer",
                      aspectRatio: "16/9",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0,255,136,0.3)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                    >
                      <span style={{ fontSize: "24px" }}>🔍</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {game.videos?.length > 0 && (
            <div>
              <h3 style={sectionTitle}>
                <span style={{ color: "#ff4466" }}>⬥</span> Videa
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {game.videos.map((url, i) => {
                  const ytId = getYouTubeId(url);
                  if (!ytId) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={`Video ${i + 1}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

const tagStyle = {
  padding: "3px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 600,
  border: "1px solid",
  letterSpacing: "0.3px",
};

const sectionTitle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#99a",
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  marginBottom: "12px",
  marginTop: 0,
};

// ─── Game Card ───
function GameCard({ game, onClick, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
        background: "#12141a",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,136,0.08)" : "0 2px 8px rgba(0,0,0,0.3)",
        animation: `cardIn 0.5s ease ${index * 0.08}s both`,
      }}
    >
      {/* Cover Image */}
      <div style={{ position: "relative", aspectRatio: "460/215", overflow: "hidden" }}>
        <img
          src={game.cover}
          alt={game.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(transparent 50%, rgba(13,15,20,0.95) 100%)",
          }}
        />
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <StatusBadge status={game.status} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "17px",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Rajdhani', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {game.name}
        </h3>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#88aaff",
              background: "rgba(100,140,255,0.1)",
              padding: "2px 8px",
              borderRadius: "10px",
              fontWeight: 600,
            }}
          >
            {game.genre}
          </span>
          <span style={{ fontSize: "11px", color: "#667" }}>•</span>
          <span style={{ fontSize: "11px", color: "#667", fontFamily: "'JetBrains Mono', monospace" }}>
            {game.players.length} hráč{game.players.length > 1 ? "i" : ""}
          </span>
          {game.screenshots?.length > 0 && (
            <>
              <span style={{ fontSize: "11px", color: "#667" }}>•</span>
              <span style={{ fontSize: "11px", color: "#556" }}>🖼 {game.screenshots.length}</span>
            </>
          )}
          {game.videos?.length > 0 && (
            <>
              <span style={{ fontSize: "11px", color: "#667" }}>•</span>
              <span style={{ fontSize: "11px", color: "#556" }}>▶ {game.videos.length}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Game Modal ───
function AddGameModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    cover: "",
    genre: "Survival",
    players: "",
    status: "Hrajeme",
    note: "",
    screenshots: "",
    videos: "",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAdd({
      id: Date.now(),
      name: form.name,
      cover: form.cover || "https://placehold.co/460x215/1a1c24/334?text=" + encodeURIComponent(form.name),
      genre: form.genre,
      players: form.players
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      status: form.status,
      note: form.note,
      screenshots: form.screenshots
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      videos: form.videos
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} />
      <div
        style={{
          position: "relative",
          width: "min(480px, 90vw)",
          maxHeight: "85vh",
          background: "#12141a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "32px",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            margin: "0 0 24px",
            fontSize: "22px",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "'Rajdhani', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          <span style={{ color: "#00ff88" }}>+</span> Přidat hru
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <InputField label="Název hry *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="např. Rust" />
          <InputField label="Cover URL" value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} placeholder="https://..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <SelectField label="Žánr" value={form.genre} onChange={(v) => setForm({ ...form, genre: v })} options={["Survival", "Strategy", "MMORPG", "FPS", "RPG", "Sandbox", "Racing", "Jiné"]} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Hrajeme", "Pauza", "Dohráno"]} />
          </div>
          <InputField label="Hráči" value={form.players} onChange={(v) => setForm({ ...form, players: v })} placeholder="Patrik, Kamarád" />
          <InputField label="Poznámka" value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Volitelné poznámky..." />
          <TextareaField label="Screenshoty (URL, jeden na řádek)" value={form.screenshots} onChange={(v) => setForm({ ...form, screenshots: v })} />
          <TextareaField label="Videa – YouTube (URL, jeden na řádek)" value={form.videos} onChange={(v) => setForm({ ...form, videos: v })} />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Zrušit
          </button>
          <button onClick={handleSubmit} style={submitBtnStyle}>
            Přidat
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: "vertical", minHeight: "60px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}
      />
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#778",
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  color: "#dde",
  fontSize: "14px",
  fontFamily: "'Rajdhani', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const cancelBtnStyle = {
  padding: "10px 20px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#778",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Rajdhani', sans-serif",
};

const submitBtnStyle = {
  padding: "10px 24px",
  background: "rgba(0,255,136,0.15)",
  border: "1px solid rgba(0,255,136,0.3)",
  borderRadius: "8px",
  color: "#00ff88",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Rajdhani', sans-serif",
  letterSpacing: "0.5px",
  transition: "all 0.2s",
};

// ─── Main App ───
export default function GamingHub() {
  const [games, setGames] = useState(SAMPLE_GAMES);
  const [selectedGame, setSelectedGame] = useState(null);
  const [filter, setFilter] = useState("Vše");
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = games.filter((g) => {
    const matchesFilter = filter === "Vše" || g.status === filter;
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: games.length,
    playing: games.filter((g) => g.status === "Hrajeme").length,
    screenshots: games.reduce((a, g) => a + (g.screenshots?.length || 0), 0),
    videos: games.reduce((a, g) => a + (g.videos?.length || 0), 0),
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090a0f",
        color: "#dde",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Rajdhani:wght@400;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; background: #090a0f; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        input:focus, select:focus, textarea:focus {
          border-color: rgba(0,255,136,0.4) !important;
          box-shadow: 0 0 0 2px rgba(0,255,136,0.08);
        }
      `}</style>

      {/* ─── Background Effect ─── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "400px",
          background: "radial-gradient(ellipse at 30% 0%, rgba(0,255,136,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 0%, rgba(100,140,255,0.03) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Header ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(9,10,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00ff88, #00cc6a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: 800,
                color: "#000",
              }}
            >
              G
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "2px",
                background: "linear-gradient(135deg, #fff 0%, #99a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Gaming Hub
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#00ff88",
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(0,255,136,0.1)",
                padding: "2px 8px",
                borderRadius: "10px",
                letterSpacing: "1px",
              }}
            >
              v1.0
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat..."
                style={{
                  padding: "7px 14px 7px 34px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: "#dde",
                  fontSize: "13px",
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                  width: "180px",
                  transition: "all 0.2s",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px",
                  opacity: 0.4,
                }}
              >
                🔍
              </span>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: "7px 16px",
                background: "rgba(0,255,136,0.12)",
                border: "1px solid rgba(0,255,136,0.25)",
                borderRadius: "8px",
                color: "#00ff88",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              + Přidat hru
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 32px 60px", position: "relative", zIndex: 1 }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "Celkem her", value: stats.total, color: "#fff" },
            { label: "Hrajeme", value: stats.playing, color: "#00ff88" },
            { label: "Screenshotů", value: stats.screenshots, color: "#88aaff" },
            { label: "Videí", value: stats.videos, color: "#ff4466" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "16px 18px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: s.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#556",
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginTop: "4px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {["Vše", "Hrajeme", "Pauza", "Dohráno"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px",
                background: filter === f ? "rgba(0,255,136,0.12)" : "transparent",
                border: `1px solid ${filter === f ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "20px",
                color: filter === f ? "#00ff88" : "#667",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredGames.map((game, i) => (
            <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} index={i} />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#445",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎮</div>
            <div style={{ fontSize: "14px" }}>Žádné hry nenalezeny</div>
          </div>
        )}

        {/* Footer info */}
        <div
          style={{
            marginTop: "48px",
            padding: "16px",
            textAlign: "center",
            color: "#334",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.5px",
          }}
        >
          GAMING HUB • FIREBASE READY • DEPLOY → GITHUB PAGES
        </div>
      </main>

      {/* Modals */}
      {selectedGame && <GameDetail game={selectedGame} onClose={() => setSelectedGame(null)} />}
      {showAdd && (
        <AddGameModal
          onClose={() => setShowAdd(false)}
          onAdd={(game) => setGames((prev) => [game, ...prev])}
        />
      )}
    </div>
  );
}
