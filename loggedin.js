var FORM_ASYNC = true;

const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const current_directory       = document.getElementById("current_directory");
const upload_parent_directory = document.getElementById("upload_parent_directory");

the_file.onchange = on_file_added;

var windows = [];
var focus = null;

var context_menu = null;
var dragging = null;

var dragging_candidate = null;
var dragging_candidate_x, dragging_candidate_y;

var dragging_fileview;
var dragging_placeholder = null;
var dragging_offset_x = 0, dragging_offset_y = 0;

var depth = 20;

class FileView {
    constructor(filename, visuals, mimetype, is_directory) {
        this.filename     = filename;
        this.visuals      = visuals;
        this.mimetype     = mimetype;
        this.is_directory = is_directory;
    }
}

class PendingUpload {
    constructor(fileview) {
        this.fileview = fileview;
    }
}

var files = [];

function on_file_added(_e) {
    if (the_file.files.length >= 1) {
        filename_input.value          = the_file.files[0].name;
        upload_parent_directory.value = get_path();

        if (!FORM_ASYNC) {
            upload_form.submit();
            return;
        }

        // Send the form asynchronously through the fetch api
        fetch(upload_form.action, {
            method: upload_form.method,
            body: new FormData(upload_form)
        }).then((resp) => {
            if (resp.status == 200) {
                openfile(true);
            } else {
                alert("Upload failed");
            }
        }, () => {
            alert("Upload failed")
        });
    }
    else {
        alert("No files selected");
    }
}

// https://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de
function base64ArrayBuffer(arrayBuffer) {
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

function update_path_visuals() {
    var the_path = focus.visuals.getElementsByClassName('path')[0];

    while (the_path.children.length > 0)
        the_path.removeChild(the_path.lastChild);

    for (let i = -1; i < focus.pwd.length; i++) {
        var d;
        if (i >= 0) {
            d = focus.pwd[i];
            var separator_div = mk(the_path, 'div', 'separator');
            separator_div.innerText = "»";
        }
        else
            d = "Root";

        var entry = mk(the_path, 'button', 'pathentry');
        entry.innerText = d;

        add_link_functionality(entry, i + 1);
    }
}

function openfile_nondir() {
    var mimetype = "text/plain";

    for (const f of files) {
        if (f.filename == focus.pwd[focus.pwd.length - 1])
            mimetype = f.mimetype;
    }

    while (focus.filecontents.children.length > 0)
        focus.filecontents.removeChild(focus.filecontents.lastChild);

    var data = new FormData();
    data.append('folder', get_path(focus.pwd.length - 1));
    data.append('filename', focus.pwd[focus.pwd.length - 1]);

    var xhr = new XMLHttpRequest();

    focus.pwd.push();

    update_path_visuals();

    xhr.open('POST', '/php/readfile.php', true);

    focus.filecontents.innerText = "";
    focus.filecontentsroot.style.display = 'block';
    focus.foldercontents.style.display   = 'none';

    if (mimetype.split("/")[0] == "image") {
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            var b = base64ArrayBuffer(xhr.response);
            var image = new Image();
            image.src = `data:image/png;base64,${b}`;
            image.style.minWidth = "0px";
            image.style.minHeight = "0px";

            focus.filecontents.appendChild(image);
            focus.filecontents.display = "flex";
        }
    }
    else {
        xhr.onload = function () {
            focus.filecontents.innerText = xhr.responseText;
        };
    }

    xhr.send(data);
}

function share(in_file, filename) {
    if (in_file) {
        var folder = get_path(focus.pwd.length - 1);
        filename = focus.pwd[focus.pwd.length - 1];
    } else {
        var folder = get_path();
    }

    var wnd = make_share_window(folder, filename);
    focus_window(wnd);
}

