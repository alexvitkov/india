import { mk } from './util';

// An array with all the windows on the screen
export var windows: BaseWindow[] = [];

// The focused window
export var focused_window: BaseWindow = null;


import * as drag from './dragging'


// Windows have a z-index. When we click a window it is sent to the top this will be its new z-index
// We then increment the depth, and the next window we click will go on top of the current one
var depth = 20;


export class BaseWindow {
    pwd: string[];
    visuals: HTMLElement;
    h2: HTMLElement;      // The titlebar of the window
    fileview: any; // TODO what is this
    files: any[];
    txt_editor: HTMLElement; // For editable text files, this is the DOM element the user can edit


    constructor(pwd, x, y, w, h) {
        this.pwd = pwd;      // pwd = [ "Folder1", "Folder2" ] means the current directory of that window is /Folder1/Folder2
        this.visuals = null; // The DOM object
        this.h2 = null;      // The titlebar of the window
        this.fileview = null;
        this.files = [];
        this.txt_editor = null; // For editable text files, this is the DOM element the user can edit

        make_window_base(this, pwd, x, y, w, h);
    }

    destroy() {
        var index = windows.indexOf(this);

        if (index >= 0)
            windows.splice(index, 1);

        this.visuals.parentNode.removeChild(this.visuals);
        if (this == focused_window)
            focused_window = null;
    }

    focus() {
        if (focused_window == this)
            return;

        // Unfocus the old window
        if (focused_window)
            focused_window.visuals.classList.remove('focus');

        focused_window = this;
        // And focus the new one!
        this.visuals.classList.add('focus');
        this.visuals.style.zIndex = (depth++).toString();
    }

    get_path(max_length?: number) {
        if (max_length == undefined) {
            max_length = this.pwd.length;
        }

        var path = "/";
        for (let i = 0; i < max_length; i++) {
            path += this.pwd[i];
            if (i != max_length - 1)
                path += "/";
        }
        return path;
    }
}



export function unfocus_window() {
    if (focused_window) {
        focused_window.visuals.classList.remove('focus');
        focused_window = null;
    }
}


// This creates the parts of a window that are common between all window types
// This should only really be called by another function that will then fill up the window
function make_window_base(wnd, pwd, x, y, w, h) {
    windows.push(wnd);

    wnd.visuals = mk(document.body, 'div', 'window');

    wnd.visuals.style.width    = w + "px";
    wnd.visuals.style.height   = h ? (h + "px") : "unset";
    wnd.visuals.style.position = "absolute";
    wnd.visuals.style.left     = x + "px";
    wnd.visuals.style.top      = y + "px";

    wnd.h2 = mk(wnd.visuals, 'h2');

    wnd.visuals.onmousedown = (_e) => { 
        wnd.focus();
    }

    wnd.h2.onmousedown = (e) => {
        if (!drag.dragging)
            drag.set_dragging_candidate(e, wnd.visuals);
    };

    return wnd;
}