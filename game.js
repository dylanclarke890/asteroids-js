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

const FPS = 60;
const settings = {
  fps: FPS,
  fpsInterval: 1000 / FPS,
  devMode: {
    showCenterDot: false,
    showCollisionBounding: false,
  },
  ship: {
    blinkDuration: 0.1, // duration of blink in seconds.
    explodeDuration: 0.3, // duration of explosion in seconds.
    invDuration: 3, // duration of invisibility in seconds.
    friction: 0.7, // friction coefficient of space (between 0 and 1 generally).
    thrust: 5,
    turnSpeed: 360, // degrees per second.
  },
  asteroids: {
    startingNum: 3,
    speed: 50, // max starting speed of asteroids in pixels per second.
    size: 100,
    vert: 10,
    jag: 0.4, // jaggedness of the asteroids (0 - 1).
  },
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
    this.explodeTime = 0;
    const { ship, fps } = settings;
    this.blinkNum = Math.ceil(ship.invDuration / ship.blinkDuration);
    this.blinkTime = Math.ceil(ship.blinkDuration * fps);
  }

  update() {
    const { fps, ship } = settings;
    const { thrust, friction } = ship;
    const exploding = this.explodeTime > 0;

    if (!exploding) {
      this.a += this.rot;
      if (this.thrusting) {
        this.thrust.x += (thrust * Math.cos(this.a)) / fps;
        this.thrust.y -= (thrust * Math.sin(this.a)) / fps;
      } else {
        this.thrust.x -= (friction * this.thrust.x) / fps;
        this.thrust.y -= (friction * this.thrust.y) / fps;
      }
      this.x += this.thrust.x;
      this.y += this.thrust.y;

      for (let i = 0; i < state.asteroids.length; i++) {
        if (
          distanceBetweenPoints(
            this.x,
            this.y,
            state.asteroids[i].x,
            state.asteroids[i].y
          ) <
          this.r + state.asteroids[i].r
        )
          this.explode();
      }
    } else {
      this.explodeTime--;
      if (this.explodeTime === 0) this.reset();
    }

    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
    else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
    else if (this.y > canvas.height + this.r) this.y = 0 - this.r;

    if (this.blinkNum > 0) {
      this.blinkTime--;

      if (this.blinkTime === 0) {
        this.blinkTime = Math.ceil(ship.blinkDuration * fps);
        this.blinkNum--;
      }
    }
  }

  draw() {
    const cosA = Math.cos(this.a);
    const sinA = Math.sin(this.a);

    const exploding = this.explodeTime > 0;
    if (exploding) {
      ctx.fillStyle = "darkred";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.7, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.4, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 1.1, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.8, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.5, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
      return;
    }

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

    const blinkOn = this.blinkNum % 2 === 0;
    if (blinkOn) {
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

    const { showCenterDot: showShipCenterDot, showCollisionBounding } =
      settings.devMode;
    if (showShipCenterDot) {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
    }

    if (showCollisionBounding) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.stroke();
    }
  }

  explode() {
    const { fps, ship } = settings;
    this.explodeTime = Math.ceil(ship.explodeDuration * fps);
  }

  reset() {
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
    this.explodeTime = 0;
    const { ship, fps } = settings;
    this.blinkNum = Math.ceil(ship.invDuration / ship.blinkDuration);
    this.blinkTime = Math.ceil(ship.blinkDuration * fps);
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
    this.vertOffsets = [];
    for (let i = 0; i < this.vert; i++) {
      this.vertOffsets.push(
        Math.random() * asteroids.jag * 2 + 1 - asteroids.jag
      );
    }
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    if (this.x < 0 - this.r) this.x = canvas.width + this.r;
    else if (this.x > canvas.width + this.r) this.x = 0 - this.r;
    if (this.y < 0 - this.r) this.y = canvas.height + this.r;
    else if (this.y > canvas.height + this.r) this.y = 0 - this.r;
  }
  draw() {
    ctx.closePath;
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = 3;
    // draw the path
    ctx.beginPath();
    ctx.moveTo(
      this.x + this.r * this.vertOffsets[0] * Math.cos(this.a),
      this.y + this.r * this.vertOffsets[0] * Math.sin(this.a)
    );
    // draw the polygon
    for (let j = 1; j < this.vert; j++) {
      ctx.lineTo(
        this.x +
          this.r *
            this.vertOffsets[j] *
            Math.cos(this.a + (j * Math.PI * 2) / this.vert),
        this.y +
          this.r *
            this.vertOffsets[j] *
            Math.sin(this.a + (j * Math.PI * 2) / this.vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    const { showCenterDot, showCollisionBounding } = settings.devMode;
    if (showCenterDot) {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
    }

    if (showCollisionBounding) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

const state = {
  player: new Player(),
  asteroids: [],
};

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

function keyDown(/** @type {KeyboardEvent} */ ev) {
  const { ship, fps } = settings;
  switch (ev.code.toLowerCase()) {
    case "arrowleft":
      state.player.rot = ((ship.turnSpeed / 180) * Math.PI) / fps;
      break;
    case "arrowright":
      state.player.rot = ((-ship.turnSpeed / 180) * Math.PI) / fps;
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
  const { startingNum, size } = settings.asteroids;
  let x, y;
  for (let i = 0; i < startingNum; i++) {
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (
      distanceBetweenPoints(state.player.x, state.player.y, x, y) <
      size * 2 + state.player.r
    );
    state.asteroids.push(new Asteroid(x, y));
  }
})();

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

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
