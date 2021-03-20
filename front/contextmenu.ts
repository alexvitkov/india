import { mk } from './util';

// Some elements have custom right click context menus
// If there's a custom context menu active, this will be it
var context_menu = null;

// Create a right click context menu
export function context(e, entries) {
    if (context_menu)
        context_menu.remove();

    context_menu = mk(document.body, 'ul', 'context');

    context_menu.onmousedown = (e) => {
        e.stopPropagation();
    }
    
    context_menu.onclick = (_e) => {
        context_menu.remove();
        context_menu = null;
    }


    context_menu.style.left = e.clientX + "px";
    context_menu.style.top  = e.clientY + "px";

    for (const e of entries) {
        const li = document.createElement('li');
        li.innerText = e[0];
        li.onclick = e[1];
        context_menu.appendChild(li);
    }
}

// When we click anywhere, remove the context menu
// The context menu itself has a onmousedown that prevents propagation so we can click its elements
document.body.onmousedown = (_e) => {
    if (context_menu) {
        context_menu.remove();
        context_menu = null;
    }
}



export function oncontextmenu_hook(_e) {
    if (context_menu) {
        context_menu.remove();
        context_menu = null;
    }
}