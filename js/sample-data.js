/**
 * Sample Data Generator - Create realistic conference room records for testing
 * Uses DB_API (db-api.js) to insert into MariaDB via api.php
 * Run: generateSampleRooms() in browser console
 */

const SAMPLE_ROOMS = [
  {
    country: 'United States',
    state: 'Illinois',
    city: 'Moline',
    facility: 'Main Campus',
    building: '4th',
    floor: '1',
    room_name_id: '90HUD MAIN 4-13',
    room_type: 'Large Conference',
    microsoft_teams: 'Yes',
    capacity: 40,
    room_width: '25',
    room_depth: '35',
    room_height: '10',
    room_tech: 'Full AV Integration',
    input_types: 'HDMI, USB-C, Wireless',
    technician_notes: 'Located near elevator, natural light. Main conference room with full AV integration.',
    touch_panels: JSON.stringify([
      { type: 'Crestron', model: 'TSW-1060', serial: 'TS-001', mac: '4C:26:A7:7D:8A:57', location: 'Wall near entry', ip: '10.100.50.101' }
    ]),
    ceiling_mics: JSON.stringify([
      { make: 'Shure', model: 'MX410/2', qty: 2, frequency: '2.4GHz' }
    ]),
    handheld_mics: JSON.stringify([
      { qty: 2, receiver_sn: 'RX-0456', dante: 'No', mac: '4C:26:A7:7D:8B:42' }
    ]),
    lapel_mics: JSON.stringify([
      { qty: 4, receiver_sn: 'RX-0789', dante: 'No' }
    ]),
    speakers: JSON.stringify([
      { type: 'Ceiling', make: 'QSC', model: 'AC-C1', quantity: 6 },
      { type: 'Pendant', make: 'QSC', model: 'AC-P8', quantity: 2 }
    ]),
    displays: JSON.stringify([
      { type: 'Display', make: 'Sony', model: 'FWD-98Z9D', size: '98"', serial: 'SONY-001', mac: '4C:26:A7:7D:8C:33', ip: '10.100.50.201' },
      { type: 'Projector', make: 'Epson', model: 'EB-2250U', size: '1080p', serial: 'EP-101' }
    ]),
    inventory: JSON.stringify([
      { device_type: 'Codec', make: 'Cisco', model: 'SX80', location: 'AV Rack', serial: 'CISCO-001' },
      { device_type: 'Switcher', make: 'Extron', model: 'DM64', location: 'AV Rack', barcode: 'EXT-0001' }
    ]),
    technician_name: 'James Smith',
    racf: 'jsmith',
    tech_date: new Date().toISOString().slice(0, 10)
  },
  {
    country: 'United States',
    state: 'Illinois',
    city: 'Moline',
    facility: 'Main Campus',
    building: '4th',
    floor: '2',
    room_name_id: '85HUD MAIN 4-27',
    room_type: 'Medium Conference',
    microsoft_teams: 'Yes',
    capacity: 25,
    room_width: '18',
    room_depth: '28',
    room_height: '9',
    room_tech: 'Standard AV',
    input_types: 'HDMI, Wireless',
    technician_notes: 'Corner office. Smaller meeting space, good for executive briefings.',
    touch_panels: JSON.stringify([
      { type: 'AMX', model: 'N7XX', serial: 'AMX-001', mac: '4C:26:A7:7D:8D:44', location: 'Table', ip: '10.100.50.102' }
    ]),
    ceiling_mics: JSON.stringify([
      { make: 'Shure', model: 'MX412', qty: 1, frequency: '5.8GHz' }
    ]),
    handheld_mics: JSON.stringify([
      { qty: 1, receiver_sn: 'RX-0200', dante: 'Yes' }
    ]),
    lapel_mics: JSON.stringify([]),
    speakers: JSON.stringify([
      { type: 'Ceiling', make: 'Bose', model: 'MI2CEILING', quantity: 4 }
    ]),
    displays: JSON.stringify([
      { type: 'Display', make: 'LG', model: 'OLED83C3PUA', size: '83"', serial: 'LG-0001', mac: '4C:26:A7:7D:8E:55', ip: '10.100.50.202' }
    ]),
    inventory: JSON.stringify([
      { device_type: 'Codec', make: 'Polycom', model: 'RealPresence Trio', location: 'Cabinet' }
    ]),
    technician_name: 'Maria Garcia',
    racf: 'mgarcia',
    tech_date: new Date().toISOString().slice(0, 10)
  },
  {
    country: 'United States',
    state: 'Illinois',
    city: 'Moline',
    facility: 'Building 6',
    building: '6D',
    floor: '3',
    room_name_id: 'Collaboration Hub',
    room_type: 'Collaboration Space',
    microsoft_teams: 'Yes',
    capacity: 15,
    room_width: '15',
    room_depth: '20',
    room_height: '9',
    room_tech: 'Interactive',
    input_types: 'USB-C, Wireless',
    technician_notes: 'Interactive whiteboards, standing desks. Huddle space for small team meetings.',
    touch_panels: JSON.stringify([]),
    ceiling_mics: JSON.stringify([
      { make: 'Audio-Technica', model: 'U4100', qty: 1 }
    ]),
    handheld_mics: JSON.stringify([]),
    lapel_mics: JSON.stringify([]),
    speakers: JSON.stringify([
      { type: 'Tabletop', make: 'Bose', model: 'S1 Pro', quantity: 2 }
    ]),
    displays: JSON.stringify([
      { type: 'Display', make: 'Microsoft', model: 'Surface Hub 3', size: '85"', serial: 'MSH-001' }
    ]),
    inventory: JSON.stringify([]),
    technician_name: 'Robert Chen',
    racf: 'rchen',
    tech_date: new Date().toISOString().slice(0, 10)
  },
  {
    country: 'Canada',
    state: 'Ontario',
    city: 'Toronto',
    facility: 'Canada HQ',
    building: 'Tower A',
    floor: '5',
    room_name_id: 'Executive Boardroom',
    room_type: 'Boardroom',
    microsoft_teams: 'Yes',
    capacity: 30,
    room_width: '22',
    room_depth: '32',
    room_height: '11',
    room_tech: 'Premium AV',
    input_types: 'HDMI, USB-C, SDI',
    technician_notes: 'Premium finishes, video conferencing focus. Premium video conferencing suite with recording capabilities.',
    touch_panels: JSON.stringify([
      { type: 'Crestron', model: 'TSW-760', serial: 'TS-002', mac: '4C:26:A7:7D:8F:66', location: 'Wall', ip: '10.100.60.101' }
    ]),
    ceiling_mics: JSON.stringify([
      { make: 'Shure', model: 'MX414', qty: 3 }
    ]),
    handheld_mics: JSON.stringify([
      { qty: 2, receiver_sn: 'RX-0500', dante: 'Yes' }
    ]),
    lapel_mics: JSON.stringify([
      { qty: 6, receiver_sn: 'RX-0600', dante: 'Yes' }
    ]),
    speakers: JSON.stringify([
      { type: 'Ceiling', make: 'JBL', model: 'Control Contractor', quantity: 8 }
    ]),
    displays: JSON.stringify([
      { type: 'Display', make: 'Samsung', model: 'QN98LST', size: '98"', serial: 'SAM-001', mac: '4C:26:A7:7D:90:77', ip: '10.100.60.201' }
    ]),
    inventory: JSON.stringify([
      { device_type: 'Codec', make: 'Cisco', model: 'SX20', location: 'Rack', serial: 'CISCO-002' },
      { device_type: 'DSP', make: 'Biamp', model: 'Nexia', location: 'Rack', serial: 'BIAMP-001' }
    ]),
    technician_name: 'David Thompson',
    racf: 'dthompson',
    tech_date: new Date().toISOString().slice(0, 10)
  },
  {
    country: 'United States',
    state: 'Iowa',
    city: 'Dubuque',
    facility: 'Operations Center',
    building: '2',
    floor: '1',
    room_name_id: 'Control Room',
    room_type: 'War Room',
    microsoft_teams: 'No',
    capacity: 20,
    room_width: '20',
    room_depth: '25',
    room_height: '9',
    room_tech: 'Monitoring',
    input_types: 'HDMI, DisplayPort',
    technician_notes: 'Real-time monitoring displays, high uptime requirement. Critical infrastructure monitoring.',
    touch_panels: JSON.stringify([
      { type: 'Extron', model: 'TLP Pro 3100', serial: 'EXT-001', mac: '4C:26:A7:7D:91:88', location: 'Multiple walls' }
    ]),
    ceiling_mics: JSON.stringify([]),
    handheld_mics: JSON.stringify([]),
    lapel_mics: JSON.stringify([]),
    speakers: JSON.stringify([
      { type: 'Ceiling', make: 'Extron', model: 'XPA', quantity: 4 }
    ]),
    displays: JSON.stringify([
      { type: 'Display', make: 'Christie', model: 'DHD850', size: '85"', serial: 'CHR-001' },
      { type: 'Display', make: 'Christie', model: 'DHD850', size: '85"', serial: 'CHR-002' }
    ]),
    inventory: JSON.stringify([
      { device_type: 'Switcher', make: 'Extron', model: 'DXP 6x2', location: 'Rack', barcode: 'EXT-0002' }
    ]),
    technician_name: 'Lisa Anderson',
    racf: 'landerson',
    tech_date: new Date().toISOString().slice(0, 10)
  }
];

/**
 * Generate and insert sample room data into MariaDB via API
 */
async function generateSampleRooms() {
  try {
    const results = [];

    for (const roomData of SAMPLE_ROOMS) {
      await DB_API.insertRoomRaw(roomData);
      results.push({
        room: `${roomData.facility} - ${roomData.room_name_id}`
      });
    }

    console.log('Sample data generated successfully!');
    console.log(`Created ${results.length} sample rooms:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.room}`);
    });

    return results;
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
}

/**
 * Clear all data from the database
 */
async function clearAllData() {
  try {
    await DB_API.clearAllRooms();
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
async function getDbStats() {
  try {
    const stats = await DB_API.getStats();
    console.log('Database Statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}
