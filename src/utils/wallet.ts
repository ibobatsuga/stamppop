import JSZip from 'jszip';
import { Member, Program, StampCard, Tenant } from '../types';

export async function generateAppleWalletPass(
  tenant: Tenant,
  program: Program,
  member: Member,
  card: StampCard
): Promise<Blob> {
  const zip = new JSZip();

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.stamppop.loyalty",
    serialNumber: card.walletSerial || `STP-${card.id}`,
    teamIdentifier: "FLUXYTEAM",
    organizationName: tenant.name,
    description: `${tenant.name} - Kartu Stamp Loyalitas`,
    logoText: tenant.name,
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: tenant.primaryColor || "rgb(220, 97, 56)",
    labelColor: "rgba(255, 255, 255, 0.75)",
    storeCard: {
      headerFields: [
        {
          key: "stamps",
          label: "STAMP",
          value: `${card.saldoStamp}/${program.stampTarget}`,
          textAlignment: "PKTextAlignmentRight"
        }
      ],
      primaryFields: [
        {
          key: "reward",
          label: "TARGET REWARD",
          value: program.rewardName
        }
      ],
      secondaryFields: [
        {
          key: "member",
          label: "MEMBER",
          value: member.name
        },
        {
          key: "cycle",
          label: "SIKLUS",
          value: `Ke-${card.cycleCount}`
        }
      ],
      auxiliaryFields: [
        {
          key: "remaining",
          label: "KURANG",
          value: `${Math.max(0, program.stampTarget - card.saldoStamp)} stamp lagi`
        },
        {
          key: "status",
          label: "STATUS",
          value: card.saldoStamp >= program.stampTarget ? "REWARD SIAP DITUKAR!" : "Sedang Berjalan"
        }
      ],
      backFields: [
        {
          key: "terms",
          label: "Syarat & Ketentuan",
          value: program.terms.join("\n") || "Tunjukkan kartu ini kepada kasir saat transaksi untuk mendapatkan stamp."
        },
        {
          key: "anti-fraud",
          label: "Keamanan Stamp",
          value: "Batas 1 pemberian stamp per 15 menit. Dilindungi enkripsi sistem StampPop."
        },
        {
          key: "tenant",
          label: "Merchant Resmi",
          value: `${tenant.name} • Didukung oleh StampPop by Fluxy`
        }
      ]
    },
    barcode: {
      message: member.tokenQr,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: member.whatsapp || member.name
    },
    barcodes: [
      {
        message: member.tokenQr,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: member.whatsapp || member.name
      }
    ]
  };

  const passJsonStr = JSON.stringify(passJson, null, 2);
  zip.file("pass.json", passJsonStr);

  // Generate transparent 1x1 or SVG icon mock
  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" rx="12" fill="${tenant.primaryColor || '#dc6138'}"/>
    <text x="30" y="38" font-size="28" font-family="sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">★</text>
  </svg>`;
  zip.file("icon.svg", dummySvg);
  zip.file("logo.svg", dummySvg);

  // Manifest
  const manifest = {
    "pass.json": "manifest_sha1_hash_placeholder",
    "icon.svg": "icon_sha1_hash_placeholder"
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.apple.pkpass" });
}

export function generateGoogleWalletUrl(
  tenant: Tenant,
  program: Program,
  member: Member,
  card: StampCard
): string {
  // Simulates a Google Wallet Save JWT link with query params
  const payload = {
    iss: "stamppop-service-acc@fluxy.iam.gserviceaccount.com",
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [window.location.origin],
    loyaltyObject: {
      id: `${tenant.slug}.${card.id}`,
      classId: `${tenant.slug}.loyalty_program`,
      state: "active",
      accountId: member.id,
      accountName: member.name,
      barcode: {
        type: "qrCode",
        value: member.tokenQr,
        alternateText: member.whatsapp
      },
      loyaltyPoints: {
        balance: {
          int: card.saldoStamp
        },
        label: "Stamp Terkumpul"
      },
      secondaryLoyaltyPoints: {
        balance: {
          int: program.stampTarget
        },
        label: "Target Hadiah"
      }
    }
  };

  const encoded = btoa(JSON.stringify(payload));
  return `https://pay.google.com/gp/v/save/${encoded}`;
}
