'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default as unknown),
  { ssr: false }
) as unknown;

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  language = 'handlebars',
  height = '500px',
  readOnly = false,
}: PromptEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={localValue}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          readOnly,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
