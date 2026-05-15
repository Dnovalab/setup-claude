const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ===================== 模型提供商配置（Claude Code 版） =====================
const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    registerUrl: 'https://platform.deepseek.com/sign_in',
    guide: '1. 打开 DeepSeek 官网并注册账号\n2. 登录后进入 API Keys 页面\n3. 点击"创建 API Key"，复制生成的密钥（以 sk- 开头）',
    claude: {
      baseUrl: 'https://api.deepseek.com/anthropic',
      model: 'deepseek-v4-pro'
    }
  },
  {
    id: 'qwen',
    name: '通义千问 (阿里云)',
    registerUrl: 'https://bailian.console.aliyun.com/',
    guide: '1. 打开阿里云百炼平台并登录（用支付宝/手机号注册）\n2. 开通"模型服务"后进入 API-KEY 管理\n3. 创建 API Key，复制保存',
    claude: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/anthropic',
      model: 'qwen-max'
    }
  },
  {
    id: 'glm',
    name: '智谱 GLM (智谱AI)',
    registerUrl: 'https://open.bigmodel.cn/usercenter/project-manage',
    guide: '1. 打开智谱 AI 官网并注册（国内手机号即可）\n2. 登录后进入"项目管理"页面\n3. 创建项目或查看已有项目，复制 API Key',
    claude: {
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/anthropic',
      model: 'glm-4'
    }
  }
];

// ===================== 窗口 =====================
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 680,
    resizable: false,
    maximizable: false,
    title: 'Claude Code 一键配置',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'bottom' });
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ===================== IPC: 获取模型列表 =====================
ipcMain.handle('get-model-providers', async () => {
  return PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    guide: p.guide,
    registerUrl: p.registerUrl
  }));
});

// ===================== IPC: 应用配置（仅 Claude Code） =====================
ipcMain.handle('apply-config', async (event, options) => {
  const { providerId, apiKey } = options;
  const provider = PROVIDERS.find(p => p.id === providerId);
  if (!provider) throw new Error(`未知模型: ${providerId}`);

  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const claudeDir = path.dirname(settingsPath);

  try {
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // 读取现有 settings.json（如果存在）
    let existing = {};
    if (fs.existsSync(settingsPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch (e) {
        // 文件损坏则忽略
      }
    }

    // 合并配置
    const config = {
      ...existing,
      models: {
        ...existing.models,
        [provider.claude.model]: {
          ...(existing.models?.[provider.claude.model] || {})
        }
      },
      ANTHROPIC_BASE_URL: provider.claude.baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      model: provider.claude.model
    };

    fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2), 'utf-8');

    return {
      success: true,
      result: {
        tool: 'Claude Code',
        success: true
      }
    };
  } catch (err) {
    return {
      success: false,
      result: {
        tool: 'Claude Code',
        success: false,
        error: err.message
      }
    };
  }
});

// ===================== IPC: 打开外部链接 =====================
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});
