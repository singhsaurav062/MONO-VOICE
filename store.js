(() => {
  async function readResponse(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function save(blob, expiresInHours) {
    const form = new FormData();
    form.append('audio', blob, 'voice-note');
    form.append('expiresInHours', String(expiresInHours));
    return readResponse(await fetch('/api/messages', {
      method: 'POST',
      body: form,
      cache: 'no-store',
    }));
  }

  async function take(id) {
    const url = new URL('/api/messages', location.origin);
    url.searchParams.set('id', id);
    const response = await fetch(url, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body.message || `This recording is unavailable (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return response.blob();
  }

  window.HushStore = { save, take };
})();
