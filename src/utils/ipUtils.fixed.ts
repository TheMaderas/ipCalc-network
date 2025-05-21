/**
 * Utilitários para cálculo de IP e subredes
 */

export interface IPResult {
  networkAddress: string;
  broadcastAddress: string;
  firstValidHost: string;
  lastValidHost: string;
  totalHosts: number;
  usableHosts: number;
  cidr: number;
  subnetMask: string;
  binarySubnetMask: string;
  binaryIpAddress: string;
  binaryNetworkAddress: string;
  wildcardMask: string;
  subnetBits: number;
  hostBits: number;
}

export interface Subnet {
  id: number;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  cidr: number;
  usableHosts: number;
}

/**
 * Valida se o endereço IP é válido
 */
export const isValidIP = (ip: string): boolean => {
  const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return pattern.test(ip);
};

/**
 * Converte um endereço IP para um número inteiro de 32 bits
 */
export const ipToInt = (ip: string): number => {
  const parts = ip.split('.');
  return ((parseInt(parts[0], 10) << 24) |
    (parseInt(parts[1], 10) << 16) |
    (parseInt(parts[2], 10) << 8) |
    parseInt(parts[3], 10)) >>> 0;
};

/**
 * Converte um número inteiro de 32 bits para um endereço IP
 */
export const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
};

/**
 * Converte CIDR para máscara de sub-rede
 */
export const cidrToSubnetMask = (cidr: number): string => {
  const mask = ~(0xffffffff >>> cidr) >>> 0;
  return intToIp(mask);
};

/**
 * Converte máscara de sub-rede para CIDR
 */
export const subnetMaskToCidr = (subnetMask: string): number => {
  const mask = ipToInt(subnetMask);
  let count = 0;
  for (let i = 0; i < 32; i++) {
    if ((mask & (1 << (31 - i))) !== 0) {
      count++;
    }
  }
  return count;
};

/**
 * Converte um número para binário com preenchimento de zeros à esquerda
 */
export const toBinary = (num: number, padding = 8): string => {
  return num.toString(2).padStart(padding, '0');
};

/**
 * Converte endereço IP para formato binário formatado com espaços
 */
export const ipToBinary = (ip: string): string => {
  return ip
    .split('.')
    .map(octet => toBinary(parseInt(octet, 10), 8))
    .join(' ');
};

/**
 * Converte endereço IP para formato binário sem pontos ou espaços
 * Útil para operações em bits
 */
export const ipToBinaryRaw = (ip: string): string => {
  return ip
    .split('.')
    .map(octet => toBinary(parseInt(octet, 10), 8))
    .join('');
};

/**
 * Gera uma representação visual da operação AND entre um IP e a máscara de subrede
 */
export const generateBinaryAndOperation = (ip: string, subnetMask: string): { 
  ipBits: string, 
  maskBits: string, 
  resultBits: string, 
  networkBits: number 
} => {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(subnetMask);
  const resultInt = ipInt & maskInt;
  
  const ipBits = ipToBinaryRaw(ip);
  const maskBits = ipToBinaryRaw(subnetMask);
  const resultBits = ipToBinaryRaw(intToIp(resultInt));
  const networkBits = subnetMaskToCidr(subnetMask);
  
  return { ipBits, maskBits, resultBits, networkBits };
};

/**
 * Calcula o endereço de rede
 */
export const calculateNetworkAddress = (ip: string, subnetMask: string): string => {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(subnetMask);
  const networkInt = ipInt & maskInt;
  return intToIp(networkInt);
};

/**
 * Calcula o endereço de broadcast
 */
export const calculateBroadcastAddress = (ip: string, subnetMask: string): string => {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(subnetMask);
  const networkInt = ipInt & maskInt;
  const invertedMaskInt = ~maskInt >>> 0;
  const broadcastInt = networkInt | invertedMaskInt;
  return intToIp(broadcastInt);
};

/**
 * Calcula o primeiro host válido
 */
export const calculateFirstHost = (networkAddress: string): string => {
  const networkInt = ipToInt(networkAddress);
  return intToIp(networkInt + 1);
};

/**
 * Calcula o último host válido
 */
export const calculateLastHost = (broadcastAddress: string): string => {
  const broadcastInt = ipToInt(broadcastAddress);
  return intToIp(broadcastInt - 1);
};

/**
 * Calcula a máscara wildcard
 */
export const calculateWildcardMask = (subnetMask: string): string => {
  const maskInt = ipToInt(subnetMask);
  const wildcardInt = ~maskInt >>> 0;
  return intToIp(wildcardInt);
};

/**
 * Calcula todas as informações de um endereço IP e máscara de sub-rede
 */
export const calculateIPInfo = (ip: string, cidr: number): IPResult => {
  const subnetMask = cidrToSubnetMask(cidr);
  const networkAddress = calculateNetworkAddress(ip, subnetMask);
  const broadcastAddress = calculateBroadcastAddress(ip, subnetMask);
  const firstValidHost = calculateFirstHost(networkAddress);
  const lastValidHost = calculateLastHost(broadcastAddress);
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;
  const binarySubnetMask = ipToBinary(subnetMask);
  const binaryIpAddress = ipToBinary(ip);
  const binaryNetworkAddress = ipToBinary(networkAddress);
  const wildcardMask = calculateWildcardMask(subnetMask);

  return {
    networkAddress,
    broadcastAddress,
    firstValidHost,
    lastValidHost,
    totalHosts,
    usableHosts,
    cidr,
    subnetMask,
    binarySubnetMask,
    binaryIpAddress,
    binaryNetworkAddress,
    wildcardMask,
    subnetBits: cidr - (cidr <= 8 ? 0 : cidr <= 16 ? 8 : cidr <= 24 ? 16 : 24),
    hostBits: 32 - cidr
  };
};

/**
 * Gera sub-redes a partir de um endereço IP e máscara de sub-rede
 */
export const generateSubnets = (ip: string, cidr: number, subnetCount: number): Subnet[] => {
  // Calcula o novo CIDR para as sub-redes
  const bitsNeeded = Math.ceil(Math.log2(subnetCount));
  const newCidr = Math.min(cidr + bitsNeeded, 30); // Limitamos a 30 para permitir pelo menos 2 hosts
  
  // Calcula o endereço de rede do IP original
  const subnetMask = cidrToSubnetMask(cidr);
  const networkAddress = calculateNetworkAddress(ip, subnetMask);
  const networkInt = ipToInt(networkAddress);
  
  // Calcula o tamanho de cada sub-rede
  const subnetSize = Math.pow(2, 32 - newCidr);
  const actualSubnetCount = Math.pow(2, newCidr - cidr);
  
  // Gera as sub-redes
  const subnets: Subnet[] = [];
  
  for (let i = 0; i < actualSubnetCount && i < subnetCount; i++) {
    const subnetStartInt = networkInt + (i * subnetSize);
    const subnetStart = intToIp(subnetStartInt);
    const subnetEnd = intToIp(subnetStartInt + subnetSize - 1);
    
    subnets.push({
      id: i + 1,
      networkAddress: subnetStart,
      broadcastAddress: subnetEnd,
      firstHost: intToIp(subnetStartInt + 1),
      lastHost: intToIp(subnetStartInt + subnetSize - 2),
      cidr: newCidr,
      usableHosts: subnetSize - 2
    });
  }
  
  return subnets;
};
