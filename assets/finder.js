// Room Finder - Simplified list and filter for finding rooms

// Database functions are provided by ../js/sqlite-db.js
// See sqlite-db.js for: initDatabase, getAllRooms, getRoomById, etc.

const $ = (sel) => document.querySelector(sel);
let allRooms = [];

function renderRooms(rooms) {
  const roomList = $('#roomList');
  if (!roomList) return;

  if (rooms.length === 0) {
    roomList.innerHTML = '<p>No rooms found.</p>';
    return;
  }

  roomList.innerHTML = rooms.map(room => `
    <div class="room-item" data-id="${room.id}">
      <div class="room-item-content">
        <div class="room-item-left">
          <h3 class="room-item-heading">${room.room_name}</h3>
          <p class="room-item-subtext">${[room.facility, room.city, room.state, room.country].filter(Boolean).join(', ')}</p>
        </div>
        <button class="delete-btn btn-delete-sm" data-id="${room.id}">Delete</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.room-item').forEach(item => {
    // View room on main content area click
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn')) {
        sessionStorage.setItem('selectedRoomId', item.dataset.id);
        window.location.href = './room.html';
      }
    });
  });

  // Delete button handlers
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const roomId = btn.dataset.id;
      const room = rooms.find(r => r.id === parseInt(roomId));
      
      if (confirm(`Delete "${room.room_name}" from ${room.facility}?\n\nThis action cannot be undone.`)) {
        try {
          deleteRoom(roomId);
          allRooms = getAllRooms();
          renderRooms(allRooms);
        } catch (err) {
          alert('Error deleting room: ' + err.message);
        }
      }
    });
  });
}

function filterRooms() {
  const searchTerm = $('#roomSearch').value.toLowerCase();
  const filteredRooms = allRooms.filter(room => {
    return Object.values(room).some(value =>
      String(value).toLowerCase().includes(searchTerm)
    );
  });
  renderRooms(filteredRooms);
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureDatabaseReady();
    allRooms = getAllRooms();
    renderRooms(allRooms);
  } catch (e) {
    console.error('Error:', e);
    $('#roomList').innerHTML = '<p>Error loading database.</p>';
  }

  $('#roomSearch')?.addEventListener('input', filterRooms);
});
