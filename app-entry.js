const Overlay = require(process.cwd() + '/electron-overlay')
const electron_1 = require("electron");
const electron_2 = require("electron");
const electron_3 = require("electron");
class Application {
    constructor() {
        this.markQuit = false;
        this.scaleFactor = 1.0;
        this.windows = new Map();
        this.tray = null;
        this.Overlay = Overlay;
    }
   
    startOverlay() {
        Overlay.start()
        Overlay.setEventCallback((event, payload) => {

            if (event === "game.input") {
                const window = electron_1.BrowserWindow.fromId(payload.windowId);

                if (window) {
                    const intpuEvent = Overlay.translateInputEvent(payload);
   
                    if (intpuEvent) {

                        if ("x" in intpuEvent)
                            intpuEvent["x"] = Math.round(intpuEvent["x"] / this.scaleFactor);
                        if ("y" in intpuEvent)
                            intpuEvent["y"] = Math.round(intpuEvent["y"] / this.scaleFactor);
                        window.webContents.sendInputEvent(intpuEvent);
                    }
                }
            }
            else if (event === "graphics.fps") {

            }
            else if (event === "game.hotkey.down") {
               
            }
            else if (event === "game.window.focused") {

                electron_1.BrowserWindow.getAllWindows().forEach((window) => {
                    window.blurWebView();
                });
                const focusWin = electron_1.BrowserWindow.fromId(payload.focusWindowId);
                if (focusWin) {
                    focusWin.focusOnWebView();
                }
            }
        });
    }

    addOverlayWindow(name, window, dragborder = 0, captionHeight = 0, transparent = false) {
        const display = electron_3.screen.getDisplayNearestPoint(electron_3.screen.getCursorScreenPoint());
        Overlay.addWindow(window.id, {
            name,
            transparent,
            resizable: window.isResizable(),
            maxWidth: window.isResizable
                ? display.bounds.width
                : window.getBounds().width,
            maxHeight: window.isResizable
                ? display.bounds.height
                : window.getBounds().height,
            minWidth: window.isResizable ? 100 : window.getBounds().width,
            minHeight: window.isResizable ? 100 : window.getBounds().height,
            nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
            rect: {
                x: window.getBounds().x,
                y: window.getBounds().y,
                width: Math.floor(window.getBounds().width * this.scaleFactor),
                height: Math.floor(window.getBounds().height * this.scaleFactor),
            },
            caption: {
                left: dragborder,
                right: dragborder,
                top: dragborder,
                height: captionHeight,
            },
            dragBorderWidth: dragborder,
        });
        window.webContents.on(
            "paint", 
            (event, dirty, image) => {
            try{
                Overlay.sendFrameBuffer(window.id, image.getBitmap(), image.getSize().width, image.getSize().height);
            } catch (err) {
                //console.log('dsfdsf')
            }
            
        });
        window.on("ready-to-show", () => {
            window.focusOnWebView();
        });
        window.on("resize", () => {
            console.log(`${name} resizing`);
            Overlay.sendWindowBounds(window.id, {
                rect: {
                    x: window.getBounds().x,
                    y: window.getBounds().y,
                    width: Math.floor(window.getBounds().width * this.scaleFactor),
                    height: Math.floor(window.getBounds().height * this.scaleFactor),
                },
            });
        });
        const windowId = window.id;
        window.on("closed", () => {
            Overlay.closeWindow(windowId);
        });
        window.webContents.on("cursor-changed", (event, type) => {
            let cursor;
            switch (type) {
                case "default":
                    cursor = "IDC_ARROW";
                    break;
                case "pointer":
                    cursor = "IDC_HAND";
                    break;
                case "crosshair":
                    cursor = "IDC_CROSS";
                    break;
                case "text":
                    cursor = "IDC_IBEAM";
                    break;
                case "wait":
                    cursor = "IDC_WAIT";
                    break;
                case "help":
                    cursor = "IDC_HELP";
                    break;
                case "move":
                    cursor = "IDC_SIZEALL";
                    break;
                case "nwse-resize":
                    cursor = "IDC_SIZENWSE";
                    break;
                case "nesw-resize":
                    cursor = "IDC_SIZENESW";
                    break;
                case "ns-resize":
                    cursor = "IDC_SIZENS";
                    break;
                case "ew-resize":
                    cursor = "IDC_SIZEWE";
                    break;
                case "none":
                    cursor = "";
                    break;
            }
            if (cursor) {
                Overlay.sendCommand({ command: "cursor", cursor });
            }
        });
    }

    createWindow(name, option) {
        const window = new electron_1.BrowserWindow(option);
        this.windows.set(name, window);
        window.on("closed", () => {
            this.windows.delete(name);
        });
        window.webContents.on("new-window", (e, url) => {
            e.preventDefault();
            electron_3.shell.openExternal(url);
        });
        if (global.DEBUG) {

        }
        return window;
    }

    createStartingOverlay() {
        const options = {
            x: 0,
            y: 80,
            height: 80,
            width: 280,
            frame: false,
            show: false,
            transparent: true,
            resizable: false,
            backgroundColor: "#00000000",
            webPreferences: {
                offscreen: true,
            },
        };
        const name = "StatusBar";
        const window = this.createWindow(name, options);
        window.loadURL(process.cwd() + "/record_start.html");
        
        this.addOverlayWindow(name, window, 0, 0);
        return window;
    }
    
    createClipOverlay() {
        const options = {
            x: 0,
            y: 80,
            height: 80,
            width: 280,
            frame: false,
            show: false,
            transparent: true,
            resizable: false,
            backgroundColor: "#00000000",
            webPreferences: {
                offscreen: true,
            },
        };
        const name = "StatusBar";
        const window = this.createWindow(name, options);
        window.loadURL(process.cwd() + "/clip.html");

        this.addOverlayWindow(name, window, 0, 0);
        return window;
    }

    inject_dll() {
        let is_injected = false
        while (true) {
            for (const window of Overlay.getTopWindows()) {
                if (window.title.indexOf('League of Legends (TM) Client') !== -1) {
                    console.log(`--------------------\n injecting ${JSON.stringify(window)}`);
                    Overlay.injectProcess(window);
                    is_injected = true
                }
            }
            if (is_injected){
                break;
            }
        }
        //process.exit(1);
    }

    starting_overlay(){
        this.scaleFactor = electron_3.screen.getDisplayNearestPoint({
            x: 0,
            y: 0,
        }).scaleFactor;
        
        this.startOverlay();
        this.createStartingOverlay();
        setTimeout(() => Overlay.stop(), 5000);
        setTimeout(() => process.exit(1), 5500);
    }

    clip_overlay()  {
        this.scaleFactor = electron_3.screen.getDisplayNearestPoint({
            x: 0,
            y: 0,
        }).scaleFactor;
        
        this.startOverlay();
        this.createClipOverlay();
        setTimeout(() => Overlay.stop(), 3000);
        setTimeout(() => process.exit(1), 3500);
    }
}
exports.Application = Application;