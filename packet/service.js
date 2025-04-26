import express from 'express';
import bodyParser from 'body-parser';
import { ulid } from 'ulid';
import { encode } from './model/PacketHelper.js';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// 生成随机UInt
const RandomUInt = () => crypto.randomBytes(4).readUInt32BE();

// 从Button.js中提取的按钮生成逻辑
function chunkArray(array, chunkSize = 3) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function makeButton(button, style) {
  const msg = {
    id: ulid(),
    render_data: {
      label: button.text,
      visited_label: button.clicked_text,
      style,
    },
    appid: 102089849
  };

  if (button.link)
    msg.action = {
      type: 0,
      permission: {
        type: 2
      },
      data: button.link,
    };
  else if (button.input)
    msg.action = {
      type: 2,
      permission: {
        type: 2
      },
      data: button.input,
      enter: button.send,
    };
  else if (button.callback)
    msg.action = {
      type: 2,
      permission: {
        type: 2
      },
      data: button.callback,
      enter: true,
    };
  else return false;
  return msg;
}

function makeButtons(button_square) {
  const msgs = [];
  const random = Math.floor(Math.random() * 2);
  for (const button_row of button_square) {
    let column = 0;
    const buttons = [];
    for (let button of button_row) {
      button = makeButton(button, 
        (random + msgs.length + buttons.length) % 2);
      if (button) buttons.push(button);
    }
    if (buttons.length)
      msgs.push({
        buttons
      });
  }
  return msgs;
}

function createButton(elem) {
  const content = elem;
  const _content = {
    1: {
      1: content.rows.map(row => {
        return {
          1: row.buttons.map(button => {
            return {
              1: button.id,
              2: {
                1: button.render_data.label,
                2: button.render_data.visited_label,
                3: button.render_data.style
              },
              3: {
                1: button.action.type,
                2: {
                  1: button.action.permission.type,
                  2: button.action.permission.specify_role_ids || undefined,
                  3: button.action.permission.specify_user_ids || undefined,
                },
                4: "err",
                5: button.action.data,
                7: button.action.reply ? 1 : 0,
                8: button.action.enter ? 1 : 0
              }
            };
          })
        };
      }),
      2: content.appid
    }
  };
  return {
    53: {
      1: 46,
      2: _content,
      3: 1
    }
  };
}

// 创建完整的消息包
function createPacket(content, isGroup, id) {
  // 确保id是数字类型
  const numericId = Number(id);
  
  return {
    "1": {
      [isGroup ? "2" : "1"]: {
        "1": numericId
      }
    },
    "2": {
      "1": 1,
      "2": 0,
      "3": 0
    },
    "3": {
      "1": {
        "2": content
      }
    },
    "4": RandomUInt(),
    "5": RandomUInt()
  };
}

// 处理按钮文本
function processButtonText(message) {
  // 检查并移除 "Button" 前缀
  let text = message;
  if (text.startsWith("Button")) {
    text = text.substring(6);
  } else if (text.startsWith("#Button")) {
    text = text.substring(7);
  }

  // 按照Button.js中的逻辑处理消息
  return text.split('\n').filter(i => !!i.trim()).map(i => {
    const index = i.indexOf('#');
    if (index === -1) {
      return null; // 跳过没有#的行
    }
    const cmd = i.substring(index + 1).trim();
    const button = {
      text: i.substring(0, index).trim(),
      clicked_text: 'HDTianRu',
      [cmd.startsWith("http") ? 'link' : 'callback']: cmd
    };
    return button;
  }).filter(button => button !== null);
}

// 通用按钮API路由 - 使用is_group和id参数
app.post('/api/generate-buttons', (req, res) => {
  try {
    // 获取消息文本、ID信息和群组标识
    const { message, id, is_group } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息文本不能为空' });
    }
    
    // 验证ID是否提供
    if (!id) {
      return res.status(400).json({ error: 'ID不能为空' });
    }

    // 确保ID是数字类型
    const numericId = Number(id);
    
    // 群组标识，默认为false（私聊）
    const isGroup = is_group === true || is_group === 'true';
    
    const buttons = processButtonText(message);
    const buttonData = {
      rows: makeButtons(chunkArray(buttons))
    };
    const buttonStructure = createButton(buttonData);
    
    // 创建完整的消息包
    const packet = createPacket(buttonStructure, isGroup, numericId);
    
    // 使用PacketHelper.js中的encode函数进行编码
    const encodedData = encode(packet);
    
    // 返回十六进制字符串
    const result = Buffer.from(encodedData).toString("hex");
    
    res.json({ 
      success: true, 
      hexData: result,
      rawPacket: packet
    });
  } catch (error) {
    console.error('处理按钮消息出错:', error);
    res.status(500).json({ error: '处理按钮消息出错', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`按钮服务已启动，监听端口 ${PORT}`);
}); 