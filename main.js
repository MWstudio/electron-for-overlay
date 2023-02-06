// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')

const app_entry_1 = require("./app-entry");
const appEntry = new app_entry_1.Application();

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile('index.html')
}


app.whenReady().then(() => {
  if (process.argv[1] === "inject"){
    appEntry.inject_dll();
  }
  else if (process.argv[1] === "start"){
      appEntry.starting_overlay();
  }
  else if (process.argv[1] === "clip"){
      appEntry.clip_overlay();
  }
  else{
      // appEntry.inject_dll();
      appEntry.starting_overlay();
  }
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

