
'use client';

import * as React from 'react';
import { DataGrid, type GridColDef, type GridRowSelectionModel, type GridPaginationModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  selectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (selectionModel: GridRowSelectionModel) => void;
}

export function DataTable({ 
  columns, 
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  selectionModel, 
  onRowSelectionModelChange,
}: DataTableProps) {
  return (
    <Paper
      sx={{
        height: '70vh', // Give the table a fixed height
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          color: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid hsl(var(--border))',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#FFF',
          borderBottom: '1px solid hsl(var(--border))',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 'bold',
          color: '#000',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiTablePagination-root': {
          color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiCheckbox-root': {
          color: 'hsl(var(--primary))',
        },
        '& .MuiCheckbox-root.Mui-checked': {
          color: 'hsl(var(--primary))',
        },
        '& .MuiDataGrid-iconButtonContainer > .MuiButtonBase-root': {
          color: 'hsl(var(--foreground))',
        },
        '& .MuiDataGrid-actionsCell .MuiIconButton-root': {
          color: 'hsl(var(--foreground))',
        },
         '& .MuiDataGrid-overlay': {
          backgroundColor: 'hsl(var(--card) / 0.8)',
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pagination
        paginationMode="server"
        rowCount={rowCount}
        loading={loading}
        pageSizeOptions={[20, 50, 100, 250, 500]}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={onRowSelectionModelChange}
        rowSelectionModel={selectionModel}
      />
    </Paper>
  );
}
