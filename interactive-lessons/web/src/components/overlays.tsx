import { Toaster } from "./ui/toaster";
import { AuthDialog } from "./auth-dialog";
import { CommandSearch } from "./command-search";

/** Page-wide layers (toasts, the sign-in dialog and the ⌘K search), mounted once in main.tsx next to the page. */
export function Overlays() {
  return (
    <>
      <AuthDialog />
      <Toaster />
      <CommandSearch />
    </>
  );
}
