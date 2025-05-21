import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import { PaletteMode } from '@mui/material';

type ThemeMode = PaletteMode | 'system';

interface ThemeTogglerProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeToggler: React.FC<ThemeTogglerProps> = ({ mode, setMode }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    handleClose();
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <LightModeIcon />;
      case 'dark':
        return <DarkModeIcon />;
      case 'system':
        return <BrightnessAutoIcon />;
      default:
        return <BrightnessAutoIcon />;
    }
  };

  return (
    <>
      <Tooltip title="Sistema">
        <IconButton
          onClick={handleClick}
          size="medium"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          color="inherit"
        >
          {getThemeIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'theme-button',
        }}
      >
        <MenuItem onClick={() => handleThemeChange('light')}>
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Claro</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleThemeChange('dark')}>
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Escuro</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleThemeChange('system')}>
          <ListItemIcon>
            <SettingsBrightnessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sistema</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeToggler;
