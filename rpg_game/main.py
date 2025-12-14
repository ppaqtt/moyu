"""主游戏类，整合所有游戏系统"""
import os
import random

from data_structures import Player, Attribute, Scene, Item, Equipment
from game_systems import battle
from quest_achievement import init_quests, check_quest_progress, check_achievement
from save_load import save_game, load_game, list_save_slots
from scene_manager import init_scenes, refresh_world_boss
from utils import equip_item, stack_item


class RPGGame:
    """主游戏类，整合所有游戏系统"""

    def __init__(self):
        # 初始化游戏数据
        self.player = None
        self.scenes = init_scenes()
        self.game_time = 0  # 游戏内时间（用于日常任务刷新）
        self.is_running = True
        self.log_file = "update_log.txt"  # 更新日志文件路径

    def create_new_player(self):
        """创建新玩家角色"""
        print("\n===== 创建新角色 =====")
        name = input("请输入角色名称：").strip()
        if not name:
            name = f"勇者{random.randint(1000, 9999)}"
            print(f"使用默认名称：{name}")

        # 初始化玩家基础属性
        base_attr = Attribute(
            hp=100, mp=50, attack=10, defense=5,
            crit_chance=0.1, dodge_chance=0.05,
            crit_damage=1.5, hit_chance=0.95, speed=5
        )

        # 创建玩家对象
        self.player = Player(
            name=name,
            level=1,
            exp=0,
            max_exp=100,
            attributes=base_attr,
            equipment={},
            skill_tree=[],
            unlocked_skills=[],
            pet=None,
            inventory=[],
            titles={},
            active_title=None,
            quests={},
            completed_quests=[],
            achievements={},
            gold=500,
            materials=0,
            last_item_use={}
        )

        # 初始化玩家基础数据
        self.init_player_basics(self.player)
        init_quests(self.player)
        self.init_achievements(self.player)

        print(f"\n🎉 角色创建成功！{self.player.name} Lv.{self.player.level}")
        print(f"初始属性：HP={self.player.attributes.hp} MP={self.player.attributes.mp}")
        print(f"攻击={self.player.attributes.attack} 防御={self.player.attributes.defense}")

    def init_player_basics(self, player):
        """初始化玩家基础数据（物品、技能等）"""
        # 给新手玩家初始物品
        player.inventory.append(Item(name="新手药剂", item_type="消耗品", effect="恢复生命值", value=50, stack=3))
        player.inventory.append(Item(name="铜币", item_type="货币", effect="增加金币", value=10, stack=100))
        player.inventory.append(Equipment(
            name="新手剑",
            equip_type="武器",
            rarity="普通",
            level=1,
            enhance_level=0,
            durability=100,
            max_durability=100,
            attributes=Attribute(attack=5, defense=0),
            enchantment=None,
            is_pet_equip=False,
            set_name=None,
            set_bonus_count=0
        ))

    def init_achievements(self, player):
        """初始化成就系统"""
        player.achievements = {
            "first_kill": ["首次击杀", "击败第一个敌人", 0, False, "金币×200"],
            "boss_kill": ["BOSS猎手", "击败第一个BOSS", 0, False, "史诗装备箱×1"],
            "equip_enhance_5": ["装备大师", "将装备强化到+5", 0, False, "高级强化石×3"],
            "set_collection": ["套装收集者", "收集一整套装备", 0, False, "套装属性加成"],
        }

    def show_status(self):
        """显示角色状态"""
        print("\n===== 角色状态 =====")
        print(f"名称：{self.player.name} 等级：{self.player.level}")
        print(f"经验：{self.player.exp}/{self.player.max_exp}")
        print(f"金币：{self.player.gold} 材料：{self.player.materials}")
        print(f"\n基础属性：")
        print(f"HP：{self.player.attributes.hp} MP：{self.player.attributes.mp}")
        print(f"攻击：{self.player.attributes.attack} 防御：{self.player.attributes.defense}")
        print(f"暴击率：{self.player.attributes.crit_chance:.1%} 闪避率：{self.player.attributes.dodge_chance:.1%}")
        print(f"暴击伤害：{self.player.attributes.crit_damage:.1f}x 速度：{self.player.attributes.speed}")

        # 装备状态
        print(f"\n已装备：")
        if self.player.equipment:
            for equip_type, equip in self.player.equipment.items():
                print(f"  {equip_type}：{equip.name} (+{equip.enhance_level}) [{equip.rarity}]")
        else:
            print("  暂无装备")

        # 宠物状态
        if self.player.pet:
            print(f"\n宠物：{self.player.pet.name} (Lv.{self.player.pet.level})")
            print(f"  类型：{self.player.pet.pet_type} 忠诚度：{self.player.pet.loyalty}")
            print(f"  进化阶段：{self.player.pet.evolution_stage}/{self.player.pet.max_evolution}")

        # 任务/成就
        print(f"\n当前任务：{len(self.player.quests)}个 已完成：{len(self.player.completed_quests)}个")
        print(f"成就进度：{len([1 for a in self.player.achievements.values() if a[3]])}/{len(self.player.achievements)}")

    def explore_scene(self):
        """探索场景"""
        print("\n===== 场景列表 =====")
        # 筛选可进入的场景
        available_scenes = [s for s in self.scenes if s.unlock_level <= self.player.level]

        for i, scene in enumerate(available_scenes):
            boss_mark = " 👑" if "BOSS" in scene.type else ""
            print(f"{i + 1}. {scene.name} [{scene.type}] - 难度：{scene.difficulty} {boss_mark}")
            print(f"   推荐等级：{scene.recommended_level} 描述：{scene.description[:30]}...")

        if not available_scenes:
            print("暂无可进入的场景！请先升级")
            return

        # 选择场景
        try:
            choice = int(input("\n选择要探索的场景（输入序号）：")) - 1
            if 0 <= choice < len(available_scenes):
                target_scene = available_scenes[choice]
                self.enter_scene(target_scene)
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def enter_scene(self, scene: Scene):
        """进入场景"""
        print(f"\n===== 进入 {scene.name} =====")
        print(f"场景类型：{scene.type} 难度：{scene.difficulty}")
        print(f"描述：{scene.description}")

        # 检查进入消耗
        if scene.enter_cost:
            item = next((i for i in self.player.inventory if i.name == scene.enter_cost.name), None)
            if not item or item.stack <= 0:
                print(f"进入需要{scene.enter_cost.name}，当前数量不足！")
                return
            item.stack -= 1
            if item.stack <= 0:
                self.player.inventory.remove(item)
            print(f"消耗{scene.enter_cost.name}×1")

        # 刷新世界BOSS
        refresh_world_boss(scene, self.game_time)

        # 随机遇敌
        encounter_chance = 0.8  # 80%遇敌概率
        if random.random() < encounter_chance:
            # 随机选择怪物
            monster = random.choice(scene.monsters)
            # 检查等级差距
            if monster.level > self.player.level + 5:
                print(f"⚠️ 警告：{monster.name} (Lv.{monster.level}) 等级过高，建议撤退！")
                choice = input("是否挑战？(y/n)：").strip().lower()
                if choice != 'y':
                    print("你选择了撤退")
                    return

            # 进入战斗
            battle_result = battle(self.player, scene, monster)
            if battle_result:
                # 检查任务进度
                check_quest_progress(self.player, monster.name)
                # 检查场景通关
                if all(m.is_boss for m in scene.monsters) and battle_result:
                    print(f"🏆 成功通关{scene.name}！")
                    # 发放通关奖励
                    for reward in scene.clear_reward:
                        stack_item(self.player, reward)
                        print(f"获得奖励：{reward.name}×{reward.stack}")
                    # 解锁BOSS成就
                    check_achievement(self.player, "boss_kill")
        else:
            print("✨ 幸运！未遇到怪物，安全探索")
            # 少量经验奖励
            self.player.exp += 10
            print(f"获得10点经验值")

        # 玩家升级检查
        self.player_level_up(self.player)

    def manage_equipment(self):
        """装备管理"""
        print("\n===== 装备管理 =====")
        print("1. 查看背包  2. 穿戴装备  3. 修理装备")
        print("4. 强化装备  5. 分解装备  6. 合成装备  7. 附魔装备")

        try:
            choice = int(input("\n选择操作："))
            if choice == 1:
                self.show_inventory()
            elif choice == 2:
                self.equip_equipment()
            elif choice == 3:
                self.repair_equipment_ui()
            elif choice == 4:
                self.enhance_equipment_ui()
                # 检查装备强化成就
                for equip in self.player.inventory:
                    if isinstance(equip, Equipment) and equip.enhance_level >= 5:
                        check_achievement(self.player, "equip_enhance_5")
            elif choice == 5:
                self.decompose_equipment_ui()
            elif choice == 6:
                self.craft_equipment_ui()
                # 检查套装收集成就
                check_achievement(self.player, "set_collection")
            elif choice == 7:
                self.enchant_equipment_ui()
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def show_inventory(self):
        """查看背包"""
        print("\n===== 背包 =====")
        if not self.player.inventory:
            print("背包为空！")
            return

        # 分类显示
        equipments = [i for i in self.player.inventory if isinstance(i, Equipment)]
        items = [i for i in self.player.inventory if isinstance(i, Item)]

        if equipments:
            print("装备：")
            for i, equip in enumerate(equipments):
                print(f"{i + 1}. {equip.name} [{equip.rarity}] Lv.{equip.level} +{equip.enhance_level}")
                print(f"   属性：攻击+{equip.attributes.attack} 防御+{equip.attributes.defense}")

        if items:
            print("\n道具：")
            for i, item in enumerate(items):
                print(f"{i + 1}. {item.name} ×{item.stack} - {item.effect}+{item.value}")

    def equip_equipment(self):
        """穿戴装备"""
        equipments = [i for i in self.player.inventory if isinstance(i, Equipment)]
        if not equipments:
            print("暂无可穿戴的装备！")
            return

        print("\n可穿戴的装备：")
        for i, equip in enumerate(equipments):
            print(f"{i + 1}. {equip.name} [{equip.rarity}] - {equip.equip_type}")

        try:
            choice = int(input("\n选择要穿戴的装备：")) - 1
            if 0 <= choice < len(equipments):
                equip_item(self.player, equipments[choice])
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def repair_equipment_ui(self):
        """修理装备界面"""
        equipped = list(self.player.equipment.values())
        if not equipped:
            print("没有已装备的装备可修理！")
            return

        print("\n可修理的装备：")
        for i, equip in enumerate(equipped):
            durability_percent = (equip.durability / equip.max_durability) * 100
            print(
                f"{i + 1}. {equip.name} - 耐久度：{equip.durability}/{equip.max_durability} ({durability_percent:.1f}%)")

        try:
            choice = int(input("\n选择要修理的装备：")) - 1
            if 0 <= choice < len(equipped):
                cost = max(10, (equipped[choice].max_durability - equipped[choice].durability) * 2)
                if self.player.gold >= cost:
                    self.player.gold -= cost
                    equipped[choice].durability = equipped[choice].max_durability
                    print(f"成功修理{equipped[choice].name}，花费{cost}金币")
                else:
                    print("金币不足，无法修理！")
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def enhance_equipment_ui(self):
        """强化装备界面"""
        equipments = [i for i in self.player.inventory if isinstance(i, Equipment)]
        if not equipments:
            print("背包中没有装备可强化！")
            return

        print("\n可强化的装备：")
        for i, equip in enumerate(equipments):
            print(f"{i + 1}. {equip.name} +{equip.enhance_level} [{equip.rarity}]")
            print(f"   当前属性：攻击+{equip.attributes.attack} 防御+{equip.attributes.defense}")

        try:
            choice = int(input("\n选择要强化的装备：")) - 1
            if 0 <= choice < len(equipments):
                equip = equipments[choice]
                cost = (equip.enhance_level + 1) * 50
                if self.player.gold >= cost:
                    success_rate = max(0.3, 1.0 - (equip.enhance_level * 0.1))
                    self.player.gold -= cost
                    if random.random() < success_rate:
                        equip.enhance_level += 1
                        equip.attributes.attack += 2
                        equip.attributes.defense += 1
                        print(f"🎉 强化成功！{equip.name} 变为 +{equip.enhance_level}")
                    else:
                        print(f"💥 强化失败！消耗了{cost}金币")
                else:
                    print("金币不足，无法强化！")
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def decompose_equipment_ui(self):
        """分解装备界面"""
        equipments = [i for i in self.player.inventory if isinstance(i, Equipment)]
        if not equipments:
            print("背包中没有装备可分解！")
            return

        print("\n可分解的装备：")
        for i, equip in enumerate(equipments):
            print(f"{i + 1}. {equip.name} +{equip.enhance_level} [{equip.rarity}]")

        try:
            choice = int(input("\n选择要分解的装备：")) - 1
            if 0 <= choice < len(equipments):
                equip = equipments.pop(choice)
                self.player.inventory.remove(equip)
                materials_gained = (equip.enhance_level + 1) * 5
                self.player.materials += materials_gained
                print(f"分解{equip.name}获得{materials_gained}材料")
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def craft_equipment_ui(self):
        """合成装备界面"""
        print("\n===== 装备合成 =====")
        print("可合成的装备：")
        print("1. 铁剑 [普通] - 材料×30 + 金币×100 (攻击+10)")
        print("2. 铁甲 [普通] - 材料×40 + 金币×120 (防御+8)")
        print("3. 骑士剑 [稀有] - 材料×100 + 金币×300 (攻击+25)")

        try:
            choice = int(input("\n选择要合成的装备："))
            if choice == 1:
                if self.player.materials >= 30 and self.player.gold >= 100:
                    self.player.materials -= 30
                    self.player.gold -= 100
                    new_equip = Equipment(
                        name="铁剑",
                        equip_type="武器",
                        rarity="普通",
                        level=5,
                        enhance_level=0,
                        durability=100,
                        max_durability=100,
                        attributes=Attribute(attack=10, defense=0),
                        enchantment=None,
                        is_pet_equip=False,
                        set_name=None,
                        set_bonus_count=0
                    )
                    self.player.inventory.append(new_equip)
                    print("成功合成铁剑！")
                else:
                    print("材料或金币不足！")
            elif choice == 2:
                if self.player.materials >= 40 and self.player.gold >= 120:
                    self.player.materials -= 40
                    self.player.gold -= 120
                    new_equip = Equipment(
                        name="铁甲",
                        equip_type="armor",
                        rarity="普通",
                        level=5,
                        enhance_level=0,
                        durability=100,
                        max_durability=100,
                        attributes=Attribute(attack=0, defense=8),
                        enchantment=None,
                        is_pet_equip=False,
                        set_name=None,
                        set_bonus_count=0
                    )
                    self.player.inventory.append(new_equip)
                    print("成功合成铁甲！")
                else:
                    print("材料或金币不足！")
            elif choice == 3:
                if self.player.materials >= 100 and self.player.gold >= 300:
                    self.player.materials -= 100
                    self.player.gold -= 300
                    new_equip = Equipment(
                        name="骑士剑",
                        equip_type="武器",
                        rarity="稀有",
                        level=10,
                        enhance_level=0,
                        durability=150,
                        max_durability=150,
                        attributes=Attribute(attack=25, defense=0),
                        enchantment=None,
                        is_pet_equip=False,
                        set_name=None,
                        set_bonus_count=0
                    )
                    self.player.inventory.append(new_equip)
                    print("成功合成骑士剑！")
                else:
                    print("材料或金币不足！")
            else:
                print("无效选择！")
        except ValueError:
            print("请输入数字！")

    def enchant_equipment_ui(self):
        """附魔装备界面"""
        print("\n===== 装备附魔 =====")
        print("当前功能暂未开放，敬请期待！")

    def player_level_up(self, player):
        """玩家升级逻辑"""
        while player.exp >= player.max_exp:
            # 计算溢出经验
            exp_overflow = player.exp - player.max_exp
            # 升级
            player.level += 1
            player.exp = exp_overflow
            # 提升最大经验值
            player.max_exp = int(player.max_exp * 1.5)
            # 属性提升
            player.attributes.hp += 20
            player.attributes.mp += 10
            player.attributes.attack += 3
            player.attributes.defense += 2
            player.attributes.speed += 1
            # 奖励金币
            player.gold += player.level * 50
            print(f"\n🚀 {player.name} 升级了！当前等级：Lv.{player.level}")
            print(f"属性提升：HP+20 MP+10 攻击+3 防御+2 速度+1")
            print(f"获得{player.level * 50}金币奖励")

    def show_quests(self):
        """显示任务列表"""
        print("\n===== 任务列表 =====")
        if not self.player.quests:
            print("当前没有可接任务")
            return

        for i, (quest_id, quest) in enumerate(self.player.quests.items()):
            progress_percent = (quest["progress"] / quest["target"]) * 100
            print(f"{i + 1}. {quest['name']}")
            print(f"   描述：{quest['description']}")
            print(f"   进度：{quest['progress']}/{quest['target']} ({progress_percent:.1f}%)")
            print(f"   奖励：{quest['reward']}")

    def show_achievements(self):
        """显示成就列表"""
        print("\n===== 成就列表 =====")
        for i, (ach_id, ach) in enumerate(self.player.achievements.items()):
            status = "已完成" if ach[3] else "未完成"
            print(f"{i + 1}. {ach[0]} - {status}")
            print(f"   描述：{ach[1]}")
            print(f"   奖励：{ach[4]}")

    def show_update_log(self):
        """查看游戏更新日志"""
        print("\n===== 游戏更新日志 =====")
        # 检查日志文件是否存在
        if not os.path.exists(self.log_file):
            print("暂无更新日志（日志文件不存在）")
            # 可选：创建空的日志文件
            with open(self.log_file, "w", encoding="utf-8") as f:
                f.write("# RPG游戏更新日志\n")
                f.write("## 2025-01-01 v1.0.0\n")
                f.write("- 初始版本发布\n")
                f.write("- 基础角色创建、场景探索、装备系统\n")
            print("已自动创建默认更新日志文件，请查看！")
            return

        # 读取并显示日志内容
        try:
            with open(self.log_file, "r", encoding="utf-8") as f:
                log_content = f.read()
                if log_content:
                    print(log_content)
                else:
                    print("更新日志文件为空")
        except Exception as e:
            print(f"读取更新日志失败：{str(e)}")

    def game_loop(self):
        """游戏主循环"""
        print("===== 欢迎来到RPG冒险世界 =====")

        # 加载存档或创建新角色
        save_slots = list_save_slots()
        if save_slots:
            print("\n检测到存档：")
            for slot, info in save_slots.items():
                print(f"  存档槽位 {slot}：{info}")
            load_choice = input("是否加载存档？(y/n)：").strip().lower()
            if load_choice == 'y':
                try:
                    slot = int(input("请输入存档槽位："))
                    self.player = load_game(slot)
                    if not self.player:
                        print("创建新角色...")
                        self.create_new_player()
                except ValueError:
                    print("输入错误，创建新角色...")
                    self.create_new_player()
            else:
                self.create_new_player()
        else:
            self.create_new_player()

        # 主游戏循环
        while self.is_running:
            print("\n===== 主菜单 =====")
            print("1. 查看状态  2. 探索场景  3. 装备管理")
            print("4. 查看任务  5. 查看成就  6. 保存游戏")
            print("7. 退出游戏  8. 查看更新日志")  # 新增查看更新日志选项

            try:
                choice = int(input("\n请选择操作："))
                if choice == 1:
                    self.show_status()
                elif choice == 2:
                    self.explore_scene()
                    self.game_time += 1  # 每次探索增加游戏时间
                elif choice == 3:
                    self.manage_equipment()
                elif choice == 4:
                    self.show_quests()
                elif choice == 5:
                    self.show_achievements()
                elif choice == 6:
                    try:
                        slot = int(input("请输入存档槽位(1-5)："))
                        if 1 <= slot <= 5:
                            save_game(self.player, slot)
                        else:
                            print("请输入1-5之间的数字！")
                    except ValueError:
                        print("请输入数字！")
                elif choice == 7:
                    confirm = input("确定要退出游戏吗？(y/n)：").strip().lower()
                    if confirm == 'y':
                        self.is_running = False
                        print("感谢游玩！再见～")
                    else:
                        continue
                elif choice == 8:  # 新增查看更新日志逻辑
                    self.show_update_log()
                else:
                    print("无效选择，请输入1-8之间的数字！")
            except ValueError:
                print("请输入数字！")


if __name__ == "__main__":
    game = RPGGame()
    game.game_loop()
