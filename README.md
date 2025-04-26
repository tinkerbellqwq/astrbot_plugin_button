# button

> AstrBot 插件
## 使用须知
利用napcat发自定义组包从而实现发送按钮（仅支持napcat）

首先进入到`packet`文件夹下，执行`npm i` 和 `node service.js`启动项目

然后利用接口 `localhost:3000/api/generate-buttons`得到编码后的数据，其中参数如下：

- message: 需要编码的按钮字符串，例如"wwmr#wwmr\nwwst#wwst" 其中每行表示一个按钮，#前面的是展示按钮的文字，后面是点击后会执行的命令
- is_group：需要是一个字符串表示是否发送群聊, "true"表示是
- "id"：群聊id或用户id

最后得到的数据有：`hexData`表示编码后的字符串

最后调用napcat的api： send_packet，其中参数为： "cmd":"MessageSvc.PbSendMsg",
                                    "data": data['hexData'],
即可发送按钮
> [!CAUTION]\
> 注意！功能仅限内部交流与小范围使用
> 使用此插件产生的一切后果由使用者承担

# 感谢
感谢TianRu大佬的开源的发包代码: [https://github.com/HDTianRu/Packet-plugin](https://github.com/HDTianRu/Packet-plugin)

# 支持

[帮助文档](https://astrbot.app)
