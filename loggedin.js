var FORM_ASYNC = false;

const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const upload_btn     = document.getElementById("upload_btn");
const current_directory = document.getElementById("current_directory");

the_file.onchange = on_file_added;

var files = [];

const pwd = "/";

const pending_uploads = [];

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
            f[1].remove();
        files = [];

        var json = JSON.parse(this.responseText);
        for (const f of json) {
            add_file_visuals(f.name, f.mimetype);
        }
    };
    xhr.send(data);
}

function add_file_visuals(name, mimetype) {
    var fileDiv = document.createElement('div');

    var img = document.createElement('img');
    var filename = document.createElement('div');

    img.src="/mimeicons/application-pdf.png";
    fileDiv.classList.add('file');
    filename.classList.add('filename');
    filename.innerText = name;

    fileDiv.appendChild(img);
    fileDiv.appendChild(filename);

    current_directory.appendChild(fileDiv);

    files.push([name, fileDiv]);

    return fileDiv;
}

function begin_upload() {
    the_file.click();
}

load_dir("/");
