// GameState.js - Server-side game logic with all features
// Place in: server/game/GameState.js

const { v4: uuidv4 } = require('uuid');

// Name generation data
const FIRST_NAMES_MALE = [
  'Thomas', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Charles', 'Daniel',
  'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin',
  'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
  'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
  'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron',
  'Jose', 'Adam', 'Nathan', 'Henry', 'Douglas', 'Zachary', 'Peter', 'Kyle', 'Noah', 'Ethan'
];

const FIRST_NAMES_FEMALE = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
  'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
  'Diane', 'Ruth', 'Julie', 'Olivia', 'Joyce', 'Virginia', 'Victoria', 'Kelly', 'Lauren', 'Christina'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
];

const LEVEL_CONFIG = [
  { name: 'Skid Row', maxEnemies: 8, spawnRate: 180, killsToAdvance: 10, isMilestone: false },
  { name: 'The Tunnels', maxEnemies: 12, spawnRate: 150, killsToAdvance: 25, isMilestone: false },
  { name: 'Industrial Wasteland', maxEnemies: 15, spawnRate: 120, killsToAdvance: 45, isMilestone: true },
  { name: 'The Camps', maxEnemies: 18, spawnRate: 100, killsToAdvance: 70, isMilestone: false },
  { name: 'Downtown Ruins', maxEnemies: 22, spawnRate: 80, killsToAdvance: 100, isMilestone: false },
  { name: 'The Depths', maxEnemies: 25, spawnRate: 60, killsToAdvance: 999, isMilestone: true }
];

const ENEMY_TYPES = {
  normal: { 
    health: 30, speed: 0.035, damage: 8, 
    spawnWeight: 50, headMultiplier: 2 
  },
  runner: { 
    health: 15, speed: 0.07, damage: 6, 
    spawnWeight: 25, headMultiplier: 2.5 
  },
  brute: { 
    health: 90, speed: 0.02, damage: 16, 
    spawnWeight: 15, headMultiplier: 1.5 
  },
  thrower: { 
    health: 22, speed: 0.03, damage: 15, 
    spawnWeight: 10, headMultiplier: 2, 
    ranged: true, throwCooldown: 180, throwRange: 20 
  },
  boss: { 
    health: 300, speed: 0.025, damage: 25, 
    spawnWeight: 0, headMultiplier: 1.2, isBoss: true 
  }
};

const PICKUP_TYPES = {
  consumables: ['food', 'medicine', 'ammo', 'blanket', 'water'],
  weapons: ['pistol', 'shotgun', 'smg', 'rifle', 'bat', 'pipe']
};

const WEAPON_STATS = {
  knife: { damage: 35, type: 'melee' },
  bat: { damage: 50, type: 'melee' },
  pipe: { damage: 45, type: 'melee' },
  pistol: { damage: 25, type: 'ranged' },
  shotgun: { damage: 15, type: 'ranged', pellets: 6 },
  smg: { damage: 12, type: 'ranged' },
  rifle: { damage: 45, type: 'ranged' }
};

class GameState {
  constructor(gameId, lobbyPlayers) {
    this.gameId = gameId;
    this.worldSeed = Math.floor(Math.random() * 1000000);
    this.level = 1;
    this.totalKills = 0;
    this.frameCount = 0;
    this.playerCount = lobbyPlayers.length;
    
    // Difficulty scaling based on player count
    this.difficultyMult = 1 + (this.playerCount - 1) * 0.3;
    
    // Initialize players
    this.players = new Map();
    lobbyPlayers.forEach((p, index) => {
      const angle = (index / lobbyPlayers.length) * Math.PI * 2;
      const spawnRadius = 3;
      this.players.set(p.id, {
        id: p.id,
        name: p.name,
        position: {
          x: Math.cos(angle) * spawnRadius,
          y: 1.6,
          z: Math.sin(angle) * spawnRadius
        },
        rotation: { yaw: 0, pitch: 0 },
        health: 100,
        maxHealth: 100,
        hunger: 100,
        warmth: 100,
        energy: 100,
        ammo: 30,
        score: 0,
        kills: 0,
        headshots: 0,
        damageDealt: 0,
        revives: 0,
        alive: true,
        isDowned: false,
        downedTimer: 0,
        weapons: ['knife', null],
        activeSlot: 0,
        perks: [],
        color: this.getPlayerColor(index)
      });
    });
    
    // Initialize enemies
    this.enemies = new Map();
    this.spawnInitialEnemies();
    
    // Initialize pickups
    this.pickups = new Map();
    this.spawnInitialPickups();
    
    // Bullets
    this.bullets = new Map();
    
    // Projectiles (thrown by enemies)
    this.projectiles = new Map();
    
    // Pings
    this.pings = [];
    
    // Boss tracking
    this.bossSpawned = false;
    this.bossKilled = false;
    
    // Chat messages (combat log + player chat)
    this.chatMessages = [];
  }

