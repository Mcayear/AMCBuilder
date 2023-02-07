/**
 * 将区块数据写入历史记录
 * @todo
 * @param {AMCBPlayer} AMCBPlayer 
 * @param {Position} pos1 第一个坐标
 * @param {Position} pos2 第二个坐标
 * @returns {boolean} 是否成功
 */
 function writeHistory(AMCBPlayer, pos1, pos2) {
 }
 /**
 * 撤销你的上一个(或几个)操作
 * @todo
 * @param {AMCBPlayer} AMCBPlayer 
 * @param {number} i 
 * @returns {Array} 命令数组
 */
function undo(AMCBPlayer, i = 1) {

}
/**
* 重做你撤销的上一个(或几个)操作
* @todo
* @param {AMCBPlayer} AMCBPlayer 
* @param {number} i 
* @returns {Array} 命令数组
*/
function redo(AMCBPlayer, i = 1) {

}
/**
* 清除你的历史记录
* @param {Buffer} AMCBPlayer
* @returns {boolean} 是否成功
*/
function clearhistory(AMCBPlayer) {
    return true;
}
export {
    writeHistory,
    undo,
    redo,
    clearhistory
};