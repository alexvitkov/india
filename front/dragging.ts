
export class Draggable {
    el: HTMLElement;

    reparent: boolean = true;

    lockSize: boolean = true;

    onBeforeDragStart: () => void = null;
    onAfterDragEnd:    () => void = null;
    customMoveHandler: (x: number, y: number) => void = null;

    constructor(el: HTMLElement) {
        this.el = el;
    }
}




// If we're currently dragging something (a window or a file), this is the DOM object we're dragging
// dragging_offset_x and dragging_offset_y are the difference between the objec's top left point and the cursor position
// this is then added to the cursor position when the mouse is moved
export var dragging: Draggable = null;
export var dragging_offset_x = 0, dragging_offset_y = 0;

// If we have pressed down a window's title bar but haven't yet started dragging it, it's the drag candidate
// This is needed because we don't yet know whether we want to start dragging the window or click an element in the titlebar
// Once the mouse has moved sufficiently far away from dragging_candidate_x or y, we start dragging
export var dragging_candidate: Draggable = null;
export var dragging_candidate_x, dragging_candidate_y;

export function set_dragging_candidate(e, candidate: Draggable) {
    dragging_candidate = candidate;
    dragging_candidate_x = e.clientX;
    dragging_candidate_y = e.clientY;
}


// Start dragging the 'obj' DOM element
// e is a DOM event, this should only get called in response of a DOM event
export function begin_drag(e, d: Draggable) {
    if (d.onBeforeDragStart)
        d.onBeforeDragStart()
    set_iframe_enabled(false);
    dragging = d;
    dragging_candidate = null;
    dragging.el.classList.add("dragged");

    var elemRect = dragging.el.getBoundingClientRect();
    dragging_offset_x = e.clientX - elemRect.left;
    dragging_offset_y = -e.clientY + elemRect.top;


    if (dragging.lockSize) {
        dragging.el.style.left = (e.clientX - dragging_offset_x) + "px";
        dragging.el.style.top  = (e.clientY + dragging_offset_y) + "px";
        dragging.el.style.width  = elemRect.width  + "px";
        dragging.el.style.height = elemRect.height + "px";
        dragging.el.style.position = "absolute";
    }



    if (dragging.reparent)
        document.body.appendChild(dragging.el);
}

export function end_drag(_e) {
    set_iframe_enabled(true);

    dragging.el.classList.remove("dragged");
    if (dragging.onAfterDragEnd)
        dragging.onAfterDragEnd();
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
        const x = e.clientX - dragging_offset_x;
        const y = e.clientY + dragging_offset_y;
        if (dragging.customMoveHandler) {
            dragging.customMoveHandler(x, y)
        } else {
            dragging.el.style.left = x + "px";
            dragging.el.style.top  = y + "px";
        }
    }
    else if (dragging_candidate) {
        var d = Math.abs(e.clientX - dragging_candidate_x) + Math.abs(e.clientY - dragging_candidate_y);
        if (d > 15)
            begin_drag(e, dragging_candidate);
    }
}

export function oncontextmenu_hook(e) {
    if (dragging) {
        end_drag(e);
        e.preventDefault();
    }
}