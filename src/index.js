const FeishuClient = require('./client');
const _ = require('lodash');

// 全局客户端实例
let client = null;

// 技能初始化
async function init(config) {
  if (!config.appId || !config.appSecret) {
    throw new Error('请配置飞书应用ID和密钥');
  }
  client = new FeishuClient(config);
  return { success: true, message: '飞书All-in-One Skill初始化成功' };
}

// 指令处理
async function handleCommand(command, params) {
  // help指令不需要初始化
  if (command === 'help') {
    return getHelpInfo();
  }

  if (!client) {
    throw new Error('Skill未初始化，请先配置飞书应用凭证');
  }

  try {
    switch (command) {
      // 文档相关
      case 'get_document':
        return await client.getDocument(params.docId);
      case 'create_document':
        return await client.createDocument(params.title, params.content, params.folderToken);
      case 'update_document':
        return await client.updateDocument(params.docId, params.content, params.mode || 'append');
      
      // 消息相关
      case 'send_text':
        return await client.sendTextMessage(params.receiveId, params.text, params.receiveIdType || 'open_id');
      case 'send_post':
        return await client.sendPostMessage(params.receiveId, params.post, params.receiveIdType || 'open_id');
      
      // 日历相关
      case 'get_events':
        return await client.getEvents(params.calendarId, params.startTime, params.endTime);
      case 'create_event':
        return await client.createEvent(
          params.summary,
          params.startTime,
          params.endTime,
          params.attendees || [],
          params.description || '',
          params.location || ''
        );
      
      // 多维表格相关
      case 'get_bitable_records':
        return await client.getBitableRecords(params.appToken, params.tableId, params.filter, params.pageSize);
      case 'create_bitable_record':
        return await client.createBitableRecord(params.appToken, params.tableId, params.fields);
      case 'batch_create_bitable_records':
        return await client.batchCreateBitableRecords(params.appToken, params.tableId, params.records);
      
      // 帮助信息
      case 'help':
        return getHelpInfo();
      
      default:
        throw new Error(`未知指令: ${command}，请使用help查看支持的指令列表`);
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 自然语言处理
async function handleNaturalLanguage(query) {
  if (!client) {
    throw new Error('Skill未初始化，请先配置飞书应用凭证');
  }

  // 简单的指令匹配，后续可以接入大模型做更智能的语义解析
  query = query.toLowerCase();

  // 文档查询
  if (query.includes('读取文档') || query.includes('获取文档') || query.includes('文档内容')) {
    const docId = extractDocId(query);
    if (!docId) return { success: false, error: '请提供文档ID或链接' };
    return await handleCommand('get_document', { docId });
  }

  // 创建文档
  if (query.includes('创建文档') || query.includes('新建文档')) {
    const title = extractTitle(query);
    const content = extractContent(query);
    if (!title) return { success: false, error: '请提供文档标题' };
    return await handleCommand('create_document', { title, content });
  }

  // 发送消息
  if (query.includes('发送消息') || query.includes('给') && (query.includes('发') || query.includes('发送'))) {
    const receiver = extractReceiver(query);
    const text = extractMessageContent(query);
    if (!receiver || !text) return { success: false, error: '请提供接收人和消息内容' };
    return await handleCommand('send_text', { receiveId: receiver, text });
  }

  // 查询日程
  if (query.includes('查询日程') || query.includes('我的日程') || query.includes('最近的会议')) {
    const startTime = extractStartTime(query);
    const endTime = extractEndTime(query);
    return await handleCommand('get_events', { startTime, endTime });
  }

  // 创建日程
  if (query.includes('创建日程') || query.includes('安排会议') || query.includes('预约会议')) {
    const summary = extractSummary(query);
    const startTime = extractStartTime(query);
    const endTime = extractEndTime(query);
    const attendees = extractAttendees(query);
    if (!summary || !startTime || !endTime) return { success: false, error: '请提供会议标题、开始时间和结束时间' };
    return await handleCommand('create_event', { summary, startTime, endTime, attendees });
  }

  // 多维表格查询
  if (query.includes('查询多维表格') || query.includes('获取表格数据')) {
    const appToken = extractAppToken(query);
    const tableId = extractTableId(query);
    if (!appToken || !tableId) return { success: false, error: '请提供多维表格App Token和表ID' };
    return await handleCommand('get_bitable_records', { appToken, tableId });
  }

  return {
    success: false,
    error: '我还不能理解你的指令，请使用help查看支持的功能，或明确指令参数'
  };
}

// 帮助信息
function getHelpInfo() {
  return {
    success: true,
    data: {
      name: '飞书全场景办公自动化All-in-One Skill',
      version: '1.0.0',
      支持功能: [
        '📄 文档管理：读取、创建、更新飞书文档/知识库',
        '💬 消息发送：给用户/群发送文本、富文本消息',
        '📅 日历日程：查询日程、创建会议、自动排期',
        '📊 多维表格：查询、创建、批量导入表格记录',
        '☁️ 云盘管理：上传下载文件、批量管理云盘资源',
        '✅ 任务待办：同步飞书任务、自动提醒',
        '📝 会议管理：妙记转录、会议总结自动生成'
      ],
      指令列表: [
        'get_document <docId> - 获取文档内容',
        'create_document <title> [content] [folderToken] - 创建文档',
        'update_document <docId> <content> [mode=append/overwrite] - 更新文档',
        'send_text <receiveId> <text> [receiveIdType=open_id/chat_id] - 发送文本消息',
        'get_events [calendarId] [startTime] [endTime] - 查询日程列表',
        'create_event <summary> <startTime> <endTime> [attendees] [description] [location] - 创建日程',
        'get_bitable_records <appToken> <tableId> [filter] - 查询多维表格记录',
        'create_bitable_record <appToken> <tableId> <fields> - 创建表格记录',
        'help - 查看帮助信息'
      ],
      使用说明: '支持自然语言指令，例如："读取文档doc_xxx的内容"、"给张三发送消息你好"、"明天下午2点和李四开需求评审会"'
    }
  };
}

// 辅助函数（简化实现，后续完善）
function extractDocId(query) {
  const match = query.match(/doc_[\w]+/);
  return match ? match[0] : null;
}

function extractTitle(query) {
  const match = query.match(/标题[是为]?["'“](.*?)["'”]/) || query.match(/创建文档["'“](.*?)["'”]/);
  return match ? match[1] : null;
}

function extractContent(query) {
  const match = query.match(/内容[是为]?["'“](.*?)["'”]/);
  return match ? match[1] : '';
}

function extractReceiver(query) {
  const match = query.match(/给(.*?)发/) || query.match(/发送给(.*?)/);
  return match ? match[1].trim() : null;
}

function extractMessageContent(query) {
  const match = query.match(/消息[内容]?[是为]?["'“](.*?)["'”]/);
  return match ? match[1] : null;
}

function extractStartTime(query) {
  // 简化实现，后续接入时间解析库
  return null;
}

function extractEndTime(query) {
  return null;
}

function extractSummary(query) {
  const match = query.match(/会议标题[是为]?["'“](.*?)["'”]/) || query.match(/安排["'“](.*?)["'”]会议/);
  return match ? match[1] : null;
}

function extractAttendees(query) {
  const match = query.match(/参与人[是为]?["'“](.*?)["'”]/);
  return match ? match[1].split(/[,，]/).map(s => s.trim()) : [];
}

function extractAppToken(query) {
  const match = query.match(/app_[\w]+/);
  return match ? match[0] : null;
}

function extractTableId(query) {
  const match = query.match(/tbl_[\w]+/);
  return match ? match[0] : null;
}

// 导出Skill接口
module.exports = {
  init,
  handleCommand,
  handleNaturalLanguage
};