function opendir() {
    update_path_visuals();

    var data = new FormData();
    data.append('path', get_path());

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/readdir.php', true);
    xhr.onload = function () {
        for (const f of files)
            f.visuals.remove();
        files = [];

        var json = JSON.parse(xhr.responseText);
        if (!json)
            return;

        for (const f of json) {
            var view = new FileView(f.name, null, f.mimetype, f.is_directory && f.is_directory != "0");
            files.push(view);
        }

        files.sort((a, b) => {
            if (get_path() == "/" && a.filename == "trash")
                return 2;
            if (a.is_directory && !b.is_directory)
                return -1;
            if (!a.is_directory && b.is_directory)
                return 1;
            return a.filename.localeCompare(b.filename);
        });

        for (const f of files) {
            add_file_visuals(f);
        }

    };
    xhr.send(data);

    focus.filecontentsroot.style.display = 'none';
    focus.foldercontents.style.display   = 'block';
}

function openfile(is_directory) {
    if (is_directory) {
        opendir();
    } else {
        openfile_nondir();
    }
}

function move_to_trash(filename) {
    move_file("/trash", filename, path_combine(get_path(), filename));
}

function restore_from_trash(filename) {
    var split = filename.split("/");
    var new_filename = split.pop();
    var new_directory = "/" + split.join("/");

    move_file(new_directory, filename, new_filename);
}

function delete_file(filename) {
    var data = new FormData();
    data.append('folder', get_path());
    data.append('filename', filename);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/delete.php', true);
    xhr.onload = function () {
        openfile(true);
    };
    xhr.send(data);
}

function rename_file(filename) {
    var new_name = prompt(`Rename ${filename} to`, filename);
    if (!new_name)
        return;

    var data = new FormData();
    data.append('folder', get_path());
    data.append('old_filename', filename);
    data.append('new_filename', new_name);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/rename.php', true);
    xhr.onload = function () {
        openfile(true);
    };
    xhr.send(data);
}

function move_file(new_folder, filename, new_filename) {
    if (!new_filename)
        new_filename = filename;

    var data = new FormData();
    data.append('old_folder',  get_path());
    data.append('new_folder',  new_folder);
    data.append('filename',    filename);
    data.append('new_filename',new_filename);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/move.php', true);
    xhr.onload = function () {
        openfile(true);
    };
    xhr.send(data);
}

function new_folder() { var dirname = prompt(`Directory name`, "New Folder");
    if (!dirname)
        return;

    var data = new FormData();
    data.append('parent_directory', get_path());
    data.append('dirname', dirname);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/mkdir.php', true);
    xhr.onload = function () {
        openfile(true);
    };
    xhr.send(data);
}

function begin_drag_fileview(e, fileview) {
    if (dragging)
        end_drag();

    // Inserted in place by begin_drag
    dragging_placeholder = document.createElement('div');
    dragging_fileview = fileview;

    dragging = fileview.visuals;
    dragging.style.zIndex = 50000;

    begin_drag(e, fileview.visuals);
}

function begin_drag(e, obj, dont_set_width) {
    dragging = obj;
    dragging_candidate = null;
    dragging.classList.add("dragged");

    var elemRect = dragging.getBoundingClientRect();
    dragging_offset_x = e.clientX - elemRect.left;
    dragging_offset_y = -e.clientY + elemRect.top;

    if (dragging_placeholder)
        obj.parentNode.insertBefore(dragging_placeholder, obj);

    dragging.style.left = (e.clientX - dragging_offset_x) + "px";
    dragging.style.top  = (e.clientY + dragging_offset_y) + "px";

    if (!dont_set_width) {
        dragging.style.width  = elemRect.width  + "px";
        dragging.style.height = elemRect.height + "px";
    }

    dragging.style.position = "absolute";
    document.body.appendChild(dragging);
}

function end_drag(_e) {
    if (dragging_placeholder) {
        dragging_placeholder.parentNode.insertBefore(dragging, dragging_placeholder);
        dragging_placeholder.remove();
        dragging_placeholder = null;
    }

    if (dragging_fileview) {
        dragging.style.removeProperty("position");
        dragging.style.removeProperty("width");
        dragging.style.removeProperty("height");
        dragging.style.removeProperty("left");
        dragging.style.removeProperty("top");
        dragging_fileview = null;
    }

    dragging.classList.remove("dragged");
    dragging = null;
}

