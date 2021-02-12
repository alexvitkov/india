const upload_form    = document.getElementById("upload_form");
const the_file       = document.getElementById("the_file");
const filename_input = document.getElementById("filename");
const upload_btn     = document.getElementById("upload_btn");

the_file.onchange = on_file_added;

function on_file_added(e) {
    if (the_file.files.length >= 1) {
        filename_input.value = the_file.files[0].name;

        // Send the form asynchronously through the fetch api
        fetch(upload_form.action, {
            method: upload_form.method,
            body: new FormData(upload_form)
        })

        alert("Sent the upload request");
    }
    else {
        alert("No files selected");
    }

}

function begin_upload() {
    the_file.click();
}
