export function PlaceholderPanel({
  title,
  laterUse
}: {
  title: string;
  laterUse: string;
}) {
  return (
    <section>
      <p className="placeholder-flag">Placeholder shell</p>
      <h1>{title}</h1>
      <p className="lede">
        This section is a placeholder. {title} is not implemented in this MVP.
      </p>
      <div className="panel">
        <h2>Intended later use</h2>
        <p className="muted">{laterUse}</p>
        <p className="muted">
          Status: not implemented. Do not treat this screen as a working workflow.
        </p>
      </div>
    </section>
  );
}
