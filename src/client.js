const lark = require('@larksuiteoapi/node-sdk');
const axios = require('axios');
const _ = require('lodash');

class FeishuClient {
  constructor(config) {
    this.config = config;
    this.client = new lark.Client({
      appId: config.appId,
      appSecret: config.appSecret,
      appType: lark.AppType.SelfBuild,
      domain: config.tenantKey ? lark.Domain.Lark : lark.Domain.Feishu,
    });
    this.tokenCache = {
      accessToken: null,
      expireTime: 0
    };
  }

  // 获取AccessToken（自动缓存）
  async getAccessToken() {
    const now = Date.now();
    if (this.tokenCache.accessToken && this.tokenCache.expireTime > now) {
      return this.tokenCache.accessToken;
    }

    try {
      const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      });

      if (res.data.code === 0) {
        this.tokenCache = {
          accessToken: res.data.tenant_access_token,
          expireTime: now + (res.data.expire - 60) * 1000 // 提前1分钟过期
        };
        return this.tokenCache.accessToken;
      } else {
        throw new Error(`获取AccessToken失败: ${res.data.msg}`);
      }
    } catch (e) {
      throw new Error(`获取AccessToken失败: ${e.message}`);
    }
  }

  // 通用API请求方法
  async request(method, url, data = {}, params = {}) {
    const accessToken = await this.getAccessToken();
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const res = await axios({
        method,
        url: `https://open.feishu.cn${url}`,
        headers,
        data,
        params
      });

      if (res.data.code === 0) {
        return res.data.data;
      } else {
        throw new Error(`API请求失败: ${res.data.msg} (code: ${res.data.code})`);
      }
    } catch (e) {
      if (e.response?.data?.code === 99991663) { // Token过期，自动重试一次
        this.tokenCache.accessToken = null;
        return this.request(method, url, data, params);
      }
      throw e;
    }
  }

  // ==================== 文档相关API ====================
  // 获取文档内容
  async getDocument(docId) {
    return this.request('GET', `/open-apis/docx/v1/documents/${docId}/raw_content`);
  }

  // 创建文档
  async createDocument(title, content = '', folderToken = '') {
    return this.request('POST', '/open-apis/docx/v1/documents', {
      title,
      content,
      folder_token: folderToken
    });
  }

  // 更新文档内容
  async updateDocument(docId, content, mode = 'append') {
    return this.request('PATCH', `/open-apis/docx/v1/documents/${docId}/content`, {
      content,
      mode
    });
  }

  // ==================== 消息相关API ====================
  // 发送消息
  async sendMessage(receiveId, content, msgType = 'text', receiveIdType = 'open_id') {
    return this.request('POST', '/open-apis/im/v1/messages', {
      receive_id: receiveId,
      content: JSON.stringify(content),
      msg_type: msgType
    }, {
      receive_id_type: receiveIdType
    });
  }

  // 发送文本消息
  async sendTextMessage(receiveId, text, receiveIdType = 'open_id') {
    return this.sendMessage(receiveId, { text }, 'text', receiveIdType);
  }

  // 发送富文本消息
  async sendPostMessage(receiveId, post, receiveIdType = 'open_id') {
    return this.sendMessage(receiveId, post, 'post', receiveIdType);
  }

  // ==================== 日历相关API ====================
  // 获取日程列表
  async getEvents(calendarId = 'primary', startTime, endTime) {
    const params = {};
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;
    return this.request('GET', `/open-apis/calendar/v4/calendars/${calendarId}/events`, {}, params);
  }

  // 创建日程
  async createEvent(summary, startTime, endTime, attendees = [], description = '', location = '') {
    return this.request('POST', '/open-apis/calendar/v4/calendars/primary/events', {
      summary,
      description,
      location,
      start_time: {
        timestamp: Math.floor(new Date(startTime).getTime() / 1000),
        time_zone: 'Asia/Shanghai'
      },
      end_time: {
        timestamp: Math.floor(new Date(endTime).getTime() / 1000),
        time_zone: 'Asia/Shanghai'
      },
      attendees: attendees.map(id => ({ user_id: id }))
    });
  }

  // ==================== 多维表格相关API ====================
  // 获取数据表记录
  async getBitableRecords(appToken, tableId, filter = {}, pageSize = 500) {
    return this.request('POST', `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`, {
      filter,
      page_size: pageSize
    });
  }

  // 创建数据表记录
  async createBitableRecord(appToken, tableId, fields) {
    return this.request('POST', `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
      fields
    });
  }

  // 批量创建记录
  async batchCreateBitableRecords(appToken, tableId, records) {
    return this.request('POST', `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
      records: records.map(fields => ({ fields }))
    });
  }

  // ==================== 云盘相关API ====================
  // 上传文件
  async uploadFile(filePath, parentType = 'explorer', parentNode = 'root') {
    // 简化实现，后续完善
    return { success: true, message: '文件上传功能开发中' };
  }

  // 下载文件
  async downloadFile(fileToken, savePath) {
    // 简化实现，后续完善
    return { success: true, message: '文件下载功能开发中' };
  }
}

module.exports = FeishuClient;
