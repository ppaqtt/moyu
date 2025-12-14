"""游戏核心数据结构定义"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set


@dataclass
class Attribute:
    """属性类，包含所有可量化属性"""
    hp: int = 0
    mp: int = 0
    attack: int = 0
    defense: int = 0
    crit_chance: float = 0.0
    dodge_chance: float = 0.0
    crit_damage: float = 1.0
    hit_chance: float = 1.0
    speed: int = 0
    fire_damage: int = 0
    ice_damage: int = 0
    thunder_damage: int = 0
    dark_damage: int = 0
    magic_resist: int = 0
    lifesteal: float = 0.0
    heal_effect: float = 0.0


@dataclass
class Item:
    """道具类"""
    name: str
    item_type: str  # 消耗品/材料/货币/装备
    effect: str
    value: int
    stack: int = 1
    cooldown: int = 0  # 道具使用冷却时间


@dataclass
class Equipment:
    """装备类"""
    # 无默认值的字段放在前面
    name: str
    equip_type: str
    rarity: str
    level: int
    # 有默认值的字段放在后面
    attributes: Attribute = field(default_factory=Attribute)
    enhance_level: int = 0
    durability: int = 100
    enchant_effect: Dict[str, int] = field(default_factory=dict)
    set_name: str = ""


@dataclass
class Skill:
    """技能类"""
    name: str
    level_require: int
    damage_multiplier: float
    mp_cost: int
    effect: str
    description: str
    combo_skill: str = ""
    cooldown: int = 3
    current_cooldown: int = 0


@dataclass
class Monster:
    """怪物类"""
    name: str
    level: int
    hp: int  # 添加hp属性
    mp: int  # 添加mp属性
    attributes: Attribute
    is_boss: bool
    drop_items: List[Item]


@dataclass
class Scene:
    """场景类"""
    name: str
    type: str  # 普通/BOSS副本/城镇
    difficulty: str
    recommended_level: int
    unlock_level: int
    description: str
    monsters: List[Monster] = field(default_factory=list)
    enter_cost: Optional[Item] = None
    clear_reward: List[Item] = field(default_factory=list)
    is_unlocked: bool = True


@dataclass
class Pet:
    """宠物类"""
    name: str
    pet_type: str
    level: int
    loyalty: int = 100
    evolution_stage: int = 1
    max_evolution: int = 5
    attributes: Attribute = field(default_factory=Attribute)
    ai_efficiency: float = 1.0
    skills: List[Skill] = field(default_factory=list)


@dataclass
class Player:
    """玩家系统"""
    name: str
    level: int = 1
    exp: int = 0
    max_exp: int = 100
    attributes: Attribute = field(default_factory=Attribute)
    equipment: Dict[str, Equipment] = field(default_factory=dict)  # 按装备类型存储
    skill_tree: List[Skill] = field(default_factory=list)
    unlocked_skills: List[Skill] = field(default_factory=list)
    pet: Optional[Pet] = None
    inventory: List[Item] = field(default_factory=list)
    titles: Dict[str, tuple] = field(default_factory=dict)  # {称号: (描述, 是否解锁)}
    active_title: Optional[str] = None
    quests: Dict[str, Dict] = field(default_factory=dict)
    completed_quests: List[str] = field(default_factory=list)
    achievements: Dict[str, list] = field(default_factory=dict)  # {id: [描述, 当前, 目标, 是否完成]}
    gold: int = 0
    materials: int = 0
    last_item_use: Dict[str, int] = field(default_factory=dict)  # {道具名: 上次使用时间}
    active_sets: Set[str] = field(default_factory=set)  # 激活的套装
