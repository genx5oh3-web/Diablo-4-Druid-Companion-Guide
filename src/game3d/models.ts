import * as THREE from 'three';

export function groundHeightAt(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);
  // Keep inner fighting clearing gently undulating, rising softly at outer forest perimeter
  const rimSlope = Math.max(0, distFromCenter - 20) * 0.12;
  return (
    Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.18 +
    Math.sin(x * 0.35 + z * 0.25) * 0.06 +
    rimSlope
  );
}

function addContactShadow(group: THREE.Group, shadowTex: THREE.Texture, radius: number) {
  const shadowGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.48,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.03;
  group.add(shadowMesh);
}

// 1. Composite 9-part Druid Hero Model (Bottom-Center Pivot)
export function createDruidModel(shadowTex: THREE.Texture) {
  const group = new THREE.Group();

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x452b1d,
    roughness: 0.82,
    metalness: 0.06,
  });
  const furMat = new THREE.MeshStandardMaterial({
    color: 0x2f2925,
    roughness: 0.94,
    metalness: 0.02,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb9823c,
    roughness: 0.28,
    metalness: 0.88,
  });
  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x3b2618,
    roughness: 0.88,
    metalness: 0.04,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.6,
    roughness: 0.18,
    metalness: 0.25,
  });

  // Part 1: Tapered tunic/robe via LatheGeometry (Primary Silhouette)
  const tunicPoints = [
    new THREE.Vector2(0.46, 0.18),
    new THREE.Vector2(0.42, 0.65),
    new THREE.Vector2(0.32, 1.05),
    new THREE.Vector2(0.38, 1.48),
    new THREE.Vector2(0.22, 1.66),
    new THREE.Vector2(0.0, 1.66),
  ];
  const tunic = new THREE.Mesh(new THREE.LatheGeometry(tunicPoints, 16), leatherMat);
  tunic.castShadow = true;
  tunic.receiveShadow = true;
  group.add(tunic);

  // Part 2: Heavy Wolf-Pelt Mantle (Secondary)
  const mantle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.14, 10, 18, Math.PI * 1.45),
    furMat
  );
  mantle.position.set(0, 1.54, -0.04);
  mantle.rotation.set(Math.PI / 2, 0, Math.PI * 0.78);
  mantle.castShadow = true;
  group.add(mantle);

  // Part 3: Beveled Leather Pauldrons via ExtrudeGeometry (Secondary)
  const pauldronShape = new THREE.Shape();
  pauldronShape.moveTo(-0.18, 0);
  pauldronShape.quadraticCurveTo(0, 0.28, 0.22, 0.08);
  pauldronShape.lineTo(0.14, -0.14);
  pauldronShape.lineTo(-0.18, -0.08);
  pauldronShape.closePath();
  const pauldronGeo = new THREE.ExtrudeGeometry(pauldronShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  pauldronGeo.center();

  const leftPauldron = new THREE.Mesh(pauldronGeo, bronzeMat);
  leftPauldron.position.set(-0.44, 1.5, 0.02);
  leftPauldron.rotation.set(0, 0.2, 0.45);
  leftPauldron.castShadow = true;
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, bronzeMat);
  rightPauldron.position.set(0.44, 1.5, 0.02);
  rightPauldron.rotation.set(0, -0.2, -0.45);
  rightPauldron.castShadow = true;
  group.add(rightPauldron);

  // Part 4: Hooded Head & Glowing Storm Eyes (Accent)
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.48, 12), furMat);
  hood.position.set(0, 1.88, -0.02);
  hood.rotation.x = -0.14;
  hood.castShadow = true;
  group.add(hood);

  // Part 5: Stag Horns on Hood (Secondary Accent)
  const hornCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 1.9, 0.02),
    new THREE.Vector3(-0.34, 2.15, -0.04),
    new THREE.Vector3(-0.28, 2.38, 0.08),
  ]);
  const hornL = new THREE.Mesh(new THREE.TubeGeometry(hornCurveL, 10, 0.032, 6, false), bronzeMat);
  group.add(hornL);

  const hornCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14, 1.9, 0.02),
    new THREE.Vector3(0.34, 2.15, -0.04),
    new THREE.Vector3(0.28, 2.38, 0.08),
  ]);
  const hornR = new THREE.Mesh(new THREE.TubeGeometry(hornCurveR, 10, 0.032, 6, false), bronzeMat);
  group.add(hornR);

  // Part 6: Bronze Belt & Totem Buckle (Accent)
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.37, 0.12, 16), bronzeMat);
  belt.position.y = 1.04;
  group.add(belt);

  // Part 7: Gnarled Storm Staff (TubeGeometry) + Amber Crystal Focus (Accent)
  const staffGroup = new THREE.Group();
  staffGroup.position.set(0.55, 0, 0.22);
  const staffCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(-0.04, 0.9, 0.03),
    new THREE.Vector3(0.05, 1.65, -0.02),
    new THREE.Vector3(0.0, 2.15, 0.08),
  ]);
  const staffShaft = new THREE.Mesh(new THREE.TubeGeometry(staffCurve, 16, 0.042, 8, false), oakMat);
  staffShaft.castShadow = true;
  staffGroup.add(staffShaft);

  const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16), bronzeMat);
  staffRing.position.set(0, 2.18, 0.08);
  staffGroup.add(staffRing);

  const staffCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), crystalMat);
  staffCrystal.position.set(0, 2.18, 0.08);
  staffGroup.add(staffCrystal);
  group.add(staffGroup);

  // Part 8: Boots (Grounding)
  const bootGeo = new THREE.CapsuleGeometry(0.11, 0.22, 4, 8);
  const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
  leftBoot.position.set(-0.18, 0.16, 0.05);
  group.add(leftBoot);
  const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
  rightBoot.position.set(0.18, 0.16, 0.05);
  group.add(rightBoot);

  addContactShadow(group, shadowTex, 0.85);

  return { group, staffCrystal, staffGroup };
}

