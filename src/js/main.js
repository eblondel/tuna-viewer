/**
 * Tuna Atas web-application prototype by UN FAO - 2017
 * Application development powered by FAO, and funded by BlueBridge EC project
 *
 * @author Emmanuel Blondel GIS & Marine web-information systems Expert <emmanuel.blondel@fao.org> (alternate email <emmanuel.blondel1@gmail.com>)
 *
 */

var app = app || {};

(function ($) {
	$(document).ready(function(){

		
		//constants
		//===========================================================================================
		app.constants = {
            MAP_ZOOM: 3,
			MAP_PROJECTION: 'EPSG:4326',
            MAP_OVERLAY_GROUP_NAMES: [{name: "Tuna maps"},{name: "Base overlays"}],
            OGC_CSW_BASEURL: "https://geonetwork1-tunaatlas.d4science.org/geonetwork/srv/en/csw",
            OGC_WMS_BASEURL: undefined,
            OGC_WFS_BASEURL: undefined,
            OGC_WFS_BBOX: undefined,
            SEARCH_MAX_ITEMS_NUMBER: 50
		}
		
		//Utils
		//===========================================================================================

        // app.lightenMetadata = function(obj) {
            // if (obj['TYPE_NAME']){
                // delete obj['TYPE_NAME'];
            // };
            // if(typeof obj.name != "undefined"){
              // if(typeof obj.name.CLASS_NAME != "undefined"){
                // if(obj.name.CLASS_NAME == 'Jsonix.XML.QName'){
                    // obj = obj.value;
                // }
              // }
            // }
            
            // if(obj instanceof Array){
                // var newObj = new Array();
                // for(var i=0;i<obj.length;i++) {
                    // var newObjItem = this.lightenMetadata(obj[i]);
                    // newObj.push(newObjItem);
                // }
                // obj = newObj;
            // }else{
                // if(typeof obj === 'object'){
                    // var newObj = new Object();
                    // for(p in obj) {
                       // if(typeof obj[p] === 'object'){
                          // newObj[p] = this.lightenMetadata(obj[p]);
                       // }else{
                          // newObj[p] = obj[p];
                       // }
                    // }
                    // obj = newObj;
                // }
            // }
            // return obj;
        // }
        
        app.lightenMetadata = function(obj) {
            var this_ = this;
            var key = 'TYPE_NAME';
            var clazz = Jsonix.XML.QName;
            if (typeof obj === 'object') {
                delete obj[key];
                if(obj.name) if(obj.name instanceof clazz){
                    obj = obj.value;
                }
                Object.keys(obj).forEach(x => this_.lightenMetadata(obj[x], key, clazz));
            } else if (Array.isArray(obj)) {
                obj.forEach(val => this_.lightenMetadata(val, key, clazz));
            }
            return(obj);
        };
        
		// ISO/OGC metadata management
		//==========================================================================================
		
        /**
         * initDataCatalogue
         */
        app.initDataCatalogue = function(){
            var cswConfig = [
                [
                    OWS_1_0_0,
                    DC_1_1,
                    DCT,
                    XLink_1_0,
                    SMIL_2_0,
                    SMIL_2_0_Language,
                    GML_3_1_1,
                    Filter_1_1_0,
                    CSW_2_0_2,
                    GML_3_2_0,
                    GML_3_2_1,
                    ISO19139_GCO_20060504,
                    ISO19139_GMD_20060504,
                    ISO19139_GTS_20060504,
                    ISO19139_GSS_20060504,
                    ISO19139_GSR_20060504,
                    ISO19139_GMX_20060504,
                    ISO19139_GCO_20070417,
                    ISO19139_GMD_20070417,
                    ISO19139_GTS_20070417,
                    ISO19139_GSS_20070417,
                    ISO19139_GSR_20070417,
                    ISO19139_GMX_20070417,
                    ISO19139_SRV_20060504
                ],
                {
                    namespacePrefixes: {
                        "http://www.opengis.net/cat/csw/2.0.2": "csw",
                        "http://www.opengis.net/ogc": 'ogc',
                        "http://www.opengis.net/gml": "gml",
                        "http://purl.org/dc/elements/1.1/":"dc",
                        "http://purl.org/dc/terms/":"dct",
                        "http://www.isotc211.org/2005/gmd" : "gmd",
                        "http://www.isotc211.org/2005/gco" : "gco",
                    },
                    mappingStyle : 'standard'
                }
            ];
    
            this.csw = new Ows4js.Csw(this.constants.OGC_CSW_BASEURL, cswConfig);
            return this.csw;
        }
        
        /**
         * getDatasets
         * @param maxNb maximum number of records
         */
        app.getDatasets = function(maxNb, bbox){
            
            var this_ = this;
            var deferred = $.Deferred();
            if(!this.csw) deferred.reject("CSW endpoint is not instantiated!");
            if(this.csw){
                
                //nb of records
                if(!maxNb) maxNb = this_.constants.SEARCH_MAX_ITEMS_NUMBER;
                
                //base filter
                //TODO limit to FDI compliant datasets
                var filter =  new Ows4js.Filter().PropertyName(['dc:subject']).isLike('%timeseries%');
                
                //free text filter
                var txt = $("#dataset-search-text").val();
                if(txt != ""){
                    txt = '%'+txt+'%';
                    var txtFilter = new Ows4js.Filter().PropertyName(['dc:title']).isLike(txt);
                    txtFilter = txtFilter.or(  new Ows4js.Filter().PropertyName(['dc:subject']).isLike(txt) );
                    filter = filter.and(txtFilter);
                }
                
                //spatial filter
                if(bbox){
                    console.log(bbox);
                    filter = filter.and(new Ows4js.Filter().BBOX(bbox[0], bbox[1], bbox[2], bbox[3], 'urn:x-ogc:def:crs:EPSG:6.11:4326'));
                }
                
                var outputSchema = 'http://www.isotc211.org/2005/gmd';
                this.csw.GetRecords(1, maxNb, filter, outputSchema).then(function(result){
                    var datasets = new Array();
                    if(result.value.searchResults.numberOfRecordsMatched > 0){                 
                        var csw_results = result.value.searchResults.any;
                        
                        //post-process results
                        for(var i=0;i<csw_results.length;i++){
                            var csw_result = csw_results[i];    
                            
                            //result object
                            csw_result.metadata = csw_result.value;
                            //TODO work on a lightening metadata
                            //csw_result.metadata = this_.lightenMetadata(csw_result.value);
                            delete csw_result.value;
                            csw_result.title = csw_result.metadata.identificationInfo[0].abstractMDIdentification.value.citation.ciCitation.title.characterString.value;
                            csw_result.graphic_overview = csw_result.metadata.identificationInfo[0].abstractMDIdentification.value.graphicOverview[0].mdBrowseGraphic.fileName.characterString.value;
                            csw_result._abstract = csw_result.metadata.identificationInfo[0].abstractMDIdentification.value._abstract.characterString.value;
                            datasets.push(csw_result);
                        }                       
                    }
                      
                    deferred.resolve(datasets);
                });
            }
            return deferred.promise();
        },
        
        
        /**
         * app.displayDatasets
         *
         */
         app.displayDatasets = function(bbox){
            var this_ = this;
            $($("#dataset-list").find("section")[0]).empty();
            $("#dataset-loader").show();
         
            this.datasets = new Array();
            if($("#dataset-search-bbox").prop("checked") && !bbox){
                bbox = this.map.getView().calculateExtent(this.map.getSize());
            }
            this.getDatasets(false, bbox).then(function(results){
                console.log(results);
                var options = {
                    valueNames: [   
                        'title',
                        '_abstract',
                        { name: 'graphic_overview', attr: 'data-mainSrc' }
                    ],
                    item: 'dataset-item',
                    pagination: true,
                    page: 5
                };
                $("#dataset-loader").hide();
                var datasetList = new List('dataset-list', options, results);
                this_.displayGraphicOverviews();
                datasetList.on("updated", function(evt){
                    this_.displayGraphicOverviews();
                });
            });
         }
         
         /**
          * app.displayGraphicOverviews
          */
         app.displayGraphicOverviews = function(){
            var imgs = $("img.graphic_overview");
            $.each(imgs, function () {
                var $this = $(this);
                
                var im = new Image();
                im.onload = function () {
                    var theImage = $this;
                    $this.hide();
                    theImage[0].src = im.src;
                    $this.show();
                };
                im.onerror = function(){
                    var theImage = $this;
                    $this.hide();
                    $this.css("background", "url('img/loading-error.svg')");
                    $this.show();
                }
                $this.css("background", "url('img/loading.gif')");
                im.src = $this.data("mainsrc");
            });
         }
      
		// Map UI
		//===========================================================================================
		
		/**
		 * Inits the map
		 */
		app.initMap = function(id, main, extent){
        
            var map;
			var this_ = this;
            this_.layers = new Object();
            
			//baselayers
			var esri1Template = 'https://server.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';
			var esri2Template = 'https://server.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer/tile/{z}/{y}/{x}';
			baseLayers = [
				new ol.layer.Group({
					'title': "Basemaps",
					layers: [
						new ol.layer.Tile({
							title : "ESRI - Countries",
							type: 'base',
							source : new ol.source.XYZ({							
								attributions: [
									new ol.Attribution({
										html: 'Tiles © <a href="http://services.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer">ArcGIS</a>'
									})
								],
								projection: ol.proj.get(this_.constants.MAP_PROJECTION),
								tileSize: 512,
                                				tileUrlFunction: function(tileCoord) {
                							return esri2Template.replace('{z}', (tileCoord[0] - 1).toString())
                                  						.replace('{x}', tileCoord[1].toString())
                                  						.replace('{y}', (-tileCoord[2] - 1).toString());
              							},
								crossOrigin: 'anonymous',
								wrapX: true
                            				})
						}),
						new ol.layer.Tile({
							title : "ESRI World Imagery",
							type: 'base',
							source : new ol.source.XYZ({
								attributions: [
									new ol.Attribution({
										html: 'Tiles © <a href="http://services.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer">ArcGIS</a>'
									})
								],
								projection: ol.proj.get(this_.constants.MAP_PROJECTION),
								tileSize: 512,
								tileUrlFunction: function(tileCoord) {
                							return esri1Template.replace('{z}', (tileCoord[0] - 1).toString())
                                  						.replace('{x}', tileCoord[1].toString())
                                  						.replace('{y}', (-tileCoord[2] - 1).toString());
              							},
								crossOrigin: 'anonymous',
								wrapX: true
                            				})
						})

					]
				})
			];

            
			//overlay groups
			overlays = new Array();
            for(var i=0;i< this.constants.MAP_OVERLAY_GROUP_NAMES;i++){
                overlay = new ol.layer.Group({
                    'title': this.constants.MAP_OVERLAY_GROUP_NAMES[i].name,
                    layers: [ ],
                });
                overlays.push(overlay);
            }
			var defaultMapExtent = ((this.constants.OGC_WFS_BBOX)? this.constants.OGC_WFS_BBOX : [-180, -90, 180, 90]);
			var defaultMapZoom = ((this.constants.OGC_WFS_BBOX)? 5 : this.constants.MAP_ZOOM);
            
            if(main){
                this.layers.baseLayers = baseLayers;
                this.layers.overlays = overlays;
                this.defaultMapExtent = defaultMapExtent;
                this.defaultMapZoom = defaultMapZoom;
            }     
        
			//map
            var mapId = id? id : 'map';
			$("#"+mapId).empty();
			var map = new ol.Map({
                id: mapId,
                target : mapId,
                layers : this_.layers.baseLayers.concat(this_.layers.overlays),
                view : new ol.View({
                    projection: this.constants.MAP_PROJECTION,
                    center : ol.extent.getCenter(defaultMapExtent),
                    extent: defaultMapExtent,
                    zoom : defaultMapZoom
                }),
                controls: [],
                logo: false
            });
			map.addControl( new ol.control.LoadingPanel() );
			map.addControl( new ol.control.Zoom() );
			map.addControl( new ol.control.ZoomToMaxExtent({
				extent	: extent? extent : defaultMapExtent,
				zoom	: defaultMapZoom
			} ));
            
            if(main){
                map.addControl( new ol.control.LayerSwitcher({
                        target: "layerswitcher",
                        displayLegend: true,
                        collapsableGroups : true,
                        overlayGroups : this.constants.MAP_OVERLAY_GROUP_NAMES
                }));
            }       
                        
            if(extent){
               map.getView().fit(extent, map.getSize());
            }
            
            if(main && this.constants.MAP_ZOOM){
                map.getView().setZoom(this.constants.MAP_ZOOM);
            }
            
            //events
            //------
            //spatial search
            map.on('moveend', function(evt){
                if($("#dataset-search-bbox").prop("checked")){
                    var bbox = evt.map.getView().calculateExtent(evt.map.getSize());
                    this_.displayDatasets(bbox); 
                }
            });
            
            return map;
		}

		/**
		 * Set legend graphic
		 * @param a ol.layer.Layer object
		 */	 
		app.setLegendGraphic = function(lyr) {
			var source = lyr.getSource();
			if( !(source instanceof ol.source.TileWMS) ) return false;
			var params = source.getParams();
			var request = '';
			request += source.getUrls()[0] + '?';
			request += 'VERSION=1.0.0';
			request += '&REQUEST=GetLegendGraphic';
			request += '&LAYER=' + params.LAYERS;
			request += '&STYLE=' + ( (params.STYLES)? params.STYLES : '');
			request += '&LEGEND_OPTIONS=forcelabels:on;forcerule:True;fontSize:12'; //maybe to let as options
			request += '&SCALE=139770286.4465912'; //to investigate
			request += '&FORMAT=image/png';
			request += '&TRANSPARENT=true';
            request += '&WIDTH=30';
			lyr.legendGraphic = request;
		}
		
        /**
		 * Adds  layer
		 * @param main (true/false)
		 * @param mainOverlayGroup
		 * @param id
        	 * @param title
        	 * @param layer
       		 * @param cql_filter
		 */
		app.addLayer = function(main, mainOverlayGroup, id, title, layer, cql_filter){
			var layer = new ol.layer.Tile({
				id : id,
				title : title,
				source : new ol.source.TileWMS({
					url : this.constants.OGC_WMS_BASEURL,
					params : {
							'LAYERS' : layer,
							'VERSION': '1.1.1',
							'FORMAT' : 'image/png',
							'TILED'	 : true,
							'TILESORIGIN' : [-180,-90].join(','),
                            'CQL_FILTER': cql_filter
					},
					wrapX: true,
					serverType : 'geoserver',
					crossOrigin: 'anonymous'
				}),
				opacity : 0.8,
				visible : true
			});
			this.setLegendGraphic(layer);
            layer.id = id;
			layer.showLegendGraphic = true;
           
            if(main){
				if(mainOverlayGroup > this.overlays.length-1){
					alert("Overlay group with index " + mainOverlayGroup + " doesn't exist");
				}
				layer.overlayGroup = this.constants.MAP_OVERLAY_GROUP_NAMES[mainOverlayGroup];
                this.overlays[mainOverlayGroup].getLayers().push(layer);
            }else{
				layer.overlayGroup = this.constants.MAP_OVERLAY_GROUP_NAMES[0];
               	this.featureMap.getLayers().push(layer);
            }
		}
    
		/**
		 * Util method to get layer by property
		 * @param layerProperty the property value
		 * @param by the property 
		 */
		app.getLayerByProperty = function(layerProperty, by){
			if(!by) byTitle = false;
			var target = undefined;
			for(var i=0;i<this.map.getLayerGroup().getLayersArray().length;i++){
				var layer = this.map.getLayerGroup().getLayersArray()[i];
				var condition  = by? (layer.get(by) === layerProperty) : (layer.getSource().getParams()["LAYERS"] === layerProperty);
				if(condition){
					target = this.map.getLayerGroup().getLayersArray()[i];
					break;
				}
			}
			return target;
		}
       
        /**
         * app.configureViewer
         */
        app.configureViewer = function(){
            var this_ = this;
            this_.map = this_.initMap('map', true, false);
            $($("li[data-where='#pageMap']")).on("click", function(e){
                $($("#map").find("canvas")).show();
            });
        }

        
		//===========================================================================================
		//Widgets UIs
		//===========================================================================================
    
        /**
       * Init dialog
       */
       app.initDialog = function(id, title, classes, position, liIdx){
             if(!classes){
                classes  = {
                  "ui-dialog": "ui-corner-all",
                  "ui-dialog-titlebar": "ui-corner-all",
                }
             }
             if(!position){
                position = { my: "center", at: "top", of: window };
             }
             $( "#" + id ).dialog({
                autoOpen: false,
                title: title,
                classes: classes,
                position: position,
                show: {
                    effect: "fade",
                    duration: 300
                },
                hide: {
                    effect: "fade",
                    duration: 300
                },
                open: function( event, ui ) {
                    $($("nav li")[liIdx]).addClass("active");
                },
                close: function( event, ui ) {
                    $($("nav li")[liIdx]).removeClass("active");
                }
            });
       }
       
       /**
        * Open dialog
        */
        app.openDialog = function(id){
            if(!$("#" + id).dialog("isOpen")){
                $("#" + id).dialog("open");
            }
        }
       
       /**
        * Close dialog
        */
       app.closeDialog = function(id){
            if($("#" + id).dialog("isOpen")){
                $("#" + id).dialog("close");
            }
       }
        
       /**
       * Open 'About' dialog
       */
       app.openAboutDialog = function(){
             this.closeDataDialog();
             this.closeQueryDialog();
             this.openDialog("aboutDialog");
       }
       /**
        * Close 'About' dialog
        */
       app.closeAboutDialog = function(){
            this.closeDialog("aboutDialog");
       }
       
       /**
        * Open 'Data' dialog
        */
       app.openDataDialog = function(){
            this.closeAboutDialog();
            this.closeQueryDialog();
            this.openDialog("dataDialog");
       }
       
       /**
        * Close 'Data' dialog
        */
        app.closeDataDialog = function(){
            this.closeDialog("dataDialog");
        }
        
        /**
        * Open 'Query' dialog
        */
       app.openQueryDialog = function(){
            this.closeAboutDialog();
            this.closeDataDialog();
            this.openDialog("queryDialog");
       }
       
       /**
        * Close 'Query' dialog
        */
        app.closeQueryDialog = function(){
            this.closeDialog("queryDialog");
        }
        
		//===========================================================================================
		//application init
		//===========================================================================================
		
        //init map
        app.configureViewer();
        
        //init catalogue
        app.initDataCatalogue();
        app.displayDatasets();
        
        //init widgets
        app.initDialog("aboutDialog", "Welcome!",{"ui-dialog": "about-dialog", "ui-dialog-title": "dialog-title"}, null, 0);
        app.initDialog("dataDialog", "Browse data catalogue", {"ui-dialog": "data-dialog", "ui-dialog-title": "dialog-title"}, { my: "left top", at: "left center", of: window }, 1);
        app.initDialog("queryDialog", "Query a dataset", {"ui-dialog": "query-dialog", "ui-dialog-title": "dialog-title"}, { my: "left top", at: "left center", of: window }, 2);
        app.openAboutDialog();
        

	});
	
}( jQuery ));


