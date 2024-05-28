import http from 'http';
import fs from 'fs';

const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://127.0.0.1:11434/api/generate';

async function llama(question) {
    const method = 'POST';
    const headers = {
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
        model: 'orca-mini',
        prompt: question,
        options: {},
        stream: false
    });
    const request = { method, headers, body };
    const res = await fetch(LLAMA_API_URL, request);
    const { response } = await res.json();

    return response.trim();
}

async function handler(req, res) {
    const { url } = req;

    if(url === '/health') {
        res.writeHead(200).end('OK');
    } else if(url === "/" || url === "/index.html") {
        res.writeHead(200, { 'Content-Type': 'text/html'});
        res.end(fs.readFileSync('./index.html'));
    } else if(url.startsWith('/chat')) {
        const parsedUrl = new URL(`http://localhost${url}`);
        const { search } = parsedUrl;
        const question = decodeURIComponent(search.substring(1));
        const answer = await llama(question);
        console.log(`Question: ${question}, Answer: ${answer}`);
        res.writeHead(200).end(answer);
    } else {
        res.writeHead(404).end('Not Found');
    }
}

http.createServer(handler).listen(3000);