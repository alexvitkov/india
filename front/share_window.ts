import { BaseWindow } from './window';
import { mk, mkhdiv, mkcheckbox } from './util';

export class ShareWindow extends BaseWindow {
    contents: HTMLElement;
    constructor(folder, filename, x, y, w) {
        super(null, x, y, w, 0);
        make_share_window(this, folder, filename);
    }
}

// This monstrocity creates the 'Share file' window
function make_share_window(wnd, folder, filename) {
    wnd.h2.style.display = 'flex';

    // The title of the window. WE set its 'flex' to 1 1 0 so it fills up the titlebar
    // and pushes the X button to the very right
    var heading = mk(wnd.h2, 'span', 'wndtitle');
    heading.innerText = "Share " + filename;

    // Close button
    var x_button = mk(wnd.h2, 'button', 'close_button');
    x_button.innerText = "X";
    x_button.onclick = () => { wnd.destroy(); }

    wnd.contents = mk(wnd.visuals, 'div', 'share_dialog_contents');
    wnd.contents.style.padding = "0.5rem";

    // This is the data that will be sent when we hit "Generate link"
    var data = {
        write_permissions: false,
        private: false,
        has_password: false,
        password: "",
        userlist: [],
    }

    // If private link is clicked, show the "Add user" button and the user list
    var userlist, add_user;
    mkcheckbox(wnd.contents, "Private link", (toggled) => {
        add_user.style.display = toggled ? "block" : "none";
        userlist.style.display = toggled ? "block" : "none";
        data.private = toggled;
    });

    userlist = mk(wnd.contents, 'div');
    userlist.style.display = "none";
    add_user = mk(wnd.contents, 'button');
    add_user.innerText = "Add user";
    add_user.style.display = "none";

    // When we hit 'Add user', add an input field for a new user
    add_user.onclick = (_e) => {
        var i = mk(userlist, 'input') as HTMLInputElement;
        i.value = 'John Doe';

        let index = data.userlist.length;
        data.userlist.push(i.value);

        i.onchange = (_e) => {
            data.userlist[index] = i.value;
        }
    }

    // Click the add_user once to add a default user, since a URL that nobody can use makes no sense
    add_user.click();

    mkcheckbox(wnd.contents, "Give write permissions", (toggled) => {
        data.write_permissions = toggled;
    });

    // If 'Password protected' is checked, show the password field
    let password_container;
    mkcheckbox(wnd.contents, "Password protected", (toggled) => {
        data.has_password = toggled;
        password_container.style.display = toggled ? "flex" : "none";
    });

    password_container = mkhdiv(wnd.contents);
    password_container.style.display = 'none'
    var password_label = mk(password_container, 'label');
    password_label.innerText = "Password";
    var password_input = mk(password_container, 'input') as HTMLInputElement;
    password_input.type = 'password';
    password_input.autocomplete = 'off'

    password_input.style.flex = "1 0 0";
    password_input.onchange = (_e) => {
        data.password = password_input.value;
    };

    var generate_url_button = mk(wnd.contents, 'button');
    generate_url_button.innerText = "Generate link";

    generate_url_button.onclick = () => {
        // The backend expects the users to be either an empty string, if the URL is public
        // or a comma separated list of usernaems
        var users = "";
        if (data.private) {
            users = data.userlist.join(',');
        }

        var form_data = new FormData();
        form_data.append('folder', folder);
        form_data.append('filename', filename);
        form_data.append('users', users);
        // 0 = No permissions, 1 = Read only, 2 = Write , 1|2 = 3 = RW
        // Only 1 and 3 make sense in the context of a URL
        form_data.append('permissions', (data.write_permissions ? 3 : 1).toString());
        form_data.append('password', data.has_password ? data.password : "");

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/php/share.php', true);
        xhr.onload = function () {
            alert(xhr.response);
        }

        xhr.send(form_data);
        wnd.destroy();
    }
}