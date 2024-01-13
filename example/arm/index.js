import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { ChainLoader, SequenceLoader } from 'roki'

let scene, camera, renderer, robot, sequence
const clock = new THREE.Clock()

init()
animate()

/*
coordinate settings
RoKi: [x, y, z] -> [forward, right, up]
Three: [x, y, z] -> [right, up, forward]
*/
function init() {
  // scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x505050)

  // camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 2)
  camera.lookAt(0, 0, 0)

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.setScalar(1024)
  directionalLight.position.set(5, 30, 5)
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  scene.add(ambientLight)

  // camera control
  const controls = new OrbitControls(camera, renderer.domElement)
  // controls.target.set(0, 0, 0);
  // controls.enablePan = false;
  // controls.enableDamping = true;
  controls.update()

  // origin point landmark
  const pointMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.01),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000) }),
  )
  scene.add(pointMesh)

  // load
  loadArm()
  loadSequence()

  window.addEventListener('resize', onWindowResize)
  clock.start()
}

function loadArm() {
  const manager = new THREE.LoadingManager()
  const loader = new ChainLoader(manager)
  loader.load('./arm_2DoF.ztk', (result) => {
    robot = result
  })

  manager.onLoad = () => {
    robot.transformToThree()
    scene.add(robot)
  }
}

function loadSequence() {
  const manager = new THREE.LoadingManager()
  const loader = new SequenceLoader(manager)
  loader.load('./arm.zvs', (result) => {
    sequence = result
  })
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  requestAnimationFrame(animate)

  if (robot !== undefined && sequence !== undefined) {
    sequence.jumpTime(clock.getElapsedTime())
    robot.FK(sequence.data.value)
    if (sequence.currentIsEnd()) {
      clock.start()
      sequence.rewind()
    }
  }

  renderer.render(scene, camera)
}
