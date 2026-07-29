export const SectionHeader = ({ title, subtitle, actions, dataTestId }) => {
  const heading = (
    <h2
      className={`text-xl sm:text-2xl font-light tracking-tight text-white${actions ? '' : ' mb-6'}`}
      data-testid={dataTestId}
    >
      {title}
    </h2>
  );

  if (actions) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          {heading}
          {subtitle && <p className="text-sm text-zinc-400 mt-2">{subtitle}</p>}
        </div>
        <div className="w-full sm:w-auto shrink-0 [&_button]:w-full sm:[&_button]:w-auto [&_a]:w-full sm:[&_a]:w-auto [&_a]:justify-center sm:[&_a]:inline-flex [&>span]:block [&>span]:w-full sm:[&>span]:w-auto sm:[&>span]:inline-block">
          {actions}
        </div>
      </div>
    );
  }

  return (
    <>
      {heading}
      {subtitle && <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>}
    </>
  );
};
