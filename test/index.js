const skill = require('../src/index');

async function test() {
  console.log('=== 飞书All-in-One Skill测试 ===\n');

  // 测试帮助信息
  console.log('1. 测试获取帮助信息:');
  const help = await skill.handleCommand('help');
  console.log(JSON.stringify(help, null, 2));
  console.log('\n');

  // 测试未初始化错误
  console.log('2. 测试未初始化调用:');
  try {
    await skill.handleCommand('get_document', { docId: 'test' });
  } catch (e) {
    console.log('预期错误:', e.message);
  }
  console.log('\n');

  // 模拟初始化（请替换为真实的AppID和AppSecret测试）
  console.log('3. 测试初始化:');
  try {
    // 替换为你的测试应用凭证
    await skill.init({
      appId: 'cli_xxxxxx',
      appSecret: 'xxxxxx'
    });
    console.log('初始化成功');
  } catch (e) {
    console.log('初始化失败（正常，因为是测试凭证）:', e.message);
  }
  console.log('\n');

  // 测试自然语言处理
  console.log('4. 测试自然语言指令匹配:');
  const testQueries = [
    '读取文档doc_abc123的内容',
    '创建文档标题"测试文档"内容"这是测试内容"',
    '给ou_xyz789发送消息"你好"',
    '查询我明天的日程',
    '创建会议标题"需求评审"开始时间"2026-04-06 15:00"结束时间"2026-04-06 16:00"',
    '查询多维表格app_abc123表tbl_def456的记录'
  ];

  for (const query of testQueries) {
    console.log(`\n查询: ${query}`);
    try {
      const res = await skill.handleNaturalLanguage(query);
      console.log('解析结果:', JSON.stringify(res, null, 2));
    } catch (e) {
      console.log('解析错误:', e.message);
    }
  }

  console.log('\n=== 测试完成 ===');
  console.log('请替换为真实的飞书应用凭证进行完整功能测试');
}

test().catch(console.error);
