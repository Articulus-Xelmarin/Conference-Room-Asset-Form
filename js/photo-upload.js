// ======== Photo drag-drop & progress upload ========
const photoQueue = [];
let photoIdCounter = 0;

function initPhotoDropZone() {
  const zone = document.getElementById('photoDropZone');
  const input = document.getElementById('roomPhotos');
  if (!zone || !input) return;

  // Click anywhere on zone triggers file picker
  zone.addEventListener('click', function(e) {
    if (e.target.closest('.drop-zone-btn') || e.target === input) return;
    input.click();
  });

  // File input change
  input.addEventListener('change', function() {
    addFilesToQueue(Array.from(input.files));
    input.value = '';
  });

  // Drag events
  zone.addEventListener('dragenter', function(e) { e.preventDefault(); e.stopPropagation(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function(e) { e.preventDefault(); e.stopPropagation(); zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drag-over');
    var files = Array.from(e.dataTransfer.files).filter(function(f) { return f.type.startsWith('image/'); });
    if (files.length) addFilesToQueue(files);
  });
}

function addFilesToQueue(files) {
  var queueEl = document.getElementById('photoQueue');
  for (var i = 0; i < files.length; i++) {
    var id = ++photoIdCounter;
    photoQueue.push({ file: files[i], id: id, status: 'pending' });
    renderPhotoItem(queueEl, files[i], id);
  }
}

function renderPhotoItem(container, file, id) {
  var thumb = URL.createObjectURL(file);
  var sizeKb = (file.size / 1024).toFixed(0);
  var div = document.createElement('div');
  div.className = 'photo-item';
  div.id = 'photo-' + id;
  div.innerHTML =
    '<img class="thumb" src="' + thumb + '" alt="" />' +
    '<div class="info">' +
      '<span class="name" title="' + file.name + '">' + file.name + '</span>' +
      '<span class="size">' + sizeKb + ' KB</span>' +
    '</div>' +
    '<div class="progress-wrap"><div class="progress-bar" id="bar-' + id + '"></div></div>' +
    '<span class="status" id="stat-' + id + '">&#x23F3;</span>' +
    '<button type="button" class="remove-btn" title="Remove" data-id="' + id + '">&times;</button>';

  div.querySelector('.remove-btn').addEventListener('click', function() {
    for (var j = 0; j < photoQueue.length; j++) {
      if (photoQueue[j].id === id) { photoQueue.splice(j, 1); break; }
    }
    div.remove();
    URL.revokeObjectURL(thumb);
  });
  container.appendChild(div);
}

function uploadSinglePhoto(roomName, item) {
  return new Promise(function(resolve, reject) {
    var formData = new FormData();
    formData.append('roomName', roomName);
    formData.append('photos[]', item.file);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload-photos.php');

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var pct = Math.round((e.loaded / e.total) * 100);
        var bar = document.getElementById('bar-' + item.id);
        if (bar) bar.style.width = pct + '%';
      }
    });

    xhr.addEventListener('load', function() {
      var el = document.getElementById('photo-' + item.id);
      var stat = document.getElementById('stat-' + item.id);
      if (xhr.status >= 200 && xhr.status < 300) {
        item.status = 'done';
        if (el) el.classList.add('done');
        if (stat) stat.textContent = '\u2713';
        resolve();
      } else {
        item.status = 'error';
        if (el) el.classList.add('error');
        if (stat) stat.textContent = '\u2717';
        reject(new Error('Upload failed: ' + xhr.status));
      }
    });

    xhr.addEventListener('error', function() {
      item.status = 'error';
      var el = document.getElementById('photo-' + item.id);
      var stat = document.getElementById('stat-' + item.id);
      if (el) el.classList.add('error');
      if (stat) stat.textContent = '\u2717';
      reject(new Error('Network error'));
    });

    item.status = 'uploading';
    xhr.send(formData);
  });
}

// Upload all queued photos with individual progress bars
async function uploadPhotosToServer(roomName) {
  var pending = photoQueue.filter(function(p) { return p.status === 'pending'; });
  if (pending.length === 0) return;

  var results = await Promise.allSettled(
    pending.map(function(item) { return uploadSinglePhoto(roomName, item); })
  );

  var failed = results.filter(function(r) { return r.status === 'rejected'; }).length;
  if (failed > 0) {
    console.warn(failed + ' of ' + pending.length + ' photo(s) failed to upload.');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPhotoDropZone);
