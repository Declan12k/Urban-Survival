// Lobby.jsx - Lobby screen with fixed unique keys
// Place in: client/src/components/Lobby.jsx

import React from 'react';

function Lobby({ lobby, playerId, onLeave, onSetReady, onStartGame }) {
  if (!lobby) {
    return (
      <div className="lobby-container">
        <div className="menu-title">Loading...</div>
      </div>
    );
  }

  const currentPlayer = lobby.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  const isReady = currentPlayer?.ready || false;
  
  // Check if all non-host players are ready
  const allReady = lobby.players.every(p => p.isHost || p.ready);
  const canStart = isHost && allReady && lobby.players.length >= 1;

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <div>
          <h2 style={{ margin: 0, color: '#ff4a4a' }}>Game Lobby</h2>
          <p style={{ margin: '5px 0 0', color: '#888' }}>Waiting for players...</p>
        </div>
        <div className="lobby-code">
          Code: {lobby.id}
        </div>
      </div>

      <div className="lobby-players">
        <h3 style={{ marginBottom: '15px', color: '#888' }}>
          Players ({lobby.players.length}/{lobby.maxPlayers})
        </h3>
        
        {lobby.players.map((player, index) => (
          <div 
            key={`${player.id}-${index}`}  // Use combination for unique key
            className={`player-card ${player.ready ? 'ready' : ''} ${player.isHost ? 'host' : ''}`}
          >
            <div>
              <span className="player-name">{player.name}</span>
              {player.id === playerId && (
                <span style={{ color: '#888', marginLeft: '8px' }}>(You)</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {player.isHost && (
                <span style={{ 
                  background: '#ffd700', 
                  color: '#000', 
                  padding: '3px 8px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  HOST
                </span>
              )}
              <span className={`player-status ${player.ready ? 'ready' : ''}`}>
                {player.isHost ? '👑' : player.ready ? '✓ Ready' : 'Not Ready'}
              </span>
            </div>
          </div>
        ))}

        {lobby.players.length < lobby.maxPlayers && (
          <div className="player-card" style={{ opacity: 0.3, border: '2px dashed #444' }}>
            <span style={{ color: '#666' }}>Waiting for player...</span>
          </div>
        )}
      </div>

      <div className="lobby-actions">
        <button 
          className="menu-button secondary" 
          onClick={onLeave}
        >
          Leave Lobby
        </button>

        {!isHost && (
          <button 
            className={`menu-button ${isReady ? 'secondary' : 'primary'}`}
            onClick={() => onSetReady(!isReady)}
          >
            {isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>
        )}

        {isHost && (
          <button 
            className={`menu-button primary ${!canStart ? 'disabled' : ''}`}
            onClick={onStartGame}
            disabled={!canStart}
            style={!canStart ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {lobby.players.length === 1 
              ? 'Start Solo' 
              : allReady 
                ? 'Start Game' 
                : 'Waiting for Ready...'}
          </button>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        Share the lobby code with friends to play together!
      </div>
    </div>
  );
}

export default Lobby;
