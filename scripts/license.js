/**
 * License Key 管理脚本
 * 用于生成、分发和管理License
 * 
 * 使用方法：
 * node scripts/license.js generate <edition> [days]
 * node scripts/license.js verify <licenseKey>
 */

const { LicenseManager, UsageTracker, EDITIONS } = require('../src/licensing');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
🔑 飞书All-in-One Pro - License管理脚本

用法：
  node scripts/license.js generate <edition> [days]  生成License
  node scripts/license.js verify <licenseKey>         验证License
  node scripts/license.js list                          列出所有版本

可用版本：
  free       - 免费版（无License）
  pro        - 专业版 (¥149/年)
  enterprise - 企业版 (¥1,499/年)
  private    - 私有化部署 (¥14,999/年)

示例：
  node scripts/license.js generate pro 365
  node scripts/license.js generate enterprise 180
  node scripts/license.js verify pro-1743849600000-abc123
`);
  process.exit(0);
}

const lm = new LicenseManager();

if (command === 'generate') {
  const edition = args[1];
  const days = parseInt(args[2]) || 365;

  if (!edition || !EDITIONS[edition]) {
    console.log('❌ 请指定有效的版本：pro, enterprise, private');
    process.exit(1);
  }

  const licenseKey = lm.generateLicenseKey(edition, days);
  const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN');

  console.log(`
✅ License Key 生成成功！

  版本：${EDITIONS[edition].name}
  价格：¥${EDITIONS[edition].price || 0}/${EDITIONS[edition].priceUnit}
  有效期：${days}天
  到期日：${expireDate}
  
  🔑 您的License Key：
  ${licenseKey}
  
  ⚠️ 请妥善保管此Key，不要泄露给他人！
`);
} else if (command === 'verify') {
  const licenseKey = args[1];
  if (!licenseKey) {
    console.log('❌ 请提供License Key');
    process.exit(1);
  }

  const result = lm.validate(licenseKey);
  if (result.valid) {
    console.log(`
✅ License 验证成功！

  版本：${result.edition}
  状态：${result.message}
  功能：${Object.entries(result.features).filter(([k,v]) => v).map(([k]) => k).join(', ')}
`);
  } else {
    console.log(`
❌ License 验证失败！
  ${result.message}
`);
  }
} else if (command === 'list') {
  console.log(`
📋 可用版本列表：

  free       - 免费版     ¥0/年   - 基础功能，限流
  pro        - 专业版    ¥149/年  - 全功能无限制 ⭐推荐
  enterprise - 企业版   ¥1,499/年 - 多用户+审批+考勤
  private    - 私有化   ¥14,999/年 - 私有部署+定制开发
`);
} else if (command === 'report') {
  const licenseKey = args[1] || '';
  const ut = new UsageTracker();
  const report = ut.getReport(licenseKey);
  
  console.log(`
📊 用量报告 - ${report.month}

  版本：${report.editionName}
  
  API调用明细：
  ${Object.entries(report.apis).map(([api, data]) => {
    const bar = data.limit === '无限' ? '∞' : '▓'.repeat(Math.floor(data.percentage/10)) + '░'.repeat(10-Math.floor(data.percentage/10));
    return `    ${api}: ${data.used}/${data.limit} ${bar}`;
  }).join('\n')}
`);
} else {
  console.log(`❌ 未知命令：${command}`);
  process.exit(1);
}
