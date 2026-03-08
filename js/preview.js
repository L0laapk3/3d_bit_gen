/**
 * Three.js-based 3D preview renderer.
 * Converts JSCAD geometry → STL binary → Three.js mesh.
 */

let THREE = null;
let OrbitControls = null;
let STLLoader = null;

let scene, camera, renderer, controls;
let currentMesh = null;
let gridHelper = null;
let container = null;

export async function initPreview(containerId) {
  container = document.getElementById(containerId);

  // Load Three.js from CDN
  THREE = await import('https://esm.sh/three@0.162.0');
  const controlsModule = await import('https://esm.sh/three@0.162.0/examples/jsm/controls/OrbitControls.js');
  const stlModule = await import('https://esm.sh/three@0.162.0/examples/jsm/loaders/STLLoader.js');

  OrbitControls = controlsModule.OrbitControls;
  STLLoader = stlModule.STLLoader;

  // Setup scene
  scene = new THREE.Scene();
  updateSceneBackground();

  // Camera
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(30, 40, 60);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Lighting — well-lit from all sides
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(50, 80, 50);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-50, 40, -30);
  scene.add(dirLight2);

  const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.3);
  dirLight3.position.set(0, -30, 50);
  scene.add(dirLight3);

  // Grid
  gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0x444444);
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Resize handler
  window.addEventListener('resize', onResize);
  // Also observe container resize
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(container);
  }

  // Theme change listener (update background)
  const observer = new MutationObserver(() => updateSceneBackground());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  animate();
}

function updateSceneBackground() {
  if (!scene || !THREE) return;
  const theme = document.documentElement.getAttribute('data-theme');
  scene.background = new THREE.Color(theme === 'dark' ? 0x151720 : 0xe2e6ec);
}

function onResize() {
  if (!container || !camera || !renderer) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

/**
 * Update the preview with new STL data (ArrayBuffer).
 */
export function updatePreviewFromSTL(stlArrayBuffer) {
  if (!THREE || !scene) return;

  // Remove old mesh
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    currentMesh = null;
  }

  // Parse STL
  const loader = new STLLoader();
  const geometry = loader.parse(stlArrayBuffer);
  geometry.computeVertexNormals();

  // Material
  const material = new THREE.MeshStandardMaterial({
    color: 0x5a9cf5,
    metalness: 0.15,
    roughness: 0.6,
  });

  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);

  // Auto-fit camera
  fitCameraToMesh(currentMesh);
}

function fitCameraToMesh(mesh) {
  if (!mesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;

  camera.position.set(center.x + cameraDistance * 0.5, center.y + cameraDistance * 0.6, center.z + cameraDistance * 0.8);
  controls.target.copy(center);
  controls.update();
}
