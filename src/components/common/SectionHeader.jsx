export const SectionHeader = ({ title, subtitle, actions, dataTestId }) => {
  const heading = (
    <h2
      className={`text-2xl sm:text-3xl font-light tracking-tight text-white${actions ? '' : ' mb-6'}`}
      data-testid={dataTestId}
    >
      {title}
    </h2>
  );

  if (actions) {
    return (
      <div className="flex items-center justify-between mb-6">
        <div>
          {heading}
          {subtitle && <p className="text-base text-zinc-400 mt-2">{subtitle}</p>}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <>
      {heading}
      {subtitle && <p className="text-base text-zinc-400 mb-6">{subtitle}</p>}
    </>
  );
};
