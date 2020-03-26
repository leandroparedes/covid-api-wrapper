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

## Features
* Response caching
* Add missing population for certain countries
* Country name translation (spanish)
* Data sorted by confirmed count by default
