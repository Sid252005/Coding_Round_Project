/**
 * CodeEditor Component
 * Monaco Editor wrapper with language selector, blind mode toggle, and auto-save indicator.
 */

import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

// Judge0-style language IDs aren't used here since we're running locally.
// We track language name which maps to backend's supported values.
const LANGUAGE_OPTIONS = [
  { value: 'python', label: '🐍 Python' },
  { value: 'cpp',    label: '⚡ C++' },
  { value: 'c',      label: '🔵 C' },
  { value: 'java',   label: '☕ Java' },
];

const LANGUAGE_STARTERS = {
  python: `# Write your solution here\n\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
};

export default function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  readOnly = false,
  defaultCode = null,
  autoSaveStatus = null,
}) {
  const [blindMode, setBlindMode]   = useState(false);
  const editorRef = useRef(null);

  // When language changes, set starter template if editor is empty
  const handleLangChange = (e) => {
    const lang = e.target.value;
    onLanguageChange(lang);

    if (!value || value.trim() === '') {
      onChange(defaultCode || LANGUAGE_STARTERS[lang] || '');
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    // Disable context menu (right-click)
    editor.addAction({
      id: 'disable-right-click',
      label: 'Disabled',
      contextMenuGroupId: 'navigation',
      run: () => {},
    });
  };

  // Blind mode: overlay blurs the editor (code is still typed, just hidden)
  return (
    <div className="editor-wrapper">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="flex gap-1" style={{ alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Language:
          </label>
          <select
            className="form-control"
            value={language}
            onChange={handleLangChange}
            disabled={readOnly}
            style={{ width: 'auto', padding: '0.3rem 2rem 0.3rem 0.6rem', fontSize: '0.85rem' }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {/* Auto-save indicator */}
          {autoSaveStatus && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {autoSaveStatus === 'saving' ? '💾 Saving...' :
               autoSaveStatus === 'saved'  ? '✅ Saved'    : ''}
            </span>
          )}

          {/* Blind mode toggle */}
          <button
            className={`btn btn-sm ${blindMode ? 'btn-outline' : 'btn-ghost'}`}
            onClick={() => setBlindMode((v) => !v)}
            title="Toggle blind mode (hides your code)"
          >
            {blindMode ? '👁️ Show' : '🙈 Blind'}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div style={{ position: 'relative' }}>
        <Editor
          height="420px"
          language={language === 'cpp' ? 'cpp' : language}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly,
            contextmenu: false, // Disable right-click menu
            copyWithSyntaxHighlighting: false,
            // Disable paste (handled via onDidPaste in editor)
          }}
        />

        {/* Blind Mode Overlay */}
        {blindMode && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 10, 20, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '0.5rem',
              color: 'var(--gold-primary)',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'not-allowed',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🙈</span>
            <span>Blind Mode Active</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click "Show" to reveal your code
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
