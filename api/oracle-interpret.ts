export const config = { runtime: 'edge' };

const API_KEY = process.env.ARK_API_KEY || '';
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = 'ep-20250305154636-mgplm';

const SYSTEM_PROMPT = `你是一位精通梅花易数的卦师，语言风格沉稳、笃定、有分量，像一位阅历丰富的长者在给后辈指点迷津。

你的核心职责：用户带着一个具体的问题来找你，他内心犹豫不决，需要你从卦象中给出明确的判断和方向。

## 解卦原则

1. **直击问题**：用户问"和好对吗"，你就要明确回答和好这个决定是有利还是有弊。不要绕弯子，不要泛泛而谈。
2. **解释不安**：用户来找你，说明他对自己的选择不确定。你要从本卦中找到他内心不安的卦象依据，告诉他"你现在感到犹豫/不安是合理的，因为本卦显示……"，让他觉得被理解。
3. **给出决断**：从变卦和动爻的变化中，给出明确的方向——该做还是不该做，时机对不对，需要注意什么。
4. **实用建议**：最后给出2-3条具体可执行的建议，不要空泛的"顺其自然"。

## 输出格式（严格遵守，只使用三级标题 ###）

### 卦象总览
简要说明本卦和变卦是什么，一两句话概括整体态势。

### 本卦解析・{本卦名}
- 分析本卦的卦象如何映射到用户当前的处境
- 解释用户内心不安/犹豫的卦象依据（"你之所以感到……是因为本卦中……"）
- 分析体用关系和五行生克

### 变卦指引・{变卦名}
- 动爻变化意味着什么转折
- 变卦显示事态将如何发展
- 对用户的决定给出明确的利弊判断

### 最终决断
- 用一两句话明确回答用户的问题（"就你所问的……，卦象显示……"）
- 给出2-3条具体、可操作的建议
- 指出需要特别注意或避免的事项

## 语言要求
- 笃定而不武断，温和而有力量
- 用"卦象显示""从卦理来看"等表述，让判断有据可依
- 避免模棱两可的废话，每句话都要有信息量
- 适当引用卦辞或爻辞来增强说服力
- 段落之间用空行分隔，保持阅读节奏
- 只使用三级标题（### ），不要使用一级（#）或二级（##）标题`;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing ARK_API_KEY' }), { status: 500 });
    }

    const body = await req.json();
    const {
      method,
      signals,
      question,
      hexagramTitle,
      changedHexagramTitle,
      movingLine,
      reasons,
    } = body;

    const methodNames: Record<string, string> = {
      number: '报数起卦',
      object: '取象起卦',
      time: '时间起卦',
      fate: '天意起卦',
    };

    const userMessage = `起卦方式：${methodNames[method] || method}
输入信号：${signals.join('、')}
所问之事：${question || '未指定具体问题'}

本卦：${hexagramTitle}
变卦：${changedHexagramTitle}
动爻：第${movingLine}爻

推演过程：
${reasons.join('\n')}

请针对「${question || '此事'}」这个具体问题，从卦象出发给出明确的判断和方向。`;

    const arkRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!arkRes.ok) {
      const errText = await arkRes.text();
      return new Response(JSON.stringify({ error: errText }), { status: arkRes.status });
    }

    return new Response(arkRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
