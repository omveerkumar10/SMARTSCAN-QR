// =============================================
//   QR CODE GENERATOR — script.js (v2 fresh)
//   Logo + vCard both fixed from scratch
// =============================================

// ---------- GLOBAL STATE ----------
var currentTab  = 'url';
var logoDataURL = null;   // base64 string of uploaded logo


// =============================================
// TAB SWITCHING
// =============================================
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}


// =============================================
// BUILD QR DATA STRING
// =============================================
function buildData() {
  if (currentTab === 'url') {
    return document.getElementById('url-input').value.trim() || 'https://example.com';
  }

  if (currentTab === 'text') {
    return document.getElementById('text-input').value.trim() || 'Hello World';
  }

  if (currentTab === 'email') {
    var to  = document.getElementById('email-to').value.trim();
    var sub = encodeURIComponent(document.getElementById('email-subject').value.trim());
    var bod = encodeURIComponent(document.getElementById('email-body').value.trim());
    return 'mailto:' + to + '?subject=' + sub + '&body=' + bod;
  }

  if (currentTab === 'vcard') {
    var fn = document.getElementById('vc-fname').value.trim();
    var ln = document.getElementById('vc-lname').value.trim();
    var ph = document.getElementById('vc-phone').value.trim();
    var em = document.getElementById('vc-email').value.trim();
    var co = document.getElementById('vc-company').value.trim();

    // RFC 2426 — MUST use CRLF (\r\n) line endings
    // TYPE tags ensure phone/email save correctly on Android + iOS
    var parts = [];
    parts.push('BEGIN:VCARD');
    parts.push('VERSION:3.0');
    parts.push('N:' + ln + ';' + fn + ';;;');
    parts.push('FN:' + fn + ' ' + ln);
    if (ph) parts.push('TEL;TYPE=CELL,VOICE:' + ph);
    if (em) parts.push('EMAIL;TYPE=INTERNET,PREF:' + em);
    if (co) parts.push('ORG:' + co);
    parts.push('END:VCARD');
    return parts.join('\r\n');
  }

  return 'https://example.com';
}


// =============================================
// MAIN: GENERATE QR CODE
// Strategy: use hidden div for QRCode.js to
// render into, then copy to our visible canvas
// so we can draw the logo on top cleanly.
// =============================================
function generateQR() {
  var data = buildData();
  var size = parseInt(document.getElementById('qr-size').value);
  var fg   = document.getElementById('fg-color').value;
  var bg   = document.getElementById('bg-color').value;
  var ecl  = document.getElementById('ecl').value;

  // Auto-set High error correction when logo present
  if (logoDataURL) {
    ecl = 'H';
    document.getElementById('ecl').value = 'H';
  }

  // -- Step 1: use a temp hidden div for QRCode.js --
  var tempDiv = document.getElementById('qrcode-temp');
  if (!tempDiv) {
    tempDiv = document.createElement('div');
    tempDiv.id = 'qrcode-temp';
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(tempDiv);
  }
  tempDiv.innerHTML = '';

  // -- Step 2: generate QR into temp div --
  try {
    new QRCode(tempDiv, {
      text:         data,
      width:        size,
      height:       size,
      colorDark:    fg,
      colorLight:   bg,
      correctLevel: QRCode.CorrectLevel[ecl]
    });
  } catch (e) {
    showToast('Error: data too long!');
    return;
  }

  // -- Step 3: after short delay, copy to our canvas + draw logo --
  setTimeout(function() {
    var srcCanvas = tempDiv.querySelector('canvas');
    if (!srcCanvas) {
      showToast('QR generation failed — try again');
      return;
    }

    // Set up our visible canvas
    var myCanvas = document.getElementById('final-canvas');
    myCanvas.width  = size;
    myCanvas.height = size;
    var ctx = myCanvas.getContext('2d');

    // Draw the QR code onto our canvas
    ctx.drawImage(srcCanvas, 0, 0, size, size);

    // Draw logo on top if uploaded
    if (logoDataURL) {
      drawLogoOnCanvas(ctx, size);
    } else {
      // No logo — show immediately
      showOutput(data, size);
    }

    // Clean up temp div
    tempDiv.innerHTML = '';
  }, 200);
}


