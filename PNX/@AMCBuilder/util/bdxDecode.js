/**
 * 解析bdx二进制数据
 * @todo
 * @param {Buffer} bdx 
 * @param {number} i 
 * @returns {Array} 命令数组
 */
 function bdxDecode(bdx, i = 0, callback) {
 }
 /**
 * 加载BDX文件
 * @todo
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
}
export {
    bdxDecode,
    loadBDX
};