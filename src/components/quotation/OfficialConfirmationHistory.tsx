import { useEffect, useState } from 'react';
import { officialConfirmationRepository } from '../../services/officialConfirmations';
import type { OfficialConfirmation } from '../../types/officialCake';
import { formatZARCents } from '../../utils/currency';
export default function OfficialConfirmationHistory({ quotationId }: { quotationId: string }) {
  const [history, setHistory] = useState<OfficialConfirmation[]>([]); const [error, setError] = useState('');
  useEffect(() => { let live = true; officialConfirmationRepository.list(quotationId).then(h => { if(live) setHistory(h); }).catch(e => { if(live) setError(e instanceof Error ? e.message : 'Confirmation history could not be read.'); }); return () => { live = false; }; }, [quotationId]);
  return <section className="official-confirmation-history"><h2>Bakery price confirmation</h2>{error && <p role="alert">{error}</p>}{!history.length && !error && <p>Awaiting bakery confirmation. Your original estimate remains a range.</p>}{history.map(h => <article key={h.id}><h3>Manually quoted fixed amount: {formatZARCents(h.confirmedTotalCents)}</h3><p>Confirmed base {formatZARCents(h.confirmedBaseCents)} + flavour {formatZARCents(h.flavourSurchargeCents)} + approved additions {formatZARCents(h.approvedAdditionalCents)}</p><p>{h.reason}</p><p>{new Date(h.at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} · Pricing {h.pricingVersion} · Quoted, not accepted by customer</p></article>)}</section>;
}
