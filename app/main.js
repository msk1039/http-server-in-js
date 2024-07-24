const net = require("net");
const fs = require("fs");

const flags = process.argv.slice(2);
const directory = flags.find((_, index) => flags[index - 1] == "--directory");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    var requestBody = data.toString();
    var requestLines = requestBody.split("\r\n");
    var [method, url, httpVersion] = requestLines[0].split(" ");

    if (method == "GET") {
      if (url == "/") {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (url.includes("/echo/")) {
        const content = url.split("/echo/")[1];
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (url.includes("/user-agent")) {
        const content = requestBody
          .split("User-Agent: ")[1]
          .split(" ")[0]
          .trimEnd();
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (url.includes("/files/")) {
        const filePath = url.slice(7);
        if (!fs.existsSync(directory + filePath)) {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
          socket.end();
          return;
        }
        const file = fs.readFileSync(directory + filePath);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n${file}`
        );
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (method == "POST") {
      if (url.startsWith("/files/")) {
        const filename = url.split("/files/")[1];
        const headersAndBody = requestBody.split("\r\n\r\n");
        const body = headersAndBody[1];
        fs.writeFileSync(`${directory}/${filename}`, body);
        socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
      }
      else{
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }

      
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    socket.end();
  });
});

server.listen(4221, "localhost", () => {
  process.stdout.write("Listening on localhost:4221");
});
