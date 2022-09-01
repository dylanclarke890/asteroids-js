function new2dCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}

function drawText(text, font, fillStyle, x, y, maxWidth = undefined) {
  if (font) ctx.font = font;
  if (fillStyle) ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y, maxWidth);
}

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function isCircleRectColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function isRectRectColliding(first, second) {
  if (!first || !second) return false;
  if (
    !(
      first.x > second.x + second.w ||
      first.x + first.w < second.x ||
      first.y > second.y + second.h ||
      first.y + first.h < second.y
    )
  ) {
    return true;
  }
  return false;
}

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);
let canvasPosition = canvas.getBoundingClientRect();

const mouse = {
  x: 0,
  y: 0,
  w: 0.1,
  h: 0.1,
};

const setMousePosition = (e) => {
  mouse.x = e.x - (canvasPosition.left + 6);
  mouse.y = e.y - canvasPosition.top;
};

canvas.addEventListener("mousemove", (e) => {
  setMousePosition(e);
});

window.addEventListener("resize", () => {
  canvasPosition = canvas.getBoundingClientRect();
});

class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.w = 40;
    this.r = this.w / 2;
    this.a = (180 / 180) * Math.PI;
    this.rot = 0;
    this.thrusting = false;
    this.thrust = {
      x: 0,
      y: 0,
    };
  }

  update() {
    const { fps, shipThrust } = settings;
    this.a += this.rot;

    if (this.thrusting) {
      this.thrust.x += (shipThrust * Math.cos(this.a)) / fps;
      this.thrust.y -= (shipThrust * Math.sin(this.a)) / fps;
    }

    this.x += this.thrust.x;
    this.y += this.thrust.y;

    if (this.x < 0) this.x = canvas.width - this.r * 2;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height - this.r * 2;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.strokeStyle = "grey";
    ctx.lineWidth = this.w / 10;
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);
    ctx.beginPath();
    ctx.moveTo(
      // nose of the ship
      this.x + (4 / 3) * this.r * cosA,
      this.y - (4 / 3) * this.r * sinA
    );
    ctx.lineTo(
      // rear left
      this.x - this.r * ((2 / 3) * cosA + sinA),
      this.y + this.r * ((2 / 3) * sinA - cosA)
    );
    ctx.lineTo(
      // rear right
      this.x - this.r * ((2 / 3) * cosA - sinA),
      this.y + this.r * ((2 / 3) * sinA + cosA)
    );
    ctx.closePath();
    ctx.stroke();
  }
}

const state = {
  player: new Player(),
};

const FPS = 60;
const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  turnSpeed: 360, // degrees per second
  shipThrust: 5,
  friction: 0.7, // friction coefficient of space (between 0 and 1 generally).
};

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

function keyDown(/** @type {KeyboardEvent} */ ev) {
  const { turnSpeed, fps } = settings;
  switch (ev.code.toLowerCase()) {
    case "arrowleft":
      state.player.rot = ((turnSpeed / 180) * Math.PI) / fps;
      break;
    case "arrowright":
      state.player.rot = ((-turnSpeed / 180) * Math.PI) / fps;
      break;
    case "arrowup":
      state.player.thrusting = true;
      break;
    default:
      break;
  }
}
function keyUp(/** @type {KeyboardEvent} */ ev) {
  switch (ev.code.toLowerCase()) {
    case "arrowleft":
      state.player.rot = 0;
      break;
    case "arrowright":
      state.player.rot = 0;
      break;
    case "arrowup":
      state.player.thrusting = false;
      break;
    default:
      break;
  }
}

function handleObjects() {
  state.player.update();
  state.player.draw();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleObjects();
}

let stop = false,
  now,
  lastFrame;

(function startAnimating() {
  lastFrame = window.performance.now();
  animate();
})();

function animate(newtime) {
  if (stop) return;
  requestAnimationFrame(animate);
  now = newtime;
  const elapsed = now - lastFrame;
  if (elapsed > settings.fpsInterval) {
    lastFrame = now - (elapsed % settings.fpsInterval);
    update();
  }
}
