// MariaDB API Client — replaces sqlite-db.js
// All data is stored in MariaDB via api.php

const DB_API = (function() {
  const STORAGE_KEY = 'formStorageConfig';

  function getConfig() {
    try {
      const cfg = localStorage.getItem(STORAGE_KEY);
      return cfg ? JSON.parse(cfg) : { apiUrl: '/api.php', tableName: 'conference_rooms', dbUsername: 'conf_user', dbPassword: 'JHSdfuy45klaye45' };
    } catch {
      return { apiUrl: '/api.php', tableName: 'conference_rooms', dbUsername: 'conf_user', dbPassword: 'JHSdfuy45klaye45' };
    }
  }

  function headers() {
    const cfg = getConfig();
    const h = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    const u = cfg.dbUsername || 'conf_user';
    const p = cfg.dbPassword || 'JHSdfuy45klaye45';
    if (u && p) h['Authorization'] = 'Basic ' + btoa(u + ':' + p);
    return h;
  }

  function apiUrl(path) {
    const cfg = getConfig();
    const base = cfg.apiUrl || 'api.php';
    return base + '/' + path;
  }

  async function request(path, opts = {}) {
    const url = apiUrl(path);
    const res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const msg = json?.error || text || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return json;
  }

  // Map form field names to MariaDB column names
  function mapToDb(data) {
    return {
      country: data['Country'] || '', state: data['State/Province'] || '', city: data['City'] || '',
      facility: data['Facility'] || '', building: data['Building'] || '', floor: data['Floor'] || '',
      room_name_id: data['RoomNameID'] || '', room_type: data['Room Type'] || '',
      capacity: data['Capacity'] || null, microsoft_teams: data['Microsoft Teams'] || '',
      room_tech: data['Room Tech'] || '', input_types: data['Input Type'] || '',
      room_depth: data['Room Depth'] || '', room_width: data['Room Width'] || '', room_height: data['Room Height'] || '',
      tech_date: data['Tech Date'] || '', technician_name: data['Technician Name'] || '',
      racf: data['RACF'] || '', technician_notes: data['Technician Notes'] || '',
      touch_panels: JSON.stringify(data.TouchPanels || []),
      ceiling_mics: JSON.stringify(data.CeilingMics || []),
      handheld_mics: JSON.stringify(data.HandheldMics || []),
      lapel_mics: JSON.stringify(data.LapelMics || []),
      speakers: JSON.stringify(data.Speakers || []),
      displays: JSON.stringify(data.Displays || []),
      inventory: JSON.stringify(data.Inventory || [])
    };
  }

  return {
    getConfig,
    headers,

    async getAllRooms(search) {
      const q = search ? '?q=' + encodeURIComponent(search) : '';
      return await request('records' + q);
    },

    async getRoomById(id) {
      return await request('records/' + id);
    },

    async insertRoom(formData) {
      const payload = mapToDb(formData);
      return await request('records', { method: 'POST', body: JSON.stringify(payload) });
    },

    async insertRoomRaw(dbData) {
      return await request('records', { method: 'POST', body: JSON.stringify(dbData) });
    },

    async updateRoom(id, formData) {
      const payload = mapToDb(formData);
      return await request('records/' + id, { method: 'PUT', body: JSON.stringify(payload) });
    },

    async deleteRoom(id) {
      return await request('records/' + id, { method: 'DELETE' });
    },

    async clearAllRooms() {
      return await request('records', { method: 'DELETE' });
    },

    async getStats() {
      return await request('stats');
    },

    async testConnection() {
      return await request('health');
    },

    mapToDb
  };
})();
