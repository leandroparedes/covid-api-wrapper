# covid-api-wrapper
API wrapper for https://github.com/M-Media-Group/Covid-19-API

## Endpoints
* [Cases](https://covid-api-wrapper.herokuapp.com/cases)
  * Parameters (as query string)
    * country (default: Global)
* [History](https://covid-api-wrapper.herokuapp.com/history)
  * Parameters (as query string)
    * country (default: Global)
    * status: Confirmed, Deaths (default: Confirmed)
* [Country](https://covid-api-wrapper.herokuapp.com/country/Chile) (new)
  * Parameters
    * country (required)

## Features
* Response caching
* Add missing population for certain countries
* Country name translation (spanish)
* Data sorted by confirmed count by default
* Added endpoint /country/{country}. Return merged data with the following format: <br>
<pre>
  {
    country: {
      name,
      name_es,
      original_name,
      population,
      confirmed,
      deaths,
      newConfirmed,
      newDeaths
    },
    confirmedData: {
      "2020-03-26": 2,
      "2020-03-25": 1,
      ...
    },
    deathsData: {
      "2020-03-26": 2,
      "2020-03-25": 1,
      ...
    }
  }
</pre>