// 2. Composite 10-part Storm Werewolf Companion Model (Bottom-Center Pivot)
export function createStormWolfModel(shadowTex: THREE.Texture) {
  const group = new THREE.Group();

  const peltMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.1,
  });
  const stormFurMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.72,
    metalness: 0.18,
  });
  const runeIronMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.28,
    metalness: 0.85,
  });
  const lightningGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.0,
    roughness: 0.15,
    metalness: 0.1,
  });

  // Part 1: Sculpted Chest & Haunch Torso (Primary Silhouette)
  const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), stormFurMat);
  chest.scale.set(0.92, 0.88, 1.35);
  chest.position.set(0, 0.62, 0.18);
  chest.castShadow = true;
  group.add(chest);

  const hips = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), peltMat);
  hips.scale.set(0.85, 0.8, 1.2);
  hips.position.set(0, 0.56, -0.32);
  hips.castShadow = true;
  group.add(hips);

  // Part 2: Head & Snout (Secondary)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, 0.65);

  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), stormFurMat);
  skull.scale.set(0.95, 0.9, 1.1);
  skull.castShadow = true;
  headGroup.add(skull);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 6), peltMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, 0.22);
  headGroup.add(snout);

  // Part 3: Pointed Ears (Accent)
  const earGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
  const earL = new THREE.Mesh(earGeo, peltMat);
  earL.position.set(-0.12, 0.22, -0.04);
  earL.rotation.set(-0.2, 0, 0.28);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, peltMat);
  earR.position.set(0.12, 0.22, -0.04);
  earR.rotation.set(-0.2, 0, -0.28);
  headGroup.add(earR);

  // Part 4: Glowing Cyan Eyes (Accent)
  const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, lightningGlowMat);
  eyeL.position.set(-0.085, 0.04, 0.16);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, lightningGlowMat);
  eyeR.position.set(0.085, 0.04, 0.16);
  headGroup.add(eyeR);

  group.add(headGroup);

  // Part 5: Electric Spine Crests (Storm's Companion visual signature)
  const crestGeo = new THREE.ConeGeometry(0.06, 0.26, 4);
  for (let i = 0; i < 3; i++) {
    const crest = new THREE.Mesh(crestGeo, lightningGlowMat);
    crest.position.set(0, 0.92 - i * 0.05, 0.35 - i * 0.26);
    crest.rotation.x = -0.55;
    group.add(crest);
  }

  // Part 6: Iron Storm Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 14), runeIronMat);
  collar.position.set(0, 0.72, 0.44);
  collar.rotation.x = Math.PI / 3;
  group.add(collar);

  // Part 7-10: 4 Articulated Legs (Pivot at Hip/Shoulder)
  const legGeo = new THREE.CapsuleGeometry(0.075, 0.36, 4, 8);
  legGeo.translate(0, -0.2, 0);

  const legFL = new THREE.Mesh(legGeo, peltMat);
  legFL.position.set(-0.22, 0.48, 0.34);
  legFL.castShadow = true;
  group.add(legFL);

  const legFR = new THREE.Mesh(legGeo, peltMat);
  legFR.position.set(0.22, 0.48, 0.34);
  legFR.castShadow = true;
  group.add(legFR);

  const legBL = new THREE.Mesh(legGeo, peltMat);
  legBL.position.set(-0.2, 0.46, -0.34);
  legBL.castShadow = true;
  group.add(legBL);

  const legBR = new THREE.Mesh(legGeo, peltMat);
  legBR.position.set(0.2, 0.46, -0.34);
  legBR.castShadow = true;
  group.add(legBR);

  // Tail via TubeGeometry
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.56, -0.52),
    new THREE.Vector3(0, 0.64, -0.78),
    new THREE.Vector3(0, 0.54, -0.96),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 8, 0.06, 6, false), stormFurMat);
  group.add(tail);

  addContactShadow(group, shadowTex, 0.75);

  return { group, headGroup, legs: [legFL, legFR, legBL, legBR], tail };
}

