/**
 * Utility functions for IPFS operations
 */

/**
 * Convert an IPFS URI to a gateway URL
 * @param ipfsUri IPFS URI (ipfs://...)
 * @returns Gateway URL
 */
export function ipfsUriToGatewayUrl(ipfsUri: string): string {
  if (!ipfsUri) return '';
  
  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  
  // If it's already a HTTP URL, return as is
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }
  
  // If it's just a CID
  if (ipfsUri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUri}`;
  }
  
  return ipfsUri;
}

/**
 * Extract CID from an IPFS URI
 * @param ipfsUri IPFS URI (ipfs://...)
 * @returns CID
 */
export function extractCidFromIpfsUri(ipfsUri: string): string {
  if (!ipfsUri) return '';
  
  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    return ipfsUri.replace('ipfs://', '');
  }
  
  // If it's a gateway URL
  const gatewayMatch = ipfsUri.match(/\/ipfs\/([a-zA-Z0-9]{46,59})/);
  if (gatewayMatch && gatewayMatch[1]) {
    return gatewayMatch[1];
  }
  
  // If it's just a CID
  if (ipfsUri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return ipfsUri;
  }
  
  return '';
}

/**
 * Fetch content from IPFS
 * @param ipfsUri IPFS URI or CID
 * @returns Promise with the content
 */
export async function fetchFromIpfs(ipfsUri: string): Promise<any> {
  const cid = extractCidFromIpfsUri(ipfsUri);
  
  if (!cid) {
    throw new Error('Invalid IPFS URI');
  }
  
  try {
    const response = await fetch(`/api/ipfs/download?cid=${cid}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
}
