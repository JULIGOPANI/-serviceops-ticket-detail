/* BOM module data — the Bill of Materials generated per endpoint (CI).
 *
 * A BOM is scoped to a PRODUCT on a host: every host has an implicit "OS / base platform"
 * scope (everything no other product claims) plus zero or more application products with
 * their own scan paths. Each (endpoint × product) carries three BOM types:
 *   SBOM   — software components (libraries, frameworks, applications)
 *   CBOM   — cryptographic assets (algorithms, keys, certificates)
 *   AI BOM — AI/ML models in use
 *
 * Everything here is mock but deterministic: the same endpoint id always produces the same
 * BOM, so the listing counts and the detail page never disagree.
 */

import { mockEndpoints } from './EndpointsListPage';

export type BomType = 'SBOM' | 'CBOM' | 'AI BOM';
export type BomStatus = 'Generated' | 'Partial' | 'Not Generated';

/** Stable string hash — keeps generated data identical across renders. */
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// ---------------------------------------------------------------------------
// Component catalogs — realistic enterprise inventory, sliced deterministically.
// ---------------------------------------------------------------------------

export interface BomComponent {
  name: string;
  version: string;
  type: 'Application' | 'Framework' | 'Library' | 'Operating-System';
  ecosystem: string;
  purl: string;
  license: string;
  origin: 'Open-source' | 'Proprietary' | 'Third-party';
  /** Known vulnerable — drives the Findings count and the "Security only" filter. */
  cves?: string[];
}

