# game_systems.py
import random

from data_structures import Player, Item, Skill, Attribute, Monster, Scene
from quest_achievement import check_achievement, unlock_title
from utils import calculate_damage, update_pet_ai_efficiency, stack_item

# 套装效果配置（新增：避免重复叠加的标记）
SET_BONUSES = {
    "勇者套装": (2, Attribute(attack=20, hp=50, crit_chance=0.05), "勇者套装激活"),
    "史诗战神套装": (3, Attribute(attack=50, crit_damage=0.3, hp=150), "史诗战神套装激活"),
    "暗影刺客套装": (4, Attribute(dodge_chance=0.2, speed=10, crit_chance=0.15), "暗影刺客套装激活"),
    "猛兽獠牙套装": (2, Attribute(attack=15, crit_chance=0.1), "猛兽獠牙套装激活"),
    "魔法守护套装": (3, Attribute(defense=20, hp=80, mp=50), "魔法守护套装激活"),
    "机械核心套装": (4, Attribute(attack=25, defense=15, speed=5), "机械核心套装激活"),
    "冰霜守护套装": (4, Attribute(defense=30, ice_damage=10, magic_resist=15), "冰霜守护套装激活"),
    "雷霆主宰套装": (2, Attribute(speed=15, thunder_damage=30, dodge_chance=0.1), "雷霆主宰套装激活"),
    "屠龙套装": (3, Attribute(attack=50, fire_damage=20, crit_chance=0.1), "屠龙套装激活")
}

# 附魔效果配置（修复属性名称匹配）
ENCHANT_EFFECTS = {
    "火焰": {"attack": 5, "fire_damage": 10, "crit_chance": 0.02},
    "冰霜": {"defense": 8, "dodge_chance": 0.05, "ice_damage": 5},
    "雷电": {"crit_damage": 0.3, "hit_chance": 0.05, "thunder_damage": 8},
    "神圣": {"hp": 50, "mp": 30, "heal_effect": 0.1},
    "暗影": {"attack": 8, "lifesteal": 0.05, "speed": 3}
}


def init_player_basics(player: Player):
    """初始化玩家基础数据（技能/称号/道具）"""
    # 初始化套装激活标记（修复重复叠加问题）
    if not hasattr(player, 'active_sets'):
        player.active_sets = set()

    # 初始技能树
    player.skill_tree = [
        Skill("重击", 1, 1.5, 8, effect="无", description="强力一击，造成150%伤害"),
        Skill("闪避术", 2, 0, 5, effect="提升闪避", description="10秒内闪避率提升20%"),
        Skill("生命吸取", 3, 1.2, 10, effect="吸血", description="造成伤害的30%转化为生命值"),
        Skill("雷霆一击", 5, 2.0, 20, effect="眩晕", combo_skill="重击", description="眩晕目标2回合，需先使用重击触发")
    ]

    # 解锁初始技能
    player.unlocked_skills = [s for s in player.skill_tree if s.level_require <= player.level]

    # 初始道具
    player.inventory = [
        Item("小型生命药水", "消耗品", "恢复生命值", 50, stack=5),
        Item("小型法力药水", "消耗品", "恢复法力值", 30, stack=3),
        Item("强化石", "材料", "装备强化材料", 0, stack=10),
        Item("修理锤", "消耗品", "恢复装备耐久", 50, stack=2)
    ]

    # 初始化道具冷却（修复未初始化问题）
    if not player.last_item_use:
        player.last_item_use = {}


def player_level_up(player: Player) -> bool:
    """玩家升级逻辑"""
    leveled_up = False
    while player.exp >= player.max_exp:
        # 升级
        player.level += 1
        leveled_up = True
        remaining_exp = player.exp - player.max_exp

        # 升级属性加成
        player.attributes.hp += 30
        player.attributes.mp += 15
        player.attributes.attack += 3
        player.attributes.defense += 2
        player.attributes.speed += 1

        # 重置经验
        player.max_exp = int(player.max_exp * 1.5)  # 每次升级所需经验增加50%
        player.exp = remaining_exp if remaining_exp > 0 else 0

        print(f"\n📈 恭喜升级！当前等级：Lv.{player.level}")
        print(f"属性提升：HP+30 MP+15 攻击+3 防御+2 速度+1")

        # 解锁新技能
        new_skills = [s for s in player.skill_tree
                      if s.level_require == player.level
                      and s not in player.unlocked_skills]
        for skill in new_skills:
            player.unlocked_skills.append(skill)
            print(f"解锁新技能：{skill.name} - {skill.description}")

    return leveled_up


