var port = 1001;
var CONNECTION_URL = '62.210.246.200:' + port;

(function(window, $) {
    'use strict';

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var isTouch = 'createTouch' in document;
    
    // Variables de juego
    var nick = '';
    var region = '1';
    var socket = null;
    var gameRunning = false;
    var score = 0;
    var playerCells = [];
    var otherCells = {};
    var viruses = [];
    var food = [];
    var myId = null;
    var cameraX = 0;
    var cameraY = 0;
    var cameraZoom = 1;
    var mouseX = canvas.width / 2;
    var mouseY = canvas.height / 2;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function init() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        $('#playBtn').click(function(e) {
            e.preventDefault();
            nick = $('#nick').val().trim();
            region = $('#region').val();
            if (nick) {
                startGame();
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (gameRunning && socket && socket.readyState === 1) {
                sendMousePos(mouseX, mouseY);
            }
        });
        
        document.addEventListener('click', function(e) {
            if (gameRunning && socket && socket.readyState === 1) {
                sendSplit();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (gameRunning && e.keyCode === 32) {
                e.preventDefault();
                sendEject();
            }
        });
    }
    
    function startGame() {
        gameRunning = true;
        $('#overlays').fadeOut();
        connectWebSocket();
    }
    
    function connectWebSocket() {
        try {
            if (socket) socket.close();
        } catch(e) {}
        
        var sid = Math.floor(Math.random() * 1000000);
        var wsUrl = 'ws://' + CONNECTION_URL + '/' + sid;
        
        console.log('Conectando a: ' + wsUrl);
        socket = new WebSocket(wsUrl);
        socket.binaryType = 'arraybuffer';
        socket.onopen = onSocketOpen;
        socket.onmessage = onSocketMessage;
        socket.onclose = onSocketClose;
        socket.onerror = onSocketError;
    }
    
    function onSocketOpen() {
        console.log('Conectado al servidor');
        sendNickAndRegion();
    }
    
    function sendNickAndRegion() {
        if (!socket) return;
        
        var bufLen = 2 + nick.length * 2;
        var msg = new DataView(new ArrayBuffer(bufLen));
        var pos = 0;
        
        msg.setUint8(pos, 254); pos++;
        msg.setUint8(pos, parseInt(region)); pos++;
        
        for (var i = 0; i < nick.length; i++) {
            msg.setUint16(pos, nick.charCodeAt(i), true);
            pos += 2;
        }
        
        socket.send(msg.buffer);
    }
    
    function sendMousePos(x, y) {
        if (!socket || socket.readyState !== 1) return;
        
        var msg = new DataView(new ArrayBuffer(17));
        msg.setUint8(0, 16);
        msg.setFloat64(1, x, true);
        msg.setFloat64(9, y, true);
        
        socket.send(msg.buffer);
    }
    
    function sendSplit() {
        if (!socket || socket.readyState !== 1) return;
        
        var msg = new DataView(new ArrayBuffer(1));
        msg.setUint8(0, 17);
        
        socket.send(msg.buffer);
    }
    
    function sendEject() {
        if (!socket || socket.readyState !== 1) return;
        
        var msg = new DataView(new ArrayBuffer(1));
        msg.setUint8(0, 18);
        
        socket.send(msg.buffer);
    }
    
    function onSocketMessage(event) {
        try {
            var data = new DataView(event.data);
            parseGameData(data);
        } catch(e) {
            console.log('Error parsing message:', e);
        }
    }
    
    function parseGameData(data) {
        // Parsear protocolo binario del servidor
        var pos = 0;
        var cmd = data.getUint8(pos++);
        
        switch(cmd) {
            case 16: // Update player position
                // Procesar actualización
                break;
            case 64: // World data
                // Procesar datos del mundo
                break;
        }
    }
    
    function onSocketClose() {
        console.log('Desconectado del servidor');
        gameRunning = false;
        $('#overlays').fadeIn();
    }
    
    function onSocketError(error) {
        console.log('Error de conexión:', error);
        $('#overlays').fadeIn();
    }
    
    function drawBackground() {
        var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a0000');
        gradient.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = 'rgba(255, 51, 51, 0.05)';
        ctx.lineWidth = 1;
        for (var i = 0; i < canvas.width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (var i = 0; i < canvas.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }
    
    function drawExampleContent() {
        // Dibujar célula del jugador en el centro
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = 'rgba(255, 51, 51, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Nombre
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'transparent';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(nick, canvas.width / 2, canvas.height / 2 + 5);
        
        // Comida aleatoria
        for (var i = 0; i < 50; i++) {
            ctx.fillStyle = 'hsl(' + (Math.random() * 360) + ', 100%, 50%)';
            var x = Math.random() * canvas.width;
            var y = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function gameLoop() {
        drawBackground();
        
        if (gameRunning) {
            drawExampleContent();
            
            // Info HUD
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Jugador: ' + nick, 20, 40);
            ctx.fillText('Puntuacion: ' + score, 20, 70);
            ctx.fillStyle = '#999';
            ctx.font = '14px Arial';
            ctx.fillText('Mueve raton para moverte | Click para dividirse', 20, 100);
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Iniciar cuando document está listo
    $(document).ready(function() {
        init();
        gameLoop();
    });

})(window, jQuery);