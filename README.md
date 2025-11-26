# Urban Survival - Cooperative Multiplayer

A cooperative multiplayer survival game where players work together to survive in a harsh urban environment. Built with Node.js, Socket.IO, React (Vite), and Three.js.

## Features

- **Lobby-based Multiplayer**: Create or join game lobbies with up to 4 players
- **Real-time Synchronization**: All game state is synchronized across players
- **Cooperative Gameplay**: Work together to survive and progress through levels
- **6 Progressive Levels**: From Skid Row to The Depths, each more challenging
- **Survival Mechanics**: Manage health, hunger, warmth, and energy
- **Procedurally Generated World**: Buildings, shelters, and debris generated from seed
- **Multiple Enemy Types**: 6 different homeless character models

## Requirements

- Node.js 18+ 
- npm 9+

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the server and client together (development):**
   ```bash
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Server (port 3001)
   npm run server

   # Terminal 2 - Client (port 3000)
   npm run client
   ```

3. **Open your browser:**
   - http://localhost:3000

## Network Play (LAN)

The server binds to `0.0.0.0`, allowing connections from other devices on your local network.

1. Find your local IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Share your IP with other players:
   ```
   http://YOUR_LOCAL_IP:3000
   ```

3. Make sure your firewall allows connections on ports 3000 and 3001

## Production Build

1. Build the client:
   ```bash
   npm run build
   ```

2. Start the server (will serve the built client):
   ```bash
   npm start
   ```

3. Access at http://localhost:3001

## Controls

### PC
- **WASD** - Move
- **Mouse** - Look around
- **Left Click** - Shoot (also locks cursor)
- **Right Click + Drag** - Alternative look (when pointer lock doesn't work)
- **Shift** - Sprint (uses energy)

### Mobile
- **Left side of screen** - Virtual joystick for movement
- **Right side of screen** - Swipe to look, tap to shoot

## Game Mechanics

### Survival Stats
- **Health**: Take damage from enemies, restored by medicine
- **Hunger**: Decreases over time, restored by food/water
- **Warmth**: Decreases over time, restored by blankets
- **Energy**: Used for sprinting, recovers when standing still

### Pickups
- 🟤 **Food** - Restores hunger
- 🟢 **Medicine** - Restores health
- 🟡 **Ammo** - Adds ammunition
- 🟣 **Blanket** - Restores warmth
- 🔵 **Water** - Restores hunger and energy

### Levels
1. **Skid Row** - 10 kills to advance
2. **The Tunnels** - 20 kills to advance
3. **Industrial Wasteland** - 35 kills to advance
4. **The Camps** - 55 kills to advance
5. **Downtown Ruins** - 80 kills to advance
6. **The Depths** - Final level

## Project Structure

```
urban-survival-multiplayer/
├── package.json           # Root package with scripts
├── server/
│   ├── index.js          # Express + Socket.IO server
│   ├── lobby/
│   │   └── LobbyManager.js
│   └── game/
│       └── GameState.js  # Server-side game logic
└── client/
    ├── package.json      # Vite + React dependencies
    ├── vite.config.js    # Vite configuration
    ├── index.html        # Entry HTML
    └── src/
        ├── index.jsx
        ├── App.jsx       # Main app with socket connection
        ├── components/
        │   ├── MainMenu.jsx
        │   ├── Lobby.jsx
        │   ├── Game.jsx  # Three.js game renderer
        │   ├── HUD.jsx
        │   ├── Crosshair.jsx
        │   └── GameOver.jsx
        └── styles/
            └── main.css
```

## Troubleshooting

### Pointer Lock Not Working
Some browsers or environments (like iframes) restrict pointer lock. The game includes a fallback: right-click and drag to look around.

### Can't Connect from Other Devices
1. Check your firewall settings
2. Ensure you're using the correct local IP
3. Make sure all devices are on the same network

### High Latency
The game uses client-side prediction for smooth movement. If you experience issues:
1. Check your network connection
2. Reduce the number of players
3. Close other bandwidth-intensive applications

## License

MIT
