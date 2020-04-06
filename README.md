# Mapping

Code, tools and resources to support interactive maps on the mutualaid.nyc website. View demo at https://mutualaidnyc.github.io.

# Getting Started

Copy `.env-sample` to `.env`:

```
$ cp .env-sample .env
```

Copy the necessary values (surrounded by double quotes) into `.env`, including:

* `MAPBOX_ACCESS_TOKEN`: Your own personal MapBox access token.
* `AIRTABLE_API_KEY`: Your own personal Airtable API key.
* `AIRTABLE_API_BASE`: The string representing the ID of the "MANYC Groups" Airtable Base. Found by navigating to the Base in Airtable, then "HELP → API documentation".

Once the `.env` values are in place, install the npm packages and start the development server:

```
$ npm install
$ npm run dev
```

Visit `http://localhost:8000` to see the map.

# Overview of what is needed
Build interactive mapbox map that can be embedded into the mutualaid.nyc website and display projects/resources at neighborhood/street level. That is: Display the map with the neaighborhood boundaries. When a user clicks on an area, a box would appear displaying all Neighborhood Groups in that area.

![Mockup](https://platformable.com/content/images/2020/03/mockup-of-map-1.png)

Replace http://mutualaid.nyc/neighborhood-groups/ with:
Airtable Data from here: https://airtable.com/tblyc5VOdFhMPGjcI/viwztUPjFG4Eiy00Z?blocks=bip0dsjEGImDy3f9Y
Neighborhood Tabulation Areas from here: https://data.cityofnewyork.us/City-Government/Neighborhood-Tabulation-Areas-NTA-/cpf4-rkhq
This type of thing could do it: https://docs.mapbox.com/mapbox-gl-js/example/data-join/
We could also use a more feature rich system. Devin can have one of his work work developers support adopting it to this use case if it’s prefered: https://github.com/soundpress/wegov_displayapp

- Set boundaries for neighborhoods using NTA definitions (see data standards below)
    - For example see: https://docs.mapbox.com/mapbox-gl-js/example/data-join/
- Link neighborhoods boundaries to Mutual Aid neighborhoods data that shows projects/groups in each neighborhood
- Link fields from neighborhoods data with descriptions of project/groups (There needs to be a shared identifier in each row in airtable, that can be joined against an identifier in the neighborhood boundaries data set)
- Store this data on mapbox. Once MutualAid NYC tables are set up and data is maintained: Airtable publishes CSV regularly (pushed via API). Mapbox Frontend (The front end is html/css/js that uses Mapbox gl js for map display) reads CSV. (Tabletop is js library to read CSV easily.) Maps on mutualaid stay current.
    - Alternative process: Start with using the native Airtable API to Javascript as a solution and then migrate to Airtable API syncing to custom db and mapping that.

# Data standards
- For definitions of neighborhood boundaries:
https://data.cityofnewyork.us/City-Government/Neighborhood-Tabulation-Areas-NTA-/cpf4-rkhq

- For definitions of Mutual Aid NYC pods boundaries, group descriptions, projects:
A Reference airtable is currently being built. It is similar to the data in this table:
https://airtable.com/shrtMLL4b6KdXuDhl
To test mapping of projects/groups/etc, use this CSV of the above table:
https://drive.google.com/open?id=1iUT_I3MkFIAiaC-dj_-Hf8Cyn8X1u6w-

# Tools
- Mapbox: what accountname?
- Tabletop: https://github.com/jsoma/tabletop

# Longer-term vision
- Mutual Aid US version in mapbox and perhaps to use as a template?
https://www.mutualaidhub.org/

- Feature rich example of what we could get to eventually:
https://github.com/soundpress/wegov_displayapp
