import type { ConversationMessage } from './actions';

export const shuffleChoices = (choices: string[]) => {
  const copy = [...choices];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const splitChoicesByComma = (choiceText: string) =>
  choiceText
    .split(',')
    .map((choice) => choice.trim())
    .filter(Boolean);

export const parsePostedAt = (value: string) => {
  const cleaned = value.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const meridiemMatch = cleaned.match(
    /(\d{4})[- ](\d{2})[- ](\d{2})[- ](오전|오후)\s+(\d{1,2}):(\d{2})/
  );
  if (meridiemMatch) {
    const [, year, month, day, meridiem, hourRaw, minute] = meridiemMatch;
    let hour = Number(hourRaw);
    if (meridiem === '오후' && hour < 12) {
      hour += 12;
    }
    if (meridiem === '오전' && hour === 12) {
      hour = 0;
    }
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      hour,
      Number(minute)
    ).getTime();
  }
  const match = cleaned.match(/(\d{4})[- ](\d{2})[- ](\d{2})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).getTime();
  }
  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const getMessageTime = (message: ConversationMessage) => {
  const time = parsePostedAt(message.postedAt);
  if (time === null) return null;
  const hasMeridiem = /오전|오후/.test(message.postedAt);
  if (!hasMeridiem) {
    return time + 9 * 60 * 60 * 1000;
  }
  return time;
};

export const sortMessages = (messages: ConversationMessage[]) =>
  [...messages]
    .map((message, index) => ({ message, index }))
    .sort((a, b) => {
      const timeA = getMessageTime(a.message);
      const timeB = getMessageTime(b.message);
      if (timeA !== null && timeB === null) return -1;
      if (timeA === null && timeB !== null) return 1;
      if (timeA !== null && timeB !== null && timeA !== timeB) {
        return timeA - timeB;
      }
      return a.index - b.index;
    })
    .map(({ message }) => message);

export const formatQuizTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remain.toString().padStart(2, '0')}`;
};

export const formatDateLabel = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}. ${month}. ${day}.`;
};

export const formatDuration = (seconds: number) => {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remain = clamped % 60;
  return `${minutes}m ${remain}s`;
};

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isHtmlLike = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input);

export const markdownToHtml = (markdown: string) => {
  if (!markdown) return '';
  if (isHtmlLike(markdown)) {
    return markdown;
  }
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push('');
      return;
    }
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = escapeHtml(headingMatch[2]);
      blocks.push(`<h${level}>${content}</h${level}>`);
      return;
    }
    blocks.push(`<p>${escapeHtml(line)}</p>`);
  });
  return blocks.filter((block) => block !== '').join('');
};

export const extractNoteContent = (response: unknown) => {
  if (!response) return '';
  if (typeof response === 'string') return response;
  if (typeof response === 'object') {
    const data = response as { content?: string; note?: string; markdown?: string };
    return data.note ?? data.content ?? data.markdown ?? '';
  }
  return '';
};