  // Generate a random identity for an enemy
  generateEnemyIdentity() {
    const isMale = Math.random() > 0.5;
    const firstName = isMale 
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const age = 18 + Math.floor(Math.random() * 55); // 18-72
    const netWorth = Math.round((Math.random() * 10) * 100) / 100; // 0.00 - 10.00
    
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender: isMale ? 'Male' : 'Female',
      age,
      netWorth
    };
  }

  getPlayerColor(index) {
    const colors = [0x4a9eff, 0xff4a4a, 0x4aff4a, 0xffff4a];
    return colors[index % colors.length];
  }

  getLevelConfig() {
    return LEVEL_CONFIG[Math.min(this.level - 1, LEVEL_CONFIG.length - 1)];
  }

  getLevelName() {
    return this.getLevelConfig().name;
  }

  // ============================================
  // SPAWNING
  // ============================================

  spawnInitialEnemies() {
    const config = this.getLevelConfig();
    const initialCount = Math.min(5, Math.floor(config.maxEnemies * this.difficultyMult / 2));
    for (let i = 0; i < initialCount; i++) {
      this.spawnEnemy();
    }
  }

  spawnInitialPickups() {
    // Spawn consumables
    for (let i = 0; i < 8; i++) {
      this.spawnPickup('consumable');
    }
    // Spawn a couple weapons
    for (let i = 0; i < 3; i++) {
      this.spawnPickup('weapon');
    }
  }

  selectEnemyType() {
    const config = this.getLevelConfig();
    
    // Adjust weights based on level
    const weights = { ...ENEMY_TYPES };
    if (this.level < 2) {
      weights.runner.spawnWeight = 0;
      weights.brute.spawnWeight = 0;
      weights.thrower.spawnWeight = 0;
    } else if (this.level < 3) {
      weights.brute.spawnWeight = 5;
      weights.thrower.spawnWeight = 5;
    }
    
    const totalWeight = Object.values(weights).reduce((sum, t) => sum + (t.spawnWeight || 0), 0);
    let random = Math.random() * totalWeight;
    
    for (const [type, data] of Object.entries(weights)) {
      random -= data.spawnWeight || 0;
      if (random <= 0) return type;
    }
    
    return 'normal';
  }

  spawnEnemy(forceType = null) {
    const type = forceType || this.selectEnemyType();
    const typeData = ENEMY_TYPES[type];
    const id = uuidv4();
    
    // Generate identity for this enemy
    const identity = this.generateEnemyIdentity();
    
    // Find spawn position away from players
    let spawnPos;
    let attempts = 0;
    do {
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 25;
      spawnPos = {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist
      };
      attempts++;
    } while (this.isNearPlayer(spawnPos, 15) && attempts < 10);
    
    const scaledHealth = typeData.health * (1 + (this.level - 1) * 0.15);
    
    this.enemies.set(id, {
      id,
      type,
      identity,
      position: { x: spawnPos.x, y: 0, z: spawnPos.z },
      rotation: 0,
      health: scaledHealth,
      maxHealth: scaledHealth,
      speed: typeData.speed * (0.9 + Math.random() * 0.2) * (1 + (this.level - 1) * 0.05),
      damage: typeData.damage * (1 + (this.level - 1) * 0.1),
      headMultiplier: typeData.headMultiplier,
      attackCooldown: 0,
      throwCooldown: typeData.throwCooldown || 0,
      ranged: typeData.ranged || false,
      throwRange: typeData.throwRange || 0,
      isBoss: typeData.isBoss || false,
      aggroed: false,
      targetPlayerId: null
    });
    
    return id;
  }

  spawnBoss() {
    if (this.bossSpawned) return;
    
    const id = this.spawnEnemy('boss');
    this.bossSpawned = true;
    
    return id;
  }

  spawnPickup(category = 'consumable') {
    const id = uuidv4();
    let type;
    
    if (category === 'weapon') {
      // Weapons are rarer, weighted by level
      const weapons = [...PICKUP_TYPES.weapons];
      // Remove rarer weapons early game
      if (this.level < 2) {
        const rareIndex = weapons.indexOf('rifle');
        if (rareIndex > -1) weapons.splice(rareIndex, 1);
      }
      type = weapons[Math.floor(Math.random() * weapons.length)];
    } else {
      type = PICKUP_TYPES.consumables[Math.floor(Math.random() * PICKUP_TYPES.consumables.length)];
    }
    
    this.pickups.set(id, {
      id,
      type,
      position: {
        x: (Math.random() - 0.5) * 100,
        y: 0.5,
        z: (Math.random() - 0.5) * 100
      },
      rotation: 0
    });
    
    return id;
  }

  // ============================================
  // PLAYER ACTIONS
  // ============================================

  handlePlayerInput(playerId, input) {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;
    
    if (input.position) {
      player.position = input.position;
    }
    
    if (input.rotation) {
      player.rotation = input.rotation;
    }
    
    if (input.stats) {
      if (input.stats.energy !== undefined) player.energy = input.stats.energy;
      if (input.stats.warmth !== undefined) player.warmth = input.stats.warmth;
    }
  }

  createBullet(playerId, position, direction, weapon, damage) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    const id = uuidv4();
    const bullet = {
      id,
      ownerId: playerId,
      weapon: weapon || 'pistol',
      damage: damage || WEAPON_STATS[weapon]?.damage || 25,
      position: { ...position },
      velocity: {
        x: direction.x * 1.5,
        y: direction.y * 1.5,
        z: direction.z * 1.5
      },
      createdAt: Date.now()
    };
    
    this.bullets.set(id, bullet);
    return bullet;
  }

  handleMeleeAttack(playerId, position, direction, weapon, damage, range) {
    const player = this.players.get(playerId);
    if (!player) return [];
    
    const hits = [];
    
    for (const [enemyId, enemy] of this.enemies) {
      const dx = enemy.position.x - position.x;
      const dz = enemy.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > range) continue;
      
      // Check if enemy is in front of player (within ~90 degree cone)
      const enemyDir = { x: dx / dist, z: dz / dist };
      const dot = direction.x * enemyDir.x + direction.z * enemyDir.z;
      
      if (dot > 0.3) { // Roughly 70 degree cone
        const actualDamage = damage;
        enemy.health -= actualDamage;
        player.damageDealt += actualDamage;
        
        hits.push({
          enemyId,
          damage: actualDamage,
          isHeadshot: false,
          position: enemy.position
        });
        
        if (enemy.health <= 0) {
          this.handleEnemyDeath(enemyId, playerId, weapon, false);
        }
      }
    }
    
    return hits;
  }

  // ============================================
  // DAMAGE & DEATH
  // ============================================

  handleBulletHit(bulletId, enemyId, isHeadshot = false) {
    const bullet = this.bullets.get(bulletId);
    const enemy = this.enemies.get(enemyId);
    
    if (!bullet || !enemy) return null;
    
    const player = this.players.get(bullet.ownerId);
    
    let damage = bullet.damage;
    if (isHeadshot) {
      damage *= enemy.headMultiplier || 2;
      if (player) {
        player.headshots++;
        // Apply player's headshot perk
        const headshotPerk = player.perks.find(p => p.id === 'headshot_boost');
        if (headshotPerk) {
          damage *= 1.25;
        }
      }
    }
    
    enemy.health -= damage;
    if (player) {
      player.damageDealt += damage;
    }
    
    this.bullets.delete(bulletId);
    
    if (enemy.health <= 0) {
      this.handleEnemyDeath(enemyId, bullet.ownerId, bullet.weapon, isHeadshot);
    }
    
    return {
      damage,
      isHeadshot,
      killed: enemy.health <= 0,
      position: enemy.position
    };
  }

  handleEnemyDeath(enemyId, killerId, weapon, isHeadshot) {
    const enemy = this.enemies.get(enemyId);
    const killer = this.players.get(killerId);
    
    if (!enemy) return;
    
    // Calculate score
    let scoreGain = 15 + this.level * 5;
    if (isHeadshot) scoreGain += 10;
    if (enemy.isBoss) scoreGain += 100;
    
    if (killer) {
      killer.kills++;
      killer.score += scoreGain;
    }
    
    this.totalKills++;
    
    // Generate kill message for combat log
    const identity = enemy.identity || { fullName: 'Unknown', age: '?', netWorth: 0 };
    const killMessage = {
      id: uuidv4(),
      type: 'kill',
      timestamp: Date.now(),
      text: `${identity.fullName}, Age ${identity.age}, net worth $${identity.netWorth.toFixed(2)} - Killed by ${killer?.name || 'Unknown'}${isHeadshot ? ' (HEADSHOT)' : ''}`,
      killer: killer?.name || 'Unknown',
      victim: identity,
      weapon,
      isHeadshot
    };
    this.chatMessages.push(killMessage);
    
    // Keep only last 50 messages
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    
    this.enemies.delete(enemyId);
    
    // Boss kill tracking
    if (enemy.isBoss) {
      this.bossKilled = true;
    }
    
    // Drop loot chance
    if (Math.random() < 0.3) {
      const pickupId = this.spawnPickup(Math.random() < 0.1 ? 'weapon' : 'consumable');
      const pickup = this.pickups.get(pickupId);
      if (pickup) {
        pickup.position.x = enemy.position.x;
        pickup.position.z = enemy.position.z;
      }
    }
    
    return {
      killerName: killer?.name || 'Unknown',
      victimName: enemy.isBoss ? 'BOSS' : identity.fullName,
      victimIdentity: identity,
      weapon,
      isHeadshot,
      score: scoreGain,
      chatMessage: killMessage
    };
  }

  handlePlayerDamage(playerId, damage, sourcePosition, source = 'enemy') {
    const player = this.players.get(playerId);
    if (!player || !player.alive || player.isDowned) return null;
    
    player.health -= damage;
    
    if (player.health <= 0) {
      player.health = 0;
      
      // Check if any teammates alive - if so, go downed state
      const aliveTeammates = Array.from(this.players.values()).filter(
        p => p.id !== playerId && p.alive && !p.isDowned
      );
      
      if (aliveTeammates.length > 0) {
        player.isDowned = true;
        player.downedTimer = 30 * 60; // 30 seconds at 60fps
        return { type: 'downed', playerId, playerName: player.name };
      } else {
        player.alive = false;
        return { type: 'died', playerId, playerName: player.name };
      }
    }
    
    return { 
      type: 'damaged', 
      playerId, 
      damage,
      sourcePosition,
      currentHealth: player.health
    };
  }

  handleRevive(targetId, reviverId) {
    const target = this.players.get(targetId);
    const reviver = this.players.get(reviverId);
    
    if (!target || !reviver || !target.isDowned) return null;
    
    target.isDowned = false;
    target.health = 30; // Revive with 30% health
    target.downedTimer = 0;
    
    reviver.revives++;
    reviver.score += 25;
    
    return {
      playerId: targetId,
      playerName: target.name,
      reviverId,
      reviverName: reviver.name
    };
  }

  // ============================================
  // PICKUPS & PERKS
  // ============================================

  collectPickup(pickupId, playerId) {
    const pickup = this.pickups.get(pickupId);
    const player = this.players.get(playerId);
    
    if (!pickup || !player || !player.alive) return null;
    
    const type = pickup.type;
    let collected = false;
    let effect = {};
    
    // Check if it's a weapon
    if (PICKUP_TYPES.weapons.includes(type)) {
      // Add to empty slot or replace slot 2
      if (!player.weapons[1]) {
        player.weapons[1] = type;
      } else {
        player.weapons[1] = type;
      }
      collected = true;
      effect = { weapon: type };
    } else {
      // Consumable
      const ammoPerkMult = player.perks.find(p => p.id === 'ammo_boost') ? 1.25 : 1;
      
      switch (type) {
        case 'food':
          player.hunger = Math.min(100, player.hunger + 25);
          effect = { stat: 'hunger', amount: 25 };
          break;
        case 'medicine':
          player.health = Math.min(player.maxHealth, player.health + 20);
          effect = { stat: 'health', amount: 20 };
          break;
        case 'ammo':
          const ammoGain = Math.floor(15 * ammoPerkMult);
          player.ammo += ammoGain;
          effect = { stat: 'ammo', amount: ammoGain };
          break;
        case 'blanket':
          player.warmth = Math.min(100, player.warmth + 30);
          effect = { stat: 'warmth', amount: 30 };
          break;
        case 'water':
          player.hunger = Math.min(100, player.hunger + 15);
          player.energy = Math.min(100, player.energy + 20);
          effect = { stat: 'hunger', amount: 15, bonus: { stat: 'energy', amount: 20 } };
          break;
      }
      collected = true;
    }
    
    if (collected) {
      player.score += 5;
      this.pickups.delete(pickupId);
      return { type, playerId, playerName: player.name, effect };
    }
    
    return null;
  }

  applyPerk(playerId, perkId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Find perk definition
    const perkEffects = {
      'health_boost': () => { player.maxHealth += 20; player.health += 20; },
      'speed_boost': () => { /* handled client-side */ },
      'damage_boost': () => { /* handled client-side */ },
      'radar_boost': () => { /* handled client-side */ },
      'ammo_boost': () => { /* handled in pickup collection */ },
      'warmth_boost': () => { /* handled in update */ },
      'hunger_boost': () => { /* handled in update */ },
      'revive_boost': () => { /* handled client-side */ },
      'melee_boost': () => { /* handled client-side */ },
      'headshot_boost': () => { /* handled in bullet hit */ }
    };
    
    if (perkEffects[perkId]) {
      perkEffects[perkId]();
    }
    
    player.perks.push({ id: perkId });
  }

  // ============================================
  // PINGS
  // ============================================

  addPing(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    const ping = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      color: player.color,
      position,
      createdAt: Date.now()
    };
    
    this.pings.push(ping);
    
    // Remove old pings
    this.pings = this.pings.filter(p => Date.now() - p.createdAt < 5000);
    
    return ping;
  }

  // ============================================
  // UPDATE LOOP
  // ============================================

  update() {
    this.frameCount++;
    
    const config = this.getLevelConfig();
    const maxEnemies = Math.floor(config.maxEnemies * this.difficultyMult);
    
    // Spawn enemies
    if (this.frameCount % config.spawnRate === 0 && this.enemies.size < maxEnemies) {
      this.spawnEnemy();
    }
    
    // Spawn boss on milestone levels when enough kills
    if (config.isMilestone && !this.bossSpawned && this.totalKills >= config.killsToAdvance - 5) {
      this.spawnBoss();
    }
    
    // Spawn pickups
    const pickupRate = 200 - this.level * 10;
    if (this.frameCount % pickupRate === 0 && this.pickups.size < 15 + this.playerCount * 2) {
      this.spawnPickup(Math.random() < 0.1 ? 'weapon' : 'consumable');
    }
    
    // Update enemies AI
    this.updateEnemies();
    
    // Update bullets
    this.updateBullets();
    
    // Update projectiles
    this.updateProjectiles();
    
    // Update player survival stats
    this.updatePlayerStats();
    
    // Update downed players
    this.updateDownedPlayers();
    
    // Rotate pickups
    for (const pickup of this.pickups.values()) {
      pickup.rotation += 0.03;
    }
    
    // Clean up old pings
    this.pings = this.pings.filter(p => Date.now() - p.createdAt < 5000);
  }

  updateEnemies() {
    for (const [enemyId, enemy] of this.enemies) {
      // Find nearest alive, non-downed player
      let nearestPlayer = null;
      let nearestDist = Infinity;
      
      for (const player of this.players.values()) {
        if (!player.alive || player.isDowned) continue;
        
        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }
      
      if (!nearestPlayer) continue;
      
      // Aggro check
      if (!enemy.aggroed && nearestDist < 15) {
        enemy.aggroed = true;
        enemy.targetPlayerId = nearestPlayer.id;
        // Return aggro event for sound
      }
      
      const dx = nearestPlayer.position.x - enemy.position.x;
      const dz = nearestPlayer.position.z - enemy.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Ranged enemy behavior (throwers)
      if (enemy.ranged && dist < enemy.throwRange && dist > 5) {
        // Stay at range
        if (dist < 10) {
          enemy.position.x -= (dx / dist) * enemy.speed * 0.5;
          enemy.position.z -= (dz / dist) * enemy.speed * 0.5;
        }
        
        // Throw projectile
        if (enemy.throwCooldown <= 0) {
          this.createProjectile(enemy, nearestPlayer);
          enemy.throwCooldown = ENEMY_TYPES.thrower.throwCooldown;
        }
      } else {
        // Move toward player
        if (dist > 1.5) {
          enemy.position.x += (dx / dist) * enemy.speed;
          enemy.position.z += (dz / dist) * enemy.speed;
        }
      }
      
      enemy.rotation = Math.atan2(dx, dz);
      
      // Melee attack
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown--;
      } else if (dist < 1.8) {
        this.handlePlayerDamage(nearestPlayer.id, enemy.damage, enemy.position, 'enemy');
        enemy.attackCooldown = 60;
      }
      
      if (enemy.throwCooldown > 0) {
        enemy.throwCooldown--;
      }
    }
  }

  createProjectile(enemy, targetPlayer) {
    const id = uuidv4();
    const dx = targetPlayer.position.x - enemy.position.x;
    const dy = 1.5 - 0.5; // Target head height - throw height
    const dz = targetPlayer.position.z - enemy.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // Calculate arc trajectory
    const speed = 0.3;
    const gravity = 0.01;
    
    this.projectiles.set(id, {
      id,
      ownerId: enemy.id,
      position: { 
        x: enemy.position.x, 
        y: 1.5, 
        z: enemy.position.z 
      },
      velocity: {
        x: (dx / dist) * speed,
        y: 0.15 + dy * 0.02, // Arc upward
        z: (dz / dist) * speed
      },
      damage: enemy.damage,
      createdAt: Date.now()
    });
  }

  updateBullets() {
    const bulletsToRemove = [];
    
    for (const [bulletId, bullet] of this.bullets) {
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
      bullet.position.z += bullet.velocity.z;
      
      // Check enemy collision
      for (const [enemyId, enemy] of this.enemies) {
        const dx = bullet.position.x - enemy.position.x;
        const dz = bullet.position.z - enemy.position.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        
        if (distXZ > 1) continue;
        
        // Check headshot (bullet y vs enemy head height)
        const enemyHeight = enemy.isBoss ? 2.2 : 1.2;
        const headY = enemyHeight + 0.15;
        const isHeadshot = Math.abs(bullet.position.y - headY) < 0.3;
        
        const bodyHit = bullet.position.y > 0 && bullet.position.y < enemyHeight + 0.5;
        
        if (isHeadshot || bodyHit) {
          this.handleBulletHit(bulletId, enemyId, isHeadshot);
          bulletsToRemove.push(bulletId);
          break;
        }
      }
      
      // Remove old bullets
      if (Date.now() - bullet.createdAt > 3000) {
        bulletsToRemove.push(bulletId);
      }
    }
    
    bulletsToRemove.forEach(id => this.bullets.delete(id));
  }

  updateProjectiles() {
    const toRemove = [];
    
    for (const [projId, proj] of this.projectiles) {
      // Apply gravity
      proj.velocity.y -= 0.01;
      
      proj.position.x += proj.velocity.x;
      proj.position.y += proj.velocity.y;
      proj.position.z += proj.velocity.z;
      
      // Hit ground
      if (proj.position.y <= 0) {
        toRemove.push(projId);
        continue;
      }
      
      // Check player collision
      for (const player of this.players.values()) {
        if (!player.alive || player.isDowned) continue;
        
        const dx = proj.position.x - player.position.x;
        const dy = proj.position.y - player.position.y;
        const dz = proj.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 1) {
          this.handlePlayerDamage(player.id, proj.damage, proj.position, 'projectile');
          toRemove.push(projId);
          break;
        }
      }
      
      // Timeout
      if (Date.now() - proj.createdAt > 5000) {
        toRemove.push(projId);
      }
    }
    
    toRemove.forEach(id => this.projectiles.delete(id));
  }

  updatePlayerStats() {
    for (const player of this.players.values()) {
      if (!player.alive) continue;
      
      // Hunger decay
      const hungerPerk = player.perks.find(p => p.id === 'hunger_boost');
      const hungerRate = hungerPerk ? 150 : 120;
      if (this.frameCount % hungerRate === 0) {
        player.hunger = Math.max(0, player.hunger - 1);
        if (player.hunger <= 0 && !player.isDowned) {
          const result = this.handlePlayerDamage(player.id, 2, player.position, 'starvation');
        }
      }
      
      // Warmth decay
      const warmthPerk = player.perks.find(p => p.id === 'warmth_boost');
      const warmthRate = warmthPerk ? 140 : 100;
      if (this.frameCount % warmthRate === 0) {
        player.warmth = Math.max(0, player.warmth - 1);
        if (player.warmth <= 20 && !player.isDowned) {
          this.handlePlayerDamage(player.id, 1, player.position, 'cold');
        }
      }
      
      // Energy recovery
      if (this.frameCount % 60 === 0) {
        player.energy = Math.min(100, player.energy + 0.5);
      }
    }
  }

  updateDownedPlayers() {
    for (const player of this.players.values()) {
      if (!player.isDowned) continue;
      
      player.downedTimer--;
      
      if (player.downedTimer <= 0) {
        player.alive = false;
        player.isDowned = false;
        // Player bled out
      }
    }
  }

  // ============================================
  // LEVEL PROGRESSION
  // ============================================

  checkLevelUp() {
    const config = this.getLevelConfig();
    
    // Milestone levels require boss kill
    if (config.isMilestone) {
      if (this.bossKilled && this.totalKills >= config.killsToAdvance) {
        return this.advanceLevel();
      }
    } else if (this.totalKills >= config.killsToAdvance && this.level < LEVEL_CONFIG.length) {
      return this.advanceLevel();
    }
    
    return false;
  }

  advanceLevel() {
    this.level++;
    this.bossSpawned = false;
    this.bossKilled = false;
    return true;
  }

  // ============================================
  // UTILITY
  // ============================================

  isNearPlayer(pos, minDist) {
    for (const player of this.players.values()) {
      if (!player.alive) continue;
      const dx = player.position.x - pos.x;
      const dz = player.position.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < minDist) {
        return true;
      }
    }
    return false;
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  getAlivePlayers() {
    return Array.from(this.players.values()).filter(p => p.alive);
  }

  getPlayersData() {
    return Array.from(this.players.values());
  }

  getPlayerData(playerId) {
    return this.players.get(playerId);
  }

  getEnemiesData() {
    return Array.from(this.enemies.values());
  }

  getPickupsData() {
    return Array.from(this.pickups.values());
  }

  getBulletsData() {
    return Array.from(this.bullets.values());
  }

  getProjectilesData() {
    return Array.from(this.projectiles.values());
  }

  getPingsData() {
    return this.pings;
  }

  getGameStats() {
    return {
      level: this.level,
      levelName: this.getLevelName(),
      totalKills: this.totalKills,
      players: Array.from(this.players.values()).map(p => ({
        name: p.name,
        score: p.score,
        kills: p.kills,
        headshots: p.headshots,
        damageDealt: Math.floor(p.damageDealt),
        revives: p.revives,
        alive: p.alive
      }))
    };
  }

  // Chat methods
  addChatMessage(playerId, text) {
    const player = this.players.get(playerId);
    if (!player || !text || text.trim().length === 0) return null;
    
    const message = {
      id: uuidv4(),
      type: 'chat',
      timestamp: Date.now(),
      playerId,
      playerName: player.name,
      playerColor: player.color,
      text: text.trim().substring(0, 200) // Limit message length
    };
    
    this.chatMessages.push(message);
    
    // Keep only last 50 messages
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    
    return message;
  }

  addSystemMessage(text) {
    const message = {
      id: uuidv4(),
      type: 'system',
      timestamp: Date.now(),
      text
    };
    
    this.chatMessages.push(message);
    
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    
    return message;
  }

  getChatMessages() {
    return this.chatMessages;
  }
}

module.exports = GameState;
