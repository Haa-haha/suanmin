---
name: "oracleyi-objects-mapper"
description: "Maps 3 observed objects to upper/lower trigrams and moving line. Invoke when user uses object-based casting or reports wrong 取象 mappings."
---

# OracleYi Objects Mapper

Use this skill when the app needs **取象（事物 → 八卦）** mapping for梅花易数“事物起卦”。

## Input

Provide:
- `objects`: 3 short object phrases in Chinese, in observed order.
- `context`: optional scene/context (city, indoors/outdoors, mood), if available.

## Output (STRICT JSON)

Return ONLY JSON:

```json
{
  "upperTrigramNumber": 1,
  "lowerTrigramNumber": 8,
  "movingLine": 3,
  "mapping": {
    "object1": {"trigramNumber": 1, "trigramName": "乾", "image": "天", "reason": "..."},
    "object2": {"trigramNumber": 8, "trigramName": "坤", "image": "地", "reason": "..."},
    "object3": {"movingLine": 3, "reason": "..."}
  },
  "confidence": 0.0
}
```

Constraints:
- `upperTrigramNumber` and `lowerTrigramNumber` must be 1–8 (King Wen trigram numbers).
- `movingLine` must be 1–6.
- Reasons must be short, concrete, and grounded in象意（天/泽/火/雷/风/水/山/地）。

## Guidance

- Prefer the most *salient*象意 of each object in the current scene.
- If multiple象意 plausible, pick the one that best matches “第一眼”的直觉，并 explain briefly.
- Avoid overfitting on modern semantics; use象类比（如：天空→乾，海→坎，树/叶/花/果→巽，灯/火→离，车鸣/震动→震，墙/门/止→艮，田土/大地→坤，湖泽/喜悦/口→兑）。

## When To Invoke

- User chooses “你看到的事物” 起卦。
- User reports that 取象映射不对/全是错的。
- Before showing “取象一/二/三 → 上卦/下卦/动爻” reasoning.

