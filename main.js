
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require('path');
const url = require('url');
var serialNumber = require('serial-number');
const axios = require('axios').default;
const index_start = require('./index');

app.on("ready", () => {
    let configurations = {
        // icon: path.join(__dirname, '/assets/images/favicon.png'),
        width: 1024,
        height: 668,
        show: false,
        webPreferences: {
            devTools: false,
            nodeIntegration: true,
            contextIsolation: false
        }
    };
    let mainWindow = new BrowserWindow(configurations);

    let prepare_url_path = {
        pathname: path.join(__dirname, '/views/index.html'),
        protocol: 'file',
        slashes: true
    };
    mainWindow.webContents.openDevTools();
    mainWindow.setMenu(null);
    mainWindow.setMinimumSize(1024, 668);

    mainWindow.loadURL(url.format(prepare_url_path));
    mainWindow.once("ready-to-show", () => {
        global.mainwin = mainWindow;
        mainWindow.show();
    });

    ipcMain.on('action_send', function (event, args) {
        index_start(args.action);
    });

    ipcMain.on('get_license_key', function (event, args) {
        serialNumber(async function (err, value) {
            let data = {
                "license_key":`${value}`,
                "name":"EmailFinder",
                "version":"1.0.0"
            }
           await axios.post('https://microsofters.net/check_license?license_key',data).then((result) => {
                if (result.data == '200.success') {
                    console.log()
                    mainWindow.loadURL(url.format({
                        pathname: path.join(__dirname, '/views/home.html'),
                        protocol: 'file:',
                        slashes: true
                    }));
                }else{
                    console.log("register licence key")
                    mainWindow.webContents.send("return_license_key", { key: value });
                }
            }).catch((err) => {
                mainWindow.webContents.send("return_license_key", { key: value });
            });
            // await mainWindow.loadURL(url.format({
            //     pathname: path.join(__dirname, '/views/home.html'),
            //     protocol: 'file:',
            //     slashes: true
            // }));
        });
    });

});

app.on("window-all-closed", () => {
    app.quit();
});