// 3. Composite 5-Part Raven Model
export function createRavenModel() {
  const group = new THREE.Group();
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
    metalness: 0.25,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.5,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.24, 4, 8), featherMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 5), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.z = 0.22;
  group.add(beak);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.42, 0.12);
  wingShape.lineTo(0.32, -0.14);
  wingShape.lineTo(0, -0.08);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.015, bevelEnabled: false });
  wingGeo.rotateX(Math.PI / 2);

  const wingL = new THREE.Mesh(wingGeo, featherMat);
  wingL.scale.x = -1;
  wingL.position.set(-0.04, 0.02, 0.04);
  group.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, featherMat);
  wingR.position.set(0.04, 0.02, 0.04);
  group.add(wingR);

  return { group, wingL, wingR };
}

// 4. Composite 7-part Druidic Spirit Altar Centerpiece
export function createSpiritAltarModel(stoneTex: THREE.Texture, shadowTex: THREE.Texture) {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.85,
    metalness: 0.08,
  });
  const runeMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.9,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.2,
  });

  // Stepped Octagonal Stone Plinth
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.3, 8), stoneMat);
  base1.position.y = 0.15;
  base1.receiveShadow = true;
  group.add(base1);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.0, 0.28, 8), stoneMat);
  base2.position.y = 0.44;
  base2.receiveShadow = true;
  group.add(base2);

  // Carved Rune Monolith Pillar
  const monolith = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.1, 6), stoneMat);
  monolith.position.y = 1.62;
  monolith.castShadow = true;
  monolith.receiveShadow = true;
  group.add(monolith);

  // Outer Iron Rune Ring
  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.055, 8, 24), runeMetalMat);
  runeRing.position.y = 3.05;
  group.add(runeRing);

  // Floating Crystal Core
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), coreMat);
  crystal.position.y = 3.05;
  group.add(crystal);

  // 2 Stone Braziers with Amber Ember Bowls
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xea580c,
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });

  [-1.95, 1.95].forEach((offset) => {
    const brazierPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.95, 6), stoneMat);
    brazierPedestal.position.set(offset, 0.62, 0);
    brazierPedestal.castShadow = true;
    group.add(brazierPedestal);

    const coal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), emberMat);
    coal.scale.y = 0.5;
    coal.position.set(offset, 1.12, 0);
    group.add(coal);
  });

  addContactShadow(group, shadowTex, 3.1);

  return { group, crystal, runeRing };
}

