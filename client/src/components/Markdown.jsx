import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  p: (props) => <p className="mb-3 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  h1: (props) => <h1 className="mb-2 mt-4 text-xl font-semibold" {...props} />,
  h2: (props) => <h2 className="mb-2 mt-4 text-lg font-semibold" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-3 font-semibold" {...props} />,
  a: (props) => (
    <a
      className="text-violet-300 underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-4 border-zinc-600 pl-3 text-zinc-300"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-zinc-900/70 px-1 py-0.5 text-sm" {...props} />
  ),
  pre: (props) => (
    <pre
      className="mb-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border border-zinc-600 px-2 py-1 text-left font-semibold"
      {...props}
    />
  ),
  td: (props) => <td className="border border-zinc-700 px-2 py-1" {...props} />,
};

export default function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}