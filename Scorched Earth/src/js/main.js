import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import '/src/images/Sound_Enabled.png';
import '/src/images/Sound_Disabled.png';
import '/src/images/background.jpg';
import '/src/images/Logo.svg';
import '/src/images/Map.svg';
import '/src/images/M109_NoBarrel_pixelated.png';
import '/src/images/M109_Barrel_pixelated.png';
import '/src/pages/Game.txt';

// Global variables
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

var canvas, context, map, tank, barrel;
var GameIsLoaded = 0;
var GameIsRunning = 0;

let mapOffsetX = 0;
const scrollThreshold = screenWidth * 0.3;
const tankSpeed = 15;
let tankX = 75;
let tankY = 0;
let groundAngle = 0;

var BulleVelocity = 15

let bullet = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    gravity: 0.2,
    isFired: false,
    hitPoint: null
};

let hitMarker = {
    x: 0,
    y: 0,
    size: 10,
    isVisible: true
};

let bulletTrail = [];

// Barrel settings (scaled to half)
const barrelOffsetX = -15;
const barrelOffsetY = 101;
const barrelPivotOnTankX = 144; // 288/2 (original pivot scaled down)
const barrelPivotOnTankY = 34;  // 68/2 (original pivot scaled down)

// Mouse and rotation variables
let mouseX = 0;
let mouseY = 0;
let barrelAngle = 0;

// Recoil variables
let isRecoiling = false;
let recoilOffsetX = 0;
const recoilDistance = 15;
const recoilDuration = 100;

const fullMapCanvas = document.createElement('canvas');
const fullMapContext = fullMapCanvas.getContext('2d');
let gameStarted = false;

// Event listeners
document.getElementById('ToggleSoundButton').addEventListener('click', ToggleSound);
document.getElementById('PlayButton').addEventListener('click', LoadGame);

function ToggleSound() {
    const SoundState = document.getElementById('SoundState');
    const SoundState1 = '/src/images/Sound_Enabled.png';
    const SoundState2 = '/src/images/Sound_Disabled.png';
    SoundState.src = SoundState.src.endsWith(SoundState1) ? SoundState2 : SoundState1;
}

function LoadGame() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("Content").innerHTML = this.responseText;
            ReinitializeGame();
        }
    };
    xhttp.open("GET", "/src/pages/Game.txt", true);
    xhttp.send();
}

function ReinitializeGame() {
    console.log("ReinitializeGame called");
    canvas = document.getElementById('Game');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    context = canvas.getContext('2d');
    canvas.width = screenWidth;
    canvas.height = screenHeight;

    // Add mouse listener for barrel rotation
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left - window.scrollX; // Global mouse X
        mouseY = e.clientY - rect.top - window.scrollY;  // Global mouse Y
        //console.log(`Mouse: (${mouseX}, ${mouseY})`);
    });

    map = new Image();
    map.src = "/src/images/Map.svg";
    map.onload = function() {
        const scale = canvas.height / map.height;
        fullMapCanvas.width = map.width * scale;
        fullMapCanvas.height = map.height * scale;
        fullMapContext.drawImage(map, 0, 0, map.width, map.height, 0, 0, fullMapCanvas.width, fullMapCanvas.height);
        StartGame();
    };

    tank = new Image();
    tank.src = '/src/images/M109_NoBarrel_pixelated.png';
    tank.onload = function() {
        tank.width /= 2;
        tank.height /= 2;
        StartGame();
    };

    barrel = new Image();
    barrel.src = '/src/images/M109_Barrel_pixelated.png';
    barrel.onload = function() {
        barrel.width /= 2;
        barrel.height /= 2;
        StartGame();
    };
}

function StartGame() {
    if (gameStarted) return;
    gameStarted = true;
    GameIsRunning = 1;

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) RecoilBarrel();
    });

    animate();
}

function getGroundHeight(x) {
    if (x < 0 || x >= fullMapCanvas.width) return fullMapCanvas.height;
    const imageData = fullMapContext.getImageData(x, 0, 1, fullMapCanvas.height);
    const pixels = imageData.data;
    for (let y = 0; y < fullMapCanvas.height; y++) {
        const index = y * 4;
        if (pixels[index] === 0 && pixels[index + 1] === 204 && pixels[index + 2] === 0) return y;
    }
    return fullMapCanvas.height;
}

