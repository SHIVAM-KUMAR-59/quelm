import {
  Activity,
  BrainCircuit,
  GitBranch,
  Server,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Workflow,
    title: "Visual Workflow Builder",
    description:
      "Compose distributed AI workflows visually with drag-and-drop nodes and dependency graphs.",
  },
  {
    icon: BrainCircuit,
    title: "Modular AI Agents",
    description:
      "Plug in LLM, HTTP, Transform, and custom agents without touching orchestration logic.",
  },
  {
    icon: Activity,
    title: "Live Run Monitoring",
    description:
      "Watch every workflow execute in real time with live node status updates and streaming events.",
  },
  {
    icon: Server,
    title: "Distributed Workers",
    description:
      "Scale horizontally with independent worker processes powered by BullMQ and Redis.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic Retries",
    description:
      "Built-in exponential backoff, dead-letter queues, and fault-tolerant execution.",
  },
  {
    icon: GitBranch,
    title: "Dependency Resolution",
    description:
      "Parallel execution, sequential chains, and fan-out flows handled automatically.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-xs font-medium text-zinc-300">
            <Zap className="h-3.5 w-3.5" />
            Platform Features
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
            Designed for modern AI orchestration
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Quelm combines distributed systems architecture with AI-native workflow
            tooling to provide a resilient execution platform for autonomous pipelines.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-white/5 bg-white/2 p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/3">
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="mt-8 text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
