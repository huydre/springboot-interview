import { Toaster } from "./ui/toaster";
import { AuthDialog } from "./auth-dialog";

/** Page-wide layers (toasts and the sign-in dialog), mounted once in main.tsx next to the page. */
export function Overlays() {
  return (
    <>
      <AuthDialog />
      <Toaster />
    </>
  );
}
