import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Invoice } from "@prisma/client";
import { computeTotals, lineTotal, parseLines } from "@/lib/invoices";

const ORANGE = "#e8830c";
const DARK = "#1c1c1e";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: DARK,
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  logo: { height: 34, objectFit: "contain" },
  brandText: { fontSize: 22, fontFamily: "Helvetica-Bold", color: ORANGE },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  invoiceNumber: { fontSize: 11, color: MUTED, textAlign: "right", marginTop: 2 },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  party: { width: "48%" },
  partyLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  metaRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  metaItem: {},
  metaLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
  table: { marginTop: 6, borderTopWidth: 1, borderTopColor: DARK },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    paddingVertical: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 6,
  },
  colDesc: { width: "42%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "16%", textAlign: "right" },
  colVat: { width: "12%", textAlign: "right" },
  colSum: { width: "18%", textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totals: { width: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DARK,
  },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: ORANGE },
  payBox: {
    marginTop: 26,
    padding: 12,
    backgroundColor: "#faf6f0",
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 3,
  },
  note: { marginTop: 16, fontSize: 8.5, color: MUTED },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
  },
});

const eur = (n: number) =>
  new Intl.NumberFormat("et-EE", { minimumFractionDigits: 2 }).format(n) + " €";

const dateEt = (d: Date) =>
  new Intl.DateTimeFormat("et-EE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Tallinn",
  }).format(d);

export interface InvoicePdfSettings {
  business_name: string;
  business_reg: string;
  business_vat_no: string;
  business_address: string;
  contact_phone_info: string;
  contact_email: string;
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  invoice_note: string;
  logo_url: string;
}

function InvoiceDocument({
  invoice,
  settings,
}: {
  invoice: Invoice;
  settings: InvoicePdfSettings;
}) {
  const lines = parseLines(invoice.lines);
  const totals = computeTotals(lines);

  return (
    <Document title={`Arve ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            {settings.logo_url ? (
              <Image src={settings.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.brandText}>romu.ee</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>ARVE</Text>
            <Text style={styles.invoiceNumber}>nr {invoice.number}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Müüja</Text>
            <Text style={styles.partyName}>{settings.business_name}</Text>
            {settings.business_reg ? <Text>Reg nr: {settings.business_reg}</Text> : null}
            {settings.business_vat_no ? (
              <Text>KMKR: {settings.business_vat_no}</Text>
            ) : null}
            {settings.business_address ? <Text>{settings.business_address}</Text> : null}
            {settings.contact_phone_info ? (
              <Text>{settings.contact_phone_info}</Text>
            ) : null}
            {settings.contact_email ? <Text>{settings.contact_email}</Text> : null}
          </View>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Ostja</Text>
            <Text style={styles.partyName}>{invoice.buyerName}</Text>
            {invoice.buyerCompany ? <Text>{invoice.buyerCompany}</Text> : null}
            {invoice.buyerRegCode ? <Text>Reg nr: {invoice.buyerRegCode}</Text> : null}
            {invoice.buyerAddress ? <Text>{invoice.buyerAddress}</Text> : null}
            {invoice.buyerEmail ? <Text>{invoice.buyerEmail}</Text> : null}
            {invoice.buyerPhone ? <Text>{invoice.buyerPhone}</Text> : null}
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Kuupäev</Text>
            <Text style={styles.metaValue}>{dateEt(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Maksetähtaeg</Text>
            <Text style={styles.metaValue}>{dateEt(invoice.dueDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Viitenumber</Text>
            <Text style={styles.metaValue}>{invoice.number}</Text>
          </View>
        </View>

        {/* Lines */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.colDesc}>Nimetus</Text>
            <Text style={styles.colQty}>Kogus</Text>
            <Text style={styles.colPrice}>Hind</Text>
            <Text style={styles.colVat}>KM %</Text>
            <Text style={styles.colSum}>Summa</Text>
          </View>
          {lines.map((line, i) => (
            <View style={styles.tr} key={i}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>
                {line.qty} {line.unit}
              </Text>
              <Text style={styles.colPrice}>{eur(line.unitPrice)}</Text>
              <Text style={styles.colVat}>{line.vatRate}%</Text>
              <Text style={styles.colSum}>{eur(lineTotal(line))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Summa ilma KM-ta</Text>
              <Text>{eur(totals.net)}</Text>
            </View>
            {totals.vatByRate.map((v) => (
              <View style={styles.totalRow} key={v.rate}>
                <Text>Käibemaks {v.rate}%</Text>
                <Text>{eur(v.vat)}</Text>
              </View>
            ))}
            <View style={styles.totalGrand}>
              <Text style={styles.grandLabel}>Tasumisele kuulub</Text>
              <Text style={styles.grandValue}>{eur(totals.gross)}</Text>
            </View>
          </View>
        </View>

        {/* Payment details */}
        {(settings.bank_iban || settings.bank_name) && (
          <View style={styles.payBox}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
              Makse rekvisiidid
            </Text>
            {settings.bank_name ? <Text>Pank: {settings.bank_name}</Text> : null}
            {settings.bank_iban ? <Text>IBAN: {settings.bank_iban}</Text> : null}
            {settings.bank_bic ? <Text>BIC/SWIFT: {settings.bank_bic}</Text> : null}
            <Text>Saaja: {settings.business_name}</Text>
            <Text>Selgitus: Arve {invoice.number}</Text>
          </View>
        )}

        {invoice.notes ? <Text style={styles.note}>{invoice.notes}</Text> : null}
        {!invoice.notes && settings.invoice_note ? (
          <Text style={styles.note}>{settings.invoice_note}</Text>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {settings.business_name}
            {settings.business_reg ? ` · Reg ${settings.business_reg}` : ""}
          </Text>
          <Text>
            {settings.contact_email}
            {settings.contact_phone_info ? ` · ${settings.contact_phone_info}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(
  invoice: Invoice,
  settings: InvoicePdfSettings
): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} settings={settings} />);
}
