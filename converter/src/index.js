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
var isAvailable = false;

console.log('Initialize connection');
ads1115.initialize();
isAvailable = ads1115.testConnection();
console.log('The connection is ' + (isAvailable ? "available" : "not available"));
if (isAvailable) {
    // We're going to do single shot sampling
    ads1115.setMode(1);
    // Slow things down so that we can see that the "poll for conversion" code works
    ads1115.setRate(0);
    // Set the gain (PGA) +/- 6.144V
    // Note that any analog input must be higher than –0.3V and less than VDD +0.3
    ads1115.setGain(0);
    ads1115.setConversionReadyPinMode();
    ads1115.setMultiplexer(0);
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
        var val;
        var gain;
        if (isAvailable) {
            try {
                ads1115.triggerConversion();
                val = ads1115.getMilliVolts(false);
                gain = ads1115.getGain();
            }
            catch(e) {
                console.log(e);
                val = 'Error';
            }
        }
        else {
            val = 'N/A';
        }
        res.end('{"result": ' + val + ', "Gain": ' + gain + ', "multiplexer": ' + ads1115.getMultiplexer() + '}');
    });

    app.post('/gain', (req, res) => {
        if (req.body.gain !== undefined) {
            ads1115.setGain(req.body.gain);
            res.setHeader('content-type', 'application/json');
            res.writeHead(200);
            var val;
            var gain;
            if (isAvailable) {
                try {
                    ads1115.triggerConversion();
                    val = ads1115.getMilliVolts(false);
                    gain = ads1115.getGain();
                }
                catch(e) {
                    console.log(e);
                    val = 'Error';
                }
            }
            else {
                val = 'N/A';
            }
            res.end('{"result": ' + val + ', "gain": ' + gain + '}');
        }
        else {
            res.end('{"result": "Error. No gain"}');
        }
    });

    app.post('/multiplexer', (req, res) => {
        if (req.body.multiplexer !== undefined) {
            var mux = req.body.multiplexer;
            var val = 'N/A';
            ads1115.setMultiplexer(mux);
            res.setHeader('content-type', 'application/json');
            res.writeHead(200);
            if (isAvailable) {
                try {
                    ads1115.triggerConversion();
                    val = ads1115.getMilliVolts(false);
                }
                catch(e) {
                    console.log(e);
                    val = 'Error';
                }
            }
            mux = ads1115.getMultiplexer();
            res.end('{"result": ' + val + ', "multiplexer": ' + mux + '}');
        }
        else {
            res.end('{"result": "Error. No multiplexer"}');
        }
    });


// starting the server
    app.listen(8081, () => {
        console.log('listening on port 8081');
    });
}
else {
    console.log('Cannot find file at ' + htmlPage);
}
