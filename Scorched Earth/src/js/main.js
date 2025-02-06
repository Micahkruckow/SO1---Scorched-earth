import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import '/src/images/Sound_Enabled.png';
import '/src/images/Sound_Disabled.png';
import '/src/images/background.jpg';
import '/src/images/Logo.svg';
import '/src/pages/Game.txt';
import '/src/pages/M109_pixelated';

// Attach event listener to the Sound button, and the Play button.
document.getElementById('ToggleSoundButton').addEventListener('click', ToggleSound);
document.getElementById('PlayButton').addEventListener('click', LoadGame);
document.getElementById('CreditsButton').addEventListener('click', LoadCredits);

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

var canvas = document.getElementById('Game');
var context = canvas.getContext('2d');

// Bullet parameters
let bullet = {
  x: 50,          // Starting X position
  y: 500,         // Starting Y position
  velocityX: 0,   // Horizontal velocity
  velocityY: 0,   // Vertical velocity
  gravity: 0.5,   // Gravity strength
  isFired: false, // Firing state
  startTime: 0    // Track flight duration
};

function fireBullet(angle, power) {
  // Convert angle to radians (Scorched Earth-style angle: 0-180 degrees)
  const radians = angle * Math.PI / 180;
  
  // Calculate velocity components (power is initial speed)
  bullet.velocityX = Math.cos(radians) * power;
  bullet.velocityY = -Math.sin(radians) * power; // Negative Y since canvas Y increases downward
  
  bullet.isFired = true;
}

function updateBullet() {
  if (!bullet.isFired) return;

    // Calculate time since firing (in seconds)
    const currentTime = (Date.now() - bullet.startTime) / 1000;
    
    // Update position using projectile motion equations
    bullet.x += bullet.velocityX;
    bullet.y += bullet.velocityY + 0.5 * bullet.gravity * currentTime ** 2;
    
    // Update vertical velocity with gravity
    bullet.velocityY += bullet.gravity;
    
    // Ground collision check (canvas height is 600)
    if (bullet.y > 600 - 10) {
        bullet.isFired = false;
        // Add explosion logic here
    }
}

function drawBullet() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (bullet.isFired) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2); // Draw bullet as circle
      ctx.fillStyle = '#000'; // Fixed assignment using "=" instead of ":"
      ctx.fill();
  }
}

// Game loop
function gameLoop() {
    updateBullet();
    drawBullet();
    requestAnimationFrame(gameLoop);
}

// Example: Fire at 45 degrees with power 8
fireBullet(45, 8);
gameLoop();
var background = new Image();
background.src = "/src/images/background.jpg";
var tank = new Image();
tank.src = "/src/pages/M109_pixelated";

//Game state variables
var GameIsLoaded = 0
var GameIsRunning = 0

//Background variables
var Background_Xpos
var Background_Xpos // Y position might not be used

//Tank variables
var tank_Xpos
var tank_Ypos
var GunIsLoading = 0
var ShellsLeft = 36

function ToggleSound() {
    const SoundState = document.getElementById('SoundState');
    const SoundState1 = '/src/images/Sound_Enabled.png'; // Path to the Sound Enabled image
    const SoundState2 = '/src/images/Sound_Disabled.png'; // Path to the Sound Disabled image
  
    // Switch the sound image source
    SoundState.src = SoundState.src.endsWith(SoundState1) ? SoundState2 : SoundState1;
}

function LoadGame() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("Content").innerHTML =
       this.responseText;
       GameIsLoaded = 1;
      }
    };
  xhttp.open("GET", "/src/pages/Game.txt", true);
  xhttp.send();
}

function LoadCredits() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("Content").innerHTML =
      this.responseText;
    }
  };
  xhttp.open("GET", "/src/pages/Credits.txt", true);
  xhttp.send();
}

if (GameIsLoaded == 1) {

  while (GameIsRunning == 1) {
    function Render(context) {

    }

    function animate() {
      context.clearRect(0, 0, screenWidth, screenHeight);
      Render(context);
      setTimeout(animate, 5);
    }
    animate()
  }
}