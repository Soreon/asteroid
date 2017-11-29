Math.TAU = 2 * Math.PI;

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const turnStep = Math.TAU / 80;
const accelerationCoef = 1 / 6;
const decelerationCoef = 2 / 3;
const spaceCraftRadius = 15;
const shieldRadius = spaceCraftRadius + 10;
const titleLettersCanvas = [];
const startMessageCanvas = document.createElement('canvas');
const wallThickness = 6;
const spaceCraft = {
  x: 0,
  y: 0,
  o: 0,
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0,
  tx: 0,
  ty: 0,
  tx2: 0,
  ty2: 0,
  tx3: 0,
  ty3: 0,
};

let t = 0;
let gameStarted = false;
let turningLeft = false;
let turningRight = false;
let throttling = false;
let showDebug = false;
let shieldActivated = false;
let firing = false;
let wallActivated = 0;

let redWallCanvas = null;
let blueWallCanvas = null;
let shieldCanvas = null;

function initSpaceCraft() {
  spaceCraft.x = canvas.width / 2;
  spaceCraft.y = canvas.height / 2;
  spaceCraft.o = -Math.PI / 2;
  spaceCraft.d = -Math.PI / 2;
  spaceCraft.vx = 0;
  spaceCraft.vy = 0;
  spaceCraft.ax = 0;
  spaceCraft.ay = 0;
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function keyDown(e) {
  if (gameStarted) {
    console.log(e.keyCode);
    switch (e.keyCode) {
      case 32:
        firing = true;
        break;
      case 37:
        turningLeft = true;
        break;
      case 38:
        throttling = true;
        break;
      case 39:
        turningRight = true;
        break;
      case 48:
        wallActivated += 1;
        wallActivated %= 3;
        e.preventDefault();
        break;
      case 49:
        shieldActivated = !shieldActivated;
        e.preventDefault();
        break;
      case 112:
        showDebug = !showDebug;
        break;
      default:
        break;
    }
  } else {
    switch (e.keyCode) {
      case 32:
        gameStarted = true;
        break;
      default:
        break;
    }
  }
}

function keyUp(e) {
  if (gameStarted) {
    switch (e.keyCode) {
      case 32:
        firing = false;
        break;
      case 37:
        turningLeft = false;
        break;
      case 38:
        throttling = false;
        break;
      case 39:
        turningRight = false;
        break;
      default:
        break;
    }
  }
}

function text(x, y, txt, color = '#000000', size = '10px') {
  context.shadowBlur = 0;
  context.font = `${size} Gameplay`;
  context.fillStyle = color;
  context.fillText(txt, x, y);
}

function drawThrustTriangle(bx, by, color, long, larg) {
  const tx = bx + (Math.cos(spaceCraft.o + Math.PI) * long);
  const ty = by + (Math.sin(spaceCraft.o + Math.PI) * long);
  const tx2 = bx + (Math.cos(spaceCraft.o + ((8 * Math.PI) / 20)) * larg);
  const ty2 = by + (Math.sin(spaceCraft.o + ((8 * Math.PI) / 20)) * larg);
  const tx3 = bx + (Math.cos(spaceCraft.o + ((-8 * Math.PI) / 20)) * larg);
  const ty3 = by + (Math.sin(spaceCraft.o + ((-8 * Math.PI) / 20)) * larg);
  context.beginPath();
  context.moveTo(tx, ty);
  context.lineTo(tx2, ty2);
  context.lineTo(tx3, ty3);
  context.closePath();
  context.fillStyle = color;
  context.shadowBlur = 10;
  context.shadowColor = color;
  context.lineWidth = 1;
  context.fill();
}

function drawThrust() {
  context.beginPath();
  const bx = spaceCraft.x + (Math.cos(spaceCraft.o + Math.PI) * 15);
  const by = spaceCraft.y + (Math.sin(spaceCraft.o + Math.PI) * 15);
  const flicker = Math.random() * 5;

  drawThrustTriangle(bx, by, '#FF0000', 15 + flicker, 5);
  drawThrustTriangle(bx, by, '#FF5A00', 12 + flicker, 4);
  drawThrustTriangle(bx, by, '#FF9A00', 9 + flicker, 3);
  drawThrustTriangle(bx, by, '#FFCE00', 6 + flicker, 2);
  drawThrustTriangle(bx, by, '#FFE808', 3 + flicker, 1);
  drawThrustTriangle(bx, by, '#FFFFFF', 1 + flicker, 1);
}

function drawShield() {
  if (!shieldCanvas) {
    shieldCanvas = document.createElement('canvas');
    shieldCanvas.width = (shieldRadius * 2) + 24;
    shieldCanvas.height = shieldCanvas.width;
    const tempContext = shieldCanvas.getContext('2d');
    tempContext.beginPath();
    tempContext.arc(shieldCanvas.width / 2, shieldCanvas.height / 2, shieldRadius, 0, Math.TAU, false);
    tempContext.strokeStyle = '#00FFFF';
    tempContext.shadowColor = '#00FFFF';
    tempContext.shadowBlur = 10;
    tempContext.fillStyle = '#00FFFF11';
    tempContext.fill();
    tempContext.lineWidth = 1;
    tempContext.stroke();
  } else {
    context.shadowBlur = 0;
    context.drawImage(shieldCanvas, spaceCraft.x - (shieldCanvas.width / 2), spaceCraft.y - (shieldCanvas.height / 2));
  }
}

function drawWall(tempCanvas, color) {
  const tempContext = tempCanvas.getContext('2d');
  tempContext.beginPath();
  tempContext.moveTo(0, 0);
  tempContext.lineTo(tempCanvas.width, 0);
  tempContext.lineTo(tempCanvas.width, tempCanvas.height);
  tempContext.lineTo(0, tempCanvas.height);
  tempContext.shadowColor = color;
  tempContext.strokeStyle = color;
  tempContext.closePath();
  tempContext.lineWidth = wallThickness * 2;
  tempContext.shadowBlur = 10;
  tempContext.stroke();
}

function computeWalls() {
  redWallCanvas = document.createElement('canvas');
  redWallCanvas.width = canvas.width;
  redWallCanvas.height = canvas.height;
  drawWall(redWallCanvas, '#FF0000');
  blueWallCanvas = document.createElement('canvas');
  blueWallCanvas.width = canvas.width;
  blueWallCanvas.height = canvas.height;
  drawWall(blueWallCanvas, '#00FFFF');
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  computeWalls();
}

function drawWalls() {
  context.shadowBlur = 0;
  switch (wallActivated) {
    case 1:
      context.drawImage(blueWallCanvas, 0, 0);
      break;
    case 2:
      context.drawImage(redWallCanvas, 0, 0);
      break;
    default:
      break;
  }
}

function drawStartMenu() {
  if (titleLettersCanvas.length === 0) {
    const title = 'AsteroId';
    for (let i = 0; i < title.length; i += 1) {
      titleLettersCanvas[i] = document.createElement('canvas');
      titleLettersCanvas[i].width = 128;
      titleLettersCanvas[i].height = 128;
      const tempContext = titleLettersCanvas[i].getContext('2d');
      tempContext.shadowBlur = 10;
      tempContext.font = '75px BackTo1982';
      tempContext.textAlign = 'center';
      tempContext.textBaseline = 'middle';
      tempContext.fillStyle = '#F0F';
      tempContext.shadowColor = '#F0F';
      tempContext.fillText(title[i], 64, 64);
    }
    startMessageCanvas.width = 300;
    startMessageCanvas.height = 30;
    const tempContext = startMessageCanvas.getContext('2d');
    tempContext.shadowBlur = 10;
    tempContext.font = '15px Gameplay';
    tempContext.textAlign = 'center';
    tempContext.textBaseline = 'middle';
    tempContext.fillStyle = '#F0F';
    tempContext.shadowColor = '#F0F';
    tempContext.fillText('Press space to start', 150, 15);
  } else {
    const spacing = 100;
    context.shadowBlur = 0;
    for (let i = 0; i < titleLettersCanvas.length; i += 1) {
      context.drawImage(
        titleLettersCanvas[i],
        (canvas.width / 2) + (i * spacing) + (-4 * spacing),
        (canvas.height / 2) + (5 * Math.sin((Math.TAU * (t / 4)) + (Math.TAU * (i / titleLettersCanvas.length)))) + (-64),
      );
    }
    context.drawImage(startMessageCanvas, (canvas.width / 2) - 150, (canvas.height / 2) + 64);
    t += 0.05;
    t %= 4;
  }
}

function drawSpaceCraft() {
  if (throttling) drawThrust();
  if (shieldActivated) drawShield();

  context.beginPath();
  spaceCraft.tx = spaceCraft.x + (Math.cos(spaceCraft.o) * spaceCraftRadius);
  spaceCraft.ty = spaceCraft.y + (Math.sin(spaceCraft.o) * spaceCraftRadius);
  spaceCraft.tx2 = spaceCraft.x + (Math.cos(spaceCraft.o + (Math.PI * (5 / 6))) * spaceCraftRadius);
  spaceCraft.ty2 = spaceCraft.y + (Math.sin(spaceCraft.o + (Math.PI * (5 / 6))) * spaceCraftRadius);
  spaceCraft.tx3 = spaceCraft.x + (Math.cos(spaceCraft.o + (Math.PI * (7 / 6))) * spaceCraftRadius);
  spaceCraft.ty3 = spaceCraft.y + (Math.sin(spaceCraft.o + (Math.PI * (7 / 6))) * spaceCraftRadius);
  context.moveTo(spaceCraft.tx, spaceCraft.ty);
  context.lineTo(spaceCraft.tx2, spaceCraft.ty2);
  context.lineTo(spaceCraft.tx3, spaceCraft.ty3);
  context.closePath();
  context.shadowBlur = 10;
  context.strokeStyle = '#FF00FF';
  context.shadowColor = '#FF00FF';
  context.lineWidth = 1;
  context.stroke();
}

function trueMod(x, y) {
  return x >= 0 ? x % y : y - 1 - ((-x - 1) % y);
}

function computeNextState() {
  if (turningLeft) spaceCraft.o = (spaceCraft.o - turnStep) % Math.TAU;
  if (turningRight) spaceCraft.o = (spaceCraft.o + turnStep) % Math.TAU;

  if (throttling) {
    spaceCraft.ax = Math.cos(spaceCraft.o) * accelerationCoef;
    spaceCraft.ay = Math.sin(spaceCraft.o) * accelerationCoef;
  } else {
    spaceCraft.ax = spaceCraft.ax > 0.0001 ? spaceCraft.ax * decelerationCoef : 0;
    spaceCraft.ay = spaceCraft.ay > 0.0001 ? spaceCraft.ay * decelerationCoef : 0;
  }

  spaceCraft.vx += spaceCraft.ax;
  spaceCraft.vy += spaceCraft.ay;

  if (wallActivated !== 0) {
    spaceCraft.x += spaceCraft.vx;
    spaceCraft.y += spaceCraft.vy;
    let decelRatio = 0;
    if (shieldActivated) {
      decelRatio = -1 / 2;
      if (Math.round(spaceCraft.x) < Math.round(shieldRadius + wallThickness)) {
        spaceCraft.vx *= decelRatio;
        spaceCraft.x = Math.round(shieldRadius + wallThickness);
      }
      if (Math.round(spaceCraft.y) < Math.round(shieldRadius + wallThickness)) {
        spaceCraft.vy *= decelRatio;
        spaceCraft.y = Math.round(shieldRadius + wallThickness);
      }
      if (Math.round(spaceCraft.x) > Math.round(canvas.width - shieldRadius - wallThickness)) {
        spaceCraft.vx *= decelRatio;
        spaceCraft.x = Math.round(canvas.width - shieldRadius - wallThickness);
      }
      if (Math.round(spaceCraft.y) > Math.round(canvas.height - shieldRadius - wallThickness)) {
        spaceCraft.vy *= decelRatio;
        spaceCraft.y = Math.round(canvas.height - shieldRadius - wallThickness);
      }
    } else {
      if (Math.round(spaceCraft.tx) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x += Math.round(wallThickness - spaceCraft.tx);
      }
      if (Math.round(spaceCraft.tx2) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x += Math.round(wallThickness - spaceCraft.tx2);
      }
      if (Math.round(spaceCraft.tx3) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x += Math.round(wallThickness - spaceCraft.tx3);
      }
      if (Math.round(spaceCraft.ty) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y += Math.round(wallThickness - spaceCraft.ty);
      }
      if (Math.round(spaceCraft.ty2) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y += Math.round(wallThickness - spaceCraft.ty2);
      }
      if (Math.round(spaceCraft.ty3) < Math.round(wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y += Math.round(wallThickness - spaceCraft.ty3);
      }
      if (Math.round(spaceCraft.tx) > Math.round(canvas.width - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x -= Math.round((spaceCraft.tx - canvas.width) + wallThickness);
      }
      if (Math.round(spaceCraft.tx2) > Math.round(canvas.width - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x -= Math.round((spaceCraft.tx2 - canvas.width) + wallThickness);
      }
      if (Math.round(spaceCraft.tx3) > Math.round(canvas.width - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.x -= Math.round((spaceCraft.tx3 - canvas.width) + wallThickness);
      }
      if (Math.round(spaceCraft.ty) > Math.round(canvas.height - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y -= Math.round((spaceCraft.ty - canvas.height) + wallThickness);
      }
      if (Math.round(spaceCraft.ty2) > Math.round(canvas.height - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y -= Math.round((spaceCraft.ty2 - canvas.height) + wallThickness);
      }
      if (Math.round(spaceCraft.ty3) > Math.round(canvas.height - wallThickness)) {
        spaceCraft.vx = 0;
        spaceCraft.vy = 0;
        spaceCraft.y -= Math.round((spaceCraft.ty3 - canvas.height) + wallThickness);
      }
    }
  } else {
    spaceCraft.x = trueMod(spaceCraft.x + spaceCraft.vx, canvas.width);
    spaceCraft.y = trueMod(spaceCraft.y + spaceCraft.vy, canvas.height);
  }
}

function drawDebug() {
  text(10, 20, `x: ${spaceCraft.x}`, '#FF00FF', '11px');
  text(10, 40, `y: ${spaceCraft.y}`, '#FF00FF', '11px');
  text(10, 60, `vx: ${spaceCraft.vx}`, '#FF00FF', '11px');
  text(10, 80, `vy: ${spaceCraft.vy}`, '#FF00FF', '11px');
  text(10, 100, `ax: ${spaceCraft.ax}`, '#FF00FF', '11px');
  text(10, 120, `ay: ${spaceCraft.ay}`, '#FF00FF', '11px');
  text(10, 140, `rv: ${Math.sqrt(Math.abs(spaceCraft.vx) + Math.abs(spaceCraft.vy))}`, '#FF00FF', '11px');
}

function draw() {
  if (gameStarted) {
    drawSpaceCraft();
    drawWalls();
    if (showDebug) drawDebug();
  } else {
    drawStartMenu();
  }
}

function animate() {
  computeNextState();
  clearCanvas();
  draw();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

resizeCanvas();
initSpaceCraft();
animate();
