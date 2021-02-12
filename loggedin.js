var FORM_ASYNC = false;

const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const upload_btn     = document.getElementById("upload_btn");
const current_directory = document.getElementById("current_directory");

the_file.onchange = on_file_added;


const pwd = "/";

const pending_uploads = [];

class FileView {
    constructor(filename, visuals, mimetype, is_directory) {
        this.filename     = filename;
        this.visuals      = visuals;
        this.mimetype     = mimetype;
        this.is_directory = is_directory;
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
                add_file_visuals(filename_input.value, true);
            }
            else {
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

function load_dir(pwd) {
    var data = new FormData();
    data.append('path', '/');

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
    }
    else {
        img.src=`/mimeicons/${mimetype.replace("/", "-")}.png`;
    }

    fileDiv.classList.add('file');
    filename.classList.add('filename');
    filename.innerText = name;

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

load_dir("/");
