# IP Calc Network

IP addressing and subnetting calculator, ideal for network professionals or anyone wanting to learn more about IP networks.

## Features

### IP Calculation
- Comprehensive IPv4 address calculation with network, broadcast, and valid host ranges
- Full CIDR support (`/1` to `/32`) with automatic decimal mask conversion
- Subnet mask display in both decimal (e.g., 255.255.255.0) and binary formats (e.g., 11111111 11111111 11111111 00000000)
- Detailed binary representation of IP addresses with space-separated octets for improved readability
- Automatic calculation of available hosts in each subnet
- Network address calculation and display in both decimal and binary formats
- Visual representation of subnet masking operations

### Network Tools
- Ping functionality to verify connectivity with remote hosts
- Port scanning for network service diagnostics
- IP range scanning to discover active hosts in a subnet
- IP range calculation for network management
- History tracking of ping and port scan operations
- Common ports quick-selection for faster scanning

### Subnet Management
- Automatic subnet generation based on the desired number of subnets
- CIDR-based subnet division with optimized address space allocation
- Calculation of first and last valid host in each subnet
- Quick visualization of subnet distribution
- Network ID and broadcast address calculation for each subnet

### Interface and Usability
- Multi-language interface:  
  - Portuguese 🇵🇹
  - English 🇬🇧
  - French 🇫🇷
  - German 🇩🇪
- Automatic light/dark theme detection based on system preference
- Modern, responsive design using Material-UI components
- Intuitive interface with explanatory tooltips
- Tab-based navigation for better organization of tools
- Real-time calculation and updates when changing CIDR values

## Technologies

- React 18 with functional components and Hooks for state management
- TypeScript for static typing and enhanced development experience
- Material-UI v5 for components, theming, and responsive design
- i18next for internationalization and multi-language support
- Pure JavaScript/TypeScript implementations of network calculation algorithms
- Efficient state management with React hooks (useState, useEffect, useCallback)

## Installation

```bash
# Clone the repository
git clone https://github.com/seu-usuario/ipcalc-network.git
cd ipcalc-network

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

### Development Mode

```bash
npm start
```

This runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will automatically reload when you make changes to the code.

### Testing

```bash
npm test
```

Launches the test runner in interactive watch mode. See the [running tests](https://facebook.github.io/create-react-app/docs/running-tests) documentation for more information.

### Production Build

```bash
npm run build
```

Builds the app for production to the `build` folder. It bundles React in production mode and optimizes the build for best performance. The build is minified and filenames include content hashes for efficient caching.

## Key Features in Detail

### Binary Representations
- Binary IP address: View any IPv4 address in binary format with spaces between octets
- Binary subnet mask: Visualize subnet masks in binary to better understand network division
- Binary network address: See how the network address is derived using binary operations

### Network Analysis Tools
- Active host detection using ping-like functionality
- Common service detection with port scanning
- Network range visualization and management
- Interactive CIDR slider for subnet adjustments

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Optimized layouts for different screen sizes
- Accessible interface with keyboard navigation support

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).