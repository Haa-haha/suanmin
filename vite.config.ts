import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    {
      name: 'oracle-api',
      configureServer(server) {
        const env = loadEnv(server.config.mode, server.config.root, '');
        const apiKey = env.ARK_API_KEY;
        const model = env.ARK_MODEL;
        const endpoint = env.ARK_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

        const readBody = async (req: any) => {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const raw = Buffer.concat(chunks).toString('utf-8');
          return raw ? JSON.parse(raw) : {};
        };

        server.middlewares.use(async (req, res, next) => {
          try {
            if (!req.url?.startsWith('/api/')) return next();
            if (!apiKey || !model) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'Missing ARK config' }));
              return;
            }

            if (req.method === 'POST' && req.url === '/api/oracle-interpret') {
              const payload = await readBody(req);
              const system =
                '你是一位以《易经》为核心的占卜解读者。输出中文，严禁错别字、乱码、病句。必须结构化且只输出一次标题。\n\n格式要求（必须严格遵守）：\n1）只允许出现 5 个一级标题，且每个标题必须单独一行，仅包含标题本身：\n# 结论\n# 现在的局势\n# 关键变化（动爻）\n# 建议（3条）\n# 需要避免的事（2条）\n2）正文不允许出现“#”符号。\n3）每段必须是完整句子，不允许出现“但是/而/并/同时/不过/所以/另外/因此”开头的残句。\n4）每句以句号结尾（。），不要以逗号结尾。\n5）不要引用或比喻式套用爻辞原文（例如“像‘噬肤灭鼻’那样…”这类表达禁止）；若必须提到爻意，用现代口语解释，不出现引号中的古文。\n6）“建议（3条）”必须输出 1. 2. 3. 三条；“需要避免的事（2条）”必须输出 1. 2. 两条。';
              const user =
                `用户所问：${payload.question || ''}\n` +
                `本卦：${payload.hexagramName || ''}；变卦：${payload.changedHexagramName || ''}\n` +
                `上卦：${payload.upperTrigram || ''}；下卦：${payload.lowerTrigram || ''}\n` +
                `变上卦：${payload.changedUpperTrigram || ''}；变下卦：${payload.changedLowerTrigram || ''}\n` +
                `动爻：第${payload.movingLine || ''}爻\n` +
                `起卦方式：${payload.method || ''}\n` +
                `所凭信息：${Array.isArray(payload.signals) ? payload.signals.join(' · ') : ''}\n` +
                `补充：${Array.isArray(payload.reasons) ? payload.reasons.join('；') : ''}\n` +
                '要求：标题只出现一次；建议必须是1-3三条；需要避免的事必须是1-2两条；不要重复与跑题。';

              const upstream = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  stream: true,
                  temperature: 0.4,
                  messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                  ],
                }),
              });

              if (!upstream.ok || !upstream.body) {
                const text = await upstream.text().catch(() => upstream.statusText);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: text || 'Upstream error' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              const reader = upstream.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
              res.end();
              return;
            }

            if (req.method === 'POST' && req.url === '/api/oracle-object-mapping') {
              const payload = await readBody(req);
              const objects = Array.isArray(payload.objects) ? payload.objects : [];
              const system = '你把三样事物映射为《易经》上卦/下卦与动爻，输出严格 JSON。';
              const user =
                `事物：${objects.join('、')}\n` +
                '输出 JSON：{"upperTrigramNumber":1-8,"lowerTrigramNumber":1-8,"movingLine":1-6,"reason":"简短原因"}。不要输出多余文字。';

              const upstream = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  temperature: 0.2,
                  stream: false,
                  messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                  ],
                }),
              });

              if (!upstream.ok) {
                const text = await upstream.text().catch(() => upstream.statusText);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: text || 'Upstream error' }));
                return;
              }

              const data = await upstream.json();
              const content = data?.choices?.[0]?.message?.content || '{}';
              let parsed: any = {};
              try {
                parsed = JSON.parse(content);
              } catch {
                parsed = { error: 'Bad model output', raw: content };
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(parsed));
              return;
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Not Found' }));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: e?.message || 'Server error' }));
          }
        });
      },
    },
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
