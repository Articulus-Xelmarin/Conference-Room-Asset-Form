/**
 * Asset Viewer - Display all assets for a selected room
 * Retrieves roomId from sessionStorage and loads data from MariaDB via API
 */

// Render functions for each asset type
function renderTouchPanels(data) {
  const table = document.getElementById('touchPanelsTable');
  const tbody = document.getElementById('touchPanelsBody');
  const empty = document.getElementById('touchPanelsEmpty');

  if (!data || data.trim() === '') {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  try {
    const panels = JSON.parse(data);
    if (!Array.isArray(panels) || panels.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    tbody.innerHTML = panels.map(panel => `
      <tr>
        <td>${panel.type || '–'}</td>
        <td>${panel.model || '–'}</td>
        <td>${panel.serial || '–'}</td>
        <td><code>${panel.mac || '–'}</code></td>
        <td>${panel.location || '–'}</td>
        <td><code>${panel.ip || '–'}</code></td>
      </tr>
    `).join('');

    table.style.display = 'table';
    empty.style.display = 'none';
  } catch (e) {
    console.error('Error parsing touch panels:', e);
    empty.innerHTML = '<p class="text-error">Error displaying touch panels</p>';
  }
}

function renderDisplays(data) {
  const table = document.getElementById('displaysTable');
  const tbody = document.getElementById('displaysBody');
  const empty = document.getElementById('displaysEmpty');

  if (!data || data.trim() === '') {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  try {
    const displays = JSON.parse(data);
    if (!Array.isArray(displays) || displays.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    tbody.innerHTML = displays.map(display => `
      <tr>
        <td>${display.type || '–'}</td>
        <td>${display.make || '–'}</td>
        <td>${display.model || '–'}</td>
        <td>${display.size || '–'}</td>
        <td>${display.serial || '–'}</td>
        <td><code>${display.mac || '–'}</code></td>
        <td><code>${display.ip || '–'}</code></td>
      </tr>
    `).join('');

    table.style.display = 'table';
    empty.style.display = 'none';
  } catch (e) {
    console.error('Error parsing displays:', e);
    empty.innerHTML = '<p class="text-error">Error displaying displays</p>';
  }
}

function renderSpeakers(data) {
  const table = document.getElementById('speakersTable');
  const tbody = document.getElementById('speakersBody');
  const empty = document.getElementById('speakersEmpty');

  if (!data || data.trim() === '') {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  try {
    const speakers = JSON.parse(data);
    if (!Array.isArray(speakers) || speakers.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    tbody.innerHTML = speakers.map(speaker => `
      <tr>
        <td>${speaker.type || '–'}</td>
        <td>${speaker.make || '–'}</td>
        <td>${speaker.model || '–'}</td>
        <td>${speaker.qty || speaker.quantity || 1}</td>
      </tr>
    `).join('');

    table.style.display = 'table';
    empty.style.display = 'none';
  } catch (e) {
    console.error('Error parsing speakers:', e);
    empty.innerHTML = '<p class="text-error">Error displaying speakers</p>';
  }
}

function renderMicrophones(data) {
  const container = document.getElementById('microphonesContent');
  const empty = document.getElementById('micEmpty');

  const types = {
    ceiling_mics: 'Ceiling Microphones',
    handheld_mics: 'Handheld Microphones',
    lapel_mics: 'Lapel/Lavalier Microphones'
  };

  let hasAny = false;
  let html = '';

  for (const [key, label] of Object.entries(types)) {
    const value = data[key];
    if (!value || value.trim() === '') continue;

    try {
      const items = JSON.parse(value);
      if (!Array.isArray(items) || items.length === 0) continue;

      hasAny = true;
      html += `
        <div class="margin-bottom-16">
          <h4 class="mt-0 mb-8">${label}</h4>
          <table class="asset-table font-small">
            <thead>
              <tr>
                <th>Make</th>
                <th>Model</th>
                <th>Quantity</th>
                <th>Frequency/Location</th>
                <th>Serial Numbers</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.make || '–'}</td>
                  <td>${item.model || '–'}</td>
                  <td>${item.qty || item.quantity || 1}</td>
                  <td>${item.frequency || item.location || '–'}</td>
                  <td><code class="font-xsmall">${item.sn || item.serials || '–'}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      console.error(`Error parsing ${key}:`, e);
    }
  }

  if (hasAny) {
    container.innerHTML = html;
    empty.style.display = 'none';
  } else {
    empty.style.display = 'block';
  }
}

function renderInventory(data) {
  const table = document.getElementById('inventoryTable');
  const tbody = document.getElementById('inventoryBody');
  const empty = document.getElementById('inventoryEmpty');

  if (!data || data.trim() === '') {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  try {
    const items = JSON.parse(data);
    if (!Array.isArray(items) || items.length === 0) {
      table.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item['Device Type'] || item.device_type || '–'}</td>
        <td>${item['Device Make'] || item.make || '–'}</td>
        <td>${item['Device Model'] || item.model || '–'}</td>
        <td>${item['Location'] || item.location || '–'}</td>
        <td><code>${item['Barcode'] || item.barcode || '–'}</code></td>
        <td><code>${item['Serial Number'] || item.serial || '–'}</code></td>
      </tr>
    `).join('');

    table.style.display = 'table';
    empty.style.display = 'none';
  } catch (e) {
    console.error('Error parsing inventory:', e);
    empty.innerHTML = '<p class="text-error">Error displaying inventory</p>';
  }
}

function renderPhotos(room) {
  const container = document.getElementById('roomPhotos');

  const photoNames = room.room_photos || '';
  if (!photoNames.trim()) {
    container.innerHTML = '<p class="muted">No photos uploaded</p>';
    return;
  }

  const names = photoNames.split(';').map(name => name.trim()).filter(name => name);
  if (names.length === 0) {
    container.innerHTML = '<p class="muted">No photos uploaded</p>';
    return;
  }

  // Sanitize room name for directory
  const roomName = (room.room_name || '').replace(/[^a-zA-Z0-9\-_]/g, '_');

  const html = names.map(name => `
    <div class="margin-bottom-16 inline-block">
      <img src="/Photos/${roomName}/${name}" alt="${name}" class="img-asset-thumb" onerror="this.style.display='none';" />
      <br/>
      <small class="muted">${name}</small>
    </div>
  `).join('');

  container.innerHTML = html;
}

// Format date for display
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Main initialization
async function initViewer() {
  const roomId = parseInt(sessionStorage.getItem('selectedRoomId'), 10);

  if (!roomId) {
    document.title = 'Room Not Found';
    document.body.innerHTML += '<div class="wrap"><div class="card"><p class="text-error">No room selected. <a href="./index.php">Return to finder</a></p></div></div>';
    return;
  }

  try {
    const room = await DB_API.getRoomById(roomId);

    if (!room) {
      document.title = 'Room Not Found';
      document.body.innerHTML += '<div class="wrap"><div class="card"><p class="text-error">Room data not found. <a href="./index.php">Return to finder</a></p></div></div>';
      return;
    }

    // Render room header with location hierarchy
    const headerHTML = `
      ${room.country ? `<div class="room-header-item"><strong>Country</strong>${room.country}</div>` : ''}
      ${room.state ? `<div class="room-header-item"><strong>State</strong>${room.state}</div>` : ''}
      ${room.city ? `<div class="room-header-item"><strong>City</strong>${room.city}</div>` : ''}
      ${room.facility ? `<div class="room-header-item"><strong>Facility</strong>${room.facility}</div>` : ''}
      ${room.building ? `<div class="room-header-item"><strong>Building</strong>${room.building}</div>` : ''}
      ${room.floor ? `<div class="room-header-item"><strong>Floor</strong>${room.floor}</div>` : ''}
      ${room.room_name_id ? `<div class="room-header-item"><strong>Room</strong>${room.room_name_id}</div>` : ''}
    `;
    document.getElementById('roomHeader').innerHTML = headerHTML;
    document.title = `${room.facility || ''} – ${room.room_name_id || 'Room Assets'}`.trim();

    // Room configuration details
    const configHTML = `
      <table class="asset-table mt-0">
        <tbody>
          ${room.room_type ? `<tr><td><strong>Room Type</strong></td><td>${room.room_type}</td></tr>` : ''}
          ${room.capacity ? `<tr><td><strong>Capacity</strong></td><td>${room.capacity} people</td></tr>` : ''}
          ${room.microsoft_teams ? `<tr><td><strong>Microsoft Teams</strong></td><td>${room.microsoft_teams}</td></tr>` : ''}
          ${room.room_tech ? `<tr><td><strong>Room Tech</strong></td><td>${room.room_tech}</td></tr>` : ''}
          ${room.input_types ? `<tr><td><strong>Input Types</strong></td><td>${room.input_types}</td></tr>` : ''}
          ${room.room_depth ? `<tr><td><strong>Room Depth</strong></td><td>${room.room_depth}</td></tr>` : ''}
          ${room.room_width ? `<tr><td><strong>Room Width</strong></td><td>${room.room_width}</td></tr>` : ''}
          ${room.room_height ? `<tr><td><strong>Room Height</strong></td><td>${room.room_height}</td></tr>` : ''}
          ${room.technician_notes ? `<tr><td><strong>Notes</strong></td><td>${room.technician_notes}</td></tr>` : ''}
          ${room.created_at ? `<tr><td><strong>Record Created</strong></td><td>${formatDate(room.created_at)}</td></tr>` : ''}
        </tbody>
      </table>
    `;
    document.getElementById('roomDetails').innerHTML = configHTML || '<p class="muted">No configuration details recorded</p>';

    // Render all assets
    renderTouchPanels(room.touch_panels);
    renderDisplays(room.displays);
    renderSpeakers(room.speakers);
    renderMicrophones({
      ceiling_mics: room.ceiling_mics,
      handheld_mics: room.handheld_mics,
      lapel_mics: room.lapel_mics
    });
    renderInventory(room.inventory);
    renderPhotos(room);

    // Add edit button functionality
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        sessionStorage.setItem('editingRoomId', roomId);
        window.location.href = '../index.php';
      });
    }

    // Add delete button functionality
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Delete "${room.room_name_id}" from ${room.facility}?\n\nThis action cannot be undone.`)) {
          try {
            await DB_API.deleteRoom(roomId);
            alert('Room deleted successfully');
            window.location.href = './index.php';
          } catch (err) {
            alert('Error deleting room: ' + err.message);
          }
        }
      });
    }

    // Technician info
    const techHTML = room.technician_name || room.tech_date ? `
      <table class="asset-table mt-0">
        <tbody>
          ${room.tech_date ? `<tr><td><strong>Date</strong></td><td>${room.tech_date}</td></tr>` : ''}
          ${room.technician_name ? `<tr><td><strong>Technician</strong></td><td>${room.technician_name}</td></tr>` : ''}
          ${room.racf ? `<tr><td><strong>RACF</strong></td><td>${room.racf}</td></tr>` : ''}
        </tbody>
      </table>
    ` : '<p class="muted">No technician information recorded</p>';
    document.getElementById('techInfo').innerHTML = techHTML;

  } catch (error) {
    console.error('Error loading room:', error);
    document.title = 'Error Loading Room';
    document.body.innerHTML += `<div class="wrap"><div class="card"><p class="text-error">Failed to load room data: ${error.message}</p></div></div>`;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initViewer);
