# scene_manager.py
"""场景和怪物管理模块"""
from data_structures import Scene, Monster, Item, Attribute


def init_scenes():
    """初始化所有游戏场景"""
    # 普通怪物
    goblin = Monster(
        name="哥布林",
        level=1,
        hp=30,
        mp=10,
        attributes=Attribute(
            attack=5,
            defense=2,
            speed=8,
            crit_chance=0.05
        ),
        is_boss=False,
        drop_items=[
            Item(name="铜币", item_type="货币", effect="增加金币", value=10, stack=10),
            Item(name="破旧的匕首", item_type="装备", effect="提升攻击", value=3, stack=1)
        ]
    )

    wolf = Monster(
        name="野狼",
        level=3,
        hp=50,
        mp=0,
        attributes=Attribute(
            attack=8,
            defense=3,
            speed=15,
            dodge_chance=0.1,
            crit_chance=0.08
        ),
        is_boss=False,
        drop_items=[
            Item(name="银币", item_type="货币", effect="增加金币", value=20, stack=20),
            Item(name="狼皮", item_type="材料", effect="用于合成", value=0, stack=1)
        ]
    )

    # BOSS怪物
    dark_dragon = Monster(
        name="暗黑巨龙",
        level=20,
        hp=1000,
        mp=500,
        attributes=Attribute(
            attack=80,
            defense=40,
            speed=20,
            dodge_chance=0.15,
            fire_damage=25,
            crit_chance=0.1,
            crit_damage=2.0
        ),
        is_boss=True,
        drop_items=[
            Item(name="龙鳞", item_type="材料", effect="用于合成高级装备", value=0, stack=5),
            Item(name="高级强化石", item_type="强化材料", effect="装备强化", value=5, stack=3),
            Item(name="龙血", item_type="药剂", effect="恢复生命值", value=200, stack=2)
        ]
    )

    # 场景列表（补全所有Scene参数）
    scenes = [
        # 新手村
        Scene(
            name="新手村郊外",
            type="普通",  # 补全参数
            difficulty="简单",  # 补全参数
            recommended_level=1,  # 补全参数
            unlock_level=1,  # 补全参数
            description="新手村外的安全区域，适合新手练级",  # 补全参数
            monsters=[goblin],  # 补全参数
            enter_cost=None,  # 补全参数
            clear_reward=[
                Item(name="铜币", item_type="货币", effect="增加金币", value=50, stack=50),
                Item(name="新手药剂", item_type="消耗品", effect="恢复生命值", value=100, stack=2)
            ]
        ),
        # 森林
        Scene(
            name="迷雾森林",
            type="普通",  # 补全参数
            difficulty="普通",  # 补全参数
            recommended_level=3,  # 补全参数
            unlock_level=2,  # 补全参数
            description="充满野狼的迷雾森林",  # 补全参数
            monsters=[wolf],  # 补全参数
            enter_cost=None,  # 补全参数
            clear_reward=[
                Item(name="银币", item_type="货币", effect="增加金币", value=100, stack=100),
                Item(name="治疗药剂", item_type="消耗品", effect="恢复生命值", value=150, stack=1)
            ]
        ),
        # BOSS副本
        Scene(
            name="暗黑洞穴",
            type="BOSS副本",  # 补全参数
            difficulty="困难",  # 补全参数
            recommended_level=18,  # 补全参数
            unlock_level=15,  # 补全参数
            description="盘踞着暗黑巨龙的危险洞穴",  # 补全参数
            monsters=[dark_dragon],  # 补全参数
            enter_cost=Item(name="副本通行证", item_type="消耗品", effect="进入副本", value=0, stack=1),  # 补全参数
            clear_reward=[
                Item(name="金币", item_type="货币", effect="增加金币", value=5000, stack=5000),
                Item(name="史诗装备箱", item_type="装备", effect="随机获得史诗装备", value=0, stack=1),
                Item(name="龙鳞套装", item_type="装备", effect="提升全属性", value=50, stack=1)
            ]
        )
    ]
    return scenes


def get_scene_by_name(scene_name: str):
    """根据名称获取场景"""
    scenes = init_scenes()
    for scene in scenes:
        if scene.name == scene_name:
            return scene
    return None


def get_boss_scenes():
    """获取所有BOSS场景"""
    scenes = init_scenes()
    return [s for s in scenes if "BOSS" in s.type]


def refresh_world_boss(scene: Scene, game_time: int):
    """刷新世界BOSS（每30分钟刷新）"""
    if hasattr(scene, 'is_boss_scene') and scene.is_boss_scene and game_time % 30 == 0:
        print(f"\n🌎 世界BOSS {scene.monsters[0].name} 已刷新！")
        # 增强BOSS属性
        scene.monsters[0].attributes.attack *= 1.2
        scene.monsters[0].hp *= 1.5
        # 提升掉落奖励
        scene.monsters[0].drop_items.append(
            Item(name="稀有材料箱", item_type="材料", effect="随机获得稀有材料", value=0, stack=1)
        )
