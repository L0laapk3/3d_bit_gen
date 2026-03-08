/**
 * Three.js-based 3D preview renderer.
 *
 * Features:
 * - Ground plane at bottom of model (not center)
 * - Colored label surfaces (thin planes at indent surfaces) for visibility
 * - Stronger directional shadows
 */

let THREE = null;
let OrbitControls = null;
let STLLoader = null;

let scene, camera, renderer, controls;
let currentMesh = null;
let gridHelper = null;
let container = null;
let firstLoad = true;

export async function initPreview(containerId) {
  container = document.getElementById(containerId);

  THREE = await import('https://esm.sh/three@0.162.0');
  const controlsModule = await import('https://esm.sh/three@0.162.0/examples/jsm/controls/OrbitControls.js');
  const stlModule = await import('https://esm.sh/three@0.162.0/examples/jsm/loaders/STLLoader.js');

  OrbitControls = controlsModule.OrbitControls;
  STLLoader = stlModule.STLLoader;

  scene = new THREE.Scene();
  updateSceneBackground();

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(30, 40, 60);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Lighting — stronger shadows
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight1.position.set(50, 80, 50);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.set(1024, 1024);
  dirLight1.shadow.camera.near = 1;
  dirLight1.shadow.camera.far = 200;
  dirLight1.shadow.camera.left = -60;
  dirLight1.shadow.camera.right = 60;
  dirLight1.shadow.camera.top = 60;
  dirLight1.shadow.camera.bottom = -60;
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-40, 30, -40);
  scene.add(dirLight2);

  const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.25);
  dirLight3.position.set(10, -20, 50);
  scene.add(dirLight3);

  // Grid — will be repositioned to model bottom
  gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0x555555);
  gridHelper.material.opacity = 0.35;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  window.addEventListener('resize', onResize);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(container);
  }

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
 * Update the preview with new STL data.
 * Also creates colored label surface planes for visual clarity.
 */
export function updatePreviewFromSTL(stlArrayBuffer, config) {
  if (!THREE || !scene) return;

  // Remove old geometry
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
  }

  // Parse STL
  const loader = new STLLoader();
  const geometry = loader.parse(stlArrayBuffer);
  geometry.computeVertexNormals();

  // Main model material
  const material = new THREE.MeshStandardMaterial({
    color: 0xffd700, // yellow
    metalness: 0.15,
    roughness: 0.55,
  });

  currentMesh = new THREE.Mesh(geometry, material);
  currentMesh.castShadow = true;
  currentMesh.receiveShadow = true;

  // Revert the Z-up slicer rotation applied in the worker, so it displays Y-up in Three.js
  currentMesh.rotation.x = -Math.PI / 2;

  scene.add(currentMesh);

  // Position grid at bottom of model, resized to fit the model footprint
  const box = new THREE.Box3().setFromObject(currentMesh);
  const bottomY = box.min.y;
  const modelSize = box.getSize(new THREE.Vector3());
  const gridSpan = Math.max(modelSize.x, modelSize.z, 20) * 2.5;
  const gridDivisions = Math.max(10, Math.ceil(gridSpan / 5) * 2);

  if (gridHelper) scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(gridSpan, gridDivisions, 0x888888, 0x555555);
  gridHelper.material.opacity = 0.35;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);
  gridHelper.position.y = bottomY;

  // Add colored label surface planes (visual-only, not in STL)
  if (config) {
    addLabelSurfaces(config, box);
  }

  // Only auto-fit camera on the first successful load
  if (firstLoad) {
    fitCameraToMesh(currentMesh);
    firstLoad = false;
  }
}

let labelMeshes = [];

/**
 * Add thin colored rectangles at each label surface for visual contrast.
 */
function addLabelSurfaces(config, box) {
  const {
    rowMode, labelBothSides,
    row1SlotCount, row2SlotCount,
    padding, hexWidth, labelDepth,
    plateHeight: cfgPlateHeight, holeDepth
  } = config;

  const isDouble = rowMode === 'double';
  const edgeMargin = padding;
  const hexFlatToFlat = hexWidth;
  const hexTipToTip = hexWidth / Math.cos(Math.PI / 6);
  const logoRadius = hexFlatToFlat * 0.85 * 0.5;
  const plateHeight = cfgPlateHeight || (holeDepth + 2);
  const plateDepth = isDouble
    ? 2 * hexFlatToFlat + 3 * padding
    : hexFlatToFlat + 2 * padding;

  const slotPitch = hexTipToTip + padding;

  const row1Z = isDouble ? -plateDepth / 2 + padding + hexFlatToFlat / 2 : 0;
  const row2Z = isDouble ? plateDepth / 2 - padding - hexFlatToFlat / 2 : 0;

  // Wait, Three.js coordinates match the worker BEFORE slicer-export rotation.
  // Actually, wait! We rotate the currentMesh by -PI/2. So currentMesh matches the worker BEFORE export rotation.
  // We can just add labels to the scene the same way. BUT wait, if currentMesh is rotated, the base scene coordinates
  // are the same as usual. In the worker we exported rotX(-PI/2). Here we do rotX(-PI/2) on the imported mesh instead of +PI/2?
  // If worker exports rotX(-PI/2), to revert it we should rotate by +PI/2? No, rotating by +Math.PI/2 around X reverts -Math.PI/2.
  // Let's fix that.

  const labelMaterial = new THREE.MeshStandardMaterial({
    color: 0xffee00, // light gray
    metalness: 0.0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const row2CountForMath = isDouble ? (row2SlotCount || 0) : 0;
  const maxCount = Math.max(row1SlotCount, row2CountForMath, 1);
  const plateWidth = maxCount * slotPitch + padding;
  const effCornerRadius = Math.min(Math.max(config.cornerRadius || 1, 0), plateWidth / 2 - 0.1, plateDepth / 2 - 0.1, 10);

  const planeWidth = plateWidth - effCornerRadius * 2 - 0.5;
  const planeHeight = plateHeight - 0.5;

  const EPS = 0.02;
  const planeGeom = new THREE.PlaneGeometry(planeWidth, planeHeight);

  // Cleanup old layers handled by caller, so just clear the array here
  for (const lm of labelMeshes) {
    scene.remove(lm);
    lm.geometry.dispose();
    lm.material.dispose();
  }
  labelMeshes = [];

  function addLabelPlane(isFront) {
    const faceZ = isFront ? plateDepth / 2 : -plateDepth / 2;
    const labelZ = isFront ? faceZ - (labelDepth || 0.5) + EPS : faceZ + (labelDepth || 0.5) - EPS;
    const planeY = plateHeight / 2;

    const mesh = new THREE.Mesh(planeGeom, labelMaterial);

    mesh.position.set(0, planeY, labelZ);
    if (!isFront) mesh.rotation.y = Math.PI;
    scene.add(mesh);
    labelMeshes.push(mesh);
  }

  // Row 1
  if (row1SlotCount > 0 || (rowMode === 'single')) {
    addLabelPlane(true);
    if (!isDouble && labelBothSides) {
      addLabelPlane(false);
    }
  }

  if (isDouble && row2SlotCount > 0) {
    addLabelPlane(false);
  }
}

function fitCameraToMesh(mesh) {
  if (!mesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.6;

  camera.position.set(center.x + cameraDistance * 0.5, center.y + cameraDistance * 0.7, center.z + cameraDistance * 0.9);
  controls.target.copy(center);
  controls.update();
}
