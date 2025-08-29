'use client';

import * as React from 'react';
import { DataGrid, type GridColDef, type GridRowSelectionModel, type GridState } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  onRowSelectionModelChange?: (selectionModel: GridRowSelectionModel) => void;
  selectionModel?: GridRowSelectionModel;
  tableId: string; // Unique ID for storing state
}

export function DataTable({ columns, rows, onRowSelectionModelChange, selectionModel, tableId }: DataTableProps) {
  const paginationModel = { page: 0, pageSize: 10 };
  const localStorageKey = `data-grid-state-${tableId}`;

  const [initialState, setInitialState] = React.useState<any | undefined>(undefined);

  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem(localStorageKey);
      if (savedState) {
        setInitialState(JSON.parse(savedState));
      } else {
        // Set a default state if nothing is saved
        setInitialState({
          pagination: {
            paginationModel: paginationModel,
          },
        });
      }
    } catch (error) {
      console.error("Failed to parse saved grid state:", error);
      setInitialState({ // Fallback state
        pagination: {
          paginationModel: paginationModel,
        },
      });
    }
  }, [localStorageKey]);

  const handleStateChange = (newState: GridState) => {
    try {
      // Be more selective about what to save to avoid exceeding localStorage quota.
      // Only save the user-configured parts of the column state.
      const stateToSave = {
        columns: {
          columnVisibilityModel: newState.columns.columnVisibilityModel,
          orderedFields: newState.columns.orderedFields,
        },
        sorting: newState.sorting,
        filter: newState.filter,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save grid state:", error);
    }
  };

  if (initialState === undefined) {
    // Render a placeholder or nothing until the initial state is loaded from localStorage
    return null;
  }

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
        initialState={initialState}
        onStateChange={handleStateChange}
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
