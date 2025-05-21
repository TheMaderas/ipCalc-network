import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Box,
  Tooltip,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { IPResult } from '../utils/ipUtils';
import CollapsibleSection from './CollapsibleSection';

interface ResultCardProps {
  result: IPResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const { t } = useTranslation();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  const ResultItem = ({ label, value }: { label: string; value: string | number }) => (
    <Grid container spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <Grid item xs={7} sm={5}>
        <Typography variant="subtitle1" color="text.secondary">
          {(t as any)(label)}:
        </Typography>
      </Grid>
      <Grid item xs={4} sm={6}>
        <Typography 
          variant="body1" 
          fontFamily="monospace"
          sx={{ 
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </Typography>
      </Grid>
      <Grid item xs={1}>
        {typeof value === 'string' && (
          <Tooltip title={(t as any)('copy')}>
            <IconButton
              size="small"
              onClick={() => copyToClipboard(value)}
              aria-label={(t as any)('copy')}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
  
  return (
    <Card elevation={3} sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {(t as any)('results.networkAddress')}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <ResultItem 
            label="results.networkAddress" 
            value={`${result.networkAddress}/${result.cidr}`} 
          />
          <ResultItem 
            label="results.broadcastAddress" 
            value={result.broadcastAddress} 
          />
          <ResultItem 
            label="results.firstValidHost" 
            value={result.firstValidHost} 
          />
          <ResultItem 
            label="results.lastValidHost" 
            value={result.lastValidHost} 
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ResultItem 
              label="results.totalHosts" 
              value={result.totalHosts.toLocaleString()} 
            />
            <ResultItem 
              label="results.usableHosts" 
              value={result.usableHosts.toLocaleString()} 
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <ResultItem 
              label="results.subnetBits" 
              value={result.subnetBits} 
            />
            <ResultItem 
              label="results.hostBits" 
              value={result.hostBits} 
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <CollapsibleSection
          title={(t as any)('results.binaryRepresentation')}
          defaultExpanded={false}
          elevation={0}
          marginTop={0}
        >
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {(t as any)('results.binarySubnetMask')}:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={11}>
                  <Typography 
                    variant="body1" 
                    fontFamily="monospace" 
                    sx={{ 
                      wordBreak: 'break-word',
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      p: 1,
                      borderRadius: 1,
                      color: 'text.primary'
                    }}
                  >
                    {result.binarySubnetMask}
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Tooltip title={(t as any)('copy')}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(result.binarySubnetMask)}
                      aria-label={(t as any)('copy')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {(t as any)('results.wildcardMask')}:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={11}>
                  <Typography 
                    variant="body1" 
                    fontFamily="monospace" 
                    sx={{ 
                      wordBreak: 'break-word',
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      p: 1,
                      borderRadius: 1,
                      color: 'text.primary'
                    }}
                  >
                    {result.wildcardMask}
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Tooltip title={(t as any)('copy')}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(result.wildcardMask)}
                      aria-label={(t as any)('copy')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
