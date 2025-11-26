// MainMenu.jsx - Main menu with lobby browser
// Place in: client/src/components/MainMenu.jsx

import React, { useState } from 'react';

function MainMenu({ playerName, setPlayerName, lobbies, onCreateLobby, onJoinLobby, connected }) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinByCode = () => {
    if (joinCode.trim()) {
      onJoinLobby(joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinInput(false);
    }
  };

  return (
    <div className="main-menu">
      <h1 className="menu-title">URBAN SURVIVAL</h1>
      <p className="menu-subtitle">Cooperative Multiplayer Survival</p>

      {!connected && (
        <div style={{ 
          background: '#ff4a4a22', 
          border: '1px solid #ff4a4a',
          borderRadius: '8px',
          padding: '10px 20px',
          marginBottom: '20px',
          color: '#ff4a4a'
        }}>
          ⚠️ Connecting to server...
        </div>
      )}

      <input
        type="text"
        className="menu-input"
        placeholder="Enter your name..."
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        maxLength={20}
      />

      <button 
        className="menu-button primary"
        onClick={onCreateLobby}
        disabled={!playerName.trim() || !connected}
        style={!playerName.trim() || !connected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
      >
        Create Lobby
      </button>

      {showJoinInput ? (
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '300px', marginTop: '10px' }}>
          <input
            type="text"
            className="menu-input"
            placeholder="Enter code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={8}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <button 
            className="menu-button primary"
            onClick={handleJoinByCode}
            disabled={!joinCode.trim() || !playerName.trim()}
            style={{ flex: 0, minWidth: '80px' }}
          >
            Join
          </button>
          <button 
            className="menu-button secondary"
            onClick={() => setShowJoinInput(false)}
            style={{ flex: 0, minWidth: '80px' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button 
          className="menu-button secondary"
          onClick={() => setShowJoinInput(true)}
          disabled={!playerName.trim() || !connected}
          style={!playerName.trim() || !connected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          Join by Code
        </button>
      )}

      {lobbies.length > 0 && (
        <div className="lobby-browser">
          <div className="lobby-browser-title">Available Lobbies</div>
          {lobbies.map((lobby) => (
            <div 
              key={lobby.id}
              className="lobby-item"
              onClick={() => playerName.trim() && onJoinLobby(lobby.id)}
              style={!playerName.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{lobby.hostName}'s Lobby</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>Code: {lobby.id}</div>
              </div>
              <div style={{ 
                background: '#333',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}>
                {lobby.playerCount}/{lobby.maxPlayers}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
        <p>🎮 WASD to move • Mouse to aim • Click to attack</p>
        <p>🔫 1/2 to switch weapons • E to interact • Middle-click to ping</p>
      </div>
    </div>
  );
}

export default MainMenu;
