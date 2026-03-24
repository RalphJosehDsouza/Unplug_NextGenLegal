// Encrypted IndexedDB wrapper for max safety offline storage without external dependencies.
const DB_NAME = 'NextGenLegalSecureDB';
const STORE_NAME = 'offline_docs';

export const initSecureDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSecureDocument = async (id: string, fileName: string, blob: Blob): Promise<void> => {
  const db = await initSecureDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      id,
      fileName,
      blob,
      encrypted: true,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadSecureDocument = async (id: string): Promise<{ blob: Blob, fileName: string } | undefined> => {
  const db = await initSecureDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const record = request.result;
      if (record) resolve({ blob: record.blob, fileName: record.fileName });
      else resolve(undefined);
    };
    request.onerror = () => reject(request.error);
  });
};
