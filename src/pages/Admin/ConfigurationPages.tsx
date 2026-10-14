import { useState, type FormEvent, type ReactNode } from "react";
import { useStore } from "zustand";
import { Link } from "react-router-dom";
import { Plus, Pencil, Archive, ArrowUpRight } from "lucide-react";
import type { Product } from "../../types";
import type {
  CakePricingRules,
  PricingScope,
  ProductPricingBaseline,
} from "../../types/pricing";
import type { BakerySettings } from "../../types/admin";
import {
  CAKE_SIZES,
  CAKE_SHAPES,
  FLAVOURS,
  FROSTINGS,
  DECORATIONS,
  type CakeConfiguration,
} from "../../types/cakeDesigner";
import { defaultConfiguration, DECORATION_LABELS } from "../../data/designer";
import {
  adminStore,
  useWorkspace,
  saveProduct,
  publishPricing,
  saveSettings,
  resetLocalDemo,
} from "../../store/adminStore";
import { useCakeDesignerStore } from "../../store/cakeDesignerStore";
import { useQuotationDraftStore } from "../../store/quotationDraftStore";
import {
  calculateCakeEstimate,
  validatePricingRules,
} from "../../services/pricingEngine";
import { formatRand } from "../../utils/currency";
import { EstimateReceipt } from "../../components/designer/EstimatePanel";
import { useAdminRecords } from "./RecordsContext";
import { moneyToCents } from "../../services/adminMoney";
import BakeryImage from "../../components/ui/BakeryImage";
import { CATALOGUE_CATEGORIES } from '../../data/officialCatalogue';
import OfficialPricing from './OfficialPricing';
import { CAKE_CATEGORIES, formatPriceRange } from '../../services/officialCakePricing';
import { clientCakeProducts } from '../../data/clientCakeCatalogue';
import { OFFICIAL_FLAVOURS } from '../../types/officialCake';
import { validateProduct } from '../../services/adminRepository';
import { stableJSON, southAfricanDate } from '../../utils/quotation';
function Feedback({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
function Check({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      {label}
    </label>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      {label}
      {children}
    </label>
  );
}
export function Products() {
  const { products } = useWorkspace();
  const busy = useStore(adminStore, (s) => s.busy);
  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<Product | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const visible = products.filter(
    (p) =>
      (archived || !p.archived) &&
      `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  function newProduct() {
    setEditing({
      id: `product-${crypto.randomUUID()}`,
      name: "",
      category: "Celebrations",
      price: 0,
      image: "",
      description: "",
      flavour: "Vanilla",
      demo: true,
      archived: false,
      featured: false,
      designerEligible: true,
    });
    setError("");
    setNotice("");
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy) return;
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget);
    try {
      const product: Product = {
        ...editing,
        name: String(f.get("name")).trim(),
        category: String(f.get("category")) as Product["category"],
        price: editing.kind === 'catalogue' || editing.kind === 'official-cake' ? editing.price : moneyToCents(String(f.get("price"))) / 100,
        image: String(f.get("image")).trim(),
        description: String(f.get("description")).trim(),
        flavour: String(f.get("flavour")).trim(),
        featured: f.has("featured"),
        designerEligible: editing.kind !== 'catalogue' && f.has("designerEligible"),
      };
      if (editing.kind === 'official-cake') {
        product.slug = String(f.get('slug')).trim();
        product.categories = String(f.get('categories')).split('\n').map(s => s.trim()).filter(Boolean);
        product.gallery = String(f.get('gallery')).split('\n').map(s => s.trim()).filter(Boolean);
        product.sourceImages = String(f.get('sourceImages')).split('\n').map(s => s.trim()).filter(Boolean);
        product.visible = f.has('visible');
        product.featuredOrder = Number(f.get('featuredOrder'));
        if (product.image !== editing.image) delete product.responsiveImages;
        validateProduct(product);
        if (!preview || stableJSON(preview) !== stableJSON(product)) { setPreview(product); setNotice('Preview ready. The active cake remains unchanged until publication.'); return; }
      }
      if (editing.kind === 'catalogue') {
        product.quantityOptions = String(f.get('quantityOptions')).trim().split('\n').map(line => {
          const [quantity, amount, extra] = line.split(':');
          if (!quantity || !/^\d+$/.test(quantity.trim()) || amount === undefined || extra !== undefined) throw new Error('Use one quantity:price per line, for example 12:310.');
          return { pieces: Number(quantity.trim()), priceCents: moneyToCents(amount.trim()) };
        });
        product.price = product.quantityOptions[0]?.priceCents / 100;
        product.availability = String(f.get('availability')) as Product['availability'];
        validateProduct(product);
        if (!preview || stableJSON(preview) !== stableJSON(product)) { setPreview(product); setNotice('Preview ready. Review the product and quantities, then publish.'); return; }
      }
      await saveProduct(product);
      setEditing(null);
      setPreview(null);
      setNotice(
        "Product saved. The public catalogue and designer pricing now use this configuration.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Product could not be saved.");
    }
  }
  async function archive(product: Product) {
    setError("");
    setNotice("");
    try {
      await saveProduct({ ...product, archived: !product.archived });
      setNotice(
        product.archived
          ? "Product restored to the catalogue."
          : "Product archived. Historical requests retain their original snapshots.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Product could not be archived.",
      );
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-field">
          Search products
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or category"
          />
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Include archived products
        </label>
        <button className="admin-button" onClick={newProduct} disabled={busy}>
          <Plus size={17} />
          Add product
        </button>
        <button className="admin-button secondary" disabled={busy} onClick={() => { setPreview(null); setEditing({ id: `product-${crypto.randomUUID()}`, name: '', slug: `custom-cake-${Date.now()}`, category: 'Birthday Cakes', categories: [], description: '', image: '', gallery: [], sourceImages: [], flavour: 'Vanilla', demo: false, kind: 'official-cake', pricingMode: 'official-range', price: 1480, archived: false, visible: true, featured: false, featuredOrder: 100, designerEligible: true, availableFlavours: [...OFFICIAL_FLAVOURS], dateAdded: southAfricanDate(new Date()) }); }}>Add official cake</button>
      </div>
      <Feedback error={error} notice={notice} />
      {editing && (
        <section className="admin-card admin-editor">
          <div className="admin-card-heading">
            <h2>
              {products.some((p) => p.id === editing.id)
                ? "Edit product"
                : "New product"}
            </h2>
            <button
              className="admin-button secondary"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
          <form key={editing.id} onSubmit={(e) => void save(e)}>
            <fieldset disabled={busy}>
              <div className="admin-form-grid">
                <Field label="Product name">
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={editing.name}
                  />
                </Field>
                <Field label="Category">
                  <select name="category" defaultValue={editing.category}>
                    {["Classics", "Celebrations", "Weddings", ...CATALOGUE_CATEGORIES, ...CAKE_CATEGORIES].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                {editing.kind !== 'catalogue' && editing.kind !== 'official-cake' && <Field label="Starting price (ZAR)">
                  <input
                    name="price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={editing.price}
                  />
                </Field>}
                {editing.kind === 'catalogue' && <><Field label="Quantity options (pieces:price in ZAR, one per line)"><textarea name="quantityOptions" required rows={4} defaultValue={editing.quantityOptions?.map(o => `${o.pieces}:${o.priceCents / 100}`).join('\n')} /></Field><Field label="Availability"><select name="availability" defaultValue={editing.availability || 'Enquiry'}><option>Enquiry</option><option>Unavailable</option></select></Field></>}
                  {editing.kind === 'official-cake' && <div className="admin-form-grid"><Field label="Product slug"><input name="slug" required defaultValue={editing.slug}/></Field><Field label="Secondary categories (one per line)"><textarea name="categories" defaultValue={editing.categories?.join('\n')}/></Field><Field label="Gallery photograph paths (one per line)"><textarea name="gallery" defaultValue={editing.gallery?.join('\n')}/></Field><Field label="Source photograph references (one per line)"><textarea name="sourceImages" required defaultValue={editing.sourceImages?.join('\n')}/></Field><Field label="Featured order"><input name="featuredOrder" type="number" min="0" max="10000" step="1" required defaultValue={editing.featuredOrder}/></Field><label className="admin-check"><input name="visible" type="checkbox" defaultChecked={editing.visible !== false}/>Visible in public catalogue</label><p>Vanilla range {formatPriceRange(148000,195000)}. Physical dimensions are not inferred from photographs.</p></div>}
                <Field label="Flavour inspiration">

                  <input
                    name="flavour"
                    required
                    maxLength={100}
                    defaultValue={editing.flavour}
                  />
                </Field>
                <Field label={editing.kind === 'catalogue' || editing.kind === 'official-cake' ? 'Product photograph (local path or HTTP/HTTPS URL)' : 'Illustrative image URL (HTTPS or HTTP)'}>
                  <input
                    name="image"
                    list={editing.kind === 'official-cake' ? 'cake-photo-paths' : undefined}
                    type="text"
                    required
                    maxLength={2000}
                    defaultValue={editing.image}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    name="description"
                    required
                    rows={3}
                    maxLength={3000}
                    defaultValue={editing.description}
                  />
                </Field>
              </div>
              <div className="admin-checks">
                <datalist id="cake-photo-paths">{clientCakeProducts.flatMap(p => [p.image, ...(p.gallery || [])]).map(src => <option key={src} value={src}/>)}</datalist>
                <Check
                  name="featured"
                  label="Featured on the home page"
                  checked={editing.featured}
                />
                {editing.kind !== 'catalogue' && <Check
                  name="designerEligible"
                  label="Available in the Cake Designer"
                  checked={editing.designerEligible}
                />}
              </div>
              <p>
                {editing.kind === 'catalogue' ? 'Only listed quantities have prices. This product cannot be configured in the Cake Designer. Local image paths or HTTP/HTTPS URLs are supported.' : 'New cakes use the standard 8 inch vanilla buttercream preset. Configure their included design and manual review in Pricing.'}
              </p>
              <button className="admin-button">
                {busy ? "Saving…" : editing.kind === 'catalogue' || editing.kind === 'official-cake' ? preview ? 'Publish product locally' : 'Preview product' : 'Save product locally'}
              </button>
            </fieldset>
          </form>
          {preview && (editing.kind === 'catalogue' || editing.kind === 'official-cake') && <section className="admin-card" aria-label="Product publication preview"><h3>Publication preview</h3><BakeryImage src={preview.image} alt={preview.name} style={{ maxWidth: 320, width: '100%', aspectRatio: '4/3', objectFit: 'contain' }}/><h3>{preview.name}</h3><p>{preview.description}</p><p>{preview.category} · {preview.availability} · {preview.featured ? 'Featured' : 'Not featured'}</p><p>{preview.quantityOptions?.map(o => `${o.pieces} pieces: ${formatRand(o.priceCents / 100)}`).join(' · ')}</p><p>Changes remain unpublished until you publish. Editing a value requires a new preview.</p></section>}
        </section>
      )}
      <details className="admin-card" onToggle={e => setShowSources(e.currentTarget.open)}><summary>All 44 original client photographs and source references</summary><p>Source photographs remain unchanged. Cover and gallery paths are offered in the image field; uncertain names/crops remain reviewable.</p>{showSources && <div className="source-photo-inventory">{clientCakeProducts.flatMap(p => p.sourceImages || []).map(src => <a key={src} href={src} target="_blank" rel="noreferrer"><BakeryImage src={src} alt={`Original cake photograph ${src.split('/').pop()}`} loading="lazy"/><small>{src.split('/').pop()}</small></a>)}</div>}</details>
      <div className="admin-products">
        {visible.map((p) => (
          <article className="admin-card admin-product" key={p.id}>
            <BakeryImage
              src={p.image}
              alt={p.name}
              loading="lazy"
              decoding="async"
            />
            <div className="admin-product-body">
              <div className="admin-card-heading">
                <span className="admin-kicker">{p.category}</span>
                {p.archived && (
                  <span className="admin-local-badge">ARCHIVED</span>
                )}
              </div>
              <h2>{p.name}</h2>
              <strong>From {formatRand(p.price)}</strong>
              <p>{p.description}</p>
              <div className="admin-product-tags">
                <span>{p.featured ? "Featured" : "Not featured"}</span>
                <span>
                  {p.designerEligible ? "Designer enabled" : "Enquiry only"}
                </span>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-button secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditing(p);
                    setPreview(null);
                    setError("");
                    setNotice("");
                  }}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  className="admin-button secondary"
                  disabled={busy}
                  onClick={() => void archive(p)}
                >
                  <Archive size={15} />
                  {p.archived ? "Restore" : "Archive"}
                </button>
                {!p.archived && (
                  <Link to={`/cakes/${p.id}`} aria-label={`View ${p.name}`}>
                    <ArrowUpRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <section className="admin-card">
          <p>No products match these filters.</p>
        </section>
      )}
    </>
  );
}
function Amount({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(
    Number.isFinite(value) ? String(value / 100) : "",
  );
  return (
    <Field label={label}>
      <input
        type="number"
        min="0"
        step="0.01"
        required
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(moneyToCents(e.target.value));
          } catch {
            onChange(NaN);
          }
        }}
      />
    </Field>
  );
}
function Select<T extends string | number>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  optionLabel?: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) =>
          onChange(
            (typeof value === "number"
              ? Number(e.target.value)
              : e.target.value) as T,
          )
        }
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel ? optionLabel(o) : o}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function Pricing() {
  const workspace = useWorkspace();
  const [notice, setNotice] = useState("");
  return (
    <>
      <OfficialPricing />
      <Feedback error="" notice={notice} />
      <PricingEditor
        key={workspace.rules.version}
        active={workspace.rules}
        onSaved={() =>
          setNotice(
            "Pricing published locally. New estimates use this version.",
          )
        }
      />
    </>
  );
}
function PricingEditor({
  active,
  onSaved,
}: {
  active: CakePricingRules;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(active));
  const busy = useStore(adminStore, (s) => s.busy);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const designer = useCakeDesignerStore((s) => s.configuration);
  const [previewConfig, setPreviewConfig] = useState<CakeConfiguration>(() =>
    structuredClone(designer),
  );
  const estimate = calculateCakeEstimate(previewConfig, draft);
  const current = calculateCakeEstimate(previewConfig, active);
  let validation = "";
  try {
    validatePricingRules(draft);
  } catch (e) {
    validation = e instanceof Error ? e.message : "Invalid pricing.";
  }
  const change = (update: (copy: CakePricingRules) => void) => {
    setDraft((old) => {
      const copy = structuredClone(old);
      update(copy);
      return copy;
    });
    setNotice("");
  };
  function baseline(id: string, patch: Partial<ProductPricingBaseline>) {
    change((copy) => {
      Object.assign(copy.productPackages[id].baseline, patch);
    });
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      if (validation) throw new Error(validation);
      await publishPricing(draft);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pricing was not saved.");
    }
  }
  return (
    <>
      <div className="admin-notice">
        Active version: <strong>{active.version}</strong>. Publishing creates a
        new version. Customer snapshots retain their captured rules. Mandatory
        bespoke and reference design review stays enabled.
      </div>
      <Feedback error={error || validation} notice={notice} />
      <form onSubmit={(e) => void save(e)}>
        <fieldset disabled={busy}>
          <div className="admin-pricing-layout">
            <div className="admin-pricing-controls">
              <section className="admin-card">
                <h2>Base prices by tier size</h2>
                <p>
                  Amounts in ZAR. Each actual cake tier is priced by its size.
                </p>
                <div className="admin-form-grid">
                  {CAKE_SIZES.map((size) => (
                    <Amount
                      key={size}
                      label={`${size} inch tier`}
                      value={draft.basePricesCents[size]}
                      onChange={(n) =>
                        change((c) => {
                          c.basePricesCents[size] = n;
                        })
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>Flavour surcharges</h2>
                <Select
                  label="Flavour charge scope"
                  value={draft.flavourScope}
                  options={["cake", "tier"] as PricingScope[]}
                  onChange={(s) =>
                    change((c) => {
                      c.flavourScope = s;
                    })
                  }
                />
                <div className="admin-form-grid">
                  {FLAVOURS.map((key) => (
                    <Amount
                      key={key}
                      label={key}
                      value={draft.flavourSurchargesCents[key]}
                      onChange={(n) =>
                        change((c) => {
                          c.flavourSurchargesCents[key] = n;
                        })
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>Frosting surcharges</h2>
                <Select
                  label="Frosting charge scope"
                  value={draft.frostingScope}
                  options={["cake", "tier"] as PricingScope[]}
                  onChange={(s) =>
                    change((c) => {
                      c.frostingScope = s;
                    })
                  }
                />
                <div className="admin-form-grid">
                  {FROSTINGS.map((key) => (
                    <Amount
                      key={key}
                      label={key}
                      value={draft.frostingSurchargesCents[key]}
                      onChange={(n) =>
                        change((c) => {
                          c.frostingSurchargesCents[key] = n;
                        })
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>Decorations & personalisation</h2>
                <Select
                  label="Decoration charge scope"
                  value={draft.decorationScope}
                  options={["cake", "tier"] as PricingScope[]}
                  onChange={(s) =>
                    change((c) => {
                      c.decorationScope = s;
                    })
                  }
                />
                <div className="admin-form-grid">
                  {([...DECORATIONS, "message"] as const).map((key) => (
                    <Amount
                      key={key}
                      label={
                        key === "message"
                          ? "Personalised message"
                          : DECORATION_LABELS[key]
                      }
                      value={draft.decorationSurchargesCents[key]}
                      onChange={(n) =>
                        change((c) => {
                          c.decorationSurchargesCents[key] = n;
                        })
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>Tier construction</h2>
                <Amount
                  label="Stacking per additional tier (ZAR)"
                  value={draft.tierStructure.stackingFeePerAdditionalTierCents}
                  onChange={(n) =>
                    change((c) => {
                      c.tierStructure.stackingFeePerAdditionalTierCents = n;
                    })
                  }
                />
                <div className="admin-form-grid">
                  <Select
                    label="Minimum tier size (inches)"
                    value={draft.tierStructure.minimumTierSizeInches}
                    options={CAKE_SIZES}
                    onChange={(s) =>
                      change((c) => {
                        c.tierStructure.minimumTierSizeInches = s;
                      })
                    }
                  />
                  <Select
                    label="Maximum tiers"
                    value={draft.tierStructure.maximumTiers}
                    options={[1, 2, 3] as const}
                    onChange={(s) =>
                      change((c) => {
                        c.tierStructure.maximumTiers = s;
                      })
                    }
                  />
                </div>
                <p>
                  Tier size steps remain two inches to match the 3D geometry.
                  All product baselines must fit these limits.
                </p>
              </section>
              <section className="admin-card">
                <h2>Product inclusion allowances</h2>
                <p>
                  The starting price includes this baseline. The existing engine
                  calculates extras or credits for changes. Archived packages
                  remain available for historical designs.
                </p>
                {Object.entries(draft.productPackages).map(([id, p]) => (
                  <details className="admin-package" key={id}>
                    <summary>{p.name}</summary>
                    <Amount
                      label="Package starting price (ZAR)"
                      value={p.startingPriceCents}
                      onChange={(n) =>
                        change((c) => {
                          c.productPackages[id].startingPriceCents = n;
                        })
                      }
                    />
                    <div className="admin-form-grid">
                      <Select
                        label="Included shape"
                        value={p.baseline.shape}
                        options={CAKE_SHAPES}
                        onChange={(s) => baseline(id, { shape: s })}
                      />
                      <Select
                        label="Included base size"
                        value={p.baseline.size}
                        options={CAKE_SIZES}
                        onChange={(s) => baseline(id, { size: s })}
                      />
                      <Select
                        label="Included tiers"
                        value={p.baseline.tiers}
                        options={[1, 2, 3] as const}
                        onChange={(s) => baseline(id, { tiers: s })}
                      />
                      <Select
                        label="Included flavour"
                        value={p.baseline.flavour}
                        options={FLAVOURS}
                        onChange={(s) => baseline(id, { flavour: s })}
                      />
                      <Select
                        label="Included frosting"
                        value={p.baseline.frosting}
                        options={FROSTINGS}
                        onChange={(s) => baseline(id, { frosting: s })}
                      />
                    </div>
                    <div className="admin-checks">
                      {DECORATIONS.map((d) => (
                        <label className="admin-check" key={d}>
                          <input
                            type="checkbox"
                            checked={p.baseline.decorations[d]}
                            onChange={(e) =>
                              baseline(id, {
                                decorations: {
                                  ...p.baseline.decorations,
                                  [d]: e.target.checked,
                                },
                              })
                            }
                          />
                          Includes {DECORATION_LABELS[d]}
                        </label>
                      ))}
                      <label className="admin-check">
                        <input
                          type="checkbox"
                          checked={p.baseline.messageIncluded}
                          onChange={(e) =>
                            baseline(id, { messageIncluded: e.target.checked })
                          }
                        />
                        Includes personalised message
                      </label>
                      <label className="admin-check">
                        <input
                          type="checkbox"
                          checked={p.manualQuotationRequired}
                          onChange={(e) =>
                            change((c) => {
                              c.productPackages[id].manualQuotationRequired =
                                e.target.checked;
                            })
                          }
                        />
                        Always require manual bakery quotation
                      </label>
                    </div>
                  </details>
                ))}
              </section>
            </div>
            <aside className="admin-pricing-preview admin-card">
              <span className="admin-kicker">PREVIEW · UNSAVED RULES</span>
              <h2>Test your changes</h2>
              <Select
                label="Preview inspiration"
                value={previewConfig.selectedProductId ?? ""}
                options={["", ...Object.keys(draft.productPackages)]}
                optionLabel={(id) =>
                  id
                    ? draft.productPackages[id].name
                    : "Standard cake (no package)"
                }
                onChange={(id) => {
                  if (!id) setPreviewConfig(defaultConfiguration());
                  else {
                    const b = draft.productPackages[id].baseline;
                    setPreviewConfig({
                      ...defaultConfiguration(),
                      shape: b.shape,
                      size: b.size,
                      tiers: b.tiers,
                      flavour: b.flavour,
                      frosting: b.frosting,
                      decorations: { ...b.decorations },
                      selectedProductId: id,
                    });
                  }
                }}
              />
              <Select
                label="Preview base size"
                value={previewConfig.size}
                options={CAKE_SIZES}
                onChange={(s) => setPreviewConfig((c) => ({ ...c, size: s }))}
              />
              <Select
                label="Preview tiers"
                value={previewConfig.tiers}
                options={[1, 2, 3] as const}
                onChange={(s) =>
                  setPreviewConfig((c) => ({
                    ...c,
                    tiers: s,
                    size: Math.max(
                      c.size,
                      6 + (s - 1) * 2,
                    ) as CakeConfiguration["size"],
                  }))
                }
              />
              <Select
                label="Preview flavour"
                value={previewConfig.flavour}
                options={FLAVOURS}
                onChange={(s) =>
                  setPreviewConfig((c) => ({ ...c, flavour: s }))
                }
              />
              <Select
                label="Preview frosting"
                value={previewConfig.frosting}
                options={FROSTINGS}
                onChange={(s) =>
                  setPreviewConfig((c) => ({ ...c, frosting: s }))
                }
              />
              <div className="admin-checks">
                {DECORATIONS.map((d) => (
                  <label key={d} className="admin-check">
                    <input
                      type="checkbox"
                      checked={previewConfig.decorations[d]}
                      onChange={(e) =>
                        setPreviewConfig((c) => ({
                          ...c,
                          decorations: {
                            ...c.decorations,
                            [d]: e.target.checked,
                          },
                        }))
                      }
                    />
                    {DECORATION_LABELS[d]}
                  </label>
                ))}
              </div>
              <p>
                Published estimate:{" "}
                {current.estimatedTotalCents === null
                  ? "Manual quotation"
                  : formatRand(current.estimatedTotalCents / 100)}
              </p>
              <EstimateReceipt estimate={estimate} />
              {estimate.errors.length > 0 && (
                <p className="admin-error">{estimate.errors.join(" ")}</p>
              )}
              <button
                className="admin-button"
                disabled={!!validation || estimate.status === "invalid" || busy}
              >
                {busy ? "Publishing…" : "Publish pricing locally"}
              </button>
              <p>
                Preview amounts are unsaved until published. Delivery and
                bespoke details need bakery confirmation.
              </p>
            </aside>
          </div>
        </fieldset>
      </form>
    </>
  );
}
export function AdminSettings() {
  const { settings } = useWorkspace();
  const [notice, setNotice] = useState("");
  return (
    <>
      <Feedback error="" notice={notice} />
      <SettingsEditor
        key={JSON.stringify(settings)}
        settings={settings}
        onSaved={setNotice}
      />
    </>
  );
}
function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: BakerySettings;
  onSaved: (message: string) => void;
}) {
  const busy = useStore(adminStore, (s) => s.busy);
  const { refresh } = useAdminRecords();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    setNotice("");
    try {
      const value = { ...settings };
      for (const key of [
        "businessName",
        "description",
        "email",
        "phone",
        "address",
        "collectionInstructions",
        "disclaimer",
      ] as const)
        value[key] = String(data.get(key)).trim();
      value.minimumLeadDays = Number(data.get("lead"));
      value.deliveryAreas = String(data.get("areas"))
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      value.locale = String(data.get("locale")) as BakerySettings["locale"];
      await saveSettings(value);
      onSaved(
        "Settings saved locally. New requests use the configured policy.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings were not saved.");
    }
  }
  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await resetLocalDemo(confirmation);
      useCakeDesignerStore.getState().resetDesign();
      useQuotationDraftStore.getState().clear();
      setConfirmation("");
      await refresh();
      onSaved(
        "IndexedDB demonstration data reset. Seeded catalogue and pricing restored.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed.");
    }
  }
  return (
    <>
      <Feedback error={error} notice={notice} />
      <form onSubmit={(e) => void save(e)}>
        <fieldset disabled={busy}>
          <section className="admin-card">
            <h2>Business information</h2>
            <details><summary>Supplied brand artwork — Sweet Treats FB&amp;C logo selected</summary><p>The owner selected the Sweet Treats monogram for the website. It is cropped directly from the supplied artwork, without redrawing. The alternative pink cake logo and both originals remain preserved.</p><div className="admin-actions"><a href="/catalogue-source/image(20261013-125810).png" target="_blank" rel="noreferrer">View Sweet Treats artwork ↗</a><a href="/catalogue-source/image(20261013-125821).png" target="_blank" rel="noreferrer">View scone artwork ↗</a></div></details>
            <p>
              New workspaces use the contact details supplied on the bakery menus. Existing owner edits are preserved. These settings are stored locally.
            </p>
            <div className="admin-form-grid">
              <Field label="Bakery business name">
                <input
                  name="businessName"
                  required
                  maxLength={100}
                  defaultValue={settings.businessName}
                />
              </Field>
              <Field label="Business description">
                <textarea
                  name="description"
                  rows={3}
                  maxLength={3000}
                  defaultValue={settings.description}
                />
              </Field>
              <Field label="Contact email">
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  defaultValue={settings.email}
                />
              </Field>
              <Field label="Contact number">
                <input
                  name="phone"
                  type="tel"
                  maxLength={50}
                  defaultValue={settings.phone}
                />
              </Field>
              <Field label="Business / collection address">
                <textarea
                  name="address"
                  maxLength={500}
                  rows={2}
                  defaultValue={settings.address}
                />
              </Field>
              <Field label="Collection instructions">
                <textarea
                  name="collectionInstructions"
                  rows={3}
                  maxLength={2000}
                  defaultValue={settings.collectionInstructions}
                />
              </Field>
            </div>
          </section>
          <section className="admin-card">
            <h2>Quotation policy & formatting</h2>
            <div className="admin-form-grid">
              <Field label="Additional bakery quotation disclaimer">
                <textarea
                  name="disclaimer"
                  required
                  maxLength={1000}
                  rows={3}
                  defaultValue={settings.disclaimer}
                />
              </Field>
              <Field label="Minimum lead time (days)">
                <input
                  name="lead"
                  type="number"
                  min="0"
                  max="365"
                  step="1"
                  required
                  defaultValue={settings.minimumLeadDays}
                />
              </Field>
              <Field label="Supported delivery areas (one per line)">
                <textarea
                  name="areas"
                  rows={4}
                  defaultValue={settings.deliveryAreas.join("\n")}
                  placeholder="Leave blank for area requests subject to confirmation"
                />
              </Field>
              <Field label="Currency display">
                <select name="locale" defaultValue={settings.locale}>
                  <option value="en-ZA">South Africa · ZAR</option>
                  <option value="en-GB">International English · ZAR</option>
                </select>
              </Field>
            </div>
            <p>
              All monetary records remain ZAR. Configured areas and lead time
              apply to new requests; old requests retain their policy snapshot.
              Blank delivery areas means requested areas require confirmation.
              The estimate confirmation disclaimer always remains visible.
            </p>
            <button className="admin-button">
              {busy ? "Saving…" : "Save settings locally"}
            </button>
          </section>
        </fieldset>
      </form>
      <section className="admin-card admin-reset">
        <h2>Reset demonstration data</h2>
        <p>
          This permanently deletes all locally submitted quotations, reference
          images, internal notes and revisions, and restores seeded products,
          pricing and settings in this browser. Other local enquiry and
          saved-design data are retained. Other browser profiles are unaffected.
        </p>
        <form onSubmit={(e) => void reset(e)}>
          <fieldset disabled={busy}>
            <Field label="Type RESET LOCAL DEMO to confirm">
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <button
              className="admin-button danger"
              disabled={confirmation !== "RESET LOCAL DEMO" || busy}
            >
              Delete IndexedDB demonstration data
            </button>
          </fieldset>
        </form>
      </section>
      <section className="admin-card">
        <h2>Access & future integration</h2>
        <p>
          This route has no sign-in or role checks. It is not secure. Repository
          methods provide the integration boundary for a future authenticated
          Supabase implementation; authentication and authorisation must be
          enforced by that backend.
        </p>
      </section>
    </>
  );
}
