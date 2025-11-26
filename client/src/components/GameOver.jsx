// GameOver.jsx - Game over screen with stats
// Place in: client/src/components/GameOver.jsx

import React from 'react';

function GameOver({ stats, onReturnToMenu }) {
  if (!stats) {
    return (
      <div className="game-over">
        <h1 className="game-over-title">GAME OVER</h1>
        <button className="menu-button primary" onClick={onReturnToMenu}>
          Return to Menu
        </button>
      </div>
    );
  }

  const { reason, stats: gameStats } = stats;
  
  // Sort players by score
  const sortedPlayers = [...(gameStats.players || [])].sort((a, b) => b.score - a.score);
  
  // Calculate totals
  const totalKills = sortedPlayers.reduce((sum, p) => sum + p.kills, 0);
  const totalHeadshots = sortedPlayers.reduce((sum, p) => sum + p.headshots, 0);
  const totalDamage = sortedPlayers.reduce((sum, p) => sum + p.damageDealt, 0);
  const totalRevives = sortedPlayers.reduce((sum, p) => sum + p.revives, 0);

  return (
    <div className="game-over">
      <h1 className="game-over-title">GAME OVER</h1>
      
      <p style={{ color: '#888', marginBottom: '20px', fontSize: '1.1rem' }}>
        {reason || 'All players eliminated'}
      </p>

      <div className="game-over-stats">
        <h2 style={{ color: '#ffd700', marginBottom: '20px', textAlign: 'center' }}>
          Level {gameStats.level}: {gameStats.levelName}
        </h2>

        <div className="game-over-stat">
          <span>Total Kills</span>
          <span style={{ color: '#ff6666' }}>{totalKills}</span>
        </div>
        
        <div className="game-over-stat">
          <span>Headshots</span>
          <span style={{ color: '#ffd700' }}>🎯 {totalHeadshots}</span>
        </div>
        
        <div className="game-over-stat">
          <span>Total Damage</span>
          <span style={{ color: '#ff9944' }}>{totalDamage}</span>
        </div>
        
        <div className="game-over-stat">
          <span>Revives</span>
          <span style={{ color: '#44ff44' }}>⚕️ {totalRevives}</span>
        </div>

        <h3 style={{ marginTop: '25px', marginBottom: '15px', color: '#888' }}>
          Player Stats
        </h3>

        {sortedPlayers.map((player, index) => (
          <div key={index} className="game-over-player">
            <div className="game-over-player-name">
              {index === 0 && '🏆 '}
              {player.name}
              {!player.alive && ' 💀'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#888' }}>Score: </span>
                <span style={{ color: '#ffd700' }}>{player.score}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Kills: </span>
                <span style={{ color: '#ff6666' }}>{player.kills}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Headshots: </span>
                <span style={{ color: '#ffd700' }}>{player.headshots}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Revives: </span>
                <span style={{ color: '#44ff44' }}>{player.revives}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="menu-button primary" 
        onClick={onReturnToMenu}
        style={{ marginTop: '20px' }}
      >
        Return to Menu
      </button>
    </div>
  );
}

export default GameOver;
