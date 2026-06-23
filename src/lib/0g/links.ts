export function get0gTxExplorerUrl(txHash: string) {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

export function get0gStorageUrl(rootHash: string) {
  void rootHash;
  return null;
}

export function shortenHash(hash: string) {
  if (hash.length <= 24) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}