function drop_handler(dst, src) {
    if (dst.is_directory) {
        if (get_path() == "/" && dst.filename == "trash") {
            move_to_trash(src.filename);
        } else {
            move_file(path_combine(get_path(), dst.filename), src.filename);
        }
    } else {
        alert(`Dropped ${dst.filename} on ${src.filename}`);
    }
}

function add_link_functionality(link, length) {
    link.onclick = (e) => {
        focus.pwd.length = length,
            openfile(true);
    }

    link.onmouseup = (e) => {
        if (dragging && dragging_fileview) {
            var new_folder = get_path(length);
            move_file(new_folder, dragging_fileview.filename);
            end_drag();

            e.preventDefault();
            e.stopPropagation();
        }
    }
}

class Window {
    constructor(pwd) {
        this.pwd = pwd;
    }
}

function focus_window(wnd) {
    if (focus)
        focus.visuals.classList.remove('focus');
    focus = wnd;
    if (wnd) {
        wnd.visuals.classList.add('focus');
        wnd.visuals.style.zIndex = depth ++;
    }
}

function make_window_base(pwd, x, y, w, h) {
    var wnd = new Window(pwd);
    windows.push(wnd);

    wnd.visuals = mk(document.body, 'div', 'window');

    wnd.visuals.style.width    = w + "px";
    wnd.visuals.style.height   = h ? (h + "px") : "unset";
    wnd.visuals.style.position = "absolute";
    wnd.visuals.style.left     = x + "px";
    wnd.visuals.style.top      = y + "px";

    wnd.h2 = mk(wnd.visuals, 'h2');

    wnd.visuals.onmousedown = (e) => { 
        focus_window(wnd); 
    }

    wnd.h2.onmousedown = (e) => {
        if (!dragging) {
            dragging_candidate = wnd.visuals;
            dragging_candidate_x = e.clientX;
            dragging_candidate_y = e.clientY;
        }
    };

    return wnd;
}

function mk(parent, type, _class) {
    var el = document.createElement(type);
    parent.appendChild(el);
    if (_class)
        el.classList.add(_class);
    return el;
}

function mkhdiv(parent) {
    var hdiv = mk(parent, 'div');
    hdiv.style.display = "flex";
    hdiv.style.alignItems = "center";
    hdiv.style.padding = "0.3rem";
    hdiv.style.gap = "0.3rem";
    return hdiv;
}

function mkcheckbox(parent, label, togglefn) {
    var hdiv = mkhdiv(parent);

    var write_checkbox = mk(hdiv, 'input');
    write_checkbox.type = 'checkbox';

    var write_checkbox_label = mk(hdiv, 'label');
    write_checkbox_label.innerText = label;
    write_checkbox_label.onclick = (e) => { write_checkbox.click(); }
    write_checkbox_label.classList.add('noselect');

    write_checkbox.onchange = (_e) => {
        togglefn(write_checkbox.checked);
    };
}

