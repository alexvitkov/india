import { FileView } from './explorer';

// If we're currently dragging something (a window or a file), this is the DOM object we're dragging
// dragging_offset_x and dragging_offset_y are the difference between the objec's top left point and the cursor position
// this is then added to the cursor position when the mouse is moved
export var dragging = null;
export var dragging_offset_x = 0, dragging_offset_y = 0;

// If we have pressed down a window's title bar but haven't yet started dragging it, it's the drag candidate
// This is needed because we don't yet know whether we want to start dragging the window or click an element in the titlebar
// Once the mouse has moved sufficiently far away from dragging_candidate_x or y, we start dragging
export var dragging_candidate: HTMLElement = null;
export var dragging_candidate_x, dragging_candidate_y;

// If we're dragging a fileview, this is set to the fileview class instance itself, because 'dragging' is just a DOM object
// The placeholder is a dummy DIV that we insert in the object's place on the grid to keep things nicely aligned
export var dragging_fileview: FileView;
export var dragging_placeholder = null;

export function set_dragging_candidate(e, candidate: HTMLElement) {
    dragging_candidate = candidate;
    dragging_candidate_x = e.clientX;
    dragging_candidate_y = e.clientY;
}


// Start dragging the 'obj' DOM element
// e is a DOM event, this should only get called in response of a DOM event
export function begin_drag(e, obj: HTMLElement, dont_set_width?: boolean) {
    set_iframe_enabled(false);
    dragging = obj;
    dragging_candidate = null;
    dragging.classList.add("dragged");

    var elemRect = dragging.getBoundingClientRect();
    dragging_offset_x = e.clientX - elemRect.left;
    dragging_offset_y = -e.clientY + elemRect.top;

    if (dragging_placeholder)
        obj.parentNode.insertBefore(dragging_placeholder, obj);

    dragging.style.left = (e.clientX - dragging_offset_x) + "px";
    dragging.style.top  = (e.clientY + dragging_offset_y) + "px";

    if (!dont_set_width) {
        dragging.style.width  = elemRect.width  + "px";
        dragging.style.height = elemRect.height + "px";
    }

    dragging.style.position = "absolute";
    document.body.appendChild(dragging);
}

export function end_drag(_e) {
    set_iframe_enabled(true);

    // If there's a dragging placeholder remove it and put the dragged node back into its place
    if (dragging_placeholder) {
        dragging_placeholder.parentNode.insertBefore(dragging, dragging_placeholder);
        dragging_placeholder.remove();
        dragging_placeholder = null;
    }

    // If we were dragging a FileView, we need to reset some CSS
    if (dragging_fileview) {
        dragging.style.removeProperty("position");
        dragging.style.removeProperty("width");
        dragging.style.removeProperty("height");
        dragging.style.removeProperty("left");
        dragging.style.removeProperty("top");
        dragging_fileview = null;
    }

    dragging.classList.remove("dragged");
    dragging = null;
}

function set_iframe_enabled(en) {
    const frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++)
        frames.item(i).hidden = !en;
}

document.body.onmouseup = (_e) => {
    if (dragging_candidate)
        dragging_candidate = null;
    if (dragging)
        end_drag(_e);
}

document.body.onmousemove = (e) => {
    if (dragging) {
        dragging.style.left = (e.clientX - dragging_offset_x) + "px";
        dragging.style.top = (e.clientY + dragging_offset_y) + "px";
    }
    else if (dragging_candidate) {
        var d = Math.abs(e.clientX - dragging_candidate_x) + Math.abs(e.clientY - dragging_candidate_y);
        if (d > 15)
            begin_drag(e, dragging_candidate, true);
    }
}
// Dragging a fileview is a bit different from dragging a window
// This does some setup work before calling the common begin_drag
export function begin_drag_fileview(e, fileview) {
    if (dragging)
        end_drag(e);

    // The dragging_placeholder is inserted into its place by the begin_drag function
    dragging_placeholder = document.createElement('div');
    dragging_fileview = fileview;

    dragging = fileview.visuals;
    dragging.style.zIndex = 50000;

    begin_drag(e, fileview.visuals);
}

export function oncontextmenu_hook(e) {
    if (dragging) {
        end_drag(e);
        e.preventDefault();
    }
}