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
var dragging_fileview;
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

function update_path_visuals() {
    var the_path = focus.visuals.getElementsByClassName('path')[0];

    while (the_path.children.length > 0)
        the_path.removeChild(the_path.lastChild);

    for (let i = -1; i < focus.pwd.length; i++) {
        var d;
        if (i >= 0) {
            d = focus.pwd[i];
            var separator_div = document.createElement('div');
            separator_div.classList.add('separator');
            the_path.appendChild(separator_div);
            separator_div.innerText = "»";
        }
        else
            d = "Root";


        var entry = document.createElement('button');
        entry.classList.add('pathentry');
        entry.innerText = d;
        the_path.appendChild(entry);

        add_link_functionality(entry, i + 1);
    }
}

function openfile_nondir() {
    var data = new FormData();
    data.append('folder', get_path(focus.pwd.length - 1));
    data.append('filename', focus.pwd[focus.pwd.length - 1]);

    var xhr = new XMLHttpRequest();

    focus.pwd.push();

    update_path_visuals();

    xhr.open('POST', '/php/readfile.php', true);

    focus.filecontents.innerText = "Loading...";
    focus.filecontents.style.display = 'block';
    focus.foldercontents.style.display = 'none';

    xhr.onload = function () {
        focus.filecontents.innerText = xhr.responseText;
    };
    xhr.send(data);
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

    focus.filecontents.style.display   = 'none';
    focus.foldercontents.style.display = 'block';
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

    dragging_placeholder = document.createElement('div');
    dragging_fileview = fileview;

    dragging = fileview.visuals;

    // document.body.appendChild(dragging);

    begin_drag(e, fileview.visuals,);
}

function begin_drag(e, obj) {

    dragging = obj;
    dragging.classList.add("dragged");

    var elemRect = dragging.getBoundingClientRect();
    dragging_offset_x = e.clientX - elemRect.left;
    dragging_offset_y = -e.clientY + elemRect.top;


    if (dragging_placeholder)
        obj.parentNode.insertBefore(dragging_placeholder, obj);

    dragging.style.left = (e.clientX - dragging_offset_x) + "px";
    dragging.style.top  = (e.clientY + dragging_offset_y) + "px";

    dragging.style.width  = elemRect.width  + "px";
    dragging.style.height = elemRect.height + "px";

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


function make_window(pwd) {
    var wnd = new Window(pwd);
    windows.push(wnd);

    var wnd_html = document.createElement('div');
    wnd_html.classList.add('window');

    var h2 = document.createElement('h2');
    wnd_html.appendChild(h2);

    //h2.onmousedown = (e) => {
        //begin_drag(e, wnd_html);
        // e.preventDefault();
    //};

    path = document.createElement('div');
    path.classList.add('path');
    h2.appendChild(path);

    wnd_html.style.width    = "800px";
    wnd_html.style.height   = "600px";
    wnd_html.style.position = "absolute";
    wnd_html.style.left     = "300px";
    wnd_html.style.top      = "300px";

    wnd.visuals = wnd_html;

    {
        wnd.foldercontents = document.createElement('div');
        wnd.foldercontents.classList.add('foldercontents');
        wnd_html.appendChild(wnd.foldercontents);

        var h3 = document.createElement('h3');
        wnd.foldercontents.appendChild(h3);

        var upload_btn = document.createElement('button');
        upload_btn.innerText = "Upload";
        upload_btn.onclick = () => { begin_upload(); }
        h3.appendChild(upload_btn);

        var separator = document.createElement('div');
        separator.classList.add('separator');
        h3.appendChild(separator);

        var new_folder_btn = document.createElement('button');
        new_folder_btn.innerText = "New Folder";
        new_folder_btn.onclick = () => { new_folder(); }
        h3.appendChild(new_folder_btn);

        separator = document.createElement('div');
        separator.classList.add('separator');
        h3.appendChild(separator);

        wnd.filegrid = document.createElement('div');
        wnd.filegrid.classList.add('files');
        wnd.foldercontents.appendChild(wnd.filegrid);
    }

    {
        wnd.filecontents = document.createElement('div');
        wnd.filecontents.classList.add('filecontents');
        wnd_html.appendChild(wnd.filecontents);
    }

    document.body.appendChild(wnd_html);
    return wnd;
}


function add_file_visuals(fileview) {
    var is_in_trash = focus.pwd.length == 1 && focus.pwd[0] == "trash";

    var visuals = document.createElement('div');
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

    visuals.onclick = () => {
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
            } else {
                context_list.push(
                    ['Rename', () => { rename_file(fileview.filename); }],
                    ['Share',  () => {alert('not implemented')}],
                    ['Delete', () => { move_to_trash(fileview.filename); }]
                );
            }

            context(e, context_list);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    visuals.ondragstart = (e) => {
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
    } else {
        filename.innerText = fileview.filename;
    }

    visuals.appendChild(img);
    visuals.appendChild(filename);

    focus.filegrid.appendChild(visuals);
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
}

document.body.onmouseup = (_e) => {
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
focus = root_window;
openfile(true);
