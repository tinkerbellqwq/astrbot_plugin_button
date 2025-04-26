import aiohttp

from astrbot.api.event import filter, AstrMessageEvent, MessageEventResult
from astrbot.api.star import Context, Star, register
from astrbot.api import logger

@register("button", "tinker", "一个简单的给qq发button的插件", "1.0.0")
class MyPlugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)

    async def initialize(self):
        """可选择实现异步的插件初始化方法，当实例化该插件类之后会自动调用该方法。"""

    async def terminate(self):
        """可选择实现异步的插件销毁方法，当插件被卸载/停用时会调用。"""

    @filter.event_message_type(filter.EventMessageType.ALL)
    async def button(self, event: AstrMessageEvent):
        """
        处理所有类型的消息事件
        """
        message = event.message_str
        if message.startswith("button"):
            message = message[6:]
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                            "http://140.246.33.10:3000/api/generate-buttons",
                            json={
                                "message": message,
                                "is_group": "false" if event.is_private_chat() else "true",
                                "id": event.get_sender_id() if event.is_private_chat() else event.get_group_id(),
                            }
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if data.get("hexData"):
                                from astrbot.core.platform.sources.aiocqhttp.aiocqhttp_message_event import AiocqhttpMessageEvent
                                assert isinstance(event, AiocqhttpMessageEvent)
                                client = event.bot
                                api_params = {
                                    "cmd":"MessageSvc.PbSendMsg",
                                    "data": data['hexData'],
                                }
                                await client.api.call_action("send_packet", **api_params)
                            else:
                                yield event.plain_result("请求失败")
                        else:
                            yield event.plain_result("请求失败")
            except Exception as e:
                logger.error(f"请求失败: {e}")
                yield event.plain_result(f"请求失败: {e}")
