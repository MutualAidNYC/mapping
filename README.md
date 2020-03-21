# Mapping
Code, tools and resources to support interactive maps on the mutualaid.nyc website

# Overview of what is needed
Build interactive mapbox map that can be embedded into the mutualaid.nyc website and display projects/resources at neighborhood/street level.
- Set boundaries for neighborhoods using NTA definitions (see data standards below)
    - For example see: https://docs.mapbox.com/mapbox-gl-js/example/data-join/ 
- Link neighborhoods boundaries to Mutual Aid neighborhoods data that shows projects/groups in each neighborhood
- Link fields from neighborhoods data with descriptions of project/groups
- Store this data on mapbox. Once MutualAid NYC tables are set up and data is maintained: Airtable publishes CSV regularly (pushed via API). Mapbox Frontend reads CSV. (Tabletop is js library to read CSV easily.) Maps on mutualaid stay current.
    - Alternative process: Start with using the native Airtable API to Javascript as a solution and then migrate to Airtable API syncing to custom db and mapping that.

# Data standards
- For definitions of neighborhood boundaries:
https://data.cityofnewyork.us/City-Government/Neighborhood-Tabulation-Areas-NTA-/cpf4-rkhq

- For definitions of Mutual Aid NYC pods boundaries, group descriptions, projects:
A Reference airtable is currently being built. It is similar to the data in this table:
https://airtable.com/shrtMLL4b6KdXuDhl
To test mapping of projects/groups/etc, use this CSV of the above table:
https://drive.google.com/open?id=1uu_p1_ARII5v6m-apt3EqqvPmXn68PxQ

# Tools
Mapbox: what accountname?
Tabletop: https://github.com/jsoma/tabletop

# Longer-term vision
- Mutual Aid US version in mapbox and perhaps to use as a template? 
https://www.mutualaidhub.org/

- Feature rich example of what we could get to eventually:
https://github.com/soundpress/wegov_displayapp
