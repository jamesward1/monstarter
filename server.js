import express from 'express';
import { createServer } from "http";
import path from 'path';
import { fileURLToPath } from 'url';
import Data from '../cafe-back/server/public/js/util/data.mjs'
import * as fs from 'fs';
import { Server } from "socket.io";

const app = express();
const PORT = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = createServer(app);
const io = new Server(server);

//app.get('/', function (req, res) {
//	res.sendFile(__dirname + '/client/index.html');
//});
app.use(express.static(__dirname + '/client'));

io.on('connection', (socket) => {
	console.log("connected");
	socket.on("result", (data) => {
		console.log(JSON.stringify(data, null, 4));
		fs.writeFile('bakefile.json', JSON.stringify(data, function (k, v) {
			if (v instanceof Array && v.length < 4)
				return JSON.stringify(v)
			return v;
		}, 4).replace(/\\/g, '')
			.replace(/\"\[/g, '[')
			.replace(/\]\"/g, ']')
			.replace(/\"\{/g, '{')
			.replace(/\}\"/g, '}'), 'utf8', cb);
	})
})

function cb() {
	console.log('done');
}

server.listen(PORT, (error) => {
	if (!error) {
		console.log("Server is Successfully Running, and App is listening on port " + PORT)
	}
	else {
		console.log("Error occurred, server can't start", error);
	}
});