interface SearchInputProps {
  placeholder?: string;
  name?: string;
  value?: string;
}

export function SearchInput({
  placeholder = "search snippets...",
  name = "q",
  value,
}: SearchInputProps) {
  return (
    <div class="flex items-center gap-2 border border-sky-200 bg-white px-4 py-3">
      <span class="font-mono text-sm text-sky-400">$</span>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        data-testid="search-input"
        class="flex-1 bg-transparent font-mono text-sm text-sky-900 placeholder:text-sky-300 focus:outline-none"
      />
    </div>
  );
}
