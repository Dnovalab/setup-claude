# Claude Code 国产模型一键配置

为 **Claude Code** 桌面版配置国产 AI 模型，国内直连，无需翻墙。

## 原理

Claude Code 支持通过 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN` 自定义后端。
国产模型的 `/anthropic` 兼容端点可直接对接，无需代理。

## 支持的模型

| 模型 | 提供商 |
|------|--------|
| DeepSeek (deepseek-v4-pro) | 深度求索 |
| 通义千问 (qwen-max) | 阿里云 |
| GLM (glm-4) | 智谱 AI |

## 使用

```bash
npm install
npm start
```

1. 选择模型提供商
2. 粘贴 API Key
3. 一键写入配置
4. 打开 Claude Code 即可使用

## 打包

```bash
npm run build:mac  # macOS .dmg
npm run build:win  # Windows .exe
```
