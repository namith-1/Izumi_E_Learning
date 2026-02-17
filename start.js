const { spawn } = require('child_process');
const path = require('path');

const apps = [
  {
    name: 'Izumi-Backend',
    cwd: path.join(__dirname, 'backend'),
    // Using 'nodemon' is better for dev, but 'node' works fine
    command: 'node', 
    args: ['server.js']
  },
  {
    name: 'Izumi-Frontend',
    cwd: path.join(__dirname, 'frontend'),
    command: 'npm.cmd', 
    args: ['run', 'dev']
  }
];

apps.forEach(app => {
  // We use /C instead of /K if you want the window to close ONLY on success
  // We added quotes around the path "${app.cwd}" to handle spaces in folder names
  const scriptToRun = `${app.command} ${app.args.join(' ')}`;
  const fullCommand = `title ${app.name} && cd /d "${app.cwd}" && ${scriptToRun}`;

  const child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', fullCommand], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true,
    shell: true
  });

  child.unref(); // Allows the parent script to exit while children stay open
  console.log(`🚀 ${app.name} started in a new terminal.`);
});

// Exit the master script after launching
process.exit();