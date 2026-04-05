/**
 * 授权与计费模块
 * 负责：License验证、版本管理、频率限制、付费功能控制
 */

const fs = require('fs');
const path = require('path');

// ==================== 版本定义 ====================
const EDITIONS = {
  free: {
    name: '免费版',
    maxCallsPerMonth: {
      document_read: 100,
      document_write: 20,
      message_send: 50,
      calendar_query: 20,
      calendar_create: 5,
      bitable_read: 50,
      bitable_write: 10,
      cloud_disk: 5,
      task: 20,
      meeting_miaoj: 0  // 不支持
    },
    features: {
      naturalLanguage: true,
      multiUser: false,
      approval: false,
      attendance: false,
      meetingTranscribe: false,
      customWorkflow: false,
      prioritySupport: false,
      dataAnalytics: false,
      privateDeploy: false
    }
  },
  pro: {
    name: '专业版',
    price: 149,
    priceUnit: '年',
    maxCallsPerMonth: {
      document_read: Infinity,
      document_write: Infinity,
      message_send: Infinity,
      calendar_query: Infinity,
      calendar_create: Infinity,
      bitable_read: Infinity,
      bitable_write: Infinity,
      cloud_disk: 500,
      task: Infinity,
      meeting_miaoj: 0
    },
    features: {
      naturalLanguage: true,
      multiUser: false,
      approval: false,
      attendance: false,
      meetingTranscribe: false,
      customWorkflow: false,
      prioritySupport: true,
      dataAnalytics: false,
      privateDeploy: false
    }
  },
  enterprise: {
    name: '企业版',
    price: 1499,
    priceUnit: '年',
    maxCallsPerMonth: {
      document_read: Infinity,
      document_write: Infinity,
      message_send: Infinity,
      calendar_query: Infinity,
      calendar_create: Infinity,
      bitable_read: Infinity,
      bitable_write: Infinity,
      cloud_disk: Infinity,
      task: Infinity,
      meeting_miaoj: 50
    },
    features: {
      naturalLanguage: true,
      multiUser: true,
      maxUsers: 5,
      approval: true,
      attendance: true,
      meetingTranscribe: true,
      customWorkflow: true,
      prioritySupport: true,
      dataAnalytics: true,
      privateDeploy: false
    }
  },
  private: {
    name: '私有化部署',
    price: 14999,
    priceUnit: '年',
    maxCallsPerMonth: {
      document_read: Infinity,
      document_write: Infinity,
      message_send: Infinity,
      calendar_query: Infinity,
      calendar_create: Infinity,
      bitable_read: Infinity,
      bitable_write: Infinity,
      cloud_disk: Infinity,
      task: Infinity,
      meeting_miaoj: Infinity
    },
    features: {
      naturalLanguage: true,
      multiUser: true,
      maxUsers: Infinity,
      approval: true,
      attendance: true,
      meetingTranscribe: true,
      customWorkflow: true,
      prioritySupport: true,
      dataAnalytics: true,
      privateDeploy: true,
      dedicatedPM: true,
      sla: '99.9%'
    }
  }
};

// ==================== License管理 ====================
class LicenseManager {
  constructor() {
    this.licenseCache = new Map(); // licenseKey -> { edition, exprieAt, data }
    this.storagePath = path.join(__dirname, '..', 'data', 'licenses.json');
  }

  /**
   * 验证License Key
   * @param {string} licenseKey 
   * @returns {object} { valid: boolean, edition: string, message: string, features: object }
   */
  validate(licenseKey) {
    if (!licenseKey) {
      return {
        valid: false,
        edition: 'free',
        message: '未提供License，使用免费版',
        features: EDITIONS.free.features,
        limits: EDITIONS.free.maxCallsPerMonth
      };
    }

    // 检查缓存
    if (this.licenseCache.has(licenseKey)) {
      const cached = this.licenseCache.get(licenseKey);
      if (cached.expireAt > Date.now()) {
        return {
          valid: true,
          edition: cached.edition,
          message: `${EDITIONS[cached.edition].name}，有效期至${new Date(cached.expireAt).toLocaleDateString()}`,
          features: EDITIONS[cached.edition].features,
          limits: EDITIONS[cached.edition].maxCallsPerMonth
        };
      }
    }

    // 解析License Key格式：{edition}-{timestamp}-{hash}
    // 这里可以接入真实的License验证服务
    // 目前使用简化版：格式 "PRO-{base64 encoded data}"
    try {
      const parts = licenseKey.split('-');
      if (parts.length >= 2) {
        const edition = parts[0].toLowerCase();
        const timestamp = parseInt(parts[1]) || Date.now();
        const expireAt = timestamp + 365 * 24 * 60 * 60 * 1000; // 默认1年

        if (EDITIONS[edition]) {
          this.licenseCache.set(licenseKey, { edition, expireAt });
          return {
            valid: true,
            edition,
            message: `${EDITIONS[edition].name}，有效期至${new Date(expireAt).toLocaleDateString()}`,
            features: EDITIONS[edition].features,
            limits: EDITIONS[edition].maxCallsPerMonth
          };
        }
      }
    } catch (e) {
      console.error('License解析失败:', e);
    }

    return {
      valid: false,
      edition: 'free',
      message: 'License无效，使用免费版',
      features: EDITIONS.free.features,
      limits: EDITIONS.free.maxCallsPerMonth
    };
  }

