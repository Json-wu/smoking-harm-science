export const siteName = '吸烟危害与戒烟科普';

export const siteUrl = 'https://yan.aivelo.net';

export const siteDescription =
  '整理吸烟危害、烟草知识与科学戒烟方法的公开资料，帮助想了解烟草真实影响、正在考虑戒烟的读者做出知情选择。';

export const miniProgram = {
  name: '我要戒烟',
  hint: '提供打卡、进度可视化与辅助放松等工具性界面，配合科普阅读使用；不能替代戒烟门诊或精神科诊疗。',
  /** 太阳码资源见 public/images/miniprogram/code-{430,860,1280}.jpg */
  qrPlaceholder: false,
};

/** 小程序功能说明（客观列举，不承诺疗效） */
export const miniProgramFeatures = [
  {
    title: '戒烟进度与打卡',
    description: '记录无烟天数或减量进度，用时间线查看自己的坚持轨迹。',
  },
  {
    title: '戒烟证书',
    description: '到达设定里程碑后生成证书式页面，作为自我鼓励的纪念，并非医学或法律证明。',
  },
  {
    title: '戒烟圈子',
    description: '与其他用户交流经验的社区入口；内容为网友分享，不能替代专业咨询。',
  },
  {
    title: '静心音频',
    description: '提供背景音乐或静心内容，用于短暂放松；对焦虑持续加重者应寻求医疗帮助。',
  },
  {
    title: '虚拟烟',
    description: '通过界面模拟「点烟」动作，帮助部分使用者过渡口腔与手部习惯，效果因人而异。',
  },
  {
    title: '节省金额参考',
    description: '根据自行填写的吸烟花费估算累计节省，仅为参考计算，不用于商业承诺。',
  },
  {
    title: '轻量互动页面',
    description: '若干小游戏式界面，用于分散注意力或完成每日小任务，属于辅助自律而非治疗手段。',
  },
] as const;

export const miniProgramHabitBlurb =
  '先在本站建立对危害与戒烟方法的了解，再视需要把小程序当作日常记录与自助工具。二者配合的意义在于：看懂「为什么要戒」之后，更容易在冲动出现时想起替代做法，并用可见的进度提醒自己坚持。';

export const categories = ['吸烟危害', '戒烟方法', '烟草知识'] as const;

/** 顶栏主题按钮左侧轮换文案（客观、舒缓，不夸大功效） */
export const headerRotatingHints = [
  '静下来读一会儿，也是一种准备。',
  '冲动会过去，你不必一个人扛。',
  '今天少吸一支，也是进步。',
  '慢慢读，焦虑时可以先离开。',
  '了解真相，同样需要勇气。',
  '戒烟可以分很多次尝试。',
  '每一次呼吸，都可以重新开始。',
  '先喝口水，再决定要不要点烟。',
] as const;
