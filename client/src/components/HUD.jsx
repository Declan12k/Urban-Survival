// HUD.jsx - Optimized HUD component
// Place in: client/src/components/HUD.jsx

import React from 'react';

const WEAPON_ICONS = { knife: '🗡️', bat: '🏏', pipe: '🔧', pistol: '🔫', shotgun: '💥', smg: '⚡', rifle: '🎯' };

function HUD({ 
  player, allPlayers = [], level, levelName, playerId,
  showLevelUp, notifications = [], killFeed = [], damageIndicators = [],
  showPerkSelection, perkChoices = [], onSelectPerk, selectedPerks = [],
  weapons = ['knife', null], activeSlot = 0, isDowned, reviveProgress,
  minimapData, playerPosition, playerYaw, radarRange = 30
}) {
  if (!player) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {/* Damage Indicators */}
      {damageIndicators.map(d => <DamageVignette key={d.id} angle={d.angle} />)}

      {/* Stats Panel */}
      <div style={styles.statsPanel}>
        <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: 10, borderBottom: '1px solid #333', paddingBottom: 8 }}>
          Level {level}: {levelName}
        </div>
        <StatBar label="❤️ HP" value={player.health} max={player.maxHealth || 100} color="#f44" />
        <StatBar label="🍞 Food" value={player.hunger} max={100} color="#fa4" />
        <StatBar label="🔥 Warm" value={player.warmth} max={100} color="#f84" />
        <StatBar label="⚡ Stam" value={player.energy} max={100} color="#4af" />
        <div style={{ marginTop: 10, borderTop: '1px solid #333', paddingTop: 8, fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>🔫 Ammo:</span>
            <span style={{ color: player.ammo < 5 ? '#f44' : '#fff' }}>{player.ammo}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ color: '#888' }}>💀 Kills:</span>
            <span style={{ color: '#f66' }}>{player.kills}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ color: '#888' }}>🏆 Score:</span>
            <span style={{ color: '#ffd700' }}>{player.score}</span>
          </div>
        </div>
        {selectedPerks.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {selectedPerks.map((p, i) => (
              <span key={i} title={p.name} style={{ fontSize: '1rem', background: 'rgba(255,215,0,0.2)', borderRadius: 4, padding: '2px 4px' }}>{p.icon}</span>
            ))}
          </div>
        )}
      </div>

      {/* Weapons */}
      <div style={styles.weaponsBar}>
        {weapons.map((w, i) => (
          <div key={i} style={{
            border: `2px solid ${activeSlot === i ? '#ffd700' : '#444'}`,
            background: activeSlot === i ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.8)',
            borderRadius: 8, padding: '8px 12px', minWidth: 80, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
            opacity: w ? 1 : 0.4
          }}>
            <span style={{ position: 'absolute', top: -8, left: 5, background: '#333', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem' }}>{i + 1}</span>
            {w ? (
              <>
                <span style={{ fontSize: '1.3rem' }}>{WEAPON_ICONS[w] || '?'}</span>
                <span style={{ fontSize: '0.65rem', color: '#aaa', marginTop: 2 }}>{w.toUpperCase()}</span>
              </>
            ) : (
              <span style={{ color: '#555', fontSize: '0.7rem' }}>Empty</span>
            )}
          </div>
        ))}
      </div>

      {/* Players */}
      <div style={styles.playersPanel}>
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 6, fontWeight: 'bold' }}>SQUAD</div>
        {allPlayers.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.8rem',
            opacity: p.alive ? 1 : 0.4, textDecoration: !p.alive ? 'line-through' : 'none',
            color: p.isDowned ? '#f80' : 'white'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: `#${(p.color || 0x4a9eff).toString(16).padStart(6, '0')}` }} />
            <span style={{ flex: 1 }}>{p.name}{p.id === playerId ? ' (You)' : ''}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.isDowned ? '⬇️' : p.alive ? Math.floor(p.health) : '💀'}</span>
          </div>
        ))}
      </div>

      {/* Minimap */}
      <Minimap data={minimapData} playerPosition={playerPosition} playerYaw={playerYaw} radarRange={radarRange} />

      {/* Kill Feed */}
      <div style={styles.killFeed}>
        {killFeed.map(k => (
          <div key={k.id} style={{
            padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', display: 'flex', alignItems: 'center',
            background: k.isHeadshot ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.7)',
            borderLeft: k.isHeadshot ? '2px solid #ffd700' : 'none'
          }}>
            <span style={{ color: '#4af' }}>{k.killer}</span>
            <span style={{ fontSize: '0.9rem', margin: '0 4px' }}>{WEAPON_ICONS[k.weapon] || '💀'}</span>
            <span style={{ color: '#f66' }}>{k.victim}</span>
            {k.isHeadshot && <span style={{ marginLeft: 4 }}>🎯</span>}
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div style={styles.notifications}>
        {notifications.map(n => (
          <div key={n.id} style={{
            padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center',
            borderLeft: `3px solid ${n.type === 'headshot' ? '#f44' : n.type === 'perk' ? '#ffd700' : n.type === 'danger' ? '#f00' : n.type === 'success' ? '#4f4' : '#4af'}`,
            background: n.type === 'headshot' ? 'rgba(255,50,50,0.2)' : 'rgba(0,0,0,0.85)'
          }}>
            {n.icon && <span style={{ fontSize: '1rem', marginRight: 6 }}>{n.icon}</span>}
            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      <div style={styles.warnings}>
        {player.hunger < 30 && <Warning text="⚠️ STARVING" color="#fa4" />}
        {player.warmth < 30 && <Warning text="❄️ FREEZING" color="#4af" />}
        {player.energy < 20 && <Warning text="😴 EXHAUSTED" color="#a4f" />}
        {player.health < 25 && <Warning text="💔 CRITICAL" color="#f44" />}
      </div>

      {/* Downed Overlay */}
      {isDowned && (
        <div style={styles.downedOverlay}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f00', textShadow: '0 0 20px rgba(255,0,0,0.8)' }}>YOU ARE DOWN</div>
          <div style={{ marginTop: 15, color: '#fff' }}>Crawl to safety! Waiting for revive...</div>
        </div>
      )}

      {/* Revive Progress */}
      {reviveProgress > 0 && !isDowned && (
        <div style={styles.reviveProgress}>
          <div style={{ color: '#4f4', marginBottom: 8 }}>REVIVING...</div>
          <div style={{ width: 200, height: 10, background: '#333', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${reviveProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #4f4, #6f6)' }} />
          </div>
        </div>
      )}

      {/* Level Up */}
      {showLevelUp && (
        <div style={styles.levelUp}>
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#ffd700', textShadow: '0 0 30px rgba(255,215,0,0.8)' }}>LEVEL {level}</div>
          <div style={{ fontSize: '1.4rem', color: 'white', marginTop: 10 }}>{levelName}</div>
        </div>
      )}

      {/* Perk selection is handled by Game.jsx for keyboard support */}
    </div>
  );
}

function StatBar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
      <span style={{ color: '#888', minWidth: 55, fontSize: '0.8rem' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ minWidth: 24, textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem', color: pct < 25 ? '#f44' : pct < 50 ? '#fa4' : '#4f4' }}>
        {Math.floor(value)}
      </span>
    </div>
  );
}

function Warning({ text, color }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.8)', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 'bold', color, border: `1px solid ${color}`, animation: 'pulse 1s infinite' }}>
      {text}
    </div>
  );
}

function DamageVignette({ angle }) {
  const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dirs = [];
  if (norm > Math.PI * 1.5 || norm < Math.PI * 0.5) dirs.push('top');
  if (norm > Math.PI * 0.5 && norm < Math.PI * 1.5) dirs.push('bottom');
  if (norm > 0 && norm < Math.PI) dirs.push('right');
  if (norm > Math.PI) dirs.push('left');
  
  return (
    <>
      {dirs.includes('top') && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(255,0,0,0.5), transparent)', animation: 'damageFlash 0.3s forwards' }} />}
      {dirs.includes('bottom') && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(255,0,0,0.5), transparent)', animation: 'damageFlash 0.3s forwards' }} />}
      {dirs.includes('left') && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: 'linear-gradient(to right, rgba(255,0,0,0.5), transparent)', animation: 'damageFlash 0.3s forwards' }} />}
      {dirs.includes('right') && <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, background: 'linear-gradient(to left, rgba(255,0,0,0.5), transparent)', animation: 'damageFlash 0.3s forwards' }} />}
    </>
  );
}

