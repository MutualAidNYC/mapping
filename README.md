# Mapping
Code, tools and resources to support interactive maps on the mutualaid.nyc website

# Overview of what is needed
Build interactive mapbox map that can be embedded into the mutualaid.nyc website and display projects/resources at neighbrohood/street level.
- Set boundaries for neighborhoods using NTA definitions (see data standards below)
* For example see: https://docs.mapbox.com/mapbox-gl-js/example/data-join/ 
- Link neighborhoods boundaries to Mutual Aid neighborhoods data that shows projects/groups in each neighborhood
- Link fields from neighborhoods data with descriptions of project/groups
- Store this data on mapbox and set up API to ensure realtime feed as source doucmnets get updated.


# Data standards
- For definitions of neighborhood boundaries:
https://data.cityofnewyork.us/City-Government/Neighborhood-Tabulation-Areas-NTA-/cpf4-rkhq

- For definitions of Mutual Aid NYC pods boundaries, group descriptions, projects:
A Reference airtable is currently being built. It is similar to the data in this table:
https://airtable.com/shrtMLL4b6KdXuDhl
To test mapping of projects/groups/etc, use this CSV of the above table:
https://drive.google.com/open?id=1uu_p1_ARII5v6m-apt3EqqvPmXn68PxQ

# Longer-term vision
- Mutual Aid US version in mapbox and perhaps to use as a template? 
https://www.mutualaidhub.org/

- Feature rich example of what we could get to eventually:
https://github.com/soundpress/wegov_displayapp
