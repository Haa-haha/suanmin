export const config = { runtime: 'edge' }; 

const API_KEY = process.env.ARK_API_KEY || '9b20932a-770a-4521-8a0d-6912bf56e0c5'; 
const BASE_URL = ' `https://ark.cn-beijing.volces.com/api/v3` '; 
const MODEL = 'ep-20250305154636-mgplm'; 

const SYSTEM_PROMPT = `你是梅花易数的万物类象专家。用户会给你2~3个物象（事物），请你根据八卦万物类象的对应关系，将每个物象映射到最合适的卦。 

八卦万物类象速查： 
- 乾(1)：天、父、君、首、马、金、玉、冰、圆物、镜、刚硬之物、大赤色、水果、珠宝、高楼、西北方 
- 兑(2)：泽、少女、口舌、羊、金属、乐器、废缺之物、白色、歌舞、饮食、西方 
- 离(3)：火、中女、目、雉、日、电、文书、甲胄、干燥之物、红色、南方 
- 震(4)：雷、长男、足、龙、车、木、竹、绿色、大道、东方、声音、鼓 
- 巽(5)：风、长女、股、鸡、木、绳、臭、工巧之物、白色、长条物、东南方 
- 坎(6)：水、中男、耳、豕、血、月、酒、沟渠、弓轮、黑色、隐伏之物、北方 
- 艮(7)：山、少男、手指、狗、土石、门阙、小路、黄色、坚硬之物、东北方、寺庙 
- 坤(8)：地、母、腹、牛、布帛、釜、方物、黄色、西南方、大众、柔软之物、土 

请根据每个物象的核心特征，从八卦中选择最匹配的卦。 

你必须严格返回以下JSON格式（不要有其他内容）： 
{ 
  "upper": {"trigramNumber": 数字1-8, "name": "卦名", "reason": "简要理由"}, 
  "lower": {"trigramNumber": 数字1-8, "name": "卦名", "reason": "简要理由"}, 
  "third": {"trigramNumber": 数字1-8, "name": "卦名", "reason": "简要理由"}, 
  "movingLine": 数字1-6, 
  "movingLineReason": "动爻取法理由" 
} 

说明： 
- upper 对应第一个物象（上卦） 
- lower 对应第二个物象（下卦） 
- third 对应第三个物象（如有外应则为外应，否则为第三个信号），用于确定动爻 
- movingLine 由三个卦数之和除以6取余决定（余0按6） 
- 只返回JSON，不要其他文字`; 

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
    const body = await req.json(); 
    const { objects } = body; 

    if (!objects || !Array.isArray(objects) || objects.length < 2) { 
      return new Response(JSON.stringify({ error: 'Need at least 2 objects' }), { status: 400 }); 
    } 

    const userMessage = `请将以下物象映射到八卦： 
${objects.map((o: string, i: number) => `物象${i + 1}：${o}`).join('\n')} 

请返回JSON结果。`; 

    const arkRes = await fetch(`${BASE_URL}/chat/completions`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${API_KEY}`, 
      }, 
      body: JSON.stringify({ 
        model: MODEL, 
        stream: false, 
        messages: [ 
          { role: 'system', content: SYSTEM_PROMPT }, 
          { role: 'user', content: userMessage }, 
        ], 
        temperature: 0.3, 
        max_tokens: 1024, 
      }), 
    }); 

    if (!arkRes.ok) { 
      const errText = await arkRes.text(); 
      return new Response(JSON.stringify({ error: errText }), { status: arkRes.status }); 
    } 

    const data = await arkRes.json(); 
    const text = data.choices?.[0]?.message?.content || ''; 
    const jsonMatch = text.match(/\{[\s\S]*\}/); 
    if (!jsonMatch) { 
      return new Response(JSON.stringify({ error: 'Failed to parse LLM response', raw: text }), { status: 500 }); 
    } 

    const mapping = JSON.parse(jsonMatch[0]); 
    return new Response(JSON.stringify(mapping), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, 
    }); 
  } catch (err: any) { 
    return new Response(JSON.stringify({ error: err.message }), { status: 500 }); 
  } 
}
