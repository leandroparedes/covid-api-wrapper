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

app.get('/history', async (req, res) => {
    const country = req.query.country || 'Global';
    const status = req.query.status || 'Confirmed';

    const url = `${apiUrl}/history?country=${country}&status=${status}`;

    const response = await axios.get(url);

    res.send(response.data);
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