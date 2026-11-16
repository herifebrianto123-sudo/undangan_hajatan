import { clearDriveAccessToken, getDriveAccessToken } from '../firebase';

export interface DriveMediaItem {
  id: string;
  name: string;
  mimeType: string;
  imageUrl: string;
  videoViewUrl: string;
  audioUrl: string;
  createdTime?: string;
}

const STUDIO_FOLDER_NAME = 'Undangan Studio Media';
let cachedFolderId: string | null = null;

function requireToken(): string {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error(
      'Sesi penyimpanan media belum aktif. Klik "Aktifkan Penyimpanan Media" terlebih dahulu.'
    );
  }
  return token;
}

async function driveFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });

  if (res.status === 401) {
    clearDriveAccessToken();
    cachedFolderId = null;
    throw new Error(
      'Sesi penyimpanan media telah berakhir. Silakan klik "Aktifkan Penyimpanan Media" lagi.'
    );
  }

  return res;
}

export function buildDrivePublicImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
}

export function buildDriveVideoViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function buildDriveAudioUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export async function findOrCreateStudioFolder(
  accessToken: string
): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  const query = encodeURIComponent(
    `name='${STUDIO_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=5`,
    accessToken
  );
  if (!searchRes.ok) {
    throw new Error('Gagal memeriksa folder penyimpanan media.');
  }

  const searchJson = (await searchRes.json()) as {
    files?: { id: string; name: string }[];
  };
  if (searchJson.files && searchJson.files.length > 0) {
    cachedFolderId = searchJson.files[0].id;
    return cachedFolderId;
  }

  const createRes = await driveFetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: STUDIO_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
  if (!createRes.ok) {
    throw new Error('Gagal menyiapkan folder penyimpanan media.');
  }
  const created = (await createRes.json()) as { id: string };
  cachedFolderId = created.id;
  return created.id;
}

async function makeFilePublicReader(
  accessToken: string,
  fileId: string
): Promise<void> {
  const permRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );
  if (!permRes.ok) {
    throw new Error(
      'File terunggah, namun gagal mengatur izin akses publik untuk tamu.'
    );
  }
}

export async function uploadMediaToDrive(
  file: File,
  customNamePrefix?: string
): Promise<DriveMediaItem> {
  const accessToken = requireToken();
  const folderId = await findOrCreateStudioFolder(accessToken);

  const safeFileName = customNamePrefix
    ? `${customNamePrefix}-${file.name}`
    : file.name;

  const metadata = {
    name: safeFileName,
    parents: [folderId],
    mimeType: file.type || 'application/octet-stream',
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  const uploadRes = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime',
    accessToken,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal mengunggah media: ${errText}`);
  }

  const uploaded = (await uploadRes.json()) as {
    id: string;
    name: string;
    mimeType: string;
    createdTime?: string;
  };

  await makeFilePublicReader(accessToken, uploaded.id);

  return {
    id: uploaded.id,
    name: uploaded.name,
    mimeType: uploaded.mimeType,
    imageUrl: buildDrivePublicImageUrl(uploaded.id),
    videoViewUrl: buildDriveVideoViewUrl(uploaded.id),
    audioUrl: buildDriveAudioUrl(uploaded.id),
    createdTime: uploaded.createdTime,
  };
}

export async function listStudioDriveFiles(): Promise<DriveMediaItem[]> {
  const accessToken = requireToken();
  const folderId = await findOrCreateStudioFolder(accessToken);

  const q = encodeURIComponent(
    `'${folderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`
  );
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,mimeType,createdTime)`,
    accessToken
  );
  if (!res.ok) {
    throw new Error('Gagal mengambil daftar koleksi media.');
  }

  const data = (await res.json()) as {
    files?: {
      id: string;
      name: string;
      mimeType: string;
      createdTime?: string;
    }[];
  };

  return (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    imageUrl: buildDrivePublicImageUrl(f.id),
    videoViewUrl: buildDriveVideoViewUrl(f.id),
    audioUrl: buildDriveAudioUrl(f.id),
    createdTime: f.createdTime,
  }));
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const accessToken = requireToken();
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    accessToken,
    {
      method: 'DELETE',
    }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error('Gagal menghapus file dari penyimpanan media.');
  }
}
