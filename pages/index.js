import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODULE_CANDIDATES = ['./dist/roki-three.js', '../dist/roki-three.js', '/dist/roki-three.js'];
const DEFAULT_PAIR = {
  id: 0,
  ztkPath: './assets/arm_2DoF.ztk',
  zvsPath: './assets/arm.zvs',
  ztkName: 'assets/arm_2DoF.ztk',
  zvsName: 'assets/arm.zvs',
};

const state = {
  scene: undefined,
  camera: undefined,
  renderer: undefined,
  actors: [],
  isPlaying: false,
  playbackTimeSec: 0,
  lastFrameTimeMs: 0,
  nextPairId: 1,
  rokiThreeModule: undefined,
  isPanelHidden: false,
};

bootstrap().catch((error) => {
  console.error(error);
  setStatus('Viewer init failed.');
});

async function bootstrap() {
  initScene();
  bindUiEvents();
  appendInitialPairs();
  window.addEventListener('resize', onWindowResize);
  state.lastFrameTimeMs = performance.now();

  try {
    await ensureRokiThreeModule();
  } catch (error) {
    console.error(error);
    setStatus('Viewer init failed: cannot load roki-three module.');
  }

  animate();
}

function initScene() {
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x505050);

  state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 0, 2.5);
  state.camera.lookAt(0, 0, 0);

  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setPixelRatio(window.devicePixelRatio);
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(state.renderer.domElement);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.setScalar(1024);
  directionalLight.position.set(5, 30, 5);
  state.scene.add(directionalLight);

  state.scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  const controls = new OrbitControls(state.camera, state.renderer.domElement);
  controls.update();

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.01),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000) }),
  );
  state.scene.add(origin);
}

function bindUiEvents() {
  document.getElementById('addPairButton')?.addEventListener('click', () => addCustomPairForm());
  document.getElementById('loadButton')?.addEventListener('click', () => loadSelectedPairs());
  document.getElementById('clearButton')?.addEventListener('click', () => clearAllActors());
  document.getElementById('playButton')?.addEventListener('click', () => playAnimation());
  document.getElementById('pauseButton')?.addEventListener('click', () => pauseAnimation());
  document.getElementById('restartButton')?.addEventListener('click', () => restartAnimation());
  document.getElementById('togglePanelButton')?.addEventListener('click', () => togglePanel());
}

function appendInitialPairs() {
  addDefaultPairForm();
  addCustomPairForm();
}

function pairsContainer() {
  return document.getElementById('pairs');
}

function addDefaultPairForm() {
  const container = pairsContainer();
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'pair';
  wrapper.dataset.pairId = String(DEFAULT_PAIR.id);
  wrapper.dataset.pairType = 'default';
  wrapper.dataset.ztkPath = DEFAULT_PAIR.ztkPath;
  wrapper.dataset.zvsPath = DEFAULT_PAIR.zvsPath;

  wrapper.innerHTML = `
    <div class="pairHeader">
      <label><input type="checkbox" class="pairEnabled" checked /> <strong>Pair 0</strong></label>
    </div>
    <div class="pairBody">
      <div class="defaultFileLine">ZTK file: ${DEFAULT_PAIR.ztkName}</div>
      <div class="defaultFileLine">ZVS file: ${DEFAULT_PAIR.zvsName}</div>
    </div>
  `;

  container.appendChild(wrapper);
}

function addCustomPairForm() {
  const container = pairsContainer();
  if (!container) return;

  const pairId = state.nextPairId;
  state.nextPairId += 1;

  const wrapper = document.createElement('div');
  wrapper.className = 'pair';
  wrapper.dataset.pairId = String(pairId);
  wrapper.dataset.pairType = 'custom';

  wrapper.innerHTML = `
    <div class="pairHeader">
      <label><input type="checkbox" class="pairEnabled" checked /> <strong>Pair ${pairId}</strong></label>
      <button type="button" class="removePair">Remove</button>
    </div>
    <div class="pairBody">
      <label>ZTK file
        <input type="file" class="ztkFile" accept=".ztk,text/plain" />
      </label>
      <label>ZVS file
        <input type="file" class="zvsFile" accept=".zvs,text/plain" />
      </label>
    </div>
  `;

  wrapper.querySelector('.removePair')?.addEventListener('click', () => {
    wrapper.remove();
  });

  container.appendChild(wrapper);
}

function setStatus(message) {
  const status = document.getElementById('status');
  if (status) status.textContent = message;
}

function updatePlaybackTimeLabel() {
  const label = document.getElementById('playbackTime');
  if (!label) return;
  label.textContent = `Time: ${state.playbackTimeSec.toFixed(2)}s`;
}

function togglePanel() {
  state.isPanelHidden = !state.isPanelHidden;
  const panel = document.getElementById('controlsPanel');
  const button = document.getElementById('togglePanelButton');

  if (panel) panel.style.display = state.isPanelHidden ? 'none' : '';
  if (button) button.textContent = state.isPanelHidden ? 'Show' : 'Hide';
}