# ------------------------ 战斗系统 ------------------------
def battle(player: Player, scene: Scene, monster: Monster) -> bool:
    """核心战斗逻辑（修复BOSS技能释放和宠物AI）"""
    print(f"\n=== 进入战斗：{scene.name} - {monster.name} Lv.{monster.level} ===")
    if monster.is_boss:
        print("⚠️ 警告：遭遇BOSS！战斗难度大幅提升！")

    # 备份玩家原始属性（防止战斗中属性永久修改）
    player_original_attr = Attribute(
        hp=player.attributes.hp,
        mp=player.attributes.mp,
        attack=player.attributes.attack,
        defense=player.attributes.defense,
        crit_chance=player.attributes.crit_chance,
        dodge_chance=player.attributes.dodge_chance,
        crit_damage=player.attributes.crit_damage,
        hit_chance=player.attributes.hit_chance,
        speed=player.attributes.speed,
        fire_damage=player.attributes.fire_damage,
        ice_damage=player.attributes.ice_damage,
        thunder_damage=player.attributes.thunder_damage,
        dark_damage=player.attributes.dark_damage,
        magic_resist=player.attributes.magic_resist,
        lifesteal=player.attributes.lifesteal,
        heal_effect=player.attributes.heal_effect
    )

    player_hp = player.attributes.hp
    player_mp = player.attributes.mp
    monster_hp = monster.attributes.hp
    round_count = 0
    monster_stunned = False

    # 宠物准备（修复AI效率计算）
    if player.pet:
        update_pet_ai_efficiency(player.pet)
        print(
            f"🐾 你的宠物{player.pet.name}加入战斗！忠诚度：{player.pet.loyalty} (AI效率：{player.pet.ai_efficiency:.1f}x)")

    # 战斗循环
    while player_hp > 0 and monster_hp > 0:
        round_count += 1
        print(f"\n----- 第{round_count}回合 -----")

        # 重置眩晕状态
        if monster_stunned:
            monster_stunned = False
            print(f"{monster.name}从眩晕中恢复了！")

        # 速度判定出手顺序
        player_first = player.attributes.speed >= monster.attributes.speed

        if player_first:
            # 玩家回合
            player_hp, player_mp, monster_hp, monster_stunned = player_turn(
                player, player_hp, player_mp, monster_hp, monster, round_count
            )
            if monster_hp <= 0:
                break
            # 怪物回合（修复眩晕判定）
            if not monster_stunned:
                player_hp = monster_turn(player_hp, monster, player.attributes)
            else:
                print(f"{monster.name}处于眩晕状态，无法行动！")
        else:
            # 怪物先出手（修复眩晕判定）
            if not monster_stunned:
                player_hp = monster_turn(player_hp, monster, player.attributes)
            else:
                print(f"{monster.name}处于眩晕状态，无法行动！")
            if player_hp <= 0:
                break
            # 玩家回合
            player_hp, player_mp, monster_hp, monster_stunned = player_turn(
                player, player_hp, player_mp, monster_hp, monster, round_count
            )

        # 技能冷却减少
        for skill in player.unlocked_skills:
            if skill.current_cooldown > 0:
                skill.current_cooldown -= 1

    # 恢复玩家原始属性
    player.attributes = player_original_attr

    # 战斗结算
    if player_hp > 0:
        print(f"\n🎉 击败{monster.name}！")
        battle_reward(player, monster, scene)
        check_achievement(player, "first_kill")
        if monster.is_boss:
            check_achievement(player, "boss_kill")
            unlock_title(player, "副本征服者")
        return True
    else:
        print("\n💀 你被击败了！损失部分金币和经验")
        player.gold = max(0, player.gold - monster.level * 10)
        player.exp = max(0, player.exp - monster.level * 5)
        return False


