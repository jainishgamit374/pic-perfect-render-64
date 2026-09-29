import { chunk, SEV_LABEL, SEVS, type ReportData } from "./index";

export function StudioPages(d: ReportData) {
  const pages = [
    <section key="cover" className="rs-page rs-st">
      <div className="rs-st__bar"><span>INSPECT/REPORT</span><span>{d.date || "—"}</span></div>
      <h1 className="rs-st__title">HOUSE<br />CHECK.</h1>
      <div className="rs-st__cover">
        <div className="rs-st__photo">{d.coverUrl && <img src={d.coverUrl} alt="" />}</div>
        <div className="rs-st__block rs-st__block--yellow">
          <span>PROPERTY</span>
          <strong>{d.address}</strong>
        </div>
        <div className="rs-st__block rs-st__block--pink">
          <span>FINDINGS</span>
          <strong className="rs-st__big">{d.findings.length}</strong>
        </div>
      </div>
      <div className="rs-st__foot">FOR {d.client?.toUpperCase() || "CLIENT"} — BY {d.inspector?.toUpperCase() || "INSPECTOR"}</div>
    </section>,
    <section key="details" className="rs-page rs-st">
      <div className="rs-st__bar"><span>THE BASICS</span><span>P.02</span></div>
      <div className="rs-st__tally">
        {SEVS.map((s) => (
          <div key={s} className={`rs-st__tile rs-st__tile--${s}`}><strong>{d.counts[s]}</strong><span>{SEV_LABEL[s]}</span></div>
        ))}
      </div>
      <div className="rs-st__table">
        {d.details.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
      {d.notes && <p className="rs-st__note">{d.notes}</p>}
    </section>,
  ];
  chunk(d.findings, 2).forEach((group, gi) => pages.push(
    <section key={`f${gi}`} className="rs-page rs-st">
      <div className="rs-st__bar"><span>FINDINGS</span><span>P.{String(gi + 3).padStart(2, "0")}</span></div>
      {group.map((f, i) => (
        <article key={f.key} className={`rs-st__finding rs-st__finding--${f.severity}`}>
          <div className="rs-st__num">#{gi * 2 + i + 1}</div>
          <div className="rs-st__fbody">
            <div className="rs-st__fhead"><h3>{f.room.toUpperCase()}</h3><span className="rs-st__chip">{SEV_LABEL[f.severity].toUpperCase()}</span></div>
            <p className="rs-st__area">{f.area}</p>
            <div className="rs-st__photos">
              {f.thermalUrl && <img src={f.thermalUrl} alt={f.thermalName} />}
              {f.visualUrl && <img src={f.visualUrl} alt={f.visualName} />}
            </div>
            {f.thermalObs && <p><b>THERMAL:</b> {f.thermalObs}</p>}
            {f.visualObs && <p><b>VISUAL:</b> {f.visualObs}</p>}
            {f.recommendation && <p className="rs-st__fix"><b>DO THIS:</b> {f.recommendation}</p>}
          </div>
        </article>
      ))}
    </section>,
  ));
  return pages;
}
