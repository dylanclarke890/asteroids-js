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
    const { fps, shipThrust, friction } = settings;
    this.a += this.rot;

    if (this.thrusting) {
      this.thrust.x += (shipThrust * Math.cos(this.a)) / fps;
      this.thrust.y -= (shipThrust * Math.sin(this.a)) / fps;
    } else {
      this.thrust.x -= friction * this.thrust.x / fps;
      this.thrust.y -= friction * this.thrust.y / fps;
    }

    this.x += this.thrust.x;
    this.y += this.thrust.y;

    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
    else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
    else if (this.y > canvas.height + this.r) this.y = 0 - this.r;
  }

  draw() {
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);
    if (this.thrusting) {
      ctx.fillStyle = "red";
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(
        // rear left
        this.x - this.r * ((2 / 3) * cosA + 0.5 * sinA),
        this.y + this.r * ((2 / 3) * sinA - 0.5 * cosA)
      );
      ctx.lineTo(
        // rear centre (behind the this)
        this.x - ((this.r * 5) / 3) * cosA,
        this.y + ((this.r * 5) / 3) * sinA
      );
      ctx.lineTo(
        // rear right
        this.x - this.r * ((2 / 3) * cosA - 0.5 * sinA),
        this.y + this.r * ((2 / 3) * sinA + 0.5 * cosA)
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = "grey";
    ctx.lineWidth = this.w / 10;
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

class Asteroid {
  constructor(x, y) {
    const { asteroids, fps } = settings;
    this.x = x;
    this.y = y;
    this.velocity = {
      x:
        ((Math.random() * asteroids.speed) / fps) *
        (Math.random() > 0.5 ? 1 : -1),
      y:
        ((Math.random() * asteroids.speed) / fps) *
        (Math.random() > 0.5 ? 1 : -1),
    };
    this.r = asteroids.size / 2;
    this.a = Math.random() * Math.PI * 2; // angle in radians
    this.vert = Math.floor(
      Math.random() * (asteroids.vert + 1) + asteroids.vert / 2
    );
  }

  update() {}
  draw() {
    ctx.closePath;
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = 3;
    // draw the path
    ctx.beginPath();
    ctx.moveTo(
      this.x + this.r * Math.cos(this.a),
      this.y + this.r * Math.sin(this.a)
    );
    // draw the polygon
    for (let j = 0; j < this.vert; j++) {
      ctx.lineTo(
        this.x + this.r * Math.cos(this.a + (j * Math.PI * 2) / this.vert),
        this.y + this.r * Math.sin(this.a + (j * Math.PI * 2) / this.vert)
      );
    }
    ctx.closePath();
    ctx.stroke();
  }
}

const state = {
  player: new Player(),
  asteroids: [],
};

const FPS = 60;
const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  turnSpeed: 360, // degrees per second
  shipThrust: 5,
  friction: 0.7, // friction coefficient of space (between 0 and 1 generally).
  asteroids: {
    startingNum: 3,
    speed: 50, // max starting speed of asteroids in pixels per second
    size: 100,
    vert: 10,
  },
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

(function createAsteroidBelt() {
  const { startingNum } = settings.asteroids;
  for (let i = 0; i < startingNum; i++) {
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);
    state.asteroids.push(new Asteroid(x, y));
  }
})();

function handleObjects() {
  state.player.update();
  state.player.draw();

  for (let i = 0; i < state.asteroids.length; i++) {
    state.asteroids[i].update();
    state.asteroids[i].draw();
  }
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
