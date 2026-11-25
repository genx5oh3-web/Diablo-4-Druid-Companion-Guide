export type ItemRarity = 'Magic' | 'Rare' | 'Legendary' | 'Unique' | 'Mythic Unique';

export type GearSlotKey =
  | 'helm'
  | 'chest'
  | 'gloves'
  | 'pants'
  | 'boots'
  | 'mainHand'
  | 'offHand'
  | 'amulet'
  | 'ring1'
  | 'ring2';

export interface ItemAffix {
  stat: string;
  isGreaterAffix?: boolean;
  value: string;
  isMasterworked?: boolean;
}

export interface TemperingCraft {
  category: 'Weapons' | 'Offensive' | 'Defensive' | 'Utility' | 'Mobility' | 'Resource';
  recipeName: string;
  affix: string;
  rollRange: string;
}

export interface SocketConfig {
  type: 'gem' | 'runeword';
  gemName?: string;
  gemBonus?: string;
  runes?: {
    ritualRune: string;
    ritualCondition: string;
    invocationRune: string;
    invocationEffect: string;
  };
}

export interface GearItem {
  slotKey: GearSlotKey;
  slotName: string;
  name: string;
  rarity: ItemRarity;
  itemPower: number;
  aspectOrUniqueEffect: {
    title: string;
    description: string;
    isUnique?: boolean;
    imprintSource?: string;
  };
  implicit?: string;
  affixes: ItemAffix[];
  tempering?: TemperingCraft[];
  masterworkingTarget: string;
  targetMasterworkLevel: number; // 0 - 12
  masterworkCrits: [string, string, string]; // 4/12, 8/12, 12/12 crits
  socket: SocketConfig;
  targetFarmBoss: string;
  alternativeItem?: string;
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'Basic' | 'Core' | 'Defensive' | 'Companion' | 'Wrath' | 'Ultimate' | 'Key Passive';
  points: number;
  maxPoints: number;
  description: string;
  activeModifier?: string;
  secondaryModifier?: string;
  iconType: 'claw' | 'wolf' | 'raven' | 'vine' | 'shield' | 'storm' | 'earth' | 'howl';
}

export interface SpiritBoonCategory {
  animal: 'Deer' | 'Eagle' | 'Wolf' | 'Snake';
  title: string;
  isBonded?: boolean;
  boons: {
    id: string;
    name: string;
    description: string;
    selected: boolean;
  }[];
}

export interface ParagonNode {
  id: string;
  name: string;
  type: 'normal' | 'magic' | 'rare' | 'legendary' | 'glyph_socket';
  description: string;
  bonus?: string;
  requirement?: string;
  allocated: boolean;
  x: number;
  y: number;
}

export interface ParagonBoardData {
  id: string;
  boardNumber: number;
  name: string;
  theme: string;
  legendaryNode?: {
    name: string;
    description: string;
  };
  socketedGlyph: {
    name: string;
    type: 'Magic' | 'Rare' | 'Legendary';
    level: number;
    radius: number;
    bonusText: string;
    additionalBonusReq: string;
    additionalBonusEffect: string;
  };
  rareNodes: {
    name: string;
    stats: string[];
    thresholdReq: string;
    bonus: string;
  }[];
  pathingStrategy: string;
  totalPointsAllocated: number;
  nodesGrid: ParagonNode[];
}

export interface BossDropInfo {
  bossName: string;
  title: string;
  location: string;
  summonMaterials: string;
  keyDrops: string[];
  companionBuildItems: string[];
  tormentTierMin: string;
  mechanicsTip: string;
}

export type BuildVariant = 'endgame_push' | 'speedfarm' | 'starter_leveling';
