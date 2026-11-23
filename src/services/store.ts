import {
  AuditLog,
  Member,
  Outlet,
  Program,
  Redemption,
  StampCard,
  StampTransaction,
  Tenant,
  UserStaff
} from '../types';
import { sound } from '../utils/sound';

const STORAGE_KEY = 'stamppop_v1_database';
const BROADCAST_CHANNEL_NAME = 'stamppop_sync_channel';

// Initial pre-seeded mock database
const initialTenants: Tenant[] = [
  {
    id: 'tenant-kopi',
    name: 'Kopi Kenangan Senja',
    slug: 'kenangansenja',
    logo: '☕',
    primaryColor: '#c25e00',
    accentColor: '#f97316',
    category: 'cafe',
    status: 'active',
    plan: 'growth',
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'tenant-barber',
    name: 'BarberPop Studio',
    slug: 'barberpop',
    logo: '✂️',
    primaryColor: '#1e3a8a',
    accentColor: '#3b82f6',
    category: 'barbershop',
    status: 'active',
    plan: 'starter',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'tenant-clean',
    name: 'CleanAuto Express Wash',
    slug: 'cleanauto',
    logo: '🚗',
    primaryColor: '#065f46',
    accentColor: '#10b981',
    category: 'carwash',
    status: 'active',
    plan: 'saas',
    createdAt: '2026-11-01T10:00:00Z'
  }
];

const initialOutlets: Outlet[] = [
  {
    id: 'outlet-senopati',
    tenantId: 'tenant-kopi',
    name: 'Outlet Senopati (Jakarta Selatan)',
    address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
    timezone: 'Asia/Jakarta (WIB)',
    active: true
  },
  {
    id: 'outlet-bsd',
    tenantId: 'tenant-kopi',
    name: 'Outlet The Breeze (BSD City)',
    address: 'The Breeze BSD Unit L-12, Tangerang Selatan',
    timezone: 'Asia/Jakarta (WIB)',
    active: true
  },
  {
    id: 'outlet-barber-1',
    tenantId: 'tenant-barber',
    name: 'Cabang Kemang Raya',
    address: 'Jl. Kemang Raya No. 88, Jakarta Selatan',
    timezone: 'Asia/Jakarta (WIB)',
    active: true
  }
];

const initialStaff: UserStaff[] = [
  {
    id: 'staff-budi',
    tenantId: 'tenant-kopi',
    name: 'Bobi Prasetyo (Owner)',
    role: 'owner',
    pinHash: '1234',
    pinPlain: '1234',
    active: true
  },
  {
    id: 'staff-sari',
    tenantId: 'tenant-kopi',
    outletId: 'outlet-senopati',
    name: 'Sari Wulandari (Supervisor)',
    role: 'manager',
    pinHash: '2222',
    pinPlain: '2222',
    active: true
  },
  {
    id: 'staff-dimas',
    tenantId: 'tenant-kopi',
    outletId: 'outlet-senopati',
    name: 'Dimas Kasir',
    role: 'staff',
    pinHash: '1111',
    pinPlain: '1111',
    active: true
  },
  {
    id: 'staff-rian',
    tenantId: 'tenant-kopi',
    outletId: 'outlet-bsd',
    name: 'Rian Barista',
    role: 'staff',
    pinHash: '3333',
    pinPlain: '3333',
    active: true
  }
];

const initialPrograms: Program[] = [
  {
    id: 'prog-kopi-9',
    tenantId: 'tenant-kopi',
    name: 'Program Kopi Kenangan 9 Stamp',
    stampTarget: 9,
    rewardName: 'Gratis 1 Kopi Signature Aren Latte',
    validityDays: 180,
    minTransactionRp: 25000,
    ruleVersion: 1,
    active: true,
    terms: [
      'Dapatkan 1 stamp untuk setiap pembelian minimal Rp 25.000.',
      'Kumpulkan 9 stamp untuk menukarkan 1 Kopi Signature Aren Latte gratis.',
      'Maksimum pemberian 1 stamp per 15 menit per member.',
      'Reward tidak dapat diuangkan dan berlaku di seluruh outlet Kopi Kenangan Senja.'
    ]
  },
  {
    id: 'prog-barber-8',
    tenantId: 'tenant-barber',
    name: 'Gentlemen Haircut Reward',
    stampTarget: 8,
    rewardName: 'Gratis 1x Premium Cut & Tonic',
    validityDays: 365,
    minTransactionRp: 75000,
    ruleVersion: 1,
    active: true,
    terms: [
      '1 stamp per kunjungan potong rambut.',
      'Kumpulkan 8 stamp untuk gratis 1x potong + tonik herbal.'
    ]
  }
];

