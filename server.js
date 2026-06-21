import express from 'express';
import cors from 'cors';
import { generate } from './chatCompany.js'
const app = express()
app.use(cors());
const port = 3002;
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Welcome to ChatVPT!')
});


app.post('/chatRag', async (req, res) => {
    const { message, threadId } = req.body;
    if (!message || !threadId) {
        return res.status(400).json({ error: 'Message and threadId are required' });
    }
    console.log("Message:", message);
    const result = await generate(message, threadId)
    res.json({ message: result })
})

app.listen(port, () => {
    console.log(`Serve is running on port: ${port}`)
})