// 5. Composite Enemy Models (Marauder, Blighted Shaman, Bloodhorn Boss)
export type EnemyKind = 'marauder' | 'shaman' | 'boss';

export function createEnemyModel(kind: EnemyKind, shadowTex: THREE.Texture) {
  const group = new THREE.Group();

  const scale = kind === 'boss' ? 1.75 : kind === 'shaman' ? 1.15 : 0.95;

  const skinColor =
    kind === 'boss' ? 0x5c1916 : kind === 'shaman' ? 0x2f3e2e : 0x6b221a;
  const armorColor =
    kind === 'boss' ? 0x292524 : kind === 'shaman' ? 0x1e293b : 0x3f2e26;
  const glowColor =
    kind === 'boss' ? 0xf97316 : kind === 'shaman' ? 0x22c55e : 0xef4444;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.85,
    metalness: 0.08,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: armorColor,
    roughness: 0.35,
    metalness: 0.82,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36 * scale, 1), skinMat);
  torso.scale.set(1.05, 1.25, 0.85);
  torso.position.y = 0.92 * scale;
  torso.castShadow = true;
  group.add(torso);

  // Armor chestplate / robe
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34 * scale, 0.28 * scale, 0.65 * scale, 8),
    armorMat
  );
  plate.position.y = 0.82 * scale;
  plate.castShadow = true;
  group.add(plate);

  // Head
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 * scale, 0), skinMat);
  head.position.set(0, 1.46 * scale, 0.08 * scale);
  head.castShadow = true;
  group.add(head);

  // Glowing Eyes
  const eyeGeo = new THREE.SphereGeometry(0.032 * scale, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, glowMat);
  eyeL.position.set(-0.07 * scale, 1.48 * scale, 0.23 * scale);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, glowMat);
  eyeR.position.set(0.07 * scale, 1.48 * scale, 0.23 * scale);
  group.add(eyeR);

  // Horns
  const hornGeo = new THREE.ConeGeometry(0.06 * scale, 0.35 * scale, 5);
  const hornL = new THREE.Mesh(hornGeo, armorMat);
  hornL.position.set(-0.18 * scale, 1.65 * scale, 0.04 * scale);
  hornL.rotation.z = 0.55;
  group.add(hornL);

  const hornR = new THREE.Mesh(hornGeo, armorMat);
  hornR.position.set(0.18 * scale, 1.65 * scale, 0.04 * scale);
  hornR.rotation.z = -0.55;
  group.add(hornR);

  // Weapon (Cleaver or Shaman Staff)
  if (kind === 'shaman') {
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03 * scale, 0.035 * scale, 1.6 * scale, 6),
      armorMat
    );
    staff.position.set(0.45 * scale, 0.9 * scale, 0.2 * scale);
    group.add(staff);

    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 * scale, 0), glowMat);
    orb.position.set(0.45 * scale, 1.75 * scale, 0.2 * scale);
    group.add(orb);
  } else {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1 * scale, 0.72 * scale, 0.22 * scale),
      armorMat
    );
    blade.position.set(0.44 * scale, 0.95 * scale, 0.24 * scale);
    blade.rotation.x = 0.45;
    blade.castShadow = true;
    group.add(blade);
  }

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.09 * scale, 0.34 * scale, 4, 6);
  const legL = new THREE.Mesh(legGeo, skinMat);
  legL.position.set(-0.16 * scale, 0.26 * scale, 0);
  group.add(legL);
  const legR = new THREE.Mesh(legGeo, skinMat);
  legR.position.set(0.16 * scale, 0.26 * scale, 0);
  group.add(legR);

  addContactShadow(group, shadowTex, 0.62 * scale);

  return { group, torso, legL, legR, glowMat, skinMat };
}
