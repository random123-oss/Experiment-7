
const { useState, useEffect, useMemo } = React;
const h = React.createElement;

const STORAGE_KEY = "notes-app:v1";
const EMPTY = { title: "", body: "" };

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function App() {
  const [notes, setNotes] = useState(loadNotes);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const canSave = form.title.trim() || form.body.trim();

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    const now = Date.now();
    if (editingId) {
      setNotes((prev) => prev.map((n) => (n.id === editingId ? { ...n, ...form, updatedAt: now } : n)));
    } else {
      setNotes((prev) => [{ id: String(now) + Math.random().toString(16).slice(2), ...form, updatedAt: now }, ...prev]);
    }
    resetForm();
  }

  function startEdit(note) {
    setEditingId(note.id);
    setForm({ title: note.title, body: note.body });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) resetForm();
  }

  const noteCard = (n) =>
    h("li", { key: n.id, className: "note" + (n.id === editingId ? " editing" : "") },
      h("h2", null, n.title || "Untitled"),
      h("p", null, n.body),
      h("footer", null,
        h("time", null, new Date(n.updatedAt).toLocaleString()),
        h("span", null,
          h("button", { className: "link", onClick: () => startEdit(n) }, "Edit"),
          h("button", { className: "link danger", onClick: () => handleDelete(n.id) }, "Delete")
        )
      )
    );

  return h("div", { className: "app" },
    h("header", { className: "top" },
      h("h1", null, "Notes"),
      h("input", {
        className: "search", type: "search", placeholder: "Search notes",
        "aria-label": "Search notes", value: query,
        onChange: (e) => setQuery(e.target.value),
      })
    ),

    h("form", { className: "editor", onSubmit: handleSubmit },
      h("input", {
        className: "editor-title", placeholder: "Title", value: form.title,
        onChange: (e) => setForm({ ...form, title: e.target.value }),
      }),
      h("textarea", {
        placeholder: "Write your note here", rows: 4, value: form.body,
        onChange: (e) => setForm({ ...form, body: e.target.value }),
      }),
      h("div", { className: "editor-actions" },
        h("button", { className: "btn primary", type: "submit", disabled: !canSave },
          editingId ? "Save changes" : "Add note"),
        editingId && h("button", { className: "btn", type: "button", onClick: resetForm }, "Cancel")
      )
    ),

    visible.length === 0
      ? h("p", { className: "empty" },
          notes.length === 0 ? "No notes yet. Write your first one above." : "No notes match your search.")
      : h("ul", { className: "grid" }, visible.map(noteCard))
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));