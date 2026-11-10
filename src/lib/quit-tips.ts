export type QuitTip = {
  id: string;
  title: string;
  body: string;
  /** 约 1 分钟内可完成 */
  quick?: boolean;
};

/** 戒烟小技巧（行为层面，不替代医疗） */
export const quitTips: QuitTip[] = [
  {
    id: 'delay-10',
    title: '先等 10 分钟',
    body: '渴求像波浪，多数在十几分钟内减弱。设定计时器，延迟后再决定是否吸烟。',
    quick: true,
  },
  {
    id: 'breath-4-6',
    title: '4 秒吸气，6 秒呼气',
    body: '缓慢呼吸三次，把注意力放在呼气变长上，有助于降低紧张感（不替代焦虑症治疗）。',
    quick: true,
  },
  {
    id: 'water',
    title: '喝一大口温水',
    body: '改变口腔与手部节奏，打破「点烟」的条件反射；避免用大量含糖饮料代替。',
    quick: true,
  },
  {
    id: 'walk',
    title: '走动 3 分钟',
    body: '离开诱发场景，爬楼梯或绕走廊一圈，占用渴求高峰时段。',
    quick: true,
  },
  {
    id: 'hands',
    title: '占住双手',
    body: '捏减压球、洗手、整理桌面，减少无意识摸烟盒的动作。',
    quick: true,
  },
  {
    id: 'tell-one',
    title: '告诉一个人',
    body: '给亲友发一条简短消息说明「我现在想戒烟但有冲动」，获得一句支持比独自硬扛更有效。',
  },
  {
    id: 'remove-cues',
    title: '清走烟和打火机',
    body: '环境线索越少越好。包里、车内、工位抽屉里的备用烟是常见复吸诱因。',
  },
  {
    id: 'record',
    title: '记下一笔触发',
    body: '用手机备忘录写：时间 + 情绪 + 场景。了解自己的模式，便于下次提前预案。',
  },
  {
    id: 'night',
    title: '睡前一小时不吸烟',
    body: '尼古丁干扰睡眠；若正在减量，可把最后一支前移，减少夜间醒来吸烟。',
  },
  {
    id: 'professional',
    title: '知道何时求助',
    body: '持续抑郁、胸痛、咳血或戒断严重失眠，应联系医生、戒烟门诊或拨打当地急救/卫生热线。',
  },
];

export const tipsPageMeta = {
  title: '戒烟小技巧',
  description:
    '一分钟可做的戒烟应对技巧。先通过科普提高认识，再配合微信「我要戒烟」小程序的打卡、进度与自助界面辅助日常坚持。',
};