  /**
   * 生成License Key（仅管理员使用）
   * @param {string} edition 
   * @param {number} durationDays 
   * @returns {string}
   */
  generateLicenseKey(edition, durationDays = 365) {
    if (!EDITIONS[edition]) {
      throw new Error('无效的版本类型');
    }
    const timestamp = Date.now();
    const expireTimestamp = timestamp + durationDays * 24 * 60 * 60 * 1000;
    const rawKey = `${edition.toUpperCase()}-${expireTimestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const hash = Buffer.from(rawKey).toString('base64').replace(/=/g, '');
    return `${edition.toLowerCase()}-${expireTimestamp}-${hash}`;
  }

  /**
   * 激活License
   * @param {string} licenseKey 
   * @returns {object}
   */
  activate(licenseKey) {
    const validation = this.validate(licenseKey);
    if (validation.valid) {
      // 存储激活记录
      this.saveActivation(licenseKey, validation);
      return {
        success: true,
        message: `成功激活${validation.message}`,
        edition: validation.edition,
        features: validation.features
      };
    }
    return {
      success: false,
      message: validation.message
    };
  }

  saveActivation(licenseKey, validation) {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = fs.existsSync(this.storagePath)
        ? JSON.parse(fs.readFileSync(this.storagePath, 'utf8'))
        : { activations: [] };
      data.activations.push({
        licenseKey: licenseKey.substring(0, 10) + '***', // 脱敏
        edition: validation.edition,
        activatedAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('保存激活记录失败:', e);
    }
  }
}

// ==================== 用量追踪 ====================
class UsageTracker {
  constructor() {
    this.usagePath = path.join(__dirname, '..', 'data', 'usage.json');
    this.currentMonth = this.getCurrentMonthKey();
  }

  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * 检查并记录API调用
   * @param {string} licenseKey 
   * @param {string} apiType 
   * @returns {object} { allowed: boolean, remaining: number, message: string }
   */
  track(licenseKey, apiType) {
    // 重置月度计数（新月份）
    if (this.currentMonth !== this.getCurrentMonthKey()) {
      this.currentMonth = this.getCurrentMonthKey();
    }

    const license = new LicenseManager().validate(licenseKey);
    const limits = license.limits;
    const limit = limits[apiType] || Infinity;

    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity, message: '无限制' };
    }

    // 读取当前用量
    const usage = this.loadUsage();
    const userKey = licenseKey || 'anonymous';
    const currentUsage = usage[this.currentMonth]?.[userKey]?.[apiType] || 0;

    if (currentUsage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        message: `本月${apiType}调用次数已用尽（${currentUsage}/${limit}），请升级到专业版获取更多额度`,
        upgradeUrl: 'https://clawhub.ai/ZCSXHCKR/feishu-all-in-one-pro'
      };
    }

    // 增加计数
    this.incrementUsage(userKey, apiType);

    const remaining = limit - currentUsage - 1;
    return {
      allowed: true,
      remaining,
      used: currentUsage + 1,
      limit,
      message: `本月已使用${currentUsage + 1}次，剩余${remaining}次`
    };
  }

  incrementUsage(userKey, apiType) {
    try {
      const usage = this.loadUsage();
      if (!usage[this.currentMonth]) {
        usage[this.currentMonth] = {};
      }
      if (!usage[this.currentMonth][userKey]) {
        usage[this.currentMonth][userKey] = {};
      }
      usage[this.currentMonth][userKey][apiType] = (usage[this.currentMonth][userKey][apiType] || 0) + 1;
      
      const dir = path.dirname(this.usagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.usagePath, JSON.stringify(usage, null, 2));
    } catch (e) {
      console.error('记录用量失败:', e);
    }
  }

  loadUsage() {
    try {
      return fs.existsSync(this.usagePath)
        ? JSON.parse(fs.readFileSync(this.usagePath, 'utf8'))
        : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * 获取当前用量报告
   * @param {string} licenseKey 
   * @returns {object}
   */
  getReport(licenseKey) {
    const license = new LicenseManager().validate(licenseKey);
    const usage = this.loadUsage();
    const userKey = licenseKey || 'anonymous';
    const monthlyUsage = usage[this.currentMonth]?.[userKey] || {};
    const limits = license.limits;

    const report = {
      edition: license.edition,
      editionName: EDITIONS[license.edition]?.name || '未知',
      month: this.currentMonth,
      apis: {}
    };

    for (const [apiType, limit] of Object.entries(limits)) {
      const used = monthlyUsage[apiType] || 0;
      report.apis[apiType] = {
        used,
        limit: limit === Infinity ? '无限' : limit,
        remaining: limit === Infinity ? '无限' : Math.max(0, limit - used),
        percentage: limit === Infinity ? 0 : Math.min(100, (used / limit) * 100)
      };
    }

    return report;
  }
}

// ==================== 导出 ====================
module.exports = {
  EDITIONS,
  LicenseManager,
  UsageTracker
};
