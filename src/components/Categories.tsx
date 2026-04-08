import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, FolderOpen, Quote, BookOpen, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';

type CRow = Database['public']['Tables']['categories']['Row'] & { qCount?: number; uCount?: number; };

const lbl = (t: string) => (
  <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>{t}</label>
);

const Categories: React.FC = () => {
  const [cats, setCats]       = useState<CRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CRow | null>(null);
  const [form, setForm]       = useState({ name: '', description: '' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (!data) return;
      const withCounts = await Promise.all(data.map(async c => {
        const [{ count: q }, { count: u }] = await Promise.all([
          supabase.from('quotes').select('id', { count: 'exact', head: true }).contains('category_ids', [c.id]),
          supabase.from('understanding').select('id', { count: 'exact', head: true }).contains('category_ids', [c.id]),
        ]);
        return { ...c, qCount: q || 0, uCount: u || 0 };
      }));
      setCats(withCounts);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('categories').insert(form);
      if (error) throw error;
      toast.success('Category created'); setShowAdd(false); setForm({ name: '', description: '' }); load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('categories').update({ name: editing.name, description: editing.description }).eq('id', editing.id);
      if (error) throw error;
      toast.success('Updated'); setEditing(null); load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await supabase.from('categories').delete().eq('id', id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const Modal: React.FC<{ isEdit?: boolean }> = ({ isEdit }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      role="dialog" aria-modal onClick={() => isEdit ? setEditing(null) : setShowAdd(false)}>
      <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button className="btn-icon" onClick={() => isEdit ? setEditing(null) : setShowAdd(false)} aria-label="Close"><X size={17} /></button>
        </div>
        <form onSubmit={isEdit ? handleUpdate : handleAdd} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            {lbl('Name *')}
            <input type="text" className="input-field" autoFocus required
              value={isEdit ? editing!.name : form.name}
              onChange={e => isEdit ? setEditing({ ...editing!, name: e.target.value }) : setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Philosophy, Spirituality…"
            />
          </div>
          <div>
            {lbl('Description')}
            <textarea className="input-field" rows={3} style={{ resize: 'vertical', lineHeight: 1.65, minHeight: 'unset', height: 'auto' }}
              value={isEdit ? editing!.description || '' : form.description}
              onChange={e => isEdit ? setEditing({ ...editing!, description: e.target.value }) : setForm({ ...form, description: e.target.value })}
              placeholder="Brief description…"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button type="button" className="btn-ghost" onClick={() => isEdit ? setEditing(null) : setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) return (
    <div className="page-wrap">
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    </div>
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>Categories</h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{cats.length} categor{cats.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} />Add Category</button>
      </div>

      {cats.length === 0 ? (
        <div className="wk-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: 52, height: 52, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FolderOpen size={22} color="var(--color-text-muted)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>No categories yet</h3>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>Create categories to organise your content</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} />Create first</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
          {cats.map((cat, i) => (
            <div key={cat.id} className="wk-card" style={{ padding: '1.5rem', opacity: 0, animation: `fadeUp 420ms ease ${i * 45}ms forwards` }}>
              <div style={{ width: 38, height: 38, background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                <FolderOpen size={17} color="var(--color-accent)" aria-hidden />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.3rem', letterSpacing: '-0.01em' }}>{cat.name}</h3>
              {cat.description && <p style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '0.875rem' }}>{cat.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)', marginTop: cat.description ? 0 : '0.875rem' }}>
                <div style={{ display: 'flex', gap: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <Quote size={11} aria-hidden />{cat.qCount ?? 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <BookOpen size={11} aria-hidden />{cat.uCount ?? 0}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button className="btn-icon" onClick={() => setEditing(cat)} aria-label={`Edit ${cat.name}`}><Edit3 size={13} /></button>
                  <button className="btn-icon" onClick={() => handleDelete(cat.id, cat.name)} aria-label={`Delete ${cat.name}`} style={{ color: 'var(--color-error)' }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <Modal />}
      {editing && <Modal isEdit />}
    </div>
  );
};

export default Categories;
