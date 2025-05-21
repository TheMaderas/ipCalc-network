import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { isValidIP, ipToBinary } from '../utils/ipUtils';

interface IpFormProps {
  onCalculate: (ip: string, cidr: number) => void;
}

const IpForm: React.FC<IpFormProps> = ({ onCalculate }) => {
  const { t } = useTranslation();
  const [ip, setIp] = useState('');
  const [cidr, setCidr] = useState(24);
  const [ipError, setIpError] = useState('');
  const [binaryIp, setBinaryIp] = useState('');

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIp(value);
    if (value && !isValidIP(value)) {
      setIpError((t as any)('validation.invalidIp'));
      setBinaryIp('');
    } else if (value) {
      setIpError('');
      setBinaryIp(ipToBinary(value));
    } else {
      setIpError('');
      setBinaryIp('');
    }
  };

  const handleCidrChange = (e: SelectChangeEvent<number>) => {
    setCidr(Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ip) {
      setIpError((t as any)('validation.ipRequired'));
      return;
    }
    
    if (!isValidIP(ip)) {
      setIpError((t as any)('validation.enterValidIp'));
      return;
    }
    
    onCalculate(ip, cidr);
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {(t as any)('title')}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={(t as any)('ipAddress')}
                variant="outlined"
                value={ip}
                onChange={handleIpChange}
                error={!!ipError}
                helperText={ipError || (binaryIp && `${(t as any)('results.binarySubnetMask')}: ${binaryIp}`)}
                placeholder="192.168.1.1"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="cidr-select-label">
                  {(t as any)('subnetMask')}
                </InputLabel>
                <Select
                  labelId="cidr-select-label"
                  id="cidr-select"
                  value={cidr}
                  onChange={handleCidrChange}
                  label={(t as any)('subnetMask')}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => (
                    <MenuItem key={num} value={num}>
                      /{num} ({cidrToSubnetMaskString(num)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CalculateIcon />}
                fullWidth
              >
                {(t as any)('calculate')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// Função auxiliar para converter CIDR em string de máscara
function cidrToSubnetMaskString(cidr: number): string {
  const mask = ~(0xffffffff >>> cidr) >>> 0;
  return [
    (mask >>> 24) & 255,
    (mask >>> 16) & 255,
    (mask >>> 8) & 255,
    mask & 255,
  ].join('.');
}

export default IpForm;