def player_turn(player: Player, player_hp: int, player_mp: int, monster_hp: int, monster: Monster,
                round_count: int) -> tuple:
    """玩家回合逻辑（修复道具冷却和技能效果）"""
    monster_stunned = False
    print(f"\n你的回合！HP：{player_hp} MP：{player_mp}")
    print("1. 普通攻击  2. 使用技能  3. 使用道具  4. 宠物攻击")

    # 修复输入容错
    try:
        choice = input("选择操作：").strip()
    except:
        choice = "1"  # 默认普通攻击

    if choice == "1":
        # 普通攻击
        damage = calculate_damage(player.attributes, monster.attributes)
        monster_hp -= damage
        print(f"你对{monster.name}造成{damage}点伤害！")

    elif choice == "2":
        # 技能攻击
        if not player.unlocked_skills:
            print("暂无解锁技能！")
            return player_hp, player_mp, monster_hp, monster_stunned

        print("可用技能：")
        for i, skill in enumerate(player.unlocked_skills):
            if skill.current_cooldown > 0:
                print(f"{i + 1}. {skill.name} (冷却中：{skill.current_cooldown}回合) - {skill.description}")
            else:
                print(f"{i + 1}. {skill.name} (MP：{skill.mp_cost}) - {skill.description}")

        try:
            skill_choice = input("选择技能（输入序号，0取消）：").strip()
            if skill_choice.isdigit() and 1 <= int(skill_choice) <= len(player.unlocked_skills):
                skill = player.unlocked_skills[int(skill_choice) - 1]
                if skill.current_cooldown > 0:
                    print("技能冷却中！")
                elif player_mp < skill.mp_cost:
                    print("法力值不足！")
                else:
                    player_mp -= skill.mp_cost
                    base_damage = calculate_damage(player.attributes, monster.attributes)
                    damage = int(base_damage * skill.damage_multiplier)
                    monster_hp -= damage
                    print(f"使用{skill.name}！对{monster.name}造成{damage}点伤害！")

                    # 技能效果（修复眩晕标记）
                    if skill.effect == "吸血":
                        heal = int(damage * 0.3)
                        player_hp = min(player.attributes.hp, player_hp + heal)
                        print(f"吸血效果：恢复{heal}点生命值！")
                    elif skill.effect == "眩晕":
                        monster_stunned = True
                        print(f"{monster.name}被眩晕！下一回合无法行动！")

                    # 组合技
                    if skill.combo_skill:
                        combo_skill = next((s for s in player.unlocked_skills if s.name == skill.combo_skill), None)
                        if combo_skill and combo_skill.current_cooldown == 0:
                            combo_damage = int(
                                calculate_damage(player.attributes, monster.attributes) * combo_skill.damage_multiplier)
                            monster_hp -= combo_damage
                            print(f"触发组合技{combo_skill.name}！额外造成{combo_damage}点伤害！")
                            combo_skill.current_cooldown = combo_skill.cooldown

                    skill.current_cooldown = skill.cooldown
            elif skill_choice == "0":
                print("取消使用技能")
            else:
                print("无效选择！")
        except:
            print("无效选择！")


    elif choice == "3":
        # 使用道具（修复冷却逻辑）
        consumables = [i for i in player.inventory if isinstance(i, Item) and i.item_type == "消耗品"]
        if not consumables:
            print("暂无可用道具！")
            return player_hp, player_mp, monster_hp, monster_stunned

        print("可用道具：")
        for i, item in enumerate(consumables):
            cooldown_left = max(0, player.last_item_use.get(item.name, 0) + item.cooldown - round_count)
            status = f"[冷却中: {cooldown_left}回合]" if cooldown_left > 0 else ""
            print(f"{i + 1}. {item.name} ×{item.stack} - {item.effect}+{item.value} {status}")

        try:
            item_choice = input("选择道具（输入序号，0取消）：")
            if item_choice == "0":
                print("取消使用道具")
                return player_hp, player_mp, monster_hp, monster_stunned

            item_choice = int(item_choice) - 1
            if 0 <= item_choice < len(consumables):
                selected_item = consumables[item_choice]
                cooldown_left = max(0, player.last_item_use.get(selected_item.name,
                                                                0) + selected_item.cooldown - round_count)

                if cooldown_left > 0:
                    print(f"道具冷却中，还需{cooldown_left}回合！")
                    return player_hp, player_mp, monster_hp, monster_stunned

                # 使用道具
                if selected_item.name == "小型生命药水":
                    player_hp = min(player.attributes.hp, player_hp + selected_item.value)
                    print(f"使用{selected_item.name}，恢复{selected_item.value}点HP！")
                elif selected_item.name == "小型法力药水":
                    player_mp = min(player.attributes.mp, player_mp + selected_item.value)
                    print(f"使用{selected_item.name}，恢复{selected_item.value}点MP！")
                elif selected_item.name == "修理锤":
                    print("战斗中不能修理装备！")
                    return player_hp, player_mp, monster_hp, monster_stunned

                # 更新使用记录和数量
                player.last_item_use[selected_item.name] = round_count
                selected_item.stack -= 1
                if selected_item.stack <= 0:
                    player.inventory.remove(selected_item)

        except (ValueError, IndexError):
            print("无效选择！")

    elif choice == "4":
        # 宠物攻击
        if not player.pet:
            print("你还没有宠物！")
            return player_hp, player_mp, monster_hp, monster_stunned

        # 宠物攻击概率基于AI效率
        if random.random() < player.pet.ai_efficiency:
            pet_damage = calculate_damage(player.pet.attributes, monster.attributes)
            monster_hp -= pet_damage
            print(f"你的宠物{player.pet.name}对{monster.name}造成{pet_damage}点伤害！")

            # 低概率触发宠物技能
            if player.pet.skills and random.random() < 0.3:
                pet_skill = random.choice(player.pet.skills)
                skill_damage = int(pet_damage * pet_skill.damage_multiplier)
                monster_hp -= skill_damage
                print(f"宠物{player.pet.name}使用了{pet_skill.name}，额外造成{skill_damage}点伤害！")
        else:
            print(f"你的宠物{player.pet.name}没有采取行动！")

    else:
        print("无效选择，默认进行普通攻击！")
        damage = calculate_damage(player.attributes, monster.attributes)
        monster_hp -= damage
        print(f"你对{monster.name}造成{damage}点伤害！")

    return player_hp, player_mp, monster_hp, monster_stunned


