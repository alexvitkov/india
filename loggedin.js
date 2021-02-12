var FORM_ASYNC = true;

const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const upload_btn     = document.getElementById("upload_btn");
const the_path       = document.getElementById("the_path");
const current_directory = document.getElementById("current_directory");

the_file.onchange = on_file_added;

var pwd = [];
const pending_uploads = [];

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

        var fileview = add_file_visuals(filename_input.value, false, "pending");

        // Send the form asynchronously through the fetch api
        fetch(upload_form.action, {
            method: upload_form.method,
            body: new FormData(upload_form)
        }).then((resp) => {
            if (resp.status == 200) {
                done_upload(fileview);
            } else {
                alert("Upload failed");
            }
        }, () => {
            alert("Upload failed")
        });
        
        pending_uploads.push(fileview);
    }
    else {
        alert("No files selected");
    }
}

function done_upload(fileview) {
    var index = pending_uploads.indexOf(fileview);
    if (index >= 0)
        pending_uploads.splice(index, 1);

    load_dir();
}

function load_dir() {
    var data = new FormData();

    var path = "/";
    for (const d of pwd)
        path += d + "/";

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

    data.append('path', path);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/readdir.php', true);
    xhr.onload = function () {
        for (const f of files)
            f.visuals.remove();
        files = [];

        var json = JSON.parse(this.responseText);
        for (const f of json) {
            add_file_visuals(f.name, f.is_directory, f.mimetype);
        }
    };
    xhr.send(data);
}

function add_file_visuals(name, is_directory, mimetype) {
    var fileDiv = document.createElement('div');

    var img = document.createElement('img');
    var filename = document.createElement('div');

    if (is_directory) {
        img.src="/mimeicons/directory.png";
        fileDiv.onclick = () => {
            pwd.push(name);
            load_dir();
        }
    }
    else {
        img.src=`/mimeicons/${mimetype.replace("/", "-")}.png`;
    }

    fileDiv.classList.add('file');
    filename.classList.add('filename');
    filename.innerText = name;

    if (mimetype == "pending")
        fileDiv.classList.add('pending');

    fileDiv.appendChild(img);
    fileDiv.appendChild(filename);

    current_directory.appendChild(fileDiv);

    var file = new FileView(name, fileDiv, mimetype, is_directory);
    files.push(file);
    return file;
}

function begin_upload() {
    the_file.click();
}

load_dir();