const initialMembers: Member[] = [
  {
    id: 'mem-1',
    tenantId: 'tenant-kopi',
    name: 'Siti Nurhaliza',
    whatsapp: '+6281298765432',
    consentAt: '2026-11-10T11:00:00Z',
    consentSource: 'qr_poster',
    tokenQr: 'STP-KENANGA-SITI77',
    isGuest: false,
    createdAt: '2026-11-10T11:00:00Z'
  },
  {
    id: 'mem-2',
    tenantId: 'tenant-kopi',
    name: 'Ahmad Fauzi',
    whatsapp: '+6281311223344',
    consentAt: '2026-11-05T14:30:00Z',
    consentSource: 'qr_poster',
    tokenQr: 'STP-KENANGA-AHMAD99',
    isGuest: false,
    createdAt: '2026-11-05T14:30:00Z'
  },
  {
    id: 'mem-3',
    tenantId: 'tenant-kopi',
    name: 'Rina Wijaya',
    whatsapp: '+6285712345678',
    consentAt: '2026-11-18T09:15:00Z',
    consentSource: 'qr_poster',
    tokenQr: 'STP-KENANGA-RINA22',
    isGuest: false,
    createdAt: '2026-11-18T09:15:00Z'
  },
  {
    id: 'mem-4',
    tenantId: 'tenant-kopi',
    name: 'Tamu Senopati #401',
    whatsapp: '',
    consentAt: '2026-11-22T16:00:00Z',
    consentSource: 'qr_poster',
    tokenQr: 'STP-KENANGA-GUEST401',
    isGuest: true,
    createdAt: '2026-11-22T16:00:00Z'
  }
];

const initialCards: StampCard[] = [
  {
    id: 'card-1',
    tenantId: 'tenant-kopi',
    memberId: 'mem-1',
    programId: 'prog-kopi-9',
    saldoStamp: 7,
    cycleCount: 1,
    status: 'active',
    walletSerial: 'STP-WL-7001',
    createdAt: '2026-11-10T11:00:00Z',
    updatedAt: '2026-11-22T10:00:00Z'
  },
  {
    id: 'card-2',
    tenantId: 'tenant-kopi',
    memberId: 'mem-2',
    programId: 'prog-kopi-9',
    saldoStamp: 9,
    cycleCount: 1,
    status: 'active',
    walletSerial: 'STP-WL-7002',
    createdAt: '2026-11-05T14:30:00Z',
    updatedAt: '2026-11-23T09:00:00Z'
  },
  {
    id: 'card-3',
    tenantId: 'tenant-kopi',
    memberId: 'mem-3',
    programId: 'prog-kopi-9',
    saldoStamp: 2,
    cycleCount: 1,
    status: 'active',
    walletSerial: 'STP-WL-7003',
    createdAt: '2026-11-18T09:15:00Z',
    updatedAt: '2026-11-20T14:00:00Z'
  },
  {
    id: 'card-4',
    tenantId: 'tenant-kopi',
    memberId: 'mem-4',
    programId: 'prog-kopi-9',
    saldoStamp: 3,
    cycleCount: 1,
    status: 'active',
    walletSerial: 'STP-WL-7004',
    createdAt: '2026-11-22T16:00:00Z',
    updatedAt: '2026-11-22T16:05:00Z'
  }
];

