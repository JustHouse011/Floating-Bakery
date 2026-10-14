import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Printer, ArrowUpRight } from "lucide-react";
import type { QuotationRecord } from "../../types/quotation";
import { quotationRepository } from "../../services/quotationRepository";
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import { useQuotationDraftStore } from "../../store/quotationDraftStore";
import { formatEventDate } from "../../utils/quotation";
import QuotationSummary from "../../components/quotation/QuotationSummary";
import OfficialConfirmationHistory from '../../components/quotation/OfficialConfirmationHistory';
import "../../styles/quotation.css";
export default function QuotationConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<QuotationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const copyField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setRecord(null);
    quotationRepository
      .getById(id ?? "")
      .then((value) => {
        if (cancelled) return;
        if (value) setRecord(value);
        else
          setError(
            "This request was not found on this browser. It may belong to another browser or its local data may have been cleared.",
          );
      })
      .catch((failure) => {
        if (!cancelled)
          setError(
            failure instanceof Error
              ? failure.message
              : "This local request could not be opened.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  useEffect(() => {
    if (!loading) heading.current?.focus();
  }, [loading]);
  useEffect(() => {
    if (manualCopy) {
      copyField.current?.focus();
      copyField.current?.select();
    }
  }, [manualCopy]);
  async function copy() {
    if (!record) return;
    try {
      await navigator.clipboard.writeText(record.reference);
      setNotice("Quotation reference copied.");
    } catch {
      setManualCopy(true);
      setNotice("Select and copy the reference below.");
    }
  }
  function another() {
    useCakeDesignerStore.getState().resetDesign();
    useQuotationDraftStore.getState().clear();
    navigate("/cake-designer");
  }
  if (loading)
    return (
      <section className="section page-heading" role="status">
        <h1>
          Your saved <em>request.</em>
        </h1>
        <p>Opening this browser’s local quotation…</p>
      </section>
    );
  if (!record)
    return (
      <section className="section page-heading">
        <h1 ref={heading} tabIndex={-1}>
          A little <em>detour.</em>
        </h1>
        <p role="alert">{error}</p>
        <Link to="/cake-designer" className="button">
          Return to the Cake Studio
        </Link>
      </section>
    );
  return (
    <div className="quotation-confirmation">
      <div className="quote-confirmation-heading">
        <CheckCircle2 size={38} strokeWidth={1} />
        <span className="eyebrow">A SWEET IDEA, SAVED LOCALLY</span>
        <h1 ref={heading} tabIndex={-1}>
          Thank you for choosing
          <br />
          <em>Floating Bakery & Caterers.</em>
        </h1>
        <p>Quotation request saved in this demonstration.</p>
        <p className="quote-local-note">
          The bakery has not received this request or an email. This is not a
          confirmed booking or order.
        </p>
        <div className="quotation-reference">
          <span>YOUR LOCAL QUOTATION REFERENCE</span>
          <strong>{record.reference}</strong>
        </div>
        <p>
          For {record.customer.fullName} ·{" "}
          {formatEventDate(record.event.eventDate)}
          <br />
          Status: {record.status} · local demonstration
        </p>
      </div>
      <div className="quotation-actions">
        <button type="button" onClick={copy}>
          <Copy size={15} /> Copy reference
        </button>
        <button type="button" onClick={() => window.print()}>
          <Printer size={15} /> Print quotation
        </button>
        <Link to="/">
          Return home <ArrowUpRight size={15} />
        </Link>
        <button type="button" className="button" onClick={another}>
          Start another design <ArrowUpRight size={15} />
        </button>
      </div>
      <p className="quote-copy-notice" role="status">
        {notice}
      </p>
      {manualCopy && (
        <label className="clipboard-fallback">
          Copy this reference
          <input ref={copyField} readOnly value={record.reference} />
        </label>
      )}
      <QuotationSummary
        customer={record.customer}
        event={record.event}
        snapshot={record.snapshot}
        images={record.references}
      />
      {record.snapshot.official && <OfficialConfirmationHistory quotationId={record.id}/>}
      <p className="quote-hint">
        Your saved snapshot is unchanged by later studio edits or pricing
        updates. A real bakery quotation would still need confirmation.
      </p>
    </div>
  );
}
