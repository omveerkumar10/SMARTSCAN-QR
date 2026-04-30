// =============================================
//   QR CODE GENERATOR — script.js
// =============================================

// ---- GLOBAL STATE ----
let currentTab = 'url';   // Which tab is active
let qrInstance = null;    // Stores the QR code object


// =============================================
// FUNCTION 1: Switch Tabs
// Called when user clicks URL / Text / Email / vCard
// =============================================
function switchTab(tab, clickedButton) {
  currentTab = tab;

  // Remove 'active' from all tabs and contents
  document.querySelectorAll('.tab').forEach(function(t) {
    t.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(function(t) {
    t.classList.remove('active');
  });

  // Add 'active' to clicked tab and matching content
  clickedButton.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}


// =============================================
// FUNCTION 2: Get QR Data from active tab
// Returns the string that will be encoded in QR
// =============================================
function getQRData() {
  switch (currentTab) {

    case 'url':
      return document.getElementById('url-input').value.trim() || 'https://example.com';

    case 'text':
      return document.getElementById('text-input').value.trim() || 'Hello, World!';

    case 'email': {
      var to      = document.getElementById('email-to').value.trim();
      var subject = encodeURIComponent(document.getElementById('email-subject').value.trim());
      var body    = encodeURIComponent(document.getElementById('email-body').value.trim());
      return 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    }

    case 'vcard': {
      var firstName = document.getElementById('vc-fname').value.trim();
      var lastName  = document.getElementById('vc-lname').value.trim();
      var phone     = document.getElementById('vc-phone').value.trim();
      var email     = document.getElementById('vc-email').value.trim();
      var company   = document.getElementById('vc-company').value.trim();

      // vCard format (standard contact card format)
      return 'BEGIN:VCARD\n'
           + 'VERSION:3.0\n'
           + 'N:' + lastName + ';' + firstName + '\n'
           + 'FN:' + firstName + ' ' + lastName + '\n'
           + 'TEL:' + phone + '\n'
           + 'EMAIL:' + email + '\n'
           + 'ORG:' + company + '\n'
           + 'END:VCARD';
    }

    default:
      return 'https://example.com';
  }
}


// =============================================
// FUNCTION 3: Generate QR Code
// Main function — reads inputs, creates QR
// =============================================
function generateQR() {
  // Read all settings
  var data  = getQRData();
  var size  = parseInt(document.getElementById('qr-size').value);
  var fg    = document.getElementById('fg-color').value;
  var bg    = document.getElementById('bg-color').value;
  var ecl   = document.getElementById('ecl').value;

  // Clear previous QR code
  var output = document.getElementById('qr-output');
  output.innerHTML = '';

  // Generate new QR code using QRCode.js library
  try {
    qrInstance = new QRCode(output, {
      text:         data,
      width:        size,
      height:       size,
      colorDark:    fg,
      colorLight:   bg,
      correctLevel: QRCode.CorrectLevel[ecl]
    });
  } catch (error) {
    output.innerHTML = '<p style="color:#f87171; font-size:13px; padding:10px;">Error: Input is too long or invalid.</p>';
    return;
  }

  // Hide placeholder, show QR box
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('qr-box').classList.add('visible');

  // Show a preview of the encoded text below the QR
  var preview = data.length > 45 ? data.slice(0, 45) + '…' : data;
  document.getElementById('qr-meta').textContent = preview;

  // Show the action buttons
  showActionButtons();
}


// =============================================
// FUNCTION 4: Show Download & Copy Buttons
// =============================================
function showActionButtons() {
  var buttons = ['dl-png', 'dl-svg', 'copy-btn'];
  buttons.forEach(function(id) {
    var btn = document.getElementById(id);
    btn.style.display = 'flex';
  });
}


// =============================================
// FUNCTION 5: Download QR Code
// fmt = 'png' or 'svg'
// =============================================
function downloadQR(fmt) {
  var canvas = document.querySelector('#qr-output canvas');
  if (!canvas) {
    alert('Please generate a QR code first!');
    return;
  }

  var link = document.createElement('a');

  if (fmt === 'png') {
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');

  } else if (fmt === 'svg') {
    // Wrap canvas as SVG image
    var w = canvas.width;
    var h = canvas.height;
    var svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">'
                   + '<image href="' + canvas.toDataURL() + '" width="' + w + '" height="' + h + '"/>'
                   + '</svg>';
    var blob = new Blob([svgContent], { type: 'image/svg+xml' });
    link.download = 'qrcode.svg';
    link.href = URL.createObjectURL(blob);
  }

  link.click();
}


// =============================================
// FUNCTION 6: Copy QR to Clipboard
// =============================================
function copyQR() {
  var canvas = document.querySelector('#qr-output canvas');
  if (!canvas) {
    alert('Please generate a QR code first!');
    return;
  }

  canvas.toBlob(function(blob) {
    try {
      var item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(function() {
        showToast('Copied to clipboard!');
      });
    } catch (error) {
      showToast('Use Download instead');
    }
  });
}


// =============================================
// FUNCTION 7: Show Toast Notification
// =============================================
function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  // Auto-hide after 2.2 seconds
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2200);
}


// =============================================
// FUNCTION 8: Sync Color Picker ↔ Hex Input
// When user types hex code, update color picker
// =============================================
function syncColor(which) {
  var hexInput = document.getElementById(which + '-hex');
  var colorPicker = document.getElementById(which + '-color');
  var hex = hexInput.value;

  // Only update if valid 6-digit hex
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    colorPicker.value = hex;
  }
}


// =============================================
// EVENT LISTENERS
// Run after page loads
// =============================================

// Sync color picker → hex text input (when picker changes)
document.getElementById('fg-color').addEventListener('input', function() {
  document.getElementById('fg-hex').value = this.value;
});

document.getElementById('bg-color').addEventListener('input', function() {
  document.getElementById('bg-hex').value = this.value;
});

// Press Enter in input fields to generate QR
document.querySelectorAll('input, select').forEach(function(el) {
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      generateQR();
    }
  });
});