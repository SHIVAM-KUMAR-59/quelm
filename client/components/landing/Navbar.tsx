import { ArrowRight, Workflow } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/3">
            <Workflow className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">Quelm</h1>

            <p className="text-xs text-zinc-500">Distributed Workflow Platform</p>
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Features
          </a>

          <a
            href="#architecture"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Architecture
          </a>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-300 hover:scale-[1.03] hover:bg-zinc-200"
        >
          Open Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
