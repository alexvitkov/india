import { BaseWindow } from './window'
import { mk, path_combine, base64ArrayBuffer  } from './util';
import { show_upload_dialog, show_upload_dialog_replace_file } from './upload_form';
import { dragging, Draggable, end_drag, begin_drag } from './dragging'
import { ShareWindow } from './share_window';
import { context } from './contextmenu';

declare var actions: any;

export class ExplorerWindow extends BaseWindow {
    foldercontents: any;
    filecontents: any;
    filecontentsroot: any;
    filegrid: any;
    save_btn_container: any;

    opened_file: FileView;

    constructor(pwd, x, y, w, h, has_close) {
        super(pwd, x, y, w, h);
        make_window(this, has_close);
    }

    openfile(is_directory) {
        if (is_directory) {
            openfile_dir(this);
        } else {
            openfile_nondir(this);
        }
    }
}

// A FileView is an entry inside the explorer window
export class FileView {
    filename: string;
    wnd: ExplorerWindow;
    visuals: HTMLElement;
    mimetype: string;
    is_directory: boolean;
    write_permissions: boolean;

    constructor(filename, wnd, mimetype, is_directory, write_permissions) {
        this.filename     = filename;
        this.wnd          = wnd;
        this.visuals      = null; // The DOM object with the icon and the filenam text
        this.mimetype     = mimetype;
        this.is_directory = is_directory;
        this.write_permissions = write_permissions;
    }

    full_path() {
        return path_combine(this.wnd.get_path(), this.filename);
    }
}

class FileViewDraggable extends Draggable {

    fileview: FileView;
    placeholder: HTMLDivElement;

    constructor(fileview: FileView) {
        super(fileview.visuals);
        this.fileview = fileview;

        this.onBeforeDragStart = () => {
            this.placeholder = document.createElement('div');
            fileview.visuals.parentNode.insertBefore(this.placeholder, fileview.visuals);
            // fileview.style.zIndex = 50000;
        };

        this.onAfterDragEnd = () => {
            // If there's a dragging placeholder remove it and put the dragged node back into its place
            this.placeholder.parentNode.insertBefore(this.el, this.placeholder);
            this.placeholder.remove();
        
            fileview.visuals.style.removeProperty("position");
            fileview.visuals.style.removeProperty("width");
            fileview.visuals.style.removeProperty("height");
            fileview.visuals.style.removeProperty("left");
            fileview.visuals.style.removeProperty("top");
        }
    }
}

// make_window creates an explorer window - the kind that can list directories/open files
function make_window(wnd, has_close: boolean): BaseWindow {
    mk(wnd.h2, 'div', 'path');

    if (has_close) {
        var x_button = mk(wnd.h2, 'button', 'close_button');
        x_button.innerText = "X";
        x_button.onclick = () => { wnd.destroy(); };
    }

    // wnd.foldercontents is where the FileViews will be stored
    // it also has a subheader (h3) with 'Upload' and 'New FOlder' buttons
    {
        wnd.foldercontents = mk(wnd.wc, 'div', 'foldercontents');
        var h3 = mk(wnd.foldercontents, 'h3');

        var upload_btn = mk(h3, 'button');
        upload_btn.innerText = "Upload";

        upload_btn.onclick = () => {
            show_upload_dialog();
        }

        mk(h3, 'div', 'separator');

        var new_folder_btn = mk(h3, 'button');
        new_folder_btn.innerText = "New Folder";
        new_folder_btn.onclick = () => { new_folder(wnd); }

        mk(h3, 'div', 'separator');

        wnd.filegrid = mk(wnd.foldercontents, 'div', 'files');
    }

    // wnd.filecontentsroot is where the filedata will be stored for open files
    // it also has a subheader (h3) with Share and Download buttons
    {
        wnd.filecontentsroot = mk(wnd.wc, 'div', 'filecontentsroot');
        var h3 = mk(wnd.filecontentsroot, 'h3');

        let download_btn = mk(h3, 'button');
        download_btn.innerText = "Download";
        download_btn.onclick = () => { download_file(true); }
        mk(h3, 'div', 'separator');

        let share_btn = mk(h3, 'button');
        share_btn.innerText = "Share";
        share_btn.onclick = () => { alert("TODO NOT IMPLEMENTETD"); } //share(true, fileview.filename, wnd); }
        mk(h3, 'div', 'separator');

        wnd.save_btn_container = mk(h3, 'div');
        wnd.save_btn_container.style.display = 'flex';

        let save_btn = mk(wnd.save_btn_container, 'button');
        save_btn.innerText = "Save";
        save_btn.onclick = () => save_open_text_file(wnd);
        mk(wnd.save_btn_container, 'div', 'separator');

        wnd.filecontents = mk(wnd.filecontentsroot, 'div', 'filecontents');
    }

    return wnd;
}

