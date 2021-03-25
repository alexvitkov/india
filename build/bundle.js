(() => {
  // temp/util.js
  function mk(parent, type, _class) {
    var el = document.createElement(type);
    parent.appendChild(el);
    if (_class)
      el.classList.add(_class);
    return el;
  }
  function path_combine(a, b) {
    const last_char = a.slice(-1);
    if (last_char == "/")
      return a + b;
    else
      return a + "/" + b;
  }
  function mkcheckbox(parent, label, togglefn) {
    var hdiv = mkhdiv(parent);
    var write_checkbox = mk(hdiv, "input");
    write_checkbox.type = "checkbox";
    var write_checkbox_label = mk(hdiv, "label");
    write_checkbox_label.innerText = label;
    write_checkbox_label.onclick = (_e) => {
      write_checkbox.click();
    };
    write_checkbox_label.classList.add("noselect");
    write_checkbox.onchange = (_e) => {
      togglefn(write_checkbox.checked);
    };
    return hdiv;
  }
  function mkhdiv(parent) {
    var hdiv = mk(parent, "div");
    hdiv.style.display = "flex";
    hdiv.style.alignItems = "center";
    hdiv.style.padding = "0.3rem";
    hdiv.style.gap = "0.3rem";
    return hdiv;
  }
  function base64ArrayBuffer(arrayBuffer) {
    var base64 = "";
    var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;
    var a, b, c, d;
    var chunk;
    for (var i = 0; i < mainLength; i = i + 3) {
      chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
      a = (chunk & 16515072) >> 18;
      b = (chunk & 258048) >> 12;
      c = (chunk & 4032) >> 6;
      d = chunk & 63;
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }
    if (byteRemainder == 1) {
      chunk = bytes[mainLength];
      a = (chunk & 252) >> 2;
      b = (chunk & 3) << 4;
      base64 += encodings[a] + encodings[b] + "==";
    } else if (byteRemainder == 2) {
      chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
      a = (chunk & 64512) >> 10;
      b = (chunk & 1008) >> 4;
      c = (chunk & 15) << 2;
      base64 += encodings[a] + encodings[b] + encodings[c] + "=";
    }
    return base64;
  }

  // temp/dragging.js
  var Draggable = class {
    constructor(el) {
      this.reparent = true;
      this.lockSize = true;
      this.onBeforeDragStart = null;
      this.onAfterDragEnd = null;
      this.customMoveHandler = null;
      this.el = el;
    }
  };
  var dragging = null;
  var dragging_offset_x = 0;
  var dragging_offset_y = 0;
  var dragging_candidate = null;
  var dragging_candidate_x;
  var dragging_candidate_y;
  function set_dragging_candidate(e, candidate) {
    dragging_candidate = candidate;
    dragging_candidate_x = e.clientX;
    dragging_candidate_y = e.clientY;
  }
  function begin_drag(e, d) {
    if (d.onBeforeDragStart)
      d.onBeforeDragStart();
    set_iframe_enabled(false);
    dragging = d;
    dragging_candidate = null;
    dragging.el.classList.add("dragged");
    var elemRect = dragging.el.getBoundingClientRect();
    dragging_offset_x = e.clientX - elemRect.left;
    dragging_offset_y = -e.clientY + elemRect.top;
    if (dragging.lockSize) {
      dragging.el.style.left = e.clientX - dragging_offset_x + "px";
      dragging.el.style.top = e.clientY + dragging_offset_y + "px";
      dragging.el.style.width = elemRect.width + "px";
      dragging.el.style.height = elemRect.height + "px";
      dragging.el.style.position = "absolute";
    }
    if (dragging.reparent)
      document.body.appendChild(dragging.el);
  }
  function end_drag(_e) {
    set_iframe_enabled(true);
    dragging.el.classList.remove("dragged");
    if (dragging.onAfterDragEnd)
      dragging.onAfterDragEnd();
    dragging = null;
  }
  function set_iframe_enabled(en) {
    const frames = document.getElementsByTagName("iframe");
    for (var i = 0; i < frames.length; i++)
      frames.item(i).hidden = !en;
  }
  document.body.onmouseup = (_e) => {
    if (dragging_candidate)
      dragging_candidate = null;
    if (dragging)
      end_drag(_e);
  };
  document.body.onmousemove = (e) => {
    if (dragging) {
      const x = e.clientX - dragging_offset_x;
      const y = e.clientY + dragging_offset_y;
      if (dragging.customMoveHandler) {
        dragging.customMoveHandler(x, y);
      } else {
        dragging.el.style.left = x + "px";
        dragging.el.style.top = y + "px";
      }
    } else if (dragging_candidate) {
      var d = Math.abs(e.clientX - dragging_candidate_x) + Math.abs(e.clientY - dragging_candidate_y);
      if (d > 15)
        begin_drag(e, dragging_candidate);
    }
  };
  function oncontextmenu_hook(e) {
    if (dragging) {
      end_drag(e);
      e.preventDefault();
    }
  }

  // temp/window.js
  var windows = [];
  var focused_window = null;
  var depth = 20;
  var WindowResizeHandleDraggable = class extends Draggable {
    constructor(window2, el, xDir, yDir) {
      super(el);
      this.window = window2;
      this.reparent = false;
      this.lockSize = false;
      this.xDir = xDir;
      this.yDir = yDir;
      this.customMoveHandler = (x, y) => {
        if (this.xDir == -1) {
          const oldX = parseInt(this.window.style.left.slice(0, -2));
          const oldWidth = parseInt(this.window.style.width.slice(0, -2));
          this.window.style.left = x + "px";
          this.window.style.width = (oldWidth + (oldX - x)).toString() + "px";
        }
        if (this.yDir == -1) {
          const oldY = parseInt(this.window.style.top.slice(0, -2));
          const oldHeight = parseInt(this.window.style.height.slice(0, -2));
          this.window.style.top = y + "px";
          this.window.style.height = (oldHeight + (oldY - y)).toString() + "px";
        }
        if (this.xDir == 1) {
          const oldX = parseInt(this.window.style.left.slice(0, -2));
          this.window.style.width = (x - oldX).toString() + "px";
        }
        if (this.yDir == 1) {
          const oldY = parseInt(this.window.style.top.slice(0, -2));
          this.window.style.height = (y - oldY).toString() + "px";
        }
      };
    }
  };
  var BaseWindow = class {
    constructor(pwd, x, y, w, h) {
      this.pwd = pwd;
      this.visuals = null;
      this.h2 = null;
      this.fileview = null;
      this.files = [];
      this.txt_editor = null;
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
      if (focused_window)
        focused_window.visuals.classList.remove("focus");
      focused_window = this;
      this.visuals.classList.add("focus");
      this.visuals.style.zIndex = (depth++).toString();
    }
    get_path(max_length) {
      if (max_length == void 0) {
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
  };
  function mkdraghandle(wnd, _class, x, y) {
    const d = mk(wnd.grid, "div", _class);
    const dd = new WindowResizeHandleDraggable(wnd.visuals, d, x, y);
    d.onmousedown = (e) => begin_drag(e, dd);
  }
  function make_window_base(wnd, pwd, x, y, w, h) {
    windows.push(wnd);
    wnd.visuals = mk(document.body, "div", "window");
    wnd.grid = mk(wnd.visuals, "div", "windowgrid");
    wnd.wc = mk(wnd.grid, "div", "wc");
    wnd.visuals.style.width = w + "px";
    wnd.visuals.style.height = h ? h + "px" : "unset";
    wnd.visuals.style.position = "absolute";
    wnd.visuals.style.left = x + "px";
    wnd.visuals.style.top = y + "px";
    wnd.h2 = mk(wnd.wc, "h2");
    mkdraghandle(wnd, "nw-resize", -1, -1);
    mkdraghandle(wnd, "w-resize", -1, 0);
    mkdraghandle(wnd, "sw-resize", -1, 1);
    mkdraghandle(wnd, "s-resize", 0, 1);
    mkdraghandle(wnd, "se-resize", 1, 1);
    mkdraghandle(wnd, "e-resize", 1, 0);
    mkdraghandle(wnd, "ne-resize", 1, -1);
    mkdraghandle(wnd, "n-resize", 0, -1);
    wnd.visuals.onmousedown = (_e) => {
      wnd.focus();
    };
    wnd.h2.onmousedown = (e) => {
      if (!dragging)
        set_dragging_candidate(e, new Draggable(wnd.visuals));
    };
    return wnd;
  }

  // temp/upload_form.js
  var upload_form = document.getElementById("upload_form");
  var filename_input = document.getElementById("filename");
  var override_input = document.getElementById("override_input");
  var upload_parent_directory = document.getElementById("upload_parent_directory");
  var the_file = document.getElementById("the_file");
  var override_file = false;
  var override_file_filename = "";
  var override_file_path = "";
  function show_upload_dialog() {
    override_file = false;
    the_file.click();
  }
  function show_upload_dialog_replace_file(folder, filename) {
    override_file = true;
    override_file_path = folder;
    override_file_filename = filename;
    the_file.click();
  }
  function on_file_added(_e) {
    if (the_file.files.length >= 1) {
      if (override_file) {
        filename_input.value = override_file_filename;
        override_input.value = "1";
        upload_parent_directory.value = override_file_path;
        console.log(filename_input.value, override_input.value, upload_parent_directory.value);
      } else {
        filename_input.value = the_file.files[0].name;
        override_input.value = "0";
        upload_parent_directory.value = focused_window.get_path();
      }
      fetch(upload_form.action, {
        method: upload_form.method,
        body: new FormData(upload_form)
      }).then((resp) => {
        if (resp.status == 200) {
          focused_window.openfile(true);
        } else {
          alert("Upload failed");
        }
      }, () => {
        alert("Upload failed");
      });
    } else {
      alert("No files selected");
    }
  }
  the_file.onchange = (e) => {
    on_file_added(e);
  };

  // temp/share_window.js
  var ShareWindow = class extends BaseWindow {
    constructor(folder, filename, x, y, w) {
      super(null, x, y, w, 0);
      make_share_window(this, folder, filename);
    }
  };
  function make_share_window(wnd, folder, filename) {
    wnd.h2.style.display = "flex";
    var heading = mk(wnd.h2, "span", "wndtitle");
    heading.innerText = "Share " + filename;
    var x_button = mk(wnd.h2, "button", "close_button");
    x_button.innerText = "X";
    x_button.onclick = () => {
      wnd.destroy();
    };
    wnd.contents = mk(wnd.visuals, "div", "share_dialog_contents");
    wnd.contents.style.padding = "0.5rem";
    var data = {
      write_permissions: false,
      private: false,
      has_password: false,
      password: "",
      userlist: []
    };
    var userlist, add_user;
    mkcheckbox(wnd.contents, "Private link", (toggled) => {
      add_user.style.display = toggled ? "block" : "none";
      userlist.style.display = toggled ? "block" : "none";
      data.private = toggled;
    });
    userlist = mk(wnd.contents, "div");
    userlist.style.display = "none";
    add_user = mk(wnd.contents, "button");
    add_user.innerText = "Add user";
    add_user.style.display = "none";
    add_user.onclick = (_e) => {
      var i = mk(userlist, "input");
      i.value = "John Doe";
      let index = data.userlist.length;
      data.userlist.push(i.value);
      i.onchange = (_e2) => {
        data.userlist[index] = i.value;
      };
    };
    add_user.click();
    mkcheckbox(wnd.contents, "Give write permissions", (toggled) => {
      data.write_permissions = toggled;
    });
    let password_container;
    mkcheckbox(wnd.contents, "Password protected", (toggled) => {
      data.has_password = toggled;
      password_container.style.display = toggled ? "flex" : "none";
    });
    password_container = mkhdiv(wnd.contents);
    password_container.style.display = "none";
    var password_label = mk(password_container, "label");
    password_label.innerText = "Password";
    var password_input = mk(password_container, "input");
    password_input.type = "password";
    password_input.autocomplete = "off";
    password_input.style.flex = "1 0 0";
    password_input.onchange = (_e) => {
      data.password = password_input.value;
    };
    var generate_url_button = mk(wnd.contents, "button");
    generate_url_button.innerText = "Generate link";
    generate_url_button.onclick = () => {
      var users = "";
      if (data.private) {
        users = data.userlist.join(",");
      }
      var form_data = new FormData();
      form_data.append("folder", folder);
      form_data.append("filename", filename);
      form_data.append("users", users);
      form_data.append("permissions", (data.write_permissions ? 3 : 1).toString());
      form_data.append("password", data.has_password ? data.password : "");
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/php/share.php", true);
      xhr.onload = function() {
        alert(xhr.response);
      };
      xhr.send(form_data);
      wnd.destroy();
    };
  }

  // temp/contextmenu.js
  var context_menu = null;
  function context(e, entries) {
    if (context_menu)
      context_menu.remove();
    context_menu = mk(document.body, "ul", "context");
    context_menu.onmousedown = (e2) => {
      e2.stopPropagation();
    };
    context_menu.onclick = (_e) => {
      context_menu.remove();
      context_menu = null;
    };
    context_menu.style.left = e.clientX + "px";
    context_menu.style.top = e.clientY + "px";
    for (const e2 of entries) {
      const li = document.createElement("li");
      li.innerText = e2[0];
      li.onclick = e2[1];
      context_menu.appendChild(li);
    }
  }
  document.body.onmousedown = (_e) => {
    if (context_menu) {
      context_menu.remove();
      context_menu = null;
    }
  };
  function oncontextmenu_hook2(_e) {
    if (context_menu) {
      context_menu.remove();
      context_menu = null;
    }
  }

  // temp/explorer.js
  var ExplorerWindow = class extends BaseWindow {
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
  };
  var FileView = class {
    constructor(filename, wnd, mimetype, is_directory, write_permissions) {
      this.filename = filename;
      this.wnd = wnd;
      this.visuals = null;
      this.mimetype = mimetype;
      this.is_directory = is_directory;
      this.write_permissions = write_permissions;
    }
    full_path() {
      return path_combine(this.wnd.get_path(), this.filename);
    }
  };
  var FileViewDraggable = class extends Draggable {
    constructor(fileview) {
      super(fileview.visuals);
      this.fileview = fileview;
      this.onBeforeDragStart = () => {
        this.placeholder = document.createElement("div");
        fileview.visuals.parentNode.insertBefore(this.placeholder, fileview.visuals);
      };
      this.onAfterDragEnd = () => {
        this.placeholder.parentNode.insertBefore(this.el, this.placeholder);
        this.placeholder.remove();
        fileview.visuals.style.removeProperty("position");
        fileview.visuals.style.removeProperty("width");
        fileview.visuals.style.removeProperty("height");
        fileview.visuals.style.removeProperty("left");
        fileview.visuals.style.removeProperty("top");
      };
    }
  };
  function make_window(wnd, has_close) {
    mk(wnd.h2, "div", "path");
    if (has_close) {
      var x_button = mk(wnd.h2, "button", "close_button");
      x_button.innerText = "X";
      x_button.onclick = () => {
        wnd.destroy();
      };
    }
    {
      wnd.foldercontents = mk(wnd.wc, "div", "foldercontents");
      var h3 = mk(wnd.foldercontents, "h3");
      var upload_btn = mk(h3, "button");
      upload_btn.innerText = "Upload";
      upload_btn.onclick = () => {
        show_upload_dialog();
      };
      mk(h3, "div", "separator");
      var new_folder_btn = mk(h3, "button");
      new_folder_btn.innerText = "New Folder";
      new_folder_btn.onclick = () => {
        new_folder(wnd);
      };
      mk(h3, "div", "separator");
      wnd.filegrid = mk(wnd.foldercontents, "div", "files");
    }
    {
      wnd.filecontentsroot = mk(wnd.wc, "div", "filecontentsroot");
      var h3 = mk(wnd.filecontentsroot, "h3");
      let download_btn = mk(h3, "button");
      download_btn.innerText = "Download";
      download_btn.onclick = () => {
        download_file(true);
      };
      mk(h3, "div", "separator");
      let share_btn = mk(h3, "button");
      share_btn.innerText = "Share";
      share_btn.onclick = () => {
        alert("TODO NOT IMPLEMENTETD");
      };
      mk(h3, "div", "separator");
      wnd.save_btn_container = mk(h3, "div");
      wnd.save_btn_container.style.display = "flex";
      let save_btn = mk(wnd.save_btn_container, "button");
      save_btn.innerText = "Save";
      save_btn.onclick = () => save_open_text_file(wnd);
      mk(wnd.save_btn_container, "div", "separator");
      wnd.filecontents = mk(wnd.filecontentsroot, "div", "filecontents");
    }
    return wnd;
  }
  function add_file_visuals(fileview, wnd) {
    var is_in_trash = wnd.pwd.length > 0 && wnd.pwd[0] == "trash";
    var is_trash = wnd.pwd.length == 0 && fileview.filename == "trash";
    var is_share = wnd.pwd.length == 0 && fileview.filename == "share";
    var visuals = mk(wnd.filegrid, "div");
    fileview.visuals = visuals;
    var img = document.createElement("img");
    var filename = document.createElement("div");
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
    };
    visuals.oncontextmenu = (e) => {
      if (!dragging) {
        var context_list = [
          ["Open", () => {
            wnd.pwd.push(fileview.filename);
            wnd.openfile(fileview.is_directory);
          }],
          ["Open in New Window", () => {
            var new_pwd = wnd.pwd.slice();
            new_pwd.push(fileview.filename);
            var new_wnd = new ExplorerWindow(new_pwd, 100, 100, 800, 600, true);
            new_wnd.opened_file = fileview;
            new_wnd.openfile(fileview.is_directory);
            new_wnd.focus();
          }]
        ];
        if (is_in_trash) {
          context_list.push(["Restore", () => {
            restore_from_trash(wnd, fileview.filename);
          }]);
          context_list.push(["Delete forever", () => {
            delete_file(wnd, fileview.filename);
          }]);
        } else if (!is_trash && !is_share) {
          context_list.push(["Rename", () => {
            rename_file(fileview.filename, wnd);
          }]);
          if (!fileview.is_directory) {
            for (let a of actions) {
              if (fileview.filename.endsWith(a.extension)) {
                context_list.push([a.text, () => {
                  read_file_contents(true, (x2) => {
                    const ue = encodeURIComponent(x2);
                    let url = a.url.replace("$content_urlencoded", ue).replace("$filename", fileview.filename);
                    if (a.open_in_iframe) {
                      const wnd2 = new BaseWindow([], 10, 10, 800, 600);
                      var title = mk(wnd2.h2, "span", "wndtitle");
                      title.innerText = fileview.filename;
                      var x_button = mk(wnd2.h2, "button", "close_button");
                      x_button.innerText = "X";
                      x_button.onclick = () => {
                        wnd2.destroy();
                      };
                      const contents = mk(wnd2.wc, "div", "filecontentsroot");
                      const iframe = mk(contents, "iframe");
                      iframe.style.flex = "1 0 0";
                      iframe.src = url;
                      wnd2.focus();
                    } else {
                      window.location = url;
                    }
                  }, wnd.get_path(), fileview.filename);
                }]);
              }
            }
            if (fileview.write_permissions) {
              context_list.push(["Replace", () => {
                replace_file(false, fileview.filename, wnd);
              }]);
            }
            context_list.push(["Share", () => {
              share(false, fileview.filename, wnd);
            }], ["Download", () => {
              download_file(false, fileview.filename);
            }]);
          }
          context_list.push(["Delete", () => {
            move_to_trash(wnd, fileview.filename);
          }]);
        }
        context(e, context_list);
      }
      e.preventDefault();
      e.stopPropagation();
    };
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
            move_to_trash(wnd, dragging.fileview.filename);
          } else if (wnd.get_path() == "/" && fileview.filename == "share") {
          } else {
            move_file(dragging.fileview.wnd, wnd, path_combine(wnd.get_path(), fileview.filename), dragging.fileview.filename);
          }
        } else {
        }
        end_drag(e);
      }
      e.preventDefault();
    };
    visuals.classList.add("file");
    filename.classList.add("filename");
    if (is_in_trash) {
      var split = fileview.filename.split("/");
      filename.innerText = split[split.length - 1];
    } else if (is_trash) {
      filename.innerText = "Trash";
    } else if (is_share) {
      var x = mk(filename, "span");
      x.style.fontSize = "0.8rem";
      x.innerText = "Shared with me";
    } else {
      filename.innerText = fileview.filename;
    }
    visuals.appendChild(img);
    visuals.appendChild(filename);
  }
  function openfile_nondir(wnd) {
    while (wnd.filecontents.children.length > 0)
      wnd.filecontents.removeChild(wnd.filecontents.lastChild);
    var data = new FormData();
    data.append("folder", wnd.get_path(wnd.pwd.length - 1));
    data.append("filename", wnd.pwd[wnd.pwd.length - 1]);
    var xhr = new XMLHttpRequest();
    update_path_visuals(wnd);
    xhr.open("POST", "/php/readfile.php", true);
    wnd.filecontents.innerText = "";
    wnd.filecontentsroot.style.display = "flex";
    wnd.foldercontents.style.display = "none";
    let is_image = wnd.opened_file.mimetype.split("/")[0] == "image";
    wnd.save_btn_container.style.display = wnd.opened_file.write_permissions && !is_image ? "flex" : "none";
    if (is_image) {
      xhr.responseType = "arraybuffer";
      xhr.onload = function() {
        let b = `data:image/png;base64,${base64ArrayBuffer(xhr.response)}`;
        wnd.filecontents.style.backgroundImage = `url('${b}')`;
        wnd.filecontents.classList.add("imgview");
      };
    } else {
      wnd.filecontents.classList.remove("imgview");
      wnd.filecontents.style.backgroundImage = "unset";
      wnd.txt_editor = mk(wnd.filecontents, "pre");
      xhr.onload = function() {
        wnd.txt_editor.innerText = xhr.responseText;
        if (wnd.opened_file.write_permissions)
          wnd.txt_editor.contentEditable = "true";
      };
    }
    xhr.send(data);
  }
  function openfile_dir(wnd) {
    update_path_visuals(wnd);
    var data = new FormData();
    data.append("path", wnd.get_path());
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/readdir.php", true);
    xhr.onload = function() {
      for (const f of wnd.files)
        f.visuals.remove();
      wnd.files = [];
      var json = JSON.parse(xhr.responseText);
      if (!json)
        return;
      for (const f of json) {
        var view = new FileView(f.name, wnd, f.mimetype, f.is_directory && f.is_directory != "0", f.can_edit && f.can_edit != "0");
        wnd.files.push(view);
      }
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
    wnd.filecontentsroot.style.display = "none";
    wnd.foldercontents.style.display = "flex";
    wnd.foldercontents.onmouseup = () => {
      if (dragging && dragging instanceof FileViewDraggable) {
        move_file(dragging.fileview.wnd, wnd, wnd.get_path(), dragging.fileview.filename);
      }
    };
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
  function delete_file(wnd, filename) {
    var data = new FormData();
    data.append("folder", wnd.get_path());
    data.append("filename", filename);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/delete.php", true);
    xhr.onload = function() {
      wnd.openfile(true);
    };
    xhr.send(data);
  }
  function rename_file(filename, wnd) {
    var new_name = prompt(`Rename ${filename} to`, filename);
    if (!new_name)
      return;
    var data = new FormData();
    data.append("folder", wnd.get_path());
    data.append("old_filename", filename);
    data.append("new_filename", new_name);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/rename.php", true);
    xhr.onload = function() {
      wnd.openfile(true);
    };
    xhr.send(data);
  }
  function move_file(srcwnd, dstwnd, new_folder2, filename, new_filename) {
    if (!new_filename)
      new_filename = filename;
    var data = new FormData();
    data.append("old_folder", srcwnd.get_path());
    data.append("new_folder", new_folder2);
    data.append("filename", filename);
    data.append("new_filename", new_filename);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/move.php", true);
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
    data.append("parent_directory", wnd.get_path());
    data.append("dirname", dirname);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/mkdir.php", true);
    xhr.onload = function() {
      wnd.openfile(true);
    };
    xhr.send(data);
  }
  function replace_file(in_file, filename, wnd) {
    if (in_file) {
      var folder = wnd.get_path(wnd.pwd.length - 1);
      filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
      var folder = wnd.get_path();
    }
    show_upload_dialog_replace_file(folder, filename);
  }
  function update_path_visuals(wnd) {
    var the_path = wnd.visuals.getElementsByClassName("path")[0];
    while (the_path.children.length > 0)
      the_path.removeChild(the_path.lastChild);
    for (let i = -1; i < wnd.pwd.length; i++) {
      var d;
      if (i >= 0) {
        d = wnd.pwd[i];
        var separator_div = mk(the_path, "div", "separator");
        separator_div.innerText = "\xBB";
      } else
        d = "Root";
      var entry = mk(the_path, "button", "pathentry");
      entry.innerText = d;
      entry.onclick = (_e) => {
        if (length < wnd.pwd.length) {
          wnd.pwd.length = i + 1;
          openfile_dir(wnd);
        }
      };
      entry.onmouseup = (e) => {
        if (dragging && dragging instanceof FileViewDraggable) {
          var new_folder2 = wnd.get_path(i + 1);
          move_file(dragging.fileview.wnd, wnd, new_folder2, dragging.fileview.filename);
          end_drag(e);
          e.preventDefault();
          e.stopPropagation();
        }
      };
    }
  }
  function download_file(in_file, filename, wnd) {
    if (in_file) {
      var folder = wnd.get_path(wnd.pwd.length - 1);
      filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
      var folder = wnd.get_path();
    }
    read_file_contents(false, (x) => {
      var blob = new Blob([new Uint8Array(x, 0, x.length)]);
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
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
    xhr.open("POST", "/php/upload.php", true);
    var data = new FormData();
    data.append("parent_directory", wnd.get_path(wnd.pwd.length - 1));
    data.append("filename", wnd.pwd[wnd.pwd.length - 1]);
    data.append("content", contents);
    data.append("overwrite", "1");
    xhr.send(data);
  }
  function read_file_contents(text, cb, folder, filename) {
    var data = new FormData();
    data.append("folder", folder);
    data.append("filename", filename);
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/php/readfile.php", true);
    if (text) {
      xhr.onload = function() {
        cb(xhr.responseText);
      };
    } else {
      xhr.responseType = "arraybuffer";
      xhr.onload = function() {
        cb(xhr.response);
      };
    }
    xhr.send(data);
  }
  function share(in_file, filename, wnd) {
    if (in_file) {
      var folder = wnd.get_path(wnd.pwd.length - 1);
      filename = wnd.pwd[wnd.pwd.length - 1];
    } else {
      var folder = wnd.get_path();
    }
    var sharewnd = new ShareWindow(folder, filename, 400, 400, 400);
    sharewnd.focus();
  }

  // temp/main.js
  function main() {
    var root_window = new ExplorerWindow([], 100, 100, 800, 600, false);
    root_window.focus();
    root_window.openfile(true);
  }
  document.body.oncontextmenu = (e) => {
    oncontextmenu_hook2(e);
    oncontextmenu_hook(e);
  };
  main();
})();