function make_share_window(folder, filename) {
    var wnd = make_window_base(null, 400, 400, 400, 0);

    wnd.h2.innerText = "Share " + filename;
    wnd.h2.style.padding = "0.2rem 0.4rem";

    wnd.foldercontents = mk(wnd.visuals, 'div', 'share_dialog_contents');
    wnd.foldercontents.style.padding = "0.5rem";

    var data = {
        write_permissions: false,
        private: false,
        has_password: false,
        password: "",
        userlist: [],
    }

    var userlist, add_user;
    mkcheckbox(wnd.foldercontents, "Private link", (toggled) => {
        add_user.style.display = toggled ? "block" : "none";
        userlist.style.display = toggled ? "block" : "none";
        data.private = toggled;
    });

    userlist = mk(wnd.foldercontents, 'div');
    userlist.style.display = "none";
    add_user = mk(wnd.foldercontents, 'button');
    add_user.innerText = "Add user";
    add_user.style.display = "none";

    add_user.onclick = (e) => {
        var i = mk(userlist, 'input');
        i.value = 'John Doe';

        let index = data.userlist.length;
        data.userlist.push(i.value);

        i.onchange = (e) => {
            data.userlist[index] = i.value;
        }
    }

    // Click the add_user to add a default user
    add_user.click();

    mkcheckbox(wnd.foldercontents, "Give write permissions", (toggled) => {
        data.write_permissions = toggled;
    });

    let password_container;
    mkcheckbox(wnd.foldercontents, "Password protected", (toggled) => {
        data.has_password = toggled;
        password_container.style.display = toggled ? "flex" : "none";
    });

    password_container = mkhdiv(wnd.foldercontents);
    password_container.style.display = 'none'
    var password_label = mk(password_container, 'label');
    password_label.innerText = "Password";
    var password_input = mk(password_container, 'input');
    password_input.type = 'password';
    password_input.style.flex = "1 0 0";
    password_input.onchange = (_e) => {
        data.password = password_input.value;
    };

    var generate_url_button = mk(wnd.foldercontents, 'button');
    generate_url_button.innerText = "Generate link";

    generate_url_button.onclick = () => {
        console.log(data);

        var users = "";
        if (data.private) {
            users = data.userlist.join(',');
        }

        var form_data = new FormData();
        form_data.append('folder', folder);
        form_data.append('filename', filename);
        form_data.append('users', users);
        form_data.append('password', data.has_password ? data.password : "");

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/php/share.php', true);
        xhr.onload = function () {
            alert(xhr.response);
        }

        xhr.send(form_data);
        delete_window();
    }

    return wnd;
}

function delete_window() {
    var index = windows.indexOf(focus);
    if (index >= 0) {
        windows.splice(index, 1);
    }
    focus.visuals.parentNode.removeChild(focus.visuals);
    fous = null;
}

function make_window(pwd) {
    var wnd = make_window_base(pwd, 100, 100, 800, 600);

    path = mk(wnd.h2, 'div', 'path');

    {
        wnd.foldercontents = mk(wnd.visuals, 'div', 'foldercontents');
        var h3 = mk(wnd.foldercontents, 'h3');

        var upload_btn = mk(h3, 'button');
        upload_btn.innerText = "Upload";
        upload_btn.onclick = () => { begin_upload(); }

        mk(h3, 'div', 'separator');

        var new_folder_btn = mk(h3, 'button');
        new_folder_btn.innerText = "New Folder";
        new_folder_btn.onclick = () => { new_folder(); }

        mk(h3, 'div', 'separator');

        wnd.filegrid = mk(wnd.foldercontents, 'div', 'files');
    }

    {
        wnd.filecontentsroot = mk(wnd.visuals, 'div');
        var h3 = mk(wnd.filecontentsroot, 'h3');

        var download_btn = mk(h3, 'button');
        download_btn.innerText = "Download";
        download_btn.onclick = () => { download_file(); }

        mk(h3, 'div', 'separator');

        var download_btn = mk(h3, 'button');
        download_btn.innerText = "Share";
        download_btn.onclick = () => { share(true); }
        
        mk(h3, 'div', 'separator');

        wnd.filecontents = mk(wnd.filecontentsroot, 'div', 'filecontents');
    }

    return wnd;
}


