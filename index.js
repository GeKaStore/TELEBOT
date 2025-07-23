const { spawn } = require("child_process");

const start = () => {
  const child = spawn("node", ["main.js"], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  })
    .on("message", (msg) => {
      if (msg === "restart") {
        child.kill();
        start();
        delete child;
      }
    })
    .on("exit", (code) => {
      if (!(code == null)) {
        child.kill();
        start();
        delete child;
      }
    })
    .on("error", (err) => console.log(err));
};

start();
