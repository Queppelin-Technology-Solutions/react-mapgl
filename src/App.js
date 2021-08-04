import React from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'
import { readRemoteFile } from 'react-papaparse';


mapboxgl.accessToken = "pk.eyJ1IjoicnV0aHZpa2wiLCJhIjoiY2tydWN0djgxM3NsNTJwcGVjeDYycWE3aSJ9.rKyvGjipdJFJQGz_NS9sgQ";

class App extends React.Component {
  
  componentDidMount() {
    var a = []  // empty arry to store all the coordinate values from csv 
    // read local csv file 
    var csvFilePath = require("./data.csv");
    readRemoteFile(csvFilePath, {
      complete: (results) => {
        for (var i=0; i < 6; i++) {
          a[i] = results.data[i]
          console.log('Results:', a[i]);
      }  
        
      },
    });

    //target point
    var end = [-123.662323, 45.523751];


    // Creates new map instance
    const map = new mapboxgl.Map({
      container: this.mapWrapper,
      style : "mapbox://styles/ruthvikl/ckrvx1raw579u17pfx6whssnf",
      center: [-123.662323, 45.523751],
      zoom: 12
    });
    // var canvas = map.getCanvasContainer();

    // function to animate the route 
    function enableLineAnimation(layerId) {
      var step = 0;
      let dashArraySeq = [
        [0, 4, 3],
        [1, 4, 2],
        [2, 4, 1],
        [3, 4, 0],
        [0, 1, 3, 3],
        [0, 2, 3, 2],
        [0, 3, 3, 1]
      ];
      setInterval(() => {
          step = (step + 1) % dashArraySeq.length;
          map.setPaintProperty(layerId, 'line-dasharray', dashArraySeq[step]);
        }, 50);
    }

    //function to get route 
    function getRoute(start,i) {
      // an arbitrary end  will always be the same
      // only the start point will change
      var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' 
      + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + 
      '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;
      console.log(i)
      // makeing an XHR request
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.onload = function() {
        var json = JSON.parse(req.response);
        var data = json.routes[0];
        var route = data.geometry.coordinates;
        console.log(route)
        var geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };

        // if the route already exists on the map, reset it using setData
        if (map.getSource('route')) {
          console.log('old route');
          map.getSource('route').setData(geojson);
        } else { // otherwise, make a new request
          console.log('new route');
          map.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: geojson
                }
              }
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
          //animate the added route
          enableLineAnimation('route');
        }
      };
      req.send();
      
    }
    
    map.on('load', function() {
      // make an initial directions request that
      // starts and ends at the same location
      // getRoute(end);
    
      // Add target point to the map
      map.addLayer({
        id: 'point',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: end
              }
            }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be'
        }
      });

      // add start points to the map
      for(var i = 0; i < a.length; i++) {
        console.log(i);
        // adding the start points 
        map.addLayer({
          id: 'point' + i,
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: a[i]
                }
              }
              ]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#ffffff'
          }
        });
        //get the route for the start points and target points 
         getRoute(a[i],i)
      }
      
    });
}

  render() {
    return (
      // Populates map by referencing map's container property
      <div ref={el => (this.mapWrapper = el)} className="mapWrapper" />
    );
  }
}

export default App;
