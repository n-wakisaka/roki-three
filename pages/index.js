import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODULE_CANDIDATES = ['./dist/roki-three.js', '../dist/roki-three.js', '/dist/roki-three.js'];
const PAIR_CONFIG_VERSION = 1;
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
  document.getElementById('saveConfigButton')?.addEventListener('click', () => savePairConfigToFile());
  document.getElementById('loadConfigButton')?.addEventListener('click', () => triggerConfigLoad());
  document
    .getElementById('configFileInput')
    ?.addEventListener('change', (event) => handleConfigFileSelected(event));
  document.getElementById('playButton')?.addEventListener('click', () => playAnimation());
  document.getElementById('pauseButton')?.addEventListener('click', () => pauseAnimation());
  document.getElementById('restartButton')?.addEventListener('click', () => restartAnimation());
}

function appendInitialPairs() {
  addDefaultPairForm();
  addCustomPairForm();
}

function pairsContainer() {
  return document.getElementById('pairs');
}

function addDefaultPairForm(options = {}) {
  const container = pairsContainer();
  if (!container) return;
  const { enabled = true, ztkPath = DEFAULT_PAIR.ztkPath, zvsPath = DEFAULT_PAIR.zvsPath } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'pair';
  wrapper.dataset.pairId = String(DEFAULT_PAIR.id);
  wrapper.dataset.pairType = 'default';
  wrapper.dataset.ztkPath = ztkPath;
  wrapper.dataset.zvsPath = zvsPath;

  wrapper.innerHTML = `
    <div class="pairHeader">
      <label><input type="checkbox" class="pairEnabled" ${enabled ? 'checked' : ''} /> <strong>Pair 0</strong></label>
    </div>
    <div class="pairBody">
      <div class="defaultFileLine">ZTK file: ${ztkPath}</div>
      <div class="defaultFileLine">ZVS file: ${zvsPath}</div>
    </div>
  `;

  container.appendChild(wrapper);
}

function addCustomPairForm(options = {}) {
  const container = pairsContainer();
  if (!container) return;
  const {
    pairId,
    enabled = true,
    ztkPath = '',
    zvsPath = '',
    ztkSourceMode = 'file',
    zvsSourceMode = 'file',
  } = options;

  const actualPairId = pairId ?? state.nextPairId;
  state.nextPairId = Math.max(state.nextPairId, actualPairId + 1);

  const wrapper = document.createElement('div');
  wrapper.className = 'pair';
  wrapper.dataset.pairId = String(actualPairId);
  wrapper.dataset.pairType = 'custom';

  wrapper.innerHTML = `
    <div class="pairHeader">
      <label><input type="checkbox" class="pairEnabled" ${enabled ? 'checked' : ''} /> <strong>Pair ${actualPairId}</strong></label>
      <button type="button" class="removePair">Remove</button>
    </div>
    <div class="pairBody">
      <div>
        <div class="sourceTitle">
          ZTK
          <span class="toggleGroup">
            <label class="toggleOption"><input type="radio" class="ztkSourceMode" name="ztkSource-${actualPairId}" value="file" ${ztkSourceMode === 'file' ? 'checked' : ''} /><span>file</span></label>
            <label class="toggleOption"><input type="radio" class="ztkSourceMode" name="ztkSource-${actualPairId}" value="path" ${ztkSourceMode === 'path' ? 'checked' : ''} /><span>path</span></label>
          </span>
        </div>
        <label class="ztkFileRow">
          <input type="file" class="ztkFile" accept=".ztk,text/plain" />
        </label>
        <label class="ztkPathRow">
          <input type="text" class="ztkPath" value="${ztkPath}" placeholder="./assets/arm_2DoF.ztk" />
        </label>
      </div>
      <div>
        <div class="sourceTitle">
          ZVS
          <span class="toggleGroup">
            <label class="toggleOption"><input type="radio" class="zvsSourceMode" name="zvsSource-${actualPairId}" value="file" ${zvsSourceMode === 'file' ? 'checked' : ''} /><span>file</span></label>
            <label class="toggleOption"><input type="radio" class="zvsSourceMode" name="zvsSource-${actualPairId}" value="path" ${zvsSourceMode === 'path' ? 'checked' : ''} /><span>path</span></label>
          </span>
        </div>
        <label class="zvsFileRow">
          <input type="file" class="zvsFile" accept=".zvs,text/plain" />
        </label>
        <label class="zvsPathRow">
          <input type="text" class="zvsPath" value="${zvsPath}" placeholder="./assets/arm.zvs" />
        </label>
      </div>
    </div>
  `;

  wrapper.querySelectorAll('.ztkSourceMode, .zvsSourceMode').forEach((radio) => {
    radio.addEventListener('change', () => applyCustomPairSourceMode(wrapper));
  });
  wrapper.querySelector('.removePair')?.addEventListener('click', () => {
    wrapper.remove();
  });

  applyCustomPairSourceMode(wrapper);
  container.appendChild(wrapper);
}

