// App.jsx - Main app with fixed lobby flow
// Place in: client/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameOver from './components/GameOver';
import './styles/main.css';

// Connect to server - use same hostname as page, different port for dev
const getServerUrl = () => {
  if (import.meta.env.DEV) {
    // Use the same hostname the page was loaded from, but server port
    return `http://${window.location.hostname}:3001`;
  }
  return window.location.origin;
};

const socket = io(getServerUrl(), {
  transports: ['websocket', 'polling']
});

function App() {
  const [screen, setScreen] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [lobbies, setLobbies] = useState([]);
  const [currentLobby, setCurrentLobby] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('lobbiesUpdated', (updatedLobbies) => {
      setLobbies(updatedLobbies);
    });

    socket.on('lobbyUpdated', (lobby) => {
      setCurrentLobby(lobby);
    });

    socket.on('gameStarted', (data) => {
      setGameData(data);
      setScreen('game');
    });

    socket.on('gameOver', (data) => {
      setGameOverStats(data);
      setScreen('gameover');
    });

    // Get initial lobbies
    socket.emit('getLobbies', (lobbies) => {
      setLobbies(lobbies);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobbiesUpdated');
      socket.off('lobbyUpdated');
      socket.off('gameStarted');
      socket.off('gameOver');
    };
  }, []);

  const handleCreateLobby = useCallback(() => {
    if (!playerName.trim()) return;
    
    socket.emit('createLobby', playerName, (lobby) => {
      setCurrentLobby(lobby);
      setScreen('lobby'); // Immediately switch to lobby screen
    });
  }, [playerName]);

  const handleJoinLobby = useCallback((lobbyId) => {
    if (!playerName.trim()) return;
    
    socket.emit('joinLobby', { lobbyId, playerName }, (result) => {
      if (result.success) {
        setCurrentLobby(result.lobby);
        setScreen('lobby');
      } else {
        alert(result.error || 'Failed to join lobby');
      }
    });
  }, [playerName]);

  const handleLeaveLobby = useCallback(() => {
    if (currentLobby) {
      socket.emit('leaveLobby', currentLobby.id);
      setCurrentLobby(null);
      setScreen('menu');
      
      // Refresh lobby list
      socket.emit('getLobbies', (lobbies) => {
        setLobbies(lobbies);
      });
    }
  }, [currentLobby]);

  const handleSetReady = useCallback((ready) => {
    if (currentLobby) {
      socket.emit('setReady', { lobbyId: currentLobby.id, ready });
    }
  }, [currentLobby]);

  const handleStartGame = useCallback(() => {
    if (currentLobby) {
      socket.emit('startGame', currentLobby.id);
    }
  }, [currentLobby]);

  const handleReturnToMenu = useCallback(() => {
    setGameData(null);
    setGameOverStats(null);
    setCurrentLobby(null);
    setScreen('menu');
    
    // Refresh lobby list
    socket.emit('getLobbies', (lobbies) => {
      setLobbies(lobbies);
    });
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return (
          <MainMenu
            playerName={playerName}
            setPlayerName={setPlayerName}
            lobbies={lobbies}
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            connected={connected}
          />
        );
      
      case 'lobby':
        return (
          <Lobby
            lobby={currentLobby}
            playerId={socket.id}
            onLeave={handleLeaveLobby}
            onSetReady={handleSetReady}
            onStartGame={handleStartGame}
          />
        );
      
      case 'game':
        return (
          <Game
            socket={socket}
            gameData={gameData}
            playerId={socket.id}
            playerName={playerName}
            onQuit={handleReturnToMenu}
          />
        );
      
      case 'gameover':
        return (
          <GameOver
            stats={gameOverStats}
            onReturnToMenu={handleReturnToMenu}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
    </div>
  );
}

export default App;
