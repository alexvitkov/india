
// This is a widely abused helper function that creates a DOM element, attaches it as the 
// last child of 'parent' and possibly gives it a class
export function mk(parent: HTMLElement, type: keyof HTMLElementTagNameMap, _class?: string): HTMLElement {
    var el = document.createElement(type);
    parent.appendChild(el);
    if (_class)
        el.classList.add(_class);
    return el;
}

export function path_combine(a, b) {
    const last_char = a.slice(-1);
    if (last_char == "/")
        return a + b;
    else
        return a + "/" + b;
}

// Create a checkbocx with a label.
// togglefn will be called when its value changes with an argument that's either true/false
export function mkcheckbox(parent, label, togglefn): HTMLElement {
    var hdiv = mkhdiv(parent);

    var write_checkbox: HTMLInputElement = mk(hdiv, 'input') as any;
    write_checkbox.type = 'checkbox';

    var write_checkbox_label = mk(hdiv, 'label');
    write_checkbox_label.innerText = label;
    write_checkbox_label.onclick = (_e) => { write_checkbox.click(); }
    write_checkbox_label.classList.add('noselect');

    write_checkbox.onchange = (_e) => {
        togglefn(write_checkbox.checked);
    };

    return hdiv;
}

// Crate a horizontal div
export function mkhdiv(parent: HTMLElement): HTMLDivElement {
    var hdiv = mk(parent, 'div') as HTMLDivElement;
    hdiv.style.display    = "flex";
    hdiv.style.alignItems = "center";
    hdiv.style.padding    = "0.3rem";
    hdiv.style.gap        = "0.3rem";
    return hdiv;
}

// It's honestly really sad that we need this
// We have an image viewer, but we load the uploaded via the XMLHttpRequest API, which gives us an array buffer
// We need to base64 encode the image data so we can feed it into the <img src="...">
// and the standart base64 encode API is shit
// https://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
export function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}