import { nodeForeground } from "~/utils/knowledge/nodeAppearance";
import { Handle, Position } from 'reactflow';
import {CSSProperties} from "react";

interface TextNodeProps {
  data: {
    label: string;
    color?: string;
    shape?: 'rectangle' | 'ellipse' | 'diamond';
  };
  isConnectable: boolean;
  selected?: boolean;
}

export function TextNode({ data, isConnectable, selected }: TextNodeProps) {
  let shapeStyles: CSSProperties = {};

  switch (data.shape) {
    case 'ellipse':
      shapeStyles = { borderRadius: '50%' };
      break;
    case 'diamond':
      shapeStyles = { transform: 'rotate(45deg)' };
      break;
    default:
      shapeStyles = { borderRadius: '4px' };
  }

  return (
      <div
          className="px-4 py-2 shadow-md border border-gray-200 transition-all relative"
          style={{
            background: data.color || 'white',
            color: nodeForeground(data.color || '#ffffff'),
            boxShadow: selected ? '0 0 0 3px hsl(var(--primary)), 0 0 0 5px hsl(var(--background))' : undefined,
            minWidth: '100px',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...shapeStyles,
          }}
      >
        <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-2 h-2 bg-primary/80 border border-background rounded-full"
        />
        <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-2 h-2 bg-primary/80 border border-background rounded-full"
        />
        <Handle
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            className="w-2 h-2 bg-primary/80 border border-background rounded-full"
        />
        <Handle
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="w-2 h-2 bg-primary/80 border border-background rounded-full"
        />
        <div
            className="font-medium text-center max-w-[240px] break-words"
            style={data.shape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}}
        >
          {data.label}
        </div>
      </div>
  );
}