// Create the visuals for a FileView
function add_file_visuals(fileview: FileView, wnd: ExplorerWindow) {
    // Are we in a subdirectory of the trash folder?
    var is_in_trash = wnd.pwd.length > 0 && wnd.pwd[0] == "trash";

    // Is the current filewview the trash folder itself?
    var is_trash = wnd.pwd.length == 0 && fileview.filename == "trash";
    var is_share = wnd.pwd.length == 0 && fileview.filename == "share";

    var visuals = mk(wnd.filegrid, 'div');
    fileview.visuals = visuals;

    var img = document.createElement('img');
    var filename = document.createElement('div');

    if (fileview.is_directory) {
        if (wnd.get_path() == "/" && fileview.filename == "trash")
            img.src = "/mimeicons/user-trash.png";
        else if (wnd.get_path() == "/" && fileview.filename == "share")
            img.src = "/mimeicons/user-share.png";
        else
            img.src = "/mimeicons/directory.png";
    } else {
        img.src = `/mimeicons/${fileview.mimetype.replace("/", "-")}.png`;
    }

    fileview.visuals.onclick = () => {
        wnd.pwd.push(fileview.filename);
        if (!fileview.is_directory) {
            wnd.opened_file = fileview;
        }
        wnd.openfile(fileview.is_directory);
    }

    visuals.oncontextmenu = (e) => {
        if (!dragging) {

            var context_list = [
                // Open is always in the context list
                ['Open', () => {
                    wnd.pwd.push(fileview.filename);
                    wnd.openfile(fileview.is_directory);
                }],
                ['Open in New Window', () => {
                    var new_pwd = wnd.pwd.slice();
                    new_pwd.push(fileview.filename);
                    var new_wnd = new ExplorerWindow(new_pwd, 100, 100, 800, 600, true);
                    new_wnd.opened_file = fileview;
                    new_wnd.openfile(fileview.is_directory);
                    new_wnd.focus();
                }],
            ];

            if (is_in_trash) {
                // If we're in the trash, we can restore files or delete them forever
                context_list.push(['Restore', () => { restore_from_trash(wnd, fileview.filename); }]);
                context_list.push(['Delete forever', () => { delete_file(wnd, fileview.filename); }]);
            } else if (!is_trash && !is_share) {
                // If we;'re not in trash we can rename/share/download/move files to trash
                context_list.push(
                    ['Rename', () => { rename_file(fileview.filename, wnd); }],
                );
                if (!fileview.is_directory) {
                    for (let a of actions) {
                        if (fileview.filename.endsWith(a.extension)) {
                            context_list.push(
                                [a.text, () => {
                                    read_file_contents(true, (x) => {
                                        const ue = encodeURIComponent(x);
                                        let url = a.url.replace("$content_urlencoded", ue)
                                            .replace("$filename", fileview.filename);

                                        if (a.open_in_iframe) {
                                            const wnd = new BaseWindow([], 10, 10, 800, 600);

                                            var title = mk(wnd.h2, 'span', 'wndtitle');
                                            title.innerText = fileview.filename;

                                            // Close button
                                            var x_button = mk(wnd.h2, 'button', 'close_button');
                                            x_button.innerText = "X";
                                            x_button.onclick = () => { wnd.destroy(); };

                                            const contents = mk(wnd.wc, 'div', 'filecontentsroot');
                                            const iframe = mk(contents, 'iframe') as HTMLIFrameElement;
                                            iframe.style.flex = '1 0 0';
                                            iframe.src = url;

                                            wnd.focus();
                                        } else {
                                            window.location = url;
                                        }
                                    }, wnd.get_path(), fileview.filename);
                                }]
                            );
                        }
                    }

                    if (fileview.write_permissions) {
                        context_list.push(
                            ['Replace', () => { replace_file(false, fileview.filename, wnd); }],
                        );
                    }
                    context_list.push(
                        ['Share', () => { share(false, fileview.filename, wnd); }],
                        ['Download', () => { download_file(false, fileview.filename); }],
                    );
                }
                context_list.push(
                    ['Delete', () => { move_to_trash(wnd, fileview.filename); }]
                );
            }

            context(e, context_list);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    visuals.ondragstart = (e) => {
        if (is_trash || is_in_trash || is_share) {
            e.preventDefault();
            return;
        }
        begin_drag(e, new FileViewDraggable(fileview));
        e.preventDefault();
    };

    visuals.onmouseup = (e) => {
        if (dragging) {
            if (fileview.is_directory) {
                if (wnd.get_path() == "/" && fileview.filename == "trash") {
                    // If we've dragged something onto the trashcan, it's trash
                    move_to_trash(wnd, (dragging as FileViewDraggable).fileview.filename);
                }
                else if (wnd.get_path() == "/" && fileview.filename == "share") {
                    // move to 'share' is invalid
                } else {
                    // If we've dragged something onto a directory, move it into that directory
                    move_file((dragging as FileViewDraggable).fileview.wnd, wnd, path_combine(wnd.get_path(), fileview.filename), (dragging as FileViewDraggable).fileview.filename);
                }
            } else {
                // alert(`Dropped ${dst.filename} on ${src.filename}`);
            }
            end_drag(e);
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
    } else if (is_share) {
        var x = mk(filename, 'span');
        x.style.fontSize = "0.8rem";
        x.innerText = "Shared with me";
    } else {
        filename.innerText = fileview.filename;
    }

    visuals.appendChild(img);
    visuals.appendChild(filename);
}

function openfile_nondir(wnd: ExplorerWindow) {

    while (wnd.filecontents.children.length > 0)
        wnd.filecontents.removeChild(wnd.filecontents.lastChild);

    // Send a request to readfile.php, which will give us the contents
    var data = new FormData();
    data.append('folder', wnd.get_path(wnd.pwd.length - 1));
    data.append('filename', wnd.pwd[wnd.pwd.length - 1]);

    var xhr = new XMLHttpRequest();

    update_path_visuals(wnd);

    xhr.open('POST', '/php/readfile.php', true);

    wnd.filecontents.innerText = "";
    wnd.filecontentsroot.style.display = 'flex';
    wnd.foldercontents.style.display   = 'none';

    let is_image = wnd.opened_file.mimetype.split("/")[0] == "image";
    wnd.save_btn_container.style.display = (wnd.opened_file.write_permissions && !is_image) ? "flex" : "none";

    if (is_image) {
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            let b = `data:image/png;base64,${base64ArrayBuffer(xhr.response)}`;
            wnd.filecontents.style.backgroundImage = `url('${b}')`;
            wnd.filecontents.classList.add('imgview');
        }
    }
    else {
        wnd.filecontents.classList.remove('imgview');
        wnd.filecontents.style.backgroundImage = "unset";

        wnd.txt_editor = mk(wnd.filecontents, 'pre');

        xhr.onload = function () {
            wnd.txt_editor.innerText = xhr.responseText;
            if (wnd.opened_file.write_permissions)
                wnd.txt_editor.contentEditable = "true";
        };
    }

    xhr.send(data);
}

// This loads the contents of the current directory
function openfile_dir(wnd) { 
    update_path_visuals(wnd);

    var data = new FormData();
    data.append('path', wnd.get_path());

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/readdir.php', true);
    xhr.onload = function () {
        for (const f of wnd.files)
            f.visuals.remove();
        wnd.files = [];

        var json = JSON.parse(xhr.responseText);
        if (!json)
            return;

        // Create the FileViews from the json response
        for (const f of json) {
            var view = new FileView(f.name, 
                                    wnd,
                                    f.mimetype, 
                                    f.is_directory && f.is_directory != "0", 
                                    f.can_edit     && f.can_edit     != "0");
            wnd.files.push(view);
        }

        // Sort the files nicely before adding their visuals
        // Folders come first, then files, then the special trash directory
        // Everything inside the categories is lexically sorted
        wnd.files.sort((a, b) => {
            if (wnd.pwd.length == 0 && a.filename == "share")
                return -10;
            if (wnd.pwd.length == 0 && b.filename == "share")
                return 10;

            if (wnd.pwd.length == 0 && a.filename == "trash")
                return 10;
            if (wnd.pwd.length == 0 && b.filename == "trash")
                return -10;
            if (a.is_directory && !b.is_directory)
                return -1;
            if (!a.is_directory && b.is_directory)
                return 1;
            return a.filename.localeCompare(b.filename);
        });

        for (const f of wnd.files) {
            add_file_visuals(f, wnd);
        }

    };
    xhr.send(data);

    wnd.filecontentsroot.style.display = 'none';
    wnd.foldercontents.style.display   = 'flex';

    wnd.foldercontents.onmouseup = () => {
        if (dragging && dragging instanceof FileViewDraggable) {
            move_file((dragging as FileViewDraggable).fileview.wnd, wnd, wnd.get_path(), (dragging as FileViewDraggable).fileview.filename);
        }
    }
}



function move_to_trash(wnd, filename) {
    move_file(wnd, wnd, "/trash", filename, path_combine(wnd.get_path(), filename));
}

function restore_from_trash(wnd, filename) {
    var split = filename.split("/");
    var new_filename = split.pop();
    var new_directory = "/" + split.join("/");

    move_file(wnd, wnd, new_directory, filename, new_filename);
}


// This deletes the file, *for real*
// move_to_trash is what is actually called when the user clicks 'Delete'
function delete_file(wnd, filename) {
    var data = new FormData();
    data.append('folder', wnd.get_path());
    data.append('filename', filename);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/delete.php', true);
    xhr.onload = function () {
        wnd.openfile(true);
    };
    xhr.send(data);
}

function rename_file(filename, wnd) {
    var new_name = prompt(`Rename ${filename} to`, filename);
    if (!new_name)
        return;

    var data = new FormData();
    data.append('folder', wnd.get_path());
    data.append('old_filename', filename);
    data.append('new_filename', new_name);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/rename.php', true);
    xhr.onload = function () {
        wnd.openfile(true);
    };
    xhr.send(data);
}

function move_file(srcwnd: ExplorerWindow, dstwnd: ExplorerWindow, new_folder: string, filename: string, new_filename?: string) {
    if (!new_filename)
        new_filename = filename;

    var data = new FormData();
    data.append('old_folder',  srcwnd.get_path());
    data.append('new_folder',  new_folder);
    data.append('filename',    filename);
    data.append('new_filename',new_filename);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/move.php', true);
    xhr.onload = () => {
        srcwnd.openfile(true);
        dstwnd.openfile(true);
    };
    xhr.send(data);
}

function new_folder(wnd) { 
    var dirname = prompt(`Directory name`, "New Folder");
    if (!dirname)
        return;

    var data = new FormData();
    data.append('parent_directory', wnd.get_path());
    data.append('dirname', dirname);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/mkdir.php', true);
    xhr.onload = function () {
        wnd.openfile(true);
    };
    xhr.send(data);
}


// Replace an existing file with a new one
function replace_file(in_file, filename, wnd) {
    if (in_file) {
        var folder = wnd.get_path(wnd.pwd.length - 1);
        filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
        var folder = wnd.get_path();
    }

    show_upload_dialog_replace_file(folder, filename);
}

// This updates the path of the window's DOM (the "Root > Folder1 > Folder2 > foo.png")
function update_path_visuals(wnd) {
    var the_path = wnd.visuals.getElementsByClassName('path')[0];

    // Remove the old path
    while (the_path.children.length > 0)
        the_path.removeChild(the_path.lastChild);

    for (let i = -1; i < wnd.pwd.length; i++) {
        var d;
        // For each element after the first create a separator
        if (i >= 0) {
            d = wnd.pwd[i];
            var separator_div = mk(the_path, 'div', 'separator');
            separator_div.innerText = "»";
        }
        else
            d = "Root";

        var entry = mk(the_path, 'button', 'pathentry');
        entry.innerText = d;

        // When we click the entry, go to its folder
        entry.onclick = (_e) => {
            if (length < wnd.pwd.length) {
                wnd.pwd.length = i + 1;
                openfile_dir(wnd);
            }
        }
    
        // We can drop files onto the path, which will omve them to teh folder
        entry.onmouseup = (e) => {
            if (dragging && dragging instanceof FileViewDraggable) {
                var new_folder = wnd.get_path(i + 1);
                move_file((dragging as FileViewDraggable).fileview.wnd, wnd, new_folder, (dragging as FileViewDraggable).fileview.filename);
                end_drag(e);
    
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
}

function download_file(in_file, filename?: any, wnd?: any) {
    if (in_file) {
        var folder = wnd.get_path(wnd.pwd.length - 1);
        filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
        var folder = wnd.get_path();
    }

    // Read the file contents and then do DISGUSTING javascript things to download the ifle
    // We create a invisible <a> that we click and then delete
    // That <a> has its download attribute set so we download the contents instead of opening it in a new tab
    // and of course its href is a virtual object URL that has its content set to a blob 
    read_file_contents(false, (x) => {
        var blob = new Blob([new Uint8Array(x, 0, x.length)]);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }, folder, filename);

    return;
}

function save_open_text_file(wnd) {
    const contents = wnd.txt_editor.innerText;
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/upload.php', true);

    var data = new FormData();
    data.append('parent_directory', wnd.get_path(wnd.pwd.length - 1));
    data.append('filename', wnd.pwd[wnd.pwd.length - 1]);
    data.append('content', contents);
    data.append('overwrite', '1');

    xhr.send(data);
}

// This asks the server for the contents of the specified file
// The 'cb' callback is then called, which gives you the file as either text or binary
// depending on whether or not text is true/false
function read_file_contents(text, cb, folder, filename) {
    var data = new FormData();
    data.append('folder', folder);
    data.append('filename', filename);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/php/readfile.php', true);

    if (text) {
        xhr.onload = function () {
            cb(xhr.responseText);
        };
    } else {
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
            cb(xhr.response);
        };
    }

    xhr.send(data);
}

// This opens a file.
// If the file has image/* mimetype, it will be displayed as an image
// otherwise it will be displayed as plaintext
// This is a tiny wrapper around the share_window.
function share(in_file: boolean, filename: string, wnd: BaseWindow) {
    if (in_file) {
        var folder = wnd.get_path(wnd.pwd.length - 1);
        filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
        var folder = wnd.get_path();
    }

    var sharewnd = new ShareWindow(folder, filename, 400, 400, 400);
    sharewnd.focus();
}
