# 使用指南

## 🚀 快速开始
### 1. 安装Skill
```bash
clawhub install feishu-all-in-one
```

### 2. 配置飞书应用
#### 步骤1：创建飞书企业自建应用
1. 打开飞书开放平台：https://open.feishu.cn
2. 创建企业自建应用，获取App ID和App Secret
3. 给应用开通所需权限：
   - 文档：docx:document:readonly, docx:document, docx:document:create
   - 消息：im:message, im:message:send, im:chat
   - 日历：calendar:calendar, calendar:event, calendar:event:readonly
   - 多维表格：bitable:app, bitable:record, bitable:record:readonly
   - 云盘：drive:file, drive:file:readonly
4. 发布应用并申请企业授权

#### 步骤2：配置Skill
在OpenClaw配置页面填写：
- App ID：你的飞书应用App ID
- App Secret：你的飞书应用App Secret
- 企业租户Key：个人用户留空，企业用户填写

### 3. 开始使用
#### 自然语言调用示例
```
> 读取文档doc_abc123的内容
> 创建文档标题"2026年Q2工作计划"内容"这是工作计划内容"
> 给ou_xyz789发送消息"下午3点开项目评审会"
> 查询我明天的日程
> 创建会议标题"需求评审" 开始时间"2026-04-06 15:00" 结束时间"2026-04-06 16:00" 参与人["ou_xyz789"]
> 查询多维表格app_abc123表tbl_def456的所有记录
```

#### 指令调用示例
```javascript
// 获取文档内容
const doc = await skill.handleCommand('get_document', { docId: 'doc_abc123' });

// 发送文本消息
await skill.handleCommand('send_text', {
  receiveId: 'ou_xyz789',
  text: '你好，这是测试消息'
});

// 创建日程
await skill.handleCommand('create_event', {
  summary: '需求评审会',
  startTime: '2026-04-06T15:00:00+08:00',
  endTime: '2026-04-06T16:00:00+08:00',
  attendees: ['ou_xyz789', 'ou_uvw012']
});
```

## 📋 权限列表
| 功能 | 所需权限 |
| --- | --- |
| 读取文档 | docx:document:readonly |
| 创建/更新文档 | docx:document, docx:document:create |
| 发送消息 | im:message, im:message:send |
| 读取群信息 | im:chat |
| 查询日程 | calendar:event:readonly |
| 创建/更新日程 | calendar:event, calendar:calendar |
| 读取多维表格 | bitable:record:readonly |
| 创建/更新表格记录 | bitable:record, bitable:app |
| 读取云盘文件 | drive:file:readonly |
| 上传/下载文件 | drive:file |

## ❓ 常见问题
### Q: 为什么提示权限不足？
A: 请检查飞书应用是否开通了对应权限，并且已经发布授权给企业。

### Q: 支持个人飞书账号吗？
A: 支持，个人用户创建个人应用即可使用。

### Q: 可以批量操作吗？
A: 可以，所有API都支持批量操作，具体请参考指令列表。

### Q: 数据安全吗？
A: 所有数据都通过飞书官方API传输，不会经过第三方服务器，企业版支持私有化部署，数据100%留存在企业内部。