function applyCustomPairSourceMode(wrapper) {
  const ztkMode = wrapper.querySelector('.ztkSourceMode:checked')?.value ?? 'file';
  const zvsMode = wrapper.querySelector('.zvsSourceMode:checked')?.value ?? 'file';
  const ztkFile = wrapper.querySelector('.ztkFile');
  const zvsFile = wrapper.querySelector('.zvsFile');
  const ztkPath = wrapper.querySelector('.ztkPath');
  const zvsPath = wrapper.querySelector('.zvsPath');
  const ztkFileRow = wrapper.querySelector('.ztkFileRow');
  const ztkPathRow = wrapper.querySelector('.ztkPathRow');
  const zvsFileRow = wrapper.querySelector('.zvsFileRow');
  const zvsPathRow = wrapper.querySelector('.zvsPathRow');

  if (ztkFile) ztkFile.disabled = ztkMode !== 'file';
  if (zvsFile) zvsFile.disabled = zvsMode !== 'file';
  if (ztkPath) ztkPath.disabled = ztkMode !== 'path';
  if (zvsPath) zvsPath.disabled = zvsMode !== 'path';
  if (ztkFileRow) ztkFileRow.style.display = ztkMode === 'file' ? '' : 'none';
  if (ztkPathRow) ztkPathRow.style.display = ztkMode === 'path' ? '' : 'none';
  if (zvsFileRow) zvsFileRow.style.display = zvsMode === 'file' ? '' : 'none';
  if (zvsPathRow) zvsPathRow.style.display = zvsMode === 'path' ? '' : 'none';
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
  const ztkPath = node.querySelector('.ztkPath')?.value?.trim() ?? '';
  const zvsPath = node.querySelector('.zvsPath')?.value?.trim() ?? '';
  const ztkMode = node.querySelector('.ztkSourceMode:checked')?.value ?? 'file';
  const zvsMode = node.querySelector('.zvsSourceMode:checked')?.value ?? 'file';
  let ztkText;
  let zvsText;
  let ztkDisplayName;
  let zvsDisplayName;

  if (ztkMode === 'path') {
    if (!ztkPath) {
      setStatus('Some selected pairs are missing ztk path.');
      return null;
    }
    ztkText = await fetchText(ztkPath);
    ztkDisplayName = ztkPath;
  } else {
    if (!ztkFile) {
      setStatus('Some selected pairs are missing ztk file.');
      return null;
    }
    ztkText = await readFileText(ztkFile);
    ztkDisplayName = ztkFile.name;
  }

  if (zvsMode === 'path') {
    if (!zvsPath) {
      setStatus('Some selected pairs are missing zvs path.');
      return null;
    }
    zvsText = await fetchText(zvsPath);
    zvsDisplayName = zvsPath;
  } else {
    if (!zvsFile) {
      setStatus('Some selected pairs are missing zvs file.');
      return null;
    }
    zvsText = await readFileText(zvsFile);
    zvsDisplayName = zvsFile.name;
  }

  const chainLoader = new rokiThree.ChainLoader();
  const sequenceLoader = new rokiThree.SequenceLoader();

  return {
    pairId,
    robot: chainLoader.parse(ztkText),
    sequence: sequenceLoader.parse(zvsText),
    displayName: `${ztkDisplayName} + ${zvsDisplayName}`,
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

function collectPairConfig() {
  const pairNodes = [...document.querySelectorAll('.pair')];
  const pairs = pairNodes.map((node) => {
    const pairType = node.dataset.pairType ?? 'custom';
    if (pairType === 'default') {
      return {
        id: Number(node.dataset.pairId ?? 0),
        type: 'default',
        enabled: Boolean(node.querySelector('.pairEnabled')?.checked),
        ztkPath: node.dataset.ztkPath ?? DEFAULT_PAIR.ztkPath,
        zvsPath: node.dataset.zvsPath ?? DEFAULT_PAIR.zvsPath,
      };
    }
    return {
      id: Number(node.dataset.pairId ?? -1),
      type: 'custom',
      enabled: Boolean(node.querySelector('.pairEnabled')?.checked),
      ztkSourceMode: node.querySelector('.ztkSourceMode:checked')?.value === 'path' ? 'path' : 'file',
      zvsSourceMode: node.querySelector('.zvsSourceMode:checked')?.value === 'path' ? 'path' : 'file',
      ztkPath: node.querySelector('.ztkPath')?.value?.trim() ?? '',
      zvsPath: node.querySelector('.zvsPath')?.value?.trim() ?? '',
    };
  });

  return {
    version: PAIR_CONFIG_VERSION,
    pairs,
  };
}

function savePairConfigToFile() {
  const config = collectPairConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'roki-three-pairs.json';
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus('Saved pair config to JSON file.');
}

function triggerConfigLoad() {
  const input = document.getElementById('configFileInput');
  if (!input) return;
  input.click();
}

async function handleConfigFileSelected(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;

  try {
    const text = await readFileText(file);
    const config = JSON.parse(text);
    applyPairConfig(config);
    setStatus('Loaded pair config.');
  } catch (error) {
    console.error(error);
    setStatus('Failed to load pair config.');
  } finally {
    input.value = '';
  }
}

function applyPairConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config format.');
  }
  if (config.version !== PAIR_CONFIG_VERSION || !Array.isArray(config.pairs)) {
    throw new Error('Unsupported config version or pairs format.');
  }

  const container = pairsContainer();
  if (!container) return;

  clearAllActors();
  container.innerHTML = '';
  state.nextPairId = 1;

  const normalized = [...config.pairs].sort((a, b) => Number(a.id) - Number(b.id));
  const defaultPair = normalized.find((pair) => pair.type === 'default' && Number(pair.id) === 0);
  addDefaultPairForm({
    enabled: defaultPair ? Boolean(defaultPair.enabled) : true,
    ztkPath: defaultPair?.ztkPath ?? DEFAULT_PAIR.ztkPath,
    zvsPath: defaultPair?.zvsPath ?? DEFAULT_PAIR.zvsPath,
  });

  const customPairs = normalized.filter(
    (pair) => pair.type === 'custom' && Number.isInteger(Number(pair.id)) && Number(pair.id) > 0,
  );

  if (customPairs.length === 0) {
    addCustomPairForm();
    return;
  }

  for (const pair of customPairs) {
    addCustomPairForm({
      pairId: Number(pair.id),
      enabled: Boolean(pair.enabled),
      ztkSourceMode: (pair.ztkSourceMode ?? pair.sourceMode) === 'path' ? 'path' : 'file',
      zvsSourceMode: (pair.zvsSourceMode ?? pair.sourceMode) === 'path' ? 'path' : 'file',
      ztkPath: typeof pair.ztkPath === 'string' ? pair.ztkPath : '',
      zvsPath: typeof pair.zvsPath === 'string' ? pair.zvsPath : '',
    });
  }
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
