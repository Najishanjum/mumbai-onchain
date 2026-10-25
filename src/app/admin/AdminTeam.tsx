import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { PersonAvatar } from '../../components/PersonAvatar';
import type { AdminRole } from '../../lib/useAdmin';
import { AdminHeading, ErrorLine, btn, notifyAdmins } from './shared';

interface Member {
  userId: string;
  role: AdminRole;
  name: string;
  avatar: string;
  handle: string;
}

interface Found {
  ownerId: string;
  name: string;
  avatar: string;
  handle: string;
}

const handleOf = (x: string | null) => (x ?? '').replace(/^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i, '').replace(/^@/, '');

/** Who the admins are. Owners add admins by searching people, and remove them. */
export function AdminTeam({ role }: { role: AdminRole }) {
  const { authUser } = usePeopleStore();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const isOwner = role === 'owner';

  const load = useCallback(async () => {
    const { data: admins, error: e } = await supabase.from('app_admins').select('user_id, role, created_at').order('created_at');
    if (e || !admins) {
      setError('Couldn’t load the team. Check your connection.');
      setMembers([]);
      return;
    }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('owner_id, name, avatar, x_handle')
      .in(
        'owner_id',
        admins.map((a) => a.user_id)
      );
    const byOwner = new Map((profiles ?? []).map((p) => [p.owner_id, p]));
    setMembers(
      admins.map((a) => {
        const p = byOwner.get(a.user_id);
        return { userId: a.user_id, role: a.role as AdminRole, name: p?.name ?? 'No profile yet', avatar: p?.avatar ?? '', handle: handleOf(p?.x_handle ?? '') };
      })
    );
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // People with an account, by name or X handle.
  useEffect(() => {
    const q = query.trim().replace(/[%,()]/g, '');
    if (q.length < 2) {
      setFound([]);
      return;
    }
    let live = true;
    const t = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('owner_id, name, avatar, x_handle')
        .not('owner_id', 'is', null)
        .or(`name.ilike.%${q}%,x_handle.ilike.%${q}%`)
        .limit(8);
      if (live) setFound((data ?? []).map((p) => ({ ownerId: p.owner_id as string, name: p.name, avatar: p.avatar ?? '', handle: handleOf(p.x_handle) })));
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [query]);

  async function add(person: Found) {
    if (!authUser) return;
    setBusy(person.ownerId);
    setError('');
    const { error: e } = await supabase.from('app_admins').insert({ user_id: person.ownerId, role: 'admin', added_by: authUser.id });
    setBusy(null);
    if (e) return setError(e.code === '23505' ? `${person.name} is already an admin.` : `Couldn’t add ${person.name}. Try again.`);
    setQuery('');
    notifyAdmins('admin_added', person.name);
    void load();
  }

  async function remove(m: Member) {
    setBusy(m.userId);
    const { error: e } = await supabase.from('app_admins').delete().eq('user_id', m.userId);
    setBusy(null);
    setConfirmRemove(null);
    if (e) return setError(`Couldn’t remove ${m.name}. Try again.`);
    notifyAdmins('admin_removed', m.name);
    void load();
  }

  const adminIds = new Set(members?.map((m) => m.userId));

  return (
    <div>
      <AdminHeading page="team" title="Team" detail={isOwner ? 'Admins can review places, take down stories and send notifications.' : 'Only an owner can add or remove admins.'} />
      <ErrorLine text={error} />

      {isOwner && (
        <div className="mx-4 mb-5">
          <label htmlFor="team-search" className="sr-only">
            Find someone to make admin
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--app-faint)]" aria-hidden="true" />
            <input
              id="team-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Add an admin: search name or X handle"
              autoComplete="off"
              className="w-full h-12 pl-11 pr-4 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]"
            />
          </div>
          {found.length > 0 && (
            <ul className="mt-2 rounded-2xl overflow-hidden bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)]">
              {found.map((p) => (
                <li key={p.ownerId} className="flex items-center gap-3 px-3 py-2.5">
                  <PersonAvatar name={p.name} avatarUrl={p.avatar} size="sm" className="rounded-full! border-0! w-9! h-9!" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold truncate">{p.name}</span>
                    {p.handle && <span className="block text-[13px] text-[var(--app-muted)] truncate">@{p.handle}</span>}
                  </span>
                  {adminIds.has(p.ownerId) ? (
                    <span className="text-[13px] text-[var(--app-muted)]">Admin</span>
                  ) : (
                    <button type="button" className={`${btn.primary} h-9!`} disabled={busy === p.ownerId} onClick={() => add(p)}>
                      Make admin
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {members === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading the team" />
        </div>
      ) : (
        <ul className="mx-4 rounded-2xl overflow-hidden bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)]">
          {members.map((m) => (
            <li key={m.userId} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <PersonAvatar name={m.name} avatarUrl={m.avatar} size="sm" className="rounded-full! border-0! w-10! h-10!" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold truncate">
                    {m.name}
                    {m.userId === authUser?.id ? ' (you)' : ''}
                  </span>
                  <span className="block text-[13px] text-[var(--app-muted)] truncate">
                    {m.role === 'owner' ? 'Owner' : 'Admin'}
                    {m.handle ? ` · @${m.handle}` : ''}
                  </span>
                </span>
                {isOwner && m.role !== 'owner' && confirmRemove !== m.userId && (
                  <button type="button" className={`${btn.plain} h-9!`} onClick={() => setConfirmRemove(m.userId)}>
                    Remove
                  </button>
                )}
              </div>
              {confirmRemove === m.userId && (
                <div className="mt-3 flex items-center gap-2">
                  <p className="flex-1 text-[14px] text-[var(--app-muted)]">Remove {m.name} as admin?</p>
                  <button type="button" className={`${btn.plain} h-9!`} onClick={() => setConfirmRemove(null)}>
                    Cancel
                  </button>
                  <button type="button" className={`${btn.danger} h-9!`} disabled={busy === m.userId} onClick={() => remove(m)}>
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
