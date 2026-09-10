import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { IcDownload, IcLock, IcTrash, IcUpload } from '../components/Icons';
import { FOLDERS, canAccessFolder, fileKind, fmtBytes, timeAgo } from '../lib/util';

export default function Documents() {
  const { profile, team, teamById } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState(null);
  const [folder, setFolder] = useState('all');
  const [q, setQ] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const versionInput = useRef(null);
  const versionTarget = useRef(null);

  const myFolders = FOLDERS.filter((f) => canAccessFolder(f.id, profile.role));

  async function load() {
    const { data, error } = await supabase.from('documents').select('*')
      .order('updated_at', { ascending: false });
    if (error) toast('Couldn’t load documents: ' + error.message, 'error');
    setDocs(data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!docs) return [];
    return docs.filter((d) =>
      (folder === 'all' || d.folder === folder) &&
      (uploaderFilter === 'all' || d.uploaded_by === uploaderFilter) &&
      (!q.trim() || d.name.toLowerCase().includes(q.trim().toLowerCase()) ||
        fileKind(d.name).toLowerCase().includes(q.trim().toLowerCase())),
    );
  }, [docs, folder, q, uploaderFilter]);

  async function download(doc) {
    setBusyId(doc.id);
    const { data, error } = await supabase.storage.from('documents')
      .createSignedUrl(doc.storage_path, 120, { download: doc.name });
    setBusyId(null);
    if (error) return toast('Download failed: ' + error.message, 'error');
    window.open(data.signedUrl, '_blank');
  }

  async function remove(doc) {
    if (!window.confirm(`Delete “${doc.name}”? This can’t be undone.`)) return;
    setBusyId(doc.id);
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (!error) await supabase.storage.from('documents').remove([doc.storage_path]);
    setBusyId(null);
    if (error) return toast('Delete failed: ' + error.message, 'error');
    setDocs((l) => l.filter((d) => d.id !== doc.id));
    toast(`Deleted ${doc.name}`);
  }

  function startNewVersion(doc) {
    versionTarget.current = doc;
    versionInput.current?.click();
  }

  async function uploadNewVersion(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const doc = versionTarget.current;
    if (!file || !doc) return;
    setBusyId(doc.id);
    const path = `${doc.folder}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
    if (upErr) { setBusyId(null); return toast('Upload failed: ' + upErr.message, 'error'); }
    const { data, error } = await supabase.from('documents').update({
      storage_path: path, name: file.name, size_bytes: file.size,
      file_type: file.type || fileKind(file.name),
      version: doc.version + 1, last_edited_by: profile.id,
    }).eq('id', doc.id).select().single();
    if (error) {
      await supabase.storage.from('documents').remove([path]);
      setBusyId(null);
      return toast('Version update failed: ' + error.message, 'error');
    }
    await supabase.storage.from('documents').remove([doc.storage_path]);
    setBusyId(null);
    setDocs((l) => l.map((d) => (d.id === doc.id ? data : d)));
    toast(`${file.name} is now v${data.version}`);
  }

  const canEdit = (d) => d.uploaded_by === profile.id || profile.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <div className="sub">Shared files with folder-level access — Legal and Finance are restricted by role.</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <span style={{ width: 16, height: 16, display: 'inline-flex' }}><IcUpload /></span> Upload
          </button>
        </div>
      </div>

      <div className="folder-row">
        <button className={`folder-chip ${folder === 'all' ? 'active' : ''}`} onClick={() => setFolder('all')}>All</button>
        {FOLDERS.map((f) => {
          const ok = canAccessFolder(f.id, profile.role);
          return (
            <button key={f.id} className={`folder-chip ${folder === f.id ? 'active' : ''}`}
              disabled={!ok}
              title={ok ? '' : f.access === 'admin' ? 'Admins only' : 'Admins & team leads only'}
              style={ok ? {} : { opacity: 0.4, cursor: 'not-allowed' }}
              onClick={() => ok && setFolder(f.id)}>
              {f.label}
              {f.access !== 'everyone' && (
                <span className="lock" style={{ width: 13, height: 13, display: 'inline-flex' }}><IcLock /></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex g12 wrap mb-16">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search by name or type…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ maxWidth: 220 }} value={uploaderFilter}
          onChange={(e) => setUploaderFilter(e.target.value)}>
          <option value="all">Any uploader</option>
          {team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {docs === null ? <Spinner fill /> : filtered.length === 0 ? (
          <EmptyState title={q ? 'No documents match your search' : 'No documents here yet'}
            sub={q ? 'Try a different name, type or folder.' : 'Upload the first file — contracts, specs, decks, sheets.'} />
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Name</th><th>Folder</th><th className="hide-mobile">Size</th>
                <th className="hide-mobile">Uploaded by</th><th className="hide-mobile">Last edited</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="doc-name">
                      <span className="doc-ico">{fileKind(d.name)}</span>
                      <div>
                        <div>{d.name}</div>
                        <div className="text-3" style={{ fontSize: 11.5, fontWeight: 500 }}>v{d.version}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{d.folder}</td>
                  <td className="hide-mobile text-2">{fmtBytes(d.size_bytes)}</td>
                  <td className="hide-mobile">
                    <span className="flex aic g8">
                      <Avatar profile={teamById[d.uploaded_by]} size="sm" />
                      <span className="text-2">{teamById[d.uploaded_by]?.name || '—'}</span>
                    </span>
                  </td>
                  <td className="hide-mobile text-3">
                    {timeAgo(d.updated_at)}{d.last_edited_by && d.last_edited_by !== d.uploaded_by
                      ? ` · ${teamById[d.last_edited_by]?.name || ''}` : ''}
                  </td>
                  <td>
                    <div className="flex g8" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" disabled={busyId === d.id} onClick={() => download(d)} title="Download">
                        <span style={{ width: 14, height: 14, display: 'inline-flex' }}><IcDownload /></span>
                      </button>
                      {canEdit(d) && (
                        <>
                          <button className="btn btn-ghost btn-sm" disabled={busyId === d.id}
                            onClick={() => startNewVersion(d)} title="Upload new version">
                            <span style={{ width: 14, height: 14, display: 'inline-flex' }}><IcUpload /></span>
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={busyId === d.id}
                            onClick={() => remove(d)} title="Delete">
                            <span style={{ width: 14, height: 14, display: 'inline-flex' }}><IcTrash /></span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <input type="file" hidden ref={versionInput} onChange={uploadNewVersion} />

      {showUpload && (
        <UploadModal folders={myFolders} defaultFolder={folder !== 'all' ? folder : 'general'}
          onClose={() => setShowUpload(false)}
          onDone={(row) => { setShowUpload(false); setDocs((l) => [row, ...(l || [])]); toast(`Uploaded ${row.name}`); }} />
      )}
    </div>
  );
}

function UploadModal({ folders, defaultFolder, onClose, onDone }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [folder, setFolder] = useState(
    folders.some((f) => f.id === defaultFolder) ? defaultFolder : 'general');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast('Max file size is 50 MB.', 'error');
    setBusy(true);
    const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
    if (upErr) { setBusy(false); return toast('Upload failed: ' + upErr.message, 'error'); }
    const { data, error } = await supabase.from('documents').insert({
      name: file.name, folder, storage_path: path,
      file_type: file.type || fileKind(file.name), size_bytes: file.size,
      uploaded_by: profile.id, last_edited_by: profile.id,
    }).select().single();
    setBusy(false);
    if (error) {
      await supabase.storage.from('documents').remove([path]);
      return toast('Couldn’t save metadata: ' + error.message, 'error');
    }
    onDone(data);
  }

  return (
    <Modal title="Upload a document" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Folder</label>
          <select className="select" value={folder} onChange={(e) => setFolder(e.target.value)}>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>File (max 50 MB)</label>
          <input className="input" type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        {file && <div className="text-3 small mb-8">{file.name} · {fmtBytes(file.size)}</div>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</button>
        </div>
      </form>
    </Modal>
  );
}
