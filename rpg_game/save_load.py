import json
import os
import pickle
from datetime import datetime
from typing import Dict

from data_structures import Player, Pet, Equipment, Item, Skill, Attribute

# 存档文件存储路径
SAVE_DIR = "./saves"
if not os.path.exists(SAVE_DIR):
    os.makedirsirs(SAVE_DIR)


def serialize_attribute(attr: Attribute) -> dict:
    """序列化Attribute对象"""
    return {
        "hp": attr.hp,
        "mp": attr.mp,
        "attack": attr.attack,
        "defense": attr.defense,
        "crit_chance": attr.crit_chance,
        "dodge_chance": attr.dodge_chance,
        "crit_damage": attr.crit_damage,
        "hit_chance": attr.hit_chance,
        "speed": attr.speed
    }


def deserialize_attribute(data: dict) -> Attribute:
    """反序列化Attribute对象"""
    return Attribute(
        hp=data["hp"],
        mp=data["mp"],
        attack=data["attack"],
        defense=data["defense"],
        crit_chance=data["crit_chance"],
        dodge_chance=data["dodge_chance"],
        crit_damage=data["crit_damage"],
        hit_chance=data["hit_chance"],
        speed=data["speed"]
    )


def serialize_equipment(equip: Equipment) -> dict:
    """序列化Equipment对象（匹配最新类定义）"""
    return {
        "name": equip.name,
        "equip_type": equip.equip_type,
        "rarity": equip.rarity,
        "level": equip.level,
        "enhance_level": equip.enhance_level,
        "durability": equip.durability,
        "attributes": serialize_attribute(equip.attributes),
        "enchant_effect": equip.enchant_effect,  # 修正为enchant_effect
        "set_name": equip.set_name
        # 移除不存在的字段：max_durability、enchantment、is_pet_equip、set_bonus_count
    }


def deserialize_equipment(data: dict) -> Equipment:
    """反序列化Equipment对象（匹配最新类定义）"""
    return Equipment(
        name=data["name"],
        equip_type=data["equip_type"],
        rarity=data["rarity"],
        level=data["level"],
        enhance_level=data["enhance_level"],
        durability=data["durability"],
        attributes=deserialize_attribute(data["attributes"]),
        enchant_effect=data["enchant_effect"],  # 修正为enchant_effect
        set_name=data["set_name"]
        # 移除不存在的字段：max_durability、enchantment、is_pet_equip、set_bonus_count
    )


# 以下为其余保持不变的代码（序列化/反序列化其他类的方法）
def serialize_skill(skill: Skill) -> dict:
    """序列化Skill对象"""
    return {
        "name": skill.name,
        "unlock_level": skill.unlock_level,
        "damage_multiplier": skill.damage_multiplier,
        "mp_cost": skill.mp_cost,
        "cooldown": skill.cooldown,
        "current_cooldown": skill.current_cooldown,
        "effect": skill.effect,
        "combo_skill": skill.combo_skill,
        "description": skill.description
    }


def deserialize_skill(data: dict) -> Skill:
    """反序列化Skill对象"""
    return Skill(
        name=data["name"],
        unlock_level=data["unlock_level"],
        damage_multiplier=data["damage_multiplier"],
        mp_cost=data["mp_cost"],
        cooldown=data["cooldown"],
        current_cooldown=data["current_cooldown"],
        effect=data["effect"],
        combo_skill=data["combo_skill"],
        description=data["description"]
    )


def serialize_pet(pet: Pet) -> dict:
    """序列化Pet对象"""
    return {
        "name": pet.name,
        "pet_type": pet.pet_type,
        "level": pet.level,
        "exp": pet.exp,
        "max_exp": pet.max_exp,
        "attributes": serialize_attribute(pet.attributes),
        "skills": [serialize_skill(s) for s in pet.skills],
        "equipment": {k: serialize_equipment(v) for k, v in pet.equipment.items()},
        "loyalty": pet.loyalty,
        "evolution_stage": pet.evolution_stage,
        "max_evolution": pet.max_evolution,
        "appearance": pet.appearance,
        "evolve_materials": pet.evolve_materials,
        "ai_efficiency": pet.ai_efficiency
    }


def deserialize_pet(data: dict) -> Pet:
    """反序列化Pet对象"""
    pet = Pet(
        name=data["name"],
        pet_type=data["pet_type"],
        level=data["level"],
        exp=data["exp"],
        max_exp=data["max_exp"],
        attributes=deserialize_attribute(data["attributes"]),
        skills=[deserialize_skill(s) for s in data["skills"]],
        equipment={k: deserialize_equipment(v) for k, v in data["equipment"].items()},
        loyalty=data["loyalty"],
        evolution_stage=data["evolution_stage"],
        max_evolution=data["max_evolution"],
        appearance=data["appearance"],
        evolve_materials=data["evolve_materials"],
        ai_efficiency=data["ai_efficiency"]
    )
    return pet


