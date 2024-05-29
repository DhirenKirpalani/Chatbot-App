import http from 'http';
import fs from 'fs';
import fetch from 'node-fetch';

const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://127.0.0.1:11434/api/generate';

const SYSTEM_MESSAGE = `You run in a process of Question, Thought, Action, Observation.

Use Thought to describe your thoughts about the question you have been asked.
Observation will be the result of running those actions.
Finally at the end, state the Answer.

Here are some sample sessions.

Question: What is capital of france?
Thought: This is about geography, I can recall the answer from my memory.
Action: lookup: capital of France.
Observation: Paris is the capital of France.
Answer: The capital of France is Paris.

Question: Who painted Mona Lisa?
Thought: This is about general knowledge, I can recall the answer from my memory.
Action: lookup: painter of Mona Lisa.
Observation: Mona Lisa was painted by Leonardo da Vinci .
Answer: Leonardo da Vinci painted Mona Lisa.

Let's go!`;

async function llama(question) {
    const method = 'POST';
    const headers = {
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
        model: 'mistral-openorca',
        prompt: question,
        options: {
            num_predict: 200,
            temperature: 0,
            top_k: 20,
        },
        stream: false
    });
    const request = { method, headers, body };
    const res = await fetch(LLAMA_API_URL, request);
    const { response } = await res.json();

    return response.trim();
}

async function think(inquiry) {
    const prompt = SYSTEM_MESSAGE + "\n\n" + inquiry;
    const response = await llama(prompt);
    console.log(response);
    return answer(response);
}

async function answer(text) {
    const MARKER = 'Answer:';
    const pos = text.lastIndexOf(MARKER);
    if(pos < 0) return "?";
    const answer = text.substring(pos + MARKER.length).trim();
    return answer;
}

async function handler(req, res) {
    const { url } = req;

    if (url === '/health') {
        res.writeHead(200).end('OK');
    } else if (url === "/" || url === "/index.html") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('./index.html'));
    } else if (url.startsWith('/chat')) {
        const parsedUrl = new URL(`http://localhost${url}`);
        const { search } = parsedUrl;
        const question = decodeURIComponent(search.substring(1));
        const answer = await think(`Question: ${question}`);
        console.log(`Question: ${question}, Answer: ${answer}`);
        res.writeHead(200).end(answer);
    } else {
        res.writeHead(404).end('Not Found');
    }
}

http.createServer(handler).listen(3000);