const initialTransactions: StampTransaction[] = [
  {
    id: 'tx-101',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-dimas',
    staffName: 'Dimas Kasir',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 32000,
    createdAt: '2026-11-10T11:05:00Z'
  },
  {
    id: 'tx-102',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-dimas',
    staffName: 'Dimas Kasir',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 45000,
    createdAt: '2026-11-12T14:10:00Z'
  },
  {
    id: 'tx-103',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-sari',
    staffName: 'Sari Wulandari',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 28000,
    createdAt: '2026-11-15T16:20:00Z'
  },
  {
    id: 'tx-104',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-bsd',
    staffId: 'staff-rian',
    staffName: 'Rian Barista',
    outletName: 'Outlet The Breeze (BSD)',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 35000,
    createdAt: '2026-11-18T10:45:00Z'
  },
  {
    id: 'tx-105',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-dimas',
    staffName: 'Dimas Kasir',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 38000,
    createdAt: '2026-11-20T12:00:00Z'
  },
  {
    id: 'tx-106',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-dimas',
    staffName: 'Dimas Kasir',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 30000,
    createdAt: '2026-11-21T15:30:00Z'
  },
  {
    id: 'tx-107',
    tenantId: 'tenant-kopi',
    cardId: 'card-1',
    memberId: 'mem-1',
    outletId: 'outlet-senopati',
    staffId: 'staff-sari',
    staffName: 'Sari Wulandari',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 1,
    transactionValue: 40000,
    createdAt: '2026-11-22T10:00:00Z'
  },
  // Ahmad 9 stamps
  {
    id: 'tx-201',
    tenantId: 'tenant-kopi',
    cardId: 'card-2',
    memberId: 'mem-2',
    outletId: 'outlet-senopati',
    staffId: 'staff-dimas',
    staffName: 'Dimas Kasir',
    outletName: 'Outlet Senopati',
    type: 'STAMP_ADD',
    amount: 9,
    transactionValue: 310000,
    createdAt: '2026-11-23T09:00:00Z'
  }
];

const initialRedemptions: Redemption[] = [];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    tenantId: 'tenant-kopi',
    actorName: 'Bobi Prasetyo',
    actorRole: 'owner',
    action: 'CREATE_PROGRAM',
    entity: 'Program Kopi Kenangan 9 Stamp',
    details: 'Target 9 stamps, Reward: Kopi Signature Aren Latte',
    createdAt: '2026-10-01T08:30:00Z'
  }
];

interface AppDatabase {
  tenants: Tenant[];
  outlets: Outlet[];
  staff: UserStaff[];
  programs: Program[];
  members: Member[];
  cards: StampCard[];
  transactions: StampTransaction[];
  redemptions: Redemption[];
  auditLogs: AuditLog[];
  currentTenantId: string;
}

