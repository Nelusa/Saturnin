import { useState, useEffect, useCallback, useRef, useMemo, MouseEvent } from 'react';
import FlowCanvas, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  MiniMap,
  Background,
  Panel,
  MarkerType,
  Node,
  Edge,
  Connection,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { serializeMindMap, downloadBlob, exportFilename } from '~/utils/knowledge/mindmapTransfer';
import { renderMindMapSvg, rasterizeMindMap } from '~/utils/knowledge/mindmapImage';
import { MindMap, MindMapNode as MindMapNodeType, MindMapConnection } from '~/types/knowledge';
import { TextNode } from './TextNode';
import { EdgeCreationDialog } from './EdgeCreationDialog';
import { MindMapToolbar } from './MindMapToolbar';
import { NodePanel } from './NodePanel';
import { EdgePanel } from './EdgePanel';
import { NODE_COLORS } from '~/lib/constants';
import { useToast } from '~/hooks/use-toast';

// TODO (NL): Implementovat historii změn (undo/redo)
interface InnerMindMapEditorProps {
  mindmap: MindMap;
  onSave: (updatedMindmap: MindMap) => void;
  readOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

type TextNodeData = {
  label: string;
  color: string;
  shape: 'rectangle' | 'ellipse' | 'diamond';
};

const nodeTypes = { textNode: TextNode };

export function InnerMindMapEditor({
                                     mindmap,
                                     onSave,
                                     onDirtyChange,
                                     readOnly = false
                                   }: InnerMindMapEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<TextNodeData> | null>(null);
  const { toast } = useToast();

  const initialNodes = useMemo(() => mindmap.nodes.map((n: MindMapNodeType) => ({
    id: n.id,
    type: 'textNode',
    position: { x: n.x, y: n.y },
    data: { label: n.text, color: n.color, shape: n.shape || 'rectangle' }
  })), [mindmap.nodes]);
  const initialEdges = useMemo(() => mindmap.connections.map((c: MindMapConnection) => ({
    id: c.id,
    source: c.sourceId,
    target: c.targetId,
    label: c.label || '',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: {
      strokeWidth: c.thickness || 1,
      stroke: c.color || '#555',
      strokeDasharray:
          c.style === 'dashed' ? '5 5'
              : c.style === 'dotted' ? '2 2'
                  : undefined
    }
  })), [mindmap.connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [newNodeName, setNewNodeName] = useState('');
  const [isEditingNodeName, setIsEditingNodeName] = useState(false);

  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [shapePopoverOpen, setShapePopoverOpen] = useState(false);

  useEffect(() => { onDirtyChange?.(hasUnsavedChanges); }, [hasUnsavedChanges, onDirtyChange]);

  const canConnect = nodes.length > 1 && !readOnly;

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHasUnsavedChanges(false);
  }, [mindmap.id, initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (selectedEdge) {
      const updated = edges.find(e => e.id === selectedEdge.id);
      if (updated) setSelectedEdge(updated);
    }
  }, [edges, selectedEdge]);

  const [isExporting, setIsExporting] = useState(false);
  const graphSnapshot = () => ({
    ...mindmap,
    nodes: nodes.map(n => ({ ...mindmap.nodes.find(previous => previous.id === n.id), id: n.id, text: n.data.label, x: n.position.x, y: n.position.y, color: n.data.color, shape: n.data.shape })),
    connections: edges.map(e => ({
      ...mindmap.connections.find(previous => previous.id === e.id),
      id: e.id, sourceId: e.source, targetId: e.target, label: typeof e.label === 'string' ? e.label : '',
      style: (e.style?.strokeDasharray === '5 5' ? 'dashed' : e.style?.strokeDasharray === '2 2' ? 'dotted' : 'solid') as 'solid' | 'dashed' | 'dotted',
      color: e.style?.stroke?.toString() || '#555555', thickness: Number(e.style?.strokeWidth) || 1
    })),
    nodeCount: nodes.length,
    isPublic: false
  });
  const handleExport = async (format: 'png' | 'json' | 'svg') => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const snapshot = graphSnapshot();
      let blob: Blob;
      if (format === 'json') blob = new Blob([serializeMindMap(snapshot)], { type: 'application/json;charset=utf-8' });
      else {
        const image = renderMindMapSvg(snapshot);
        blob = format === 'svg' ? new Blob([image.svg], { type: 'image/svg+xml;charset=utf-8' }) : await rasterizeMindMap(image);
      }
      downloadBlob(blob, exportFilename(mindmap.title, format));
      toast({ title: 'Export připraven', description: `Soubor ${format.toUpperCase()} byl předán prohlížeči ke stažení. Obsahuje i neuložené změny.` });
    } catch (cause) {
      toast({ title: 'Export se nepodařil', description: cause instanceof Error ? cause.message : 'Zkuste jiný formát.', variant: 'destructive' });
    } finally { setIsExporting(false); }
  };

  const onAddNode = useCallback(() => {
    if (!nodeName.trim() || !reactFlowInstance) return;
    const pos = reactFlowInstance.screenToFlowPosition({
      x: reactFlowWrapper.current!.getBoundingClientRect().left + reactFlowWrapper.current!.clientWidth / 2,
      y: reactFlowWrapper.current!.getBoundingClientRect().top + reactFlowWrapper.current!.clientHeight / 2
    });
    const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
    const newNode: Node<TextNodeData> = {
      id: `node-${crypto.randomUUID()}`,
      type: 'textNode',
      position: pos,
      data: {
        label: nodeName.trim(),
        color,
        shape: 'rectangle'
      }
    };
    setNodes(nds => nds.concat(newNode));
    setNodeName('');
    setIsCreatingNode(false);
    setHasUnsavedChanges(true);
  }, [nodeName, reactFlowInstance, setNodes]);

  const onConnect = useCallback((params: Connection) => {
    setPendingConnection(params);
    setIsEdgeDialogOpen(true);
  }, []);

  const handleConfirmEdgeCreation = useCallback((label: string, style: string, color: string) => {
    if (!pendingConnection) return;
    let dash: string | undefined;
    if (style === 'dashed') dash = '5 5';
    if (style === 'dotted') dash = '2 2';
    setEdges(eds =>
        addEdge({
          ...pendingConnection,
          id: `edge-${crypto.randomUUID()}`,
          label,
          markerEnd: { type: MarkerType.ArrowClosed },
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 1, strokeDasharray: dash },
          animated: false
        }, eds)
    );
    setPendingConnection(null);
    setIsEdgeDialogOpen(false);
    setHasUnsavedChanges(true);
  }, [pendingConnection, setEdges]);

  const updateEdge = useCallback((edgeId: string, patch: Partial<Pick<Edge, "style" | "label">>) => {
    setEdges(eds =>
        eds.map(edge => {
          if (edge.id === edgeId) {
            if (patch.style) {
              const cur = { ...edge.style };
              delete cur.strokeDasharray;
              return { ...edge, ...patch, style: { ...cur, ...patch.style } };
            }
            return { ...edge, ...patch };
          }
          return edge;
        })
    );
    setHasUnsavedChanges(true);
  }, [setEdges]);

  const handleSave = () => {
    try {
    onSave({ ...graphSnapshot(), updatedAt: new Date().toISOString() });
    setHasUnsavedChanges(false);
    toast({ title: "Mapa uložena", description: "Změny zůstanou v tomto prohlížeči." });
    } catch (error) {
      toast({ title: "Mapu se nepodařilo uložit", description: error instanceof Error ? error.message : "Změny jsou stále otevřené. Zkuste mapu exportovat.", variant: "destructive" });
    }
  };

  const handleNodeClick = useCallback((_: MouseEvent, node: Node) => {
    if (readOnly) return;
    setSelectedEdge(null);
    setColorPopoverOpen(false);
    setShapePopoverOpen(false);
    setSelectedNode(node);
    setNewNodeName(node.data.label);
  }, [readOnly]);

  const handleSelectionChange = useCallback(({ nodes: selection }: { nodes: Node[] }) => {
    const node = selection[0];
    if (readOnly || !node || selectedNode?.id === node.id) return;
    setSelectedNode(node);
    setSelectedEdge(null);
    setNewNodeName(node.data.label);
  }, [readOnly, selectedNode?.id]);

  useEffect(() => {
    if (selectedNode) {
      const current = nodes.find(node => node.id === selectedNode.id);
      if (current !== selectedNode) setSelectedNode(current ?? null);
    }
  }, [nodes, selectedNode]);

  const handleEdgeClick = useCallback((e: MouseEvent, edge: Edge) => {
    if (readOnly) return;
    e.stopPropagation();
    setSelectedNode(null);
    setSelectedEdge(edge);
  }, [readOnly]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id));
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setHasUnsavedChanges(true);
  }, [selectedNode, setNodes, setEdges]);

  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges(es => es.filter(e => e.id !== selectedEdge.id));
    setSelectedEdge(null);
    setHasUnsavedChanges(true);
  }, [selectedEdge, setEdges]);

  const handleStartEditNodeName = useCallback(() => {
    if (!selectedNode) return;
    setIsEditingNodeName(true);
  }, [selectedNode]);

  const handleFinishEditNodeName = useCallback(() => {
    if (!selectedNode) return;
    setNodes(ns =>
        ns.map(n =>
            n.id === selectedNode.id
                ? { ...n, data: { ...n.data, label: newNodeName || n.data.label } }
                : n
        )
    );
    setIsEditingNodeName(false);
    setHasUnsavedChanges(true);
  }, [selectedNode, newNodeName, setNodes]);

  const handleCancelEditNodeName = useCallback(() => {
    setIsEditingNodeName(false);
  }, []);

  useEffect(() => {
    function onClickOutside(e: globalThis.MouseEvent) {
      const targetEl = e.target as HTMLElement;

      const colorPop = document.querySelector<HTMLElement>('[data-color-popover]');
      const shapePop = document.querySelector<HTMLElement>('[data-shape-popover]');

      if (colorPopoverOpen && colorPop && !colorPop.contains(targetEl)) {
        setColorPopoverOpen(false);
      }
      if (shapePopoverOpen && shapePop && !shapePop.contains(targetEl)) {
        setShapePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [colorPopoverOpen, shapePopoverOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setColorPopoverOpen(false);
        setShapePopoverOpen(false);
        setIsEditingNodeName(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {!readOnly && <MindMapToolbar
        isCreatingNode={isCreatingNode}
        nodeName={nodeName}
        onNodeNameChange={setNodeName}
        onAddNode={onAddNode}
        onCancelCreate={() => { setIsCreatingNode(!isCreatingNode); setNodeName(''); }}
        isConnecting={isConnecting}
        canConnect={canConnect}
        onToggleConnect={() => setIsConnecting(!isConnecting)}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onExport={handleExport}
        isExporting={isExporting}
      />}

      <div ref={reactFlowWrapper} className="flex-1 relative">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={changes => { onNodesChange(changes); if (changes.some(change => change.type !== "select" && change.type !== "dimensions")) setHasUnsavedChanges(true); }}
          onEdgesChange={changes => { onEdgesChange(changes); if (changes.some(change => change.type !== "select")) setHasUnsavedChanges(true); }}
          onConnect={canConnect ? onConnect : undefined}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView
          attributionPosition="bottom-left"
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed }
          }}
          proOptions={{ hideAttribution: true }}
          selectNodesOnDrag={false}
          zoomOnDoubleClick={!readOnly}
          zoomOnScroll={!readOnly}
          panOnScroll={!readOnly}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly && isConnecting}
          elementsSelectable={!readOnly}
          connectOnClick={isConnecting}
        >
          <Controls />
          <MiniMap />
          <Background gap={16} size={1} />
          {isConnecting && (
            <Panel position="bottom-center" className="bg-background/80 p-2 rounded-md shadow-md z-10 text-sm">
              Klikni na zdrojový uzel a poté na cílový uzel pro vytvoření spojení
            </Panel>
          )}
        </FlowCanvas>
      </div>

      {selectedNode && !readOnly && (
            <NodePanel
                selectedNode={selectedNode}
                newNodeName={newNodeName}
                onNewNameChange={setNewNodeName}
                editingNodeName={isEditingNodeName}
                onStartEdit={handleStartEditNodeName}
                onFinishEdit={handleFinishEditNodeName}
                onCancelEdit={handleCancelEditNodeName}
                colorPopoverOpen={colorPopoverOpen}
                onToggleColor={() => { setColorPopoverOpen(v => !v); setShapePopoverOpen(false); }}
                onChangeColor={color => {
                  setNodes(ns => ns.map(n =>
                      n.id === selectedNode.id ? { ...n, data: { ...n.data, color } } : n
                  ));
                  setHasUnsavedChanges(true);
                  setColorPopoverOpen(false);
                }}
                shapePopoverOpen={shapePopoverOpen}
                onToggleShape={() => { setShapePopoverOpen(v => !v); setColorPopoverOpen(false); }}
                onChangeShape={shape => {
                  setNodes(ns => ns.map(n =>
                      n.id === selectedNode.id ? { ...n, data: { ...n.data, shape } } : n
                  ));
                  setHasUnsavedChanges(true);
                  setShapePopoverOpen(false);
                }}
                onDeleteNode={handleDeleteNode}
            />
        )}

        {selectedEdge && !readOnly && (
            <EdgePanel
                selectedEdge={selectedEdge}
                updateEdge={updateEdge}
                onDeleteEdge={handleDeleteEdge}
            />
        )}

        <EdgeCreationDialog
            isOpen={isEdgeDialogOpen}
            onClose={() => { setIsEdgeDialogOpen(false); setPendingConnection(null); }}
            onConfirm={handleConfirmEdgeCreation}
        />
    </div>
  );
}
