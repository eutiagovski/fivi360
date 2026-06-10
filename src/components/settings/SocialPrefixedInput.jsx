/**
 * Campo de input com prefixo fixo para links sociais.
 *
 * @param {{
 *   id: string,
 *   name: string,
 *   value: string,
 *   onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
 *   prefix: React.ReactNode,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   testId?: string,
 *   inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'],
 *   type?: string,
 * }} props
 */
export function SocialPrefixedInput({
  id,
  name,
  value,
  onChange,
  prefix,
  placeholder = '',
  disabled = false,
  testId,
  inputMode,
  type = 'text',
}) {
  return (
    <div className="flex w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 focus-within:ring-1 focus-within:ring-white transition-all disabled:opacity-50 has-[:disabled]:opacity-50">
      <span
        className="flex shrink-0 items-center border-r border-zinc-800 px-3 py-3 text-sm text-zinc-500 select-none"
        aria-hidden="true"
      >
        {prefix}
      </span>
      <input
        type={type}
        id={id}
        name={name}
        data-testid={testId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
