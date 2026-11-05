import { AutumnScene } from './scene.js';
import { soundEngine } from './audio.js';
import confetti from 'canvas-confetti';

// Detailed lore content matching the 3D model
const LANDMARK_DATA = {
  'sacred-tree': {
    title: 'The Sacred Maple',
    kanji: '神木',
    jpSubtitle: '黄金と紅蓮の御神木',
    haikuJp: '秋風や 白木の枝に 紅葉散る',
    haikuEn: 'Autumn breeze blowing — / Upon white branches softly / Red leaves flutter down.',
    desc: 'The ancient centerpiece of Aki no Shima. Its multi-tiered crown of dodecahedron foliage clusters burns with vermilion, amber, and golden maple leaves. Legends tell that the tree’s deep roots anchor the island against the gravitational slipstreams of the sky.',
    specs: [
      { label: 'Foliage Cluster', val: '4 Dodecahedrons' },
      { label: 'Trunk Wood', val: 'Ancient Cedar' },
      { label: 'Elevation', val: '+4.38m Leyline' },
      { label: 'Leaf Palette', val: 'Vermilion & Saffron' }
    ]
  },
  'tea-sanctuary': {
    title: 'Matcha & Wagashi Sanctuary',
    kanji: '茶席',
    jpSubtitle: '静寂の秋野点',
    haikuJp: '濃茶汲む 指先に触る 秋の風',
    haikuEn: 'Pouring thick matcha — / To the tips of my fingers, / Autumn coolness clings.',
    desc: 'A solitary handcrafted bamboo and wrought iron bench rests beneath the falling leaves. Atop it sits a freshly whisked bowl of frothy Uji matcha in a rustic stoneware chawan, paired with a multi-layered autumn chestnut wagashi cake. Designed for quiet reflection.',
    specs: [
      { label: 'Chawan Ceramic', val: 'Coarse Stoneware' },
      { label: 'Tea Variety', val: 'First-Flush Uji' },
      { label: 'Confection', val: 'Kuri Wagashi Cake' },
      { label: 'Bench Craft', val: 'Hinoki & Iron' }
    ]
  },
  'vermilion-bridge': {
    title: 'Vermilion Arch Bridge',
    kanji: '太鼓橋',
    jpSubtitle: '浮遊峡の太鼓橋',
    haikuJp: '紅の橋 渡れば雲の 秋深し',
    haikuEn: 'Crossing the red bridge — / Deep into autumnal clouds, / Silence gently falls.',
    desc: 'An arched wooden Japanese bridge lacquered in sacred vermilion cinnabar, with weathered dark cedar planks. It spans the chasm between the main sanctuary island and the floating satellite crags, framing the cascading maple leaves.',
    specs: [
      { label: 'Architecture', val: 'Soribashi Arch' },
      { label: 'Finish', val: 'Cinnabar Lacquer' },
      { label: 'Decking', val: 'Aged Cedar Planks' },
      { label: 'Span', val: '3.6 Meters' }
    ]
  },
  'moss-monument': {
    title: 'Ancient Shinto Monument',
    kanji: '碑石',
    jpSubtitle: '苔生す千年の標石',
    haikuJp: '石一つ 苔をまといて 秋深し',
    haikuEn: 'One ancient boulder / Dressed in verdant coats of moss / Deep within autumn.',
    desc: 'A monolithic carved granite marker nestled among wild moss and fern tufts. Ancient travelers carved sacred geometric wards upon its surface to harmonize the island’s anti-gravity crystals with the earth below.',
    specs: [
      { label: 'Material', val: 'River Granite' },
      { label: 'Flora Cushion', val: 'Racomitrium Moss' },
      { label: 'Stepping Path', val: '14 Pentagon Stones' },
      { label: 'Age', val: 'Over 800 Years' }
    ]
  },
  'floating-isles': {
    title: 'Levitating Sky Isles',
    kanji: '浮島',
    jpSubtitle: '虚空に浮かぶ秋の群島',
    haikuJp: '浮島や 風に身を任せ 秋を行く',
    haikuEn: 'Floating islands drift — / Entrusting bodies to wind, / Sailing through autumn.',
    desc: 'Six miniature satellite islands levitate peacefully around the perimeter. Each crag possesses its own gravitational rhythm, gently bobbing on invisible celestial thermal currents while draped in golden autumn grasses.',
    specs: [
      { label: 'Satellite Count', val: '6 Floating Isles' },
      { label: 'Harmonic Bob', val: '0.8 to 1.3 Hz' },
      { label: 'Bedrock', val: 'Stratified Basalt' },
      { label: 'Flora Cover', val: 'Alpine Moss Tufts' }
    ]
  },
  'shoji-lantern': {
    title: 'Twilight Shoji Lantern',
    kanji: '灯篭',
    jpSubtitle: '夜道を照らす和紙の灯',
    haikuJp: 'ともし火の 揺れて暮れゆく 紅葉かな',
    haikuEn: 'Flickering warm flame / As the evening fades away / Glowing maple leaves.',
    desc: 'An authentic Japanese wall lantern constructed from charred dark cypress lattice and translucent mulberry washi paper. As dusk falls, its gentle amber hearth glows warmly to guide travelers across the mountain path.',
    specs: [
      { label: 'Frame', val: 'Yakisugi Cypress' },
      { label: 'Screen', val: 'Mulberry Washi' },
      { label: 'Luminance', val: 'Warm Amber 2200K' },
      { label: 'Flicker Cycle', val: 'Natural Wind Pulse' }
    ]
  }
};