function add_file_visuals(fileview) {
    // Are we in a subdirectory of the trash folder
    var is_in_trash = focus.pwd.length > 0 && focus.pwd[0] == "trash";
    // Is the current filewview the trash folder itself
    var is_trash    = focus.pwd.length == 0 && fileview.filename == "trash";

    var visuals = mk(focus.filegrid, 'div');
    fileview.visuals = visuals;

    var img = document.createElement('img');
    var filename = document.createElement('div');

    if (fileview.is_directory) {
        if (get_path() == "/" && fileview.filename == "trash")
            img.src="/mimeicons/user-trash.png";
        else
            img.src="/mimeicons/directory.png";
    } else {
        img.src=`/mimeicons/${fileview.mimetype.replace("/", "-")}.png`;
    }

    fileview.visuals.onclick = () => {
        focus.pwd.push(fileview.filename);
        openfile(fileview.is_directory);
    }

    visuals.oncontextmenu = (e) => {
        if (!dragging) {

            var context_list = [
                ['Open', () => {
                    focus.pwd.push(fileview.filename);
                    openfile(fileview.is_directory);
                }], 
                ['Open in New Window', () => {alert('not implemented')}],
            ];

            if (is_in_trash) {
                context_list.push(['Restore', () => {  restore_from_trash(fileview.filename); }]);
                context_list.push(['Delete forever', () => { delete_file(fileview.filename); }]);
            } else if (!is_trash) {
                context_list.push(
                    ['Rename', () => { rename_file(fileview.filename); }],
                    ['Share',  () => { share(false, fileview.filename); }],
                    ['Delete', () => { move_to_trash(fileview.filename); }]
                );
            }

            context(e, context_list);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    visuals.ondragstart = (e) => {
        if (is_trash || is_in_trash) {
            e.preventDefault();
            return;
        }
        begin_drag_fileview(e, fileview);
        e.preventDefault();
    };

    visuals.onmouseup = (e) => {
        if (dragging) {
            drop_handler(fileview, dragging_fileview);
            end_drag();
        }
        e.preventDefault();
    };

    visuals.classList.add('file');
    filename.classList.add('filename');

    if (is_in_trash) {
        var split = fileview.filename.split("/");
        filename.innerText = split[split.length - 1];
    } else if (is_trash) {
        filename.innerText = "Trash";
    } else {
        filename.innerText = fileview.filename;
    }

    visuals.appendChild(img);
    visuals.appendChild(filename);

}

function begin_upload() {
    the_file.click();
}

function context(e, entries) {
    if (context_menu)
        context_menu.remove();

    context_menu = mk(document.body, 'ul', 'context');

    context_menu.onmousedown = (e) => {
        e.stopPropagation();
    }

    context_menu.style.left = e.clientX + "px";
    context_menu.style.top  = e.clientY + "px";

    for (const e of entries) {
        const li = document.createElement('li');
        li.innerText = e[0];
        li.onclick = e[1];
        context_menu.appendChild(li);
    }
}

function get_path(max_length) {
    if (max_length == undefined) {
        max_length = focus.pwd.length;
    }

    var path = "/";
    for (let i = 0; i < max_length; i++) {
        path += focus.pwd[i];
        if (i != max_length - 1)
            path += "/";
    }
    return path;
}

function path_combine(a, b) {
    const last_char = a.slice(-1);
    if (last_char == "/")
        return a + b;
    else
        return a + "/" + b;
}

document.body.onclick = () => {
    if (context_menu)
        context_menu.remove();
}

document.body.onmousemove = (e) => {
    if (dragging) {
        dragging.style.left = (e.clientX - dragging_offset_x) + "px";
        dragging.style.top  = (e.clientY + dragging_offset_y) + "px";
    }
    else if (dragging_candidate) {
        var d = Math.abs(e.clientX - dragging_candidate_x) + Math.abs(e.clientY - dragging_candidate_y);
        if (d > 15)
            begin_drag(e, dragging_candidate, true);
    }
}

document.body.onmousedown = (_e) => {
    if (context_menu)
        context_menu.remove();
}

document.body.onmouseup = (_e) => {
    if (dragging_candidate)
        dragging_candidate = null;
    if (dragging)
        end_drag();
}

document.body.oncontextmenu = (e) => {
    if (dragging) {
        end_drag();
        e.preventDefault();
    }
    if (context_menu)
        context_menu.remove();
}

var root_window = make_window([]);
focus_window(root_window);
openfile(true);
