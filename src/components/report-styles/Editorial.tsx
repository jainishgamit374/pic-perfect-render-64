import { chunk, SEV_LABEL, type ReportData } from "./index";

export function EditorialPages(d: ReportData) {
  const total = d.findings.length;
  const issues = total - d.counts.normal;
  const pages = [
    <section key="cover" className="rs-page rs-ed">
      <div className="rs-ed__top"><span>{d.logoUrl ? <img className="rs-brand-logo" src={d.logoUrl} alt={d.company || "Company logo"} /> : d.company || "INSPECT"}</span><span>No. {d.date.slice(0, 10) || "—"}</span></div>
      <div className="rs-ed__index">01</div>
      <p className="rs-cover-label">{d.coverTitle} · {d.coverSubtitle}</p>
      <h1 className="rs-ed__title">{d.address}</h1>
      <div className="rs-ed__cover-grid">
        <div className="rs-ed__meta">
          <p><em>Prepared for</em>{d.client || "—"}</p>
          <p><em>Inspector</em>{d.inspector || "—"}</p>
          <p><em>Type</em>{d.propertyType || "—"}</p>
        </div>
        {d.coverUrl && <img className="rs-ed__cover-img" src={d.coverUrl} alt="" />}
      </div>
      <div className="rs-ed__bottom"><b>{total}</b> locations <span className="rs-ed__accent">/</span> <b>{issues}</b> require attention {d.footer && <small> · {d.footer}</small>}</div>
    </section>,
    <section key="details" className="rs-page rs-ed">
      <div className="rs-ed__top"><span>{d.address}</span><span>02</span></div>
      <h2 className="rs-ed__h2">Property<br />details</h2>
      <dl className="rs-ed__dl">
        {d.details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {d.notes && <p className="rs-ed__notes">{d.notes}</p>}
    </section>,
  ];
  chunk(d.findings, 2).forEach((group, gi) => pages.push(
    <section key={`f${gi}`} className="rs-page rs-ed">
      <div className="rs-ed__top"><span>Findings</span><span>{String(gi + 3).padStart(2, "0")}</span></div>
      {group.map((f, i) => (
        <article key={f.key} className="rs-ed__finding">
          <div className="rs-ed__fnum">{String(gi * 2 + i + 1).padStart(2, "0")}</div>
          <div>
            <h3>{f.room} — {f.area}</h3>
            <p className={`rs-ed__sev ${f.severity !== "normal" ? "is-issue" : ""}`}>{SEV_LABEL[f.severity]}</p>
            <div className="rs-ed__photos">
              {f.thermalUrl && <img src={f.thermalUrl} alt={f.thermalName} />}
              {f.visualUrl && <img src={f.visualUrl} alt={f.visualName} />}
            </div>
            {f.thermalObs && <p><b>Thermal.</b> {f.thermalObs}</p>}
            {f.visualObs && <p><b>Visual.</b> {f.visualObs}</p>}
            {f.recommendation && <p className="rs-ed__rec"><b>→</b> {f.recommendation}</p>}
          </div>
        </article>
      ))}
      {group.length === 0 && <p>No findings recorded.</p>}
    </section>,
  ));
  return pages;
}
