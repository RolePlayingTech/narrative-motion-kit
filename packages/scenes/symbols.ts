/** Geometric explanatory symbols. These are illustrations, never documentary evidence. */
export function mechanismSymbol(kind: string, color: string, secondary: string): string {
  const paths: Record<string, string> = {
    oil: '<ellipse cx="80" cy="28" rx="46" ry="15"/><path d="M34 28v108c0 20 92 20 92 0V28M34 64c12 18 80 18 92 0M34 112c12 18 80 18 92 0"/><path d="M80 67c-7 12-17 20-17 31a17 17 0 0 0 34 0c0-11-10-19-17-31Z" fill="currentColor" stroke="none"/>',
    refinery:
      '<path d="M15 146V87l30-19v24l31-21v75M76 146V94h70v52M104 94V40h21v54M32 77V26h15v41M18 147h132M88 109h15m12 0h15m-42 18h15m12 0h15"/><path d="M105 24h19m-14-13h15" stroke="SECONDARY"/>',
    ship: '<path d="M11 111h139l-20 33H37L11 111ZM45 111V80h79v31M64 80V57h43v23M84 57V33m0 0 35 15H84M58 94h15m12 0h15m12 0h8M8 156q12-12 24 0t24 0t24 0t24 0t24 0t24 0"/><path d="M112 56h16m-9-13h12" stroke="SECONDARY"/>',
    pump: '<path d="M26 146V20h78v126M17 146h98M104 54h17l17 20v49q0 20-15 20t-14-20V93M123 37l18 22v25h-13V63l-13-14Z"/><rect x="39" y="35" width="51" height="39" rx="2"/><path d="M41 94h46m-45 16h25"/>',
    money:
      '<rect x="10" y="49" width="142" height="88" rx="8"/><circle cx="81" cy="93" r="24"/><path d="M28 74h14m79 41h14M34 33h108M52 17h71"/>',
    document: '<path d="M34 14h65l28 28v109H34ZM99 14v28h28M52 67h58M52 89h58M52 111h39"/>',
  };
  return `<g fill="none" stroke="${color}" color="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${(paths[kind] ?? paths.document).replaceAll('SECONDARY', secondary)}</g>`;
}