// =============================================
// DRAW LOGO ON TOP OF QR CANVAS
// =============================================
function drawLogoOnCanvas(ctx, qrSize) {
  var pct     = parseInt(document.getElementById('logo-pct').value) / 100;
  var logoW   = Math.round(qrSize * pct);
  var logoH   = logoW;
  var logoX   = Math.round((qrSize - logoW) / 2);
  var logoY   = Math.round((qrSize - logoH) / 2);
  var padding = 8;
  var addBg   = document.getElementById('logo-whitebg').checked;

  var img = new Image();

  img.onload = function() {
    // White rounded square behind logo
    if (addBg) {
      var bx = logoX - padding;
      var by = logoY - padding;
      var bw = logoW + padding * 2;
      var bh = logoH + padding * 2;
      var br = 10;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw the logo image
    ctx.drawImage(img, logoX, logoY, logoW, logoH);

    // Show output after logo drawn
    var data = buildData();
    showOutput(data, qrSize);
  };

  img.onerror = function() {
    showToast('Logo load failed');
    var data = buildData();
    showOutput(data, qrSize);
  };

  img.src = logoDataURL;
}


// =============================================
// SHOW OUTPUT SECTION
// =============================================
function showOutput(data, size) {
  // Hide placeholder, show canvas
  document.getElementById('qr-placeholder-box').style.display = 'none';
  var myCanvas = document.getElementById('final-canvas');
  myCanvas.style.display = 'block';

  // Show short preview of encoded data
  var preview = data.length > 50 ? data.slice(0, 50) + '…' : data;
  document.getElementById('qr-meta-text').textContent = preview;

  // Show action buttons
  document.getElementById('action-btns').style.display = 'flex';
}


// =============================================
// LOGO FILE UPLOAD
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('logo-file').addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      logoDataURL = e.target.result;

      // Show preview in upload area
      document.getElementById('logo-placeholder').style.display   = 'none';
      document.getElementById('logo-preview-wrap').style.display  = 'flex';
      document.getElementById('logo-img-preview').src             = logoDataURL;
      document.getElementById('logo-file-name').textContent       = file.name;

      // Show logo controls
      document.getElementById('logo-options').style.display = 'block';

      // Force High error correction
      document.getElementById('ecl').value = 'H';

      showToast('Logo ready! Error correction set to High');
    };
    reader.readAsDataURL(file);
  });

  // Remove logo button
  document.getElementById('remove-logo-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    logoDataURL = null;
    document.getElementById('logo-file').value                    = '';
    document.getElementById('logo-placeholder').style.display     = 'flex';
    document.getElementById('logo-preview-wrap').style.display    = 'none';
    document.getElementById('logo-options').style.display         = 'none';
    showToast('Logo removed');
  });

  // Color picker sync
  document.getElementById('fg-color').addEventListener('input', function() {
    document.getElementById('fg-hex').value = this.value;
  });
  document.getElementById('bg-color').addEventListener('input', function() {
    document.getElementById('bg-hex').value = this.value;
  });

  // Enter key = generate
  document.querySelectorAll('input:not([type=file]):not([type=range]):not([type=color]):not([type=checkbox]), select').forEach(function(el) {
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') generateQR();
    });
  });
});


// =============================================
// SYNC COLOR HEX INPUT → COLOR PICKER
// =============================================
function syncColor(which) {
  var hex = document.getElementById(which + '-hex').value;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    document.getElementById(which + '-color').value = hex;
  }
}


// =============================================
// DOWNLOAD PNG
// =============================================
function downloadPNG() {
  var canvas = document.getElementById('final-canvas');
  if (canvas.style.display === 'none') { showToast('Pehle QR generate karo!'); return; }
  var link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}


// =============================================
// DOWNLOAD SVG (embeds canvas as image)
// =============================================
function downloadSVG() {
  var canvas = document.getElementById('final-canvas');
  if (canvas.style.display === 'none') { showToast('Pehle QR generate karo!'); return; }
  var w = canvas.width, h = canvas.height;
  var dataURL = canvas.toDataURL('image/png');
  var svg = '<?xml version="1.0" encoding="UTF-8"?>'
          + '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">'
          + '<image href="' + dataURL + '" width="' + w + '" height="' + h + '"/>'
          + '</svg>';
  var blob = new Blob([svg], { type: 'image/svg+xml' });
  var link = document.createElement('a');
  link.download = 'qrcode.svg';
  link.href = URL.createObjectURL(blob);
  link.click();
}


// =============================================
// COPY TO CLIPBOARD
// =============================================
function copyToClipboard() {
  var canvas = document.getElementById('final-canvas');
  if (canvas.style.display === 'none') { showToast('Pehle QR generate karo!'); return; }
  canvas.toBlob(function(blob) {
    try {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(function() { showToast('Clipboard mein copy ho gaya!'); })
        .catch(function() { showToast('Copy failed — Download use karo'); });
    } catch(e) {
      showToast('Copy failed — Download use karo');
    }
  });
}


// =============================================
// TOAST NOTIFICATION
// =============================================
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}