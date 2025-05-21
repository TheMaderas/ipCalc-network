/**
 * Network utilities for functions like ping and port checking
 */

import { ipToInt, intToIp } from './ipUtils';

/**
 * Interface for ping result
 */
export interface PingResult {
  ip: string;
  status: 'success' | 'error';
  time?: number; // time in ms
  ttl?: number;
  error?: string;
  timestamp?: Date;
}

/**
 * Interface for port check result
 */
export interface PortResult {
  ip: string;
  port: number;
  status: 'open' | 'closed' | 'error';
  protocol: 'TCP' | 'UDP';
  serviceName?: string;
  error?: string;
}

/**
 * Common services and their ports
 */
export const commonPorts = [
  { port: 21, protocol: 'TCP', service: 'FTP' },
  { port: 22, protocol: 'TCP', service: 'SSH' },
  { port: 23, protocol: 'TCP', service: 'Telnet' },
  { port: 25, protocol: 'TCP', service: 'SMTP' },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS' },
  { port: 80, protocol: 'TCP', service: 'HTTP' },
  { port: 110, protocol: 'TCP', service: 'POP3' },
  { port: 143, protocol: 'TCP', service: 'IMAP' },
  { port: 443, protocol: 'TCP', service: 'HTTPS' },
  { port: 389, protocol: 'TCP', service: 'LDAP' },
  { port: 636, protocol: 'TCP', service: 'LDAPS' },
  { port: 445, protocol: 'TCP', service: 'SMB' },
  { port: 3306, protocol: 'TCP', service: 'MySQL' },
  { port: 3389, protocol: 'TCP', service: 'RDP' },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL' },
  { port: 8080, protocol: 'TCP', service: 'HTTP Proxy' }
];

/**
 * Performs a ping on an IP address
 * Note: This is a client-side implementation that uses a fetch request with timeout
 * It's not a real ICMP ping, which requires elevated privileges
 */
export const pingHost = async (ip: string): Promise<PingResult> => {
  try {      // For a real environment, you would use a backend request to implement ICMP ping
      // This is a simulation using fetch
    const startTime = performance.now();
    
    // URL com 'http://' - para uso em ambiente real você deve implementar um endpoint no backend
    const url = `http://${ip}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
    
    try {
      await fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal,
        mode: 'no-cors' // Para evitar erros de CORS
      });
      
      clearTimeout(timeoutId);
      
      const endTime = performance.now();
      const time = Math.round(endTime - startTime);
      
      return {
        ip,
        status: 'success',
        time,
        ttl: 64 // Valor padrão para simular
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        ip,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  } catch (error) {
    return {
      ip,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Checks if a port is open on a host
 * Note: This is a client-side implementation that uses a fetch request with timeout
 * For real port checks, you would need a backend implementation
 */
export const checkPort = async (ip: string, port: number, protocol: 'TCP' | 'UDP' = 'TCP'): Promise<PortResult> => {
  try {
    // For a real environment, you would use a backend request to implement port checking
    // This is a simulation using fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
    
    // URL with appropriate protocol - for real environment use you should implement a backend endpoint
    const url = `http://${ip}:${port}`;
    
    try {
      await fetch(url, { 
        method: 'HEAD', 
        signal: controller.signal,
        mode: 'no-cors' // Para evitar erros de CORS
      });
      
      clearTimeout(timeoutId);
      
      // Finds the service for this port, if known
      const service = commonPorts.find(p => p.port === port)?.service;
      
      return {
        ip,
        port,
        status: 'open',
        protocol,
        serviceName: service
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Checks if the error is due to timeout or closed port
      // Note: This logic is not 100% reliable in the browser
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      
      return {
        ip,
        port,
        status: isTimeout ? 'closed' : 'error',
        protocol,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  } catch (error) {
    return {
      ip,
      port,
      status: 'error',
      protocol,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Checks multiple ports on a host
 */
export const checkMultiplePorts = async (ip: string, ports: number[], protocol: 'TCP' | 'UDP' = 'TCP'): Promise<PortResult[]> => {
  // Creates an array of promises to check each port
  const portPromises = ports.map(port => checkPort(ip, port, protocol));
  
  // Executes all promises in parallel
  return Promise.all(portPromises);
};

/**
 * Gets the service name for a specific port
 */
export const getServiceNameForPort = (port: number): string => {
  const portInfo = commonPorts.find(p => p.port === port);
  return portInfo ? portInfo.service : 'Desconhecido';
};

/**
 * Calculates all IP addresses in a range
 * @param startIp - Starting IP of the range
 * @param endIp - Ending IP of the range
 */
export const calculateIpRange = (startIp: string, endIp: string): string[] => {
  const startIpInt = ipToInt(startIp);
  const endIpInt = ipToInt(endIp);
  
  if (startIpInt > endIpInt) {
    return [];
  }
  
  const ips: string[] = [];
  for (let i = startIpInt; i <= endIpInt; i++) {
    ips.push(intToIp(i));
  }
  
  return ips;
};

/**
 * Generates a list of IP addresses within the same subnet
 * @param networkIp - Network IP address
 * @param cidr - CIDR mask
 * @param limit - Limit of IPs to be returned (to avoid generating very large lists)
 */
export const generateIpsInSubnet = (networkIp: string, cidr: number, limit = 100): string[] => {
  try {
    // Calculates the subnet mask in integer format
    const mask = ~(0xffffffff >>> cidr) >>> 0;
    
    // Converts the IP to integer
    const ipInt = ipToInt(networkIp);
    
    // Calculates the network address (applying the mask)
    const networkInt = ipInt & mask;
    
    // Calculates the broadcast address
    const broadcastInt = networkInt | (~mask >>> 0);
    
    // Array to store the IPs
    const ips: string[] = [];
    
    // Adds usable IPs (starts from the first valid host, which is networkInt + 1)
    for (let i = networkInt + 1; i < broadcastInt && ips.length < limit; i++) {
      ips.push(intToIp(i));
    }
    
    return ips;
  } catch (error) {
    console.error("Error generating IPs in subnet:", error);
    return [];
  }
};

/**
 * Checks which hosts are active in an IP range
 * @param ips - Array of IP addresses
 */
export const scanIpRange = async (ips: string[]): Promise<PingResult[]> => {
  const results = [];
  
  // Limits the number of parallel requests to avoid overloading the browser
  const batchSize = 5;
  
  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    const batchPromises = batch.map(pingHost);
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};
