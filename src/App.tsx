import React, { useEffect, useState } from 'react';
import { 
  Container, 
  CssBaseline, 
  ThemeProvider, 
  Box,
  AppBar,
  Toolbar,
  Typography,
  Stack,
  useMediaQuery
} from '@mui/material';
import './App.css';
import { lightTheme, darkTheme } from './theme/theme';
import useThemeMode from './hooks/useThemeMode';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggler from './components/ThemeToggler';
import IpForm from './components/IpForm';
import ResultCard from './components/ResultCard';
import SubnetGenerator from './components/SubnetGenerator';
import NetworkTools from './components/NetworkTools';
import { calculateIPInfo, generateSubnets, IPResult, Subnet } from './utils/ipUtils';
import RouterIcon from '@mui/icons-material/Router';
import Footer from './components/Footer';

function App() {
  const { mode, actualMode, setMode } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = actualMode === 'light' ? lightTheme : darkTheme;
  
  const [ipResult, setIpResult] = useState<IPResult | null>(null);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [currentIp, setCurrentIp] = useState('');
  const [currentCidr, setCurrentCidr] = useState(24);
  
  // Effect to handle theme changes
  useEffect(() => {
    if (ipResult) {
      // Recalculate using the same values to update translations
      handleCalculate(currentIp, currentCidr);
    }
  }, [actualMode]);
  
  // Effect to observe language changes - versão simplificada
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language change detected in App.tsx');
      
      // Force a UI update by recalculating all results
      if (ipResult) {
        handleCalculate(currentIp, currentCidr);
        
        // If you have subnets, regenerate them too
        if (subnets.length > 0) {
          handleGenerateSubnets(subnets.length);
        }
      }
    };
    
    // Apenas observar o evento i18next de mudança de idioma
    document.addEventListener('i18nextLanguageChanged', handleLanguageChange);
    
    // Clean up listener when component unmounts
    return () => {
      document.removeEventListener('i18nextLanguageChanged', handleLanguageChange);
    };
  }, [ipResult, currentIp, currentCidr, subnets.length]);
  
  const handleCalculate = (ip: string, cidr: number) => {
    const result = calculateIPInfo(ip, cidr);
    setIpResult(result);
    setCurrentIp(ip);
    setCurrentCidr(cidr);
    setSubnets([]);
  };
  
  const handleGenerateSubnets = (count: number) => {
    if (currentIp && currentCidr) {
      const generatedSubnets = generateSubnets(currentIp, currentCidr, count);
      setSubnets(generatedSubnets);
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <AppBar position="static" color="primary" elevation={3}>
          <Toolbar>
            <RouterIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              IP Calc Network
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {!isMobile && <LanguageSwitcher />}
              <ThemeToggler mode={mode} setMode={setMode} />
            </Stack>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          {/* Seletor de idioma para dispositivos móveis */}
          {isMobile && (
            <Box sx={{ mb: 2 }}>
              <LanguageSwitcher style={{ width: '100%' }} />
            </Box>
          )}
          
          {/* Formulário de entrada */}
          <IpForm onCalculate={handleCalculate} />
          
          {/* Resultados */}
          {ipResult && <ResultCard result={ipResult} />}
          
          {/* Gerador de sub-redes */}
          {ipResult && (
            <SubnetGenerator
              ip={currentIp}
              cidr={currentCidr}
              onGenerateSubnets={handleGenerateSubnets}
              subnets={subnets}
            />
          )}
          
          {/* Ferramentas de Rede */}
          {ipResult && (
            <NetworkTools
              ip={currentIp}
            />
          )}
        </Container>
        
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
