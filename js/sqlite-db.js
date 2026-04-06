/**
 * SQLite Database Layer using sql.js
 * Provides persistent .db file storage without requiring any installation
 */

let db = null;
let SQL = null;
let dbReady = false;
let initPromise = null;

const DB_FILENAME = 'conference-rooms.db';
const DB_TABLE = 'rooms';

/**
 * Ensure database is initialized before use
 */
async function ensureDatabaseReady() {
  if (dbReady) return db;
  if (initPromise) return await initPromise;
  return await initDatabase();
}

/**
 * Initialize sql.js and load or create database
 */
async function initDatabase() {
  try {
    if (!SQL) {
      let initSqlJs = null;
      let wasmPath = null;
      
      try {
        // Try loading from local lib folder (offline mode)
        console.log('📂 Attempting to load sql.js from local files...');
        
        // Check if local files exist
        const response = await fetch('../lib/sql-wasm.js', { method: 'HEAD' });
        if (!response.ok) throw new Error('Local file not found');
        
        // Load sql.js script from local
        initSqlJs = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '../lib/sql-wasm.js';
          script.onload = () => {
            if (window.initSqlJs) {
              resolve(window.initSqlJs);
            } else {
              reject(new Error('initSqlJs not available after loading script'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load local sql-wasm.js'));
          document.head.appendChild(script);
        });
        
        wasmPath = '../lib/sql-wasm.wasm';
        console.log('✓ Loaded from local files (offline mode)');
      } catch (localErr) {
        // Fallback to CDN if local files not found
        console.log('⚠️ Local files not available, loading from CDN...', localErr.message);
        
        initSqlJs = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sql.js.org/dist/sql-wasm.js';
          script.onload = () => {
            if (window.initSqlJs) {
              resolve(window.initSqlJs);
            } else {
              reject(new Error('initSqlJs not available from CDN'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load from CDN'));
          document.head.appendChild(script);
        });
        
        wasmPath = 'https://sql.js.org/dist/sql-wasm.wasm';
        console.log('✓ Loaded from CDN');
      }
      
      if (!initSqlJs) {
        throw new Error('Failed to initialize sql.js');
      }
      
      // Initialize SQL with the WASM path
      SQL = await initSqlJs({
        locateFile: (filename) => {
          console.log(`📦 Loading ${filename}...`);
          return wasmPath.replace('sql-wasm.js', filename);
        }
      });
    }

    // Try to load existing database file
    let data = null;
    
    // Strategy 1: Check for database file in database/ folder
    try {
      const dbPath = '../database/database.db';
      console.log(`📂 Checking for database file in: ${dbPath}`);
      const response = await fetch(dbPath);
      if (response.ok) {
        data = new Uint8Array(await response.arrayBuffer());
        console.log('✓ Loaded database from database/ folder');
      }
    } catch (err) {
      console.log('ℹ️ No database file found in database/ folder');
    }
    
    // Strategy 2: Fallback to localStorage if no file-based database
    if (!data || data.length === 0) {
      const storedDb = localStorage.getItem('conference_db_binary');
      if (storedDb) {
        try {
          data = new Uint8Array(JSON.parse(storedDb));
          console.log('✓ Loaded existing database from localStorage');
        } catch (e) {
          console.log('ℹ️ No valid database in localStorage, creating new one');
        }
      }
    }

    // Create or load database
    if (data && data.length > 0) {
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
      createSchema();
      console.log('✓ Created new database');
    }

    dbReady = true;
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create database schema
 */
function createSchema() {
  if (!db) throw new Error('Database not initialized');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${DB_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT,
      state TEXT,
      city TEXT,
      facility TEXT,
      building TEXT,
      floor TEXT,
      room_name TEXT,
      room_code TEXT,
      room_type TEXT,
      microsoft_teams TEXT,
      capacity INTEGER,
      room_width REAL,
      room_length REAL,
      room_height REAL,
      room_features TEXT,
      touch_panels TEXT,
      ceiling_mics TEXT,
      handheld_mics TEXT,
      lapel_mics TEXT,
      speakers TEXT,
      displays TEXT,
      inventory TEXT,
      notes TEXT,
      tech_name TEXT,
      tech_email TEXT,
      tech_phone TEXT,
      tacf TEXT,
      photos TEXT,
      room_photos TEXT,
      createdAt TEXT
    );
  `;

  try {
    db.run(createTableSQL);
    saveDatabase();
  } catch (error) {
    console.error('Error creating schema:', error);
  }
}

/**
 * Save database to IndexedDB storage and offer download
 */
function saveDatabase() {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const data = db.export();
    const binary = Array.from(data);
    
    // Store in localStorage (limited but always available)
    try {
      localStorage.setItem('conference_db_binary', JSON.stringify(binary));
    } catch (e) {
      console.warn('Database too large for localStorage, using memory only');
    }
    
    console.log('✓ Database saved');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

/**
 * Map form field names to database column names
 */
function mapRoomFields(roomData) {
  const fieldMapping = {
    'Country': 'country',
    'State/Province': 'state',
    'City': 'city',
    'Facility': 'facility',
    'Building': 'building',
    'Floor': 'floor',
    'RoomNameID': 'room_name',
    'AVPM': 'room_code',
    'Capacity': 'capacity',
    'Room Type': 'room_type',
    'Microsoft Teams': 'microsoft_teams',
    'Room Depth': 'room_length',
    'Room Width': 'room_width',
    'Room Height': 'room_height',
    'Technician Name': 'tech_name',
    'Tech Date': 'createdAt',
    'RACF': 'tacf',
    'Technician Notes': 'notes',
    'TouchPanels': 'touch_panels',
    'CeilingMics': 'ceiling_mics',
    'HandheldMics': 'handheld_mics',
    'LapelMics': 'lapel_mics',
    'Speakers': 'speakers',
    'Displays': 'displays',
    'Inventory': 'inventory',
    'Room Photos': 'room_photos'
  };

  const mapped = {};
  
  // First pass: map standard fields
  Object.entries(roomData).forEach(([key, value]) => {
    if (key in fieldMapping) {
      mapped[fieldMapping[key]] = value;
    }
  });

  // Second pass: handle individual microphone fields and combine them
  // Collect ceiling microphone data
  const ceilingMicData = {};
  if (roomData['Ceiling Mics'] !== undefined) ceilingMicData.enabled = roomData['Ceiling Mics'];
  if (roomData['How Many Ceiling Mics'] !== undefined) ceilingMicData.qty = roomData['How Many Ceiling Mics'];
  if (roomData['Ceiling Mic Make'] !== undefined) ceilingMicData.make = roomData['Ceiling Mic Make'];
  if (roomData['Ceiling Mic Model'] !== undefined) ceilingMicData.model = roomData['Ceiling Mic Model'];
  if (roomData['Ceiling Mic Mac Address'] !== undefined) ceilingMicData.mac = roomData['Ceiling Mic Mac Address'];
  if (roomData['Ceiling Mic Serial Number'] !== undefined) ceilingMicData.sn = roomData['Ceiling Mic Serial Number'];
  
  // Use array if available, otherwise use collected data
  if (roomData['CeilingMics'] && Array.isArray(roomData['CeilingMics']) && roomData['CeilingMics'].length > 0) {
    mapped.ceiling_mics = roomData['CeilingMics'];
  } else if (Object.keys(ceilingMicData).length > 0) {
    mapped.ceiling_mics = [ceilingMicData];
  }

  // Collect handheld microphone data
  const handheldMicData = {};
  if (roomData['Handheld Mics'] !== undefined) handheldMicData.enabled = roomData['Handheld Mics'];
  if (roomData['How Many Handheld Mics'] !== undefined) handheldMicData.qty = roomData['How Many Handheld Mics'];
  if (roomData['Handheld Mic Receiver Serial Number'] !== undefined) handheldMicData.receiver_sn = roomData['Handheld Mic Receiver Serial Number'];
  if (roomData['Is Handheld Mic Reciever Dante'] !== undefined) handheldMicData.dante = roomData['Is Handheld Mic Reciever Dante'];
  if (roomData['Handheld Mic Receiver MAC'] !== undefined) handheldMicData.mac = roomData['Handheld Mic Receiver MAC'];
  
  if (roomData['HandheldMics'] && Array.isArray(roomData['HandheldMics']) && roomData['HandheldMics'].length > 0) {
    mapped.handheld_mics = roomData['HandheldMics'];
  } else if (Object.keys(handheldMicData).length > 0) {
    mapped.handheld_mics = [handheldMicData];
  }

  // Collect lapel microphone data
  const lapelMicData = {};
  if (roomData['Lapel Mics'] !== undefined) lapelMicData.enabled = roomData['Lapel Mics'];
  if (roomData['How Many Lapel Mics'] !== undefined) lapelMicData.qty = roomData['How Many Lapel Mics'];
  if (roomData['Lapel Mic Receiver Serial Number'] !== undefined) lapelMicData.receiver_sn = roomData['Lapel Mic Receiver Serial Number'];
  if (roomData['Is Lapel Mic Reciever Dante'] !== undefined) lapelMicData.dante = roomData['Is Lapel Mic Reciever Dante'];
  if (roomData['Lapel Mic Receiver MAC'] !== undefined) lapelMicData.mac = roomData['Lapel Mic Receiver MAC'];
  
  if (roomData['LapelMics'] && Array.isArray(roomData['LapelMics']) && roomData['LapelMics'].length > 0) {
    mapped.lapel_mics = roomData['LapelMics'];
  } else if (Object.keys(lapelMicData).length > 0) {
    mapped.lapel_mics = [lapelMicData];
  }

  return mapped;
}

/**
 * Insert a room record
 */
function insertRoom(roomData) {
  if (!db) throw new Error('Database not initialized');

  // Map form fields to database columns
  const mappedData = mapRoomFields(roomData);
  const fields = Object.keys(mappedData);
  
  // List of valid database columns (must match the CREATE TABLE schema)
  const schema_columns = ['id', 'country', 'state', 'city', 'facility', 'building', 'floor', 'room_name', 'room_code', 'room_type', 'microsoft_teams', 'capacity', 'room_width', 'room_length', 'room_height', 'room_features', 'touch_panels', 'ceiling_mics', 'handheld_mics', 'lapel_mics', 'speakers', 'displays', 'inventory', 'notes', 'tech_name', 'tech_email', 'tech_phone', 'tacf', 'photos', 'room_photos', 'createdAt'];
  
  // Filter out fields that don't exist in the table
  const validFields = fields.filter(field => schema_columns.includes(field));

  const placeholders = validFields.map(() => '?').join(',');
  const values = validFields.map(field => {
    const value = mappedData[field];
    return typeof value === 'object' ? JSON.stringify(value) : value;
  });

  const sql = `INSERT INTO ${DB_TABLE} (${validFields.join(',')}) VALUES (${placeholders})`;
  
  try {
    db.run(sql, values);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error inserting room:', error, 'SQL:', sql, 'Values:', values);
    throw error;
  }
}

/**
 * Get all rooms
 */
function getAllRooms() {
  if (!db) {
    console.warn('Database not yet initialized, returning empty array');
    return [];
  }

  try {
    const result = db.exec(`SELECT * FROM ${DB_TABLE} ORDER BY id DESC`);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    return [];
  }
}

/**
 * Get room by ID
 */
function getRoomById(id) {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec(
      `SELECT * FROM ${DB_TABLE} WHERE id = ${parseInt(id)}`
    );
    if (result.length === 0 || result[0].values.length === 0) return null;

    const columns = result[0].columns;
    const values = result[0].values[0];
    const room = {};
    
    columns.forEach((col, idx) => {
      room[col] = values[idx];
    });

    return room;
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

/**
 * Delete room by ID
 */
function deleteRoom(id) {
  if (!db) throw new Error('Database not initialized');

  try {
    db.run(`DELETE FROM ${DB_TABLE} WHERE id = ${parseInt(id)}`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

/**
 * Update room by ID
 */
function updateRoom(id, roomData) {
  if (!db) throw new Error('Database not initialized');

  // Map form fields to database columns
  const mappedData = mapRoomFields(roomData);
  const fields = Object.keys(mappedData);
  
  // List of valid database columns (must match the CREATE TABLE schema)
  const schema_columns = ['id', 'country', 'state', 'city', 'facility', 'building', 'floor', 'room_name', 'room_code', 'room_type', 'microsoft_teams', 'capacity', 'room_width', 'room_length', 'room_height', 'room_features', 'touch_panels', 'ceiling_mics', 'handheld_mics', 'lapel_mics', 'speakers', 'displays', 'inventory', 'notes', 'tech_name', 'tech_email', 'tech_phone', 'tacf', 'photos', 'room_photos', 'createdAt'];
  
  // Filter out fields that don't exist in the table
  const validFields = fields.filter(field => schema_columns.includes(field));
  
  // Build UPDATE SET clause
  const setClauses = validFields.map(field => `${field} = ?`).join(', ');
  const values = validFields.map(field => {
    const value = mappedData[field];
    return typeof value === 'object' ? JSON.stringify(value) : value;
  });
  
  const sql = `UPDATE ${DB_TABLE} SET ${setClauses} WHERE id = ${parseInt(id)}`;
  
  try {
    db.run(sql, values);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error updating room:', error, 'SQL:', sql, 'Values:', values);
    throw error;
  }
}

/**
 * Clear all records
 */
function clearAllRooms() {
  if (!db) throw new Error('Database not initialized');

  try {
    db.run(`DELETE FROM ${DB_TABLE}`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error clearing rooms:', error);
    throw error;
  }
}

/**
 * Load database from database/ folder (attempts to fetch database.db)
 */
async function loadDatabaseFromFolder() {
  if (!SQL) throw new Error('sql.js not initialized');
  
  try {
    console.log('📂 Loading database from database/ folder...');
    const response = await fetch('../database/database.db');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: File not found in database/ folder`);
    }
    
    const data = new Uint8Array(await response.arrayBuffer());
    
    // Validate and load
    const testDb = new SQL.Database(data);
    db = testDb;
    
    // Also save to localStorage as backup
    const binary = Array.from(data);
    try {
      localStorage.setItem('conference_db_binary', JSON.stringify(binary));
    } catch (err) {
      console.warn('Could not save to localStorage (too large)', err);
    }
    
    console.log('✓ Database loaded from database/ folder');
    return true;
  } catch (error) {
    console.error('Error loading from database folder:', error);
    throw error;
  }
}

/**
 * Export database as .db file (download)
 */
function exportDatabase() {
  if (!db) throw new Error('Database not initialized');

  try {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = DB_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✓ Database exported to Downloads folder');
    console.log(`💡 Tip: Move ${DB_FILENAME} to the database/ folder for automatic loading on next startup`);
    return true;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
}

/**
 * Import database from file
 */
function importDatabase(file) {
  if (!file) throw new Error('No file provided');
  if (!file.name.endsWith('.db')) {
    throw new Error('Please select a .db file');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        
        // Validate by trying to open it
        const testDb = new SQL.Database(data);
        
        // If successful, replace current database
        db = testDb;
        
        // Store in localStorage
        const binary = Array.from(data);
        try {
          localStorage.setItem('conference_db_binary', JSON.stringify(binary));
        } catch (err) {
          console.warn('Database too large for localStorage');
        }
        
        console.log('✓ Database imported');
        resolve(true);
      } catch (error) {
        reject(new Error('Invalid database file: ' + error.message));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  if (!db) return { records: 0, size: 0 };

  try {
    const result = db.exec(`SELECT COUNT(*) as count FROM ${DB_TABLE}`);
    const count = result.length > 0 ? result[0].values[0][0] : 0;
    
    const data = db.export();
    const sizeKB = (data.length / 1024).toFixed(2);
    
    return {
      records: count,
      size: sizeKB
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { records: 0, size: 0 };
  }
}

/**
 * Initialize on load
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!initPromise) {
      initPromise = initDatabase();
    }
    await initPromise;
    console.log('✓ Database initialized and ready');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
  }
});
