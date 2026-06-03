export const PageHeader = ({ title, subtitle, actions, align = 'left', dataTestId }) => {
  const isCenter = align === 'center';

  const titleContent = (
    <>
      <h1
        className={`text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white ${isCenter ? 'mb-4' : 'mb-2'}`}
        data-testid={dataTestId}
      >
        {title}
      </h1>
      {subtitle && <p className="text-base text-zinc-400">{subtitle}</p>}
    </>
  );

  const containerClass = [
    isCenter ? 'text-center' : '',
    'mb-12',
    actions ? 'flex items-center justify-between' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (actions) {
    return (
      <div className={containerClass}>
        <div>{titleContent}</div>
        {actions}
      </div>
    );
  }

  return <div className={containerClass}>{titleContent}</div>;
};
