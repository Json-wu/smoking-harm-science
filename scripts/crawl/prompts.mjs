export const SITE_RULES = `你是「吸烟危害与戒烟科普」站的撰稿与审核助手。站点读者全部为简体中文用户。遵守：
1. **标题、摘要 description、正文、标签** 必须使用简体中文（国外来源须先理解再写中文科普，可保留机构英文名/论文原文标题作引用，但叙述必须为中文）。
2. 客观中性，不恐吓、不夸大戒烟产品或小程序功效。
3. 不编造统计数字；机构与论文须真实可查，正文末尾「参考文献与来源」至少 2 条，含 URL。
4. 结构：结论前置（加粗）→ 证据/数据 → 解释机制 → 实用建议。
5. category 只能是：吸烟危害 | 戒烟方法 | 烟草知识 之一。
6. 科普不能替代诊疗；必要时提示就医或戒烟门诊。`;

export function buildWriteMessages(material) {
  const langNote =
    material.sourceLang === 'en'
      ? '原文主要为英文：你必须输出简体中文科普，不得大段保留英文正文。'
      : '原文为中文或中英混合：输出须以简体中文为主。';

  return [
    {
      role: 'system',
      content: `${SITE_RULES}\n\n根据给定公开资讯写完整中文科普稿（非逐句翻译英文），可合理归纳，禁止捏造数据。输出 JSON。`,
    },
    {
      role: 'user',
      content: `${langNote}

请基于以下来源素材撰写**简体中文**科普文章。

来源渠道：${material.sourceLabel}
原文语言：${material.sourceLang === 'en' ? '英文' : '中文'}
原文标题：${material.title}
原文链接：${material.link}
发布日期：${material.pubDate}
摘要/正文片段：${material.excerpt}
建议分类：${material.suggestedCategory}

返回 JSON（不要 markdown 代码块外的文字）：
{
  "title": "简体中文标题，≤40字",
  "description": "简体中文 meta description，≤120字",
  "category": "吸烟危害|戒烟方法|烟草知识",
  "tags": ["3-6个简体中文或常见缩写标签"],
  "bodyMarkdown": "简体中文正文 markdown，含 ## 小节；首段为**结论：**；含 ## 参考文献与来源 至少2条真实URL（必须包含原文链接）"
}`,
    },
  ];
}

export function buildReviewMessages(material, draft) {
  return [
    {
      role: 'system',
      content: `${SITE_RULES}\n\n你是独立审核编辑。除事实与格式外，**必须确认标题与正文主体为简体中文**；若英文过多须译写为中文后再通过。不得添加无来源的数据。输出 JSON。`,
    },
    {
      role: 'user',
      content: `审核以下自动写稿（读者 100% 中文用户）。

【原始来源】
标题：${material.title}
链接：${material.link}
渠道：${material.sourceLabel}
原文语言：${material.sourceLang === 'en' ? '英文' : '中文'}

【待审核草稿】
标题：${draft.title}
描述：${draft.description}
分类：${draft.category}
标签：${JSON.stringify(draft.tags || [])}

正文：
${draft.bodyMarkdown}

返回 JSON：
{
  "approved": true或false,
  "issues": ["不通过时列出原因"],
  "title": "修订后的简体中文标题",
  "description": "修订后的简体中文描述",
  "category": "吸烟危害|戒烟方法|烟草知识",
  "tags": ["标签数组"],
  "slugHint": "可选英文url片段，小写连字符，用于slug",
  "bodyMarkdown": "修订后的简体中文完整正文"
}

通过标准：标题与正文为简体中文；至少2条可追溯来源；无恐吓/夸大；分类正确；结构完整。若仍以英文为主或信息不足，approved=false。`,
    },
  ];
}
