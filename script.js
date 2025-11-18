/* script.js
   Matches the provided index.html and style.css
   - localStorage key: "vintageNotes"
   - IDs/classes match HTML: noteInput, addBtn, notesContainer, noteCount, searchInput, exportBtn, clearAllBtn
   - Modals and modal buttons: deleteModal, clearAllModal, editModal, cancelDelete, confirmDelete, cancelClearAll, confirmClearAll, cancelEdit, confirmEdit
*/

const noteInput = document.getElementById('noteInput');
const addBtn = document.getElementById('addBtn');
const notesContainer = document.getElementById('notesContainer');
const noteCount = document.getElementById('noteCount');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// Modals and modal controls
const deleteModal = document.getElementById('deleteModal');
const clearAllModal = document.getElementById('clearAllModal');
const editModal = document.getElementById('editModal');

const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

const cancelClearAll = document.getElementById('cancelClearAll');
const confirmClearAll = document.getElementById('confirmClearAll');

const cancelEdit = document.getElementById('cancelEdit');
const confirmEdit = document.getElementById('confirmEdit');
const editTextarea = document.getElementById('editTextarea');

const colors = ['color-1', 'color-2', 'color-3', 'color-4'];
let colorIndex = 0;

// State
let draggedElement = null;
let noteToDelete = null;
let noteToEdit = null;

// Load on init
loadNotes();

// ---------- Local storage helpers ----------
function loadNotes() {
    const saved = JSON.parse(localStorage.getItem('vintageNotes') || '[]');
    notesContainer.innerHTML = '';
    if (saved.length === 0) {
        notesContainer.innerHTML = '<div class="empty-state">No notes yet. Start adding your thoughts!</div>';
    } else {
        saved.forEach(n => createNoteElement(n.text, n.color, n.timestamp, n.id));
    }
    updateNoteCount();
}

function saveNotes() {
    const notes = [];
    document.querySelectorAll('.note').forEach(note => {
        const text = note.querySelector('.note-text').textContent;
        const color = Array.from(note.classList).find(c => c.startsWith('color-')) || 'color-1';
        const timestamp = note.querySelector('.note-timestamp').textContent;
        const id = note.dataset.id;
        notes.push({ text, color, timestamp, id });
    });
    localStorage.setItem('vintageNotes', JSON.stringify(notes));
}

// ---------- Utilities ----------
function getTimestamp() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
}

function generateId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function updateNoteCount() {
    const count = notesContainer.querySelectorAll('.note').length;
    if (count === 0) {
        noteCount.style.display = 'none';
    } else {
        noteCount.style.display = 'block';
        noteCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
    }
}

// ---------- Create / Add ----------
function createNoteElement(text, color, timestamp, id) {
    const note = document.createElement('div');
    note.className = `note ${color || colors[colorIndex]}`;
    note.draggable = true;
    note.dataset.id = id || generateId();

    note.innerHTML = `
        <div class="note-timestamp">${timestamp || getTimestamp()}</div>
        <span class="note-text">${text}</span>
        <div class="note-actions">
            <button class="note-btn edit-btn" title="Edit">✏️</button>
            <button class="note-btn delete-btn" title="Delete">✕</button>
        </div>
    `;

    // Attach listeners for edit/delete and drag
    note.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(note));
    note.querySelector('.edit-btn').addEventListener('click', () => openEditModal(note));
    addDragEvents(note);

    // insert and animate
    const emptyState = notesContainer.querySelector('.empty-state');
    if (emptyState) notesContainer.innerHTML = '';
    notesContainer.appendChild(note);

    // small entrance animation
    note.style.opacity = '0';
    note.style.transform = 'scale(0.9)';
    setTimeout(() => {
        note.style.transition = 'all 0.35s ease';
        note.style.opacity = '1';
        note.style.transform = `scale(1) rotate(${Math.random() > 0.5 ? '1deg' : '-1deg'})`;
    }, 10);

    updateNoteCount();
    saveNotes();
    return note;
}

