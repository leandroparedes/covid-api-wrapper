const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios').default;

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

const apiUrl = 'https://covid-api.mmediagroup.fr/v1';

const fs = require('fs');
const path = require('path');

function getFilePath(url) {
    return path.join('cache', `${url.replace(/[\W_]+/g, "_")}.json`);
}
app.get('/history', async (req, res) => {
    const filePath = getFilePath(req.originalUrl);

    try {
        if (fs.existsSync(filePath)) {
            console.log(`sending cached response from ${filePath}`);
            const data = require(`./${filePath}`);
            res.send(JSON.stringify(data));
        } else {
            const country = req.query.country || 'Global';
            const status = req.query.status || 'Confirmed';
        
            const url = `${apiUrl}/history?country=${country}&status=${status}`;
        
            const response = await axios.get(url);
        
            res.send(response.data);

            console.log(`writting cache on ${filePath}`);
            fs.writeFile(filePath, JSON.stringify(response.data), 'utf-8', (err) => {
                if (err) {
                    return console.log(err);
                }
                console.log('cache written successfully');
            });
        }
    } catch (err) {
        console.log(err);
    }
});

app.get('/cases', async (req, res) => {
    let url = `${apiUrl}/cases`;

    if (req.query.country) {
        url += `?country=${req.query.country}`;
    }

    const response = await axios.get(url);

    res.send(response.data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));