"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import type { Connection, Edge, Node } from "@xyflow/react";

import NodeConfigPanel from "@/components/workflows/builder/NodeConfigPanel";
import BuilderTopbar from "@/components/workflows/builder/BuilderTopbar";
import NodePalette from "@/components/workflows/builder/NodePalette";
import AgentNode from "@/components/workflows/builder/AgentNode";
import { useCreateWorkflow } from "@/hooks/use-workflow";
import { AgentNodeData, AgentType } from "@/lib/types";

const nodeTypes = { agentNode: AgentNode };
const AGENT_LABELS: Record<string, string> = {
  LLM_AGENT: "LLM Node",
  HTTP_AGENT: "HTTP Node",
  TRANSFORM_AGENT: "Transform Node",
  EXTRACTION_AGENT: "Extraction Node",
  NOTIFICATION_AGENT: "Notification Node",
  STORAGE_AGENT: "Storage Node",
};

let nodeCounter = 0;
const getId = () => `node_${nodeCounter++}`;

const NewWorkflowPage = () => {
  const router = useRouter();
  const { mutateAsync: createWorkflow, isPending } = useCreateWorkflow();

  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#71717a", strokeWidth: 2 },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as AgentType;
      if (!type) return;

      const position = {
        x: event.clientX - 300,
        y: event.clientY - 100,
      };

      const newNode: Node<AgentNodeData> = {
        id: getId(),
        type: "agentNode",
        position,
        data: {
          type,
          label: AGENT_LABELS[type] ?? type,
          status: "idle",
          critical: true,
          config: {} as AgentNodeData["config"],
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<AgentNodeData>) => {
    setSelectedNode(node);
  }, []);

  const handleConfigSave = useCallback(
    (nodeId: string, updatedData: AgentNodeData) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: updatedData } : n)),
      );
      setSelectedNode(null);
      toast.success("Node configuration saved");
    },
    [setNodes],
  );

  const saveWorkflow = async () => {
    try {
      // Build definition from React Flow state
      const definition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          name: node.data.label,
          critical: node.data.critical,
          config: node.data.config,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };

      await createWorkflow({
        name: workflowName,
        definition,
      });

      toast.success("Workflow saved successfully");
      router.push("/workflows");
    } catch {
      toast.error("Failed to save workflow");
    }
  };

  const canSave = useMemo(() => nodes.length > 0, [nodes]);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <BuilderTopbar
        workflowName={workflowName}
        setWorkflowName={setWorkflowName}
        canSave={canSave}
        onSave={saveWorkflow}
        isSaving={isPending}
      />

      <NodePalette />

      <div className="ml-65 mt-16 h-[calc(100vh-4rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls className="bg-card! border-border! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-accent!" />
          <MiniMap className="bg-card!" nodeColor="#3f3f46" maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
};

export default NewWorkflowPage;
