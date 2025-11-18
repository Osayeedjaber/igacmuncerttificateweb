/**
 * MUN Sheets + Apps Script integration
 *
 * This script assumes a Google Sheet with 4 tabs:
 *   - Participation
 *   - CampusAmbassador
 *   - Awards
 *   - Secretariat
 *
 * It exposes two main actions (you can wire them to menu items or buttons):
 *   - pushAllSheets()  -> send new rows to /api/incoming-certificates
 *   - syncAllSheets()  -> pull accepted rows from /api/incoming-certificates/export
 *
 * Configure the constants below before using.
 */

// === CONFIGURATION ===

// Base URL of your Next.js app (no trailing slash)
// e.g. "https://certificates.example.com" or "http://localhost:3000"
var BASE_URL = 'https://your-app-url-here';

// Shared secret used by the backend to authenticate Sheets requests
// This must match process.env.SHEETS_WEBHOOK_SECRET in your Next.js app.
var SHEETS_WEBHOOK_SECRET = 'REPLACE_ME';

// Default event code to attach rows to
// Must match an existing events.event_code in Supabase.
var DEFAULT_EVENT_CODE = 'igacmun-session-3-2025';

// Mapping from sheet name -> section string used by the API
var SHEET_SECTION_MAP = {
  'Participation': 'participation',
  'CampusAmbassador': 'campus_ambassador',
  'Awards': 'award',
  'Secretariat': 'secretariat',
};

// Column names expected in the header row (row 1)
// These should match the column labels in your Google Sheets.
var COL_SHEET_ROW_ID = 'sheet_row_id';
var COL_PARTICIPANT_NAME = 'participant_name';
var COL_SCHOOL = 'school';
var COL_CERTIFICATE_TYPE = 'certificate_type';
var COL_DATE_ISSUED = 'date_issued';
var COL_COMMITTEE = 'committee';
var COL_COUNTRY = 'country';
var COL_SEGMENT = 'segment';
var COL_TEAM_NAME = 'team_name';
var COL_TEAM_MEMBERS = 'team_members';
var COL_SENT = 'Sent?';
var COL_APPROVED = 'Approved?';
var COL_CERTIFICATE_ID = 'certificate_id';
var COL_QR_CODE_URL = 'qr_code_url';

// === MENU SETUP ===

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('MUN Sync')
    .addItem('Push all sheets', 'pushAllSheets')
    .addItem('Sync all sheets', 'syncAllSheets')
    .addToUi();
}

// === PUBLIC ENTRYPOINTS ===

function pushAllSheets() {
  Object.keys(SHEET_SECTION_MAP).forEach(function(sheetName) {
    pushSheet(sheetName, SHEET_SECTION_MAP[sheetName]);
  });
}

function syncAllSheets() {
  Object.keys(SHEET_SECTION_MAP).forEach(function(sheetName) {
    syncSheet(sheetName, SHEET_SECTION_MAP[sheetName]);
  });
}

// === CORE LOGIC: PUSH ===

function pushSheet(sheetName, section) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName);
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    // no data rows
    return;
  }

  var header = data[0];
  var colIndex = buildColumnIndex(header);

  var rowsToSend = [];
  var sentRows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    var sentValue = getCellByHeader(row, colIndex, COL_SENT);
    if (sentValue && String(sentValue).toLowerCase() === 'true') {
      continue; // already sent
    }

    // Ensure sheet_row_id exists
    var sheetRowId = getCellByHeader(row, colIndex, COL_SHEET_ROW_ID);
    if (!sheetRowId) {
      sheetRowId = section + '-' + (i + 1); // 1-based row number
      setCellByHeader(sheet, i + 1, colIndex, COL_SHEET_ROW_ID, sheetRowId);
      row[colIndex[COL_SHEET_ROW_ID]] = sheetRowId;
    }

    var payloadRow = buildPayloadRow(row, colIndex);
    rowsToSend.push(payloadRow);
    sentRows.push(i + 1); // sheet row index
  }

  if (rowsToSend.length === 0) {
    Logger.log('No new rows to send for sheet: ' + sheetName);
    return;
  }

  var url = BASE_URL + '/api/incoming-certificates';

  var body = {
    event_code: DEFAULT_EVENT_CODE,
    section: section,
    rows: rowsToSend,
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + SHEETS_WEBHOOK_SECRET,
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  Logger.log('Push response for ' + sheetName + ': ' + code + ' ' + text);

  if (code >= 200 && code < 300) {
    // Mark Sent? = TRUE
    sentRows.forEach(function(rowIndex) {
      setCellByHeader(sheet, rowIndex, colIndex, COL_SENT, true);
    });
  } else {
    SpreadsheetApp.getUi().alert('Failed to push "' + sheetName + '".\nStatus: ' + code + '\nResponse: ' + text);
  }
}

