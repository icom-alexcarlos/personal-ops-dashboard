import { BottomNav } from "./bottom-nav";
import { MicButton } from "./mic-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <MicButton />
      <BottomNav />
    </div>
  );
}
