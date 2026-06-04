import { Activity, Bot, BrainCircuit, Cpu, Play, Sparkles, Workflow } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-xs font-medium text-zinc-300 backdrop-blur-xl">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Native Workflow Orchestration
        </div>

        <h1 className="mt-8 max-w-5xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
          Build and orchestrate
          <span className="bg-linear-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            {" "}
            distributed AI workflows
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-400">
          Quelm is a distributed workflow platform where AI agents execute visually
          composed pipelines in real time with retries, orchestration, dependency
          resolution, and live observability built in.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.03] hover:bg-zinc-200"
          >
            <Play className="h-4 w-4" />
            Start Building
          </Link>

          <Link
            href="/agents"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5"
          >
            Explore Agents
          </Link>
        </div>

        {/* Hero Preview */}
        <div className="relative mt-24 w-full max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-white/3 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />

          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
            {/* Sidebar */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
                  <Workflow className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">
                    Agent Nodes
                  </h3>

                  <p className="text-xs text-zinc-500">Drag onto canvas</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  {
                    icon: BrainCircuit,
                    title: "LLM Agent",
                    description: "Prompt + reasoning",
                  },
                  {
                    icon: Activity,
                    title: "HTTP Agent",
                    description: "REST API requests",
                  },
                  {
                    icon: Cpu,
                    title: "Transform Agent",
                    description: "Shape workflow data",
                  },
                  {
                    icon: Bot,
                    title: "Webhook Agent",
                    description: "Trigger external apps",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/3 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                          <Icon className="h-4 w-4 text-white" />
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-white">{item.title}</h4>

                          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canvas */}
            <div className="relative min-h-140 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]">
              {/* subtle grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[32px_32px]" />

              {/* soft radial */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_60%)]" />

              {/* floating workflow badge */}
              <div className="absolute right-6 top-6 z-20 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                  <p className="text-xs font-medium text-emerald-300">Workflow Running</p>
                </div>

                <p className="mt-1 text-[11px] text-emerald-200/70">
                  3 active nodes • 1 completed
                </p>
              </div>

              {/* Edge SVG */}
              <svg className="absolute inset-0 z-0 h-full w-full">
                {/* Edge 1 */}
                <path
                  d="M 300 160 C 420 160, 420 260, 540 260"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 7"
                  strokeLinecap="round"
                />

                {/* Edge 2 */}
                <path
                  d="M 700 300 C 820 300, 820 410, 930 410"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="7 7"
                  strokeLinecap="round"
                />
              </svg>

              {/* Node 1 */}
              <div className="absolute left-14 top-20 z-10 w-65 rounded-3xl border border-white/10 bg-zinc-900/95 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
                      <BrainCircuit className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Research Company
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">LLM Agent</p>
                    </div>
                  </div>

                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="mt-5 rounded-2xl border border-white/5 bg-black/40 p-4">
                  <p className="text-[12px] leading-relaxed text-zinc-400">
                    Analyze company websites and generate structured business insights.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>gpt-4.1</span>
                  <span>critical</span>
                </div>

                {/* output handle */}
                <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white" />
              </div>

              {/* Node 2 */}
              <div className="absolute left-[46%] top-[38%] z-10 w-67.5 rounded-3xl border border-white/10 bg-zinc-900/95 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
                      <Cpu className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Summarize Output
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">Transform Agent</p>
                    </div>
                  </div>

                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                </div>

                <div className="mt-5 rounded-2xl border border-white/5 bg-black/40 p-4">
                  <p className="text-[12px] leading-relaxed text-zinc-400">
                    Convert raw findings into concise markdown summaries and structured
                    output.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>parallel task</span>
                  <span>retry enabled</span>
                </div>

                {/* handles */}
                <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white" />

                <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white" />
              </div>

              {/* Node 3 */}
              <div className="absolute bottom-16 right-10 z-10 w-65 rounded-3xl border border-white/10 bg-zinc-900/95 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
                      <Activity className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">Notify Slack</h3>

                      <p className="mt-1 text-xs text-zinc-500">HTTP Agent</p>
                    </div>
                  </div>

                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-500" />
                </div>

                <div className="mt-5 rounded-2xl border border-white/5 bg-black/40 p-4">
                  <p className="text-[12px] leading-relaxed text-zinc-400">
                    Send execution summaries to the engineering Slack channel.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>POST webhook</span>
                  <span>non-critical</span>
                </div>

                {/* input handle */}
                <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white" />
              </div>
            </div>

            {/* Right Panel */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-white">
                  Node Configuration
                </h3>

                <p className="mt-1 text-xs text-zinc-500">Configure selected node</p>
              </div>

              <div className="mt-8 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Prompt Template</p>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs leading-relaxed text-zinc-500">
                      Research the company website and summarize: products, funding, team
                      size, and market positioning.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Model</p>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                    <span className="text-sm text-white">GPT-4.1</span>

                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-zinc-400">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Temperature</p>

                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>0.2</span>
                      <span>Deterministic</span>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[20%] rounded-full bg-white" />
                    </div>
                  </div>
                </div>

                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-200">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