// === CORE LOGIC: SYNC ===

function syncSheet(sheetName, section) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName);
    return;
  }

  var header = sheet.getDataRange().getValues()[0];
  var colIndex = buildColumnIndex(header);

  var url = BASE_URL + '/api/incoming-certificates/export' +
    '?event_code=' + encodeURIComponent(DEFAULT_EVENT_CODE) +
    '&section=' + encodeURIComponent(section);

  var options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + SHEETS_WEBHOOK_SECRET,
    },
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  Logger.log('Sync response for ' + sheetName + ': ' + code + ' ' + text);

  if (code < 200 || code >= 300) {
    SpreadsheetApp.getUi().alert('Failed to sync "' + sheetName + '".\nStatus: ' + code + '\nResponse: ' + text);
    return;
  }

  var json = JSON.parse(text);
  var rows = json.rows || [];

  if (!rows.length) {
    Logger.log('No rows returned for sheet: ' + sheetName);
    return;
  }

  var dataRange = sheet.getDataRange();
  var data = dataRange.getValues();

  // Build lookup: sheet_row_id -> row index
  var sheetRowIdToIndex = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var sheetRowId = getCellByHeader(row, colIndex, COL_SHEET_ROW_ID);
    if (sheetRowId) {
      sheetRowIdToIndex[String(sheetRowId)] = i + 1; // sheet row index
    }
  }

  rows.forEach(function(r) {
    var sheetRowId = r.sheet_row_id;
    if (!sheetRowId) return;

    var rowIndex = sheetRowIdToIndex[String(sheetRowId)];
    if (!rowIndex) return;

    setCellByHeader(sheet, rowIndex, colIndex, COL_CERTIFICATE_ID, r.certificate_id || '');
    setCellByHeader(sheet, rowIndex, colIndex, COL_QR_CODE_URL, r.qr_code_url || '');
    setCellByHeader(sheet, rowIndex, colIndex, COL_CERTIFICATE_TYPE, r.certificate_type || '');
    setCellByHeader(sheet, rowIndex, colIndex, COL_APPROVED, true);
  });
}

// === HELPERS ===

function buildColumnIndex(headerRow) {
  var index = {};
  for (var i = 0; i < headerRow.length; i++) {
    var name = headerRow[i];
    if (name) {
      index[String(name).trim()] = i;
    }
  }
  return index;
}

function getCellByHeader(rowArray, colIndex, headerName) {
  var idx = colIndex[headerName];
  if (idx === undefined) return '';
  return rowArray[idx];
}

function setCellByHeader(sheet, rowIndex, colIndex, headerName, value) {
  var idx = colIndex[headerName];
  if (idx === undefined) return;
  sheet.getRange(rowIndex, idx + 1).setValue(value);
}

function buildPayloadRow(row, colIndex) {
  var payload = {};
  // Only include known columns; you can extend this as needed.
  payload[COL_SHEET_ROW_ID] = getCellByHeader(row, colIndex, COL_SHEET_ROW_ID);
  payload[COL_PARTICIPANT_NAME] = getCellByHeader(row, colIndex, COL_PARTICIPANT_NAME);
  payload[COL_SCHOOL] = getCellByHeader(row, colIndex, COL_SCHOOL);
  payload[COL_CERTIFICATE_TYPE] = getCellByHeader(row, colIndex, COL_CERTIFICATE_TYPE);
  payload[COL_DATE_ISSUED] = getCellByHeader(row, colIndex, COL_DATE_ISSUED);
  payload[COL_COMMITTEE] = getCellByHeader(row, colIndex, COL_COMMITTEE);
  payload[COL_COUNTRY] = getCellByHeader(row, colIndex, COL_COUNTRY);
  payload[COL_SEGMENT] = getCellByHeader(row, colIndex, COL_SEGMENT);
  payload[COL_TEAM_NAME] = getCellByHeader(row, colIndex, COL_TEAM_NAME);
  payload[COL_TEAM_MEMBERS] = getCellByHeader(row, colIndex, COL_TEAM_MEMBERS);
  return payload;
}
