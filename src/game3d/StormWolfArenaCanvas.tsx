import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createDruidModel,
  createStormWolfModel,
  createRavenModel,
  createSpiritAltarModel,
  createEnemyModel,
  groundHeightAt,
  EnemyKind,
} from './models';
import {
  createGroundTextures,
  createStoneTexture,
  createContactShadowTexture,
} from './textures';
import { gameAudio } from '../audio/gameAudio';

export type ArenaGamePhase = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';

export interface ArenaHudSnapshot {
  hp: number;
  maxHp: number;
  spirit: number;
  maxSpirit: number;
  wave: number;
  maxWaves: number;
  score: number;
  kills: number;
  packleaderResets: number;
  cdWolves: number;
  cdCreeper: number;
  cdRavens: number;
  cdDash: number;
  bannerText: string | null;
  enemiesRemaining: number;
}

export interface ArenaControlApi {
  startNewRun: () => void;
  triggerSkill: (slot: 1 | 2 | 3 | 'dash' | 'basic') => void;
}

interface StormWolfArenaCanvasProps {
  phase: ArenaGamePhase;
  onPhaseChange: (phase: ArenaGamePhase) => void;
  onHudUpdate: (hud: ArenaHudSnapshot) => void;
  apiRef: React.MutableRefObject<ArenaControlApi | null>;
}

// Pre-allocated scratch math helpers (Zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  mesh: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  skinMat: THREE.MeshStandardMaterial;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  poisonedTimer: number;
  vulnerableTimer: number;
  rootedTimer: number;
  hitFlashTimer: number;
  attackCooldown: number;
  windupTimer: number;
  windupMax: number;
  telegraphRing: THREE.Mesh;
  targetX: number;
  targetZ: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  colorHex: number;
}

interface GroundFxRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
}

