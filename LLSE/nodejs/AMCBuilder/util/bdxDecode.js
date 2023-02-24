const path = require("path");
const fs = require("fs");

var runtimeIdPool = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./block_1_19_22_runtime_ids.json")));
function runtimeIdPoolUsing(runtimeId, type){
    if (type) {// 1
        return runtimeIdPool[runtimeId] ? runtimeIdPool[runtimeId][type] : 0;
    } else {// 0
        return runtimeIdPool[runtimeId] ? runtimeIdPool[runtimeId][type] : 'air';
    }
}
const strend = "\0";
/**
 * 解析bdx二进制数据
 * @param {Buffer} bdx 
 * @param {number} i 
 * @returns {Array} 命令数组
 */
function bdxDecode(bdx, i = 0, callback) {
    const blockPool = new Array();
    const brushPosition = new Array(0, 0, 0);
    var interval = 0;
    while (i < bdx.length) {
        interval++;
        if (interval % 80 === 0) {
            callback(3, i / bdx.length * 100);
        }
        var cmd = bdx[i];

        if (cmd === 1) {
            blockPool.push(bdx.slice(i + 1, bdx.indexOf(strend, i)).toString());
            i = bdx.indexOf(strend, i) + 1;
        } else if (cmd === 2) {
            brushPosition[0] += bdx.slice(i + 1, i + 3).readUint16BE();
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 3;
        } else if (cmd === 3) {
            brushPosition[0]++;
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 1;
        } else if (cmd === 4) {
            brushPosition[1] += bdx.slice(i + 1, i + 3).readUint16BE();
            brushPosition[2] = 0;
            i = i + 3;
        } else if (cmd === 5) {
            brushPosition[1]++;
            brushPosition[2] = 0;
            i = i + 1;
        } else if (cmd === 6) {
            brushPosition[2] += bdx.slice(i + 1, i + 3).readUint16BE();
            i = i + 2;
        } else if (cmd === 7) {
            var blockid = bdx.slice(i + 1, i + 3).readUint16BE();
            var blockdata = bdx.slice(i + 3, i + 5).readUint16BE();
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: blockPool[blockid],
                data: blockdata
            });

            i = i + 5;
        } else if (cmd === 8) {
            brushPosition[2]++;
            i = i + 1;
        } else if (cmd === 9) {
            i = i + 1;
        } else if (cmd === 10) {
            brushPosition[0] += bdx.slice(i + 1, i + 5).readUint32BE();
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 5;
        } else if (cmd === 11) {
            brushPosition[1] += bdx.slice(i + 1, i + 5).readUint32BE();
            brushPosition[2] = 0;
            i = i + 5;
        } else if (cmd === 12) {
            brushPosition[3] += bdx.slice(i + 1, i + 5).readUint32BE();
            i = i + 5;
        } else if (cmd === 13) {
            i = i + 1;
            console.error(new Error("WARNING: BDump/Import: Use of reserved command\n"));
            process.exit(0);
        } else if (cmd === 14) {
            brushPosition[0]++;
            i = i + 1;
        } else if (cmd === 15) {
            brushPosition[0]--;
            i = i + 1;
        } else if (cmd === 16) {
            brushPosition[1]++;
            i = i + 1;
        } else if (cmd === 17) {
            brushPosition[1]--;
            i = i + 1;
        } else if (cmd === 18) {
            brushPosition[2]++;
            i = i + 1;
        } else if (cmd === 19) {
            brushPosition[2]--;
            i = i + 1;
        } else if (cmd === 20) {
            brushPosition[0] += bdx.slice(i + 1, i + 3).readInt16BE();
            i = i + 3;
        } else if (cmd === 21) {
            brushPosition[0] += bdx.slice(i + 1, i + 5).readInt32BE();
            i = i + 5;
        } else if (cmd === 22) {
            brushPosition[1] += bdx.slice(i + 1, i + 3).readInt16BE();
            i = i + 3;
        } else if (cmd === 23) {
            brushPosition[1] += bdx.slice(i + 1, i + 5).readInt32BE();
            i = i + 5;
        } else if (cmd === 24) {
            brushPosition[2] += bdx.slice(i + 1, i + 3).readInt16BE();
            i = i + 3;
        } else if (cmd === 25) {
            brushPosition[3] += bdx.slice(i + 1, i + 5).readInt32BE();
            i = i + 5;
        } else if (cmd === 26) {
            var mode = bdx.slice(i + 1, i + 5).readUInt32BE();
            var firstEnd = bdx.indexOf(strend, i + 5);
            var command = bdx.slice(i + 5, firstEnd).toString();
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = bdx.slice(firstEnd + 1, secondEnd).toString();
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = bdx.slice(secondEnd + 1, thirdEnd).toString();
            var tickdelay = bdx.slice(thirdEnd + 1, thirdEnd + 5).readUInt32BE();
            var boolbdx = bdx.slice(thirdEnd + 5, thirdEnd + 9);
            var executeOnFirstTick = boolbdx[0] === 1;
            var trackOutput = boolbdx[1] === 1;
            var conditional = boolbdx[2] === 1;
            var needRedstone = boolbdx[3] === 1;
            i = thirdEnd + 9;
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: "command_block",
                data: 0
            });
            callback(10, {
                type: "cb_data",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                Command: command,
                CustomName: customName,
                ExecuteOnFirstTick: executeOnFirstTick,//0b
                LPCommandMode: mode,//0
                LPCondionalMode: conditional,//0b
                LPRedstoneMode: needRedstone,//0b
                TickDelay: tickdelay,//2
                TrackOutput: trackOutput,//1b
                LastOutput: trackOutput?lastOutput:"",
                LastOutputParams: []
            });
        } else if (cmd === 27) {
            var blcokId = bdx.slice(i + 1, i + 3).readUInt16BE();
            var blockData = bdx.slice(i + 3, i + 5).readUInt16BE();
            var blcokName = blockPool[blcokId];
            var mode = bdx.slice(i + 5, i + 9).readUInt32BE();
            var firstEnd = bdx.indexOf(strend, i + 9);
            var command = bdx.slice(i + 9, firstEnd).toString();
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = bdx.slice(firstEnd + 1, secondEnd).toString();
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = bdx.slice(secondEnd + 1, thirdEnd).toString();
            var tickdelay = bdx.slice(thirdEnd + 1, thirdEnd + 5).readUInt32BE();
            var boolbdx = bdx.slice(thirdEnd + 5, thirdEnd + 9);
            var executeOnFirstTick = boolbdx[0] === 1;
            var trackOutput = boolbdx[1] === 1;
            var conditional = boolbdx[2] === 1;
            var needRedstone = boolbdx[3] === 1;
            i = thirdEnd + 9;
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: blcokName,
                data: blockData
            });
            callback(10, {
                type: "cb_data",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                Command: command,
                CustomName: customName,
                ExecuteOnFirstTick: executeOnFirstTick,//0b
                LPCommandMode: mode,//0
                LPCondionalMode: conditional,//0b
                LPRedstoneMode: needRedstone,//0b
                TickDelay: tickdelay,//2
                TrackOutput: trackOutput,//1b
                LastOutput: trackOutput?lastOutput:"",
                LastOutputParams: []
            });
        } else if (cmd === 28) {
            brushPosition[0] += bdx.slice(i + 1, i + 2).readInt8();
            i = i + 2;
        } else if (cmd === 29) {
            brushPosition[1] += bdx.slice(i + 1, i + 2).readInt8();
            i = i + 2;
        } else if (cmd === 30) {
            brushPosition[2] += bdx.slice(i + 1, i + 2).readInt8();
            i = i + 2;
        } else if (cmd === 31) {
            var id = bdx.slice(i + 1, i + 2)[0];
            if (id === 117) {
                //runtimeIdPool = JSON.parse(fs.readFileSync("block_netease_runtime_ids.json", "utf8"));
            }
            i = i + 2;
        } else if (cmd === 32) {
            var runtimeId;
            try {
                runtimeId = bdx.slice(i + 1, i + 3).readUInt16BE();
                callback(10, {
                    type: "setblock",
                    x: brushPosition[0],
                    y: brushPosition[1],
                    z: brushPosition[2],
                    block: runtimeIdPoolUsing(runtimeId, 0),
                    data: runtimeIdPoolUsing(runtimeId, 1)
                });
            } catch (err) {
                if (err) {
                    errors.push(err);
                    console.log(err, i, runtimeId);
                }
            }
            i = i + 3;
        } else if (cmd === 33) {
            var runtimeId = bdx.slice(i + 1, i + 5).readUInt32BE();
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: runtimeIdPoolUsing(runtimeId, 0),
                data: runtimeIdPoolUsing(runtimeId, 1)
            });
            i = i + 5;
        } else if (cmd === 34) {
            var runtimeId = bdx.slice(i + 1, i + 3).readUInt16BE();
            var mode = bdx.slice(i + 3, i + 7).readUInt32BE();
            var firstEnd = bdx.indexOf(strend, i + 7);
            var command = bdx.slice(i + 7, firstEnd).toString();
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = bdx.slice(firstEnd + 1, secondEnd).toString();
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = bdx.slice(secondEnd + 1, thirdEnd).toString();
            var tickdelay = bdx.slice(thirdEnd + 1, thirdEnd + 5).readUInt32BE();
            var boolbdx = bdx.slice(thirdEnd + 5, thirdEnd + 9);
            var executeOnFirstTick = boolbdx[0] === 1;
            var trackOutput = boolbdx[1] === 1;
            var conditional = boolbdx[2] === 1;
            var needRedstone = boolbdx[3] === 1;
            i = thirdEnd + 9;

            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: runtimeIdPoolUsing(runtimeId, 0),
                data: runtimeIdPoolUsing(runtimeId, 1)
            });
            callback(10, {
                type: "cb_data",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                Command: command,
                CustomName: customName,
                ExecuteOnFirstTick: executeOnFirstTick,//0b
                LPCommandMode: mode,//0
                LPCondionalMode: conditional,//0b
                LPRedstoneMode: needRedstone,//0b
                TickDelay: tickdelay,//2
                TrackOutput: trackOutput,//1b
                LastOutput: trackOutput?lastOutput:"",
                LastOutputParams: []
            });
        } else if (cmd === 35) {
            var runtimeId = bdx.slice(i + 1, i + 5).readUInt32BE();

            var mode = bdx.slice(i + 5, i + 9).readUInt32BE();
            var firstEnd = bdx.indexOf(strend, i + 9);
            var command = bdx.slice(i + 9, firstEnd).toString();
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = bdx.slice(firstEnd + 1, secondEnd).toString();
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = bdx.slice(secondEnd + 1, thirdEnd).toString();
            var tickdelay = bdx.slice(thirdEnd + 1, thirdEnd + 5).readUInt32BE();
            var boolbdx = bdx.slice(thirdEnd + 5, thirdEnd + 9);
            var executeOnFirstTick = boolbdx[0] === 1;
            var trackOutput = boolbdx[1] === 1;
            var conditional = boolbdx[2] === 1;
            var needRedstone = boolbdx[3] === 1;
            i = thirdEnd + 9;

            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: runtimeIdPoolUsing(runtimeId, 0),
                data: runtimeIdPoolUsing(runtimeId, 1)
            });
            callback(10, {
                type: "cb_data",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                Command: command,
                CustomName: customName,
                ExecuteOnFirstTick: executeOnFirstTick,//0b
                LPCommandMode: mode,//0
                LPCondionalMode: conditional,//0b
                LPRedstoneMode: needRedstone,//0b
                TickDelay: tickdelay,//2
                TrackOutput: trackOutput,//1b
                LastOutput: trackOutput?lastOutput:"",
                LastOutputParams: []
            });
        } else if (cmd === 36) {
            var rdst = bdx.slice(i + 1, i + 3);//???
            var mode = bdx.slice(i + 3, i + 7).readUInt32BE();
            var firstEnd = bdx.indexOf(strend, i + 7);
            var command = bdx.slice(i + 7, firstEnd).toString();
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = bdx.slice(firstEnd + 1, secondEnd).toString();
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = bdx.slice(secondEnd + 1, thirdEnd).toString();
            var tickdelay = bdx.slice(thirdEnd + 1, thirdEnd + 5).readUInt32BE();
            var boolbdx = bdx.slice(thirdEnd + 5, thirdEnd + 9);
            var executeOnFirstTick = boolbdx[0] === 1;
            var trackOutput = boolbdx[1] === 1;
            var conditional = boolbdx[2] === 1;
            var needRedstone = boolbdx[3] === 1;
            i = thirdEnd + 9;

            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: "command_block",
                data: rdst
            });
            callback(10, {
                type: "cb_data",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                Command: command,
                CustomName: customName,
                ExecuteOnFirstTick: executeOnFirstTick,//0b
                LPCommandMode: mode,//0
                LPCondionalMode: conditional,//0b
                LPRedstoneMode: needRedstone,//0b
                TickDelay: tickdelay,//2
                TrackOutput: trackOutput,//1b
                LastOutput: trackOutput?lastOutput:"",
                LastOutputParams: []
            });
        } else if (cmd === 37) {
            // console.log(cmd, i, "chest");
            var runtimeId = bdx.slice(i + 1, i + 3).readUint16BE();
            var slotCount = bdx.slice(i + 3, i + 4).readUInt8();
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: runtimeIdPoolUsing(runtimeId, 0),
                data: runtimeIdPoolUsing(runtimeId, 1)
            });
            var now = i + 4;
            var slotStr = "";
            for (var r = 0; r < slotCount; r++) {
                var itemNameEnd = bdx.indexOf(strend, now);
                var itemName = bdx.slice(now, itemNameEnd);
                var count = bdx.slice(itemNameEnd + 1, itemNameEnd + 2).readUInt8();
                var data = bdx.slice(itemNameEnd + 2, itemNameEnd + 4).readUInt16BE();
                var slotId = bdx.slice(itemNameEnd + 4, itemNameEnd + 5).readUInt8();
                now = itemNameEnd + 5;
                callback(10, {
                    type: "replaceitem",
                    x: brushPosition[0],
                    y: brushPosition[1],
                    z: brushPosition[2],
                    slotId: slotId,
                    item: itemName,
                    count: count,
                    data: data
                });
                slotStr += `\ncSlotId: ${slotId}, Item: ${itemName}(data: ${data}, count:${count})`
            }
            i = now;

        } else if (cmd === 38) {
            var runtimeId = bdx.slice(i + 1, i + 5).readUint32BE();
            var slotCount = bdx.slice(i + 5, i + 6).readUInt8();
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: runtimeIdPoolUsing(runtimeId, 0),
                data: runtimeIdPoolUsing(runtimeId, 1)
            });
            var now = i + 6;
            var slotStr = "";
            for (var r = 0; r < slotCount; r++) {
                var itemNameEnd = bdx.indexOf(strend, now);
                var itemName = bdx.slice(now, itemNameEnd);
                var count = bdx.slice(itemNameEnd + 1, itemNameEnd + 2).readUInt8();
                var data = bdx.slice(itemNameEnd + 2, itemNameEnd + 4).readUInt16BE();
                var slotId = bdx.slice(itemNameEnd + 4, itemNameEnd + 5).readUInt8();
                now = itemNameEnd + 5;
                callback(10, {
                    type: "replaceitem",
                    x: brushPosition[0],
                    y: brushPosition[1],
                    z: brushPosition[2],
                    slotId: slotId,
                    item: itemName,
                    count: count,
                    data: data
                });
                slotStr += `\ncSlotId: ${slotId}, Item: ${itemName}(data: ${data}, count:${count})`
            }
            i = now;

        } else if (cmd === 58) {
            callback(1, "===BDX Convert End===");
            callback(20);
            return;
        } else {
            i = i + 1;
        }
        if (brushPosition[1]> 200){
            callback(1, "===BDX Convert End 2===");
            callback(20);
            return;
        }
        if (i >= bdx.length) {
            callback(1, "===BDX Convert End===");
            callback(20);
            return;
        }
    }
}

