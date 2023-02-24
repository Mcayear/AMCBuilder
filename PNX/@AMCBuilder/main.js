import {
	ll,
	mc,
	Format,
	PermType,
	system,
	logger,
	File,
	WSClient,
	colorLog,
	log,
	NBT,
	i18n
} from '@LiteLoaderLibs/index.js'
import { Player } from "@LiteLoaderLibs/object/Player.js";// 用于code补全
import { loadBDX } from "./util/bdxDecode.js";
import { MainForm } from "./util/form.js";
import {
	writeHistory,
	undo,
	redo,
	clearhistory
} from "./util/history.js";

export function main() {
	const debugMode = false;
	const isPNX = true;
	const header = "[AMCBuilder] ";
	const worldDimid = ["主世界", "下界", "末地"];
	const Config = {
		particles: {
			enable: true,
			name: "minecraft:villager_happy"
		}
	}
	let serverVersion = mc.getBDSVersion().substr(1).split('.');
	const isNewExecuteCommand = (serverVersion[0] > 0 && serverVersion[1] > 18) ? true : false;
	serverVersion = null;

	const ErrorIDList = {
		"double_stone_slab": ["double_stone_block_slab"],
		"stone_slab": ["stone_block_slab"],
		"spruce_fence": ["fence", 1],
		"birch_fence": ["fence", 2],
		"jungle_fence": ["fence", 3],
		"acacia_fence": ["fence", 4],
		"dark_oak_fence": ["fence", 5],
		"white_shulker_box": ["shulker_box", 0],
		"orange_shulker_box": ["shulker_box", 1],
		"magenta_shulker_box": ["shulker_box", 2],
		"light_blue_shulker_box": ["shulker_box", 3],
		"yellow_shulker_box": ["shulker_box", 4],
		"lime_shulker_box": ["shulker_box", 5],
		"pink_shulker_box": ["shulker_box", 6],
		"gray_shulker_box": ["shulker_box", 7],
		"silver_shulker_box": ["shulker_box", 8],
		"cyan_shulker_box": ["shulker_box", 9],
		"purple_shulker_box": ["shulker_box", 10],
		"blue_shulker_box": ["shulker_box", 11],
		"brown_shulker_box": ["shulker_box", 12],
		"green_shulker_box": ["shulker_box", 13],
		"red_shulker_box": ["shulker_box", 14],
		"black_shulker_box": ["shulker_box", 15]
	};

	const DropBlocks = [
		"lava",// 岩浆
		"water",// 水
		"tallgrass",// 草和蕨
		"double_plant",// 高草丛和大型蕨
		"flower",// 花
		"double_plant",// 花丛
		"vine",// 藤蔓
		"carpet",// 地毯
		"lantern",// 灯
		"bamboo",// 竹子
		"reeds",// 甘蔗
		"waterlily",// 睡莲
		"torch",// 火把
		"end_rod",// 末地烛
		"redstone_wire",// 红石粉
		"tripwire",// 绊线
		"pressure_plate",// 压力板
		"flower",// 花、花盆、杜鹃花
		"ladder",// 梯子
		"_sign",// 告示牌
		"button",// 按钮
		"wheat",// 农作物
		"stem",// 农作物的苗
		"beetroot",// 甜菜根
		"potatoes",// 马铃薯
		"cocoa",// 可可
		"carrots",// 胡萝卜
		"lever",// 拉杆
		"deadbush"// 枯萎的灌木
	];
	ll.registerPlugin("AMCBuilder", "LiteLoaderSE-AMCBuilder", {
		major: 1,
		minor: 2,
		revision: 4
	}, {
		Author: "Mcayear"
	});

	// ----- AMCBuilder i18n -----
	File.createDir("plugins/AMCBuilder/language/");
	if (!File.exists("plugins/AMCBuilder/language/zh_CN.json")) {
		File.writeTo("plugins/AMCBuilder/language/zh_CN.json", JSON.stringify({
			"set_pos_succ": "{}设置 pos {} 成功 {} ({})",
			"filename_repeat": "§c{}文件名 {} 重复，请重新传入文件名。",
			"less_1_points": "§c{}请先设置 pos1",
			"less_2_points": "§c{}请先设置 pos1 和 pos2",
			"need_op_perm": "§c{}你没有OP权限。",
			"failblocks_tips": "§b{}任然有 {} 方块未能成功导入，请在控制台查看。",
			"connect_amcb_server_first": "§c{}请先连接至 AMCBuilder 服务器",
			"pls_select_build_target": "§c{}请先选择建筑",
			"import_build_start": "§b{}开始导入 导入过程可能较长 期间服务器可能无法正常处理事务",
			"import_build_ing": "§b{}请等待构建完毕，断开链接将强行停止构建",
			"pos_level_invaild": "§c{}当前世界维度无效！",
			"pos_level_update": "{}维度已更新为 {}",
			"reject_console": "§c{}请使用玩家执行命令"
		}, null, 2));
	}
	if (!File.exists("plugins/AMCBuilder/language/en.json")) File.writeTo("plugins/AMCBuilder/language/en.json", JSON.stringify({
		"set_pos_succ": "{} Setting pos {} succeeded {} ({})",
		"filename_repeat": "§c{}The file name {} is duplicate, please pass in the file name again.",
		"less_1_points": "§c{}Please set pos1 first.",
		"less_2_points": "§c{}Please set pos1 and pos2 first.",
		"need_op_perm": "§c{}You need OP permission.",
		"failblocks_tips": "§b{}There are still {} blocks that could not be imported successfully, please check on the logger.",
		"connect_amcb_server_first": "§c{}Please connect to the AMCBuilder server first.",
		"pls_select_build_target": "§c{}Please select a building first.",
		"import_build_start": "§b{}Starting the import process may take a long time. The server may not be able to process transactions normally.",
		"import_build_ing": "§b{}Please wait until the construction is completed. Disconnecting the link will forcibly stop the construction.",
		"pos_level_invaild": "§c{}The current world dimension is invalid!",
		"pos_level_update": "{}The dimension has been updated to {}",
		"reject_console": "§c{}Please use the player to execute the command"
	}, null, 2));
	i18n.load("plugins/AMCBuilder/language", "zh_CN");

	// ----- AMCBuilder Core -----
	/*
	mc.listen("onServerStarted", () => {
		let cmd = mc.newCommand("amcbuilder", "a mc builder|一MC建筑者", PermType.Any);
		cmd.setAlias("amcb");
		cmd.setEnum("SetPosAction", ["pos1", "pos2"]);
		cmd.setEnum("ChangeAction", ["export", "import"]);
		cmd.setEnum("CloudAction", ["connect", "start", "disconnect"]);
		cmd.setEnum("NoiseAction", ["n", "noise"]);
		cmd.setEnum("HelpAction", ["help"]);
		cmd.setEnum("TestAction", ["test"]);
		cmd.setEnum("-air", ["-air"]);
		cmd.setEnum("-loca", ["-loca"]);
	    
		cmd.mandatory("action", ParamType.Enum, "SetPosAction", 1);
		cmd.mandatory("action", ParamType.Enum, "ChangeAction", 1);
		cmd.mandatory("action", ParamType.Enum, "CloudAction", 1);
		cmd.mandatory("action", ParamType.Enum, "NoiseAction", 1);
		cmd.mandatory("action", ParamType.Enum, "HelpAction", 1);
		cmd.mandatory("action", ParamType.Enum, "TestAction", 1);
		cmd.mandatory("fileName", ParamType.String);
		cmd.optional("-air", ParamType.Enum, "-air", 1);
		cmd.optional("-loca", ParamType.Enum, "-loca", 1);
	    
		cmd.overload(["SetPosAction"]);
		cmd.overload(["ChangeAction", "fileName"]);
		cmd.overload(["ChangeAction", "fileName", "-loca", "-air"]);
		cmd.overload(["CloudAction"]);
		cmd.overload(["NoiseAction"]);
		cmd.overload(["HelpAction"]);
		cmd.overload(["TestAction"]);
		cmd.setCallback(AMCBCommandHandle);
		cmd.setup();
	});
	
	
	function AMCBCommandHandle(_cmd, _ori, out, res) {
		return;
		if (_ori.type != 0) {
		  out.error("Wrong origin type: "+_ori.type);
		  return;
	   }
	   const sender = _ori.player;
	   const args = JSON.stringify(res);
		if (!sender.getExtraData("AMCBPlayer__")) {
			sender.setExtraData("AMCBPlayer__", new AMCBPlayer__(sender.realName));
		}
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		switch (res.action) {
			case "connect": {
				AMCBPlayer.wsConnect();
				break;
			}
			case "start": {
				AMCBPlayer.startBuild();
				break;
			}
			case "disconnect": {
				AMCBPlayer.wsDisconnect();
				break;
			}
			case "export": {
				cmdExportHandle(sender, args);
				break;
			}
			case "import": {
				cmdImportHandle(sender, args);
				break;
			}
			case "n":
			case "noise": {
				AMCBPlayer.noiseGen(sender);
				break;
			}
			case "1":
			case "pos1": {
				AMCBPlayer.updatePos(sender.blockPos, 0);
				sender.tell(header+"设置 pos 1 成功 "+AMCBPlayer.data.pos_[0].join(", ")+" ("+AMCBPlayer.ReginSize+")");
				break;
			}
			case "2":
			case "pos2": {
				AMCBPlayer.updatePos(sender.blockPos, 1);
				sender.tell(header+"设置 pos 2 成功 "+AMCBPlayer.data.pos_[1].join(", ")+" ("+AMCBPlayer.ReginSize+")");
				break;
			}
			case "refail": {
				AMCBPlayer.reFailBlocks();
				break;
			}
			case "test": {
				log(JSON.stringify(sender.getNbt().toObject()));
				break;
			}
			default: 
				return out.success(helpStr);
		}
	}*/

	mc.regConsoleCmd("amcb", "AMCBuilder", AMCBCommandHandle);
	mc.regPlayerCmd("amcb", "AMCBuilder", AMCBCommandHandle);
	/**
	 * 命令回调
	 * @param sender {Player} 玩家对象
	 * @param args {Array} 命令的参数
	 */
	function AMCBCommandHandle(sender, args) {
		if (!sender.realName) {
			logger.info(i18n.tr('reject_console', 0, [header]));
			return;
		}
		if (!sender.isOP()) {
			if (args[0] && args[0] != "help") {
				sender.tell(i18n.tr('need_op_perm', 0, [header]));
			} else {
				sender.tell(helpStr);
			}
			return;
		}
		if (!sender.getExtraData("AMCBPlayer__")) {
			sender.setExtraData("AMCBPlayer__", new AMCBPlayer__(sender.realName));
		}
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		switch (args[0]) {
			case "connect": {
				AMCBPlayer.wsConnect();
				break;
			}
			case "start": {
				AMCBPlayer.startBuild();
				break;
			}
			case "disconnect": {
				AMCBPlayer.wsDisconnect();
				break;
			}
			case "export": {
				cmdExportHandle(sender, args);
				break;
			}
			case "import": {
				cmdImportHandle(sender, args);
				break;
			}
			case "n":
			case "noise": {
				AMCBPlayer.noiseGen(sender);
				break;
			}
			case "1":
			case "pos1": {
				if (args.length >= 4) {
					AMCBPlayer.updatePos({ x: args[1], y: args[2], z: args[3], dimid: (args[4] || 0) }, 0);
				} else {
					AMCBPlayer.updatePos(sender.blockPos, 0);
				}
				AMCBPlayer.tell('set_pos_succ', 0, [header, '1', AMCBPlayer.data.pos_[0].join(", "), AMCBPlayer.ReginSize]);
				break;
			}
			case "2":
			case "pos2": {
				if (args.length >= 4) {
					AMCBPlayer.updatePos({ x: args[1], y: args[2], z: args[3], dimid: (args[4] || 0) }, 1);
				} else {
					AMCBPlayer.updatePos(sender.blockPos, 1);
				}
				AMCBPlayer.tell('set_pos_succ', 0, [header, '2', AMCBPlayer.data.pos_[1].join(", "), AMCBPlayer.ReginSize]);
				break;
			}
			case "fill":
			case "set": {
				if (args[1] && !isNaN(args[1])) {
					args[1] = Number(args[1]);
				}
				if (isNaN(args[2])) {
					args[2] = 0;
				} else {
					args[2] = Number(args[2]);
				}
				cmdFillHandle(sender, args);
				break;
			}
			case "copy": {
				cmdCopyHandle(sender, args);
				break;
			}
			case "cut": {
				cmdCopyHandle(sender, args);
				cmdFillHandle(sender, ["set", 0, 0]);
				break;
			}
			case "flip": {
				cmdFlipHandle(sender, args);
				break;
			}
			case "up": {
				cmdUpHandle(sender, args);
				break;
			}
			case "paste":
			case "pastes": {
				cmdPasteHandle(sender, args);
				break;
			}
			case "replace": {
				cmdReplaceHandle(sender, args);
				break;
			}
			case "setup": {
				playerSetupHandle(sender, args);
				break;
			}
			case "refail": {
				AMCBPlayer.reFailBlocks();
				break;
			}
			default: {
				sender.tell(helpStr);
			}
		}
	}
	if (debugMode) {
		// 长按方块获取方块数据
		mc.listen("onAttackBlock", function (player, block, item) {
			player.tell([block.pos.x, block.pos.y, block.pos.z, block.type, block.id, block.tileData].join("、"));
			let pos = mc.newIntPos(block.pos.x, block.pos.y, block.pos.z, block.pos.dimid);
			let pos2 = mc.newIntPos(block.pos.x, block.pos.y + 5, block.pos.z, block.pos.dimid);
			if (block.hasBlockEntity()) {
				player.tell(block.getBlockEntity().getNbt().toSNBT(2));
				logger.info(block.getBlockEntity().getNbt().toSNBT(2));
			}
			//logger.info(mc.getStructure(pos, pos2).toSNBT(2));
		});
	}

	class AMCBPlayer__ {
		// 成员变量
		//name;
		//data;
		//ws;
		//buildState; 0:未在构建, 1:准备构建, 2:正在构建
		//startTime; 构建开始时间
		//ActionList; 操作列表，一个snbt对象用存储操作前的方块用以撤回或重做（max 20)
		//ActionIndex; 操作下标，用来记录当前的操作在列表中的位置
		//setup;// 配置

		// 构造方法
		constructor(name) {
			this.name = name;
			this.buildState = 0;
			if (this.get()) return;
			this.set({
				"pos_": new Array(2),
				"pos": new Array(2),
				"dimid": 0
			});
			this.ReginSize = 0;
			this.updatePos(this.player().blockPos, 0);
			this.failBlocks = [];
			this.setup = {};
			this.updataSetup();
		}

		// 成员函数
		get() {
			return this.data;
		}
		set(data) {
			this.data = data;
			return true;
		}
		/**
		 * 玩家对象
		 * @returns {Player}
		 */
		player() {
			return getPlayer(this.name);
		}
		tell(text, type = 0, args = []) {
			let player = this.player();
			let msg = i18n.trl(player.langCode, text, args);
			if (!player) {
				logger.info('offline tell to ' + this.name + ':\n  msg:' + msg + '  type:' + type);
				return false;
			}
			player.tell(msg, type);
			return true;
		}
		sendToast(title, message, args = []) {
			let player = this.player();
			let msg = i18n.trl(player.langCode, message, args);
			if (!player) {
				logger.info('offline toast to ' + this.name + ':\n  title:' + i18n.trl(player.langCode, title, args) + '  message:' + msg);
				return false;
			}
			player.sendToast(title, msg);
			return true;
		}
		reFailBlocks() {
			var failBlocks = this.failBlocks;
			this.failBlocks = [];
			this.player().teleport(failBlocks[0][0], failBlocks[0][1], failBlocks[0][2], this.data.dimid);
			for (const block of failBlocks) {
				if (mc.getBlock(block[0], block[1], block[2], this.data.dimid).type != block[3] && !mc.setBlock(block[0], block[1], block[2], block[3], block[4], block[5])) {
					logger.info("Failed place: " + JSON.stringify(block));
					this.failBlocks.push([block[0], block[1], block[2], block[3], block[4], block[5]]);
				}
			}
			if (this.failBlocks.length) this.tell('failblocks_tips', 0, [header, this.failBlocks.length]);
		}
		startBuild() {
			if (!this.ws || this.ws.status != 0) {
				this.tell('connect_amcb_server_first', 0, [header]);
				return false;
			}
			switch (this.buildState) {
				case 0: {
					this.tell('pls_select_build_target', 0, [header]);
					break;
				}
				case 1: {
					if (typeof (this.data.pos[0]) != 'object') {
						return this.tell('less_1_points', 0, [header]);
					}
					this.tell('import_build_start', 0, [header]);
					this.ws.send(JSON.stringify({ type: 'nk-nextCmd' }));
					this.startTime = new Date().getTime();
					break;
				}
				case 2: {
					this.tell('import_build_ing', 0, [header]);
					break;
				}
			}
		}
		updatePos(pos, index) {
			var anti = index ? 0 : 1;
			this.data["pos_"][index] = [pos.x, pos.y, pos.z];
			this.data["pos"][index] = [pos.x, pos.y, pos.z];
			let dimid = isPNX ? (pos.dim || this.player().blockPos.dim) : pos.dimid;
			if (this.data.dimid != dimid) {
				if (pos.dimid === -1) {
					this.tell('pos_level_invaild', 0, [header]);
				} else {
					this.tell('pos_level_update', 0, [header, (isPNX ? dimid : worldDimid[dimid])]);
					this.data.dimid = dimid;
				}
			}
			if (!this.data["pos_"][anti]) {
				return false;
			}

			var xMin = min(this.data["pos_"][index][0], this.data["pos_"][anti][0]);
			var xMax = max(this.data["pos_"][index][0], this.data["pos_"][anti][0]);
			var yMin = min(this.data["pos_"][index][1], this.data["pos_"][anti][1]);
			var yMax = max(this.data["pos_"][index][1], this.data["pos_"][anti][1]);
			var zMin = min(this.data["pos_"][index][2], this.data["pos_"][anti][2]);
			var zMax = max(this.data["pos_"][index][2], this.data["pos_"][anti][2]);

			this.data["pos"][0] = [xMin, yMin, zMin];
			this.data["pos"][1] = [xMax, yMax, zMax];

			this.ReginSize = (xMax - xMin + 1) * (yMax - yMin + 1) * (zMax - zMin + 1);
			this.showRegin();
			return true;
		}
		showRegin() {
			if (!this.data["pos_"][0] || !this.data["pos_"][1]) {
				return false;
			}
			genEdgeParticles(this.data["pos"][0], this.data["pos"][1], this.data.dimid, this.ReginSize);
			return true;
		}
		getSetup(key) {
			return this.setup[key];
		}
		updataSetup(config) {
			if (!File.exists("plugins/AMCBuilder/playerSetup/" + this.name + ".json")) {
				File.writeTo("plugins/AMCBuilder/playerSetup/" + this.name + ".json", JSON.stringify({
					"wood_axe_ui": true,
					"wood_axe_chooes_pos": true
				}, null, 2));
			}
			if (config) {
				File.writeTo("plugins/AMCBuilder/playerSetup/" + this.name + ".json", JSON.stringify(config, null, 2));
			}
			this.setup = JSON.parse(File.readFrom("plugins/AMCBuilder/playerSetup/" + this.name + ".json"));
			return true;
		}
		wsConnect() {
			const isFrist = typeof (this.ws) == 'undefined';
			if (isFrist) {
				this.ws = new WSClient();
			}
			if (this.ws.status === 0) {
				this.player().sendToast("链接成功", "已成功与AMCB服务器链接");
				return logger.info(header + "你已链接服务器");
			}
			this.ws.connectAsync("ws://159.75.109.43:8881", (succ, err) => {
				if (!succ) {
					this.player().sendToast("链接失败", "未能与AMCB取得链接");
					return logger.info(header + "服务器链接失败 failed");
				}
				if (isFrist) {
					setInterval(() => {
						if (this.ws.status != 0) return;
						this.ws.send(JSON.stringify({ "type": "heartPack" }));
					}, 6000);
				}
				if (!isFrist) {// 重复链接时，只需要发送login请求
					this.ws.send(JSON.stringify({ "type": "login" }));
					return;
				}
				this.ws.listen("onBinaryReceived", (msg) => {
					logger.info(msg);
				});
				this.ws.listen("onTextReceived", (msg) => {
					var data = JSON.parse(msg);
					switch (data.type) {
						case "login": {
							var win = mc.newCustomForm();
							win.setTitle('AMCBuilder');
							win.addInput("AMCBuilder 65位用户标识\n请复制下面内容", '', data['uuid'] + '-' + data['key']);
							win.addInput("§c请务必加群\n§c请务必加群\n§c请务必加群\n§rAMCBuilder 官方 QQ 交流群", '', '317055616');
							if (this.player()) {
								this.player().sendForm(win, (player, arr) => { });
								colorLog("green", "Please copy your 65 user-info: " + data['uuid'] + '-' + data['key']);
								this.tell("Please copy your 65 user-info: " + data['uuid'] + '-' + data['key']);
							}
							break;
						}
						case 'selected': {
							this.buildState = 1;
							this.nowBlockId = 0;
							this.totalBlock = data.cmdCount;
							this.failBlocks = [];
							this.tell('§b[AMCBuilder] 已选择建筑 总计' + data.cmdCount + '个方块 (实际可能偏多)');
							break;
						}
						case 'nextCmd': {
							if (!this.buildState) return;
							data = null;
							const cmdList = JSON.parse(str_replace(/setblock  /g, 'setblock ', str_replace(/  /g, ' ', str_replace(/fill  /g, 'fill ', str_replace(/~/g, ' ', str_replace(/\\n/g, '', msg))))))["cmd"];
							const posX = Number(this.data.pos[0][0]);
							const posY = Number(this.data.pos[0][1]);
							const posZ = Number(this.data.pos[0][2]);
							var blockList = new Array();
							cmdList.forEach((v, i) => {
								const row = v[0].split(" ");
								switch (row[0]) {
									case 'setblock': {
										const blockMeta = ErrorIDList[row[4]] || [row[4], row[5]];
										blockList.push([posX + Number(row[1]), posY + Number(row[2]), posZ + Number(row[3]), blockMeta[0], Number(blockMeta[1] || row[5])]);
										break;
									}
									case 'fill': {
										const blockMeta = ErrorIDList[row[7]] || [row[7], row[8]];
										const xMin = posX + min(row[1], row[4]);
										const xMax = posX + max(row[1], row[4]);
										const yMin = posY + min(row[2], row[5]);
										const yMax = posY + max(row[2], row[5]);
										const zMin = posZ + min(row[3], row[6]);
										const zMax = posZ + max(row[3], row[6]);
										for (var x = xMin; x <= xMax; x++) {
											for (var z = zMin; z <= zMax; z++) {
												for (var y = yMin; y <= yMax; y++) {
													blockList.push([x, y, z, blockMeta[0], Number(blockMeta[1] || row[8])]);
												}
											}
										}
										break;
									}
								}
							});
							var dropBlocks = [];
							for (const block of blockList) {
								// 门板特殊值处理
								if (block[3].indexOf("trapdoor") > -1) {
									switch (block[4]) {
										case 12: {
											block[4] = 15;
										}
										case 13: {
											block[4] = 14;
										}
										case 14: {
											block[4] = 13;
										}
										case 15: {
											block[4] = 12;
										}
									}
								}
								// 掉落方块滞后处理
								for (var i = 0; i < dropBlocks.length; i++) {
									if (block[3].includes(dropBlocks[i])) {
										dropBlocks.push([block[0], block[1], block[2], this.data.dimid, "minecraft:" + block[3], block[4]]);
										continue;
									}
								}
								if (mc.getBlock(block[0], block[1], block[2], this.data.dimid).type.indexOf(block[3]) == -1 && !mc.setBlock(block[0], block[1], block[2], this.data.dimid, "minecraft:" + block[3], block[4])) {
									logger.info("Failed place: " + JSON.stringify(block));
									this.failBlocks.push([block[0], block[1], block[2], this.data.dimid, "minecraft:" + block[3], block[4]]);
								}
							}

							for (block of dropBlocks) {
								if (mc.getBlock(block[0], block[1], block[2], this.data.dimid).type != block[3] && !mc.setBlock(block[0], block[1], block[2], block[3], block[4], block[5])) {
									logger.info("Failed place: " + JSON.stringify(block));
									this.failBlocks.push([block[0], block[1], block[2], block[3], "minecraft:" + block[4], block[5]]);
								}
							}

							if (cmdList.length < 1000) {
								this.buildState = 0;
								const finishTime = new Date().getTime() - this.startTime;
								if (this.failBlocks.length) {
									this.tell("§b[AMCBuilder] 有 " + this.failBlocks.length + " 方块未能成功导入，使用 /amcb refail 重新导入错误方块");
								}
								this.tell("§a[AMCBuilder] 导入结束\n  §a用时: " + (finishTime / 1000).toFixed(2) + " s\n  §a速度: " + (this.totalBlock / finishTime * 1000 >> 0) + " C/s");
								this.totalBlock = null;
								this.nowBlockId = null;
								mc.runcmdEx('title "' + this.name + '" title §b[AMCBuilder] 导入结束');
								break;
							} else {
								this.buildState = 2;
								this.ws.send(JSON.stringify({ type: 'nk-nextCmd' }));
								this.nowBlockId += 1000;
								this.tell("§b[AMCBuilder] §e" + this.nowBlockId + "/" + this.totalBlock + " §b已完成§e" + (this.nowBlockId / this.totalBlock).toFixed(2), 5);
							}
						}
					}
				});
				this.ws.listen("onLostConnection", (code) => {
					logger.info(header + "与服务器链接断开 close:" + code);
					this.tell(header + "与服务器链接断开 close:" + code);
					this.player().sendToast("链接已断开", "已断开与AMCB服务器的链接");
					this.buildState = 0;
					this.totalBlock = null;
					this.nowBlockId = null;
				});
				this.ws.listen("onError", (msg) => {
					logger.info(header + "与服务器链接断开 error:" + msg);
					this.tell(header + "与服务器链接断开 error:" + msg);
					this.player().sendToast("链接已断开", "已断开与AMCB服务器的链接");
					this.buildState = 0;
					this.totalBlock = null;
					this.nowBlockId = null;
				})
				this.ws.send(JSON.stringify({ "type": "login" }));
			});
			return this.ws;
		}
		wsDisconnect() {
			if (this.ws.status) return this.tell(header + "请勿重复断开与服务器的链接");
			this.ws.close();
			this.tell(header + "已断开与服务器的链接");
		}
		noiseGen() {
			var xMin = min(this.data["pos"][0][0], this.data["pos"][1][0]);
			var xMax = max(this.data["pos"][0][0], this.data["pos"][1][0]);
			var zMin = min(this.data["pos"][0][2], this.data["pos"][1][2]);
			var zMax = max(this.data["pos"][0][2], this.data["pos"][1][2]);
			noiseGen.setKandB();
			for (let x = xMin; x < xMax; x++) {
				for (let z = zMin; z < zMax; z++) {
					const y = noiseGen.no(Math.abs((x - xMin) / (xMax - xMin)), Math.abs((z - zMin) / (zMax - zMin)));
					mc.setBlock(x, this.data["pos"][0][1] + y, z, this.data.dimid, "minecraft:stone", 0);
				}
			}
		}
	}
	var noiseGen = {
		getRandom: function (min, max) {
			return Math.random() * (max - min + 1) + min;
		},
		setKandB: function () {
			this.K1_0 = this.getRandom(-15, 15);
			this.B1_0 = this.getRandom(-15, 5);
			this.K1_1 = this.getRandom(-15, 15);
			this.B1_1 = this.getRandom(-15, 15);
			this.K2_0 = this.getRandom(-15, 15);
			this.B2_0 = this.getRandom(-15, 5);
			this.K2_1 = this.getRandom(-15, 15);
			this.B2_1 = this.getRandom(-15, 15);
			logger.info([this.K1_0, this.B1_0, this.K1_1, this.B1_1]);
			logger.info([this.K2_0, this.B2_0, this.K2_1, this.B2_1]);
		},
		Wn: function (x) {
			return 6 * Math.pow(x, 5) - 15 * Math.pow(x, 4) + 10 * Math.pow(x, 3);
		},
		ya0: function (x) {
			return this.K1_0 || this.getRandom(-5, 5) * x + this.B1_0 || this.getRandom(-5, 5);
		},
		ya1: function (x) {
			return this.K1_1 || this.getRandom(-5, 5) * x + this.B1_1 || this.getRandom(-5, 5);
		},
		na: function (x) {
			const ya0 = this.ya0(x);
			const ya1 = this.ya1(x);
			return ya0 + this.Wn(x) * (ya1 - ya0);
		},
		yb0: function (x) {
			return this.K2_0 || this.getRandom(-5, 5) * x + this.B2_0 || this.getRandom(-5, 5);
		},
		yb1: function (x) {
			return this.K2_1 || this.getRandom(-5, 5) * x + this.B2_1 || this.getRandom(-5, 5);
		},
		nb: function (x) {
			const yb0 = this.yb0(x);
			const yb1 = this.yb1(x);
			return yb0 + this.Wn(x) * (yb1 - yb0);
		},
		no: function (x, y) {
			return this.na(x) + this.Wn(x * y) * (this.nb(y) - this.na(x));
		}
	};

	// 返回最小数
	function min() {
		var num = Infinity;
		for (const v of arguments) {
			if (v < num) num = v;
		}
		return isNaN(num) ? null : Number(num);
	}
	// 返回最大数
	function max() {
		var num = -Infinity;
		for (const v of arguments) {
			if (v > num) num = v;
		}
		return isNaN(num) ? null : Number(num);
	}
	// 实现intval
	function intval(v) {
		let num = Number(v);
		if (isNaN(num)) return 0;
		return num;
	}
	// 实现str_replace
	function str_replace(inStr, toStr, str) {
		return str.replace(inStr, toStr);
	}
	// 返回Y-m-d H:i:s格式的时间
	function Date2YMD(t) {
		return (t.getHours() < 10 ? "0" + t.getHours() : t.getHours()) + ':' + (t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes()) + ':' + (t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds());
	}
	var CommandList = [
		["amcb", 'AMCBuilder 建筑导入插件主命令', '<amcb1:@text=connect;start;disconnect;pos1;pos2;export>'],
		["amcb connect", '链接amcb服务器'],
		["amcb start", '选择后输入此命令开始建'],
		["amcb disconnect", '断开链接'],
		["amcb pos1", '设置第一个坐标'],
		["amcb pos2", '设置第二个坐标'],
		["amcb import <strng: filename> [-air] [--txt,--mcs] [-loca]", '导入本地建筑文件'],
		["amcb export <strng: filename> [-air] [--txt,--mcs]", '导出选区的建筑物'],
		["amcb refail", '重新导入错误方块'],
		["amcb set <strng: blockSpacename>", '设置选区的方块'],
		["amcb copy", '复制选区的方块'],
		["amcb paste", '粘贴复制的方块至pos1'],
		["amcb flip <x|y|z>", '按照世界坐标系翻转剪贴板的建筑'],
		["amcb up [number: distance] [-f] [-g]", '将你上升一段距离，设置为飞行，在脚下放置一个方块']
	];
	var helpStr = '§7------ AMCBuilder Help ------§a';
	for (let i = 0; i < CommandList.length; i++) {
		helpStr += "\n§2/" + CommandList[i][0] + ":§f " + CommandList[i][1];
	}
	helpStr += "\n§7官网地址: https://amcbuilder.nullatom.com\n官方QQ交流群: 317055616\n§7- 连接后在官网选择建筑并执行/amcb start开始导入";
	CommandList = null;


	// ----- MC Structure -----
	async function readMCStructure(path, callback) {
		if (!File.exists(path)) {
			callback(2, '§c[AMCBuilder] 文件不存在' + path);
			return;
		}
		var fi, binData;
		try {
			fi = new File(path, 0, true);
			binData = fi.readAllSync();
			var comp = NBT.parseBinaryNBT(binData);
			//comp.toSNBT().replace(/:0b/g, ":0").replace(/:1b/g, ":1");
			var data = JSON.parse(comp.toString());
			var pos = data.size;
			comp = null;
			await callback(1, pos[0] * pos[1] * pos[2]);
			await new Promise((resolve, reject) => {
				setTimeout(function () {
					resolve('time');
				}, 1000)
			});
			genStructureCmd(data, callback);
		} catch (err) {
			logger.error(err.toString())
			callback(2, '§c[AMCBuilder] 文件读取错误' + path);
		}
	}
	function genStructureCmd(data, callback) {
		if (data.format_version != 1) {
			logger.info("§e[AMCBuilder] mcstructure 文件版本(" + data.format_version + ")可能不兼容！");
		}
		var pos = data.size;
		var blockPalette = data.structure.palette.default.block_palette;
		var [paletteList, damageList] = data.structure.block_indices;// ZYX
		var index = 0;
		for (let x = 0; x < pos[0]; x++) {
			for (let y = 0; y < pos[1]; y++) {
				for (let z = 0; z < pos[2]; z++) {
					const block = paletteList[index] > -1 ? blockPalette[paletteList[index]] : { name: "minecraft:air", states: {}, "version": 17959425 };
					callback(0, [x, y, z, block, damageList[index]]);
					index++
				}
			}
		}
	}

	// ----- Export Block -----
	File.createDir("./plugins/AMCBuilder/export");
	const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
	// 随机生成字符串
	function generateMixed(n) {
		var res = "";
		for (var i = 0; i < n; i++) {
			var id = Math.ceil(Math.floor(Math.random() * 48));
			res += chars[id];
		}
		return res;
	}
	async function cmdExportHandle(sender, args) {
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		const fileName = args.length > 1 ? args[1] : generateMixed(5);
		if (File.readFrom("./plugins/AMCBuilder/export/" + fileName + ".txt")) {
			return AMCBPlayer.tell('filename_repeat', 0, [header, fileName]);
		}
		try {
			if (typeof (AMCBPlayer.data.pos[0]) != 'object') throw 'pos1';
			if (typeof (AMCBPlayer.data.pos[1]) != 'object') throw 'pos2';
		} catch (e) {
			return AMCBPlayer.tell('less_2_points', 0, [header]);
		}
		const minPos = AMCBPlayer.data.pos[0];
		const maxPos = AMCBPlayer.data.pos[1];
		const isSolid = args.indexOf("-air") == -1;
		if (isSolid) AMCBPlayer.tell('§7[AMCBuilder] 本次导出将过滤空气方块 添加 -air参数可保留');
		await new Promise((resolve, reject) => {
			setTimeout(function () {
				AMCBPlayer.tell("§b[AMCBuilder] 开始导出 总计" + AMCBPlayer.ReginSize + "个方块 预计需要" + (AMCBPlayer.ReginSize / 3e4 >> 0) + "s 期间服务器可能无法正常处理事务");
			}, 200);
			setTimeout(function () {
				resolve('time');
			}, 700);
		});
		if (args.indexOf("--txt") > -1) {
			var xAdd = 0, yAdd = 0, zAdd = 0;
			var cmdList = [];
			const startTime = new Date().getTime();
			for (let x = minPos[0]; x <= maxPos[0]; ++x) {
				zAdd = 0;
				for (let z = minPos[2]; z <= maxPos[2]; ++z) {
					yAdd = 0;
					for (let y = minPos[1]; y <= maxPos[1]; ++y) {
						let block = mc.getBlock(x, y, z, AMCBPlayer.data.dimid);
						if (isSolid && !block.id) {
							++yAdd;
							continue;
						}

						cmdList.push([xAdd, yAdd, zAdd, block.type.substr(10), block.tileData].join(" "));
						++yAdd;
					}
					++zAdd;
				}
				++xAdd;
			}
			const finishTime = new Date().getTime() - startTime;
			AMCBPlayer.sendToast('§b[AMCBuilder]', '导出结束\n§a使用 §e§l/amcb import ' + fileName + ' --txt §r§a可以导入');
			if (cmdList.length === 0) {
				return AMCBPlayer.tell('§c[AMCBuilder] 本次导出数据为空，请重新选择范围。');
			}
			AMCBPlayer.tell("§a[AMCBuilder] 文件导出在 ./plugins/AMCBuilder/export/" + fileName + ".txt\n  §a用时: " + (finishTime / 1000).toFixed(2) + " s\n  §a速度: " + (cmdList.length / finishTime * 1000 >> 0) + " B/s");
			File.writeTo("./plugins/AMCBuilder/export/" + fileName + ".txt", cmdList.join("\n"));
		} else {
			try {
				const size = [maxPos[0] - minPos[0] + 1, maxPos[1] - minPos[1] + 1, maxPos[2] - minPos[2] + 1];
				var snbt = {
					"structure_world_origin": minPos,
					"format_version": 1,
					"size": size,
					"structure": {
						"entities": [],
						"palette": {
							"default": {
								"block_palette": [{
									"name": "minecraft:air",
									"version": 1786555,
									"states": {}
								}],
								"block_position_data": {}
							}
						},
						"block_indices": [
							[],
							[]
						]
					}
				}
				var paletteMap = [];
				var xAdd = 0, yAdd = 0, zAdd = 0;
				const startTime = new Date().getTime();
				for (let x = minPos[0]; x <= maxPos[0]; ++x) {
					yAdd = 0;
					for (let y = minPos[1]; y <= maxPos[1]; ++y) {
						zAdd = 0;
						for (let z = minPos[2]; z <= maxPos[2]; ++z) {
							let block = mc.getBlock(x, y, z, AMCBPlayer.data.dimid);
							if (block.type === "minecraft:air") {
								snbt.structure.block_indices[0].push(0);
								snbt.structure.block_indices[1].push(0);
								++zAdd;
								continue;
							}
							const blockSNBT = block.getNbt().toString();
							let index = paletteMap.indexOf(blockSNBT);
							if (index === -1) {
								paletteMap.push(blockSNBT);
								snbt.structure.palette.default.block_palette.push(JSON.parse(blockSNBT));
								index = snbt.structure.palette.default.block_palette.length - 1;
							} else {
								index++;
							}
							snbt.structure.block_indices[0].push(index);
							snbt.structure.block_indices[1].push(0);
							++zAdd;
						}
						++yAdd;
					}
					++xAdd;
				}
				const finishTime = new Date().getTime() - startTime;
				const comp = NBT.parseSNBT(JSON.stringify(snbt).replace(/_bit":0/g, '_bit":0b').replace(/_bit":1/g, '_bit":1b'));
				const path = "./plugins/AMCBuilder/export/" + fileName + ".mcstructure";

				File.writeTo(path, "");
				var fi = new File(path, 1, true);
				fi.write(comp.toBinaryNBT(), function (result) {
					if (!result) {
						AMCBPlayer.tell('§c[AMCBuilder] 文件写入失败(' + fi.errorCode() + ')' + path);
						fi.clear();
					}
					fi.close();
					AMCBPlayer.sendToast('§b[AMCBuilder]', '导出结束，§a使用 §e§l/amcb import ' + fileName + ' --mcs §r§a可以导入');
					const totalLength = snbt.structure.block_indices[0].length;
					if (totalLength === 0) {
						return AMCBPlayer.tell('§c[AMCBuilder] 本次导出数据为空，请重新选择范围。');
					}
					AMCBPlayer.tell("§a[AMCBuilder] 文件导出在 ./plugins/AMCBuilder/export/" + fileName + ".mcstructure\n  §a用时: " + (finishTime / 1000).toFixed(2) + " s\n  §a速度: " + (totalLength / finishTime * 1000 >> 0) + " B/s");
				})
			} catch (err) {
				logger.error(err);
			}
		}
	}
	async function cmdImportHandle(sender, args) {
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__"), finishTime = 0;
		let startPos = [];
		try {
			if (typeof (AMCBPlayer.data.pos_[0]) != 'object') throw 'pos1';
			startPos = AMCBPlayer.data.pos_[0];
		} catch (e) {
			return AMCBPlayer.tell('less_1_points', 0, [header]);
		}
		const isSolid = args.indexOf("-air") == -1;
		if (args.length < 2) { // 构建选择表单窗口
			if (!sender.realName) {
				return logger.info('pls use, /amcb import <filename>');
			}
			let fm = mc.newCustomForm();
			fm.setTitle('导入参数选项');
			fm.addDropdown('选择建筑文件', ['取消', ...File.getFilesList('./plugins/AMCBuilder/export/')], 0);
			fm.addSwitch('排除空气?', false);
			fm.addSwitch('构建在当前站立的位置?', false);
			sender.sendForm(fm, (player, data) => {
				if (!data) return;
				const args_ = ['import'];
				var fileName;
				if (data[0] > 1) {
					fileName = File.getFilesList('./plugins/AMCBuilder/export/')[data[0] - 1];
					args_.push(fileName.split('.')[0]);
				} else {
					return;
				}
				if (fileName.indexOf('.txt') > -1) {
					args_.push('--txt');
				} else if (fileName.indexOf('.bdx') > -1) {
					args_.push('--bdx');
				} else if (fileName.indexOf('.mcstructure') > -1) {
					args_.push('--mcs');
				}
				data[1] && args_.push('-air');
				data[2] && args_.push('-loca');
				cmdImportHandle(player, args_);
			});
			return;
		}
		if (args.indexOf("-loca") > -1) startPos = [sender.blockPos.x, sender.blockPos.y, sender.blockPos.z];
		var cmdCount = 0;
		const startTime = new Date().getTime();
		if (args.indexOf("--txt") > -1) {
			let fileContext = File.readFrom("./plugins/AMCBuilder/export/" + args[1] + ".txt");
			if (!fileContext) {
				return AMCBPlayer.tell("§c[AMCBuilder] 文件读取错误./plugins/AMCBuilder/export/" + args[1] + ".txt");
			}
			let list1 = fileContext.split("\n");
			cmdCount = list1.length;// 总数
			fileContext = null;
			AMCBPlayer.failBlocks = [];// 失败的方块
			await AMCBPlayer.tell("§b[AMCBuilder] 开始导入 总计" + cmdCount + "个方块 预计需要" + (cmdCount / 3e3 >> 0) + "s 期间服务器可能无法正常处理事务");
			await new Promise((resolve, reject) => {
				setTimeout(function () {
					resolve('time');
				}, 1000)
			});

			await list1.forEach((v, i) => {
				const row = v.split(" ");
				if (isSolid && row[3] === "air") {
					return;
				}
				if (mc.getBlock(Number(row[0]) + startPos[0], Number(row[1]) + startPos[1], Number(row[2]) + startPos[2], AMCBPlayer.data.dimid).type.indexOf(row[3]) == -1
					&& !mc.setBlock(Number(row[0]) + startPos[0], Number(row[1]) + startPos[1], Number(row[2]) + startPos[2], AMCBPlayer.data.dimid, "minecraft:" + row[3], Number(row[4]))) {
					logger.info("Failed place: " + v);
					AMCBPlayer.failBlocks.push([Number(row[0]) + startPos[0], Number(row[1]) + startPos[1], Number(row[2]) + startPos[2], AMCBPlayer.data.dimid, "minecraft:" + row[3], Number(row[4])]);
				}
			});
		} else if (args.indexOf("--bdx") > -1) {
			if (!loadBDX) {
				AMCBPlayer.tell("§c[AMCBuilder] 缺少loadBDX前置，无法解析bdx文件");
			}
			AMCBPlayer.tell("§b[AMCBuilder] 开始导入");
			loadBDX("./plugins/AMCBuilder/export/" + args[1] + ".bdx", function (statue, data) {
				switch (statue) {
					case 0: {
						AMCBPlayer.tell("" + header + data);// 解析失败
						break;
					}
					case 2: {
						AMCBPlayer.tell(header + "本建筑来自：" + data);// 建筑文件作者
						break;
					}
					case 3: {
						logger.info("构建进度：" + data + "%");// 进度信息 Tip类型
						break;
					}
					case 10: {
						cmdCount++;
						switch (data.type) {
							case "setblock": {
								if (mc.setBlock(startPos[0] + data.x, startPos[1] + data.y, startPos[2] + data.z, AMCBPlayer.data.dimid, data.block.indexOf(':') > -1 ? data.block : 'minecraft:' + data.block, data.data)) {
									//
								} else {
									//TODO: 放置失败时
								}
								break;
							}
							case "cb_data": {
								let block = mc.getBlock(startPos[0] + data.x, startPos[1] + data.y, startPos[2] + data.z, AMCBPlayer.data.dimid);
								if (block && block.hasBlockEntity()) {
									if (isNewExecuteCommand && data.Command.indexOf('execute @') === 0) {
										let arr = data.Command.split(" ");// 适应1.19版本
										arr.splice(2, 1, "run"); // ~~1~
										arr.splice(1, 0, "as");
										data.Command = arr.join(" ");
									}
									block.getBlockEntity().setNbt(new NbtCompound({
										"Command": new NbtString(data.Command || ''),
										"CustomName": new NbtString(data.CustomName || ''),
										"ExecuteOnFirstTick": new NbtByte(data.ExecuteOnFirstTick ? 1 : 0),
										"LPCommandMode": new NbtInt(data.LPCommandMode),
										"LPCondionalMode": new NbtByte(data.LPCondionalMode ? 1 : 0),
										"LPRedstoneMode": new NbtByte(data.LPRedstoneMode ? 1 : 0),
										"LastExecution": new NbtLong(0),
										"LastOutput": new NbtString(data.LastOutput || ''),
										"LastOutputParams": new NbtList(data.LastOutputParams || []),
										"SuccessCount": new NbtInt(0),
										"TickDelay": new NbtInt(data.TickDelay),
										"TrackOutput": new NbtByte(data.TrackOutput ? 1 : 0),
										"Version": new NbtInt(23),
										"auto": new NbtByte(1),// 0:需要红石 1:无需红石
										"conditionMet": new NbtByte(0),
										"id": new NbtString("CommandBlock"),
										"isMovable": new NbtByte(1),
										"powered": new NbtByte(0),
										"x": new NbtInt(data.x),
										"y": new NbtInt(data.y),
										"z": new NbtInt(data.z)
									}));
								} else {
									// cb_data failed
								}
								break;
							}
							case "replaceitem": {
								let block = mc.getBlock(startPos[0] + data.x, startPos[1] + data.y, startPos[2] + data.z, AMCBPlayer.data.dimid);
								if (!block) break;
								let item = mc.newItem(data.item.indexOf(':') > -1 ? data.item : 'minecraft:' + data.item, data.count);
								item.setAux(data.data);
								block.getContainer().setItem(data.slotId, item);
								break;
							}
						}
						break;
					}
					case 20: {// end
						break;
					}
				}
			});
		} else {
			await readMCStructure("./plugins/AMCBuilder/export/" + args[1] + ".mcstructure", function (status, data) {
				switch (status) {
					case 0: {
						mc.setBlock(Number(data[0]) + startPos[0], Number(data[1]) + startPos[1], Number(data[2]) + startPos[2], AMCBPlayer.data.dimid, NBT.parseSNBT(JSON.stringify(data[3]).replace(/_bit":0/g, '_bit":0b').replace(/_bit":1/g, '_bit":1b')));
						break;
					}
					case 1: {
						cmdCount = data;
						AMCBPlayer.tell("§b[AMCBuilder] 开始导入 总计" + cmdCount + "个方块 预计需要" + (cmdCount / 3e3 >> 0) + "s 期间服务器可能无法正常处理事务");
						return true;
					}
					case 2: {// 文件读取错误
						AMCBPlayer.tell(data);
						break;
					}
				}
			});
		}

		finishTime = new Date().getTime() - startTime;
		AMCBPlayer.sendToast('§b[AMCBuilder]', '导入结束');
		//log(AMCBPlayer.failBlocks);
		if (AMCBPlayer.failBlocks.length) AMCBPlayer.tell("§b[AMCBuilder] 有 " + AMCBPlayer.failBlocks.length + " 方块未能成功导入，使用 /amcb refail 重新导入错误方块");
		AMCBPlayer.tell("§a[AMCBuilder] 导入结束\n  §a用时: " + (finishTime / 1000).toFixed(2) + " s\n  §a速度: " + (cmdCount / finishTime * 1000 >> 0) + " B/s");
	}
	async function cmdCopyHandle(sender, args) {
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		try {
			if (typeof (AMCBPlayer.data.pos[0]) != 'object') throw 'pos1';
			if (typeof (AMCBPlayer.data.pos[1]) != 'object') throw 'pos2';
		} catch (e) {
			return AMCBPlayer.tell('less_2_points', 0, [header]);
		}
		const startTime = new Date().getTime();
		AMCBPlayer.copy_palette = mc.getStructure(mc.newIntPos(...[...AMCBPlayer.data.pos[0], AMCBPlayer.data.dimid]), mc.newIntPos(...[...AMCBPlayer.data.pos[1], AMCBPlayer.data.dimid]));
		const finishTime = new Date().getTime() - startTime;
		AMCBPlayer.sendToast('§b[AMCBuilder]', '复制成功 用时:' + (finishTime / 1000).toFixed(2) + 's');
	}
	async function cmdPasteHandle(sender, args) {
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		try {
			if (typeof (AMCBPlayer.data.pos[0]) != 'object') throw 'pos1';
		} catch (e) {
			return AMCBPlayer.tell('less_1_points', 0, [header]);
		}
		if (!AMCBPlayer.copy_palette) {
			return AMCBPlayer.tell('§c[AMCBuilder] 请先用 §f/amcb copy §c复制选区');
		}
		const startTime = new Date().getTime();
		mc.setStructure(AMCBPlayer.copy_palette, mc.newIntPos(...[...AMCBPlayer.data.pos_[0], AMCBPlayer.data.dimid]));
		const finishTime = new Date().getTime() - startTime;
		AMCBPlayer.sendToast('§b[AMCBuilder]', '粘贴成功 用时:' + (finishTime / 1000).toFixed(2) + 's');
	}
	function cmdFillHandle(sender, args) {
		var AMCBPlayer = sender.getExtraData("AMCBPlayer__");
		try {
			if (typeof (AMCBPlayer.data.pos[0]) != 'object') throw 'pos1';
			if (typeof (AMCBPlayer.data.pos[1]) != 'object') throw 'pos2';
		} catch (e) {
			return AMCBPlayer.tell('less_2_points', 0, [header]);
		}
		const startTime = new Date().getTime();
		const minPos = AMCBPlayer.data.pos[0];
		const maxPos = AMCBPlayer.data.pos[1];
		for (let x = minPos[0]; x <= maxPos[0]; ++x) {
			for (let z = minPos[2]; z <= maxPos[2]; ++z) {
				for (let y = minPos[1]; y <= maxPos[1]; ++y) {
					mc.setBlock(x, y, z, AMCBPlayer.data.dimid, args[1], args[2]);
				}
			}
		}
		const finishTime = new Date().getTime() - startTime;
		AMCBPlayer.sendToast('§b[AMCBuilder]', '填充结束 用时:' + (finishTime / 1000).toFixed(2) + 's');
	}
	async function cmdFlipHandle(player, args) { }
	async function cmdUpHandle(player, args) {
		let distan = null;
		let pos = player.blockPos;
		const dim = isPNX ? pos.dim : pos.dimid;
		if (!isNaN(args[1])) {
			distan = pos.y + Number(args[1]);
		} else {
			let high = pos.y + 3;
			let canStandY = -256;
			while (high < 365) {
				let block = mc.getBlock(pos.x, high, pos.z, dim);
				if (block.isAir) {
					if (!(canStandY - high + 2)) {// 第二格
						distan = high;
						break;
					}
				} else {
					canStandY = high;
				}
				high++;
			}
		}
		if (distan === null) {
			player.tell(header + "未能找到可站立的位置");
			return;
		}
		player.tell(header + "已传送到: " + [pos.x, distan - 1, pos.z].join(", "));
		if (args.indexOf("-f") > -1) {
			//todo: 设置玩家为飞行状态
		}
		if (args.indexOf("-g") > -1) {
			let block = mc.getBlock(pos.x, distan - 2, pos.z, dim);
			if (block.isAir) {
				mc.setBlock(pos.x, distan - 2, pos.z, dim, "minecraft:glass", 0);
			}
		}
	}
	function cmdReplaceHandle(player, args) {
		var AMCBPlayer = player.getExtraData("AMCBPlayer__");
		try {
			if (typeof (AMCBPlayer.data.pos[0]) != 'object') throw 'pos1';
			if (typeof (AMCBPlayer.data.pos[1]) != 'object') throw 'pos2';
		} catch (e) {
			return AMCBPlayer.tell('less_2_points', 0, [header]);
		}
		/**将被替换的方块列表 */
		let fromList = {};
		/**新方块列表 */
		let toList = {};
		if (args[1]) {
			let arr = args[1].split(",");
			arr.forEach(v => {
				let info = v.split(" ");
				if (typeof info[0] === 'string') {
					if (info[1]) {
						fromList[info[0]] = { tile: (info[1] === '-1' ? null : info[1]) }
					} else {
						fromList[info[0]] = { tile: null };
					}
				}
			});
		}
		let pTotal = 0;
		if (args[2]) {
			let arr = args[2].split(",");
			arr.forEach(v => {
				let [value, p] = v.split("|");
				if (p) {
					p = Number(p);
				} else {
					p = 1;
				}
				pTotal += p;
				let info = value.split(" ");
				if (typeof info[0] === 'string') {
					if (info[1]) {
						toList[info[0]] = { tile: Number(info[1]), p: p }
					} else {
						toList[info[0]] = { tile: 0, p: p };
					}
				}
			});
		}
		const startTime = new Date().getTime();
		const minPos = AMCBPlayer.data.pos[0];
		const maxPos = AMCBPlayer.data.pos[1];
		for (let x = minPos[0]; x <= maxPos[0]; ++x) {
			for (let z = minPos[2]; z <= maxPos[2]; ++z) {
				for (let y = minPos[1]; y <= maxPos[1]; ++y) {
					let block = mc.getBlock(x, y, z, AMCBPlayer.data.dimid);
					if (!fromList[block.type]) continue;
					if (fromList[block.type].tile && fromList[block.type].tile != block.tileData) continue;
					let p = getRandomNum([1, pTotal]);
					let pTemp = 0;
					for (let name in toList) {
						let toBlock = toList[name];
						pTemp += toBlock.p;
						if (p > pTemp) continue;
						mc.setBlock(x, y, z, AMCBPlayer.data.dimid, (isNaN(name) ? name : Number(name)), toBlock.tile);
						break;
					}

				}
			}
		}
		const finishTime = new Date().getTime() - startTime;
		AMCBPlayer.sendToast('§b[AMCBuilder]', '替换结束 用时:' + (finishTime / 1000).toFixed(2) + 's');
	}
	function playerSetupHandle(player, args) {
		//
	}

	/**
	 * 生成立方体八条边缘线的粒子，且不重复生成
	 * @param {number[]} pos1 最小点坐标
	 * @param {number[]} pos2 最大点坐标
	 * @param {string} dimid 世界名字
	 * @example
	 * genEdgeParticles([1003, 56, 1164], [1003, 58, 1164], "rpg");
	 */
	function genEdgeParticles(pos1, pos2, dimid) {
		const [minX, minY, minZ] = pos1;
		const [maxX, maxY, maxZ] = pos2.map((num) => num + 1);
		const particleType = Config.particles.name; // 粒子类型

		// 生成顶面和底面的边缘线
		for (let x = minX; x <= maxX; x++) {
			mc.spawnParticle(x, minY, minZ, dimid, particleType);
			mc.spawnParticle(x, minY, maxZ, dimid, particleType);
			mc.spawnParticle(x, maxY, minZ, dimid, particleType);
			mc.spawnParticle(x, maxY, maxZ, dimid, particleType);
		}

		// 生成侧面的边缘线
		for (let y = minY; y < maxY + 1; y++) {
			mc.spawnParticle(minX, y, minZ, dimid, particleType);
			mc.spawnParticle(minX, y, maxZ, dimid, particleType);
			mc.spawnParticle(maxX, y, minZ, dimid, particleType);
			mc.spawnParticle(maxX, y, maxZ, dimid, particleType);
		}

		// 生成前后面的边缘线
		for (let z = minZ; z < maxZ; z++) {
			mc.spawnParticle(minX, minY, z, dimid, particleType);
			mc.spawnParticle(minX, maxY, z, dimid, particleType);
			mc.spawnParticle(maxX, minY, z, dimid, particleType);
			mc.spawnParticle(maxX, maxY, z, dimid, particleType);
		}
	}

	
	/**
	 * Fix the problem that the getPlayer of LLSE dose not work.
	 * @issue: https://github.com/LiteLDev/LiteLoaderBDS/issues/866
	 */
	function getPlayer(name) {
		name = name.toLowerCase();
		let list = mc.getOnlinePlayers();
		for (let p of list) {
			if (p.realName.toLowerCase() === name) return p;
		}
		return null;
	}
	/**
	 * 获取随机数
	 * @param {Array} array 
	 * @returns {int} 返回 [最小值, 最大值] 的随机值
	 */
	function getRandomNum(array) {
		let length = 0;
		if (array.length === 1 && array[0] === array[1]) {
			return array[0];
		}
		array.forEach(function (v) {
			let last = (v + []).split(".")[1];
			if (last && length < last.length) {
				length = last.length;
			}
		});
		length = Math.pow(10, length + 2);
		let minNum = array[0] * length;
		let maxNum = array[1] * length;
		return Math.round(parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10) / length);
	}
	/**
	 * 使用小木斧设置坐标1
	 */
	mc.listen("onUseItemOn", function (player, item, block, side, pos) {
		if (!player.isOP()) {
			return;
		}
		if (!item || item.type != 'minecraft:wooden_axe') {
			return;
		}
		if (!player.getExtraData("AMCBPlayer__")) {
			player.setExtraData("AMCBPlayer__", new AMCBPlayer__(player.realName));
		}
		var AMCBPlayer = player.getExtraData("AMCBPlayer__");
		if (!AMCBPlayer.getSetup('wood_axe_chooes_pos')) {
			return;
		}
		AMCBPlayer.updatePos(block.pos, 0);
		AMCBPlayer.tell('set_pos_succ', 0, [header, '1', AMCBPlayer.data.pos_[0].join(", "), AMCBPlayer.ReginSize]);
		return false;
	});
	var AirOnItem = [];
	/**
	 * 使用小木斧设置坐标2
	 */
	mc.listen("onDestroyBlock", function (player, block) {
		if (!player.isOP()) {
			return;
		}
		if (AirOnItem.length) {
			AirOnItem.forEach(v => {
				clearTimeout(v);
			});
			AirOnItem = [];
		}
		let item = player.getHand();
		if (!item || item.type != 'minecraft:wooden_axe') {
			return;
		}
		if (!player.getExtraData("AMCBPlayer__")) {
			player.setExtraData("AMCBPlayer__", new AMCBPlayer__(player.realName));
		}
		var AMCBPlayer = player.getExtraData("AMCBPlayer__");
		if (!AMCBPlayer.getSetup('wood_axe_chooes_pos')) {
			return;
		}
		AMCBPlayer.updatePos(block.pos, 1);
		AMCBPlayer.tell('set_pos_succ', 0, [header, '2', AMCBPlayer.data.pos_[1].join(", "), AMCBPlayer.ReginSize]);
		return false;
	});
	mc.listen("onUseItem", function (player, item) {
		if (!player.isOP()) {
			return;
		}
		if (!player.getExtraData("AMCBPlayer__")) {
			player.setExtraData("AMCBPlayer__", new AMCBPlayer__(player.realName));
		}
		var AMCBPlayer = player.getExtraData("AMCBPlayer__");
		if (!AMCBPlayer.getSetup('wood_axe_ui')) {
			return;
		}
		if (item.type === 'minecraft:wooden_axe') {
			AirOnItem.push(setTimeout(function () {
				MainForm(AMCBPlayer);
			}, 200));
		}
	});
}
