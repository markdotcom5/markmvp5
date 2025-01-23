const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Port 3000 test successful');
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('Port 3000 is still in use.');
    } else {
        console.error('Unhandled error:', err);
    }
});



