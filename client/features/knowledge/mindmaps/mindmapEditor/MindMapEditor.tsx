import { MindMap } from '~/types/knowledge';
import { InnerMindMapEditor } from './InnerMindMapEditor';
import { ReactFlowProvider } from 'reactflow';

interface MindMapEditorProps {
  mindmap: MindMap;
  onSave: (updatedMindmap: MindMap) => void;
  readOnly?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export function MindMapEditor(props: MindMapEditorProps) {
  return (
    <ReactFlowProvider>
      <InnerMindMapEditor {...props} />
    </ReactFlowProvider>
  );
}
