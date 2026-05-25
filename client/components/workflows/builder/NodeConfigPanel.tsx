"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Node } from "@xyflow/react";
import { AgentNodeData, LLMConfig, HTTPConfig, TransformConfig } from "@/lib/types";

type NodeConfigPanelProps = {
  node: Node<AgentNodeData>;
  onClose: () => void;
  onSave: (nodeId: string, config: AgentNodeData) => void;
};

const NodeConfigPanel = ({ node, onClose, onSave }: NodeConfigPanelProps) => {
  const type = node.data.type;

  // LLM state
  const [promptTemplate, setPromptTemplate] = useState(
    (node.data.config as LLMConfig)?.promptTemplate ?? "",
  );

  const [model, setModel] = useState(
    (node.data.config as LLMConfig)?.model ?? "llama-3.3-70b-versatile",
  );

  const [maxTokens, setMaxTokens] = useState(
    (node.data.config as LLMConfig)?.maxTokens ?? 1000,
  );

  const [temperature, setTemperature] = useState(
    (node.data.config as LLMConfig)?.temperature ?? 0.7,
  );

  // HTTP state
  const [url, setUrl] = useState((node.data.config as HTTPConfig)?.url ?? "");

  const [method, setMethod] = useState<HTTPConfig["method"]>(
    (node.data.config as HTTPConfig)?.method ?? "GET",
  );

  const [headers, setHeaders] = useState(
    JSON.stringify((node.data.config as HTTPConfig)?.headers ?? {}, null, 2),
  );

  const [body, setBody] = useState(
    JSON.stringify((node.data.config as HTTPConfig)?.body ?? {}, null, 2),
  );

  // Transform state
  const [description, setDescription] = useState(
    (node.data.config as TransformConfig)?.description ?? "",
  );

  // Shared state
  const [critical, setCritical] = useState(node.data.critical ?? true);

  const handleSave = () => {
    let config: AgentNodeData["config"];

    if (type === "LLM_AGENT") {
      config = {
        promptTemplate,
        model,
        maxTokens,
        temperature,
      };
    } else if (type === "HTTP_AGENT") {
      config = {
        url,
        method,
        headers: headers.trim() ? JSON.parse(headers) : {},
        body:
          method === "POST" || method === "PUT"
            ? body.trim()
              ? JSON.parse(body)
              : {}
            : undefined,
      };
    } else {
      config = { description };
    }

    onSave(node.id, {
      ...node.data,
      config,
      critical,
    });
  };

  return (
    <aside className="fixed right-0 top-16 z-40 h-[calc(100vh-4rem)] w-[320px] border-l border-border bg-sidebar/90 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Configure Node</h2>

          <p className="mt-1 text-sm text-muted-foreground">{node.data.label}</p>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="mt-8 flex max-h-[calc(100vh-16rem)] flex-col gap-5 overflow-y-auto">
        {/* LLM */}
        {type === "LLM_AGENT" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt Template</label>

              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                className="min-h-35 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-white/20"
                placeholder="Write your prompt using {{variable}} placeholders..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>

              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                placeholder="llama-3.3-70b-versatile"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>

                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>

                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                  placeholder="0.7"
                />
              </div>
            </div>
          </>
        )}

        {/* HTTP */}
        {type === "HTTP_AGENT" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
                placeholder="https://api.example.com/users/{{userId}}"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>

              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HTTPConfig["method"])}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Headers (JSON)</label>

              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm outline-none"
                placeholder={`{\n  "Authorization": "Bearer {{token}}"\n}`}
              />
            </div>

            {(method === "POST" || method === "PUT") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Body (JSON)</label>

                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-40 w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm outline-none"
                  placeholder={`{\n  "email": "{{email}}",\n  "name": "{{name}}"\n}`}
                />
              </div>
            )}
          </>
        )}

        {/* TRANSFORM */}
        {type === "TRANSFORM_AGENT" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Transformation Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-40 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none"
              placeholder="Describe the transformation logic..."
            />
          </div>
        )}

        {/* Critical toggle */}
        <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <input
            type="checkbox"
            checked={critical}
            onChange={(e) => setCritical(e.target.checked)}
          />

          <div>
            <p className="text-sm font-medium">Critical Node</p>

            <p className="text-xs text-muted-foreground">
              Fail entire workflow if this node fails
            </p>
          </div>
        </label>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <button
          onClick={handleSave}
          className="w-full rounded-xl border border-border bg-card-foreground px-4 py-3 text-sm font-medium text-background transition-all duration-300 hover:scale-[1.02] hover:bg-white"
        >
          Save Configuration
        </button>
      </div>
    </aside>
  );
};

export default NodeConfigPanel;
