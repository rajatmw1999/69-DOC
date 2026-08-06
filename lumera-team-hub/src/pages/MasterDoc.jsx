import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useToast } from '../context/AuthContext';
import { Modal, Spinner } from '../components/ui';
import { fmtBytes, timeAgo, isAdminRole } from '../lib/util';

export default function MasterDoc() {
  const { profile, teamById } = useAuth();
  const toast = useToast();
  const [doc, setDoc] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [editing, setEditing] = useState(false);

  const isAdmin = isAdminRole(profile.role);

  async function load() {
    const { data, error } = await supabase.from('master_document').select('*').eq('id', 1).single();
    if (error) {
      toast('Couldn’t load — if you just upgraded, run migration 002 in Supabase.', 'error');
      setDoc(undefined);
      return;
    }
    setDoc(data);
    if (data.file_path) {
      const { data: s } = await supabase.storage.from('chat-files').createSignedUrl(data.file_path, 3600);
      setFileUrl(s?.signedUrl || null);
    } else {
      setFileUrl(null);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  if (doc === null) return <Spinner fill />;
  if (doc === undefined) return null;

  const isPdf = /\.pdf$/i.test(doc.file_name || '');
  const isImg = /\.(png|jpe?g|gif|webp)$/i.test(doc.file_name || '');
  const hasContent = doc.content?.trim().length > 0;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1>{doc.title}</h1>
          <div className="sub">
            The single source of truth for what Lumera is and where it’s going.
            {' '}<b style={{ color: 'var(--warning)' }}>View-only</b> — only founders/admins can change it.
            {doc.updated_by && <> · Last updated by {teamById[doc.updated_by]?.name || '—'} {timeAgo(doc.updated_at)}</>}
          </div>
        </div>
        {isAdmin && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit master doc</button>
          </div>
        )}
      </div>

      {!hasContent && !doc.file_path && (
        <div className="card card-glow card-pad" style={{ textAlign: 'center', padding: 48 }}>
          <div className="text-2">Nothing here yet.</div>
          <div className="text-3 small mt-8">
            {isAdmin ? 'Add the master document — paste the content and/or attach the PDF.'
              : 'The founders haven’t published the master document yet.'}
          </div>
        </div>
      )}

      {hasContent && (
        <div className="card card-glow card-pad mb-16" style={{ fontSize: 14.5, lineHeight: 1.7 }}>
          <div className="text-2" style={{ whiteSpace: 'pre-wrap', userSelect: isAdmin ? 'auto' : 'text' }}>
            {doc.content}
          </div>
        </div>
      )}

      {doc.file_path && (
        <div className="card card-pad">
          <div className="card-title">
            Attached document
            {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer">Open ↗</a>}
          </div>
          <div className="text-3 small mb-8">{doc.file_name}</div>
          {isPdf && fileUrl && (
            <iframe title="Master document" src={fileUrl}
              style={{ width: '100%', height: '75vh', border: '1px solid var(--border)', borderRadius: 10, background: '#fff' }} />
          )}
          {isImg && fileUrl && (
            <img src={fileUrl} alt={doc.file_name} style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
          )}
        </div>
      )}

      {editing && isAdmin && (
        <EditMaster doc={doc} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }} />
      )}
    </div>
  );
}

function EditMaster({ doc, onClose, onSaved }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    let filePath = doc.file_path;
    let fileName = doc.file_name;
    if (removeFile) { filePath = null; fileName = null; }
    if (file) {
      filePath = `master/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('chat-files').upload(filePath, file);
      if (upErr) { setBusy(false); return toast('Upload failed: ' + upErr.message, 'error'); }
      fileName = file.name;
    }
    const { error } = await supabase.from('master_document').update({
      title: title.trim() || 'Lumera Master Document',
      content, file_path: filePath, file_name: fileName,
      updated_by: profile.id, updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setBusy(false);
    if (error) return toast(error.message, 'error');
    if ((removeFile || file) && doc.file_path && doc.file_path !== filePath) {
      await supabase.storage.from('chat-files').remove([doc.file_path]);
    }
    onSaved();
  }

  return (
    <Modal title="Edit master document" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </div>
        <div className="field">
          <label>Content (shown to the whole team, read-only)</label>
          <textarea className="textarea" rows={14} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="What is Lumera? Why was it created? Mission, product, roadmap…" />
        </div>
        <div className="field">
          <label>Attach / replace file (PDF renders inline for the team)</label>
          <input className="input" type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); setRemoveFile(false); }} />
          {file && <div className="text-3 small mt-8">{file.name} · {fmtBytes(file.size)}</div>}
          {doc.file_path && !file && (
            <label className="flex aic g8 clickable mt-8" style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} />
              Remove current attachment ({doc.file_name})
            </label>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
