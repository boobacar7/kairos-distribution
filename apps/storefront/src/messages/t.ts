import { messages, type MessageKey } from './fr';

export type { MessageKey };

export function t(key: MessageKey, vars?: Readonly<Record<string, string | number>>): string {
  const template = messages[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
