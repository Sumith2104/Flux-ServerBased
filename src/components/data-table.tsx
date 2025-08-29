
'use client';

import * as React from 'react';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { useEffect, useState } from 'react';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  onRowSelectionModelChange?: (selectionModel: GridRowSelectionModel) => void;
  selectionModel?: GridRowSelectionModel;
  tableId: string;
}

export function DataTable({ columns, rows, onRowSelectionModelChange, selectionModel }: DataTableProps) {
  return (
    <Paper
      sx={{
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          color: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid hsl(var(--border))', // thinner row divider
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))', // keep consistent with row divider
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 'bold',
          color: 'black',
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
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 20, 30, 40, 50, 100, 500, 1000]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={onRowSelectionModelChange}
        rowSelectionModel={selectionModel}
        autoHeight
      />
    </Paper>
  );
}
