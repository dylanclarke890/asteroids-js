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

const keyboard = {
  left: false,
  right: false,
  forward: false,
  back: false,
  shooting: false,
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

window.addEventListener("keydown", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowleft":
      keyboard.left = true;
      break;
    case "arrowright":
      keyboard.right = true;
      break;
    case "arrowup":
      keyboard.forward = true;
      break;
    case "arrowdown":
      keyboard.back = true;
      break;
    case "space":
      keyboard.shooting = true;
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code.toLowerCase()) {
    case "arrowleft":
      keyboard.left = false;
      break;
    case "arrowright":
      keyboard.right = false;
      break;
    case "arrowup":
      keyboard.forward = false;
      break;
    case "arrowdown":
      keyboard.back = false;
      break;
    case "space":
      keyboard.shooting = false;
      break;
  }
});

class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.w = 20;
    this.h = 20;
    this.speed = 10;
  }

  update() {
    if (keyboard.left) this.x += -this.speed;
    if (keyboard.right) this.x += this.speed;
    if (keyboard.forward) this.y += -this.speed;
    if (keyboard.back) this.y += this.speed;

    if (this.x < 0) this.x = canvas.width - this.w;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height - this.h;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.fillStyle = "grey";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

const state = {
  player: new Player(),
};

function handleObjects() {
  state.player.update();
  state.player.draw();
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleObjects();
  requestAnimationFrame(animate);
})();