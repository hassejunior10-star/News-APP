import { GC_MAX_NAME, GC_MAX_ROLE, type GcContent } from './gc';

export interface GcDraft extends GcContent {
  logoSource: 'default' | 'upload';
  logoName: string;
}

const KEY = 'vn-gc-draft-v1';

export const DEFAULT_GC_DRAFT: GcDraft = { name: '', role: '', logoSource: 'default', logoName: '' };

export function loadGcDraft(): GcDraft {
  try {
    const current = localStorage.getItem(KEY);
    const legacy = localStorage.getItem('vn-studio-draft-v1');
    const raw = current || legacy;
    if (!raw) return { ...DEFAULT_GC_DRAFT };
    const value = JSON.parse(raw) as Record<string, unknown>;
    const name = current ? value.name : value.interviewName;
    const role = current ? value.role : value.interviewRole;
    return {
      name: typeof name === 'string' ? name.slice(0, GC_MAX_NAME) : '',
      role: typeof role === 'string' ? role.slice(0, GC_MAX_ROLE) : '',
      logoSource: value.logoSource === 'upload' ? 'upload' : 'default',
      logoName: typeof value.logoName === 'string' ? value.logoName.slice(0, 120) : '',
    };
  } catch {
    return { ...DEFAULT_GC_DRAFT };
  }
}

export function saveGcDraft(draft: GcDraft): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}