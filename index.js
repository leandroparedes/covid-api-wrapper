const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios').default;

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

const cacheIsEnabled = false;
const apiUrl = 'https://covid-api.mmediagroup.fr/v1';

const fs = require('fs');
const path = require('path');

// https://restcountries.eu/rest/v2/all?fields=name;alpha2Code;population;translations
const countriesInfo = require('./countries_info.json');

function getFilePath(url) {
    return path.join('cache', `${url.replace(/[\W_]+/g, "_")}.json`);
}

function normalizedName(countryName) {
    switch (countryName) {
        case 'Korea, South': return 'Republic of Korea'; break;
        case 'US': return 'United States of America'; break;
        case 'Bolivia': return 'Bolivia (Plurinational State of)'; break;
        case 'Brunei': return 'Brunei Darussalam'; break;
        case 'Czechia': return 'Czech Republic'; break;
        case 'Taiwan*': return 'Taiwan'; break;
        case 'Sri Lanka': return 'Sri Lanka'; break;
        case 'Congo (Kinshasa)': return 'Kinshasa'; break;
        case 'Congo (Brazzaville)': return 'Brazzaville'; break;
        case 'Cote d\'Ivoire': return 'Ivory Coast';
        case 'Bahamas, The': return 'Bahamas'; break;
        case 'Gambia, The': return 'Gambia'; break;
        default: return countryName; break;
    }
}

function getPopulation(country) {
    const info = countriesInfo.find(countryInfo => countryInfo.name == normalizedName(country));
    return info ? info.population : '';
}

function getTranslation(country) {
    if (country == 'Global') return 'Global';
    const countryNormalizedName = normalizedName(country);
    const info = countriesInfo.find(countryInfo => countryInfo.name == countryNormalizedName);
    return info ? info.translations.es : countryNormalizedName;
}

function getCountryCode(country) {
    const info = countriesInfo.find(countryInfo => countryInfo.name == normalizedName(country));
    return info ? info.alpha2Code : '';
}

function sortByConfirmed(data) {
    var byConfirmed = data.slice(0);
    byConfirmed.sort(function(a, b) {
        return b.confirmed - a.confirmed;
    });
    return byConfirmed;
}

function formatData(data, country) {
    if (Object.keys(data)[0] == 'All') {
        let population = data.All.population;
        if (! population) {
            population = getPopulation(country);
        }
        const nameNormalized = normalizedName(country);
        return {
            name: nameNormalized,
            name_es: getTranslation(nameNormalized),
            originalName: country,
            population: population,
            confirmed: data.All.confirmed,
            deaths: data.All.deaths,
            recovered: data.All.recovered,
            countryCode: getCountryCode(nameNormalized),
            dates: data.All.dates,
            continent: data.All.continent,
            location: data.All.location,
        };
    } else {
        let formattedData = [];
        Object.keys(data).map(country => {
            let population = data[country].All.population;
            if (! population) {
                population = getPopulation(country);
            }
            const nameNormalized = normalizedName(country);
            formattedData.push({
                name: nameNormalized,
                name_es: getTranslation(nameNormalized),
                originalName: country,
                population: population,
                confirmed: data[country].All.confirmed,
                deaths: data[country].All.deaths,
                recovered: data[country].All.recovered,
                countryCode: getCountryCode(nameNormalized),
                continent: data[country].All.continent,
                location: data[country].All.location
            });
        });
        return sortByConfirmed(formattedData);
    }
}
const moment = require('moment');

function todayConfirmedAndDeaths (countryData, confirmedData, deathsData) {
    let lastUpdate = countryData.data.All.updated;

    if (! lastUpdate) {
        lastUpdate = moment().local().format('YYYY-MM-DD');
    } else {
        lastUpdate = moment(lastUpdate).local().format('YYYY-MM-DD');
    }

    const dayBefore = moment(lastUpdate).local().subtract(1, 'day').format('YYYY-MM-DD');
    
    const todayConfirmed = countryData.data.All.confirmed - confirmedData.data.All.dates[dayBefore];
    const todayDeaths = countryData.data.All.deaths - deathsData.data.All.dates[dayBefore];
    
    return { todayConfirmed, todayDeaths };
}

const cache = function (req, res, next) {
    const filePath = getFilePath(req.originalUrl);

    if (fs.existsSync(filePath)) {
        console.log(`sending cached response from ${filePath}`);
        const data = require(`./${filePath}`);
        res.send(JSON.stringify(data));
    } else {
        next();
    }
}

function writeCache(filePath, data) {
    if (! cacheIsEnabled) {
        console.log('skipping writting cache. Cache is disabled');
        return;
    }

    if (! fs.existsSync(filePath)) {
        console.log(`writting cache on ${filePath}`);
        fs.writeFile(filePath, JSON.stringify(data), 'utf-8', (err) => {
            if (err) {
                return console.log(err);
            }
            console.log('cache written successfully');
        });
    }
}

if (cacheIsEnabled) {
    app.use(cache);
}

app.get('/clear-cache', (req, res) => {
    const directory = './cache';

    let files = fs.readdirSync(directory);
    files = files.filter(file => file != '.gitignore');

    for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
        });
    }

    res.send({ message: 'Cache cleared successfully' });
});

app.get('/country/:country', (req, res) => {
    const country = req.params.country;
    axios.all([
        axios.get(`${apiUrl}/cases?country=${country}`),
        axios.get(`${apiUrl}/history?country=${country}&status=Confirmed`),
        axios.get(`${apiUrl}/history?country=${country}&status=Deaths`)
    ]).then(axios.spread((countryData, confirmedData, deathsData) => {
        const country = normalizedName(countryData.data.All.country || 'Global');

        let population = countryData.data.All.population;
        if (! population) {
            population = getPopulation(countryData.data.All.country)
        }

        const newData = todayConfirmedAndDeaths(countryData, confirmedData, deathsData);
        
        const data = {
            country: {
                name: country,
                name_es: getTranslation(country),
                originalName: countryData.data.All.country || country,
                population: population,
                confirmed: countryData.data.All.confirmed,
                deaths: countryData.data.All.deaths,
                newConfirmed: newData.todayConfirmed,
                newDeaths: newData.todayDeaths,
            },
            confirmedData: confirmedData.data.All.dates,
            deathsData: deathsData.data.All.dates,
        };

        res.send(data);

        writeCache(getFilePath(req.originalUrl), data);
    }));
});

app.get('/history', async (req, res) => {
    const country = req.query.country || 'Global';
    const status = req.query.status || 'Confirmed';

    const url = `${apiUrl}/history?country=${country}&status=${status}`;

    const response = await axios.get(url);

    const formattedData = formatData(response.data, country);
    res.send(formattedData);

    writeCache(getFilePath(req.originalUrl), formattedData);
});

app.get('/cases', async (req, res) => {
    let url = `${apiUrl}/cases`;

    if (req.query.country) {
        url += `?country=${req.query.country}`;
    }

    const response = await axios.get(url);

    const formattedData = formatData(response.data, req.query.country);
    res.send(formattedData);
    writeCache(getFilePath(req.originalUrl), formattedData);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));