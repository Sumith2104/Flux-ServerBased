'use client';

import * as React from 'react';
import LinearProgress, { type LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          {...props}
          sx={{
            backgroundColor: 'hsl(var(--secondary))',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'hsl(var(--primary))',
            },
            height: 8,
            borderRadius: 5,
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          sx={{ color: 'hsl(var(--muted-foreground))' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

export function DeleteProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // This timer simulates progress for a long-running operation.
    // It starts fast and slows down as it approaches 90%.
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          return 90;
        }
        // The increment decreases as the progress increases, creating a slowing effect.
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 90);
      });
    }, 500); // Update every 500ms for a smoother feel

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgressWithLabel value={progress} />
    </Box>
  );
}
