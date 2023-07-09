## 🌐Need to switch languages? / 多语言文档

[![简体中文](https://img.shields.io/badge/简体中文-100%25-green?style=flat-square)](https://github.com/Mcayear/AMCBuilder/blob/main/README.md)
[![English](https://img.shields.io/badge/English-100%25-green?style=flat-square)](https://github.com/Mcayear/AMCBuilder/blob/main/README_en.md)


## 简介

> 作为一款自2020年7月开始运营 ~~老牌~~ 的建筑导入软件，AMCBuilder一直致力于给网易用户提供建筑导入方案，已累计收获用户3000+，已有930人的用户群，注册用户达730个。
现在，我们正式推出了AMCBuilder针对于BDS服务器的解决方案——AMCBuilder-LiteLoader。

AMCBuilder-LiteLoader 适用于大部分服务器，用于快速构建主城、地图等。 ~~受众不包含建筑大佬。~~

现已收录很多精品主城、建筑群、小游戏建筑，详情可前往 [https://amcbuilder.cn/](https://amcbuilder.cn/) 查看

![1612231446651.png](https://www.minebbs.com/attachments/1612231446651-png.25528/ "1612231446651.png")

#### 没有图片的建筑也可以导入，但是无法确保导入的效果

#### AMCBuilder 所有的非原创建筑均来自网络，如有侵犯版权请联系删除

## 下载&使用

- 依赖: LiteLoader [https://www.minebbs.com/resources/liteloaderbds-x-bds.2059/](https://www.minebbs.com/resources/liteloaderbds-x-bds.2059/)

1. 重启服务器
2. 输入 `/amcb connect` 以连接至AMCBuilder服务器
3. 复制弹窗中给出的65位唯一标识，前往官网注册登录后选择建筑 [https://amcbuilder.cn/](https://amcbuilder.cn/)
4. 选择完成后输入 `/amcb start` 开始导入

**QQ咨询群：[317055616](https://jq.qq.com/?_wv=1027&k=ZOTvzJ6D)**

| 命令             | 解释               | 权限 |
|----------------|------------------|-----|
| `/amcb help`     | 获取命令帮助           | All |
| `/amcb connect`  | 链接服务器            | OP  |
| `/amcb disconnect` | 断开链接             | OP  |
| `/amcb start`    | 在选择成功后执行，开始速建  | OP  |
| `/amcb pos1`     | 设置点1             | OP  |
| `/amcb pos2`     | 设置点2             | OP  |
| `/amcb set <string: blockid> [int: litedata]` | 填充区域为指定方块 | OP  |
| `/amcb import <string: filename> [-air] [--txt,--mcs,--bdx]` | 导入本地建筑文件 | OP  |
| `/amcb export <string: filename> [-air] [--txt,--mcs]` | 导出选区的建筑物到本地文件 | OP  |

导出的本地文件保存在 `./plugins/AMCBuilder/export`

### 本地导入教程

`/amcb import` 打开UI 或者 `/amcb import 完整文件名 --mcs` 导入.mcstructure文件。

> 请注意导入的文件需要放在`./plugins/AMCBuilder/export`目录中。


## 注意事项

如果不使用 `/amcb pos1` 那么每次执行命令都将使用玩家自身坐标
为了追求极限的效率，导出没有进度条提示


## 🔭最近关注

这里展示的是最近Star了**AMCBuilder**项目的用户

[![Stargazers repo roster for @mcayear](https://reporoster.com/stars/Mcayear/AMCBuilder)](https://github.com/Mcayear/AMCBuilder/stargazers)

## BUG请在github反馈 👇
https://github.com/mcayear/amcbuilder/issues