function addNote() {
    const noteText = noteInput.value.trim();
    if (noteText === '') {
        noteInput.focus();
        return;
    }

    const currentColor = colors[colorIndex];
    const timestamp = getTimestamp();
    const id = generateId();

    createNoteElement(noteText, currentColor, timestamp, id);

    colorIndex = (colorIndex + 1) % colors.length;
    noteInput.value = '';
    noteInput.focus();
}

// ---------- Modals ----------
function openDeleteModal(noteEl) {
    noteToDelete = noteEl;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    noteToDelete = null;
}

function deleteNote() {
    if (!noteToDelete) return;
    noteToDelete.style.transform = 'scale(0) rotate(10deg)';
    noteToDelete.style.opacity = '0';
    setTimeout(() => {
        noteToDelete.remove();
        checkEmpty();
        updateNoteCount();
        saveNotes();
        closeDeleteModal();
    }, 280);
}

function openEditModal(noteEl) {
    noteToEdit = noteEl;
    const noteText = noteEl.querySelector('.note-text').textContent;
    editTextarea.value = noteText;
    editModal.classList.add('active');
    // focus after slight delay to allow modal to display
    setTimeout(() => editTextarea.focus(), 50);
}

function closeEditModal() {
    editModal.classList.remove('active');
    noteToEdit = null;
}

function saveEditedNote() {
    if (!noteToEdit) return;
    const newText = editTextarea.value.trim();
    if (newText !== '') {
        noteToEdit.querySelector('.note-text').textContent = newText;
        noteToEdit.querySelector('.note-timestamp').textContent = getTimestamp();
        saveNotes();
    }
    closeEditModal();
}

// ---------- Empty check ----------
function checkEmpty() {
    if (notesContainer.children.length === 0) {
        notesContainer.innerHTML = '<div class="empty-state">No notes yet. Start adding your thoughts!</div>';
    }
}

// ---------- Search ----------
searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        const text = note.querySelector('.note-text').textContent.toLowerCase();
        if (text.includes(searchTerm)) note.classList.remove('hidden');
        else note.classList.add('hidden');
    });
});

// ---------- Export ----------
exportBtn.addEventListener('click', function () {
    const notes = JSON.parse(localStorage.getItem('vintageNotes') || '[]');
    if (notes.length === 0) {
        alert('No notes to export!');
        return;
    }
    const exportText = notes.map((note, i) => `Note ${i+1} (${note.timestamp}):\n${note.text}\n`).join('\n---\n\n');
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// ---------- Clear All ----------
clearAllBtn.addEventListener('click', function () {
    if (notesContainer.querySelectorAll('.note').length > 0) {
        clearAllModal.classList.add('active');
    }
});

document.getElementById('confirmClearAll').addEventListener('click', function () {
    notesContainer.innerHTML = '<div class="empty-state">No notes yet. Start adding your thoughts!</div>';
    localStorage.removeItem('vintageNotes');
    updateNoteCount();
    clearAllModal.classList.remove('active');
});

document.getElementById('cancelClearAll').addEventListener('click', function () {
    clearAllModal.classList.remove('active');
});

// ---------- Delete modal buttons ----------
document.getElementById('confirmDelete').addEventListener('click', deleteNote);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);

// ---------- Edit modal buttons ----------
document.getElementById('confirmEdit').addEventListener('click', saveEditedNote);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

// Close modals when clicking on overlay background
[deleteModal, clearAllModal, editModal].forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            // clear references
            if (modal === deleteModal) noteToDelete = null;
            if (modal === editModal) noteToEdit = null;
        }
    });
});

// ---------- Drag & reorder (works by DOM reordering) ----------
function addDragEvents(note) {
    note.addEventListener('dragstart', function (e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    note.addEventListener('dragend', function () {
        this.classList.remove('dragging');
        saveNotes();
    });

    note.addEventListener('dragover', function (e) {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(notesContainer, e.clientY);

        if (!afterElement) {
            notesContainer.appendChild(dragging);
        } else {
            notesContainer.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.note:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ---------- Input handlers ----------
addBtn.addEventListener('click', addNote);
noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNote();
});