function Minimap({ data, playerPosition, playerYaw, radarRange }) {
  const size = 130;
  const scale = size / (radarRange * 2);
  
  const transform = (x, z) => {
    if (!playerPosition) return { x: size / 2, y: size / 2 };
    const relX = x - playerPosition.x;
    const relZ = z - playerPosition.z;
    const cos = Math.cos(-(playerYaw || 0));
    const sin = Math.sin(-(playerYaw || 0));
    return { x: size / 2 + (relX * cos - relZ * sin) * scale, y: size / 2 + (relX * sin + relZ * cos) * scale };
  };
  
  const inRange = (x, z) => playerPosition && Math.sqrt(Math.pow(x - playerPosition.x, 2) + Math.pow(z - playerPosition.z, 2)) <= radarRange;

  return (
    <div style={{ position: 'absolute', bottom: 15, left: 15, width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '2px solid #333' }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={size/2 - 1} fill="rgba(0,0,0,0.75)" />
        <line x1={size/2} y1={0} x2={size/2} y2={size} stroke="#222" />
        <line x1={0} y1={size/2} x2={size} y2={size/2} stroke="#222" />
        <circle cx={size/2} cy={size/2} r={size/4} fill="none" stroke="#222" />
        
        {data?.pings?.filter(p => inRange(p.x, p.z)).map((p, i) => {
          const pos = transform(p.x, p.z);
          return <circle key={`ping-${i}`} cx={pos.x} cy={pos.y} r={5} fill="none" stroke="#ff0" strokeWidth="2" />;
        })}
        
        {data?.pickups?.filter(p => inRange(p.x, p.z)).map((p, i) => {
          const pos = transform(p.x, p.z);
          return <rect key={`p-${i}`} x={pos.x - 2} y={pos.y - 2} width={4} height={4} fill="#4a9" />;
        })}
        
        {data?.enemies?.filter(e => inRange(e.x, e.z)).map((e, i) => {
          const pos = transform(e.x, e.z);
          const color = e.type === 'boss' ? '#ff0' : e.type === 'brute' ? '#f60' : e.type === 'runner' ? '#f0f' : '#f44';
          return <circle key={`e-${i}`} cx={pos.x} cy={pos.y} r={e.type === 'boss' ? 5 : 3} fill={color} />;
        })}
        
        {data?.players?.filter(p => inRange(p.x, p.z)).map((p, i) => {
          const pos = transform(p.x, p.z);
          return <circle key={`pl-${i}`} cx={pos.x} cy={pos.y} r={4} fill={p.isDowned ? '#f80' : `#${(p.color || 0x4a9eff).toString(16).padStart(6, '0')}`} stroke={!p.alive ? '#f00' : 'none'} strokeWidth="2" />;
        })}
        
        <polygon points={`${size/2},${size/2 - 6} ${size/2 - 4},${size/2 + 3} ${size/2 + 4},${size/2 + 3}`} fill="#4af" stroke="#fff" strokeWidth="1" />
      </svg>
      <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', color: '#f44', fontWeight: 'bold', fontSize: '0.65rem', textShadow: '0 0 3px black' }}>N</div>
    </div>
  );
}

const styles = {
  statsPanel: { position: 'absolute', top: 15, left: 15, background: 'rgba(0,0,0,0.85)', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.85rem', minWidth: 180, border: '1px solid rgba(255,255,255,0.1)' },
  weaponsBar: { position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 },
  playersPanel: { position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.85)', padding: 12, borderRadius: 8, minWidth: 140, border: '1px solid rgba(255,255,255,0.1)' },
  killFeed: { position: 'absolute', top: 140, right: 15, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 200 },
  notifications: { position: 'absolute', top: 80, right: 170, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  warnings: { position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' },
  downedOverlay: { position: 'absolute', inset: 0, background: 'rgba(100,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  reviveProgress: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', background: 'rgba(0,0,0,0.85)', padding: '18px 30px', borderRadius: 10 },
  levelUp: { position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  perkOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  perkCard: { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '2px solid #444', borderRadius: 12, padding: '18px 15px', width: 150, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }
};

// Inject CSS animations
if (typeof document !== 'undefined' && !document.getElementById('hud-styles')) {
  const style = document.createElement('style');
  style.id = 'hud-styles';
  style.textContent = `
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes damageFlash { 0% { opacity: 0.6; } 100% { opacity: 0; } }
  `;
  document.head.appendChild(style);
}

export default HUD;