// Wish tree initial messages
let wishes = [
  { text: 'May this autumn bring clarity and peace like a still mountain pond.', date: 'November 4, 2026' },
  { text: 'Quiet moments with warm tea and falling maple leaves.', date: 'November 3, 2026' },
  { text: 'Wishing harmony for all who journey across these sky islands.', date: 'October 30, 2026' }
];

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const scene = new AutumnScene(container);

  // Hotspot DOM management
  const hotspotContainer = document.getElementById('hotspots-layer');
  const hotspotElements = new Map();

  scene.hotspots.forEach(spot => {
    const pin = document.createElement('div');
    pin.className = 'hotspot-pin';
    pin.id = `pin-${spot.id}`;
    pin.innerHTML = `
      <div class="hotspot-pulse"></div>
      <div class="hotspot-inner">
        <span class="hotspot-kanji">${spot.kanji}</span>
        <span class="hotspot-label">${spot.title}</span>
      </div>
    `;

    pin.addEventListener('click', () => {
      openLandmarkDrawer(spot.id);
      scene.flyToHotspot(spot.id);
      soundEngine.playChime(659.25);
    });

    hotspotContainer.appendChild(pin);
    hotspotElements.set(spot.id, pin);
  });

  // Hotspot projected position update loop
  scene.onFrame = () => {
    const coords = scene.getHotspotScreenCoords();
    coords.forEach(c => {
      const el = hotspotElements.get(c.id);
      if (el) {
        if (c.isVisible && c.screenX >= 0 && c.screenX <= scene.width && c.screenY >= 0 && c.screenY <= scene.height) {
          el.style.display = 'block';
          el.style.left = `${c.screenX}px`;
          el.style.top = `${c.screenY}px`;
        } else {
          el.style.display = 'none';
        }
      }
    });

    // Update Telemetry HUD
    const camPosElem = document.getElementById('telemetry-cam');
    if (camPosElem) {
      const p = scene.camera.position;
      camPosElem.textContent = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
    }
  };

  // Auto-Rotate button
  const autoRotateBtn = document.getElementById('btn-autorotate');
  if (autoRotateBtn) {
    autoRotateBtn.classList.add('active'); // On by default
    autoRotateBtn.addEventListener('click', () => {
      scene.controls.autoRotate = !scene.controls.autoRotate;
      autoRotateBtn.classList.toggle('active', scene.controls.autoRotate);
    });
  }

  // Landmark Drawer
  const drawer = document.getElementById('landmark-drawer');
  const drawerClose = document.getElementById('drawer-close');
  const drawerKanji = document.getElementById('drawer-kanji');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerJpSub = document.getElementById('drawer-jp-sub');
  const drawerHaikuJp = document.getElementById('drawer-haiku-jp');
  const drawerHaikuEn = document.getElementById('drawer-haiku-en');
  const drawerDesc = document.getElementById('drawer-desc');
  const drawerSpecs = document.getElementById('drawer-specs');
  const drawerFlyBtn = document.getElementById('drawer-btn-fly');

  let currentDrawerId = null;

  function openLandmarkDrawer(id) {
    const data = LANDMARK_DATA[id];
    if (!data) return;
    currentDrawerId = id;

    drawerKanji.textContent = data.kanji;
    drawerTitle.textContent = data.title;
    drawerJpSub.textContent = data.jpSubtitle;
    drawerHaikuJp.textContent = data.haikuJp;
    drawerHaikuEn.textContent = data.haikuEn;
    drawerDesc.textContent = data.desc;

    drawerSpecs.innerHTML = data.specs.map(s => `
      <div class="spec-item">
        <span class="spec-lbl">${s.label}</span>
        <span class="spec-val">${s.val}</span>
      </div>
    `).join('');

    drawer.classList.add('open');

    // Pause auto-orbit while inspecting the landmark details
    scene.controls.autoRotate = false;
    if (autoRotateBtn) autoRotateBtn.classList.remove('active');

    // Update active state in camera dock
    camBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.cam === id);
    });
  }

  function closeLandmarkDrawer() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    currentDrawerId = null;

    // Zoom back out to original overview size
    scene.resetCamera();

    // Resume auto-orbit
    scene.controls.autoRotate = true;
    if (autoRotateBtn) autoRotateBtn.classList.add('active');

    // Reset camera dock to Overview
    camBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.cam === 'reset');
    });

    soundEngine.playChime(523.25);
  }

  if (drawerClose) drawerClose.addEventListener('click', closeLandmarkDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeLandmarkDrawer();
    }
  });

  if (drawerFlyBtn) {
    drawerFlyBtn.addEventListener('click', () => {
      if (currentDrawerId) {
        scene.flyToHotspot(currentDrawerId);
      }
    });
  }

  // Camera Dock Buttons
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.cam;

      if (target === 'reset') {
        scene.resetCamera();
        closeLandmarkDrawer();
      } else {
        scene.flyToHotspot(target);
        openLandmarkDrawer(target);
      }
      soundEngine.playChime(587.33);
    });
  });

  // Time-of-Day controls
  const timeBtns = document.querySelectorAll('.time-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.time;
      scene.setTimePreset(preset);
      soundEngine.setMode(preset);

      const timeLabel = document.getElementById('telemetry-time');
      if (timeLabel) {
        timeLabel.textContent = preset.toUpperCase();
      }
    });
  });


  // Snapshot capture button
  const snapshotBtn = document.getElementById('btn-snapshot');
  if (snapshotBtn) {
    snapshotBtn.addEventListener('click', () => {
      const dataUrl = scene.captureSnapshot();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `autumnal-islands-${Date.now()}.png`;
      a.click();
      soundEngine.playChime(739.99);
    });
  }

  // Settings Drawer Toggle
  const settingsBtn = document.getElementById('btn-settings');
  const settingsDrawer = document.getElementById('settings-drawer');
  const settingsClose = document.getElementById('settings-close');

  if (settingsBtn && settingsDrawer) {
    settingsBtn.addEventListener('click', () => settingsDrawer.classList.toggle('open'));
  }
  if (settingsClose && settingsDrawer) {
    settingsClose.addEventListener('click', () => settingsDrawer.classList.remove('open'));
  }

  // Leaf Density Slider
  const leafSlider = document.getElementById('slider-leaves');
  if (leafSlider) {
    leafSlider.addEventListener('input', (e) => {
      scene.setLeafDensity(parseFloat(e.target.value));
    });
  }

  // Render Mode Buttons
  const renderBtns = document.querySelectorAll('.render-mode-btn');
  renderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      renderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scene.setRenderMode(btn.dataset.mode);
    });
  });

  // Audio Pill Toggle
  const audioPill = document.getElementById('audio-pill');
  if (audioPill) {
    audioPill.addEventListener('click', () => {
      const isPlaying = soundEngine.toggle();
      audioPill.classList.toggle('active', isPlaying);
      const txt = audioPill.querySelector('.audio-text');
      if (txt) txt.textContent = isPlaying ? 'Zen Sounds: ON' : 'Ambient Audio';
    });
  }

  // Gallery Card "Fly in 3D" triggers
  const galleryFlyBtns = document.querySelectorAll('.btn-gallery-fly');
  galleryFlyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.spot;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        scene.flyToHotspot(id);
        openLandmarkDrawer(id);
      }, 500);
    });
  });

  // Wish Tree logic
  const wishForm = document.getElementById('wish-form');
  const wishInput = document.getElementById('wish-input');
  const wishGrid = document.getElementById('wish-grid');

  function renderWishes() {
    if (!wishGrid) return;
    wishGrid.innerHTML = wishes.map(w => `
      <div class="wish-leaf-card">
        <div class="wish-leaf-icon">🍁</div>
        <p class="wish-text">${escapeHtml(w.text)}</p>
        <span class="wish-date">${w.date}</span>
      </div>
    `).join('');
  }

  if (wishForm) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = wishInput.value.trim();
      if (!val) return;

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      wishes.unshift({ text: val, date: dateStr });
      renderWishes();
      wishInput.value = '';

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#d4482b', '#e88622', '#f2a93b', '#527329']
      });

      soundEngine.playChime(659.25);
    });
  }

  renderWishes();

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
