!function(o){var e={};function n(t){if(e[t])return e[t].exports;var r=e[t]={i:t,l:!1,exports:{}};return o[t].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=o,n.c=e,n.d=function(o,e,t){n.o(o,e)||Object.defineProperty(o,e,{enumerable:!0,get:t})},n.r=function(o){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(o,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(o,"__esModule",{value:!0})},n.t=function(o,e){if(1&e&&(o=n(o)),8&e)return o;if(4&e&&"object"==typeof o&&o&&o.__esModule)return o;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:o}),2&e&&"string"!=typeof o)for(var r in o)n.d(t,r,function(e){return o[e]}.bind(null,r));return t},n.n=function(o){var e=o&&o.__esModule?function(){return o.default}:function(){return o};return n.d(e,"a",e),e},n.o=function(o,e){return Object.prototype.hasOwnProperty.call(o,e)},n.p="/",n(n.s=0)}([function(o,e,n){"use strict";n.r(e);n(1);function t(o,e){return function(o){if(Array.isArray(o))return o}(o)||function(o,e){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(o)))return;var n=[],t=!0,r=!1,i=void 0;try{for(var a,u=o[Symbol.iterator]();!(t=(a=u.next()).done)&&(n.push(a.value),!e||n.length!==e);t=!0);}catch(o){r=!0,i=o}finally{try{t||null==u.return||u.return()}finally{if(r)throw i}}return n}(o,e)||function(o,e){if(!o)return;if("string"==typeof o)return r(o,e);var n=Object.prototype.toString.call(o).slice(8,-1);"Object"===n&&o.constructor&&(n=o.constructor.name);if("Map"===n||"Set"===n)return Array.from(n);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return r(o,e)}(o,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function r(o,e){(null==e||e>o.length)&&(e=o.length);for(var n=0,t=new Array(e);n<e;n++)t[n]=o[n];return t}function i(o){var e=o.name,n=o.missionShort,t=o.website,r=o.groupPhone,i=o.groupEmail,a=e;if(t){var u=o.website;t.indexOf("http")<0&&(u="http://".concat(t)),a=['<a class="neighborhoodPopup__groupWebsite" href="'.concat(u,'" target="_blank">'),e,"</a>"].join("")}var c=r.replace(/[()-\s.]/g,"");0!==r.indexOf("+")&&(c=0===r.indexOf("1")?"+".concat(c):"+1".concat(c));var s=n?'<span class="neighborhoodPopup__groupDescription">'.concat(n,"</span>"):"",p=i?'<span class="neighborhoodPopup__groupEmail">'.concat(i,"</span>"):"",h=r?'<a href="tel:'.concat(c,'" class="neighborhoodPopup__groupPhone">').concat(r,"</a>"):"";return'\n        <div class="neighborhoodPopup__group">\n            <h3 class="neighborhoodPopup__groupName">'.concat(a,"</h3>\n            ").concat(s,"\n            ").concat(p,"\n            ").concat(h,"\n        </div>\n    ")}function a(){return Promise.all([fetch("/data/groups").then((function(o){return o.json()})).then((function(o){return o.map((function(o){return Object.assign({},o,{region:JSON.parse(o.region),servicingNeighborhood:JSON.parse(o.servicingNeighborhood),communitiesServed:JSON.parse(o.communitiesServed),advocacyIssues:JSON.parse(o.advocacyIssues)})}))})),fetch("/data/neighborhoods").then((function(o){return o.json()})),fetch("/data/nta.geojson").then((function(o){return o.json()}))]).then((function(o){var e=t(o,3),n=e[0],r=e[1];return function(o,e){var n={type:"FeatureCollection",features:[]},t={type:"FeatureCollection",features:[]},r={type:"FeatureCollection",features:[]};return o.features.forEach((function(o){var a=o.properties,u=a.ntacode,c=a.boro_name,s=e.ntaCodeToNeighborhood[u];if(!s.hide){var p=e.ntaCodeToServicingGroup[u],h=e.boroughToLocatedGroup[c],l=e.nycGroups,d=e.nyGroups,f=e.nationalGroups,g=p&&p.length,b=[];g&&(b.push('<h2 class="neighborhoodPopup__sectionTitle neighborhoodPopup__sectionTitle-hasServicingGroups">Groups in this Neighborhood</h2>'),p.forEach((function(o){return b.push(i(o))}))),h&&h.length&&(b.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in this Borough</h2>'),h.forEach((function(o){return b.push(i(o))}))),l.length&&(b.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in NYC</h2>'),l.forEach((function(o){return b.push(i(o))}))),d.length&&(b.push('<h2 class="neighborhoodPopup__sectionTitle">Groups in New York State</h2>'),d.forEach((function(o){return b.push(i(o))}))),f.length&&(b.push('<h2 class="neighborhoodPopup__sectionTitle">National Groups</h2>'),f.forEach((function(o){return b.push(i(o))})));var v='\n            <div class="neighborhoodPopup">\n                <h1 class="neighborhoodPopup__neighborhoodName">'.concat(s.name,"</h1>\n                ").concat(b.join(""),"\n            </div>\n        ").trim(),m=Object.assign({},o.properties,{description:v});o.properties=m,g?t.features.push(o):r.features.push(o),n.features.push(o)}})),{allNeighborhoods:n,neighborhoodsWithLocalGroups:{type:"FeatureCollection",features:[]},neighborhoodsWithoutLocalGroups:r,neighborhoodsWithServicingLocalGroups:t}}(e[2],function(o,e){var n=e.reduce((function(o,e){return o[e.airtableId]=e,o}),{}),t=e.reduce((function(o,e){return o[e.ntaCode]=e,o}),{}),r={},i={},a=[],u=[],c=[];return o.forEach((function(o){var e=o.servicingNeighborhood,t=o.region;Array.isArray(e)&&e.length?e.forEach((function(e){var t=n[e].ntaCode;null!=r[t]?r[t].push(o):r[t]=[o]})):Array.isArray(t)&&t.length&&t.forEach((function(e){"New York City"===e?a.push(o):"New York State"===e?u.push(o):"National"===e?c.push(o):null!=i[e]?i[e].push(o):i[e]=[o]}))})),{idToNeighborHood:n,ntaCodeToNeighborhood:t,ntaCodeToServicingGroup:r,boroughToLocatedGroup:i,nycGroups:a,nyGroups:u,nationalGroups:c}}(n,r))}))}document.addEventListener("DOMContentLoaded",(function(){fetch("/mapbox-access-token").then((function(o){return o.text()})).then((function(o){mapboxgl.accessToken=o})).then((function(){return Promise.all([new Promise((function(o,e){var n=new mapboxgl.Map({container:"map",style:"mapbox://styles/mapbox/light-v10",center:[-74.005,40.705],zoom:9.9,scrollZoom:!1});n.addControl(new mapboxgl.NavigationControl),n.on("load",(function(){o(n)}))})),a()])})).then((function(o){var e=t(o,2);return function(o,e){o.addSource("nta-borders",{type:"geojson",data:e.allNeighborhoods}),o.addSource("nta-serviced-neighborhoods",{type:"geojson",data:e.neighborhoodsWithServicingLocalGroups}),o.addSource("nta-neighborhoods-with-local-groups",{type:"geojson",data:e.neighborhoodsWithLocalGroups}),o.addSource("nta-unserviced-neighborhoods",{type:"geojson",data:e.neighborhoodsWithoutLocalGroups});var n=window.FILL_OPACITY||1;function t(e){var n=e.features[0].properties.description;(new mapboxgl.Popup).setMaxWidth("").setLngLat(e.lngLat).setHTML(n).addTo(o)}function r(){o.getCanvas().style.cursor="pointer"}function i(){o.getCanvas().style.cursor=""}o.addLayer({id:"nta-unserviced-neighborhoods",type:"fill",source:"nta-unserviced-neighborhoods",paint:{"fill-color":"#59A6E5","fill-opacity":n}}),o.addLayer({id:"nta-neighborhoods-with-local-groups",type:"fill",source:"nta-neighborhoods-with-local-groups",paint:{"fill-color":"#A27CEF","fill-opacity":n}}),o.addLayer({id:"nta-serviced-neighborhoods",type:"fill",source:"nta-serviced-neighborhoods",paint:{"fill-color":"#43C59E","fill-opacity":n}}),o.addLayer({id:"nta-borders",type:"line",source:"nta-borders",layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":"rgba(0,0,0,0.4)","line-width":2}}),o.on("click","nta-unserviced-neighborhoods",t),o.on("click","nta-neighborhoods-with-local-groups",t),o.on("click","nta-serviced-neighborhoods",t),o.on("mouseleave","nta-unserviced-neighborhoods",i),o.on("mouseleave","nta-neighborhoods-with-local-groups",i),o.on("mouseleave","nta-serviced-neighborhoods",i),o.on("mouseenter","nta-unserviced-neighborhoods",r),o.on("mouseenter","nta-neighborhoods-with-local-groups",r),o.on("mouseenter","nta-serviced-neighborhoods",r)}(e[0],e[1])}))}))},function(o,e,n){var t=n(2),r=n(3);"string"==typeof(r=r.__esModule?r.default:r)&&(r=[[o.i,r,""]]);var i={insert:"head",singleton:!1},a=(t(r,i),r.locals?r.locals:{});o.exports=a},function(o,e,n){"use strict";var t,r=function(){return void 0===t&&(t=Boolean(window&&document&&document.all&&!window.atob)),t},i=function(){var o={};return function(e){if(void 0===o[e]){var n=document.querySelector(e);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(o){n=null}o[e]=n}return o[e]}}(),a=[];function u(o){for(var e=-1,n=0;n<a.length;n++)if(a[n].identifier===o){e=n;break}return e}function c(o,e){for(var n={},t=[],r=0;r<o.length;r++){var i=o[r],c=e.base?i[0]+e.base:i[0],s=n[c]||0,p="".concat(c," ").concat(s);n[c]=s+1;var h=u(p),l={css:i[1],media:i[2],sourceMap:i[3]};-1!==h?(a[h].references++,a[h].updater(l)):a.push({identifier:p,updater:b(l,e),references:1}),t.push(p)}return t}function s(o){var e=document.createElement("style"),t=o.attributes||{};if(void 0===t.nonce){var r=n.nc;r&&(t.nonce=r)}if(Object.keys(t).forEach((function(o){e.setAttribute(o,t[o])})),"function"==typeof o.insert)o.insert(e);else{var a=i(o.insert||"head");if(!a)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");a.appendChild(e)}return e}var p,h=(p=[],function(o,e){return p[o]=e,p.filter(Boolean).join("\n")});function l(o,e,n,t){var r=n?"":t.media?"@media ".concat(t.media," {").concat(t.css,"}"):t.css;if(o.styleSheet)o.styleSheet.cssText=h(e,r);else{var i=document.createTextNode(r),a=o.childNodes;a[e]&&o.removeChild(a[e]),a.length?o.insertBefore(i,a[e]):o.appendChild(i)}}function d(o,e,n){var t=n.css,r=n.media,i=n.sourceMap;if(r?o.setAttribute("media",r):o.removeAttribute("media"),i&&btoa&&(t+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(i))))," */")),o.styleSheet)o.styleSheet.cssText=t;else{for(;o.firstChild;)o.removeChild(o.firstChild);o.appendChild(document.createTextNode(t))}}var f=null,g=0;function b(o,e){var n,t,r;if(e.singleton){var i=g++;n=f||(f=s(e)),t=l.bind(null,n,i,!1),r=l.bind(null,n,i,!0)}else n=s(e),t=d.bind(null,n,e),r=function(){!function(o){if(null===o.parentNode)return!1;o.parentNode.removeChild(o)}(n)};return t(o),function(e){if(e){if(e.css===o.css&&e.media===o.media&&e.sourceMap===o.sourceMap)return;t(o=e)}else r()}}o.exports=function(o,e){(e=e||{}).singleton||"boolean"==typeof e.singleton||(e.singleton=r());var n=c(o=o||[],e);return function(o){if(o=o||[],"[object Array]"===Object.prototype.toString.call(o)){for(var t=0;t<n.length;t++){var r=u(n[t]);a[r].references--}for(var i=c(o,e),s=0;s<n.length;s++){var p=u(n[s]);0===a[p].references&&(a[p].updater(),a.splice(p,1))}n=i}}}},function(o,e,n){(e=n(4)(!1)).push([o.i,"body{margin:0;padding:0}#map{position:absolute;top:0;bottom:0;width:100%}.mapboxgl-popup{max-width:80%;height:60%}.mapboxgl-popup-content{height:100%}.neighborhoodPopup{margin:0;height:100%;overflow:scroll}@media screen and (min-width:768px){.mapboxgl-popup{max-width:60%;height:400px}}@media screen and (min-width:900px){.mapboxgl-popup{max-width:40%;height:500px}}.neighborhoodPopup__neighborhoodName{margin:0;font-size:24px;line-height:120%}.neighborhoodPopup__sectionTitle{margin:15px 0 10px;font-size:20px;color:#59a6e5}.neighborhoodPopup__sectionTitle-hasServicingGroups{color:#43c59e}.neighborhoodPopup__group{padding:4px;border:1px solid #ddd;margin-bottom:5px}.neighborhoodPopup__groupName{margin:5px 0;font-size:18px}.neighborhoodPopup__groupDescription,.neighborhoodPopup__groupEmail,.neighborhoodPopup__groupInstagram,.neighborhoodPopup__groupPhone,.neighborhoodPopup__groupTwitter,.neighborhoodPopup__groupWebsite{display:block;margin-top:5px;font-size:16px}",""]),o.exports=e},function(o,e,n){"use strict";o.exports=function(o){var e=[];return e.toString=function(){return this.map((function(e){var n=function(o,e){var n=o[1]||"",t=o[3];if(!t)return n;if(e&&"function"==typeof btoa){var r=(a=t,u=btoa(unescape(encodeURIComponent(JSON.stringify(a)))),c="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(u),"/*# ".concat(c," */")),i=t.sources.map((function(o){return"/*# sourceURL=".concat(t.sourceRoot||"").concat(o," */")}));return[n].concat(i).concat([r]).join("\n")}var a,u,c;return[n].join("\n")}(e,o);return e[2]?"@media ".concat(e[2]," {").concat(n,"}"):n})).join("")},e.i=function(o,n,t){"string"==typeof o&&(o=[[null,o,""]]);var r={};if(t)for(var i=0;i<this.length;i++){var a=this[i][0];null!=a&&(r[a]=!0)}for(var u=0;u<o.length;u++){var c=[].concat(o[u]);t&&r[c[0]]||(n&&(c[2]?c[2]="".concat(n," and ").concat(c[2]):c[2]=n),e.push(c))}},e}}]);