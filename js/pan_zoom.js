(function (panZoom, $) {
    panZoom.config = {
        zoom: {
            zoomHandle: {
                minTop: 0,
                maxTop:92,
                zoomStep:5,
                panStep:30,
                zoom:1,
                minZoom:0.1,
                maxZoom:2
            }
        }
    };

    function getZoomValue(opts, topPosition){
        let config  = panZoom.config.zoom.zoomHandle;
        let scale  =  d3.scaleLinear().domain([config.maxTop,config.minTop]).range([opts.zoomIn, opts.zoomOut]);
        return scale(topPosition);
    }

    function getTopValue(opts, zoom){
        let config  = panZoom.config.zoom.zoomHandle;
        let scale  =  d3.scaleLinear().domain([opts.zoomIn, opts.zoomOut]).range([ config.maxTop, config.minTop]);
        return scale(zoom);
    }

    panZoom.updatePedigreeDiagram = function(opts, x, y, zoom){
        pedcache.setposition(opts, x, y, zoom);
        d3.select('.diagram').attr('transform', 'translate(' + x + ',' + y + ') scale(' + zoom + ')');
    };

    panZoom.updateXYTransform = function(opts, x, y, zoom){
        let $zoomHandle =  $( ".zoom-handle" );
        $zoomHandle.css({ top: getTopValue(opts, parseFloat(zoom))});
    };

    panZoom.add = function(opts){
        let $viewControl = $('.view-controls');
        if($viewControl.length>0){
            $viewControl.remove();
        }
        if(!opts.showPanZoomControl && !panZoom.config.isFullScreenMode)return;
        $( `#${opts.targetDiv}`).append(
                `<div class="view-controls"><div class="view-controls-pan field-no-user-select" title="Pan">
<span class="view-control-pan pan-up fa fa-fw fa-arrow-up" title="Pan up"></span>
<span class="view-control-pan pan-right fa fa-fw fa-arrow-right" title="Pan right">
</span><span class="view-control-pan pan-down fa fa-fw fa-arrow-down" title="Pan down">
</span><span class="view-control-pan pan-left fa fa-fw fa-arrow-left" title="Pan left">
</span><span class="view-control-pan pan-home fa fa-fw fa-user" title="Pan home"></span>
</div><div class="view-controls-zoom field-no-user-select" title="Zoom">
<div class="field-no-user-select zoom-button zoom-in fa fa-fw fa-search-plus" title="Zoom in">
</div><div class="field-no-user-select zoom-track" style="height: 100px;">
<div class="field-no-user-select zoom-handle selected" title="Drag to zoom" style="top: 85px; position: relative;">
</div></div><div class="field-no-user-select zoom-button zoom-out fa fa-fw fa-search-minus" title="Zoom out"></div>
<div class="field-no-user-select zoom-crt-value"></div></div></div>`);
        //make the zoom handle draggable
        let $zoomHandle =  $( ".zoom-handle" );
        let xytransform = pedcache.getposition(opts);
        let xtransform = xytransform[0]!==null? xytransform[0]:0;
        let ytransform = xytransform[1] !==null? xytransform[1]:0;
        let zoom = 1;
        if(xytransform.length === 3) {
            zoom = xytransform[2];
        }
        $zoomHandle.css({ top: getTopValue(opts, zoom)});
        $zoomHandle.draggable({
            axis: "y",
            drag:function (event, ui) {
                ui.position.top = Math.max( panZoom.config.zoom.zoomHandle.minTop, ui.position.top);
                ui.position.top = Math.min( panZoom.config.zoom.zoomHandle.maxTop, ui.position.top);
                var xytransform = pedcache.getposition(opts);  // cached position
                var xtransform = xytransform[0];
                var ytransform = xytransform[1];
                panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(getZoomValue(opts,ui.position.top)));
            }
        });
            registerClickListeners(opts);
    };

    panZoom.translateX = function (opts, value) {
        var xytransform = pedcache.getposition(opts);  // cached position
        var xtransform = xytransform[0]!== null ? xytransform[0] : 0;
        var ytransform = xytransform[1]!== null ? xytransform[1] : 0;
        let zoom = 1;
        if (xytransform.length === 3) {
            zoom = xytransform[2];
        }
        panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(zoom));
        panZoom.updatePedigreeDiagram(opts,parseFloat(xtransform) + value, ytransform, zoom);
    };

    panZoom.translateY = function (opts, value) {
        var xytransform = pedcache.getposition(opts);  // cached position
        var xtransform = xytransform[0]!== null ? xytransform[0] : 0;
        var ytransform = xytransform[1]!== null ? xytransform[1] : 0;
        let zoom = 1;
        if (xytransform.length === 3) {
            zoom = xytransform[2];
        }
        panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(zoom));
        panZoom.updatePedigreeDiagram(opts,parseFloat(xtransform),parseFloat(ytransform)+value,zoom);
    };

    function registerClickListenersForPan(opts){
        let dimension;
        let config = panZoom.config.zoom.zoomHandle;
        $('.fa-arrow-up').on('click', function () {
           panZoom.translateY(opts, -config.panStep)
        });
        $('.fa-arrow-right').on('click', function () {
            panZoom.translateX(opts, config.panStep);
        });
        $('.fa-arrow-down').on('click', function () {
            panZoom.translateY(opts, config.panStep)
        });
        $('.fa-arrow-left').on('click', function () {
           panZoom.translateX(opts, -config.panStep);
        });

        $('.fa-user').on('click', function () {
            var xytransform = pedcache.getposition(opts);  // cached position
            var xtransform = xytransform[0]!== null ? xytransform[0] : 0;
            var ytransform = xytransform[1]!== null ? xytransform[1] : 0;
            let zoom = 1;
            if (xytransform.length === 3) {
                zoom = xytransform[2];
            }
            let bRect = d3.select('.diagram').node().getBoundingClientRect();
            panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate((window.innerWidth/2 - bRect.width/4), window.innerHeight/2 - bRect.width/4).scale(zoom));
        });
    }

    function registerClickListeners(opts) {
        registerClickListenersForPan(opts);
        let xytransform = pedcache.getposition(opts);
        let xtransform = xytransform[0]!==null? xytransform[0]:0;
        let ytransform = xytransform[1] !== null?  xytransform[1]:0;
        let $zoomHandle =  $( ".zoom-handle" );
        let topValue;
        let config = panZoom.config.zoom.zoomHandle;
        $('.fa-search-plus').on('click', function () {
            let topValueStr = $zoomHandle.css('top');
            topValueStr =  topValueStr.substring(0, topValueStr.length-2);
            topValue = Math.max(config.minTop, parseFloat(topValueStr,10)-config.zoomStep);
            var xytransform = pedcache.getposition(opts);  // cached position
            var xtransform = xytransform[0];
            var ytransform = xytransform[1];
            panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(getZoomValue(opts, topValue)));
            panZoom.updateXYTransform(opts, xtransform,ytransform,getZoomValue(opts, topValue));
        });

        $('.fa-search-minus').on('click', function () {
            let topValueStr = $zoomHandle.css('top');
            topValueStr =  topValueStr.substring(0, topValueStr.length-2);
            topValue = Math.min(config.maxTop, parseFloat(topValueStr,10)+config.zoomStep);
            var xytransform = pedcache.getposition(opts);  // cached position
            var xtransform = xytransform[0];
            var ytransform = xytransform[1];
            panZoom.svg.call(panZoom.zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(getZoomValue(opts, topValue)));
            panZoom.updateXYTransform(opts, xtransform,ytransform,getZoomValue(opts, topValue));
        });

    }



})(window.panZoom = window.panZoom || {}, jQuery);