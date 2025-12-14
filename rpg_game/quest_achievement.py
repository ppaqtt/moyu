# quest_achievement.py
"""任务和成就系统核心模块"""


def init_quests(player):
    """初始化玩家任务列表"""
    if not hasattr(player, 'quests'):
        player.quests = {}
    if not hasattr(player, 'completed_quests'):
        player.completed_quests = []

    # 初始任务
    player.quests = {
        "新手任务1": {
            "name": "首次战斗",
            "description": "击败任意怪物",
            "progress": 0,
            "target": 1,
            "reward": "金币×100 + 经验×50"
        },
        "新手任务2": {
            "name": "装备强化",
            "description": "强化装备到+3",
            "progress": 0,
            "target": 3,
            "reward": "强化石×5 + 修理锤×2"
        },
        "新手任务3": {
            "name": "宠物进化",
            "description": "将宠物进化到2阶",
            "progress": 0,
            "target": 2,
            "reward": "进化水晶×10 + 宠物口粮×5"
        }
    }


def init_achievements(player):
    """初始化成就系统"""
    if not hasattr(player, 'achievements'):
        player.achievements = {}
    if not hasattr(player, 'titles'):
        player.titles = {}
    if not hasattr(player, 'active_title'):
        player.active_title = None

    # 初始化成就
    player.achievements = {
        "first_kill": ["首次击杀", 0, 1, False],  # 描述、当前进度、目标、是否完成
        "boss_kill": ["击败首个BOSS", 0, 1, False],
        "equip_enhance_5": ["装备强化+5", 0, 5, False],
        "set_collection": ["集齐套装", 0, 1, False],
        "pet_evolve": ["宠物进化", 0, 1, False]
    }

    # 初始化称号
    player.titles = {
        "新手冒险者": ["完成首次战斗", False],
        "副本征服者": ["击败首个BOSS", False],
        "装备大师": ["强化装备到+5", False],
        "宠物训练师": ["宠物进化到2阶", False]
    }


def check_quest_progress(player, monster_name=None):
    """检查任务进度"""
    if not player.quests:
        return

    # 更新首次战斗任务
    if monster_name and "首次战斗" in [q["name"] for q in player.quests.values()]:
        for qid, quest in player.quests.items():
            if quest["name"] == "首次战斗":
                quest["progress"] = 1
                if quest["progress"] >= quest["target"]:
                    print(f"\n🏆 完成任务：{quest['name']}")
                    print(f"奖励：{quest['reward']}")
                    player.completed_quests.append(qid)
                    del player.quests[qid]
                    # 发放奖励
                    player.gold += 100
                    player.exp += 50


def check_achievement(player, achievement_id):
    """检查成就进度"""
    if achievement_id not in player.achievements:
        return

    # 更新成就进度
    player.achievements[achievement_id][1] += 1
    desc, current, target, completed = player.achievements[achievement_id]

    if current >= target and not completed:
        print(f"\n🏆 解锁成就：{desc}")
        player.achievements[achievement_id][3] = True
        # 解锁对应称号
        if achievement_id == "first_kill":
            unlock_title(player, "新手冒险者")
        elif achievement_id == "boss_kill":
            unlock_title(player, "副本征服者")
        elif achievement_id == "equip_enhance_5":
            unlock_title(player, "装备大师")
        elif achievement_id == "pet_evolve":
            unlock_title(player, "宠物训练师")


def unlock_title(player, title_name):
    """解锁称号"""
    if title_name in player.titles:
        player.titles[title_name] = (player.titles[title_name][0], True)
        print(f"🏅 解锁称号：{title_name} - {player.titles[title_name][0]}")
        # 自动激活首个称号
        if not player.active_title:
            player.active_title = title_name


def refresh_daily_quests(player, game_time):
    """刷新日常任务（每20个游戏时间单位刷新）"""
    if game_time % 20 == 0 and game_time > 0:
        print("\n📅 日常任务已刷新！")
        # 添加日常任务
        player.quests["daily_1"] = {
            "name": "日常战斗",
            "description": "击败5个怪物",
            "progress": 0,
            "target": 5,
            "reward": "金币×200 + 材料×10"
        }
