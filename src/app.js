// ===================== 状态 =====================
const state = {
  currentStep: 1,
  selectedProvider: null,
  providers: []
};

// ===================== 页面切换 =====================
function goStep(step) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${step}`).classList.add('active');

  document.querySelectorAll('.step').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (n === step) s.classList.add('active');
    else if (n < step) s.classList.add('done');
  });

  state.currentStep = step;
  if (step === 2) loadProviders();
  if (step === 3) updateGuide();
}

// ===================== Step 2: 加载模型列表 =====================
async function loadProviders() {
  const list = document.getElementById('provider-list');
  if (list.children.length > 0) return;

  try {
    state.providers = await window.api.getModelProviders();
    state.providers.forEach(p => {
      const card = document.createElement('div');
      card.className = 'provider-card';
      card.dataset.provider = p.id;
      card.onclick = () => selectProvider(card, p.id);
      card.innerHTML = `
        <div class="provider-radio"></div>
        <div class="provider-name">${p.name}</div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = '<p style="color:#c41e1e">加载失败，请重试</p>';
  }
}

function selectProvider(el, id) {
  document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedProvider = id;
  document.getElementById('btn-next').disabled = false;
}

// ===================== Step 3: API Key =====================
function updateGuide() {
  const provider = state.providers.find(p => p.id === state.selectedProvider);
  if (!provider) return;
  document.getElementById('guide-text').textContent = provider.guide;
  document.getElementById('btn-open-register').dataset.url = provider.registerUrl;
  document.getElementById('selected-info').textContent = `已选：${provider.name} → Claude Code`;
  checkApiKey();
}

function openRegister() {
  const url = document.querySelector('#btn-open-register').dataset.url;
  if (url) window.api.openExternal(url);
}

function checkApiKey() {
  document.getElementById('btn-apply').disabled =
    document.getElementById('api-key').value.trim().length < 10;
}

// ===================== 应用配置 =====================
async function applyConfig() {
  const apiKey = document.getElementById('api-key').value.trim();
  if (apiKey.length < 10) return;

  const btn = document.getElementById('btn-apply');
  btn.disabled = true;
  btn.textContent = '配置中...';

  try {
    const result = await window.api.applyConfig({
      providerId: state.selectedProvider,
      apiKey
    });

    goStep(4);
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const details = document.getElementById('result-details');

    if (result.success) {
      icon.textContent = '\u2705';
      title.textContent = 'Claude Code 配置完成！';

      details.innerHTML = `
        <div class="result-item success">\u2713 配置已写入 ~/.claude/settings.json</div>
      `;

      document.getElementById('result-tools').innerHTML = `
        <div style="margin-top:4px;line-height:1.8">
          \u2192 打开 Claude Code 桌面版，直接开始使用
        </div>
        <div style="font-size:12px;color:#888;margin-top:4px">
          \ud83d\udca1 配置已写入 ~/.claude/settings.json，打开 Claude Code 即可使用国产模型
        </div>
      `;
    } else {
      icon.textContent = '\u274c';
      title.textContent = '配置失败';
      details.innerHTML = `
        <div class="result-item error">${result.result.error || '发生未知错误'}</div>
      `;
    }
  } catch (err) {
    goStep(4);
    document.getElementById('result-icon').textContent = '\u274c';
    document.getElementById('result-title').textContent = '配置失败';
    document.getElementById('result-details').innerHTML =
      `<div class="result-item error">${err.message || '发生未知错误'}</div>`;
  }
}

// ===================== 其他 =====================
function closeWindow() { window.close(); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('api-key').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !document.getElementById('btn-apply').disabled) {
      applyConfig();
    }
  });
});
