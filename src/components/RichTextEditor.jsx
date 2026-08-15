import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Quote, Code, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Undo, Redo, RemoveFormatting } from 'lucide-react';

export default function RichTextEditor({ value = '', onChange, placeholder = 'Escriba aquí...', minHeight = 140, maxHeight = 360 }) {
  const editorRef = useRef(null);
  const htmlRef = useRef(value || '');
  const [activeFormats, setActiveFormats] = useState({});

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
    htmlRef.current = value || '';
  }, [value]);

  const emitChange = () => {
    const html = editorRef.current ? editorRef.current.innerHTML : '';
    htmlRef.current = html;
    const hasText = (editorRef.current?.textContent || '').trim().length > 0;
    onChange?.(html, hasText);
  };

  const execCmd = (cmd, cmdValue = null) => {
    document.execCommand(cmd, false, cmdValue);
    emitChange();
    syncActiveFormats();
  };

  const syncActiveFormats = () => {
    const cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
    const next = {};
    cmds.forEach(c => { try { next[c] = document.queryCommandState(c); } catch { next[c] = false; } });
    try { next.block = (document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch { next.block = ''; }
    setActiveFormats(next);
  };

  const handleKeydown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      const map = { b: 'bold', i: 'italic', u: 'underline' };
      if (map[key]) { e.preventDefault(); execCmd(map[key]); }
      else if (key === 'z' && !e.shiftKey) { e.preventDefault(); execCmd('undo'); }
      else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); execCmd('redo'); }
    }
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) execCmd('createLink', url);
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', minHeight: 120 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '5px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap' }}>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} title="Deshacer (Ctrl+Z)" className="rich-toolbar-btn"><Undo size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} title="Rehacer (Ctrl+Y)" className="rich-toolbar-btn"><Redo size={16} /></button>
        <div className="rich-toolbar-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} title="Negrita (Ctrl+B)" className={`rich-toolbar-btn ${activeFormats.bold ? 'active' : ''}`}><Bold size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} title="Cursiva (Ctrl+I)" className={`rich-toolbar-btn ${activeFormats.italic ? 'active' : ''}`}><Italic size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} title="Subrayado (Ctrl+U)" className={`rich-toolbar-btn ${activeFormats.underline ? 'active' : ''}`}><Underline size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} title="Tachado" className={`rich-toolbar-btn ${activeFormats.strikeThrough ? 'active' : ''}`}><Strikethrough size={16} /></button>
        <div className="rich-toolbar-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'h2'); }} title="Título" className={`rich-toolbar-btn ${activeFormats.block === 'h2' ? 'active' : ''}`}><Heading1 size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'h3'); }} title="Subtítulo" className={`rich-toolbar-btn ${activeFormats.block === 'h3' ? 'active' : ''}`}><Heading2 size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }} title="Cita" className={`rich-toolbar-btn ${activeFormats.block === 'blockquote' ? 'active' : ''}`}><Quote size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'pre'); }} title="Código" className={`rich-toolbar-btn ${activeFormats.block === 'pre' ? 'active' : ''}`}><Code size={16} /></button>
        <div className="rich-toolbar-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} title="Lista" className={`rich-toolbar-btn ${activeFormats.insertUnorderedList ? 'active' : ''}`}><List size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} title="Lista numerada" className={`rich-toolbar-btn ${activeFormats.insertOrderedList ? 'active' : ''}`}><ListOrdered size={16} /></button>
        <div className="rich-toolbar-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} title="Alinear izquierda"><AlignLeft size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} title="Centrar"><AlignCenter size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} title="Alinear derecha"><AlignRight size={16} /></button>
        <div className="rich-toolbar-sep" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} title="Insertar enlace"><LinkIcon size={16} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} title="Quitar formato"><RemoveFormatting size={16} /></button>
      </div>
      <div
        contentEditable
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        className="rich-editor"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emitChange}
        onKeyDown={handleKeydown}
        onMouseUp={syncActiveFormats}
        onKeyUp={syncActiveFormats}
        style={{ minHeight, maxHeight, padding: '12px 14px', outline: 'none', fontSize: 14, lineHeight: 1.6, overflowY: 'auto', color: '#1e293b' }}
      />
    </div>
  );
}
