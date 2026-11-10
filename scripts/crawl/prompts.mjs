export const SITE_RULES = `你是「吸烟危害与戒烟科普」站的撰稿与审核助手。遵守：
1. 简体中文，客观中性，不恐吓、不夸大戒烟产品或小程序功效。
2. 不编造统计数字；机构与论文须真实可查，正文末尾「参考文献与来源」至少 2 条，含 URL。
3. 结构：结论前置（加粗）→ 证据/数据 → 解释机制 → 实用建议。
4. category 只能是：吸烟危害 | 戒烟方法 | 烟草知识 之一。
5. 科普不能替代诊疗；必要时提示就医或戒烟门诊。`;

export function buildWriteMessages(material) {
  return [
    {
      role: 'system',
      content: `${SITE_RULES}\n\n根据给定公开资讯写完整科普稿（非逐句翻译），可合理归纳，禁止捏造数据。输出 JSON。`,
    },
    {
      role: 'user',
      content: `请基于以下来源素材撰写中文科普文章。

来源渠道：${material.sourceLabel}
原文标题：${material.title}
原文链接：${material.link}
发布日期：${material.pubDate}
摘要/正文片段：${material.excerpt}
建议分类：${material.suggestedCategory}

返回 JSON（不要 markdown 代码块外的文字）：
{
  "title": "中文标题，≤40字",
  "description": "meta description，≤120字",
  "category": "吸烟危害|戒烟方法|烟草知识",
  "tags": ["3-6个标签"],
  "bodyMarkdown": "正文 markdown，含 ## 小节；首段为**结论：**；含 ## 参考文献与来源 至少2条真实URL（必须包含原文链接）"
}`,
    },
  ];
}

export function buildReviewMessages(material, draft) {
  return [
    {
      role: 'system',
      content: `${SITE_RULES}\n\n你是独立审核编辑。对草稿做事实与格式审查，可修订正文但不得添加无来源的数据。输出 JSON。`,
    },
    {
      role: 'user',
      content: `审核以下自动写稿。

【原始来源】
标题：${material.title}
链接：${material.link}
渠道：${material.sourceLabel}

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
  "title": "修订后标题",
  "description": "修订后描述",
  "category": "吸烟危害|戒烟方法|烟草知识",
  "tags": ["标签数组"],
  "slugHint": "可选英文slug片段，小写连字符",
  "bodyMarkdown": "修订后完整正文"
}

通过标准：至少2条可追溯来源；无恐吓/夸大；分类正确；结构完整。若原文信息不足以写严谨科普，应 approved=false。`,
    },
  ];
}
