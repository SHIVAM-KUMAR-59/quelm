import {
  BrainCircuit,
  Globe,
  Shuffle,
  Bot,
  Bell,
  Database,
  Activity,
  Cpu,
} from "lucide-react";
import React from "react";

export const AGENT_META: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    accent: string;
  }
> = {
  LLM_AGENT: {
    icon: BrainCircuit,
    label: "LLM Agent",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  HTTP_AGENT: {
    icon: Globe,
    label: "HTTP Agent",
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  TRANSFORM_AGENT: {
    icon: Shuffle,
    label: "Transform Agent",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  EXTRACTION_AGENT: {
    icon: Bot,
    label: "Extraction Agent",
    accent: "from-orange-500/20 to-amber-500/10",
  },
  NOTIFICATION_AGENT: {
    icon: Bell,
    label: "Notification Agent",
    accent: "from-pink-500/20 to-rose-500/10",
  },
  STORAGE_AGENT: {
    icon: Database,
    label: "Storage Agent",
    accent: "from-lime-500/20 to-green-500/10",
  },
};

export const AGENT_LABELS: Record<string, string> = {
  LLM_AGENT: "LLM Node",
  HTTP_AGENT: "HTTP Node",
  TRANSFORM_AGENT: "Transform Node",
  EXTRACTION_AGENT: "Extraction Node",
  NOTIFICATION_AGENT: "Notification Node",
  STORAGE_AGENT: "Storage Node",
};

export const AGENT_ICONS: Record<string, React.ElementType> = {
  LLM_AGENT: BrainCircuit,
  HTTP_AGENT: Activity,
  TRANSFORM_AGENT: Cpu,
};
