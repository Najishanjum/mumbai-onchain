import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { thumbPathFor } from '../../lib/useSnapStore';
import { AdminHeading, EmptyState, ErrorLine, btn, notifyAdmins, timeAgo } from './shared';

interface Row {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  caption: string | null;
  event_name: string | null;
  created_at: string;
}

/** The latest stories, newest first, with Take down. */
export function AdminStories({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    supabase
      .from('snaps')
      .select('id, user_id, image_url, thumbnail_url, storage_path, caption, event_name, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(async ({ data, error: e }) => {
        if (!live) return;
        if (e || !data) {
          setError('Couldn’t load stories. Check your connection and open this tab again.');
          setRows([]);
          return;
        }
        setRows(data as Row[]);
        const ids = [...new Set(data.map((r) => r.user_id))];
        const { data: people } = await supabase.from('profiles').select('id, name').in('id', ids);
        if (live && people) setNames(Object.fromEntries(people.map((p) => [p.id, p.name])));
      });
    return () => {
      live = false;
    };
  }, []);

  async function takeDown(row: Row) {
    setBusyId(row.id);
    setError('');
    const { error: e } = await supabase.from('snaps').delete().eq('id', row.id);
    if (e) {
      setBusyId(null);
      return setError('Couldn’t take it down. Try again.');
    }
    if (row.storage_path) await supabase.storage.from('snaps').remove([row.storage_path, thumbPathFor(row.storage_path)]);
    setBusyId(null);
    setConfirmId(null);
    notifyAdmins('story_removed', `By ${names[row.user_id] ?? 'someone'}${row.caption ? `: “${row.caption}”` : ''}`);
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  return (
    <div>
      <AdminHeading title="Stories" detail="Take down anything that shouldn’t be there. It disappears for everyone." />
      <ErrorLine text={error} />
      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading stories" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No stories yet" body="Stories people post show up here, newest first." />
      ) : (
        <ul className="mx-4 grid grid-cols-2 gap-3">
          {rows.map((s) => (
            <li key={s.id} className="rounded-3xl overflow-hidden bg-[var(--app-surface)] border border-[var(--app-line)] flex flex-col">
              <img src={s.thumbnail_url || s.image_url} alt={s.caption || 'Story photo'} loading="lazy" className="w-full aspect-[3/4] object-cover bg-[var(--app-pressed)]" />
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-[14px] font-bold truncate">{names[s.user_id] ?? 'Someone'}</p>
                <p className="text-[12px] text-[var(--app-muted)] truncate">
                  {timeAgo(s.created_at)}
                  {s.event_name ? ` · ${s.event_name}` : ''}
                </p>
                {s.caption && <p className="mt-1 text-[13px] leading-snug line-clamp-2">{s.caption}</p>}
                <div className="mt-auto pt-2">
                  {confirmId === s.id ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" className={`${btn.plain} h-9! px-2!`} onClick={() => setConfirmId(null)}>
                        Keep
                      </button>
                      <button type="button" className={`${btn.danger} h-9! px-2!`} disabled={busyId === s.id} onClick={() => takeDown(s)}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button type="button" className={`${btn.plain} h-9! w-full`} onClick={() => setConfirmId(s.id)}>
                      Take down
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
