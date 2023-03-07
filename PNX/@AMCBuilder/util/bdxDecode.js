import { Paths } from "java.nio.file.Paths";
import { Files } from "java.nio.file.Files";
import { Array as JavaArray } from "java.lang.reflect.Array";

import { StandardCharsets } from "java.nio.charset.StandardCharsets";
import { ByteBuffer } from "java.nio.ByteBuffer";

import { loadJar } from ":jvm";
import { download, onlyOnceExecute } from "@LLSELib/utils/util.js";

onlyOnceExecute(() => {
    download(
        "https://repo1.maven.org/maven2/org/brotli/dec/0.1.2/dec-0.1.2.jar",
        "libs",
        "dec-0.1.2.jar"
    );
}, "ACCBACCB-16D3-449C-7290-A385DC078001");

loadJar("./libs/dec-0.1.2.jar");
console.log("brotli dec-0.1.2 加载成功");

import { BrotliInputStream } from "org.brotli.dec.BrotliInputStream";
import { ByteArrayInputStream } from "java.io.ByteArrayInputStream";
import { ByteArrayOutputStream } from "java.io.ByteArrayOutputStream";
import { Arrays } from "java.util.Arrays";

/**
 * 对Brotli压缩后的数据进行解压缩。
 *
 * @param {Int8Array} data 要解压缩的Brotli压缩数据。
 * @returns {Int8Array} 解压缩后的数据。
 * @throws {java.io.IOException} 如果在解压缩过程中出现错误，则会抛出IO异常。
 */
function brotliDecode(data) {
    const inputStream = new BrotliInputStream(new ByteArrayInputStream(data));
    const outputStream = new ByteArrayOutputStream();
    let buffer = JavaArray.newInstance(Java.type("byte"), 4096);

    let length;
    while ((length = inputStream.read(buffer, 0, buffer.length)) !== -1) {
        outputStream.write(buffer, 0, length);

        // 如果读取的数据长度超过了当前缓冲区的大小，则动态扩展缓冲区
        if (length === buffer.length) {
            buffer = Arrays.copyOf(buffer, buffer.length * 2);
        }
    }

    inputStream.close();
    outputStream.close();

    return outputStream.toByteArray();
}

const Charset = Java.type('java.nio.charset.StandardCharsets');
var runtimeIdPool = JSON.parse(Files.readString(Paths.get('./plugins/@AMCBuilder/util/block_1_19_22_runtime_ids.json'), Charset.UTF_8));
function runtimeIdPoolUsing(runtimeId, type){
    if (type) {// 1
        return runtimeIdPool[runtimeId] ? runtimeIdPool[runtimeId][type] : 0;
    } else {// 0
        return runtimeIdPool[runtimeId] ? runtimeIdPool[runtimeId][type] : 'air';
    }
}

const strend = 0;

/**
 * 加载BDX文件
 * @param {string} path bdx文件路径
 * @param {function(state, data)} 回调函数 function(state: Number, data: Any)
 * @state
 *    0: 失败|string
 *
 *    1: 普通信息|string
 *
 *    2: 作者信息|string 作者名字
 *
 *    3: 进度信息|double 0-100
 *
 *    10: 有效数据|object {type, ?msg}
 *
 *    20: 结束
 */
function loadBDX(filePath = "./65_hub.bdx", callback) {
    const fileBytes = Files.readAllBytes(
        Paths.get(filePath)
    );

    // 解析文件头
    // 截取字节数组的前三个字节，并将其转换为UTF-8编码的字符串

    if (String.fromCharCode(...fileBytes.slice(0, 3)) === "BD@") {
        callback(1, "Version: 3");
    }

    // 解压缩数据
    const decompressedBytes = brotliDecode(fileBytes.slice(3));
    // 分割数据
    let cur = 0;
    let n = 0;
    let list = [];
    while ((n = decompressedBytes.indexOf(strend, cur)) != -1 && cur < 100) {
        list.push(decompressedBytes.slice(cur, n));
        cur = n + 1;
    }
    list.push(decompressedBytes.slice(cur));
    // 解析数据
    if (String.fromCharCode(...list[0]).toString("utf8") === "BDX") {
        callback(1, "探测到BDX数据的格式头");
    } else {
        callback(0, "无效的BDX数据头");
        return;
    }
    let binData = decompressedBytes.slice(list[0].length + list[1].length + 2);
    
	const isSigned = readUInt8(binData.slice(binData.length - 1)) === 0x5a;
	if (isSigned) {
		callback(0, "已签名的bdx文件，无法导入");
		return;
	}

    callback(2, StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Java.to(list[1], "byte[]"))).toString());
    bdxDecode(binData, 0, callback);
}