const { brotliDecompressSync } = require("zlib");
/**
 * 加载BDX文件
 * @param {string} path bdx文件路径
 * @param {function(state, data)} 回调函数 function(state: Number, data: Any)
 * 
 *  state:
 *    0: 失败|string
 *    1: 普通信息|string
 *    2: 作者信息|string 作者名字
 *    3: 进度信息|double 0-100
 *    10: 有效数据|object {type, ?msg}
 *    20: 结束
 */
function loadBDX(path = './65_hub.bdx', callback) {
    let readData1 = fs.readFileSync(path);

    // 解析文件头
    let fileHeadCode = Buffer.alloc(3);
    readData1.copy(fileHeadCode, 0, 0, 3);// 将 readData1 复制到 buf2 指定位置上
    if (fileHeadCode.toString('utf8',0,3) === 'BD@') {
        callback(1, 'Version: 3');
    }
    let readData2 = brotliDecompressSync(readData1.slice(3));
    // 分割数据
    let cur=0;
    let n=0;
    let list = [];
    while((n=readData2.indexOf('\0',cur))!=-1 && cur < 100){
        list.push(readData2.slice(cur,n));
        cur=n+1;
    }
    list.push(readData2.slice(cur));
    // 解析数据
    if (list[0].toString('utf8') === "BDX") {
        callback(1, "探测到BDX数据的格式头");
    } else {
        callback(0, "无效的BDX数据头");
        return;
    }
    callback(2, list[1].toString('utf8'))
    let binData = readData2.slice(list[0].length + list[1].length + 2);
    bdxDecode(binData, 0, callback);
}
module.exports = {
    bdxDecode,
    loadBDX
};