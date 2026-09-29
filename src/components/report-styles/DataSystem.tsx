import { chunk, SEV_LABEL, SEVS, type ReportData } from "./index";

export function DataSystemPages(d: ReportData) {
  const total = Math.max(1, d.findings.length);
  const score = Math.round(100 - ((d.counts.critical * 30 + d.counts.defective * 15 + d.counts.moderate * 6 + d.counts.minor * 2) / total));
  const pages = [
    <section key="cover" className="rs-page rs-dt rs-dt--dark">
      <div className="rs-dt__hdr"><span>{d.logoUrl ? <img className="rs-brand-logo" src={d.logoUrl} alt={d.company || "Company logo"} /> : d.company || "SYS://INSPECTION_REPORT"}</span><span>{d.date || "—"}</span></div>
      <p className="rs-dt__label">{d.coverTitle}</p>
      <h1 className="rs-dt__title">{d.address}</h1>
      <p>{d.coverSubtitle}</p>
      <div className="rs-dt__score">
        <div><p className="rs-dt__label">CONDITION INDEX</p><strong>{Math.max(0, score)}</strong><span>/100</span></div>
        <div className="rs-dt__bars">
          {SEVS.map((s) => (
            <div key={s} className="rs-dt__barrow">
              <span>{SEV_LABEL[s].toUpperCase()}</span>
              <div className="rs-dt__track"><div className={`rs-dt__fill rs-dt__fill--${s}`} style={{ width: `${(d.counts[s] / total) * 100}%` }} /></div>
              <b>{String(d.counts[s]).padStart(2, "0")}</b>
            </div>
          ))}
        </div>
      </div>
      {d.coverUrl && <figure className="rs-dt__cover"><img src={d.coverUrl} alt="" /><figcaption>REF.IMG_001</figcaption></figure>}
      <div className="rs-dt__grid4">
        <div><p className="rs-dt__label">CLIENT</p>{d.client || "—"}</div>
        <div><p className="rs-dt__label">INSPECTOR</p>{d.inspector || "—"}</div>
        <div><p className="rs-dt__label">TYPE</p>{d.propertyType || "—"}</div>
        <div><p className="rs-dt__label">DATAPOINTS</p>{d.findings.length}</div>
      </div>
      {d.footer && <p>{d.footer}</p>}
    </section>,
    <section key="details" className="rs-page rs-dt">
      <div className="rs-dt__hdr"><span>01 / METADATA</span><span>{d.title}</span></div>
      <table className="rs-dt__table">
        <tbody>{d.details.map(([k, v]) => <tr key={k}><th>{k.toUpperCase()}</th><td>{v}</td></tr>)}</tbody>
      </table>
      <div className="rs-dt__hdr"><span>02 / FINDING INDEX</span><span>{d.findings.length} ROWS</span></div>
      <table className="rs-dt__table rs-dt__table--index">
        <thead><tr><th>ID</th><th>ROOM</th><th>AREA</th><th>SEV</th></tr></thead>
        <tbody>{d.findings.slice(0, 22).map((f, i) => (
          <tr key={f.key}><td>F{String(i + 1).padStart(3, "0")}</td><td>{f.room}</td><td>{f.area}</td><td><i className={`rs-dt__dot rs-dt__fill--${f.severity}`} />{SEV_LABEL[f.severity]}</td></tr>
        ))}</tbody>
      </table>
    </section>,
  ];
  chunk(d.findings, 3).forEach((group, gi) => pages.push(
    <section key={`f${gi}`} className="rs-page rs-dt">
      <div className="rs-dt__hdr"><span>03 / FINDINGS</span><span>PAGE {gi + 3}</span></div>
      {group.map((f, i) => (
        <article key={f.key} className="rs-dt__finding">
          <div className="rs-dt__photos">
            {f.thermalUrl && <figure><img src={f.thermalUrl} alt={f.thermalName} /><figcaption>IR · {f.thermalName}</figcaption></figure>}
            {f.visualUrl && <figure><img src={f.visualUrl} alt={f.visualName} /><figcaption>RGB · {f.visualName}</figcaption></figure>}
          </div>
          <div className="rs-dt__fdata">
            <div className="rs-dt__fhead"><b>F{String(gi * 3 + i + 1).padStart(3, "0")}</b><span className={`rs-dt__tag rs-dt__fill--${f.severity}`}>{SEV_LABEL[f.severity].toUpperCase()}</span></div>
            <p className="rs-dt__loc">{f.room} › {f.area}</p>
            {f.thermalObs && <p><span className="rs-dt__label">THERMAL</span> {f.thermalObs}</p>}
            {f.visualObs && <p><span className="rs-dt__label">VISUAL</span> {f.visualObs}</p>}
            {f.recommendation && <p><span className="rs-dt__label">ACTION</span> {f.recommendation}</p>}
          </div>
        </article>
      ))}
    </section>,
  ));
  return pages;
}