async function loadSelectedPairs() {
  let rokiThree;
  try {
    rokiThree = await ensureRokiThreeModule();
  } catch (error) {
    console.error(error);
    setStatus('Cannot load roki-three module. Check dist path/server root.');
    return;
  }

  const selectedNodes = [...document.querySelectorAll('.pair')].filter(
    (node) => node.querySelector('.pairEnabled')?.checked,
  );

  if (selectedNodes.length === 0) {
    setStatus('No selected pair.');
    return;
  }

  setStatus('Loading selected pairs...');

  let loadedCount = 0;
  for (const node of selectedNodes) {
    try {
      const loaded = await loadPair(node, rokiThree);
      if (!loaded) continue;

      const { pairId, robot, sequence, displayName } = loaded;
      removeActorsByPairId(pairId);
      robot.position.set(0, 0, 0);
      state.scene.add(robot);
      state.actors.push({ pairId, robot, sequence });

      sequence.jumpTime(state.playbackTimeSec);
      robot.FK(sequence.data?.value);
      robot.name = displayName;
      loadedCount += 1;
    } catch (error) {
      console.error(error);
      setStatus(`Failed to load pair ${node.dataset.pairId}.`);
    }
  }

  if (loadedCount > 0) {
    setStatus(`Loaded ${loadedCount} pair(s).`);
  }
}

async function loadPair(node, rokiThree) {
  const pairId = Number(node.dataset.pairId ?? '-1');
  const pairType = node.dataset.pairType ?? 'custom';

  if (pairType === 'default') {
    const ztkPath = node.dataset.ztkPath ?? DEFAULT_PAIR.ztkPath;
    const zvsPath = node.dataset.zvsPath ?? DEFAULT_PAIR.zvsPath;
    const [ztkText, zvsText] = await Promise.all([fetchText(ztkPath), fetchText(zvsPath)]);
    const chainLoader = new rokiThree.ChainLoader();
    const sequenceLoader = new rokiThree.SequenceLoader();
    return {
      pairId,
      robot: chainLoader.parse(ztkText),
      sequence: sequenceLoader.parse(zvsText),
      displayName: `${DEFAULT_PAIR.ztkName} + ${DEFAULT_PAIR.zvsName}`,
    };
  }

  const ztkFile = node.querySelector('.ztkFile')?.files?.[0];
  const zvsFile = node.querySelector('.zvsFile')?.files?.[0];
  if (!ztkFile || !zvsFile) {
    setStatus('Some selected pairs are missing ztk/zvs file.');
    return null;
  }

  const [ztkText, zvsText] = await Promise.all([readFileText(ztkFile), readFileText(zvsFile)]);
  const chainLoader = new rokiThree.ChainLoader();
  const sequenceLoader = new rokiThree.SequenceLoader();

  return {
    pairId,
    robot: chainLoader.parse(ztkText),
    sequence: sequenceLoader.parse(zvsText),
    displayName: `${ztkFile.name} + ${zvsFile.name}`,
  };
}

function removeActorsByPairId(pairId) {
  for (let i = state.actors.length - 1; i >= 0; i--) {
    if (state.actors[i].pairId !== pairId) continue;
    state.actors[i].robot.removeFromParent();
    state.actors.splice(i, 1);
  }
}

function clearAllActors() {
  for (const actor of state.actors) {
    actor.robot.removeFromParent();
  }
  state.actors.length = 0;
  state.isPlaying = false;
  state.playbackTimeSec = 0;
  state.lastFrameTimeMs = performance.now();
  updatePlaybackTimeLabel();
  setStatus('Cleared all loaded models. Playback stopped and rewound.');
}

function playAnimation() {
  state.isPlaying = true;
  state.lastFrameTimeMs = performance.now();
  setStatus('Playing.');
}

function pauseAnimation() {
  state.isPlaying = false;
  setStatus('Paused.');
}

function restartAnimation() {
  state.playbackTimeSec = 0;
  state.lastFrameTimeMs = performance.now();
  for (const actor of state.actors) {
    actor.sequence.rewind();
    actor.robot.FK(actor.sequence.data?.value);
  }
  updatePlaybackTimeLabel();
  setStatus('Restarted from beginning.');
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (state.actors.length > 0) {
    const nowMs = performance.now();
    if (state.isPlaying) {
      state.playbackTimeSec += (nowMs - state.lastFrameTimeMs) / 1000;
    }
    state.lastFrameTimeMs = nowMs;

    for (const actor of state.actors) {
      actor.sequence.jumpTime(state.playbackTimeSec);
      actor.robot.FK(actor.sequence.data?.value);
    }
  }

  updatePlaybackTimeLabel();
  state.renderer.render(state.scene, state.camera);
}

async function ensureRokiThreeModule() {
  if (state.rokiThreeModule) return state.rokiThreeModule;

  let lastError;
  for (const candidate of MODULE_CANDIDATES) {
    try {
      state.rokiThreeModule = await import(candidate);
      return state.rokiThreeModule;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Failed to load roki-three module.');
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}
