const STATS = [
  {
    value: "Realtime",
    label: "Workflow orchestration",
  },
  {
    value: "Distributed",
    label: "Worker architecture",
  },
  {
    value: "Fault-Tolerant",
    label: "Execution pipeline",
  },
  {
    value: "Extensible",
    label: "Agent system",
  },
];

const Stats = () => {
  return (
    <section className="relative border-y border-white/5 bg-white/2">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-14 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl"
          >
            <h3 className="text-3xl font-semibold tracking-tight">{stat.value}</h3>

            <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