const SBOM_CATALOG: BomComponent[] = [
  { name: 'openssl', version: '3.0.1', type: 'Library', ecosystem: 'Generic', purl: 'pkg:generic/openssl@3.0.1', license: 'Apache-2.0', origin: 'Open-source', cves: ['CVE-2026-21412'] },
  { name: 'zlib', version: '1.2.11', type: 'Library', ecosystem: 'Generic', purl: 'pkg:generic/zlib@1.2.11', license: 'Zlib', origin: 'Open-source' },
  { name: 'log4j-core', version: '2.14.1', type: 'Library', ecosystem: 'Maven', purl: 'pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1', license: 'Apache-2.0', origin: 'Open-source', cves: ['CVE-2021-44228', 'CVE-2021-45046'] },
  { name: 'spring-core', version: '5.3.18', type: 'Framework', ecosystem: 'Maven', purl: 'pkg:maven/org.springframework/spring-core@5.3.18', license: 'Apache-2.0', origin: 'Open-source' },
  { name: 'jackson-databind', version: '2.12.3', type: 'Library', ecosystem: 'Maven', purl: 'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.12.3', license: 'Apache-2.0', origin: 'Open-source', cves: ['CVE-2026-26234'] },
  { name: 'commons-text', version: '1.9', type: 'Library', ecosystem: 'Maven', purl: 'pkg:maven/org.apache.commons/commons-text@1.9', license: 'Apache-2.0', origin: 'Open-source', cves: ['CVE-2022-42889'] },
  { name: 'commons-collections', version: '3.2.1', type: 'Library', ecosystem: 'Maven', purl: 'pkg:maven/commons-collections/commons-collections@3.2.1', license: 'Apache-2.0', origin: 'Open-source', cves: ['CVE-2015-6420'] },
  { name: 'lodash', version: '4.17.20', type: 'Library', ecosystem: 'Npm', purl: 'pkg:npm/lodash@4.17.20', license: 'MIT', origin: 'Open-source', cves: ['CVE-2021-23337'] },
  { name: 'node-forge', version: '1.2.1', type: 'Library', ecosystem: 'Npm', purl: 'pkg:npm/node-forge@1.2.1', license: 'BSD-3-Clause', origin: 'Open-source' },
  { name: 'axios', version: '1.6.2', type: 'Library', ecosystem: 'Npm', purl: 'pkg:npm/axios@1.6.2', license: 'MIT', origin: 'Open-source' },
  { name: 'react', version: '18.3.1', type: 'Framework', ecosystem: 'Npm', purl: 'pkg:npm/react@18.3.1', license: 'MIT', origin: 'Open-source' },
  { name: 'pycryptodome', version: '3.9.8', type: 'Library', ecosystem: 'Pypi', purl: 'pkg:pypi/pycryptodome@3.9.8', license: 'BSD-2-Clause', origin: 'Open-source' },
  { name: 'requests', version: '2.31.0', type: 'Library', ecosystem: 'Pypi', purl: 'pkg:pypi/requests@2.31.0', license: 'Apache-2.0', origin: 'Open-source' },
  { name: 'urllib3', version: '1.26.5', type: 'Library', ecosystem: 'Pypi', purl: 'pkg:pypi/urllib3@1.26.5', license: 'MIT', origin: 'Open-source', cves: ['CVE-2026-30303'] },
  { name: 'golang.org/x/crypto', version: '0.16.0', type: 'Library', ecosystem: 'Golang', purl: 'pkg:golang/golang.org/x/crypto@0.16.0', license: 'BSD-3-Clause', origin: 'Open-source' },
  { name: 'golang.org/x/net', version: '0.17.0', type: 'Library', ecosystem: 'Golang', purl: 'pkg:golang/golang.org/x/net@0.17.0', license: 'BSD-3-Clause', origin: 'Open-source' },
  { name: 'Microsoft .NET Runtime', version: '6.0.21', type: 'Framework', ecosystem: 'Nuget', purl: 'pkg:nuget/Microsoft.NETCore.App.Runtime@6.0.21', license: 'MIT', origin: 'Open-source' },
  { name: 'Newtonsoft.Json', version: '13.0.3', type: 'Library', ecosystem: 'Nuget', purl: 'pkg:nuget/Newtonsoft.Json@13.0.3', license: 'MIT', origin: 'Open-source' },
  { name: 'Serilog', version: '3.1.1', type: 'Library', ecosystem: 'Nuget', purl: 'pkg:nuget/Serilog@3.1.1', license: 'Apache-2.0', origin: 'Open-source' },
  { name: 'System.Text.Json', version: '8.0.4', type: 'Library', ecosystem: 'Nuget', purl: 'pkg:nuget/System.Text.Json@8.0.4', license: 'MIT', origin: 'Open-source' },
  { name: 'apache-poi', version: '5.2.3', type: 'Library', ecosystem: 'Maven', purl: 'pkg:maven/org.apache.poi/poi@5.2.3', license: 'Apache-2.0', origin: 'Open-source' },
  { name: 'hibernate-core', version: '6.4.1', type: 'Framework', ecosystem: 'Maven', purl: 'pkg:maven/org.hibernate/hibernate-core@6.4.1', license: 'LGPL-2.1', origin: 'Open-source' },
  { name: 'in.hdfc.auth-sdk', version: '1.4.2', type: 'Library', ecosystem: 'Internal', purl: 'pkg:internal/in.hdfc/auth-sdk@1.4.2', license: 'Unknown', origin: 'Proprietary' },
  { name: 'com.motadata.agent-core', version: '8.7.408', type: 'Library', ecosystem: 'Internal', purl: 'pkg:internal/com.motadata/agent-core@8.7.408', license: 'Proprietary', origin: 'Proprietary' },
  { name: 'com.motadata.telemetry', version: '3.2.19', type: 'Library', ecosystem: 'Internal', purl: 'pkg:internal/com.motadata/telemetry@3.2.19', license: 'Proprietary', origin: 'Proprietary' },
  { name: 'Avecto DefendPoint', version: '5.7.142', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/avecto-defendpoint@5.7.142', license: 'Commercial', origin: 'Third-party' },
  { name: 'CrowdStrike Falcon Sensor', version: '7.14.18110', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/crowdstrike-falcon@7.14.18110', license: 'Commercial', origin: 'Third-party' },
  { name: 'Google Chrome', version: '138.0.7204.97', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/google-chrome@138.0.7204.97', license: 'Freeware', origin: 'Third-party' },
  { name: 'Mozilla Firefox', version: '141.0.2', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/mozilla-firefox@141.0.2', license: 'MPL-2.0', origin: 'Open-source' },
  { name: '7-Zip', version: '24.09', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/7zip@24.09', license: 'LGPL-2.1', origin: 'Open-source' },
  { name: 'Adobe Acrobat Reader DC', version: '25.001.20472', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/acrobat-reader-dc@25.001.20472', license: 'Commercial', origin: 'Third-party' },
  { name: 'Microsoft Office Professional Plus', version: '2019', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/microsoft-office@2019', license: 'Commercial', origin: 'Proprietary' },
  { name: 'nginx', version: '1.24.0', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/nginx@1.24.0', license: 'BSD-2-Clause', origin: 'Open-source' },
  { name: 'PostgreSQL', version: '15.6', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/postgresql@15.6', license: 'PostgreSQL', origin: 'Open-source' },
  { name: 'Redis', version: '7.2.4', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/redis@7.2.4', license: 'BSD-3-Clause', origin: 'Open-source' },
  { name: 'Apache Tomcat', version: '9.0.85', type: 'Application', ecosystem: 'Generic', purl: 'pkg:generic/apache-tomcat@9.0.85', license: 'Apache-2.0', origin: 'Open-source' },
  { name: 'OpenJDK Runtime', version: '17.0.10', type: 'Framework', ecosystem: 'Generic', purl: 'pkg:generic/openjdk@17.0.10', license: 'GPL-2.0-with-classpath-exception', origin: 'Open-source' },
  { name: 'Python', version: '3.11.8', type: 'Framework', ecosystem: 'Generic', purl: 'pkg:generic/python@3.11.8', license: 'PSF-2.0', origin: 'Open-source' },
  { name: 'Node.js', version: '20.11.1', type: 'Framework', ecosystem: 'Generic', purl: 'pkg:generic/nodejs@20.11.1', license: 'MIT', origin: 'Open-source' },
  { name: 'libcurl', version: '8.4.0', type: 'Library', ecosystem: 'Generic', purl: 'pkg:generic/libcurl@8.4.0', license: 'curl', origin: 'Open-source', cves: ['CVE-2026-21409'] },
];

export interface CryptoAsset {
  name: string;
  primitive: 'Cipher' | 'Hash' | 'Signature' | 'Key-agreement' | 'Certificate' | 'MAC';
  algorithm: string;
  keyLength: string;
  protocol: string;
  location: string;
  /** Post-quantum / policy posture — the reason a CBOM exists. */
  compliance: 'Compliant' | 'Deprecated' | 'Quantum-vulnerable';
  expiry: string | null;
}

const CBOM_CATALOG: CryptoAsset[] = [
  { name: 'TLS server certificate', primitive: 'Certificate', algorithm: 'RSA', keyLength: '2048 bit', protocol: 'TLS 1.2', location: 'LocalMachine\\My', compliance: 'Quantum-vulnerable', expiry: 'Mar 14, 2027' },
  { name: 'Session key exchange', primitive: 'Key-agreement', algorithm: 'ECDH P-256', keyLength: '256 bit', protocol: 'TLS 1.3', location: 'schannel', compliance: 'Quantum-vulnerable', expiry: null },
  { name: 'Payload encryption', primitive: 'Cipher', algorithm: 'AES-GCM', keyLength: '256 bit', protocol: 'TLS 1.3', location: 'bcrypt.dll', compliance: 'Compliant', expiry: null },
  { name: 'Legacy payload cipher', primitive: 'Cipher', algorithm: '3DES-CBC', keyLength: '168 bit', protocol: 'TLS 1.0', location: 'schannel', compliance: 'Deprecated', expiry: null },
  { name: 'Integrity digest', primitive: 'Hash', algorithm: 'SHA-256', keyLength: '256 bit', protocol: 'internal', location: 'bcrypt.dll', compliance: 'Compliant', expiry: null },
  { name: 'Legacy digest', primitive: 'Hash', algorithm: 'SHA-1', keyLength: '160 bit', protocol: 'internal', location: 'advapi32.dll', compliance: 'Deprecated', expiry: null },
  { name: 'Code-signing certificate', primitive: 'Certificate', algorithm: 'RSA', keyLength: '4096 bit', protocol: 'Authenticode', location: 'LocalMachine\\TrustedPublisher', compliance: 'Quantum-vulnerable', expiry: 'Sep 02, 2026' },
  { name: 'Token signature', primitive: 'Signature', algorithm: 'ECDSA P-384', keyLength: '384 bit', protocol: 'JWT ES384', location: '/opt/payments/keys', compliance: 'Quantum-vulnerable', expiry: null },
  { name: 'Message authentication', primitive: 'MAC', algorithm: 'HMAC-SHA256', keyLength: '256 bit', protocol: 'internal', location: 'bcrypt.dll', compliance: 'Compliant', expiry: null },
  { name: 'Disk volume encryption', primitive: 'Cipher', algorithm: 'AES-XTS', keyLength: '128 bit', protocol: 'BitLocker', location: 'fvevol.sys', compliance: 'Compliant', expiry: null },
  { name: 'Client certificate', primitive: 'Certificate', algorithm: 'RSA', keyLength: '2048 bit', protocol: 'mTLS', location: 'CurrentUser\\My', compliance: 'Quantum-vulnerable', expiry: 'Jan 21, 2027' },
  { name: 'Password derivation', primitive: 'Hash', algorithm: 'PBKDF2-HMAC-SHA256', keyLength: '256 bit', protocol: 'internal', location: '/opt/reporting/lib', compliance: 'Compliant', expiry: null },
];

export interface AiModel {
  name: string;
  provider: string;
  version: string;
  task: string;
  license: string;
  parameters: string;
  source: 'Hosted API' | 'Local weights' | 'Embedded';
  usage: string;
}

const AIBOM_CATALOG: AiModel[] = [
  { name: 'claude-sonnet-4-5', provider: 'Anthropic', version: '2025-09-29', task: 'Text generation', license: 'Commercial API', parameters: 'Undisclosed', source: 'Hosted API', usage: 'Ticket summarisation' },
  { name: 'text-embedding-3-large', provider: 'OpenAI', version: '3.0', task: 'Embeddings', license: 'Commercial API', parameters: 'Undisclosed', source: 'Hosted API', usage: 'Knowledge search index' },
  { name: 'all-MiniLM-L6-v2', provider: 'Sentence-Transformers', version: '2.2.2', task: 'Embeddings', license: 'Apache-2.0', parameters: '22.7 M', source: 'Local weights', usage: 'Duplicate-request detection' },
  { name: 'distilbert-base-uncased', provider: 'Hugging Face', version: '1.0', task: 'Classification', license: 'Apache-2.0', parameters: '66 M', source: 'Local weights', usage: 'Request category prediction' },
  { name: 'xgboost-anomaly', provider: 'Motadata', version: '4.1.2', task: 'Anomaly detection', license: 'Proprietary', parameters: '1.8 M', source: 'Embedded', usage: 'Endpoint behaviour scoring' },
  { name: 'whisper-small', provider: 'OpenAI', version: '1.0', task: 'Speech-to-text', license: 'MIT', parameters: '244 M', source: 'Local weights', usage: 'Call-log transcription' },
  { name: 'prophet-forecast', provider: 'Meta', version: '1.1.5', task: 'Forecasting', license: 'MIT', parameters: 'N/A', source: 'Embedded', usage: 'SLA breach prediction' },
  { name: 'yolov8n', provider: 'Ultralytics', version: '8.1.0', task: 'Object detection', license: 'AGPL-3.0', parameters: '3.2 M', source: 'Local weights', usage: 'Asset label recognition' },
];

// ---------------------------------------------------------------------------
// Products — the scan scopes on a host.
// ---------------------------------------------------------------------------

export interface BomProduct {
  key: string;
  name: string;
  /** null for the implicit OS scope — it has no product version of its own. */
  version: string | null;
  path: string;
  source: string;
  status: 'Scanned' | 'Pending' | 'Failed';
  lastScan: string;
  findings: number;
  /** Paths skipped under THIS product's root — exclusions are per-product, not host-wide. */
  excludePaths: string[];
  /** The scope whose versions the BOM tab lands on. Exactly one product per host. */
  isDefault?: boolean;
}

export const OS_PRODUCT_KEY = 'os-base';

const APP_PRODUCTS: { key: string; name: string; version: string; path: string }[] = [
  { key: 'payments-web', name: 'Payments Web', version: '2.4.1', path: '/opt/payments' },
  { key: 'reporting-service', name: 'Reporting Service', version: '3.1.0', path: '/opt/reporting' },
  { key: 'claims-portal', name: 'Claims Portal', version: '5.2.0', path: 'C:\\inetpub\\claims' },
  { key: 'ledger-api', name: 'Ledger API', version: '1.8.3', path: '/srv/ledger' },
  { key: 'identity-broker', name: 'Identity Broker', version: '2.0.7', path: '/opt/identity' },
];

// Dates used across the module — kept as a fixed spread so the demo never drifts.
const SCAN_DATES = ['Jun 16, 2026', 'Jun 15, 2026', 'Jun 14, 2026', 'Jun 12, 2026', 'Jun 09, 2026', 'Jun 04, 2026'];

/** Glob patterns a scan skips. Exclusions are configured per product, under its own root. */
const EXCLUDE_POOL = [
  '**/logs', '**/temp', '**/cache', '**/node_modules', '**/*.log', '**/*.tmp',
  'C:\\Windows\\Temp', 'C:\\pagefile.sys', '**/.git', '**/dist', '**/coverage', '**/vendor',
];

/** The exclude patterns configured on ONE product scope — deterministic per host + product. */
const productExcludePaths = (endpointId: string, productKey: string): string[] => {
  const h = hash(`${endpointId}:${productKey}:exclude`);
  const n = 2 + (h % 4); // 2-5 patterns per product
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = EXCLUDE_POOL[(h + i * 5) % EXCLUDE_POOL.length];
    if (!out.includes(p)) out.push(p);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Per-endpoint BOM record — what the BOM Inventory listing shows.
// ---------------------------------------------------------------------------

export interface BomRecord {
  endpointId: string;
  status: BomStatus;
  products: BomProduct[];
  /** Total SBOM components across every product on the host. */
  components: number;
  /** Vulnerable components found across the host. */
  findings: number;
  cryptoAssets: number;
  aiModels: number;
  lastGenerated: string | null;
}

/** How many components a given (endpoint, product, type) scope reports. */
export const componentCount = (endpointId: string, productKey: string, type: BomType): number => {
  const h = hash(`${endpointId}:${productKey}:${type}`);
  if (type === 'SBOM') return productKey === OS_PRODUCT_KEY ? 24 + (h % 190) : 42 + (h % 210);
  if (type === 'CBOM') return 3 + (h % 9);
  // AI BOM only exists where an application actually ships models.
  return productKey === OS_PRODUCT_KEY ? 0 : h % 6;
};

/** The BOM record for one endpoint — deterministic from its id. */
export const bomForEndpoint = (endpointId: string): BomRecord => {
  const h = hash(endpointId);
  // ~1 in 9 hosts has not produced a BOM yet; ~1 in 4 of the rest is mid-scan.
  const status: BomStatus = h % 9 === 0 ? 'Not Generated' : h % 4 === 0 ? 'Partial' : 'Generated';

  const appCount = status === 'Not Generated' ? 0 : h % 3; // 0-2 application products
  const products: BomProduct[] = [];
  for (let i = 0; i < appCount; i++) {
    const p = APP_PRODUCTS[(h + i * 7) % APP_PRODUCTS.length];
    if (products.some((x) => x.key === p.key)) continue;
    products.push({
      ...p,
      source: 'agent · directory scan',
      status: status === 'Partial' && i === appCount - 1 ? 'Pending' : 'Scanned',
      lastScan: SCAN_DATES[(h + i) % SCAN_DATES.length],
      findings: (hash(`${endpointId}:${p.key}:find`) % 5),
      excludePaths: productExcludePaths(endpointId, p.key),
    });
  }
  if (status !== 'Not Generated') {
    products.push({
      key: OS_PRODUCT_KEY,
      name: 'OS / base platform',
      version: null,
      path: '/',
      source: 'agent · directory scan',
      status: 'Scanned',
      lastScan: SCAN_DATES[h % SCAN_DATES.length],
      findings: hash(`${endpointId}:${OS_PRODUCT_KEY}:find`) % 4,
      excludePaths: productExcludePaths(endpointId, OS_PRODUCT_KEY),
    });
  }
  // Exactly one scope is the default — the one the BOM tab lands on. The OS scope is the
  // sensible default since every host has it and it rolls up everything unclaimed.
  const def = products.find((p) => p.key === OS_PRODUCT_KEY) ?? products[0];
  if (def) def.isDefault = true;

  const components = products.reduce((n, p) => n + componentCount(endpointId, p.key, 'SBOM'), 0);
  const cryptoAssets = products.reduce((n, p) => n + componentCount(endpointId, p.key, 'CBOM'), 0);
  const aiModels = products.reduce((n, p) => n + componentCount(endpointId, p.key, 'AI BOM'), 0);
  const findings = products.reduce((n, p) => n + p.findings, 0);

  // Host-level "last generated" = the newest current version across every product scope, so the
  // listing can never claim a date the detail page's timeline does not show.
  const currentDates = products
    .map((p) => bomVersions(endpointId, p.key, 'SBOM').find((v) => v.state === 'Current'))
    .filter(Boolean)
    .map((v) => v!.generatedAt.split(' ').slice(0, 3).join(' '));
  const lastGenerated = currentDates.length
    ? currentDates.reduce((a, b) => (SCAN_DATES.indexOf(a) <= SCAN_DATES.indexOf(b) ? a : b))
    : null;

  return { endpointId, status, products, components, findings, cryptoAssets, aiModels, lastGenerated };
};

/** BOM records for the whole fleet, in the Endpoints listing's order. */
export const bomInventory = (): BomRecord[] => mockEndpoints.map((e) => bomForEndpoint(e.id));

// ---------------------------------------------------------------------------
// Versions — a version only appears when a scan found a CHANGE.
// ---------------------------------------------------------------------------

export interface BomScanRun {
  timestamp: string;
  trigger: 'scheduled' | 'manual' | 'agent check-in';
  duration: string;
  result: 'Success' | 'Failed';
  outcome: string;
}

export interface BomVersion {
  v: number;
  generatedAt: string;
  state: 'Current' | 'Superseded';
  /** Human summary of what this version changed. */
  change: string;
  /** What this version changed vs the previous one — rendered as the card's finding dots.
   *  On v1 everything is "added", since the first scan discovers the whole inventory. */
  added: number;
  removed: number;
  updated: number;
  /** Known CVEs carried by what this version added or updated — the reason to read the change. */
  cves: number;
  format: string;
  /** Scan runs between this version and the previous one (newest first). */
  runs: BomScanRun[];
  /** Summary line rendered on the connector below the card. */
  gapLabel: string;
}

const TIMES = ['08:33 AM', '06:12 AM', '06:40 PM', '11:20 PM', '02:47 PM', '09:05 AM'];

/** The version history for one (endpoint, product, type) scope. */
export const bomVersions = (endpointId: string, productKey: string, type: BomType): BomVersion[] => {
  const total = componentCount(endpointId, productKey, type);
  if (total === 0) return [];
  const h = hash(`${endpointId}:${productKey}:${type}:versions`);
  // Every scope carries three versions, with v3 as the current one.
  const count = 3;
  const out: BomVersion[] = [];
  for (let i = count; i >= 1; i--) {
    const vh = hash(`${endpointId}:${productKey}:${type}:v${i}`);
    const isFirst = i === 1;
    // Take the counts from the SAME diff the Compare screen renders, so the card summary, the
    // scan outcome and the diff can never contradict each other. The first scan discovers the
    // whole inventory, so everything in it counts as added.
    const d = isFirst ? null : bomDiff(endpointId, productKey, type, i - 1, i);
    const added = d ? d.added.length : total;
    const removed = d ? d.removed.length : 0;
    const updatedN = d ? d.updated.length : 0;
    // CVEs ride in on what a version added or updated. The first scan discovers the whole
    // inventory, so it carries every CVE already present on the host.
    const cves = d
      ? [...d.added, ...d.updated].reduce((n, e) => n + (e.cves?.length ?? 0), 0)
      : (type === 'SBOM' ? bomComponents(endpointId, productKey).reduce((n, c) => n + (c.cves?.length ?? 0), 0) : 0);
    const gapScans = isFirst ? 1 : 1 + (vh % 3);
    const noChange = Math.max(0, gapScans - 1);
    // SCAN_DATES runs newest → oldest, so a HIGHER version number must take a LOWER index.
    const dateIdx = Math.min(SCAN_DATES.length - 1, (count - i) + (h % 3));
    const runs: BomScanRun[] = [];
    for (let r = 0; r < gapScans; r++) {
      const rh = hash(`${endpointId}:${productKey}:${type}:v${i}:r${r}`);
      const failed = !isFirst && r === gapScans - 1 && rh % 5 === 0;
      runs.push({
        // Runs in this gap sit at or just before the version they produced (newest run first).
        timestamp: `${SCAN_DATES[Math.min(SCAN_DATES.length - 1, dateIdx + r)]} ${TIMES[(rh + r) % TIMES.length]}`,
        trigger: rh % 3 === 0 ? 'manual' : rh % 3 === 1 ? 'scheduled' : 'agent check-in',
        duration: `${1 + (rh % 3)}m ${String(rh % 60).padStart(2, '0')}s`,
        result: failed ? 'Failed' : 'Success',
        outcome: failed ? '—' : r === 0 ? (isFirst ? `first ${type} generated` : `+${added}${removed ? ` · −${removed}` : ''} → v${i}`) : 'no change',
      });
    }
    out.push({
      v: i,
      // A version IS the output of its newest run, so it carries that run's timestamp.
      generatedAt: runs[0].timestamp,
      state: i === count ? 'Current' : 'Superseded',
      added,
      removed,
      updated: updatedN,
      cves,
      change: isFirst
        ? 'initial agent scan'
        : [
            added ? `+${added} component${added === 1 ? '' : 's'}` : null,
            updatedN ? `${updatedN} updated` : null,
            removed ? `${removed} removed` : null,
          ].filter(Boolean).join(' · ') || 'metadata only',
      format: 'CycloneDX 1.6',
      runs,
      gapLabel: isFirst
        ? `1 scan · initial agent scan, first ${type} generated`
        : `${gapScans} scan${gapScans === 1 ? '' : 's'} between v${i - 1} and v${i}${noChange ? ` · ${noChange} found no change` : ''}`,
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Component / crypto / model lists for one scope.
// ---------------------------------------------------------------------------

/** Deterministic slice of a catalog, capped at the catalog size (used where n never exceeds it). */
function slice<T>(catalog: T[], seed: number, n: number): T[] {
  const take = Math.min(n, catalog.length);
  return Array.from({ length: take }, (_, i) => catalog[(seed + i * 3) % catalog.length]);
}

/** Nudge a semver-ish string by `round`, so a repeated component reads as a different build. */
const variant = (v: string, round: number): string => {
  const parts = v.split('.');
  const last = parts.length - 1;
  const n = parseInt(parts[last].replace(/\D/g, ''), 10);
  if (isNaN(n)) return `${v}-${round}`;
  parts[last] = parts[last].replace(/\d+/, String(n + round));
  return parts.join('.');
};

/* A real host carries far more components than any hand-written catalog: hundreds of transitive
 * dependencies, and commonly several BUILDS of the same library side by side. So the catalog is
 * cycled to reach the reported count, bumping the version (and its PURL) on each pass — which is
 * what a large SBOM genuinely looks like, and keeps the count and the list in agreement. */
export const bomComponents = (endpointId: string, productKey: string): BomComponent[] => {
  const total = componentCount(endpointId, productKey, 'SBOM');
  const seed = hash(`${endpointId}:${productKey}:sbom`);
  const ep = mockEndpoints.find((e) => e.id === endpointId);
  const withOs = productKey === OS_PRODUCT_KEY && !!ep;
  const n = withOs ? Math.max(0, total - 1) : total; // the OS row counts toward the total

  const list: BomComponent[] = [];
  for (let i = 0; i < n; i++) {
    const base = SBOM_CATALOG[(seed + i) % SBOM_CATALOG.length];
    const round = Math.floor(((seed % SBOM_CATALOG.length) + i) / SBOM_CATALOG.length);
    if (round === 0) { list.push(base); continue; }
    const version = variant(base.version, round);
    list.push({ ...base, version, purl: base.purl.replace(/@[^@]*$/, `@${version}`) });
  }

  // The OS scope also reports the host OS itself, as the first component.
  if (withOs && ep) {
    list.unshift({
      name: ep.osName,
      version: ep.version ?? '—',
      type: 'Operating-System',
      ecosystem: 'Windows',
      purl: `pkg:generic/${ep.osName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@${ep.version ?? '0'}`,
      license: 'Proprietary',
      origin: 'Proprietary',
    });
  }
  return list;
};

export const bomCryptoAssets = (endpointId: string, productKey: string): CryptoAsset[] =>
  slice(CBOM_CATALOG, hash(`${endpointId}:${productKey}:cbom`), componentCount(endpointId, productKey, 'CBOM'));

export const bomAiModels = (endpointId: string, productKey: string): AiModel[] =>
  slice(AIBOM_CATALOG, hash(`${endpointId}:${productKey}:aibom`), componentCount(endpointId, productKey, 'AI BOM'));

// ---------------------------------------------------------------------------
// Version diff — powers the Compare versions modal.
// ---------------------------------------------------------------------------

export interface BomDiffEntry {
  kind: 'Added' | 'Updated' | 'Removed';
  name: string;
  ecosystem: string;
  version: string;
  /** Previous version — only on Updated rows. */
  fromVersion?: string;
  /** patch / minor / major — only on Updated rows. */
  bump?: 'patch' | 'minor' | 'major';
  cves?: string[];
}

export interface BomDiff {
  added: BomDiffEntry[];
  updated: BomDiffEntry[];
  removed: BomDiffEntry[];
  unchanged: number;
}

const bumpVersion = (v: string, kind: 'patch' | 'minor' | 'major'): string => {
  const parts = v.split('.');
  const idx = kind === 'major' ? 0 : kind === 'minor' ? 1 : 2;
  while (parts.length <= idx) parts.push('0');
  const n = parseInt(parts[idx].replace(/\D/g, ''), 10);
  parts[idx] = String((isNaN(n) ? 0 : n) + 1);
  for (let i = idx + 1; i < parts.length; i++) parts[i] = '0';
  return parts.join('.');
};

/** The diff between two versions of one scope. */
export const bomDiff = (endpointId: string, productKey: string, type: BomType, from: number, to: number): BomDiff => {
  const pool =
    type === 'SBOM'
      ? bomComponents(endpointId, productKey)
      : type === 'CBOM'
        ? bomCryptoAssets(endpointId, productKey).map((c) => ({ name: c.name, version: c.keyLength, ecosystem: c.algorithm, cves: undefined }))
        : bomAiModels(endpointId, productKey).map((m) => ({ name: m.name, version: m.version, ecosystem: m.provider, cves: undefined }));
  if (!pool.length) return { added: [], updated: [], removed: [], unchanged: 0 };

  const h = hash(`${endpointId}:${productKey}:${type}:${from}-${to}`);
  // Shifts MUST be unsigned (>>>): `hash` returns a full uint32, and the signed `>>` turns any
  // value above 2^31 negative, which made nUpdated 0 and nRemoved -1 — and Array.from({length:-1})
  // is silently empty, so updated/removed rows disappeared everywhere.
  const nAdded = 1 + (h % 3);
  const nUpdated = 1 + ((h >>> 3) % 2);
  const nRemoved = (h >>> 6) % 2;

  const pick = (offset: number, n: number) =>
    Array.from({ length: n }, (_, i) => pool[(h + offset + i * 5) % pool.length]);

  const added: BomDiffEntry[] = pick(11, nAdded).map((c) => ({
    kind: 'Added', name: c.name, ecosystem: (c as any).ecosystem, version: c.version, cves: (c as any).cves,
  }));
  const updated: BomDiffEntry[] = pick(41, nUpdated).map((c, i) => {
    const bump: 'patch' | 'minor' | 'major' = (h + i) % 5 === 0 ? 'major' : (h + i) % 3 === 0 ? 'minor' : 'patch';
    return {
      kind: 'Updated', name: c.name, ecosystem: (c as any).ecosystem,
      fromVersion: c.version, version: bumpVersion(c.version, bump), bump, cves: (c as any).cves,
    };
  });
  const removed: BomDiffEntry[] = pick(83, nRemoved).map((c) => ({
    kind: 'Removed', name: c.name, ecosystem: (c as any).ecosystem, version: c.version, cves: (c as any).cves,
  }));

  const unchanged = Math.max(0, pool.length - added.length - updated.length - removed.length);
  return { added, updated, removed, unchanged };
};

// ---------------------------------------------------------------------------
// Host-wide exclude paths — shared by every product scan on the host.
// ---------------------------------------------------------------------------

/** The exclude patterns that actually bit while scanning ONE component — i.e. paths under that
 *  component's own root that the scanner skipped. Deterministic, so the grid is stable. */
export const excludedPathsFor = (endpointId: string, productKey: string, componentName: string): string[] => {
  const h = hash(`${endpointId}:${productKey}:${componentName}:excl`);
  const n = 1 + (h % 4); // 1-4 patterns hit per component
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = EXCLUDE_POOL[(h + i * 3) % EXCLUDE_POOL.length];
    if (!out.includes(p)) out.push(p);
  }
  return out;
};

/** Products that can still be added to a host's scan config (not already scanned). */
export const availableProducts = (taken: string[]) => APP_PRODUCTS.filter((p) => !taken.includes(p.key));
