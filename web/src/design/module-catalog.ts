export type ModuleKind = 'core' | 'engine' | 'weapon' | 'armor' | 'hull' | 'sensor';

export type ModuleMeta = {
  kind: ModuleKind;
  icon: string;
  short: string;
  ru: string;
  en: string;
  roleRu: string;
  roleEn: string;
  descriptionRu: string;
  descriptionEn: string;
};

export const MODULE_KIND_META: Record<ModuleKind, ModuleMeta> = {
  core: {
    kind: 'core', icon: '◎', short: 'CORE', ru: 'Ядро', en: 'Core',
    roleRu: 'Источник питания', roleEn: 'Power source',
    descriptionRu: 'Питает связанные системы. Потеря ядра резко ослабляет корабль.',
    descriptionEn: 'Powers connected systems. Losing the core severely weakens the ship.'
  },
  engine: {
    kind: 'engine', icon: '▲', short: 'ENG', ru: 'Двигатель', en: 'Engine',
    roleRu: 'Манёвренность и курс', roleEn: 'Mobility and course',
    descriptionRu: 'Стабилизирует корабль и наведение. Повреждённые двигатели увеличивают разброс выстрелов.',
    descriptionEn: 'Stabilizes the ship and targeting. Damaged engines increase projectile spread.'
  },
  weapon: {
    kind: 'weapon', icon: '◆', short: 'WPN', ru: 'Орудие', en: 'Weapon',
    roleRu: 'Точка запуска снаряда', roleEn: 'Projectile hardpoint',
    descriptionRu: 'С этой точки реально стартуют лазеры, ракеты, дробь и плазма.',
    descriptionEn: 'Lasers, missiles, pellets and plasma visibly launch from this hardpoint.'
  },
  armor: {
    kind: 'armor', icon: '▣', short: 'ARM', ru: 'Броня', en: 'Armor',
    roleRu: 'Поглощает урон', roleEn: 'Absorbs damage',
    descriptionRu: 'Бронепластина принимает часть урона и прикрывает соседние узлы.',
    descriptionEn: 'Armor plate absorbs part of incoming damage and protects nearby systems.'
  },
  hull: {
    kind: 'hull', icon: '▭', short: 'HULL', ru: 'Корпус', en: 'Hull',
    roleRu: 'Каркас корабля', roleEn: 'Ship frame',
    descriptionRu: 'Главная конструкция корабля. Критические повреждения вызывают каскад.',
    descriptionEn: 'Main ship structure. Critical damage can trigger cascade failures.'
  },
  sensor: {
    kind: 'sensor', icon: '◉', short: 'NAV', ru: 'Навигация', en: 'Navigation',
    roleRu: 'Наведение и расчёт траектории', roleEn: 'Targeting and trajectory',
    descriptionRu: 'Определяет точность. При повреждении снаряды заметно отклоняются и могут уйти далеко от цели.',
    descriptionEn: 'Controls accuracy. When damaged, projectiles visibly drift and may miss far from the target.'
  }
};

const ID_OVERRIDES: Record<string, Partial<ModuleMeta>> = {
  'armor-top': { ru: 'Верхняя броня', en: 'Top armor' },
  'armor-left': { ru: 'Левая броня', en: 'Port armor' },
  'armor-right': { ru: 'Правая броня', en: 'Starboard armor' },
  'weapon-left': { ru: 'Левое орудие', en: 'Port weapon' },
  'weapon-right': { ru: 'Правое орудие', en: 'Starboard weapon' },
  'engine-left': { ru: 'Левый двигатель', en: 'Port engine' },
  'engine-right': { ru: 'Правый двигатель', en: 'Starboard engine' }
};

export const MODULE_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['core', 'sensor'],
  ['core', 'weapon-left'],
  ['core', 'weapon-right'],
  ['core', 'hull'],
  ['core', 'armor-top'],
  ['core', 'armor-left'],
  ['core', 'armor-right'],
  ['hull', 'engine-left'],
  ['hull', 'engine-right']
];

export function moduleKindFromId(id: string): ModuleKind {
  if (id.includes('armor')) return 'armor';
  if (id.includes('weapon')) return 'weapon';
  if (id.includes('engine')) return 'engine';
  if (id === 'sensor') return 'sensor';
  if (id === 'hull') return 'hull';
  return 'core';
}

export function moduleMeta(id: string): ModuleMeta {
  const base = MODULE_KIND_META[moduleKindFromId(id)];
  return { ...base, ...(ID_OVERRIDES[id] ?? {}) };
}
