/* Local demo storage. For cross-device messages, replace this with a secure backend. */
window.HushStore = (() => {
  const DB_NAME = 'hush-one-time-notes';
  const STORE_NAME = 'notes';
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function save(id, blob, expiresAt) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ id, blob, expiresAt });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('Could not save the recording.')); };
    });
  }
  // Read and delete in one read/write transaction so a note cannot be claimed twice.
  async function take(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      let blob = null;
      request.onsuccess = () => {
        const note = request.result;
        if (!note) return;
        store.delete(id);
        if (note.expiresAt > Date.now()) blob = note.blob;
      };
      tx.oncomplete = () => { db.close(); resolve(blob); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('Could not open the recording.')); };
    });
  }
  return { save, take };
})();