class StoreService {
  private db: AppDatabase;
  private channel: BroadcastChannel | null = null;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.db = this.loadFromStorage();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC') {
          this.db = this.loadFromStorage();
          this.notify();
        }
      };
    }
  }

  private loadFromStorage(): AppDatabase {
    if (typeof window === 'undefined') {
      return this.getDefaultDb();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    const defaultData = this.getDefaultDb();
    this.saveToStorage(defaultData);
    return defaultData;
  }

  private getDefaultDb(): AppDatabase {
    return {
      tenants: initialTenants,
      outlets: initialOutlets,
      staff: initialStaff,
      programs: initialPrograms,
      members: initialMembers,
      cards: initialCards,
      transactions: initialTransactions,
      redemptions: initialRedemptions,
      auditLogs: initialAuditLogs,
      currentTenantId: 'tenant-kopi'
    };
  }

  private saveToStorage(data: AppDatabase) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Storage quota or error:', err);
      }
    }
  }

  private commit() {
    this.saveToStorage(this.db);
    this.notify();
    if (this.channel) {
      this.channel.postMessage({ type: 'SYNC', timestamp: Date.now() });
    }
  }

  subscribe(listener: () => void) {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify() {
    this.subscribers.forEach((fn) => fn());
  }

  // --- Multi-Tenant Context ---
  getCurrentTenant(): Tenant {
    return (
      this.db.tenants.find((t) => t.id === this.db.currentTenantId) ||
      this.db.tenants[0]
    );
  }

  setCurrentTenant(tenantId: string) {
    this.db.currentTenantId = tenantId;
    this.commit();
  }

  getAllTenants(): Tenant[] {
    return this.db.tenants;
  }

  updateTenant(tenant: Partial<Tenant> & { id: string }) {
    this.db.tenants = this.db.tenants.map((t) =>
      t.id === tenant.id ? { ...t, ...tenant } : t
    );
    this.commit();
  }

  // --- Outlets ---
  getOutlets(tenantId?: string): Outlet[] {
    const tid = tenantId || this.db.currentTenantId;
    return this.db.outlets.filter((o) => o.tenantId === tid);
  }

  addOutlet(name: string, address: string): Outlet {
    const newOutlet: Outlet = {
      id: `outlet-${Date.now()}`,
      tenantId: this.db.currentTenantId,
      name,
      address,
      timezone: 'Asia/Jakarta (WIB)',
      active: true
    };
    this.db.outlets.push(newOutlet);
    this.commit();
    return newOutlet;
  }

  // --- Staff & Authentication ---
  getStaffList(tenantId?: string): UserStaff[] {
    const tid = tenantId || this.db.currentTenantId;
    return this.db.staff.filter((s) => s.tenantId === tid);
  }

  verifyStaffPin(pin: string, tenantId?: string): UserStaff | null {
    const tid = tenantId || this.db.currentTenantId;
    const staff = this.db.staff.find(
      (s) => s.tenantId === tid && s.active && (s.pinHash === pin || s.pinPlain === pin)
    );
    return staff || null;
  }

  addStaff(name: string, role: UserStaff['role'], pin: string, outletId?: string): UserStaff {
    const newStaff: UserStaff = {
      id: `staff-${Date.now()}`,
      tenantId: this.db.currentTenantId,
      name,
      role,
      pinHash: pin,
      pinPlain: pin,
      outletId,
      active: true
    };
    this.db.staff.push(newStaff);
    this.addAudit('Tambah Staf Baru', 'UserStaff', `${name} (${role}) dengan PIN dibuat`);
    this.commit();
    return newStaff;
  }

  // --- Programs ---
  getActiveProgram(tenantId?: string): Program {
    const tid = tenantId || this.db.currentTenantId;
    const prog = this.db.programs.find((p) => p.tenantId === tid && p.active);
    if (prog) return prog;
    // Fallback default
    const fallback: Program = {
      id: `prog-${tid}`,
      tenantId: tid,
      name: 'Program Loyalitas Utama',
      stampTarget: 9,
      rewardName: 'Gratis 1 Produk Spesial',
      validityDays: 180,
      minTransactionRp: 25000,
      ruleVersion: 1,
      active: true,
      terms: ['1 stamp per transaksi.', 'Kumpulkan stamp untuk menukar reward.']
    };
    this.db.programs.push(fallback);
    this.commit();
    return fallback;
  }

  updateProgram(prog: Partial<Program> & { id: string }) {
    this.db.programs = this.db.programs.map((p) =>
      p.id === prog.id ? { ...p, ...prog, ruleVersion: p.ruleVersion + 1 } : p
    );
    this.addAudit('Update Aturan Program', 'Program', `Versi aturan diperbarui`);
    this.commit();
  }

  // --- Members & Stamp Cards ---
  getMemberByToken(token: string): { member: Member; card: StampCard; program: Program; tenant: Tenant } | null {
    const trimmed = token.trim();
    const member = this.db.members.find((m) => m.tokenQr === trimmed || m.id === trimmed);
    if (!member) return null;

    const tenant = this.db.tenants.find((t) => t.id === member.tenantId) || this.getCurrentTenant();
    const program = this.getActiveProgram(member.tenantId);
    let card = this.db.cards.find((c) => c.memberId === member.id && c.programId === program.id);

    if (!card) {
      card = {
        id: `card-${Date.now()}`,
        tenantId: member.tenantId,
        memberId: member.id,
        programId: program.id,
        saldoStamp: 0,
        cycleCount: 1,
        status: 'active',
        walletSerial: `STP-WL-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.db.cards.push(card);
      this.commit();
    }

    return { member, card, program, tenant };
  }

  getMemberByWhatsApp(phone: string, tenantId?: string): { member: Member; card: StampCard } | null {
    const tid = tenantId || this.db.currentTenantId;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const member = this.db.members.find(
      (m) => m.tenantId === tid && (m.whatsapp === cleanPhone || m.whatsapp.endsWith(cleanPhone))
    );
    if (!member) return null;
    const res = this.getMemberByToken(member.tokenQr);
    return res ? { member: res.member, card: res.card } : null;
  }

  enrollMember(params: {
    tenantId: string;
    name: string;
    whatsapp: string;
    isGuest?: boolean;
    source?: 'qr_poster' | 'staff_enroll' | 'web';
  }): { member: Member; card: StampCard } {
    const tid = params.tenantId || this.db.currentTenantId;
    const tenant = this.db.tenants.find((t) => t.id === tid) || this.getCurrentTenant();

    // Check if phone already registered in this tenant
    if (!params.isGuest && params.whatsapp) {
      const existing = this.getMemberByWhatsApp(params.whatsapp, tid);
      if (existing) {
        return existing;
      }
    }

    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tokenQr = `STP-${tenant.slug.substring(0, 5).toUpperCase()}-${randomStr}`;

    const member: Member = {
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tid,
      name: params.name || (params.isGuest ? `Tamu #${randomStr}` : 'Pelanggan Setia'),
      whatsapp: params.whatsapp || '',
      consentAt: new Date().toISOString(),
      consentSource: params.source || 'qr_poster',
      tokenQr,
      isGuest: Boolean(params.isGuest),
      createdAt: new Date().toISOString()
    };

    const program = this.getActiveProgram(tid);

    const card: StampCard = {
      id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: tid,
      memberId: member.id,
      programId: program.id,
      saldoStamp: 0,
      cycleCount: 1,
      status: 'active',
      walletSerial: `STP-WL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.members.push(member);
    this.db.cards.push(card);
    this.addAudit('Pendaftaran Member Baru', 'Member', `${member.name} (${member.whatsapp || 'Tamu'})`);
    this.commit();

    return { member, card };
  }

  // --- Transactions & Anti-Fraud Engine ---
  addStamp(params: {
    memberToken: string;
    staffPin: string;
    outletId: string;
    amount?: number;
    transactionValue?: number;
    bypassRateLimit?: boolean;
  }): { success: boolean; message: string; card?: StampCard; member?: Member } {
    const staff = this.verifyStaffPin(params.staffPin);
    if (!staff) {
      sound.playWarning();
      return { success: false, message: 'PIN staf tidak valid! Masukkan 4 digit PIN yang benar.' };
    }

    const data = this.getMemberByToken(params.memberToken);
    if (!data) {
      sound.playWarning();
      return { success: false, message: 'QR Member tidak ditemukan atau tidak valid.' };
    }

    const { member, card, program, tenant } = data;

    // Multi-tenant check: ensure card belongs to this staff's tenant
    if (staff.tenantId !== tenant.id) {
      sound.playWarning();
      return { success: false, message: 'QR Member ini berasal dari merchant lain. Ditolak.' };
    }

    const stampCount = params.amount || 1;

    // Anti-Fraud: 15-minute rate limit per member per program (FR-20)
    if (!params.bypassRateLimit) {
      const recentTx = this.db.transactions
        .filter(
          (t) =>
            t.cardId === card.id &&
            t.type === 'STAMP_ADD'
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (recentTx) {
        const diffMinutes = (Date.now() - new Date(recentTx.createdAt).getTime()) / (1000 * 60);
        if (diffMinutes < 15) {
          const waitMins = Math.ceil(15 - diffMinutes);
          sound.playWarning();
          return {
            success: false,
            message: `[Anti-Fraud] Member baru saja menerima stamp ${Math.floor(diffMinutes)} menit lalu. Harap tunggu ${waitMins} menit lagi atau hubungi Manager.`
          };
        }
      }
    }

    const outlet = this.db.outlets.find((o) => o.id === params.outletId) || this.getOutlets()[0];

    // Immutable transaction record
    const tx: StampTransaction = {
      id: `tx-${Date.now()}`,
      tenantId: tenant.id,
      cardId: card.id,
      memberId: member.id,
      outletId: outlet.id,
      staffId: staff.id,
      staffName: staff.name,
      outletName: outlet.name,
      type: 'STAMP_ADD',
      amount: stampCount,
      transactionValue: params.transactionValue,
      createdAt: new Date().toISOString()
    };

    this.db.transactions.push(tx);

    // Ledger Single Source of Truth: update saldo_stamp
    card.saldoStamp += stampCount;
    card.updatedAt = new Date().toISOString();

    sound.playStampSuccess();
    this.commit();

    return {
      success: true,
      message: `Berhasil menambahkan ${stampCount} stamp untuk ${member.name}!`,
      card,
      member
    };
  }

  redeemReward(params: {
    memberToken: string;
    staffPin: string;
    outletId: string;
  }): { success: boolean; message: string; card?: StampCard; member?: Member } {
    const staff = this.verifyStaffPin(params.staffPin);
    if (!staff) {
      sound.playWarning();
      return { success: false, message: 'PIN staf tidak valid!' };
    }

    const data = this.getMemberByToken(params.memberToken);
    if (!data) {
      sound.playWarning();
      return { success: false, message: 'Kartu member tidak ditemukan.' };
    }

    const { member, card, program, tenant } = data;

    if (card.saldoStamp < program.stampTarget) {
      sound.playWarning();
      return {
        success: false,
        message: `Stamp belum mencukupi! Saat ini ${card.saldoStamp}/${program.stampTarget} stamp.`
      };
    }

    const outlet = this.db.outlets.find((o) => o.id === params.outletId) || this.getOutlets()[0];

    // Record immutable Redemption
    const redemption: Redemption = {
      id: `rdm-${Date.now()}`,
      tenantId: tenant.id,
      cardId: card.id,
      memberId: member.id,
      memberName: member.name,
      programId: program.id,
      outletId: outlet.id,
      staffId: staff.id,
      rewardName: program.rewardName,
      redeemedAt: new Date().toISOString()
    };
    this.db.redemptions.push(redemption);

    // Record ledger transaction: REDEEM
    const tx: StampTransaction = {
      id: `tx-${Date.now()}`,
      tenantId: tenant.id,
      cardId: card.id,
      memberId: member.id,
      outletId: outlet.id,
      staffId: staff.id,
      staffName: staff.name,
      outletName: outlet.name,
      type: 'REDEEM',
      amount: -program.stampTarget,
      reason: `Penukaran reward: ${program.rewardName}`,
      createdAt: new Date().toISOString()
    };
    this.db.transactions.push(tx);

    // Reset cycle for next round without deleting history
    card.saldoStamp = Math.max(0, card.saldoStamp - program.stampTarget);
    card.cycleCount += 1;
    card.updatedAt = new Date().toISOString();

    sound.playRedeemCelebration();
    this.addAudit('Penukaran Reward', 'Redemption', `${member.name} menukar ${program.rewardName} di ${outlet.name}`);
    this.commit();

    return {
      success: true,
      message: `Selamat! Reward "${program.rewardName}" berhasil ditukarkan untuk ${member.name}!`,
      card,
      member
    };
  }

  correctStamp(params: {
    transactionId: string;
    managerPin: string;
    reason: string;
  }): { success: boolean; message: string } {
    const staff = this.verifyStaffPin(params.managerPin);
    if (!staff || (staff.role !== 'owner' && staff.role !== 'manager')) {
      return { success: false, message: 'Hanya Owner atau Manager yang berhak melakukan koreksi stamp.' };
    }

    const originalTx = this.db.transactions.find((t) => t.id === params.transactionId);
    if (!originalTx) {
      return { success: false, message: 'Transaksi yang ingin dikoreksi tidak ditemukan.' };
    }

    if (!params.reason || params.reason.trim().length < 4) {
      return { success: false, message: 'Alasan koreksi wajib diisi minimal 4 karakter.' };
    }

    const card = this.db.cards.find((c) => c.id === originalTx.cardId);
    if (!card) {
      return { success: false, message: 'Kartu tidak ditemukan.' };
    }

    // Append-only correction ledger transaction
    const reversalAmount = -originalTx.amount;
    const correctionTx: StampTransaction = {
      id: `tx-corr-${Date.now()}`,
      tenantId: originalTx.tenantId,
      cardId: originalTx.cardId,
      memberId: originalTx.memberId,
      outletId: originalTx.outletId,
      staffId: staff.id,
      staffName: staff.name,
      outletName: originalTx.outletName,
      type: 'CORRECTION',
      amount: reversalAmount,
      reason: `Koreksi: ${params.reason} (Ref Tx: ${originalTx.id})`,
      createdAt: new Date().toISOString()
    };

    this.db.transactions.push(correctionTx);
    card.saldoStamp = Math.max(0, card.saldoStamp + reversalAmount);
    card.updatedAt = new Date().toISOString();

    this.addAudit(
      'Koreksi Transaksi Stamp',
      'StampTransaction',
      `Koreksi Tx #${originalTx.id} oleh ${staff.name}. Alasan: ${params.reason}`
    );
    this.commit();

    return { success: true, message: `Koreksi berhasil. Saldo kartu disesuaikan sebesar ${reversalAmount > 0 ? '+' : ''}${reversalAmount}.` };
  }

  // --- Transactions & Member history ---
  getMemberTransactions(cardId: string): StampTransaction[] {
    return this.db.transactions
      .filter((t) => t.cardId === cardId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllTransactions(tenantId?: string): StampTransaction[] {
    const tid = tenantId || this.db.currentTenantId;
    return this.db.transactions
      .filter((t) => t.tenantId === tid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllMembers(tenantId?: string): { member: Member; card: StampCard }[] {
    const tid = tenantId || this.db.currentTenantId;
    const prog = this.getActiveProgram(tid);
    return this.db.members
      .filter((m) => m.tenantId === tid)
      .map((m) => {
        const card = this.db.cards.find((c) => c.memberId === m.id && c.programId === prog.id) || {
          id: `card-${m.id}`,
          tenantId: tid,
          memberId: m.id,
          programId: prog.id,
          saldoStamp: 0,
          cycleCount: 1,
          status: 'active',
          walletSerial: 'STP-WL-0000',
          createdAt: m.createdAt,
          updatedAt: m.createdAt
        };
        return { member: m, card };
      });
  }

  getAuditLogs(tenantId?: string): AuditLog[] {
    const tid = tenantId || this.db.currentTenantId;
    return this.db.auditLogs
      .filter((a) => a.tenantId === tid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private addAudit(action: string, entity: string, details: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      tenantId: this.db.currentTenantId,
      actorName: 'Sistem / Bobi Prasetyo',
      actorRole: 'owner',
      action,
      entity,
      details,
      createdAt: new Date().toISOString()
    };
    this.db.auditLogs.push(log);
  }

  // --- Export Data ---
  exportCsv(type: 'members' | 'transactions', tenantId?: string): string {
    const tid = tenantId || this.db.currentTenantId;
    this.addAudit('Export CSV', type.toUpperCase(), `Export file ${type}.csv oleh pengguna`);
    this.commit();

    if (type === 'members') {
      const members = this.getAllMembers(tid);
      const headers = ['ID', 'Nama', 'Nomor WhatsApp', 'Status', 'Saldo Stamp', 'Siklus Reward', 'Tanggal Daftar'];
      const rows = members.map(({ member, card }) => [
        member.id,
        `"${member.name}"`,
        member.whatsapp || 'Tamu',
        member.isGuest ? 'Tamu' : 'Terdaftar',
        card.saldoStamp,
        card.cycleCount,
        member.createdAt
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      const txs = this.getAllTransactions(tid);
      const headers = ['ID Transaksi', 'Member ID', 'Tipe', 'Stamp (+/-)', 'Outlet', 'Staf', 'Nilai Transaksi (Rp)', 'Alasan', 'Waktu'];
      const rows = txs.map((t) => [
        t.id,
        t.memberId,
        t.type,
        t.amount,
        `"${t.outletName}"`,
        `"${t.staffName}"`,
        t.transactionValue || 0,
        `"${t.reason || ''}"`,
        t.createdAt
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
  }

  resetToDefault() {
    this.db = this.getDefaultDb();
    this.commit();
  }
}

export const store = new StoreService();
