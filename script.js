// Photos Frame Animation Configuration
const FRAME_COUNT = 300;
const FOLDER_PATH = 'Photos';
const LERP_FACTOR = 0.09;

// DOM Elements
const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');
const frameCounterEl = document.getElementById('frameCounter');
const progressPercentEl = document.getElementById('progressPercent');
const progressBarFillEl = document.getElementById('progressBarFill');
const fpsCounterEl = document.getElementById('fpsCounter');
const loadTextEl = document.getElementById('loadText');
const loadingBadgeEl = document.getElementById('loadingBadge');
const spinnerEl = document.getElementById('spinner');
const autoPlayBtn = document.getElementById('autoPlayBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

const heroHeadlineEl = document.getElementById('heroHeadline');
const heroSubheadlineEl = document.getElementById('heroSubheadline');
const heroCta1El = document.getElementById('heroCta1');
const heroCta2El = document.getElementById('heroCta2');

// State Variables
const images = [];
const imageStatus = new Array(FRAME_COUNT).fill(false);
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let animationFrameId = null;
let isAutoPlaying = false;
let autoPlaySpeed = 0.4;
let lastFrameTime = performance.now();
let frameCountForFps = 0;
let fps = 60;

function getFrameFilename(index) {
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `${FOLDER_PATH}/ezgif-frame-${paddedIndex}.jpg`;
}

// Preload Images
function preloadImages() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = getFrameFilename(i);

    img.onload = () => {
      imageStatus[i] = true;
      loadedCount++;
      updateLoadingProgress();
      
      if (i === 0 && !images[0].rendered) {
        images[0].rendered = true;
        renderFrame(0);
      }
    };

    img.onerror = () => {
      console.warn(`Failed loading frame ${i + 1}`);
    };

    images.push(img);
  }
}

function updateLoadingProgress() {
  const percent = Math.floor((loadedCount / FRAME_COUNT) * 100);
  if (loadTextEl) loadTextEl.textContent = `Loaded ${percent}%`;

  if (loadedCount >= FRAME_COUNT) {
    if (loadTextEl) loadTextEl.textContent = `300 / 300 Frames Ready`;
    if (spinnerEl) spinnerEl.classList.add('hidden');
    if (loadingBadgeEl) loadingBadgeEl.classList.add('complete');
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  renderFrame(Math.round(currentFrame));
}

function renderFrame(index) {
  const validIndex = Math.min(Math.max(0, index), FRAME_COUNT - 1);
  const img = images[validIndex];

  if (!img || !img.complete || img.naturalWidth === 0) {
    let fallbackIndex = validIndex;
    for (let offset = 1; offset < 20; offset++) {
      if (validIndex - offset >= 0 && imageStatus[validIndex - offset]) {
        fallbackIndex = validIndex - offset;
        break;
      }
      if (validIndex + offset < FRAME_COUNT && imageStatus[validIndex + offset]) {
        fallbackIndex = validIndex + offset;
        break;
      }
    }
    if (images[fallbackIndex] && images[fallbackIndex].complete) {
      drawImageToCanvas(images[fallbackIndex]);
    }
    return;
  }

  drawImageToCanvas(img);
}

function drawImageToCanvas(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  if (!imgWidth || !imgHeight) return;

  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let renderWidth, renderHeight, offsetX, offsetY;

  // Background cover mode so the animation fills the viewport completely
  if (canvasRatio > imgRatio) {
    renderWidth = canvasWidth;
    renderHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - renderHeight) / 2;
  } else {
    renderHeight = canvasHeight;
    renderWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = 0;
  }

  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
}

function updateTargetFrameFromScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if (maxScroll <= 0) return;

  const scrollFraction = Math.min(Math.max(0, scrollTop / maxScroll), 1);
  targetFrame = scrollFraction * (FRAME_COUNT - 1);

  const progressPercent = Math.round(scrollFraction * 100);
  progressPercentEl.textContent = `${progressPercent}%`;
  progressBarFillEl.style.width = `${scrollFraction * 100}%`;
}

function animate(now) {
  if (isAutoPlaying) {
    targetFrame += autoPlaySpeed;
    if (targetFrame >= FRAME_COUNT - 1) {
      targetFrame = 0;
    }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: (targetFrame / (FRAME_COUNT - 1)) * maxScroll,
      behavior: 'instant'
    });
  }

  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * LERP_FACTOR;
  } else {
    currentFrame = targetFrame;
  }

  const frameIndexToRender = Math.round(currentFrame);
  renderFrame(frameIndexToRender);

  const displayFrame = String(frameIndexToRender + 1).padStart(3, '0');
  frameCounterEl.textContent = `${displayFrame} / 300`;

  frameCountForFps++;
  if (now - lastFrameTime >= 1000) {
    fps = Math.round((frameCountForFps * 1000) / (now - lastFrameTime));
    fpsCounterEl.textContent = fps;
    frameCountForFps = 0;
    lastFrameTime = now;
  }

  animationFrameId = requestAnimationFrame(animate);
}

// Event Listeners
window.addEventListener('scroll', () => {
  if (!isAutoPlaying) {
    updateTargetFrameFromScroll();
  }
}, { passive: true });

window.addEventListener('resize', resizeCanvas);

if (autoPlayBtn) {
  autoPlayBtn.addEventListener('click', () => {
    isAutoPlaying = !isAutoPlaying;
    if (isAutoPlaying) {
      if (playIcon) playIcon.classList.add('hidden');
      if (pauseIcon) pauseIcon.classList.remove('hidden');
      autoPlayBtn.style.color = '#10b981';
    } else {
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
      autoPlayBtn.style.color = '';
    }
  });
}

const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function init() {
  resizeCanvas();
  preloadImages();
  updateTargetFrameFromScroll();
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

