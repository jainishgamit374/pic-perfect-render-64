import { chunk, SEV_LABEL, type ReportData } from "./index";

export function LuxuryPages(d: ReportData) {
  const pages = [
    <section key="cover" className="rs-page rs-lx rs-lx--cover">
      {d.coverUrl ? <img className="rs-lx__bleed" src={d.coverUrl} alt="" /> : <div className="rs-lx__bleed" />}
      <div className="rs-lx__veil">
        {d.logoUrl && <img className="rs-brand-logo" src={d.logoUrl} alt={d.company || "Company logo"} />}
        <p className="rs-lx__kicker">{d.company || "INSPECT"}</p>
        <h1 className="rs-lx__title">{d.coverTitle}</h1>
        <div className="rs-lx__rule" />
        <p className="rs-lx__sub">{d.address} · {d.coverSubtitle} · Prepared for {d.client || "the owner"} · {d.date || "—"}</p>
        {d.footer && <p className="rs-lx__sub">{d.footer}</p>}
      </div>
    </section>,
    <section key="details" className="rs-page rs-lx">
      <p className="rs-lx__kicker">I.</p>
      <h2 className="rs-lx__h2"><i>The</i> Residence</h2>
      <div className="rs-lx__rule" />
      <dl className="rs-lx__dl">
        {d.details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {d.notes && <blockquote className="rs-lx__quote">“{d.notes}”</blockquote>}
      <p className="rs-lx__folio">{d.inspector ? `Surveyed by ${d.inspector}` : ""}</p>
    </section>,
  ];
  chunk(d.findings, 2).forEach((group, gi) => pages.push(
    <section key={`f${gi}`} className="rs-page rs-lx">
      <p className="rs-lx__kicker">{gi === 0 ? "II. Observations" : "Observations, continued"}</p>
      {group.map((f) => (
        <article key={f.key} className="rs-lx__finding">
          <div className="rs-lx__photos">
            {f.visualUrl && <img src={f.visualUrl} alt={f.visualName} />}
            {f.thermalUrl && <img src={f.thermalUrl} alt={f.thermalName} />}
          </div>
          <div className="rs-lx__text">
            <h3>{f.room}</h3>
            <p className="rs-lx__area">{f.area} · <span className={`rs-lx__sev rs-lx__sev--${f.severity}`}>{SEV_LABEL[f.severity]}</span></p>
            {f.visualObs && <p>{f.visualObs}</p>}
            {f.thermalObs && <p><i>Thermal —</i> {f.thermalObs}</p>}
            {f.recommendation && <p className="rs-lx__rec"><i>Advised:</i> {f.recommendation}</p>}
          </div>
        </article>
      ))}
      <p className="rs-lx__folio">{gi + 3}</p>
    </section>,
  ));
  return pages;
}
