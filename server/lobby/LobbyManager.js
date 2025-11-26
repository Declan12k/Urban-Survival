// LobbyManager.js - Lobby system with all required methods
// Place in: server/lobby/LobbyManager.js

const { v4: uuidv4 } = require('uuid');

class LobbyManager {
  constructor() {
    this.lobbies = new Map();
  }

  createLobby(hostId, hostName) {
    const id = uuidv4().substring(0, 8).toUpperCase();
    const lobby = {
      id,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        ready: false,
        isHost: true
      }],
      maxPlayers: 4,
      status: 'waiting',
      createdAt: Date.now()
    };
    
    this.lobbies.set(id, lobby);
    return lobby;
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  getPublicLobbies() {
    return Array.from(this.lobbies.values())
      .filter(lobby => lobby.status === 'waiting' && lobby.players.length < lobby.maxPlayers)
      .map(lobby => ({
        id: lobby.id,
        hostName: lobby.players.find(p => p.isHost)?.name || 'Unknown',
        playerCount: lobby.players.length,
        maxPlayers: lobby.maxPlayers
      }));
  }

  joinLobby(lobbyId, playerId, playerName) {
    const lobby = this.lobbies.get(lobbyId);
    
    if (!lobby) {
      return { success: false, error: 'Lobby not found' };
    }
    
    if (lobby.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }
    
    if (lobby.players.length >= lobby.maxPlayers) {
      return { success: false, error: 'Lobby is full' };
    }
    
    // Check if player is already in lobby (prevent duplicates)
    if (lobby.players.find(p => p.id === playerId)) {
      return { success: true, lobby }; // Already in lobby, just return success
    }
    
    lobby.players.push({
      id: playerId,
      name: playerName,
      ready: false,
      isHost: false
    });
    
    return { success: true, lobby };
  }

  leaveLobby(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;
    
    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return lobby;
    
    const wasHost = lobby.players[playerIndex].isHost;
    lobby.players.splice(playerIndex, 1);
    
    // Delete lobby if empty
    if (lobby.players.length === 0) {
      this.lobbies.delete(lobbyId);
      return null;
    }
    
    // Transfer host if host left
    if (wasHost && lobby.players.length > 0) {
      lobby.players[0].isHost = true;
      lobby.hostId = lobby.players[0].id;
    }
    
    return lobby;
  }

  setReady(lobbyId, playerId, ready) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;
    
    const player = lobby.players.find(p => p.id === playerId);
    if (player) {
      player.ready = ready;
    }
    
    return lobby;
  }

  deleteLobby(lobbyId) {
    this.lobbies.delete(lobbyId);
  }

  // Find which lobby a player is in
  findPlayerLobby(playerId) {
    for (const lobby of this.lobbies.values()) {
      if (lobby.players.find(p => p.id === playerId)) {
        return lobby;
      }
    }
    return null;
  }

  // Remove player from all lobbies (cleanup on disconnect)
  removePlayerFromAllLobbies(playerId) {
    for (const [lobbyId, lobby] of this.lobbies) {
      const playerIndex = lobby.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        this.leaveLobby(lobbyId, playerId);
        return lobbyId;
      }
    }
    return null;
  }
}

module.exports = LobbyManager;
