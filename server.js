import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use(express.static(__dirname + '/client'));
app.listen(PORT, (error) => {
	if (!error) {
		console.log("Server is Successfully Running, and App is listening on port " + PORT)
	}
	else {
		console.log("Error occurred, server can't start", error);
	}
});