export const StormWolfArenaCanvas: React.FC<StormWolfArenaCanvasProps> = ({
  phase,
  onPhaseChange,
  onHudUpdate,
  apiRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<ArenaGamePhase>(phase);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onHudUpdateRef = useRef(onHudUpdate);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    onHudUpdateRef.current = onHudUpdate;
  }, [onHudUpdate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL via GPU renderer string
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const fogColor = 0x0b1017;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.022);

    // Mandatory studio PBR environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.2,
      140
    );

    // Warm/Cool Three-Point Studio & Atmosphere Lighting
    const hemiLight = new THREE.HemisphereLight(0x7aa2d4, 0x1c1914, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffcb8b, 2.25);
    keyLight.position.set(16, 26, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 70;
    const d = 26;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-18, 12, -18);
    scene.add(rimLight);

    const altarGlowLight = new THREE.PointLight(0x38bdf8, 2.6, 14, 1.8);
    altarGlowLight.position.set(0, 3.2, 0);
    scene.add(altarGlowLight);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const groundTex = createGroundTextures(maxAniso);
    const stoneTex = createStoneTexture(maxAniso);
    const shadowTex = createContactShadowTexture();

    // Extended Scosglen Forest Terrain
    const terrainGeo = new THREE.PlaneGeometry(140, 140, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, groundHeightAt(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: groundTex.map,
      bumpMap: groundTex.bumpMap,
      bumpScale: 0.12,
      roughness: 0.92,
      metalness: 0.04,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Carved Rune Ring on Ground around Altar (with polygonOffset to avoid Z-fighting)
    const arenaRingGeo = new THREE.RingGeometry(17.5, 18.2, 64);
    arenaRingGeo.rotateX(-Math.PI / 2);
    const arenaRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.32,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const arenaRingMesh = new THREE.Mesh(arenaRingGeo, arenaRingMat);
    arenaRingMesh.position.y = 0.05;
    scene.add(arenaRingMesh);

    // Spirit Altar Centerpiece
    const altar = createSpiritAltarModel(stoneTex, shadowTex);
    altar.group.position.set(0, groundHeightAt(0, 0), 0);
    scene.add(altar.group);

    // Natural Outdoor Perimeter: InstancedMesh Pine Trees & Mossy Boulders
    const treeCount = 54;
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.42, 3.2, 7);
    trunkGeo.translate(0, 1.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2c1e16, roughness: 0.94, metalness: 0.02 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunkInst.castShadow = !isSoftwareGl;
    trunkInst.receiveShadow = true;

    const boughGeo = new THREE.ConeGeometry(1.7, 3.6, 7);
    boughGeo.translate(0, 4.1, 0);
    const boughMat = new THREE.MeshStandardMaterial({ color: 0x162920, roughness: 0.88, metalness: 0.02 });
    const boughInst = new THREE.InstancedMesh(boughGeo, boughMat, treeCount * 2);
    boughInst.castShadow = !isSoftwareGl;

    let treeSeed = 9001;
    const trand = () => {
      treeSeed = (treeSeed * 16807) % 2147483647;
      return (treeSeed - 1) / 2147483646;
    };

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (trand() - 0.5) * 0.14;
      const radius = 21.5 + trand() * 18;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      const ty = groundHeightAt(tx, tz) - 0.1;
      const scaleVar = 0.85 + trand() * 0.45; // ±15%+ organic scale

      _dummy.position.set(tx, ty, tz);
      _dummy.rotation.set(0, trand() * Math.PI * 2, 0);
      _dummy.scale.set(scaleVar, scaleVar * (0.9 + trand() * 0.25), scaleVar);
      _dummy.updateMatrix();
      trunkInst.setMatrixAt(i, _dummy.matrix);

      // Lower bough
      boughInst.setMatrixAt(i * 2, _dummy.matrix);
      _color.setHSL(0.41 + (trand() - 0.5) * 0.04, 0.3, 0.12 + trand() * 0.05);
      boughInst.setColorAt(i * 2, _color);

      // Upper bough
      _dummy.position.set(tx, ty + 1.5 * scaleVar, tz);
      _dummy.scale.set(scaleVar * 0.72, scaleVar * 0.82, scaleVar * 0.72);
      _dummy.updateMatrix();
      boughInst.setMatrixAt(i * 2 + 1, _dummy.matrix);
      boughInst.setColorAt(i * 2 + 1, _color);
    }
    trunkInst.computeBoundingSphere();
    boughInst.computeBoundingSphere();
    scene.add(trunkInst);
    scene.add(boughInst);

    // Perimeter Mossy Boulders (InstancedMesh)
    const rockCount = 34;
    const rockGeo = new THREE.DodecahedronGeometry(1.1, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.9,
      metalness: 0.08,
    });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInst.castShadow = !isSoftwareGl;
    rockInst.receiveShadow = true;

    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2 + trand() * 0.2;
      const rad = 19.2 + trand() * 4.5;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;
      const ry = groundHeightAt(rx, rz);
      const s = 0.75 + trand() * 0.8;
      _dummy.position.set(rx, ry + s * 0.28, rz);
      _dummy.rotation.set(trand() * 0.4, trand() * Math.PI, trand() * 0.4);
      _dummy.scale.set(s * 1.2, s * 0.75, s);
      _dummy.updateMatrix();
      rockInst.setMatrixAt(i, _dummy.matrix);
      _color.setHSL(0.1, 0.05, 0.25 + trand() * 0.12);
      rockInst.setColorAt(i, _color);
    }
    rockInst.computeBoundingSphere();
    scene.add(rockInst);

    // Player Druid
    const druid = createDruidModel(shadowTex);
    const playerState = {
      x: 0,
      z: 5.5,
      vx: 0,
      vz: 0,
      facing: Math.PI,
      hp: 100,
      maxHp: 100,
      spirit: 100,
      maxSpirit: 100,
      invulnTimer: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirZ: 1,
      basicSwingTimer: 0,
    };
    druid.group.position.set(playerState.x, groundHeightAt(playerState.x, playerState.z), playerState.z);
    scene.add(druid.group);

    // 3 Storm Werewolf Companions
    const wolves = [0, 1, 2].map((idx) => {
      const model = createStormWolfModel(shadowTex);
      const angle = (idx / 3) * Math.PI * 2;
      const wx = playerState.x + Math.cos(angle) * 2.5;
      const wz = playerState.z + Math.sin(angle) * 2.5;
      model.group.position.set(wx, groundHeightAt(wx, wz), wz);
      scene.add(model.group);
      return {
        ...model,
        x: wx,
        z: wz,
        yOffset: 0,
        leapTimer: 0,
        leapStartX: wx,
        leapStartZ: wz,
        leapTargetX: wx,
        leapTargetZ: wz,
        attackTimer: 0,
        orbitAngle: angle,
      };
    });

    // 3 Orbiting Ravens
    const ravens = [0, 1, 2].map((idx) => {
      const r = createRavenModel();
      scene.add(r.group);
      return {
        ...r,
        angle: (idx / 3) * Math.PI * 2,
        diveTimer: 0,
        targetX: 0,
        targetZ: 0,
      };
    });

    // Pooled Particles via InstancedMesh
    const MAX_PARTICLES = 140;
    const particleGeo = new THREE.OctahedronGeometry(0.14, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInst = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
    particleInst.frustumCulled = false;
    scene.add(particleInst);

    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      scale: 0,
      colorHex: 0x38bdf8,
    }));

    function spawnParticles(
      x: number,
      y: number,
      z: number,
      count: number,
      colorHex: number,
      speed = 6.5,
      scale = 1.0
    ) {
      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        const p = particles[i];
        if (!p.active) {
          p.active = true;
          p.x = x;
          p.y = y;
          p.z = z;
          const a = Math.random() * Math.PI * 2;
          const sp = speed * (0.4 + Math.random() * 0.8);
          p.vx = Math.cos(a) * sp;
          p.vy = 2.0 + Math.random() * 4.5;
          p.vz = Math.sin(a) * sp;
          p.life = 0;
          p.maxLife = 0.35 + Math.random() * 0.35;
          p.scale = scale * (0.6 + Math.random() * 0.8);
          p.colorHex = colorHex;
          spawned++;
        }
      }
    }

    // Ground Effect Rings Pool
    const fxRings: GroundFxRing[] = [];
    const sharedRingGeo = new THREE.RingGeometry(0.75, 1.0, 32);
    sharedRingGeo.rotateX(-Math.PI / 2);

    function spawnGroundRing(x: number, z: number, colorHex: number, startScale: number, endScale: number, maxLife = 0.45) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(sharedRingGeo, mat);
      mesh.position.set(x, groundHeightAt(x, z) + 0.08, z);
      mesh.scale.setScalar(startScale);
      scene.add(mesh);
      fxRings.push({ mesh, life: 0, maxLife, startScale, endScale });
    }

    // Game Simulation State
    let enemies: EnemyEntity[] = [];
    let enemyIdSeq = 1;
    let wave = 1;
    const maxWaves = 5;
    let score = 0;
    let kills = 0;
    let packleaderResets = 0;
    let waveClearDelay = 0;
    let hitstopTimer = 0;
    let shakeTrauma = 0;
    let bannerText: string | null = null;
    let bannerTimer = 0;

    const cooldowns = {
      wolves: 0,
      creeper: 0,
      ravens: 0,
      dash: 0,
      basic: 0,
    };
    const MAX_CD = {
      wolves: 6.0,
      creeper: 8.0,
      ravens: 5.5,
      dash: 2.2,
      basic: 0.42,
    };

    const telegraphGeo = new THREE.RingGeometry(0.82, 1.0, 28);
    telegraphGeo.rotateX(-Math.PI / 2);

    function showBanner(msg: string, duration = 2.2) {
      bannerText = msg;
      bannerTimer = duration;
    }

    function clearEnemies() {
      for (const e of enemies) {
        scene.remove(e.mesh);
        scene.remove(e.telegraphRing);
        (e.telegraphRing.material as THREE.Material).dispose();
      }
      enemies = [];
    }

    function spawnWave(waveNum: number) {
      clearEnemies();
      const count = 4 + waveNum * 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const rad = 14 + Math.random() * 4.5;
        const ex = Math.cos(angle) * rad;
        const ez = Math.sin(angle) * rad;

        let kind: EnemyKind = 'marauder';
        if (waveNum >= 2 && i % 3 === 1) kind = 'shaman';
        if (waveNum === maxWaves && i === 0) kind = 'boss';
        else if (waveNum === 3 && i === 0) kind = 'boss';

        const model = createEnemyModel(kind, shadowTex);
        model.group.position.set(ex, groundHeightAt(ex, ez), ez);
        scene.add(model.group);

        const tMat = new THREE.MeshBasicMaterial({
          color: kind === 'shaman' ? 0x22c55e : 0xef4444,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const tRing = new THREE.Mesh(telegraphGeo, tMat);
        tRing.position.set(ex, groundHeightAt(ex, ez) + 0.08, ez);
        scene.add(tRing);

        const baseHp = kind === 'boss' ? 480 + waveNum * 120 : kind === 'shaman' ? 110 + waveNum * 20 : 130 + waveNum * 25;

        enemies.push({
          id: enemyIdSeq++,
          kind,
          mesh: model.group,
          legL: model.legL,
          legR: model.legR,
          skinMat: model.skinMat,
          x: ex,
          z: ez,
          hp: baseHp,
          maxHp: baseHp,
          speed: kind === 'boss' ? 2.4 : kind === 'shaman' ? 2.1 : 3.45 + waveNum * 0.12,
          radius: kind === 'boss' ? 1.4 : 0.75,
          poisonedTimer: 0,
          vulnerableTimer: 0,
          rootedTimer: 0,
          hitFlashTimer: 0,
          attackCooldown: 1.0 + Math.random() * 1.2,
          windupTimer: 0,
          windupMax: kind === 'boss' ? 1.15 : kind === 'shaman' ? 1.25 : 0.65,
          telegraphRing: tRing,
          targetX: playerState.x,
          targetZ: playerState.z,
        });
      }
      showBanner(
        waveNum === maxWaves
          ? `WAVE ${waveNum}: BLOODHORN PIT BOSS`
          : `WAVE ${waveNum} OF ${maxWaves} · HUNT BEGINS`,
        2.5
      );
    }

    function damageEnemy(enemy: EnemyEntity, baseDmg: number, isCrit: boolean, triggerPackleader = true) {
      let dmg = baseDmg;
      if (enemy.vulnerableTimer > 0) dmg *= 1.35;
      if (enemy.poisonedTimer > 0 && isCrit) dmg *= 1.45; // Envenom multiplier!

      enemy.hp -= dmg;
      enemy.hitFlashTimer = 0.14;
      score += Math.round(dmg * 0.4);

      spawnParticles(
        enemy.x,
        groundHeightAt(enemy.x, enemy.z) + 1.1,
        enemy.z,
        isCrit ? 10 : 5,
        isCrit ? 0x38bdf8 : 0xf59e0b,
        isCrit ? 7.5 : 4.5,
        isCrit ? 1.1 : 0.8
      );

      if (triggerPackleader && isCrit && Math.random() < 0.24) {
        // Packleader Spirit Boon reset!
        cooldowns.wolves = 0;
        cooldowns.creeper = 0;
        cooldowns.ravens = 0;
        packleaderResets++;
        showBanner('PACKLEADER RESET · COMPANIONS READY!', 1.6);
        gameAudio.playPackleaderReset();
        spawnGroundRing(playerState.x, playerState.z, 0x38bdf8, 0.8, 3.8, 0.38);
      }

      if (enemy.hp <= 0) {
        kills++;
        score += enemy.kind === 'boss' ? 1500 : enemy.kind === 'shaman' ? 300 : 200;
        spawnParticles(enemy.x, groundHeightAt(enemy.x, enemy.z) + 1.0, enemy.z, 18, 0xef4444, 8, 1.3);
        scene.remove(enemy.mesh);
        scene.remove(enemy.telegraphRing);
        (enemy.telegraphRing.material as THREE.Material).dispose();
      }
    }

    function findNearestEnemy(fromX: number, fromZ: number, maxRange = 999): EnemyEntity | null {
      let best: EnemyEntity | null = null;
      let bestDist = maxRange * maxRange;
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        const d2 = (e.x - fromX) ** 2 + (e.z - fromZ) ** 2;
        if (d2 < bestDist) {
          bestDist = d2;
          best = e;
        }
      }
      return best;
    }

    // Skill Execution
    function executeSkill(slot: 1 | 2 | 3 | 'dash' | 'basic') {
      if (phaseRef.current !== 'PLAYING') return;

      if (slot === 'basic') {
        if (cooldowns.basic > 0) return;
        cooldowns.basic = MAX_CD.basic;
        playerState.basicSwingTimer = 0.24;
        gameAudio.playStormStrike();

        const target = findNearestEnemy(playerState.x, playerState.z, 5.2);
        const dirX = target ? target.x - playerState.x : Math.sin(playerState.facing);
        const dirZ = target ? target.z - playerState.z : Math.cos(playerState.facing);
        const len = Math.hypot(dirX, dirZ) || 1;
        playerState.facing = Math.atan2(dirX / len, dirZ / len);

        spawnGroundRing(
          playerState.x + (dirX / len) * 1.8,
          playerState.z + (dirZ / len) * 1.8,
          0x38bdf8,
          0.4,
          2.6,
          0.25
        );

        let hitAny = false;
        for (const e of enemies) {
          if (e.hp <= 0) continue;
          const dist = Math.hypot(e.x - playerState.x, e.z - playerState.z);
          if (dist <= 4.4) {
            const isCrit = Math.random() < 0.45;
            damageEnemy(e, isCrit ? 62 : 34, isCrit, true);
            hitAny = true;
          }
        }
        if (hitAny) {
          gameAudio.playEnemyHit(false);
          playerState.spirit = Math.min(playerState.maxSpirit, playerState.spirit + 12);
        }
        enemies = enemies.filter((e) => e.hp > 0);
      } else if (slot === 1) {
        // Skill 1: Wolves Storm Leap
        if (cooldowns.wolves > 0) return;
        cooldowns.wolves = MAX_CD.wolves;
        gameAudio.playWolfLeap();
        shakeTrauma = Math.min(1, shakeTrauma + 0.55);
        hitstopTimer = 0.045; // crisp 45ms impact hitstop!

        const primary = findNearestEnemy(playerState.x, playerState.z, 22);
        wolves.forEach((w, idx) => {
          const target = enemies.filter((e) => e.hp > 0)[idx % Math.max(1, enemies.length)] || primary;
          const tx = target ? target.x : playerState.x + Math.sin(playerState.facing + (idx - 1) * 0.5) * 6;
          const tz = target ? target.z : playerState.z + Math.cos(playerState.facing + (idx - 1) * 0.5) * 6;
          w.leapStartX = w.x;
          w.leapStartZ = w.z;
          w.leapTargetX = tx;
          w.leapTargetZ = tz;
          w.leapTimer = 0.36;

          spawnGroundRing(tx, tz, 0x38bdf8, 0.5, 4.2, 0.45);
          spawnParticles(tx, groundHeightAt(tx, tz) + 0.8, tz, 18, 0x38bdf8, 8.5, 1.35);

          for (const e of enemies) {
            if (e.hp <= 0) continue;
            if (Math.hypot(e.x - tx, e.z - tz) <= 4.0) {
              damageEnemy(e, 145, true, false);
            }
          }
        });
        enemies = enemies.filter((e) => e.hp > 0);
      } else if (slot === 2) {
        // Skill 2: Poison Creeper Root Ring
        if (cooldowns.creeper > 0) return;
        cooldowns.creeper = MAX_CD.creeper;
        gameAudio.playPoisonCreeper();
        shakeTrauma = Math.min(1, shakeTrauma + 0.35);

        spawnGroundRing(playerState.x, playerState.z, 0x22c55e, 1.0, 6.8, 0.6);
        spawnParticles(playerState.x, groundHeightAt(playerState.x, playerState.z) + 0.6, playerState.z, 28, 0x22c55e, 7.2, 1.25);

        for (const e of enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - playerState.x, e.z - playerState.z) <= 6.8) {
            e.rootedTimer = 3.2;
            e.poisonedTimer = 5.0;
            damageEnemy(e, 95, Math.random() < 0.5, true);
          }
        }
        enemies = enemies.filter((e) => e.hp > 0);
      } else if (slot === 3) {
        // Skill 3: Ravens Vulnerability Swarm
        if (cooldowns.ravens > 0) return;
        cooldowns.ravens = MAX_CD.ravens;
        gameAudio.playRavensSwarm();

        const target = findNearestEnemy(playerState.x, playerState.z, 18);
        const tx = target ? target.x : playerState.x + Math.sin(playerState.facing) * 6;
        const tz = target ? target.z : playerState.z + Math.cos(playerState.facing) * 6;

        ravens.forEach((r) => {
          r.diveTimer = 0.6;
          r.targetX = tx + (Math.random() - 0.5) * 2.5;
          r.targetZ = tz + (Math.random() - 0.5) * 2.5;
        });

        spawnGroundRing(tx, tz, 0xa855f7, 0.6, 5.2, 0.5);
        spawnParticles(tx, groundHeightAt(tx, tz) + 1.2, tz, 20, 0xc084fc, 6.0, 1.1);

        for (const e of enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - tx, e.z - tz) <= 5.2) {
            e.vulnerableTimer = 6.0;
            damageEnemy(e, 85, true, true);
          }
        }
        enemies = enemies.filter((e) => e.hp > 0);
      } else if (slot === 'dash') {
        if (cooldowns.dash > 0) return;
        cooldowns.dash = MAX_CD.dash;
        playerState.dashTimer = 0.18;
        playerState.invulnTimer = 0.35;
        playerState.dashDirX = Math.sin(playerState.facing);
        playerState.dashDirZ = Math.cos(playerState.facing);
        gameAudio.playDash();
        spawnParticles(playerState.x, groundHeightAt(playerState.x, playerState.z) + 0.5, playerState.z, 14, 0xf59e0b, 5.5, 0.9);
      }
    }

    function startNewRun() {
      playerState.x = 0;
      playerState.z = 5.5;
      playerState.hp = 100;
      playerState.spirit = 100;
      playerState.invulnTimer = 1.0;
      playerState.dashTimer = 0;
      wave = 1;
      score = 0;
      kills = 0;
      packleaderResets = 0;
      waveClearDelay = 0;
      cooldowns.wolves = 0;
      cooldowns.creeper = 0;
      cooldowns.ravens = 0;
      cooldowns.dash = 0;
      cooldowns.basic = 0;
      spawnWave(1);
    }

    apiRef.current = {
      startNewRun,
      triggerSkill: executeSkill,
    };

    // Input Tracking (Continuous held vs Edge-triggered + Blur clear)
    const heldKeys = new Set<string>();
    let bufferedAction: (1 | 2 | 3 | 'dash' | 'basic') | null = null;
    let bufferTimer = 0;

    const queueAction = (act: 1 | 2 | 3 | 'dash' | 'basic') => {
      bufferedAction = act;
      bufferTimer = 0.15;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }

      if (phaseRef.current === 'TITLE') {
        if (code === 'Enter' || code === 'Space') {
          startNewRun();
          onPhaseChangeRef.current('PLAYING');
        }
        return;
      }

      if (code === 'Escape') {
        if (phaseRef.current === 'PLAYING') onPhaseChangeRef.current('PAUSED');
        else if (phaseRef.current === 'PAUSED') onPhaseChangeRef.current('PLAYING');
        return;
      }

      if (phaseRef.current !== 'PLAYING') return;

      heldKeys.add(code);

      if (code === 'Digit1') queueAction(1);
      else if (code === 'Digit2') queueAction(2);
      else if (code === 'Digit3') queueAction(3);
      else if (code === 'Space' || code === 'ShiftLeft') queueAction('dash');
      else if (code === 'KeyJ' || code === 'KeyF') queueAction('basic');
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const onBlur = () => {
      heldKeys.clear();
    };

    const onCanvasPointerDown = (e: PointerEvent) => {
      if (phaseRef.current !== 'PLAYING') return;
      if (e.button === 0) queueAction('basic');
      else if (e.button === 2) queueAction(1);
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Pre-warm shaders once on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Initial Camera & Title Spawn
    camera.position.set(0, 8.5, 16);
    camera.lookAt(0, 1.5, 0);

    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let hudEmitTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function stepSimulation(dt: number) {
      elapsed += dt;

      // Animate Spirit Altar Crystal & Ring
      altar.crystal.rotation.y += dt * 0.9;
      altar.crystal.position.y = 3.05 + Math.sin(elapsed * 2.2) * 0.14;
      altar.runeRing.rotation.x = Math.sin(elapsed * 0.8) * 0.35;
      altar.runeRing.rotation.y -= dt * 0.55;
      altarGlowLight.intensity = 2.4 + Math.sin(elapsed * 3.1) * 0.45;

      // Update Banner & Buffered Inputs
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) bannerText = null;
      }
      if (bufferTimer > 0) {
        bufferTimer -= dt;
        if (bufferedAction !== null) {
          const act = bufferedAction;
          bufferedAction = null;
          executeSkill(act);
        }
      }

      // Cooldowns
      cooldowns.wolves = Math.max(0, cooldowns.wolves - dt);
      cooldowns.creeper = Math.max(0, cooldowns.creeper - dt);
      cooldowns.ravens = Math.max(0, cooldowns.ravens - dt);
      cooldowns.dash = Math.max(0, cooldowns.dash - dt);
      cooldowns.basic = Math.max(0, cooldowns.basic - dt);

      if (phaseRef.current === 'TITLE') {
        // Atmospheric slow cinematic orbit around Druid & Wolves at the Altar
        const camAngle = elapsed * 0.22;
        const targetCamX = Math.sin(camAngle) * 11.5;
        const targetCamZ = Math.cos(camAngle) * 11.5 + 2.5;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3.0, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.8 + Math.sin(elapsed * 0.5) * 0.4, 3.0, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3.0, dt);
        camera.lookAt(0, 1.4, 2.2);

        // Idle wolves breathing/orbiting softly
        wolves.forEach((w, idx) => {
          const a = idx * 2.1 + elapsed * 0.35;
          const wx = playerState.x + Math.cos(a) * 2.6;
          const wz = playerState.z + Math.sin(a) * 2.6;
          w.x = THREE.MathUtils.damp(w.x, wx, 4, dt);
          w.z = THREE.MathUtils.damp(w.z, wz, 4, dt);
          w.group.position.set(w.x, groundHeightAt(w.x, w.z), w.z);
          w.group.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
        });

        // Ravens circling high
        ravens.forEach((r, idx) => {
          r.angle += dt * 1.1;
          const rx = playerState.x + Math.cos(r.angle + idx * 2.09) * 3.8;
          const rz = playerState.z + Math.sin(r.angle + idx * 2.09) * 3.8;
          r.group.position.set(rx, 4.2 + Math.sin(elapsed * 3 + idx) * 0.3, rz);
          r.group.rotation.y = -r.angle;
          const flap = Math.sin(elapsed * 12 + idx) * 0.55;
          r.wingL.rotation.z = flap;
          r.wingR.rotation.z = -flap;
        });
        return;
      }

      if (phaseRef.current !== 'PLAYING') {
        return;
      }

      // Passive Spirit Regen
      playerState.spirit = Math.min(playerState.maxSpirit, playerState.spirit + dt * 5.0);
      playerState.invulnTimer = Math.max(0, playerState.invulnTimer - dt);
      playerState.basicSwingTimer = Math.max(0, playerState.basicSwingTimer - dt);

      // Player Movement (WASD / Arrows)
      let moveX = 0;
      let moveZ = 0;
      if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveZ -= 1;
      if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveZ += 1;
      if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveX -= 1;
      if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveX += 1;

      if (playerState.dashTimer > 0) {
        playerState.dashTimer -= dt;
        playerState.x += playerState.dashDirX * 19.5 * dt;
        playerState.z += playerState.dashDirZ * 19.5 * dt;
      } else if (moveX !== 0 || moveZ !== 0) {
        const mag = Math.hypot(moveX, moveZ);
        const nx = moveX / mag;
        const nz = moveZ / mag;
        const speed = 7.4;
        playerState.x += nx * speed * dt;
        playerState.z += nz * speed * dt;
        const targetAngle = Math.atan2(nx, nz);
        // Smooth shortest angle rotation
        let diff = targetAngle - playerState.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerState.facing += diff * (1 - Math.exp(-14 * dt));
      }

      // Clamp to natural arena clearing perimeter (radius 18.2)
      const pDist = Math.hypot(playerState.x, playerState.z);
      if (pDist > 18.0) {
        playerState.x = (playerState.x / pDist) * 18.0;
        playerState.z = (playerState.z / pDist) * 18.0;
      }
      // Keep outside central altar monolith collision (radius 1.45)
      if (pDist < 1.55) {
        const pushAngle = Math.atan2(playerState.z, playerState.x);
        playerState.x = Math.cos(pushAngle) * 1.55;
        playerState.z = Math.sin(pushAngle) * 1.55;
      }

      const py = groundHeightAt(playerState.x, playerState.z);
      druid.group.position.set(playerState.x, py, playerState.z);
      druid.group.rotation.y = playerState.facing;
      druid.staffCrystal.rotation.y += dt * 3.0;
      if (playerState.basicSwingTimer > 0) {
        druid.staffGroup.rotation.x = Math.sin((playerState.basicSwingTimer / 0.24) * Math.PI) * 0.85;
      } else {
        druid.staffGroup.rotation.x = THREE.MathUtils.damp(druid.staffGroup.rotation.x, 0, 12, dt);
      }

      // Update 3 Storm Wolves (Auto-hunt nearby enemies or flank Druid)
      wolves.forEach((w, idx) => {
        w.attackTimer = Math.max(0, w.attackTimer - dt);

        if (w.leapTimer > 0) {
          w.leapTimer -= dt;
          const t = 1 - Math.max(0, w.leapTimer) / 0.36;
          w.x = THREE.MathUtils.lerp(w.leapStartX, w.leapTargetX, t);
          w.z = THREE.MathUtils.lerp(w.leapStartZ, w.leapTargetZ, t);
          w.yOffset = Math.sin(t * Math.PI) * 2.8;
          w.group.rotation.y = Math.atan2(w.leapTargetX - w.leapStartX, w.leapTargetZ - w.leapStartZ);
        } else {
          w.yOffset = 0;
          const target = findNearestEnemy(w.x, w.z, 15.0);
          if (target) {
            const dx = target.x - w.x;
            const dz = target.z - w.z;
            const dist = Math.hypot(dx, dz) || 1;
            if (dist > 1.35) {
              w.x += (dx / dist) * 7.8 * dt;
              w.z += (dz / dist) * 7.8 * dt;
              w.group.rotation.y = Math.atan2(dx, dz);
              const trot = Math.sin(elapsed * 18 + idx * 1.5) * 0.55;
              w.legs[0].rotation.x = trot;
              w.legs[3].rotation.x = trot;
              w.legs[1].rotation.x = -trot;
              w.legs[2].rotation.x = -trot;
            } else if (w.attackTimer <= 0) {
              w.attackTimer = 0.85;
              const isCrit = Math.random() < 0.55;
              damageEnemy(target, isCrit ? 46 : 24, isCrit, true);
              gameAudio.playEnemyHit(false);
              enemies = enemies.filter((e) => e.hp > 0);
            }
          } else {
            w.orbitAngle += dt * 0.9;
            const tx = playerState.x + Math.cos(w.orbitAngle + idx * 2.09) * 2.4;
            const tz = playerState.z + Math.sin(w.orbitAngle + idx * 2.09) * 2.4;
            const dx = tx - w.x;
            const dz = tz - w.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.2) {
              w.x += (dx / dist) * Math.min(dist, 6.8 * dt);
              w.z += (dz / dist) * Math.min(dist, 6.8 * dt);
              w.group.rotation.y = Math.atan2(dx, dz);
              const trot = Math.sin(elapsed * 14 + idx) * 0.45;
              w.legs[0].rotation.x = trot;
              w.legs[3].rotation.x = trot;
              w.legs[1].rotation.x = -trot;
              w.legs[2].rotation.x = -trot;
            }
          }
        }
        w.group.position.set(w.x, groundHeightAt(w.x, w.z) + w.yOffset, w.z);
      });

      // Update Ravens
      ravens.forEach((r, idx) => {
        if (r.diveTimer > 0) {
          r.diveTimer -= dt;
          r.group.position.x = THREE.MathUtils.damp(r.group.position.x, r.targetX, 10, dt);
          r.group.position.z = THREE.MathUtils.damp(r.group.position.z, r.targetZ, 10, dt);
          r.group.position.y = THREE.MathUtils.damp(r.group.position.y, groundHeightAt(r.targetX, r.targetZ) + 1.2, 10, dt);
        } else {
          r.angle += dt * 1.65;
          const rx = playerState.x + Math.cos(r.angle + idx * 2.09) * 3.2;
          const rz = playerState.z + Math.sin(r.angle + idx * 2.09) * 3.2;
          r.group.position.x = THREE.MathUtils.damp(r.group.position.x, rx, 6, dt);
          r.group.position.z = THREE.MathUtils.damp(r.group.position.z, rz, 6, dt);
          r.group.position.y = THREE.MathUtils.damp(
            r.group.position.y,
            groundHeightAt(rx, rz) + 3.8 + Math.sin(elapsed * 3.5 + idx) * 0.25,
            6,
            dt
          );
          r.group.rotation.y = -r.angle;
        }
        const flap = Math.sin(elapsed * 14 + idx) * 0.58;
        r.wingL.rotation.z = flap;
        r.wingR.rotation.z = -flap;
      });

      // Update Enemies & Windup Telegraphs
      for (const e of enemies) {
        e.poisonedTimer = Math.max(0, e.poisonedTimer - dt);
        e.vulnerableTimer = Math.max(0, e.vulnerableTimer - dt);
        e.rootedTimer = Math.max(0, e.rootedTimer - dt);
        e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
        e.attackCooldown = Math.max(0, e.attackCooldown - dt);

        // Poison DoT tick
        if (e.poisonedTimer > 0 && Math.random() < dt * 2.5) {
          e.hp -= 8;
        }

        // Hit Flash / Status Tint
        if (e.hitFlashTimer > 0) {
          e.skinMat.emissive.setHex(0xffffff);
          e.skinMat.emissiveIntensity = 0.9;
        } else if (e.poisonedTimer > 0) {
          e.skinMat.emissive.setHex(0x16a34a);
          e.skinMat.emissiveIntensity = 0.45;
        } else {
          e.skinMat.emissive.setHex(0x000000);
          e.skinMat.emissiveIntensity = 0;
        }

        const dx = playerState.x - e.x;
        const dz = playerState.z - e.z;
        const distToPlayer = Math.hypot(dx, dz) || 1;
        e.mesh.rotation.y = Math.atan2(dx, dz);

        const attackRange = e.kind === 'shaman' ? 8.5 : e.kind === 'boss' ? 3.2 : 2.1;

        if (e.windupTimer > 0) {
          e.windupTimer -= dt;
          const pct = 1 - e.windupTimer / e.windupMax;
          const ringMat = e.telegraphRing.material as THREE.MeshBasicMaterial;
          ringMat.opacity = 0.35 + pct * 0.55;
          const rad = e.kind === 'boss' ? 3.6 : e.kind === 'shaman' ? 2.4 : 1.7;
          e.telegraphRing.scale.setScalar(rad * (0.4 + pct * 0.6));
          e.telegraphRing.position.set(e.targetX, groundHeightAt(e.targetX, e.targetZ) + 0.09, e.targetZ);

          if (e.windupTimer <= 0) {
            ringMat.opacity = 0;
            // Execute Telegraph Attack!
            const hitDist = Math.hypot(playerState.x - e.targetX, playerState.z - e.targetZ);
            spawnGroundRing(e.targetX, e.targetZ, e.kind === 'shaman' ? 0x22c55e : 0xef4444, 0.5, rad, 0.3);
            if (hitDist <= rad && playerState.invulnTimer <= 0) {
              const dmg = e.kind === 'boss' ? 24 : e.kind === 'shaman' ? 16 : 12;
              playerState.hp = Math.max(0, playerState.hp - dmg);
              playerState.invulnTimer = 0.55;
              shakeTrauma = Math.min(1, shakeTrauma + 0.65);
              gameAudio.playPlayerHurt();
              if (playerState.hp <= 0) {
                onPhaseChangeRef.current('GAMEOVER');
              }
            }
            e.attackCooldown = e.kind === 'boss' ? 2.2 : 1.8;
          }
        } else if (e.rootedTimer <= 0) {
          if (distToPlayer > attackRange) {
            e.x += (dx / distToPlayer) * e.speed * dt;
            e.z += (dz / distToPlayer) * e.speed * dt;
            const stride = Math.sin(elapsed * 9 + e.id) * 0.45;
            e.legL.rotation.x = stride;
            e.legR.rotation.x = -stride;
          } else if (e.attackCooldown <= 0) {
            // Begin visible windup telegraph!
            e.windupTimer = e.windupMax;
            e.targetX = e.kind === 'shaman' ? playerState.x : e.x + (dx / distToPlayer) * 1.1;
            e.targetZ = e.kind === 'shaman' ? playerState.z : e.z + (dz / distToPlayer) * 1.1;
          }
        }

        e.mesh.position.set(e.x, groundHeightAt(e.x, e.z), e.z);
      }

      // Clean up poisoned deaths
      const beforeFilter = enemies.length;
      enemies = enemies.filter((e) => {
        if (e.hp <= 0) {
          kills++;
          score += e.kind === 'boss' ? 1500 : 220;
          scene.remove(e.mesh);
          scene.remove(e.telegraphRing);
          (e.telegraphRing.material as THREE.Material).dispose();
          return false;
        }
        return true;
      });
      if (beforeFilter > 0 && enemies.length === 0) {
        if (wave >= maxWaves) {
          gameAudio.playWaveClear();
          onPhaseChangeRef.current('VICTORY');
        } else if (waveClearDelay <= 0) {
          waveClearDelay = 2.0;
          gameAudio.playWaveClear();
          showBanner(`WAVE ${wave} CLEARED · NEXT PACK INBOUND`, 1.9);
        }
      }

      if (waveClearDelay > 0) {
        waveClearDelay -= dt;
        if (waveClearDelay <= 0) {
          wave++;
          playerState.hp = Math.min(playerState.maxHp, playerState.hp + 20);
          spawnWave(wave);
        }
      }

      // Update Particles
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.active) {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            _dummy.position.set(0, -50, 0);
            _dummy.scale.setScalar(0);
            _dummy.updateMatrix();
            particleInst.setMatrixAt(i, _dummy.matrix);
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy -= 12.0 * dt;
            p.z += p.vz * dt;
            const fade = 1 - p.life / p.maxLife;
            _dummy.position.set(p.x, p.y, p.z);
            _dummy.rotation.set(p.life * 6, p.life * 4, 0);
            _dummy.scale.setScalar(p.scale * fade);
            _dummy.updateMatrix();
            particleInst.setMatrixAt(i, _dummy.matrix);
            _color.setHex(p.colorHex);
            particleInst.setColorAt(i, _color);
          }
        } else {
          _dummy.position.set(0, -50, 0);
          _dummy.scale.setScalar(0);
          _dummy.updateMatrix();
          particleInst.setMatrixAt(i, _dummy.matrix);
        }
      }
      particleInst.instanceMatrix.needsUpdate = true;
      if (particleInst.instanceColor) particleInst.instanceColor.needsUpdate = true;

      // Update Ground Rings
      for (let i = fxRings.length - 1; i >= 0; i--) {
        const r = fxRings[i];
        r.life += dt;
        if (r.life >= r.maxLife) {
          scene.remove(r.mesh);
          (r.mesh.material as THREE.Material).dispose();
          fxRings.splice(i, 1);
        } else {
          const t = r.life / r.maxLife;
          const sc = THREE.MathUtils.lerp(r.startScale, r.endScale, t);
          r.mesh.scale.setScalar(sc);
          (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
        }
      }

      // Smooth Exponential Chase Camera + Decaying Camera Shake
      shakeTrauma = Math.max(0, shakeTrauma - dt * 2.4);
      const shakeMag = shakeTrauma * shakeTrauma * 0.45;
      const sx = (Math.random() - 0.5) * shakeMag;
      const sy = (Math.random() - 0.5) * shakeMag;

      const desiredCamX = playerState.x;
      const desiredCamY = py + 11.2;
      const desiredCamZ = playerState.z + 11.8;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamX, 6.5, dt) + sx;
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamY, 6.5, dt) + sy;
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamZ, 6.5, dt);

      _v1.set(playerState.x, py + 1.0, playerState.z);
      camera.lookAt(_v1);
    }

    function tick() {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
      } else {
        stepSimulation(dt);
      }

      hudEmitTimer += dt;
      if (hudEmitTimer >= 0.08) {
        hudEmitTimer = 0;
        onHudUpdateRef.current({
          hp: Math.ceil(playerState.hp),
          maxHp: playerState.maxHp,
          spirit: Math.floor(playerState.spirit),
          maxSpirit: playerState.maxSpirit,
          wave,
          maxWaves,
          score,
          kills,
          packleaderResets,
          cdWolves: cooldowns.wolves,
          cdCreeper: cooldowns.creeper,
          cdRavens: cooldowns.ravens,
          cdDash: cooldowns.dash,
          bannerText,
          enemiesRemaining: enemies.length,
        });
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onCanvasPointerDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      clearEnemies();
      envTex.dispose();
      groundTex.map.dispose();
      groundTex.bumpMap.dispose();
      stoneTex.dispose();
      shadowTex.dispose();
      sharedRingGeo.dispose();
      telegraphGeo.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950 text-stone-200 p-6">
          <div className="text-center space-y-2 max-w-md">
            <h3 className="font-serif text-xl font-bold text-amber-400">WebGL Context Suspended</h3>
            <p className="text-xs text-stone-400">
              Your browser temporarily paused 3D rendering. Restoring graphics hardware automatically...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
