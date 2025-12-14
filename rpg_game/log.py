# log.py
"""游戏更新日志系统"""

import os
from datetime import datetime

# 日志文件路径
LOG_FILE = "update_log.txt"


def init_log():
    """初始化日志文件（若不存在则创建）"""
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write("===== 游戏更新日志 =====\n")
            f.write(f"日志创建时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")


def add_update_log(version: str, content: list):
    """
    添加更新日志（新版本插入到文件顶部）
    :param version: 版本号
    :param content: 更新内容列表（每行一个条目）
    """
    init_log()

    with open(LOG_FILE, "r+", encoding="utf-8") as f:
        # 读取现有内容
        existing = f.read()
        # 移动到文件开头
        f.seek(0, 0)
        # 写入新版本日志头部
        f.write(f"=== 版本 {version} - {datetime.now().strftime('%Y-%m-%d')} ===\n")
        # 写入版本更新内容
        for item in content:
            f.write(f"{item}\n")
        # 空行分隔不同版本
        f.write("\n")
        # 写入原有内容
        f.write(existing)


def show_update_log():
    """在控制台显示完整更新日志"""
    if not os.path.exists(LOG_FILE):
        print("暂无更新日志")
        return

    with open(LOG_FILE, "r", encoding="utf-8") as f:
        print(f.read())


# 初始化日志文件
init_log()

