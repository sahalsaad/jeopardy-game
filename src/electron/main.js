const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const ipc = electron.ipcMain;
const dialog = electron.dialog;
const fs = require('fs');

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') app.quit();
});

app.on('ready', function() {
  //BrowserWindow.addDevToolsExtension("/Users/denversmith/redux-dev-tools/");
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700
  });
  mainWindow.loadURL('file://' + __dirname + '/../index.html');
  //mainWindow.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
    app.exit(0);
  });

  mainWindow.on('did-navigate-in-page', function(event) {
    event.preventDefault(); // prevent ability to refresh page
  });

  const adminWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: 500,
    height: 450,
    closable: false,
    show: false,
    alwaysOnTop: true
  });

  adminWindow.loadURL('file://' + __dirname + '/admin.html');
  //adminWindow.openDevTools();
  
  ipc.on('send-answer-to-admin', function(event, args) {
    adminWindow.send('send-answer-to-admin-reply', {
      question: args.question,
      answer: args.answer,
      value: args.value,
      lastCorrectPlayer: args.lastCorrectPlayer
    });
  });
  
  ipc.on('show-final-jeopardy-question', function(event, args) {
    adminWindow.send('show-final-jeopardy-question', {
      question: args.question,
      answer: args.answer,
      wagers: args.wagers
    });
  });
  
  ipc.on('launch-admin-pannel', function(event, args) {
    adminWindow.send('launch-admin-pannel', {
      players: args.players
    });
    adminWindow.show();
  });
  
  const scoreboardWindow = new BrowserWindow({
    x: 50,
    y: 50,
    width: 300,
    height: 400,
    closable: false,
    show: false,
  });
  
  scoreboardWindow.loadURL('file://' + __dirname + '/scoreboard.html');

  ipc.on('launch-scoreboard', function(event, args) {
    scoreboardWindow.send('launch-scoreboard', {
      players: args.players
    });
    scoreboardWindow.show();
  });

  ipc.on('update-scoreboard', function(event, args) {
    scoreboardWindow.send('update-scoreboard', {
      players: args
    });
  });

});

ipc.on('open-file-dialog', function(event, arg) {
  const path = dialog.showOpenDialog(mainWindow, { properties: ['openFile']});
  if (path) {
    const data = readFile(path[0]);
    event.sender.send('open-file-reply', {name: path[0], fileContents: data});
  }
});

ipc.on('handle-answer', function(event, args) {
  mainWindow.send('update-score', args);
});
ipc.on('handle-final-answer', function(event, args) {
  mainWindow.send('update-final-score', args);
});

ipc.on('save-file-dialog', function(event, arg) {
  dialog.showSaveDialog(function(fileName) {
    if (fileName) {
      fs.writeFile(fileName, arg.data, function(error) {
        if (error) {
          alert('Something went wrong while trying to save the file: ' + erorr.message);
        }
      });
    }
  });
});


function readFile(path) {
  return fs.readFileSync(path, 'utf-8');
}
