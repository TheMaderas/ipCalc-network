import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { Subnet } from '../utils/ipUtils';

interface SubnetGeneratorProps {
  ip: string;
  cidr: number;
  onGenerateSubnets: (count: number) => void;
  subnets: Subnet[];
}

const SubnetGenerator: React.FC<SubnetGeneratorProps> = ({
  ip,
  cidr,
  onGenerateSubnets,
  subnets,
}) => {
  const { t } = useTranslation();
  const [subnetCount, setSubnetCount] = useState('2');
  const [error, setError] = useState('');
  
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSubnetCount(value);
    
    const count = parseInt(value, 10);
    if (isNaN(count) || count < 2) {
      setError((t as any)('validation.minimum', { value: 2 }));
    } else if (count > 1024) {
      setError((t as any)('validation.maximum', { value: 1024 }));
    } else {
      setError('');
    }
  };
  
  const handleGenerate = () => {
    const count = parseInt(subnetCount, 10);
    if (!isNaN(count) && count >= 2 && count <= 1024) {
      onGenerateSubnets(count);
    }
  };
  
  return (
    <Card elevation={3} sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {(t as any)('subnetting.title')}
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={(t as any)('subnetting.subnetCount')}
              type="number"
              value={subnetCount}
              onChange={handleCountChange}
              error={!!error}
              helperText={error}
              inputProps={{
                min: 2,
                max: 1024,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AccountTreeIcon />}
              onClick={handleGenerate}
              disabled={!!error || !ip}
              fullWidth
            >
              {(t as any)('subnetting.generate')}
            </Button>
          </Grid>
        </Grid>
        
        {subnets.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {(t as any)('subnetting.subnetList')}
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{(t as any)('subnetting.subnet')}</TableCell>
                    <TableCell>{(t as any)('subnetting.range')}</TableCell>
                    <TableCell>{(t as any)('subnetting.usable')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subnets.map((subnet) => (
                    <TableRow key={subnet.id}>
                      <TableCell>{subnet.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {subnet.networkAddress}/{subnet.cidr}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {subnet.firstHost} - {subnet.lastHost}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {subnet.usableHosts.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SubnetGenerator;
