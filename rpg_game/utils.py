# utils.py
import random
from typing import Optional

from data_structures import Player, Pet, Equipment, Item, Attribute


def calculate_damage(attacker_attr: Attribute, defender_attr: Attribute) -> int:
    """
    计算伤害值（核心伤害公式）
    :param attacker_attr: 攻击者属性
    :param defender_attr: 防御者属性
    :return: 最终伤害值
    """
    # 1. 命中判定
    if random.random() > attacker_attr.hit_chance:
        print("❌ 攻击未命中！")
        return 0

    # 2. 基础伤害 = 攻击者攻击力 - 防御者防御力（最低1点伤害）
    base_damage = max(1, attacker_attr.attack - defender_attr.defense)

    # 3. 暴击判定
    crit_multiplier = 1.0
    if random.random() < attacker_attr.crit_chance:
        crit_multiplier = attacker_attr.crit_damage
        print(f"💥 暴击！伤害倍率{crit_multiplier:.1f}x")

    # 4. 最终伤害计算
    final_damage = int(base_damage * crit_multiplier)

    # 5. 元素伤害加成
    if hasattr(attacker_attr, 'fire_damage') and attacker_attr.fire_damage > 0:
        final_damage += attacker_attr.fire_damage
    if hasattr(attacker_attr, 'ice_damage') and attacker_attr.ice_damage > 0:
        final_damage += attacker_attr.ice_damage
    if hasattr(attacker_attr, 'thunder_damage') and attacker_attr.thunder_damage > 0:
        final_damage += attacker_attr.thunder_damage
    if hasattr(attacker_attr, 'dark_damage') and attacker_attr.dark_damage > 0:
        final_damage += attacker_attr.dark_damage

    return final_damage


def update_pet_ai_efficiency(pet: Pet):
    """更新宠物AI效率（忠诚度转换）"""
    # 忠诚度100→100%效率，50→70%，0→30%
    pet.ai_efficiency = 0.3 + (pet.loyalty / 100) * 0.7
    if pet.loyalty > 80:
        pet.ai_efficiency += 0.1  # 高忠诚度额外加成
    elif pet.loyalty < 20:
        pet.ai_efficiency -= 0.1  # 低忠诚度额外惩罚


def get_item_from_inventory(player: Player, item_name: str) -> Optional[Item]:
    """从背包获取指定道具"""
    return next((i for i in player.inventory if isinstance(i, Item) and i.name == item_name), None)


def get_equipment_from_inventory(player: Player, equip_name: str) -> Optional[Equipment]:
    """从背包获取指定装备"""
    return next((i for i in player.inventory if isinstance(i, Equipment) and i.name == equip_name), None)


def stack_item(player: Player, new_item: Item):
    """堆叠道具（若已存在则增加数量，否则添加新道具）"""
    existing = next((i for i in player.inventory if isinstance(i, Item) and i.name == new_item.name), None)
    if existing:
        existing.stack += new_item.stack
    else:
        player.inventory.append(new_item)


def equip_item(player: Player, equipment: Equipment) -> bool:
    """
    穿戴装备到玩家身上
    :param player: 玩家对象
    :param equipment: 要穿戴的装备
    :return: 是否穿戴成功
    """
    # 检查装备类型是否已存在，若存在则替换
    equip_type = equipment.equip_type
    if equip_type in player.equipment:
        # 将旧装备放回背包
        old_equip = player.equipment[equip_type]
        player.inventory.append(old_equip)
        print(f"已替换{equip_type}：{old_equip.name} → {equipment.name}")
    else:
        print(f"已装备{equip_type}：{equipment.name}")

    # 从背包移除新装备并添加到装备栏
    if equipment in player.inventory:
        player.inventory.remove(equipment)
        player.equipment[equip_type] = equipment
        return True
    return False