def serialize_item(item: Item) -> dict:
    """序列化Item对象"""
    return {
        "name": item.name,
        "item_type": item.item_type,
        "effect": item.effect,
        "value": item.value,
        "stack": item.stack,
        "cooldown": item.cooldown
    }


def deserialize_item(data: dict) -> Item:
    """反序列化Item对象"""
    return Item(
        name=data["name"],
        item_type=data["item_type"],
        effect=data["effect"],
        value=data["value"],
        stack=data["stack"],
        cooldown=data["cooldown"]
    )


def serialize_player(player: Player) -> dict:
    """序列化Player对象（核心存档逻辑）"""
    # 处理背包（混合Equipment和Item）
    inventory = []
    for obj in player.inventory:
        if isinstance(obj, Equipment):
            inventory.append(("equipment", serialize_equipment(obj)))
        elif isinstance(obj, Item):
            inventory.append(("item", serialize_item(obj)))

    return {
        "name": player.name,
        "level": player.level,
        "exp": player.exp,
        "max_exp": player.max_exp,
        "attributes": serialize_attribute(player.attributes),
        "equipment": {k: serialize_equipment(v) for k, v in player.equipment.items()},
        "skill_tree": [serialize_skill(s) for s in player.skill_tree],
        "unlocked_skills": [serialize_skill(s) for s in player.unlocked_skills],
        "pet": serialize_pet(player.pet) if player.pet else None,
        "inventory": inventory,
        "titles": player.titles,
        "active_title": player.active_title,
        "quests": player.quests,
        "completed_quests": player.completed_quests,
        "achievements": player.achievements,
        "gold": player.gold,
        "materials": player.materials,
        "last_item_use": player.last_item_use,
        "save_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


def deserialize_player(data: dict) -> Player:
    """反序列化Player对象（核心读档逻辑）"""
    # 恢复背包
    inventory = []
    for obj_type, obj_data in data["inventory"]:
        if obj_type == "equipment":
            inventory.append(deserialize_equipment(obj_data))
        elif obj_type == "item":
            inventory.append(deserialize_item(obj_data))

    player = Player(
        name=data["name"],
        level=data["level"],
        exp=data["exp"],
        max_exp=data["max_exp"],
        attributes=deserialize_attribute(data["attributes"]),
        equipment={k: deserialize_equipment(v) for k, v in data["equipment"].items()},
        skill_tree=[deserialize_skill(s) for s in data["skill_tree"]],
        unlocked_skills=[deserialize_skill(s) for s in data["unlocked_skills"]],
        pet=deserialize_pet(data["pet"]) if data["pet"] else None,
        inventory=inventory,
        titles=data["titles"],
        active_title=data["active_title"],
        quests=data["quests"],
        completed_quests=data["completed_quests"],
        achievements=data["achievements"],
        gold=data["gold"],
        materials=data["materials"],
        last_item_use=data["last_item_use"]
    )
    return player


def save_game(player: Player, save_slot: int = 1) -> bool:
    """
    保存游戏存档
    :param player: 玩家对象
    :param save_slot: 存档槽位（1-5）
    :return: 是否保存成功
    """
    try:
        save_data = serialize_player(player)
        save_path = os.path.join(SAVE_DIR, f"save_slot_{save_slot}.pkl")

        # 使用pickle保存完整对象（兼容复杂数据结构）
        with open(save_path, "wb") as f:
            pickle.dump(save_data, f, protocol=pickle.HIGHEST_PROTOCOL)

        # 同时生成JSON备份（便于手动修改/查看）
        json_path = os.path.join(SAVE_DIR, f"save_slot_{save_slot}_backup.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(save_data, f, ensure_ascii=False, indent=4)

        print(f"✅ 存档成功！存档位置：{save_path}")
        return True
    except Exception as e:
        print(f"❌ 存档失败：{str(e)}")
        return False


def load_game(save_slot: int = 1) -> Player:
    """
    加载游戏存档
    :param save_slot: 存档槽位（1-5）
    :return: 加载后的玩家对象
    """
    try:
        save_path = os.path.join(SAVE_DIR, f"save_slot_{save_slot}.pkl")
        if not os.path.exists(save_path):
            print(f"❌ 存档槽位{save_slot}无存档！")
            return None

        with open(save_path, "rb") as f:
            save_data = pickle.load(f)

        player = deserialize_player(save_data)
        print(f"✅ 读档成功！上次存档时间：{save_data['save_time']}")
        return player
    except Exception as e:
        print(f"❌ 读档失败：{str(e)}")
        return None


def list_save_slots() -> Dict[int, str]:
    """列出所有可用存档槽位及信息"""
    save_slots = {}
    for i in range(1, 6):  # 支持5个存档槽位
        save_path = os.path.join(SAVE_DIR, f"save_slot_{i}.pkl")
        if os.path.exists(save_path):
            try:
                with open(save_path, "rb") as f:
                    save_data = pickle.load(f)
                    save_slots[i] = f"{save_data['name']} (Lv.{save_data['level']}) - {save_data['save_time']}"
            except:
                save_slots[i] = "损坏的存档"
        else:
            save_slots[i] = "空"
    return save_slots
