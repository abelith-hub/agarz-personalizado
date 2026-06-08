// ===== AGARZ PERSONALIZADO - GAME ENGINE =====
// Versión: 1.0
// Diseño épico rojo y negro

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.cells = [];
        this.enemies = [];
        this.gameRunning = false;
        this.score = 0;
        this.playerName = '';
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGame();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startGame();
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.player && this.gameRunning) {
                this.player.targetX = e.clientX;
                this.player.targetY = e.clientY;
            }
        });
        
        // Click to split
        document.addEventListener('click', () => {
            if (this.player && this.gameRunning) {
                this.player.split();
            }
        });
    }
    
    startGame() {
        const username = document.getElementById('username').value.trim();
        if (!username) return;
        
        this.playerName = username;
        document.getElementById('player-name').textContent = `Jugador: ${username}`;
        
        // Hide login, show game
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Initialize game
        this.gameRunning = true;
        this.initializeGame();
        this.gameLoop();
    }
    
    initializeGame() {
        // Create player
        this.player = new PlayerCell(
            this.canvas.width / 2,
            this.canvas.height / 2,
            20,
            this.playerName
        );
        
        // Generate food cells
        this.cells = [];
        for (let i = 0; i < 100; i++) {
            this.cells.push(new FoodCell(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                Math.random() * 5 + 3
            ));
        }
        
        // Generate enemies
        this.enemies = [];
        for (let i = 0; i < 5; i++) {
            this.enemies.push(new EnemyCell(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                Math.random() * 20 + 15
            ));
        }
        
        this.score = 0;
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        // Clear canvas with gradient background
        this.drawBackground();
        
        // Update player
        this.player.update(this.canvas.width, this.canvas.height);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.canvas.width, this.canvas.height);
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Draw everything
        this.draw();
        
        // Update HUD
        this.updateHUD();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a0000');
        gradient.addColorStop(1, '#0a0a0a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle grid
        this.ctx.strokeStyle = 'rgba(255, 51, 51, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }
    
    checkCollisions() {
        // Player eating food
        for (let i = this.cells.length - 1; i >= 0; i--) {
            if (this.player.collidesWith(this.cells[i])) {
                this.player.grow(this.cells[i].size);
                this.score += Math.floor(this.cells[i].size);
                this.cells.splice(i, 1);
                
                // Respawn food
                this.cells.push(new FoodCell(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height,
                    Math.random() * 5 + 3
                ));
            }
        }
        
        // Player vs Enemies
        this.enemies.forEach(enemy => {
            if (this.player.collidesWith(enemy)) {
                if (this.player.size > enemy.size) {
                    this.player.grow(enemy.size);
                    this.score += Math.floor(enemy.size * 10);
                    this.enemies.splice(this.enemies.indexOf(enemy), 1);
                    this.enemies.push(new EnemyCell(
                        Math.random() * this.canvas.width,
                        Math.random() * this.canvas.height,
                        Math.random() * 20 + 15
                    ));
                }
            }
        });
    }
    
    draw() {
        // Draw food cells
        this.cells.forEach(cell => cell.draw(this.ctx));
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw player
        this.player.draw(this.ctx);
    }
    
    updateHUD() {
        document.getElementById('player-score').textContent = `Puntuación: ${this.score}`;
    }
}

class PlayerCell {
    constructor(x, y, size, name) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.name = name;
        this.targetX = x;
        this.targetY = y;
        this.speed = 2;
    }
    
    update(maxX, maxY) {
        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        // Boundaries
        this.x = Math.max(this.size, Math.min(maxX - this.size, this.x));
        this.y = Math.max(this.size, Math.min(maxY - this.size, this.y));
    }
    
    draw(ctx) {
        // Main cell with glow
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = 'rgba(255, 51, 51, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Name label
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'transparent';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y);
    }
    
    grow(amount) {
        this.size += amount / 10;
    }
    
    split() {
        if (this.size < 30) return;
        this.size *= 0.7;
    }
    
    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + other.size;
    }
}

class FoodCell {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.hue = Math.random() * 360;
    }
    
    draw(ctx) {
        ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.5)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnemyCell {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.targetX = Math.random() * window.innerWidth;
        this.targetY = Math.random() * window.innerHeight;
        this.speed = 1;
    }
    
    update(maxX, maxY) {
        // Random movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            this.targetX = Math.random() * maxX;
            this.targetY = Math.random() * maxY;
        }
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        // Boundaries
        this.x = Math.max(this.size, Math.min(maxX - this.size, this.x));
        this.y = Math.max(this.size, Math.min(maxY - this.size, this.y));
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = 'rgba(255, 102, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize game when document is ready
window.addEventListener('DOMContentLoaded', () => {
    new GameEngine();
});
