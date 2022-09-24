/*
** A very simple server application
*/
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const r = require('./ads1115');

var ads1115 = new r();

try {
    console.log('Initialize connection');
    ads1115.initialize();
    ads1115.testConnection();
    console.log('The connection is all right');
}
catch(e) {
    console.log('An error happend');
    console.log(e);
}

const fs = require("fs");
const yargs = require('yargs/yargs')(process.argv.slice(2))
    .option('run', {
        alias: 'r',
        describe: 'run your program'
    })
    .option('path', {
        alias: 'p',
        describe: 'provide a path to file'
    })
    .option('spec', {
        alias: 's',
        describe: 'program specifications'
    })
    .demandOption(['path'], 'Please privide the path arguments to work with this tool')
    .help()
    .argv

var htmlPage = yargs.path;
if (fs.existsSync(htmlPage)) {
    const app = express();

    app.use(helmet());
// using bodyParser to parse JSON bodies into JS objects
    app.use(bodyParser.json());
// enabling CORS for all requests
    app.use(cors());
// adding morgan to log HTTP requests
    app.use(morgan('combined'));

// defining an endpoint to return all ads
    app.get('/index.html', (req, res) => {
        fs.readFile(htmlPage, function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading file: ' + htmlPage);
            }
            res.setHeader('content-type', 'text/html; charset=UTF-8');
            res.writeHead(200);
            res.end(data);
        });
    });

    app.get('/value', (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.writeHead(200);
        let gain = req.body.gain;
        if (gain) {
            ads1115.setGain(gain);
        }
        let mux = req.body.mux;
        if (mux) {
            ads1115.setMultiplexer(mux);
        }
        let mode = req.body.mode;
        if (mode) {
            ads1115.setMode(mode);
        }
        let triggerAndPoll = true;
        if (req.body.triggerAndPole) {
            triggerAndPoll = req.body.triggerAndPole;
        }
        let val = ads1115.getMilliVolts(triggerAndPoll);
        res.end('{"value":' + val + '}');
    });

    app.post('/gain', (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.writeHead(200);
        let gain = req.body.gain;
        if (gain) {
            ads1115.setGain(gain);
        }
        let val = ads1115.getConfigRegister();
        res.end(JSON.stringify(val));
    });

    app.post('/mux', (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.writeHead(200);
        let mux = req.body.mux;
        if (mux) {
            ads1115.setMultiplexer(mux);
        }
        let val = ads1115.getConfigRegister();
        res.end(JSON.stringify(val));
    });

    app.post('/mode', (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.writeHead(200);
        let mode = req.body.mode;
        if (mode) {
            ads1115.setMode(mode);
        }
        let val = ads1115.getConfigRegister();
        res.end(JSON.stringify(val));
    });

// starting the server
    app.listen(8081, () => {
        console.log('listening on port 8081');
    });
}
else {
    console.log('Cannot find file at ' + htmlPage);
}