// Function to fire the bullet
function fireBullet() {
    if (bullet.isFired) return;

    bulletTrail = [];

    // Calculate the end of the barrel relative to the tank's local coordinates
    const barrelEndLocalX = barrelPivotOnTankX + Math.cos(barrelAngle * Math.PI / 180) * (barrel.width - 10); // Adjust for barrel tip
    const barrelEndLocalY = barrelPivotOnTankY + Math.sin(barrelAngle * Math.PI / 180) * (barrel.width - 10); // Adjust for barrel tip

    // Transform the barrel's tip position to global coordinates, accounting for tank rotation
    const cosGroundAngle = Math.cos(groundAngle);
    const sinGroundAngle = Math.sin(groundAngle);
    const barrelEndGlobalX = tankX + barrelEndLocalX * cosGroundAngle - barrelEndLocalY * sinGroundAngle;
    const barrelEndGlobalY = tankY + barrelEndLocalX * sinGroundAngle + barrelEndLocalY * cosGroundAngle;

    // Set bullet position and velocity
    bullet.x = barrelEndGlobalX;
    bullet.y = barrelEndGlobalY;
    bullet.vx = Math.cos((barrelAngle + groundAngle * 180 / Math.PI) * Math.PI / 180) * BulleVelocity; // Adjust velocity for tank rotation
    bullet.vy = Math.sin((barrelAngle + groundAngle * 180 / Math.PI) * Math.PI / 180) * BulleVelocity; // Adjust velocity for tank rotation
    bullet.isFired = true;
    bullet.hitPoint = null;
    hitMarker.isVisible = false;

    // Debug: Log starting position
    console.log(`Bullet starts at (${bullet.x}, ${bullet.y})`);
}

// Function to update bullet position
function updateBullet() {
    if (!bullet.isFired) return;

    // Store current position for the trail
    bulletTrail.push({ x: bullet.x, y: bullet.y });
    if (bulletTrail.length > 10) bulletTrail.shift();

    // Save the previous position for collision checks
    const prevX = bullet.x;
    const prevY = bullet.y;

    // Update bullet position
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.vy += bullet.gravity;

    // Check collisions along the bullet's path
    checkCollisionAlongPath(prevX, prevY, bullet.x, bullet.y);

    // Stop the bullet if it goes off-screen
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
        bullet.isFired = false;
        bulletTrail = []; // Clear the trail
        console.log("Bullet off-screen!");
    }
}

function checkCollisionAlongPath(startX, startY, endX, endY) {
    // Calculate the distance between the start and end points
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Determine the number of steps needed (check every 5 pixels)
    const stepSize = 5;
    const steps = Math.ceil(distance / stepSize);

    // Check collisions at intermediate points
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = startX + dx * t;
        const checkY = startY + dy * t;

        // Adjust for map scrolling
        const checkXRelativeToMap = checkX + mapOffsetX;

        // Check if the point is within the full map bounds
        if (
            checkXRelativeToMap >= 0 &&
            checkXRelativeToMap < fullMapCanvas.width &&
            checkY >= 0 &&
            checkY < fullMapCanvas.height
        ) {
            const imageData = fullMapContext.getImageData(
                Math.floor(checkXRelativeToMap),
                Math.floor(checkY),
                1,
                1
            );
            const pixels = imageData.data;

            // Check for collision with #00cc00 (green)
            if (
                (pixels[0] === 0 && pixels[1] === 204 && pixels[2] === 0) ||   // #00cc00 (green)
                (pixels[0] === 128 && pixels[1] === 79 && pixels[2] === 0)     // #804f00 (brown)
            ) {
                bullet.isFired = false;
                bullet.hitPoint = { x: checkX, y: checkY };
                hitMarker.x = checkX;
                hitMarker.y = checkY;
                hitMarker.isVisible = true;
                bulletTrail = []; // Clear the trail
                console.log("Bullet hit terrain!");
                return;
            }
        }
    }
}

// Update the barrel angle calculation
function updateBarrelAngle(tankY) {
    // Barrel pivot point on the tank (relative to the tank's VISIBLE position)
    const barrelPivotX = 144; // 288/2 (original pivot scaled down)
    const barrelPivotY = 34;  // 68/2 (original pivot scaled down)

    // Convert the pivot point to VISIBLE CANVAS coordinates (no mapOffsetX)
    const pivotX = tankX + barrelPivotX; // 🚨 Remove mapOffsetX
    const pivotY = tankY + barrelPivotY;

    // Calculate the angle between the pivot point and the mouse cursor
    const deltaX = mouseX - pivotX;
    const deltaY = mouseY - pivotY;
    let angle = Math.atan2(deltaY, deltaX);

    // Convert radians to degrees
    angle = angle * (180 / Math.PI);

    // Constrain the barrel angle to the specified limits
    const maxAngleUp = -75; // Maximum upward angle (negative in canvas)
    const maxAngleDown = 3; // Maximum downward angle (positive in canvas)
    barrelAngle = Math.min(maxAngleDown, Math.max(maxAngleUp, angle));

    //console.log(`Barrel Angle: ${barrelAngle}`);
}

