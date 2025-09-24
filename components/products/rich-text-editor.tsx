"use client";

import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

interface Command {
  label: string;
  aria: string;
  exec: () => void;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = editorRef.current;
    if (!element) {
      return;
    }
    const next = value ?? "";
    if (next !== element.innerHTML) {
      element.innerHTML = next;
    }
    if (!next && placeholder) {
      element.setAttribute("data-placeholder", placeholder);
    } else {
      element.removeAttribute("data-placeholder");
    }
  }, [value, placeholder]);

  useEffect(() => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    function handleInput() {
      onChange(element.innerHTML);
    }

    element.addEventListener("input", handleInput);
    element.addEventListener("blur", handleInput);

    return () => {
      element.removeEventListener("input", handleInput);
      element.removeEventListener("blur", handleInput);
    };
  }, [onChange]);

  const insertLink = () => {
    const url = window.prompt("Enter link URL (https://…)");
    if (!url) {
      return;
    }
    document.execCommand("createLink", false, url.trim());
  };

  const insertImage = () => {
    const url = window.prompt("Image URL (https://…)");
    if (!url) {
      return;
    }
    document.execCommand(
      "insertHTML",
      false,
      `<figure><img src="${url.trim()}" alt="" loading="lazy" /><figcaption></figcaption></figure>`
    );
  };

  const insertVideo = () => {
    const url = window.prompt("Embed video URL (YouTube, Loom, etc.)");
    if (!url) {
      return;
    }
    const sanitized = url.trim();
    const iframe = `<div class="aspect-video"><iframe src="${sanitized}" loading="lazy" allowfullscreen></iframe></div>`;
    document.execCommand("insertHTML", false, iframe);
  };

  const commands: Command[] = [
    { label: "B", aria: "Bold", exec: () => document.execCommand("bold") },
    { label: "I", aria: "Italic", exec: () => document.execCommand("italic") },
    {
      label: "U",
      aria: "Underline",
      exec: () => document.execCommand("underline"),
    },
    {
      label: "H2",
      aria: "Heading",
      exec: () => document.execCommand("formatBlock", false, "<h2>"),
    },
    {
      label: "UL",
      aria: "Bullet list",
      exec: () => document.execCommand("insertUnorderedList"),
    },
    {
      label: "OL",
      aria: "Numbered list",
      exec: () => document.execCommand("insertOrderedList"),
    },
    {
      label: "Quote",
      aria: "Quote",
      exec: () => document.execCommand("formatBlock", false, "<blockquote>"),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {commands.map((item) => (
          <button
            key={item.aria}
            type="button"
            onClick={() => item.exec()}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
            aria-label={item.aria}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={insertLink}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          aria-label="Insert link"
        >
          Link
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          aria-label="Insert image"
        >
          Image
        </button>
        <button
          type="button"
          onClick={insertVideo}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          aria-label="Insert video"
        >
          Video
        </button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor min-h-[260px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/30"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">
        Paste content directly from documents, or use the toolbar to insert media. The text will be formatted automatically.
      </p>
    </div>
  );
}
