
export class OurWindow {
    pwd: string[];
    visuals: HTMLElement;
    h2: HTMLElement;      // The titlebar of the window
    fileview: any; // TODO what is this
    files: any[];
    txt_editor: HTMLElement; // For editable text files, this is the DOM element the user can edit

    // TODO move these to a subclass
    foldercontents: any;
    filecontents: any;
    filecontentsroot: any;
    filegrid: any;
    save_btn_container: any;

    constructor(pwd) {
        this.pwd = pwd;      // pwd = [ "Folder1", "Folder2" ] means the current directory of that window is /Folder1/Folder2
        this.visuals = null; // The DOM object
        this.h2 = null;      // The titlebar of the window
        this.fileview = null;
        this.files = [];
        this.txt_editor = null; // For editable text files, this is the DOM element the user can edit
    }
}