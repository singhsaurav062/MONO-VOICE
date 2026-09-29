(() => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.hash.slice(1));
  const noteId = params.get('id');
  const driveId = params.get('drive');
  const modal = $('warning-modal');
  const toast = (message) => { const el = $('toast'); el.textContent = message; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 2600); };
  let audio = null;
  let audioUrl = null;
  let consumed = false;
  function showUnavailable() {
    $('recipient-icon').innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const openedFromFile = location.protocol === 'file:';
    $('recipient-kicker').textContent = openedFromFile ? 'Local preview limitation' : 'This note is no longer available';
    $('recipient-title').innerHTML = openedFromFile ? 'Open this demo<br>through a website.' : 'This recording<br>has disappeared.';
    $('recipient-description').textContent = openedFromFile
      ? 'Browsers isolate storage for local files. Use localhost or the live HTTPS site to test both pages together.'
      : 'It may have expired, already been played, or been created in a different browser.';
    $('open-recording').hidden = true;
    $('recipient-foot').textContent = openedFromFile
      ? 'Open index.html from a localhost or HTTPS address.'
      : 'One listen means one listen. This note can’t be opened again.';
  }
  if (driveId && /^[A-Za-z0-9_-]{10,}$/.test(driveId) && location.protocol !== 'file:') {
    $('recipient-kicker').textContent = 'Shared from Google Drive';
    $('recipient-description').textContent = 'Confirm below to open the audio player. The original file stays in Drive.';
    $('recipient-foot').textContent = 'Anyone with the Drive link may listen again or download the file.';
    document.querySelector('.recipient-shell .footer span:last-child').textContent = 'DRIVE LINK · REPLAYABLE';
    $('warning-title').textContent = 'This recording stays on Drive.';
    $('warning-copy').textContent = 'Hush cannot tell when playback ends, delete the Drive file, or prevent another listen. Anyone with access to the Drive link may replay it.';
    $('confirm-listen').textContent = 'Show Google Drive player';
  } else if (!noteId || location.protocol === 'file:') showUnavailable();
  $('open-recording').addEventListener('click', () => { if (!consumed) modal.hidden = false; });
  $('cancel-listen').addEventListener('click', () => { modal.hidden = true; $('open-recording').focus(); });
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; });
  $('confirm-listen').addEventListener('click', async () => {
    if (driveId && /^[A-Za-z0-9_-]{10,}$/.test(driveId) && location.protocol !== 'file:') {
      modal.hidden = true;
      $('recipient-kicker').textContent = 'Shared from Google Drive';
      $('recipient-title').textContent = 'Your recording is ready.';
      $('recipient-description').textContent = 'Use the player below to listen.';
      $('open-recording').hidden = true;
      $('drive-frame').src = `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview`;
      $('drive-open-link').href = `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/view`;
      $('drive-player').hidden = false;
      return;
    }
    if (consumed || !noteId) return;
    consumed = true;
    modal.hidden = true;
    $('confirm-listen').disabled = true;
    try {
      const blob = await HushStore.take(noteId);
      if (!blob) { showUnavailable(); return; }
      audioUrl = URL.createObjectURL(blob);
      audio = new Audio(audioUrl);
      $('recipient-kicker').textContent = 'Your one-time listen';
      $('recipient-title').textContent = 'Take it in.';
      $('recipient-description').textContent = 'The recording is ready. You can pause and continue, but it can’t be replayed.';
      $('open-recording').hidden = true;
      $('player').hidden = false;
      $('recipient-card').classList.add('is-playing');
      audio.addEventListener('timeupdate', () => {
        const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        $('audio-time').textContent = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(Math.floor(current % 60)).padStart(2, '0')}`;
        $('track-progress').style.width = `${duration ? Math.min(100, current / duration * 100) : 0}%`;
      });
      audio.addEventListener('play', () => { $('play-state').textContent = 'Playing now'; $('play-pause').setAttribute('aria-label', 'Pause recording'); $('play-icon').innerHTML = '<path d="M4.5 3.5h2.7v9H4.5zm4.3 0h2.7v9H8.8z"/>'; });
      audio.addEventListener('pause', () => { if (!audio.ended) { $('play-state').textContent = 'Paused'; $('play-pause').setAttribute('aria-label', 'Continue recording'); $('play-icon').innerHTML = '<path d="M5 3.7c0-.7.8-1.1 1.4-.7l6 4.3a.9.9 0 0 1 0 1.4l-6 4.3c-.6.4-1.4 0-1.4-.7V3.7Z"/>'; } });
      audio.addEventListener('ended', () => {
        $('recipient-card').classList.remove('is-playing');
        $('play-state').textContent = 'Self-destructed';
        $('play-pause').disabled = true;
        $('play-pause').setAttribute('aria-label', 'Recording deleted');
        $('play-pause').innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        $('recipient-kicker').textContent = 'That was your one listen';
        $('recipient-title').textContent = 'Gone, just like that.';
        $('recipient-description').textContent = 'The recording has been deleted from this browser. It can’t be played again.';
        $('recipient-foot').textContent = 'This voice note has self-destructed.';
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = null;
      });
      audio.addEventListener('error', () => toast('This browser could not play the recording format. The one-time link has been used.'));
      try { await audio.play(); }
      catch { $('play-state').textContent = 'Tap to start your listen'; $('play-pause').setAttribute('aria-label', 'Play recording'); toast('Tap the play button to begin your one listen.'); }
    } catch (error) {
      if (error.status === 404 || error.status === 410) {
        showUnavailable();
      } else {
        consumed = false;
        $('confirm-listen').disabled = false;
        $('recipient-kicker').textContent = 'The recording could not be opened';
        $('recipient-title').textContent = 'Let’s try that again.';
        $('recipient-description').textContent = error.message || 'Check the connection and try again.';
        $('open-recording').hidden = false;
        $('open-recording').textContent = 'Try again';
      }
      toast(error.message || 'This recording could not be opened.');
    }
  });
  $('play-pause').addEventListener('click', async () => {
    if (!audio || audio.ended) return;
    try { if (audio.paused) await audio.play(); else audio.pause(); }
    catch { toast('This recording could not be played.'); }
  });
  window.addEventListener('pagehide', () => { if (audio) audio.pause(); if (audioUrl) URL.revokeObjectURL(audioUrl); });
})();
