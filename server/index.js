// index.js - Express + Socket.IO server with all game events
// Place in: server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const LobbyManager = require('./lobby/LobbyManager');
const GameState = require('./game/GameState');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const lobbyManager = new LobbyManager();
const games = new Map();

// Game loop interval references
const gameLoops = new Map();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // ============================================
  // LOBBY EVENTS
  // ============================================

  socket.on('getLobbies', (callback) => {
    callback(lobbyManager.getPublicLobbies());
  });

  socket.on('createLobby', (playerName, callback) => {
    const lobby = lobbyManager.createLobby(socket.id, playerName);
    socket.join(lobby.id);
    callback(lobby);
    io.emit('lobbiesUpdated', lobbyManager.getPublicLobbies());
  });

  socket.on('joinLobby', ({ lobbyId, playerName }, callback) => {
    const result = lobbyManager.joinLobby(lobbyId, socket.id, playerName);
    if (result.success) {
      socket.join(lobbyId);
      io.to(lobbyId).emit('lobbyUpdated', result.lobby);
      io.emit('lobbiesUpdated', lobbyManager.getPublicLobbies());
    }
    callback(result);
  });

  socket.on('leaveLobby', (lobbyId) => {
    const lobby = lobbyManager.leaveLobby(lobbyId, socket.id);
    socket.leave(lobbyId);
    if (lobby) {
      io.to(lobbyId).emit('lobbyUpdated', lobby);
    }
    io.emit('lobbiesUpdated', lobbyManager.getPublicLobbies());
  });

  socket.on('setReady', ({ lobbyId, ready }) => {
    const lobby = lobbyManager.setReady(lobbyId, socket.id, ready);
    if (lobby) {
      io.to(lobbyId).emit('lobbyUpdated', lobby);
    }
  });

  socket.on('startGame', (lobbyId) => {
    const lobby = lobbyManager.getLobby(lobbyId);
    if (!lobby || lobby.hostId !== socket.id) return;
    
    // Check all non-host players are ready
    const allReady = lobby.players.every(p => p.isHost || p.ready);
    if (!allReady) return;

    // Create game state
    const gameId = lobbyId;
    const gameState = new GameState(gameId, lobby.players);
    games.set(gameId, gameState);

    lobby.status = 'playing';
    
    io.to(lobbyId).emit('gameStarted', {
      gameId,
      players: gameState.getPlayersData(),
      worldSeed: gameState.worldSeed,
      level: gameState.level
    });

    io.emit('lobbiesUpdated', lobbyManager.getPublicLobbies());

    // Start game loop (30 tick rate)
    const gameLoop = setInterval(() => {
      const game = games.get(gameId);
      if (!game) {
        clearInterval(gameLoop);
        gameLoops.delete(gameId);
        return;
      }

      game.update();

      // Check for level up
      if (game.checkLevelUp()) {
        io.to(gameId).emit('levelUp', {
          level: game.level,
          levelName: game.getLevelName()
        });
      }

      // Check game over
      const alivePlayers = game.getAlivePlayers();
      if (alivePlayers.length === 0) {
        io.to(gameId).emit('gameOver', {
          reason: 'All players eliminated',
          stats: game.getGameStats()
        });
        clearInterval(gameLoop);
        gameLoops.delete(gameId);
        games.delete(gameId);
        lobbyManager.deleteLobby(gameId);
        return;
      }

      // Broadcast game state
      io.to(gameId).emit('gameState', {
        players: game.getPlayersData(),
        enemies: game.getEnemiesData(),
        pickups: game.getPickupsData(),
        bullets: game.getBulletsData(),
        projectiles: game.getProjectilesData(),
        pings: game.getPingsData(),
        chatMessages: game.getChatMessages(),
        level: game.level,
        totalKills: game.totalKills
      });

    }, 1000 / 30); // 30 FPS

    gameLoops.set(gameId, gameLoop);
  });

  // ============================================
  // GAME INPUT EVENTS
  // ============================================

  socket.on('playerInput', ({ gameId, input }) => {
    const game = games.get(gameId);
    if (!game) return;
    game.handlePlayerInput(socket.id, input);
  });

  socket.on('playerShoot', ({ gameId, position, direction, weapon, damage }) => {
    const game = games.get(gameId);
    if (!game) return;

    const bullet = game.createBullet(socket.id, position, direction, weapon, damage);
    if (bullet) {
      io.to(gameId).emit('bulletCreated', bullet);
    }
  });

  socket.on('meleeAttack', ({ gameId, position, direction, weapon, damage, range }) => {
    const game = games.get(gameId);
    if (!game) return;

    const hits = game.handleMeleeAttack(socket.id, position, direction, weapon, damage, range);
    
    hits.forEach(hit => {
      io.to(gameId).emit('enemyHit', {
        enemyId: hit.enemyId,
        damage: hit.damage,
        isHeadshot: hit.isHeadshot,
        position: hit.position
      });
    });
  });

  socket.on('playerHit', ({ gameId, damage, source }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.getPlayerData(socket.id);
    if (!player) return;

    const result = game.handlePlayerDamage(socket.id, damage, player.position, source);
    
    if (result) {
      if (result.type === 'downed') {
        io.to(gameId).emit('playerDowned', {
          playerId: result.playerId,
          playerName: result.playerName
        });
      } else if (result.type === 'damaged') {
        socket.emit('playerDamaged', {
          playerId: result.playerId,
          damage: result.damage,
          sourcePosition: result.sourcePosition,
          currentHealth: result.currentHealth
        });
      }
    }
  });

  socket.on('revivePlayer', ({ gameId, targetId, reviverId }) => {
    const game = games.get(gameId);
    if (!game) return;

    const result = game.handleRevive(targetId, reviverId);
    if (result) {
      io.to(gameId).emit('playerRevived', result);
    }
  });

  socket.on('pickupCollected', ({ gameId, pickupId, playerId }) => {
    const game = games.get(gameId);
    if (!game) return;

    const result = game.collectPickup(pickupId, playerId);
    if (result) {
      io.to(gameId).emit('pickupCollected', result);
    }
  });

  socket.on('lootContainer', ({ gameId, loot }) => {
    const game = games.get(gameId);
    if (!game) return;

    // Spawn the loot as a pickup near the player
    const player = game.getPlayerData(socket.id);
    if (player) {
      // Apply loot effect directly
      const result = {
        type: loot,
        playerId: socket.id,
        playerName: player.name
      };
      
      // Handle weapon loot
      if (['pistol', 'shotgun', 'smg', 'rifle', 'bat', 'pipe'].includes(loot)) {
        if (!player.weapons[1]) {
          player.weapons[1] = loot;
        } else {
          player.weapons[1] = loot;
        }
        result.effect = { weapon: loot };
      } else {
        // Handle consumable loot
        switch (loot) {
          case 'ammo':
            player.ammo += 15;
            result.effect = { stat: 'ammo', amount: 15 };
            break;
          case 'food':
            player.hunger = Math.min(100, player.hunger + 25);
            result.effect = { stat: 'hunger', amount: 25 };
            break;
          case 'medicine':
            player.health = Math.min(player.maxHealth, player.health + 20);
            result.effect = { stat: 'health', amount: 20 };
            break;
        }
      }
      
      socket.emit('pickupCollected', result);
    }
  });

  socket.on('perkSelected', ({ gameId, playerId, perkId }) => {
    const game = games.get(gameId);
    if (!game) return;

    game.applyPerk(playerId, perkId);
  });

  socket.on('ping', ({ gameId, playerId, position }) => {
    const game = games.get(gameId);
    if (!game) return;

    const ping = game.addPing(playerId, position);
    if (ping) {
      io.to(gameId).emit('ping', ping);
    }
  });

  socket.on('glassBreak', ({ gameId, position }) => {
    const game = games.get(gameId);
    if (!game) return;

    // Alert nearby enemies
    for (const enemy of game.enemies.values()) {
      const dx = enemy.position.x - position.x;
      const dz = enemy.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 15 && !enemy.aggroed) {
        enemy.aggroed = true;
        io.to(gameId).emit('enemyAggro', {
          enemyId: enemy.id,
          type: enemy.type,
          position: enemy.position
        });
      }
    }
  });

  // Chat message handling
  socket.on('chatMessage', ({ gameId, message }) => {
    const game = games.get(gameId);
    if (!game) return;

    const chatMsg = game.addChatMessage(socket.id, message);
    if (chatMsg) {
      io.to(gameId).emit('chatMessage', chatMsg);
    }
  });

  // ============================================
  // DISCONNECT
  // ============================================

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from any lobby
    const lobby = lobbyManager.findPlayerLobby(socket.id);
    if (lobby) {
      const updatedLobby = lobbyManager.leaveLobby(lobby.id, socket.id);
      if (updatedLobby) {
        io.to(lobby.id).emit('lobbyUpdated', updatedLobby);
      }
      io.emit('lobbiesUpdated', lobbyManager.getPublicLobbies());
    }

    // Remove from any game
    for (const [gameId, game] of games) {
      if (game.hasPlayer(socket.id)) {
        game.removePlayer(socket.id);
        io.to(gameId).emit('playerLeft', socket.id);

        // End game if no players left
        if (game.getPlayerCount() === 0) {
          const gameLoop = gameLoops.get(gameId);
          if (gameLoop) {
            clearInterval(gameLoop);
            gameLoops.delete(gameId);
          }
          games.delete(gameId);
          lobbyManager.deleteLobby(gameId);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local network access: http://YOUR_LOCAL_IP:${PORT}`);
});
