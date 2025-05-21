import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Collapsible section component for better space management
interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  elevation?: number;
  marginTop?: number | string;
  titleVariant?: 'h5' | 'h6' | 'subtitle1' | 'subtitle2';
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  elevation = 2,
  marginTop = 3,
  titleVariant = 'h6'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <Paper 
      elevation={elevation} 
      sx={{ 
        mt: marginTop, 
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          cursor: 'pointer',
          bgcolor: 'background.default',
          borderBottom: isExpanded ? 1 : 0,
          borderColor: 'divider'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Typography variant={titleVariant} component="div">
          {title}
        </Typography>
        <IconButton size="small" sx={{ ml: 1 }}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Box
        sx={{
          maxHeight: isExpanded ? '2000px' : 0,
          opacity: isExpanded ? 1 : 0,
          transition: 'all 0.3s ease',
          p: isExpanded ? 2 : 0,
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export default CollapsibleSection;