def monster_turn(player_hp: int, monster: Monster, player_attr: Attribute) -> int:
    """怪物回合逻辑"""
    print(f"\n{monster.name}的回合！")

    # 普通攻击
    damage = calculate_damage(monster.attributes, player_attr)
    player_hp -= damage
    print(f"{monster.name}对你造成{damage}点伤害！")

    # BOSS特殊技能
    if monster.is_boss and random.random() < 0.3:  # 30%概率释放技能
        if monster.skills:
            skill = random.choice(monster.skills)
            skill_damage = int(calculate_damage(monster.attributes, player_attr) * skill.damage_multiplier)
            player_hp -= skill_damage
            print(f"{monster.name}使用了{skill.name}！对你造成{skill_damage}点伤害！")
        else:
            # 默认BOSS技能
            player_hp -= int(damage * 1.5)
            print(f"{monster.name}发动了强力攻击！对你造成额外伤害！")

    return max(0, player_hp)


def battle_reward(player: Player, monster: Monster, scene: Scene):
    """战斗奖励结算"""
    # 经验奖励
    exp_gain = monster.exp_reward if monster.exp_reward > 0 else monster.level * 20
    player.exp += exp_gain
    print(f"获得{exp_gain}点经验值！")

    # 金币奖励
    gold_gain = monster.level * 15 + random.randint(5, 20)
    player.gold += gold_gain
    print(f"获得{gold_gain}金币！")

    # 物品掉落
    if monster.drop_items and random.random() < 0.7:  # 70%概率掉落物品
        drop_item = random.choice(monster.drop_items)
        stack_item(player, drop_item)
        print(f"获得物品：{drop_item.name}×{drop_item.stack}")

    # BOSS额外奖励
    if monster.is_boss:
        bonus_gold = monster.level * 50
        player.gold += bonus_gold
        print(f"BOSS额外奖励：{bonus_gold}金币！")
