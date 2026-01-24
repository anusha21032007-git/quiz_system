const http = require('http');

const data = JSON.stringify({
    topic: 'cybersecurty',
    count: 1,
    difficulty: 'easy',
    marks: 1,
    timeLimitSeconds: 60
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/generate-questions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', body);
    });
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.write(data);
req.end();
