import { FORMATS, MAX_TAG_LENGTH, PostLayout, PostOptions, type HeadlinePosition } from './post';

export interface StudioDraft extends PostOptions {
  photoSource: 'example' | 'upload';
  photoName: string;
}

const KEY = 'vn-studio-draft-v1';

export const DEFAULT_DRAFT: StudioDraft = {
  format: 'retrato',
  layout: 'foto',
  tag: 'URGENTE',
  headline: 'SUA MANCHETE AQUI',
  headlinePosition: null,
  subline: '',
  photoSource: 'example',
  photoName: '',
};

function savedPosition(value: unknown): HeadlinePosition | null {
  if (!value || typeof value !== 'object') return null;
  const position = value as Partial<HeadlinePosition>;
  if (typeof position.x !== 'number' || !Number.isFinite(position.x) || typeof position.y !== 'number' || !Number.isFinite(position.y)) return null;
  return { x: Math.max(0, Math.min(100, position.x)), y: Math.max(0, Math.min(100, position.y)) };
}

export function loadDraft(): StudioDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_DRAFT };
    const saved = JSON.parse(raw) as Partial<StudioDraft>;
    return {
      format: saved.format && Object.prototype.hasOwnProperty.call(FORMATS, saved.format) ? saved.format : DEFAULT_DRAFT.format,
      layout: (['destaque', 'foto'] as PostLayout[]).includes(saved.layout as PostLayout) ? saved.layout! : DEFAULT_DRAFT.layout,
      tag: typeof saved.tag === 'string' ? saved.tag.slice(0, MAX_TAG_LENGTH) : DEFAULT_DRAFT.tag,
      headline: typeof saved.headline === 'string' ? saved.headline.slice(0, 90) : DEFAULT_DRAFT.headline,
      headlinePosition: savedPosition(saved.headlinePosition),
      subline: typeof saved.subline === 'string' ? saved.subline.slice(0, 60) : '',
      photoSource: saved.photoSource === 'upload' ? 'upload' : 'example',
      photoName: typeof saved.photoName === 'string' ? saved.photoName.slice(0, 120) : '',
    };
  } catch {
    return { ...DEFAULT_DRAFT };
  }
}

export function saveDraft(draft: StudioDraft): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vn-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Armazenamento ocupado'));
  });
}

async function loadDraftImage(key: 'current' | 'logo'): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', 'readonly');
    const request = transaction.objectStore('images').get(key);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

async function saveDraftImage(key: 'current' | 'logo', image: Blob | null): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
    if (image) store.put(image, key);
    else store.delete(key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}

export const loadDraftPhoto = () => loadDraftImage('current');
export const saveDraftPhoto = (photo: Blob | null) => saveDraftImage('current', photo);
export const loadDraftLogo = () => loadDraftImage('logo');
export const saveDraftLogo = (logo: Blob | null) => saveDraftImage('logo', logo);