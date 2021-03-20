import { focused_window } from './window'
import { ExplorerWindow } from './explorer'


const upload_form:             HTMLFormElement  = document.getElementById("upload_form") as any;
const filename_input:          HTMLInputElement = document.getElementById("filename") as any;
const override_input:          HTMLInputElement = document.getElementById("override_input") as any;
const upload_parent_directory: HTMLInputElement = document.getElementById("upload_parent_directory") as any;
const the_file:                HTMLInputElement = document.getElementById("the_file") as any;

// If this is set to true, requests to uploads.php will be sent with the "override" flag
// which will override existing files with the same name
var override_file = false;
var override_file_filename = "";
var override_file_path = "";

export function show_upload_dialog() {
    override_file = false;
    the_file.click();
}

export function show_upload_dialog_replace_file(folder, filename) {
    override_file = true;
    override_file_path     = folder;
    override_file_filename = filename;
    the_file.click();
}


// This is called whenever the <input type="file">'s value changes
function on_file_added(_e) {
    if (the_file.files.length >= 1) {

        if (override_file) {
            filename_input.value          = override_file_filename;
            override_input.value          = "1";
            upload_parent_directory.value = override_file_path;
            console.log(filename_input.value, override_input.value, upload_parent_directory.value);
        } else {
            filename_input.value          = the_file.files[0].name;
            override_input.value          = "0";
            upload_parent_directory.value = focused_window.get_path();
        }

        // Send the form asynchronously through the fetch api
        fetch(upload_form.action, {
            method: upload_form.method,
            body: new FormData(upload_form)
        }).then((resp) => {
            if (resp.status == 200) {
                // TODO the focused window may have changed
                // Reload the directory so the user can see the newly uploaded file
                (focused_window as ExplorerWindow).openfile(true);
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

the_file.onchange = (e) => { on_file_added(e); };