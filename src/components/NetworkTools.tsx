import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Simplified version of TabPanel that avoids offsetHeight problems
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // Instead of using null, render a hidden element (display: none)
  // This prevents React from mounting/unmounting elements, which can cause issues with offsetHeight
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

// Helper function for tab accessibility
function a11yProps(index: number) {
  return {
    id: `network-tab-${index}`,
    'aria-controls': `network-tabpanel-${index}`,
  };
}

// Modified Tooltip component to avoid offsetHeight problems
function SafeTooltip({ children, title, ...props }: React.ComponentProps<typeof Tooltip>) {
  // Don't use dynamic tooltips as they may cause layout problems
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
  const [ipInfo, setIpInfo] = useState<ReturnType<typeof calculateIPInfo> | null>(null);
  
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
  
  // Effect to force layout recalculation
  useEffect(() => {
    // This is a hack that forces a complete reflow of the page
    const timer = setTimeout(() => {
      const body = document.body;
      if (body) {
        // Force a reflow on the page body
        // eslint-disable-next-line no-unused-expressions
        body.offsetHeight;
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [tabValue]); // Recalculate when the tab changes
  
  // State for CIDR - defined before being used in updateNetworkInfo
  const [cidrValue, setCidrValue] = useState(24);
  
  // Function to update network information without executing ping
  const updateNetworkInfo = useCallback((cidr: number) => {
    if (ip && isValidIP(ip)) {
      setIpInfo(calculateIPInfo(ip, cidr));
    }
  }, [ip]);
  
  // Effect to update network information when the IP changes
  useEffect(() => {
    if (ip && isValidIP(ip)) {
      updateNetworkInfo(cidrValue);
    }
  }, [ip, cidrValue, updateNetworkInfo]);
  
  // Function to update CIDR and recalculate network information
  const handleCidrChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCidr = parseInt(event.target.value, 10);
    if (newCidr >= 1 && newCidr <= 32) {
      setCidrValue(newCidr);
      updateNetworkInfo(newCidr);
    }
  };

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
      // Calculate IP information including subnet mask using current CIDR value
      const ipInfoResult = calculateIPInfo(ip, cidrValue);
      setIpInfo(ipInfoResult);
      
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

        <Typography variant="body2" color="error.main" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {(t as any)('networkTools.legalWarning')}
        </Typography>

        {/* Replacement for tabs to avoid offsetHeight problems */}
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
            <Grid item xs={12} sm={8}>
              <Box display="flex" gap={2} alignItems="center">
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
                {pingResult && (
                  <IconButton onClick={handlePing} disabled={isPinging} title={(t as any)('networkTools.ping.refresh')}>
                    <RefreshIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <TextField
                  label={(t as any)('cidr')}
                  type="number"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: 8 }}>/</span>,
                  }}
                  value={cidrValue}
                  onChange={handleCidrChange}
                  inputProps={{ min: 1, max: 32 }}
                  size="small"
                  fullWidth
                />
              </Box>
            </Grid>
          </Grid>

          {isPinging && <LinearProgress sx={{ mt: 2 }} />}

          {/* Show ping results if available */}
          {pingResult && (
            <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {(t as any)('networkTools.ping.result')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
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
          
          {/* Network Information - display regardless of ping status */}
          {ipInfo && (
            <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {(t as any)('networkTools.ping.networkInfo')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('ipAddress')}:</strong> {ip}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('subnetMask')}:</strong> {ipInfo.subnetMask}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.networkAddress')}:</strong> {ipInfo.networkAddress}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('cidr')}:</strong> /{ipInfo.cidr}
                  </Typography>
                </Grid>
                
                {/* Binary representations */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>{(t as any)('results.binaryRepresentation')}</strong>
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.binaryIpAddress')}:</strong>
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper', 
                    border: 1,
                    borderColor: 'divider',
                    p: 1, 
                    borderRadius: 1, 
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    letterSpacing: '1px',
                    color: 'text.primary',
                  }}>
                    {ipInfo.binaryIpAddress}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.binarySubnetMask')}:</strong>
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider', 
                    p: 1, 
                    borderRadius: 1, 
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    letterSpacing: '1px',
                    color: 'text.primary',
                  }}>
                    {ipInfo.binarySubnetMask}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.binaryNetworkAddress')}:</strong>
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider', 
                    p: 1, 
                    borderRadius: 1, 
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    letterSpacing: '1px',
                    color: 'text.primary',
                  }}>
                    {ipInfo.binaryNetworkAddress}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.broadcastAddress')}:</strong> {ipInfo.broadcastAddress}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.firstValidHost')}:</strong> {ipInfo.firstValidHost}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.lastValidHost')}:</strong> {ipInfo.lastValidHost}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.totalHosts')}:</strong> {ipInfo.totalHosts.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{(t as any)('results.usableHosts')}:</strong> {ipInfo.usableHosts.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Content for port scanning tab */}
          <Typography variant="h6" gutterBottom>
            {(t as any)('networkTools.portScan.title')}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="common-ports-label">{(t as any)('networkTools.portScan.commonPorts')}</InputLabel>
                <Select
                  labelId="common-ports-label"
                  multiple
                  value={selectedPorts}
                  onChange={handlePortChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 48 * 4.5,
                        width: 250,
                      },
                    },
                  }}
                >
                  {commonPorts.map((port) => (
                    <MenuItem key={port.port} value={port.port}>
                      {port.port} - {port.service}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  label={(t as any)('networkTools.portScan.customPort')}
                  type="number"
                  value={customPort}
                  onChange={(e) => setCustomPort(e.target.value === '' ? '' : Number(e.target.value))}
                  error={!!portError}
                  helperText={portError}
                  InputProps={{ inputProps: { min: 1, max: 65535 } }}
                  fullWidth
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddCustomPort}
                  sx={{ height: 56 }}
                >
                  {(t as any)('networkTools.portScan.add')}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<PortableWifiOffIcon />} 
                onClick={handleCheckPorts} 
                disabled={isCheckingPorts || selectedPorts.length === 0}
                fullWidth
              >
                {(t as any)('networkTools.portScan.checkPorts')}
              </Button>
            </Grid>
          </Grid>
          
          {isCheckingPorts && <LinearProgress sx={{ mt: 2 }} />}
          
          {portResults.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{(t as any)('networkTools.portScan.port')}</TableCell>
                    <TableCell>{(t as any)('networkTools.portScan.service')}</TableCell>
                    <TableCell>{(t as any)('networkTools.portScan.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portResults.map((result) => (
                    <TableRow key={result.port}>
                      <TableCell>{result.port}</TableCell>
                      <TableCell>
                        {commonPorts.find(p => p.port === result.port)?.service || (t as any)('networkTools.portScan.unknown')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getStatusIcon(result.status)}
                          <Typography sx={{ ml: 1 }}>
                            {(t as any)(`networkTools.portScan.${result.status}`)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer> 
          )}
          
          {portHistory.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {(t as any)('networkTools.portScan.history')}
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>IP</TableCell>
                      <TableCell>{(t as any)('networkTools.ping.timestamp')}</TableCell>
                      <TableCell>{(t as any)('networkTools.portScan.portsChecked')}</TableCell>
                      <TableCell>{(t as any)('networkTools.portScan.openPorts')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portHistory.map((history, index) => (
                      <TableRow key={index}>
                        <TableCell>{history.ip}</TableCell>
                        <TableCell>{history.timestamp.toLocaleString()}</TableCell>
                        <TableCell>{history.ports.length}</TableCell>
                        <TableCell>{history.ports.filter(p => p.status === 'open').length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Content for IP Sweep tab */}
          <Typography variant="h6" gutterBottom>
            {(t as any)('networkTools.ping.ipSweep')}
          </Typography>
          
          <Grid container spacing={2}>
            {/* IP Range inputs */}
            <Grid item xs={12} md={6}>
              <TextField
                label={(t as any)('networkTools.ping.startIp')}
                value={startIp}
                onChange={(e) => setStartIp(e.target.value)}
                fullWidth
                error={!!ipScanError && !startIp}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={(t as any)('networkTools.ping.endIp')}
                value={endIp}
                onChange={(e) => setEndIp(e.target.value)}
                fullWidth
                error={!!ipScanError && !endIp}
                margin="normal"
              />
            </Grid>
            
            {/* Action buttons */}
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<NetworkCheckIcon />}
                onClick={handleScanSubnet}
                disabled={isScanning || !ip}
                fullWidth
                sx={{ mt: 2 }}
              >
                {(t as any)('networkTools.ping.scanSubnet')}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<NetworkCheckIcon />}
                onClick={handleIpRangeScan}
                disabled={isScanning || !startIp || !endIp}
                fullWidth
                sx={{ mt: 2 }}
              >
                {(t as any)('networkTools.ping.scanRange')}
              </Button>
            </Grid>
            
            {/* Error display */}
            {ipScanError && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {ipScanError}
                </Alert>
              </Grid>
            )}
            
            {/* Scan progress indicator */}
            {isScanning && (
              <Grid item xs={12}>
                <LinearProgress sx={{ mt: 2 }} />
              </Grid>
            )}
            
            {/* Scan results */}
            {scanResults.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {(t as any)('networkTools.ping.hostsFound')}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>{(t as any)('networkTools.ping.hostsUp')}:</strong> {scanResults.filter(r => r.status === 'success').length}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{(t as any)('networkTools.ping.hostsDown')}:</strong> {scanResults.filter(r => r.status !== 'success').length}
                    </Typography>
                  </Box>
                  
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{(t as any)('ipAddress')}</TableCell>
                          <TableCell>{(t as any)('networkTools.ping.status')}</TableCell>
                          <TableCell>{(t as any)('networkTools.ping.time')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scanResults.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.ip}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getStatusIcon(result.status)}
                                <Typography sx={{ ml: 1 }}>
                                  {result.status === 'success' 
                                    ? (t as any)('networkTools.ping.success') 
                                    : (t as any)('networkTools.ping.failure')
                                  }
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {result.time ? `${result.time} ms` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Using div instead of Snackbar which can cause problems */}
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