function Render() {
    //console.log("Rendering frame...");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.height / map.height;
    const scaledWidth = map.width * scale;
    context.drawImage(map, 0, 0, map.width, map.height, -mapOffsetX, 0, scaledWidth, canvas.height);

    // Update & draw bullet (global coordinates)
    updateBullet();

    // Draw bullet trail
    bulletTrail.forEach((pos, index) => {
        context.beginPath();
        context.arc(pos.x, pos.y, 3 * (index / bulletTrail.length), 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 0, 0, ${0.1 + (index / bulletTrail.length) * 0.9})`;
        context.fill();
    });

    if (bullet.isFired) {
        context.beginPath();
        context.arc(bullet.x, bullet.y, 10, 0, Math.PI * 2);
        context.fillStyle = 'red';
        context.fill();
    }
    // Calculate tank positioning and ground height
    const trackBackX = 40.5;
    const trackFrontX = 205.5;
    const backX = tankX + trackBackX + mapOffsetX;
    const frontX = tankX + trackFrontX + mapOffsetX;
    const backGroundHeight = getGroundHeight(backX);
    const frontGroundHeight = getGroundHeight(frontX);
    const deltaX = trackFrontX - trackBackX;
    const deltaY = frontGroundHeight - backGroundHeight;
    groundAngle = Math.atan2(deltaY, deltaX); // Update global groundAngle
    const averageGroundHeight = (backGroundHeight + frontGroundHeight) / 2;
    tankY = averageGroundHeight - tank.height;
    const pivotX = tankX + (trackBackX + trackFrontX) / 2;
    const pivotY = averageGroundHeight;

    // Draw tank and barrel (with transformed coordinates)
    context.save();
    context.translate(pivotX, pivotY);
    context.rotate(groundAngle);
// Calculate barrel pivot (local coordinates)
    const localX = -tank.width / 2 - 8 + barrelPivotOnTankX;
    const localY = -tank.height + barrelPivotOnTankY;

    // Update barrel angle based on mouse
    updateBarrelAngle(tankY);

    // Draw barrel with recoil offset
    context.save();
    context.translate(localX, localY);
    context.rotate(barrelAngle * Math.PI / 180);
    context.drawImage(
        barrel,
        -recoilOffsetX,
        -barrel.height / 2,
        barrel.width,
        barrel.height
    );
    context.restore();

    // Draw tank image
    context.drawImage(tank, -tank.width / 2 + 4, -tank.height, tank.width, tank.height);

    // Draw hit marker
    if (hitMarker.isVisible) {
        context.beginPath();
        context.moveTo(hitMarker.x - hitMarker.size, hitMarker.y);
        context.lineTo(hitMarker.x + hitMarker.size, hitMarker.y);
        context.moveTo(hitMarker.x, hitMarker.y - hitMarker.size);
        context.lineTo(hitMarker.x, hitMarker.y + hitMarker.size);
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.stroke();
    }

    context.restore();
}

function animate() {
    if (GameIsRunning) {
        Render();
        requestAnimationFrame(animate);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        if (tankX < scrollThreshold) tankX += tankSpeed;
        else mapOffsetX += tankSpeed;
        if (tankX + mapOffsetX >= fullMapCanvas.width) tankX = fullMapCanvas.width - mapOffsetX - 1;
    } else if (e.key === 'ArrowLeft') {
        tankX -= tankSpeed;
        if (tankX < 0) tankX = 0;
        if (mapOffsetX > 0) mapOffsetX = Math.max(0, mapOffsetX - tankSpeed);
    }
    Render();
});

function RecoilBarrel() {
    if (isRecoiling) return;
    isRecoiling = true;
    const startTime = Date.now();
    const animateRecoil = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / recoilDuration, 1);
        recoilOffsetX = recoilDistance * (1 - progress);
        Render();
        if (progress < 1) {
            requestAnimationFrame(animateRecoil);
        } else {
            isRecoiling = false;
            fireBullet(); // No need to pass groundAngle
        }
    };
    requestAnimationFrame(animateRecoil);
}