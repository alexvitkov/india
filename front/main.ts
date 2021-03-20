import { ExplorerWindow } from './explorer';

import { oncontextmenu_hook as contextmenu_oncontextmenu_hook } from './contextmenu';
import { oncontextmenu_hook as dragging_oncontextmenu_hook    } from './dragging';

function main() {
    // Create a window that looks at the root directory
    var root_window = new ExplorerWindow([], 100, 100, 800, 600, false);

    // Focus that window and load the directory
    root_window.focus();
    root_window.openfile(true);

}

document.body.oncontextmenu = (e) => {
    contextmenu_oncontextmenu_hook(e);
    dragging_oncontextmenu_hook(e);
}

main();
