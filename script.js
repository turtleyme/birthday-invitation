const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const opening = $("#opening");
const musicButton = $("#musicToggle");
const musicLabel = $("#musicLabel");
let audioContext;
let musicTimer;
let isMusicPlaying = false;
let noteIndex = 0;

const melody = [
  [261.63, .26], [261.63, .14], [293.66, .42], [261.63, .42], [349.23, .42], [329.63, .8],
  [261.63, .26], [261.63, .14], [293.66, .42], [261.63, .42], [392.00, .42], [349.23, .8],
  [261.63, .26], [261.63, .14], [523.25, .42], [440.00, .42], [349.23, .42], [329.63, .42], [293.66, .8],
  [466.16, .26], [466.16, .14], [440.00, .42], [349.23, .42], [392.00, .42], [349.23, .9]
];

function playTone(frequency, duration) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.075, now + .04);
  gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + .05);
}

function scheduleNextNote() {
  if (!isMusicPlaying) return;
  const [frequency, duration] = melody[noteIndex];
  playTone(frequency, duration);
  noteIndex = (noteIndex + 1) % melody.length;
  musicTimer = setTimeout(scheduleNextNote, duration * 850 + 90);
}

function toggleMusic(forcePlay) {
  const shouldPlay = typeof forcePlay === "boolean" ? forcePlay : !isMusicPlaying;
  if (shouldPlay === isMusicPlaying) return;
  isMusicPlaying = shouldPlay;
  musicButton.classList.toggle("playing", isMusicPlaying);
  musicLabel.textContent = isMusicPlaying ? "Playing" : "Music";

  if (isMusicPlaying) {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    scheduleNextNote();
  } else {
    clearTimeout(musicTimer);
  }
}

$("#openInvitation").addEventListener("click", () => {
  opening.classList.add("hidden");
  document.body.style.overflow = "";
  toggleMusic(true);
  burstConfetti();
});
musicButton.addEventListener("click", () => toggleMusic());
document.body.style.overflow = "hidden";
if (new URLSearchParams(location.search).has("preview")) {
  opening.style.display = "none";
  document.body.style.overflow = "";
  $$(".reveal").forEach((element) => element.classList.add("visible"));
}

const eventDate = new Date("2026-07-25T18:00:00+07:00").getTime();
function updateCountdown() {
  const distance = Math.max(0, eventDate - Date.now());
  const values = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor(distance / 3600000) % 24,
    minutes: Math.floor(distance / 60000) % 60,
    seconds: Math.floor(distance / 1000) % 60
  };
  Object.entries(values).forEach(([id, value]) => {
    $(`#${id}`).textContent = String(value).padStart(2, "0");
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$(".reveal").forEach((element) => revealObserver.observe(element));

const rsvpDialog = $("#rsvpDialog");
$$("[data-open-rsvp]").forEach((button) => button.addEventListener("click", () => rsvpDialog.showModal()));
$("[data-close-dialog]").addEventListener("click", () => rsvpDialog.close());
rsvpDialog.addEventListener("click", (event) => {
  const box = rsvpDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
    rsvpDialog.close();
  }
});

$("#rsvpForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get("name");
  const attendance = data.get("attendance");
  localStorage.setItem("birthday-rsvp", JSON.stringify({ name, attendance, sentAt: new Date().toISOString() }));
  rsvpDialog.close();
  showToast(attendance === "Hadir" ? `Yay! See you at the party, ${name} ♡` : `Thank you for letting us know, ${name} ♡`);
  if (attendance === "Hadir") burstConfetti();
  event.currentTarget.reset();
});

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3300);
}

let reelTimer;
let reelSlide = 0;
const reel = $("#reel");
const reelButton = $("#playReel");
const slides = $$(".reel__slides img");

function stopReel() {
  clearInterval(reelTimer);
  reel.classList.remove("playing");
  reelButton.textContent = "▶";
}
function playReel() {
  if (reel.classList.contains("playing")) return stopReel();
  reel.classList.remove("playing");
  void reel.offsetWidth;
  reel.classList.add("playing");
  reelButton.textContent = "Ⅱ";
  reelSlide = 0;
  slides.forEach((slide, index) => slide.classList.toggle("active", index === 0));
  reelTimer = setInterval(() => {
    reelSlide += 1;
    if (reelSlide >= slides.length) {
      stopReel();
      reelSlide = 0;
    }
    slides.forEach((slide, index) => slide.classList.toggle("active", index === reelSlide));
  }, 4000);
}
reelButton.addEventListener("click", playReel);

$("#showWish").addEventListener("click", () => {
  showToast("Your sweetest birthday wish has been sent ♡");
  burstConfetti();
});

function burstConfetti() {
  const canvas = $("#confetti");
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  context.scale(ratio, ratio);

  const colors = ["#075bbb", "#8ec5e4", "#f5f0e6", "#49382e"];
  const pieces = Array.from({ length: 80 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * .45,
    size: 3 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - .5) * 13,
    vy: -5 - Math.random() * 9,
    gravity: .24 + Math.random() * .12,
    rotation: Math.random() * Math.PI
  }));

  let frame = 0;
  function animate() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += piece.gravity;
      piece.rotation += .08;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .65);
      context.restore();
    });
    frame += 1;
    if (frame < 150) requestAnimationFrame(animate);
    else context.clearRect(0, 0, innerWidth, innerHeight);
  }
  animate();
}
