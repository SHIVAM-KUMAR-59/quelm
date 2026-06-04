import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

const Cta = () => {
  return (
    <section className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="rounded-[36px] border border-white/10 bg-white/3 px-8 py-20 backdrop-blur-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/4">
            <Bot className="h-9 w-9 text-white" />
          </div>

          <h2 className="mt-8 text-4xl font-semibold tracking-tight md:text-5xl">
            Build resilient AI pipelines
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Orchestrate distributed workflows, autonomous agents, and realtime execution
            pipelines with Quelm.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.03] hover:bg-zinc-200"
            >
              Launch Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5"
            >
              Create Workflow
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
