
'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { type Table, type Column, type Constraint } from '@/lib/data';
import { KeyRound } from 'lucide-react';

interface ErdViewProps {
  tables: Table[];
  columns: Column[];
  constraints: Constraint[];
}

const nodeWidth = 250;
const nodeHeaderHeight = 40;
const rowHeight = 28;

const CustomNode = ({ data }: { data: { name: string; columns: Column[], pks: Set<string> } }) => {
  return (
    <div className="rounded-md border-2 border-primary/50 bg-card shadow-md font-sans w-full">
      <div className="bg-primary/20 p-2 rounded-t-md">
        <p className="text-sm font-bold text-foreground">{data.name}</p>
      </div>
      <div className="p-2 space-y-1">
        {data.columns.map((col) => (
          <div key={col.column_id} className="flex items-center justify-between text-xs text-muted-foreground">
            <div className='flex items-center gap-2'>
              {data.pks.has(col.column_name) && <KeyRound className="h-3 w-3 text-yellow-500" />}
              <span className={data.pks.has(col.column_name) ? 'font-semibold text-foreground' : ''}>
                {col.column_name}
              </span>
            </div>
            <span className="font-mono text-gray-500">{col.data_type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function ErdView({ tables, columns, constraints }: ErdViewProps) {
  const { nodes, edges } = useMemo(() => {
    const tableNodes: Node[] = [];
    const tableEdges: Edge[] = [];
    const pkConstraints = new Map<string, Set<string>>();

    constraints.filter(c => c.type === 'PRIMARY KEY').forEach(c => {
        if (!pkConstraints.has(c.table_id)) {
            pkConstraints.set(c.table_id, new Set());
        }
        c.column_names.split(',').forEach(colName => {
            pkConstraints.get(c.table_id)!.add(colName);
        });
    });

    tables.forEach((table, index) => {
      const tableColumns = columns.filter((c) => c.table_id === table.table_id);
      const pks = pkConstraints.get(table.table_id) || new Set<string>();

      const nodeHeight = nodeHeaderHeight + (tableColumns.length * rowHeight) + 16;
      
      tableNodes.push({
        id: table.table_id,
        type: 'custom',
        data: { name: table.table_name, columns: tableColumns, pks },
        position: { x: (index % 4) * (nodeWidth + 100), y: Math.floor(index / 4) * 400 },
        style: { width: nodeWidth, height: nodeHeight },
      });
    });

    constraints
      .filter((c) => c.type === 'FOREIGN KEY')
      .forEach((c, index) => {
        if (c.referenced_table_id) {
            tableEdges.push({
                id: `e-${c.constraint_id}`,
                source: c.table_id,
                target: c.referenced_table_id,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: 'arrowclosed' },
                style: { stroke: '#60a5fa' }, // blue-400
          });
        }
      });

    return { nodes: tableNodes, edges: tableEdges };
  }, [tables, columns, constraints]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Background gap={16} color="hsl(var(--border))" />
      </ReactFlow>
    </div>
  );
}
