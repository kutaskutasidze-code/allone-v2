export type ChannelId = 'instagram' | 'messenger' | 'telegram' | 'whatsapp' | 'website';

export interface BubbleStyle {
  bg: string;
  text: string;
  radius: string;
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  nameKey: string;
  descKey: string;
  brandColor: string;
  headerBg: string;
  headerText: string;
  botBubble: BubbleStyle;
  userBubble: BubbleStyle;
  showAvatar: boolean;
  avatarStyle?: string;
  showCheckmarks: boolean;
  showTail: boolean;
}

export const channelConfigs: ChannelConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    nameKey: 'chatbot.channel.instagram',
    descKey: 'chatbot.channel.instagram.desc',
    brandColor: '#E1306C',
    headerBg: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
    headerText: '#FFFFFF',
    botBubble: { bg: '#EFEFEF', text: '#262626', radius: '18px' },
    userBubble: { bg: '#3797F0', text: '#FFFFFF', radius: '18px' },
    showAvatar: true,
    avatarStyle: 'story-circle',
    showCheckmarks: false,
    showTail: false,
  },
  {
    id: 'messenger',
    name: 'Messenger',
    nameKey: 'chatbot.channel.messenger',
    descKey: 'chatbot.channel.messenger.desc',
    brandColor: '#0084FF',
    headerBg: '#0084FF',
    headerText: '#FFFFFF',
    botBubble: { bg: '#E4E6EB', text: '#050505', radius: '18px' },
    userBubble: { bg: '#0084FF', text: '#FFFFFF', radius: '18px' },
    showAvatar: true,
    avatarStyle: 'blue-circle',
    showCheckmarks: false,
    showTail: false,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    nameKey: 'chatbot.channel.telegram',
    descKey: 'chatbot.channel.telegram.desc',
    brandColor: '#0088CC',
    headerBg: '#0088CC',
    headerText: '#FFFFFF',
    botBubble: { bg: '#FFFFFF', text: '#000000', radius: '12px' },
    userBubble: { bg: '#EFFDDE', text: '#000000', radius: '12px' },
    showAvatar: false,
    showCheckmarks: true,
    showTail: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameKey: 'chatbot.channel.whatsapp',
    descKey: 'chatbot.channel.whatsapp.desc',
    brandColor: '#25D366',
    headerBg: '#075E54',
    headerText: '#FFFFFF',
    botBubble: { bg: '#FFFFFF', text: '#111B21', radius: '8px' },
    userBubble: { bg: '#DCF8C6', text: '#111B21', radius: '8px' },
    showAvatar: false,
    showCheckmarks: true,
    showTail: true,
  },
  {
    id: 'website',
    name: 'Website',
    nameKey: 'chatbot.channel.website',
    descKey: 'chatbot.channel.website.desc',
    brandColor: '#0A68F5',
    headerBg: '#0A68F5',
    headerText: '#FFFFFF',
    botBubble: { bg: '#F4F7FB', text: '#1C1C1E', radius: '18px' },
    userBubble: { bg: '#0A68F5', text: '#FFFFFF', radius: '18px' },
    showAvatar: true,
    avatarStyle: 'allone-logo',
    showCheckmarks: false,
    showTail: false,
  },
];

export const conversationScript = [
  { type: 'user' as const, textKey: 'chatbot.msg.user1' },
  { type: 'bot' as const, textKey: 'chatbot.msg.bot1' },
  { type: 'user' as const, textKey: 'chatbot.msg.user2' },
  { type: 'bot' as const, textKey: 'chatbot.msg.bot2' },
];

export function getChannelConfig(id: ChannelId): ChannelConfig {
  return channelConfigs.find(c => c.id === id)!;
}
