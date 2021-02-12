var FORM_ASYNC = false;

const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const upload_btn     = document.getElementById("upload_btn");
const the_path       = document.getElementById("the_path");
const current_directory = document.getElementById("current_directory");

the_file.onchange = on_file_added;

var pwd = [];

var context_menu = null;
var dragging = null;
var dragging_placeholder = null;
var dragging_offset_x = 0, dragging_offset_y = 0;

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
        filename_input.value = the_file.files[0].name;

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
                load_dir();
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

function load_dir() {
    while (the_path.children.length > 1)
        the_path.removeChild(the_path.lastChild);

    for (let i = 0; i < pwd.length; i++) {
        var d = pwd[i];

        var separator_div = document.createElement('div');
        separator_div.classList.add('separator');
        the_path.appendChild(separator_div);
        separator_div.innerText = "»";

        var entry = document.createElement('button');
        entry.classList.add('pathentry');
        entry.innerText = d;
        the_path.appendChild(entry);

        entry.onclick = () => {
            pwd.length = i + 1;
            load_dir();
        }
    }

    var data = new FormData();
    data.append('path', get_path());

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/readdir.php', true);
    xhr.onload = function () {
        for (const f of files)
            f.visuals.remove();
        files = [];

        var json = JSON.parse(this.responseText);
        for (const f of json) {
            var view = new FileView(f.name, null, f.mimetype, f.is_directory && f.is_directory != "0");
            files.push(view);
        }

        files.sort((a, b) => {
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
}

function delete_file(filename) {
    var file_full_path = get_path() + filename;

    var data = new FormData();
    data.append('path', file_full_path);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/delete.php', true);
    xhr.onload = function () {
        load_dir();
    };
    xhr.send(data);
}

function rename_file(filename) {
    var file_full_path = get_path() + filename;

    var new_name = prompt(`Rename ${filename} to`, filename);
    if (!new_name)
        return;

    var data = new FormData();
    data.append('path', file_full_path);
    data.append('new_name', new_name);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/rename.php', true);
    xhr.onload = function () {
        load_dir();
    };
    xhr.send(data);
}

function new_folder() {
    var dirname = prompt(`Directory name`, "New Folder");
    if (!dirname)
        return;

    var data = new FormData();
    data.append('parent_directory', get_path());
    data.append('dirname', dirname);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/mkdir.php', true);
    xhr.onload = function () {
        load_dir();
    };
    xhr.send(data);
}

function begin_drag(e, fileview) {
    if (dragging)
        end_drag();

    dragging_placeholder = document.createElement('div');
    fileview.visuals.parentNode.insertBefore(dragging_placeholder, fileview.visuals);

    dragging = fileview.visuals;
    dragging.classList.add("dragged");

    var elemRect = dragging.getBoundingClientRect();

    dragging_offset_x = elemRect.width - (elemRect.left - e.clientX);
    dragging_offset_y = elemRect.top  - e.clientY;

    dragging.style.position = "absolute";
    dragging.style.width  = elemRect.width  + "px";
    dragging.style.height = elemRect.height + "px";
    document.body.appendChild(dragging);

    dragging.style.left = (e.clientX - dragging_offset_x) + "px";
    dragging.style.top  = (e.clientY + dragging_offset_y) + "px";
}

function end_drag(e) {
    dragging_placeholder.parentNode.insertBefore(dragging, dragging_placeholder);
    dragging_placeholder.remove();
    dragging.style.removeProperty("position");
    dragging.style.removeProperty("width");
    dragging.style.removeProperty("height");
    dragging.style.removeProperty("left");
    dragging.style.removeProperty("top");
    dragging.classList.remove("dragged");
    dragging = null;
}

function add_file_visuals(fileview) {
    var visuals = document.createElement('div');
    fileview.visuals = visuals;

    var img = document.createElement('img');
    var filename = document.createElement('div');

    if (fileview.is_directory!=0) {
        img.src="/mimeicons/directory.png";
        visuals.onclick = () => {
            pwd.push(name);
            load_dir();
        }
    } else {
        img.src=`/mimeicons/${fileview.mimetype.replace("/", "-")}.png`;
    }

    visuals.oncontextmenu = (e) => {
        context(e, [
            ['Open', () => {
                if (is_directory) {
                    pwd.push(name);
                    load_dir();
                } else {
                    alert('not implemented');
                }
            }],
            ['Rename', () => { rename_file(fileview.filename); }],
            ['Share',  () => {alert('not implemented')}],
            ['Delete', () => { delete_file(fileview.filename); }],
        ]);
        e.preventDefault();
    }

    visuals.ondragstart = (e) => {
        begin_drag(e, fileview);
        e.preventDefault();
    };

    visuals.classList.add('file');
    filename.classList.add('filename');
    filename.innerText = fileview.filename;

    if (fileview.mimetype == "pending")
        visuals.classList.add('pending');

    visuals.appendChild(img);
    visuals.appendChild(filename);

    current_directory.appendChild(visuals);
}

function begin_upload() {
    the_file.click();
}

function context(e, entries) {
    if (context_menu)
        context_menu.remove();

    context_menu = document.createElement('ul');
    context_menu.classList.add('context');

    context_menu.style.left = e.clientX + "px";
    context_menu.style.top  = e.clientY + "px";

    for (const e of entries) {
        const li = document.createElement('li');
        li.innerText = e[0];
        li.onclick = e[1];
        context_menu.appendChild(li);
    }

    document.body.appendChild(context_menu);
}

function get_path() {
    var path = "/";
    for (const d of pwd)
        path += d + "/";
    return path;
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
}

document.body.onmouseup = (e) => {
    if (dragging)
        end_drag();
}

load_dir();
