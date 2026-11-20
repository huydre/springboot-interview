import { useEffect, useState } from "react";
import { useAuth, displayName } from "../auth/use-auth";
import { supabase } from "../lib/supabase";
import { syncProgress } from "../lib/cloud-progress";
import { AuthDialog } from "./auth-dialog";
import { Avatar } from "./ui/avatar";

/** Header control: sign-in button, or the account menu. Also pulls cloud progress once per sign-in. */
export function AccountButton() {
  const { user, ready, enabled } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `interviewlab.synced.${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    syncProgress(user.id).then((changed) => { if (changed) location.reload(); });
  }, [user]);

  if (!enabled || !ready) return null;
  if (!user) {
    return (
      <>
        <button className="btn primary account-in" onClick={() => setOpen(true)}>Đăng nhập</button>
        <AuthDialog open={open} onClose={() => setOpen(false)} />
      </>
    );
  }
  const name = displayName(user);
  return (
    <div className="account">
      <button className="icon-btn account-avatar" aria-label={`Tài khoản ${name}`} aria-expanded={menu} onClick={() => setMenu((v) => !v)}><Avatar seed={user.id} size={40} title={name} /></button>
      {menu && (
        <div className="account-menu" onMouseLeave={() => setMenu(false)}>
          <strong>{name}</strong>
          <small>{user.email}</small>
          <button className="btn" onClick={async () => { await supabase?.auth.signOut(); sessionStorage.clear(); location.reload(); }}>Đăng xuất</button>
        </div>
      )}
    </div>
  );
}
