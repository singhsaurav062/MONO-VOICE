import { randomBytes } from 'node:crypto';
import { del, get, put } from '@vercel/blob';

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const VALID_EXPIRY_HOURS = new Set([1, 24, 168]);
const TOKEN_PATTERN = /^([a-z0-9]{8,9})\.([A-Za-z0-9_-]{32})$/i;
const PREFIX = 'voice-notes/';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function storageReady() {
  return Boolean(process.env.BLOB_STORE_ID);
}

function parseId(id) {
  if (typeof id !== 'string') return null;
  const match = TOKEN_PATTERN.exec(id);
  if (!match) return null;
  const expiresAt = Number.parseInt(match[1], 36);
  if (!Number.isSafeInteger(expiresAt)) return null;
  return { expiresAt, pathname: `${PREFIX}${id}` };
}

async function deleteIfUnchanged(blob) {
  await del(blob.blob.pathname, {
    access: 'private',
    ifMatch: blob.blob.etag,
  });
}

export async function POST(request) {
  if (!storageReady()) {
    return json({
      message: 'Private Vercel Blob storage is not connected to this project yet.',
    }, 503);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ message: 'Could not read the uploaded audio.' }, 400);
  }

  const audio = form.get('audio');
  const expiresInHours = Number(form.get('expiresInHours'));
  if (!audio || typeof audio.arrayBuffer !== 'function' || typeof audio.size !== 'number') {
    return json({ message: 'Choose an audio recording to upload.' }, 400);
  }
  if (!audio.type?.startsWith('audio/')) {
    return json({ message: 'Please upload an audio file.' }, 415);
  }
  if (audio.size === 0) {
    return json({ message: 'The selected audio file is empty.' }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return json({ message: 'Audio files must be 4 MB or smaller.' }, 413);
  }
  if (!VALID_EXPIRY_HOURS.has(expiresInHours)) {
    return json({ message: 'Choose a valid link expiry.' }, 400);
  }

  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const id = `${expiresAt.toString(36)}.${randomBytes(24).toString('base64url')}`;
  try {
    await put(`${PREFIX}${id}`, audio, {
      access: 'private',
      addRandomSuffix: false,
      contentType: audio.type,
      cacheControlMaxAge: 60,
    });
    return json({ id, expiresAt });
  } catch (error) {
    console.error('Voice note upload failed:', error?.message || 'unknown error');
    return json({ message: 'The audio could not be saved. Check the private Blob storage setup and try again.' }, 502);
  }
}

export async function DELETE(request) {
  if (!storageReady()) {
    return json({
      message: 'Private Vercel Blob storage is not connected to this project yet.',
    }, 503);
  }

  const id = new URL(request.url).searchParams.get('id');
  const parsed = parseId(id);
  if (!parsed) return json({ message: 'This recording is unavailable.' }, 404);

  let blob;
  try {
    blob = await get(parsed.pathname, { access: 'private' });
  } catch (error) {
    console.error('Voice note lookup failed:', error?.message || 'unknown error');
    return json({ message: 'Could not reach the private audio storage. Try again.' }, 502);
  }
  if (!blob || blob.statusCode !== 200) {
    return json({ message: 'This recording has already been played or removed.' }, 410);
  }

  if (Date.now() >= parsed.expiresAt) {
    try { await deleteIfUnchanged(blob); } catch { /* Expired links stay unavailable even if cleanup loses a race. */ }
    return json({ message: 'This recording link has expired.' }, 410);
  }

  // Read the small file before deleting it, then use its ETag as an atomic one-use claim.
  let audioBytes;
  try {
    audioBytes = await new Response(blob.stream).arrayBuffer();
    await deleteIfUnchanged(blob);
  } catch (error) {
    if (error?.name === 'BlobPreconditionFailedError' || error?.status === 412 || error?.statusCode === 412) {
      return json({ message: 'This recording has already been played or opened.' }, 410);
    }
    console.error('Voice note claim failed:', error?.message || 'unknown error');
    return json({ message: 'Could not open the recording. Try again if it has not been used.' }, 502);
  }

  return new Response(audioBytes, {
    headers: {
      'Content-Type': blob.blob.contentType || 'application/octet-stream',
      'Content-Length': String(audioBytes.byteLength),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
