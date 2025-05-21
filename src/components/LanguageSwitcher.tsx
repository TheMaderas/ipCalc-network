import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

interface LanguageSwitcherProps {
  style?: React.CSSProperties;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { i18n, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language.split('-')[0]);
  
  // Update internal state when i18n language changes
  React.useEffect(() => {
    setSelectedLanguage(i18n.language.split('-')[0]);
  }, [i18n.language]);
  
  const handleChange = (event: SelectChangeEvent) => {
    const language = event.target.value;
    setSelectedLanguage(language);
    
    try {
      // Método simples e direto
      localStorage.setItem('i18nextLng', language);
      document.documentElement.setAttribute('lang', language);
      
      // Mudar o idioma
      i18n.changeLanguage(language);
      
      console.log('Language changed to:', language);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };
  
  const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ];
  
  return (
    <FormControl size="small" style={style}>
      <InputLabel id="language-select-label">
        <LanguageIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
        {(t as any)('language')}
      </InputLabel>
      <Select
        labelId="language-select-label"
        id="language-select"
        value={selectedLanguage}
        label={(t as any)('language')}
        onChange={handleChange}
        style={{ minWidth: '150px' }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
