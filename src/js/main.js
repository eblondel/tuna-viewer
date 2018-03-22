/**
 * Global Tuna Atas web-application
 * Application development funded by BlueBridge EC project
 * 
 * @author Emmanuel Blondel GIS & Marine web-information systems Expert
 *		   Contact: https://eblondel.github.io / emmanuel.blondel1@gmail.com 
 */

var app = app || {};
var app = "1.0-beta"
 
$(document).ready(function(){
	app = new OpenFisViewer({
		OGC_CSW_BASEURL: "https://tunaatlas.d4science.org/geonetwork/srv/eng/csw",
		OGC_CSW_SCHEMA : "http://www.isotc211.org/2005/gmd",
		OGC_WMS_LAYERS : [
			{
				group: 0, id: "eez", title: "EEZ boundaries",
				wmsUrl: "http://geo.vliz.be/geoserver/MarineRegions/wms", layer: "MarinRegions:eez_boundaries",
				visible: false, showLegend: true, opacity: 0.6, tiled: true, cql_filter: undefined
			},
			{
				group: 0, id: "fsa", title: "FAO major areas & breakdown",
				wmsUrl: "http://www.fao.org/figis/geoserver/area/wms", layer: "area:FAO_AREAS",
				visible: false, showLegend: true, opacity: 0.9, tiled: true, cql_filter: undefined
			},
			{
				group: 0, id: "grid1x1", title: "Grid 1x1 (CWP)",
				wmsUrl: "https://tunaatlas.d4science.org/geoserver/tunaatlas/wms", layer: "tunaatlas:grid1x1,tunaatlas:continent",
				visible: false, showLegend: true, opacity: 0.5, tiled: true, cql_filter: undefined
			},
			{
				group: 0, id: "grid5x5", title: "Grid 5x5 (CWP)",
				wmsUrl: "https://tunaatlas.d4science.org/geoserver/tunaatlas/wms", layer: "tunaatlas:grid5x5,tunaatlas:continent",
				visible: false, showLegend: true, opacity: 0.5, tiled: true, cql_filter: undefined
			},
			{
				group: 0, id: "marineareas", title: "Marine areas",
				wmsUrl: "https://tunaatlas.d4science.org/geoserver/tunaatlas/wms", layer: "tunaatlas:MarineAreas",
				visible: true, showLegend: false, opacity: 0.9, tiled: false, cql_filter: undefined
			}
		]
	},{
		catalog: {
			maxitems: 25,
			filters: [
				{name: 'dc:subject', value: '%timeseries%'},
				{name: 'dc:identifier', value: '%global%'}
			]
		},
		map : {
			layergroups : [{name: "Base overlays"},{name: "Tuna maps"}]
		},
		ui 	: {
			query: { columns: 2, time: 'slider'}
		}
	});
	app.init();
});
