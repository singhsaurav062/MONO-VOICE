(() => {
  let selectedBlob = null;
  let recorder = null;
  let stream = null;
  let chunks = [];
  let seconds = 0;
  let timer = null;
  let linkCreated = false;
  const $ = (id) => document.getElementById(id);
  const toast = (message) => { const el = $('toast'); el.textContent = message; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 2600); };
  const sizeLabel = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  function setMessage(blob, label) {
    selectedBlob = blob;
    linkCreated = false;
    $('file-name').textContent = `${label} · ${sizeLabel(blob.size)}`;
    $('record-title').textContent = 'Your voice note is ready';
    $('record-caption').textContent = 'Record again or create your private link.';
    $('record-clock').textContent = '';
    $('create-link').disabled = false;
    $('link-result').hidden = true;
  }
  $('audio-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast('Please choose an audio file.'); event.target.value = ''; return; }
    if (file.size > 4 * 1024 * 1024) { toast('That file is over 4 MB.'); event.target.value = ''; return; }
    setMessage(file, file.name);
  });
  function getDriveFileId(value) {
    let url;
    try { url = new URL(value); } catch { return null; }
    if (!['drive.google.com', 'docs.google.com'].includes(url.hostname)) return null;
    const pathMatch = url.pathname.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([^/]+)/i);
    const id = pathMatch?.[1] || url.searchParams.get('id');
    return id && /^[A-Za-z0-9_-]{10,}$/.test(id) ? id : null;
  }
  $('drive-url').addEventListener('input', () => {
    $('create-drive-link').disabled = !getDriveFileId($('drive-url').value.trim());
    $('link-result').hidden = true;
  });
  $('create-drive-link').addEventListener('click', () => {
    const id = getDriveFileId($('drive-url').value.trim());
    if (!id) { toast('Paste a valid Google Drive file sharing link.'); return; }
    const url = new URL('listen.html', location.href);
    url.hash = new URLSearchParams({ drive: id }).toString();
    $('share-link').value = url.href;
    $('open-link').href = url.href;
    $('link-result').querySelector('.result-heading strong').textContent = 'Your Drive listening page is ready';
    $('link-result').querySelector('.result-heading small').textContent = 'The audio remains in Google Drive and can be replayed there.';
    $('link-result').hidden = false;
    $('link-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('record-button').addEventListener('click', async () => {
    if (recorder?.state === 'recording') { recorder.stop(); clearInterval(timer); $('record-button').classList.remove('recording'); $('record-title').textContent = 'Finishing your recording…'; return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast('Recording is unavailable here. Choose an audio file instead.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size) setMessage(blob, 'Recorded voice note');
      };
      recorder.start();
      seconds = 0;
      $('create-link').disabled = true;
      $('record-button').classList.add('recording');
      $('record-title').textContent = 'Tap again when you’re done';
      $('record-caption').textContent = 'Recording stays on this device.';
      timer = setInterval(() => {
        seconds += 1;
        $('record-clock').textContent = `● ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        if (seconds >= 120 && recorder?.state === 'recording') $('record-button').click();
      }, 1000);
    } catch {
      toast('Microphone access was blocked. Choose an audio file instead.');
    }
  });
  $('create-link').addEventListener('click', async () => {
    if (!selectedBlob || linkCreated) return;
    if (location.protocol === 'file:') {
      toast('Open this page through localhost or the live HTTPS site so both pages can access the recording.');
      return;
    }
    const button = $('create-link');
    button.disabled = true;
    button.textContent = 'Uploading privately…';
    try {
      const expiryHours = Number($('expiry').value);
      const { id } = await HushStore.save(selectedBlob, expiryHours);
      const url = new URL('listen.html', location.href);
      url.hash = new URLSearchParams({ id }).toString();
      $('share-link').value = url.href;
      $('open-link').href = url.href;
      $('link-result').querySelector('.result-heading strong').textContent = 'Your link is ready';
      $('link-result').querySelector('.result-heading small').textContent = 'Anyone with this link can listen once.';
      $('link-result').hidden = false;
      linkCreated = true;
      $('link-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      toast(error.message || 'Could not upload the recording. Please try again.');
    } finally {
      button.disabled = linkCreated || !selectedBlob;
      button.innerHTML = linkCreated ? 'Link created' : 'Create a private link <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  });
  $('copy-link').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('share-link').value); toast('Link copied.'); }
    catch { $('share-link').select(); document.execCommand('copy'); toast('Link copied.'); }
  });
})();
