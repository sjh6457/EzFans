# Lab 2 advices

- Coordinates order changes between GeoJSON and Leaflet objects (Lat Lon VS Lon Lat).
  - Remember to use array.reverse when using a Leaflet native object like marker or circle.

- When you display a marker, you cannot change it's color
  - Instead use a circle which is easy to customize
  - Or change the marker image

- JS works asynchronously so you cannot be sure which item is displayed first
  - The last displayed item is displyed on top 
    - use async and await to make sure you display in the right order
    - or use functions to display the buildings/rooms/devices and make sure one function is called the other one is finished 
    - or use layers to make sure the devices are on top

- Leaflet popups do not automatically open on click, you have to open on the click event