# 批量添加所有版本更新日志（按 V1.0.0 → V1.0.6 顺序）
if __name__ == "__main__":
    # ===================== V1.0.0 基础功能修复与优化 =====================
    v100 = [
        "- 修复Equipment类参数不匹配问题，移除max_durability等未定义属性",
        "- 更新save_load.py序列化/反序列化逻辑，与最新数据结构匹配",
        "- 优化战斗系统中的宠物AI效率计算",
        "- 修复技能眩晕效果不生效的问题",
        "- 完善装备管理系统中的穿戴逻辑",
        "- 添加套装效果系统，支持多套装属性叠加",
        "- 优化任务与成就解锁逻辑"
    ]

    # ===================== V1.0.1 Item类实例化错误修复 =====================
    v101 = [
        "- 修正scene_manager.py中Item类实例化参数错误：type改为item_type，匹配类定义",
        "- 补充Item类缺失的effect（效果描述）和value（效果数值）必填参数",
        "- 解决TypeError: Item.__init__() got an unexpected keyword argument 'type'错误",
        "- 解决TypeError: Item.__init__() missing 2 required positional arguments: 'effect' and 'value'错误"
    ]

    # ===================== V1.0.2 Scene类实例化错误修复 =====================
    v102 = [
        "- 补全Scene类实例化时缺失的7个必填参数：type、difficulty、recommended_level、unlock_level、description、monsters、enter_cost",
        "- 统一所有Scene实例的参数格式，确保与dataclasses定义完全匹配",
        "- 解决TypeError: Scene.__init__() missing 7 required positional arguments错误"
    ]

    # ===================== V1.0.3 核心功能完善 =====================
    v103 = [
        "- 装备穿戴功能从空实现变为可运行",
        "- 道具使用冷却逻辑生效，避免重复使用",
        "- 套装效果可正常触发/移除",
        "- 避免访问不存在的scene.is_boss_scene属性导致崩溃",
        "- 完善main.py中equip_equipment方法：补充装备穿戴逻辑、套装效果检查、错误处理",
        "- 优化game_systems.py中player_turn方法：完善道具冷却机制、宠物攻击逻辑、技能冷却更新",
        "- 新增check_set_bonuses函数，实现套装效果激活/失效逻辑",
        "- 在refresh_world_boss函数中增加属性存在性检查（hasattr），提升代码健壮性"
    ]

    # ===================== V1.0.4 功能补全与逻辑完善 =====================
    v104 = [
        "- 补充data_structures.py中Attribute类完整定义，包含基础属性与火焰/冰霜等元素伤害属性",
        "- 解决因类未定义导致的实例化失败问题",
        "- 补全game_systems.py中player_turn函数功能：",
        "  - 完善道具使用逻辑（消耗品筛选、冷却判定、效果触发、堆叠更新、背包清理）",
        "  - 补全宠物攻击逻辑（存在性校验、AI效率伤害计算、怪物血量扣减）",
        "  - 新增无效选择处理（默认普通攻击）、技能冷却递减逻辑",
        "- 清理utils.py中重复定义的工具函数，保留一份完整的calculate_damage、update_pet_ai_efficiency等核心方法",
        "- 完善calculate_damage函数：新增命中判定、暴击倍率计算、元素伤害加成逻辑",
        "- 补充main.py中equip_equipment函数装备穿戴逻辑：",
        "  - 新增装备等级限制校验、旧装备卸下归还背包、新装备穿戴及背包移除逻辑",
        "  - 增加套装效果检查入口check_set_bonuses(player)"
    ]

    # ===================== V1.0.5 系统优化与容错提升 =====================
    v105 = [
        "- 道具系统优化：增加2秒使用冷却、支持堆叠数量自动扣减、堆叠为0时自动移除道具",
        "- 伤害计算优化：元素伤害叠加至最终伤害、暴击判定独立且倍率支持自定义",
        "- 装备系统优化：穿戴装备时自动卸下同部位旧装备",
        "- 容错性提升：所有用户输入环节增加try-except校验，避免非数字输入导致崩溃"
    ]

    # ===================== V1.0.6 系统深度优化与功能增强 =====================
    v106 = [
        "- 战斗系统（utils.py）：",
        "  - 修复暴击倍率打印错误（x1.5 → {crit_multiplier:.1f}x）",
        "  - 修正伤害计算中防御参数传递错误（玩家实际防御替代血量）",
        "  - 完善暴击判定逻辑，暴击倍率动态显示（1.5x/2.0x）",
        "  - 新增元素伤害加成（火焰/冰霜/雷电/暗黑）、魔法抗性减免逻辑（减免比例=魔法抗性/100）",
        "  - 增加最低1点伤害限制，玩家/怪物血量边界保护（最低0点）",
        "- 属性系统（data_structures.py）：",
        "  - 新增dark_damage（暗黑伤害）、magic_resist（魔法抗性）属性",
        "- 场景系统（scene_manager.py）：",
        "  - 修正暗黑巨龙属性中dark_damage调用错误",
        "  - 补充怪物完整属性（attack/defense），避免战斗计算异常",
        "- 装备系统（game_systems.py）：",
        "  - 修复套装属性中magic_resist未定义问题",
        "  - 新增魔法抗性对元素伤害的减免逻辑",
        "- 任务成就系统（quest_achievement.py）：",
        "  - 补充完整的任务/成就/称号系统实现",
        "  - 添加导入容错机制，模块缺失时启用内置简化版",
        "  - 初始化新手任务（首次战斗/装备强化/宠物进化）",
        "  - 成就解锁自动关联称号，日常任务每20游戏时间单位刷新",
        "  - 任务完成自动发放奖励，成就进度实时更新",
        "- 主程序（main.py）：",
        "  - 修复quest_achievement模块导入错误",
        "  - 完善输入容错处理（非数字输入不崩溃）",
        "  - 补充宠物/装备/任务的交互逻辑",
        "- 宠物系统完善：",
        "  - 扩展宠物类型（野兽/魔法/亡灵/机械/元素/神圣/暗影）",
        "  - 实现宠物进化/忠诚度提升功能",
        "  - 宠物状态面板显示进化阶段/AI效率/技能冷却",
        "- 场景与怪物优化：",
        "  - 新增新手村/迷雾森林/暗黑洞穴等场景",
        "  - 完善暗黑巨龙BOSS属性，丰富掉落奖励",
        "  - 优化世界BOSS定时刷新机制，刷新后属性增强、掉落提升",
        "  - 增加场景进入消耗检查，道具不足时禁止进入",
        "- 装备系统增强：",
        "  - 完善套装效果激活逻辑，集齐指定数量自动生效属性加成",
        "  - 新增装备附魔/合成/分解完整交互流程",
        "  - 装备强化/修理功能增加容错处理，材料不足时给出明确提示",
        "  - 套装属性新增魔法抗性加成，提升角色生存能力"
    ]

    # 按版本顺序添加日志（V1.0.0 最先添加，V1.0.6 最后添加）
    add_update_log("1.0.0", v100)
    add_update_log("1.0.1", v101)
    add_update_log("1.0.2", v102)
    add_update_log("1.0.3", v103)
    add_update_log("1.0.4", v104)
    add_update_log("1.0.5", v105)
    add_update_log("1.0.6", v106)

    print("✅ 所有版本更新日志已写入 update_log.txt")
    # 可选：显示日志内容
    # show_update_log()
