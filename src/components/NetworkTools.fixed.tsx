import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  Alert,
  Snackbar,
} from '@mui/material';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import PortableWifiOffIcon from '@mui/icons-material/PortableWifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import { 
  pingHost, 
  checkMultiplePorts, 
  calculateIpRange,
  generateIpsInSubnet,
  scanIpRange,
  PingResult, 
  PortResult, 
  commonPorts 
} from '../utils/networkUtils';
import { calculateIPInfo, isValidIP } from '../utils/ipUtils';

interface NetworkToolsProps {
  ip: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Versão simplificada do TabPanel que evita problemas com offsetHeight
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // Em vez de usar null, render um elemento oculto (display: none)
  // Isso evita que o React monte/desmonte elementos, o que pode causar problemas com offsetHeight
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`network-tabpanel-${index}`}
      aria-labelledby={`network-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Função auxiliar para acessibilidade das tabs
function a11yProps(index: number) {
  return {
    id: `network-tab-${index}`,
    'aria-controls': `network-tabpanel-${index}`,
  };
}

// Componente Tooltip modificado para evitar problemas de offsetHeight
function SafeTooltip({ children, title, ...props }: React.ComponentProps<typeof Tooltip>) {
  // Não usar tooltips dinâmicos, pois podem causar problemas de layout
  return (
    <div className="tooltip-container" style={{ display: 'inline-block' }}>
      {children}
    </div>
  );
}

const NetworkTools: React.FC<NetworkToolsProps> = ({ ip }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [portResults, setPortResults] = useState<PortResult[]>([]);
  const [isCheckingPorts, setIsCheckingPorts] = useState(false);
  const [customPort, setCustomPort] = useState<number | ''>('');
  
  // State for managing notifications and errors
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [portError, setPortError] = useState('');
  const [selectedPorts, setSelectedPorts] = useState<number[]>([80, 443]);
  const [pingHistory, setPingHistory] = useState<PingResult[]>([]);
  const [portHistory, setPortHistory] = useState<{ip: string, timestamp: Date, ports: PortResult[]}[]>([]);
  
  // States for IP scanning
  const [startIp, setStartIp] = useState(ip);
  const [endIp, setEndIp] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PingResult[]>([]);
  const [ipScanError, setIpScanError] = useState('');
  
  // Efeito para forçar o recálculo de layout
  useEffect(() => {
    // Este é um hack que força um reflow completo na página
    const timer = setTimeout(() => {
      const body = document.body;
      if (body) {
        // Forçar um reflow no corpo da página
        // eslint-disable-next-line no-unused-expressions
        body.offsetHeight;
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [tabValue]); // Recalcular quando o tab mudar
  
  // Note: This is a demonstration implementation limited by the browser environment.
  // In a production environment, these checks would need to be implemented via backend.

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePing = async () => {
    // Input validation
    if (!ip) {
      showNotification((t as any)('validation.ipRequired'), 'error');
      return;
    }
    
    if (!isValidIP(ip)) {
      showNotification((t as any)('validation.invalidIp'), 'error');
      return;
    }
    
    setIsPinging(true);
    setPingResult(null);
    
    try {
      const result = await pingHost(ip);
      setPingResult(result);
      
      // User feedback based on result
      if (result.status === 'success') {
        showNotification(
          ((t as any)('networkTools.ping.successMessage') as string).replace('{ip}', ip).replace('{time}', `${result.time} ms`), 
          'success'
        );
      } else {
        showNotification(
          ((t as any)('networkTools.ping.failureMessage') as string).replace('{ip}', ip), 
          'warning'
        );
      }
      
      // Add to history
      setPingHistory(prev => {
        // Limit history to 10 entries
        const newHistory = [{ ...result, timestamp: new Date() }, ...prev];
        if (newHistory.length > 10) {
          return newHistory.slice(0, 10);
        }
        return newHistory;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (t as any)('networkTools.ping.unknownError');
      const errorResult = {
        ip,
        status: 'error' as const,
        error: errorMessage,
        timestamp: new Date()
      };
      setPingResult(errorResult);
      setPingHistory(prev => {
        const newHistory = [errorResult, ...prev];
        if (newHistory.length > 10) {
          return newHistory.slice(0, 10);
        }
        return newHistory;
      });
      
      // Error notification
      showNotification(`${(t as any)('networkTools.ping.error')}: ${errorMessage}`, 'error');
    } finally {
      setIsPinging(false);
    }
  };

  // Function to show notifications to user
  const showNotification = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Function to close notifications
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCheckPorts = async () => {
    // Input validation
    if (!ip) {
      showNotification((t as any)('validation.ipRequired'), 'error');
      return;
    }
    
    if (!isValidIP(ip)) {
      showNotification((t as any)('validation.invalidIp'), 'error');
      return;
    }
    
    if (selectedPorts.length === 0) {
      setPortError((t as any)('networkTools.portScan.noPorts'));
      showNotification((t as any)('networkTools.portScan.noPorts'), 'warning');
      return;
    }
    
    setPortError('');
    setIsCheckingPorts(true);
    setPortResults([]);
    
    try {
      const results = await checkMultiplePorts(ip, selectedPorts);
      setPortResults(results);
      
      // Check results
      const openPorts = results.filter(r => r.status === 'open');
      if (openPorts.length > 0) {
        showNotification(
          ((t as any)('networkTools.portScan.openPortsFound') as string).replace('{count}', openPorts.length.toString()), 
          'info'
        );
      }
      
      // Add to history
      setPortHistory(prev => {
        // Limit history to 10 entries
        const newHistory = [{ ip, timestamp: new Date(), ports: results }, ...prev];
        if (newHistory.length > 10) {
          return newHistory.slice(0, 10);
        }
        return newHistory;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (t as any)('networkTools.ping.unknownError');
      console.error('Error checking ports:', errorMessage);
      showNotification(`${(t as any)('networkTools.portScan.error')}: ${errorMessage}`, 'error');
    } finally {
      setIsCheckingPorts(false);
    }
  };

  const handlePortChange = (event: SelectChangeEvent<typeof selectedPorts>) => {
    const value = event.target.value;
    setSelectedPorts(typeof value === 'string' ? [] : value as number[]);
  };

  const handleAddCustomPort = () => {
    setPortError('');
    
    if (customPort === '' || isNaN(Number(customPort))) {
      setPortError((t as any)('networkTools.portScan.invalidPort'));
      return;
    }
    
    const port = Number(customPort);
    if (port < 1 || port > 65535) {
      setPortError((t as any)('networkTools.portScan.portRangeError'));
      return;
    }
    
    if (selectedPorts.includes(port)) {
      setPortError((t as any)('networkTools.portScan.portAlreadyAdded'));
      return;
    }
    
    setSelectedPorts([...selectedPorts, port]);
    setCustomPort('');
    showNotification(((t as any)('networkTools.portScan.portAdded') as string).replace('{port}', port.toString()), 'success');
  };

  const removePort = (port: number) => {
    setSelectedPorts(selectedPorts.filter(p => p !== port));
  };

  const getStatusIcon = (status: 'success' | 'error' | 'open' | 'closed') => {
    switch (status) {
      case 'success':
      case 'open':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'closed':
        return <CloseIcon color="warning" />;
      default:
        return <CheckIcon color="success" />; // Default to success icon rather than null
    }
  };
  
  // Function to scan a range of IPs
  const handleIpRangeScan = async () => {
    // Clear previous errors
    setIpScanError('');
    
    // Input validation
    if (!startIp || !endIp) {
      setIpScanError((t as any)('networkTools.ping.errors.provideIps'));
      showNotification((t as any)('networkTools.ping.errors.provideIps'), 'warning');
      return;
    }
    
    if (!isValidIP(startIp) || !isValidIP(endIp)) {
      setIpScanError((t as any)('networkTools.ping.errors.validIps'));
      showNotification((t as any)('networkTools.ping.errors.validIps'), 'error');
      return;
    }
    
    setIsScanning(true);
    setScanResults([]);
    
    try {
      // IP range validation
      const ips = calculateIpRange(startIp, endIp);
      
      if (ips.length === 0) {
        setIpScanError((t as any)('networkTools.ping.errors.invalidRange'));
        showNotification((t as any)('networkTools.ping.errors.invalidRange'), 'error');
        setIsScanning(false);
        return;
      }
      
      if (ips.length > 50) {
        const message = ((t as any)('networkTools.ping.errors.tooManyIps') as string).replace('{count}', ips.length.toString());
        setIpScanError(message);
        showNotification(message, 'warning');
        setIsScanning(false);
        return;
      }
      
      // Start scanning
      showNotification(
        ((t as any)('networkTools.ping.scanningMessage') as string).replace('{count}', ips.length.toString()),
        'info'
      );
      
      const results = await scanIpRange(ips);
      setScanResults(results);
      
      // Feedback after completion
      const hostsUp = results.filter(r => r.status === 'success').length;
      showNotification(
        ((t as any)('networkTools.ping.scanCompleteMessage') as string)
          .replace('{total}', results.length.toString())
          .replace('{up}', hostsUp.toString()),
        'success'
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (t as any)('networkTools.ping.error');
      const fullErrorMessage = ((t as any)('networkTools.ping.errors.scanError') as string).replace('{message}', errorMsg);
      setIpScanError(fullErrorMessage);
      showNotification(fullErrorMessage, 'error');
    } finally {
      setIsScanning(false);
    }
  };
  
  // Function to scan the entire current subnet
  const handleScanSubnet = async () => {
    // Clear previous errors
    setIpScanError('');
    
    // Input validation
    if (!ip) {
      setIpScanError((t as any)('networkTools.ping.errors.ipRequired'));
      showNotification((t as any)('networkTools.ping.errors.ipRequired'), 'warning');
      return;
    }
    
    if (!isValidIP(ip)) {
      setIpScanError((t as any)('networkTools.ping.errors.validIps'));
      showNotification((t as any)('validation.invalidIp'), 'error');
      return;
    }
    
    setIsScanning(true);
    setScanResults([]);
    
    try {
      // Calculate subnet information
      const ipInfo = calculateIPInfo(ip, 24); // Assume /24 as default
      
      // Generate IPs in subnet (limited to 50)
      const subnetIps = generateIpsInSubnet(ip, 24, 50);
      
      if (subnetIps.length === 0) {
        setIpScanError((t as any)('networkTools.ping.errors.noIps'));
        showNotification((t as any)('networkTools.ping.errors.noIps'), 'error');
        setIsScanning(false);
        return;
      }
      
      // Update fields with calculated values
      setStartIp(subnetIps[0]);
      setEndIp(subnetIps[subnetIps.length - 1]);
      
      // Feedback during scanning
      showNotification(
        ((t as any)('networkTools.ping.subnetScanMessage') as string)
          .replace('{subnet}', `${ipInfo.networkAddress}/${ipInfo.cidr}`)
          .replace('{count}', subnetIps.length.toString()),
        'info'
      );
      
      // Execute the scan
      const results = await scanIpRange(subnetIps);
      setScanResults(results);
      
      // Feedback after completion
      const hostsUp = results.filter(r => r.status === 'success').length;
      showNotification(
        ((t as any)('networkTools.ping.subnetScanComplete') as string)
          .replace('{total}', results.length.toString())
          .replace('{up}', hostsUp.toString()),
        'success'
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (t as any)('networkTools.ping.error');
      const fullErrorMessage = ((t as any)('networkTools.ping.errors.subnetError') as string).replace('{message}', errorMsg);
      setIpScanError(fullErrorMessage);
      showNotification(fullErrorMessage, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card elevation={3} sx={{ mt: 3, overflow: 'hidden' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <NetworkCheckIcon sx={{ mr: 1, fontSize: { xs: 24, sm: 32 } }} />
          <Typography variant="h5" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {(t as any)('networkTools.title')}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {(t as any)('networkTools.disclaimer')}
        </Typography>
        <Typography variant="body2" color="error.main" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {(t as any)('networkTools.legalWarning')}
        </Typography>

        {/* Substituição para os Tabs que causam problemas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pb: 1 }}>
            <Button
              variant={tabValue === 0 ? "contained" : "outlined"}
              onClick={(e) => handleTabChange(e, 0)}
              startIcon={<NetworkCheckIcon />}
            >
              {(t as any)('networkTools.ping.title')}
            </Button>
            <Button
              variant={tabValue === 1 ? "contained" : "outlined"}
              onClick={(e) => handleTabChange(e, 1)}
              startIcon={<PortableWifiOffIcon />}
            >
              {(t as any)('networkTools.portScan.title')}
            </Button>
            <Button
              variant={tabValue === 2 ? "contained" : "outlined"}
              onClick={(e) => handleTabChange(e, 2)}
              startIcon={<NetworkCheckIcon />}
            >
              {(t as any)('networkTools.ping.ipSweep')}
            </Button>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<NetworkCheckIcon />}
                onClick={handlePing}
                disabled={isPinging}
                fullWidth
              >
                {(t as any)('networkTools.ping.run')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              {pingResult && (
                <IconButton onClick={handlePing} disabled={isPinging} title={(t as any)('networkTools.ping.refresh')}>
                  <RefreshIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>

          {isPinging && <LinearProgress sx={{ mt: 2 }} />}

          {pingResult && (
            <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {(t as any)('networkTools.ping.result')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                  {(t as any)('networkTools.ping.status')}:
                </Typography>
                <Chip
                  icon={pingResult.status === 'success' ? <CheckIcon /> : <ErrorIcon />}
                  label={pingResult.status === 'success' ? (t as any)('networkTools.ping.success') : (t as any)('networkTools.ping.failure')}
                  color={pingResult.status === 'success' ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Conteúdo para a tab de escaneamento de portas */}
          <Typography variant="h6">
            {(t as any)('networkTools.portScan.title')}
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Conteúdo para a tab de IP Sweep */}
          <Typography variant="h6">
            {(t as any)('networkTools.ping.ipSweep')}
          </Typography>
        </TabPanel>
        
        {/* Usando div em vez do Snackbar que pode causar problemas */}
        {snackbarOpen && (
          <div 
            style={{
              position: 'fixed', 
              bottom: '20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: 
                snackbarSeverity === 'success' ? '#4caf50' :
                snackbarSeverity === 'error' ? '#f44336' :
                snackbarSeverity === 'warning' ? '#ff9800' : '#2196f3',
              color: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              zIndex: 1500
            }}
          >
            <span>{snackbarMessage}</span>
            <button 
              onClick={() => setSnackbarOpen(false)} 
              style={{
                border: 'none',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                marginLeft: '16px'
              }}
            >
              ✖
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkTools;