function readInt8(buffer) {
    const byteArray = new Int8Array(buffer);
    const dataView = new DataView(byteArray.buffer);
    return dataView.getInt8(0, false);
}
function readUInt8(buffer) {
    const byteArray = new Int8Array(buffer);
    const dataView = new DataView(byteArray.buffer);
    return dataView.getUint8(0, false);
}
function readInt16BE(buffer) {
    const byteArray = new Int8Array(buffer);
    const dataView = new DataView(byteArray.buffer);
    return dataView.getInt8(1, false);
}
function readUInt16BE(buffer) {
    const byteArray = new Int8Array(buffer);//Uint8Array?
    const dataView = new DataView(byteArray.buffer);
    return dataView.getUint8(1, true);
}
function readInt32BE(buffer) {
    const byteArray = new Int8Array(buffer);
    const dataView = new DataView(byteArray.buffer);
    return dataView.getInt8(3, true);
}
function readUInt32BE(buffer) {
    const byteArray = new Int8Array(buffer);
    const dataView = new DataView(byteArray.buffer);
    return dataView.getUint8(3, true);
}

/**
 * 解析bdx二进制数据
 * @param {Buffer} bdx
 * @param {number} i
 * @returns {Array} 命令数组
 */

function bdxDecode(bdx, i = 0, callback) {
    const blockPool = new Array();
    const brushPosition = new Array(0, 0, 0);
    let progress = 0;
    while (i < bdx.length) {
        const newProgress = ((i / bdx.length * 100) | 0) & 0xfffffff0;
        if (newProgress > progress) {
            progress = newProgress;
            callback(3, progress);
        }
        var cmd = bdx[i];
        if (cmd === 1) {
            const strEndIndex = bdx.indexOf(strend, i);
            const subarray = bdx.slice(i + 1, strEndIndex);
            const str = String.fromCharCode.apply(null, subarray);
            blockPool.push(str);
            i = strEndIndex + 1;
        } else if (cmd === 2) {
            brushPosition[0] += readUInt16BE(bdx.slice(i + 1, i + 3));
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 3;
        } else if (cmd === 3) {
            brushPosition[0]++;
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 1;
        } else if (cmd === 4) {
            brushPosition[1] += readUInt16BE(bdx.slice(i + 1, i + 3));
            brushPosition[2] = 0;
            i = i + 3;
        } else if (cmd === 5) {
            brushPosition[1]++;
            brushPosition[2] = 0;
            i = i + 1;
        } else if (cmd === 6) {
            brushPosition[2] += readUInt16BE(bdx.slice(i + 1, i + 3));
            i = i + 2;
        } else if (cmd === 7) {
            var blockid = readUInt16BE(bdx.slice(i + 1, i + 3));
            var blockdata = readUInt16BE(bdx.slice(i + 3, i + 5));
            callback(10, {
                type: "setblock",
                x: brushPosition[0],
                y: brushPosition[1],
                z: brushPosition[2],
                block: blockPool[blockid],
                data: blockdata,
            });
            i = i + 5;
        }  else if (cmd === 8) {
            brushPosition[2]++;
            i = i + 1;
        } else if (cmd === 9) {
            i = i + 1;
        } else if (cmd === 10) {
            brushPosition[0] += readUInt32BE(bdx.slice(i + 1, i + 5));
            brushPosition[1] = 0;
            brushPosition[2] = 0;
            i = i + 5;
        }  else if (cmd === 11) {
            brushPosition[1] += readUInt32BE(bdx.slice(i + 1, i + 5));
            brushPosition[2] = 0;
            i = i + 5;
        } else if (cmd === 12) {
            brushPosition[3] += readUInt32BE(bdx.slice(i + 1, i + 5));
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
            brushPosition[0] += readInt16BE(bdx.slice(i + 1, i + 3));
            i = i + 3;
        } else if (cmd === 21) {
            brushPosition[0] += readInt32BE(bdx.slice(i + 1, i + 5));
            i = i + 5;
        } else if (cmd === 22) {
            brushPosition[1] += readInt16BE(bdx.slice(i + 1, i + 3));
            i = i + 3;
        } else if (cmd === 23) {
            brushPosition[1] += readInt32BE(bdx.slice(i + 1, i + 5));
            i = i + 5;
        } else if (cmd === 24) {
            brushPosition[2] += readInt16BE(bdx.slice(i + 1, i + 3));
            i = i + 3;
        } else if (cmd === 25) {
            brushPosition[3] += readInt32BE(bdx.slice(i + 1, i + 5));
            i = i + 5;
        } else if (cmd === 26) {
            var mode = readUInt32BE(bdx.slice(i + 1, i + 5));
            var firstEnd = bdx.indexOf(strend, i + 5);
            var command = String.fromCharCode.apply(null, bdx.slice(i + 5, firstEnd));

            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = String.fromCharCode.apply(null, bdx.slice(firstEnd + 1, secondEnd));
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = String.fromCharCode.apply(null, bdx.slice(secondEnd + 1, thirdEnd));
            var tickdelay = readUInt32BE(bdx.slice(thirdEnd + 1, thirdEnd + 5));
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
                block: "minecraft:command_block",
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
            var blcokId = readUInt16BE(bdx.slice(i + 1, i + 3));
            var blockData = readUInt16BE(bdx.slice(i + 3, i + 5));
            var blcokName = blockPool[blcokId];
            var mode = readUInt32BE(bdx.slice(i + 5, i + 9));
            var firstEnd = bdx.indexOf(strend, i + 9);
            var command = String.fromCharCode.apply(null, bdx.slice(i + 9, firstEnd));
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = String.fromCharCode.apply(null, bdx.slice(firstEnd + 1, secondEnd));
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = String.fromCharCode.apply(null, bdx.slice(secondEnd + 1, thirdEnd));
            var tickdelay = readUInt32BE(bdx.slice(thirdEnd + 1, thirdEnd + 5));
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
            brushPosition[0] += readInt8(bdx.slice(i + 1, i + 2));
            i = i + 2;
        } else if (cmd === 29) {
            brushPosition[1] += readInt8(bdx.slice(i + 1, i + 2));
            i = i + 2;
        } else if (cmd === 30) {
            brushPosition[2] += readInt8(bdx.slice(i + 1, i + 2));
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
                runtimeId = readUInt16BE(bdx.slice(i + 1, i + 3));
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
            var runtimeId = readUInt32BE(bdx.slice(i + 1, i + 5));
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
            var runtimeId = readUInt16BE(bdx.slice(i + 1, i + 3));
            var mode = readUInt32BE(bdx.slice(i + 3, i + 7));
            var firstEnd = bdx.indexOf(strend, i + 7);
            var command = String.fromCharCode.apply(null, bdx.slice(i + 7, firstEnd));
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = String.fromCharCode.apply(null, bdx.slice(firstEnd + 1, secondEnd));
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = String.fromCharCode.apply(null, bdx.slice(secondEnd + 1, thirdEnd));
            var tickdelay = readUInt32BE(bdx.slice(thirdEnd + 1, thirdEnd + 5));
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
            var runtimeId = readUInt32BE(bdx.slice(i + 1, i + 5));

            var mode = readUInt32BE(bdx.slice(i + 5, i + 9));
            var firstEnd = bdx.indexOf(strend, i + 9);
            var command = String.fromCharCode.apply(null, bdx.slice(i + 9, firstEnd));
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = String.fromCharCode.apply(null, bdx.slice(firstEnd + 1, secondEnd));
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = String.fromCharCode.apply(null, bdx.slice(secondEnd + 1, thirdEnd));
            var tickdelay = readUInt32BE(bdx.slice(thirdEnd + 1, thirdEnd + 5));
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
            var mode = readUInt32BE(bdx.slice(i + 3, i + 7));
            var firstEnd = bdx.indexOf(strend, i + 7);
            var command = String.fromCharCode.apply(null, bdx.slice(i + 7, firstEnd));
            var secondEnd = bdx.indexOf(strend, firstEnd + 1);
            var customName = String.fromCharCode.apply(null, bdx.slice(firstEnd + 1, secondEnd));
            var thirdEnd = bdx.indexOf(strend, secondEnd + 1);
            var lastOutput = String.fromCharCode.apply(null, bdx.slice(secondEnd + 1, thirdEnd));
            var tickdelay = readUInt32BE(bdx.slice(thirdEnd + 1, thirdEnd + 5));
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
                block: "minecraft:command_block",
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
            var runtimeId = readUInt16BE(bdx.slice(i + 1, i + 3));
            var slotCount = readUInt8(bdx.slice(i + 3, i + 4));
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
                var count = readUInt8(bdx.slice(itemNameEnd + 1, itemNameEnd + 2));
                var data = readUInt16BE(bdx.slice(itemNameEnd + 2, itemNameEnd + 4));
                var slotId = readUInt8(bdx.slice(itemNameEnd + 4, itemNameEnd + 5));
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
            var runtimeId = readUInt32BE(bdx.slice(i + 1, i + 5));
            var slotCount = readUInt8(bdx.slice(i + 5, i + 6));
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
                var count = readUInt8(bdx.slice(itemNameEnd + 1, itemNameEnd + 2));
                var data = readUInt16BE(bdx.slice(itemNameEnd + 2, itemNameEnd + 4));
                var slotId = readUInt8(bdx.slice(itemNameEnd + 4, itemNameEnd + 5));
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
        if (i >= bdx.length) {
            callback(1, "===BDX Convert End===");
            callback(20);
            return;
        }
    }
}

export { loadBDX, bdxDecode };
