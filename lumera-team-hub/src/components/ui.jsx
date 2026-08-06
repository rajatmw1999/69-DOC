import { useEffect } from 'react';
import { initials, avatarGradient, ROLE_LABEL } from '../lib/util';
import { IcX } from './Icons';

export function Avatar({ profile, size = 'md', style }) {
  const cls = `avatar avatar-${size}`;
  if (profile?.avatar_url) {
    return (
      <span className={cls} style={style}>
        <img src={profile.avatar_url} alt={profile.name || ''} />
      </span>
    );
  }
  return (
    <span className={cls} style={{ background: avatarGradient(profile?.id || ''), ...style }}>
      {initials(profile?.name || profile?.email || '?')}
    </span>
  );
}

export function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{ROLE_LABEL[role] || role}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <span style={{ display: 'inline-flex', width: 18, height: 18 }}><IcX /></span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, sub, children }) {
  return (
    <div className="empty-state">
      <div className="es-orb" />
      <div className="es-title">{title}</div>
      {sub && <div className="es-sub">{sub}</div>}
      {children}
    </div>
  );
}

export function Spinner({ fill }) {
  if (fill) {
    return <div className="center-fill"><div className="spinner" /></div>;
  }
  return <div className="spinner" />;
}

export function NebulaBg() {
  return (
    <div className="nebula-bg">
      <div className="nebula-stars" />
    </div>
  );
}
