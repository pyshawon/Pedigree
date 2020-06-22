// pedigree widgets
(function (widgets, $, undefined) {

    function getTranslation(transform) {
        // Create a dummy g for calculation purposes only. This will never
        // be appended to the DOM and will be discarded once this function
        // returns.
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Set the transform attribute to the provided string value.
        g.setAttributeNS(null, "transform", transform);

        // consolidate the SVGTransformList containing all transformations
        // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
        // its SVGMatrix.
        var matrix = g.transform.baseVal.consolidate().matrix;

        // As per definition values e and f are the ones for the translation.
        return [matrix.e, matrix.f];
    }

    var dragging;
    var last_mouseover;
    //
    // Add widgets to nodes and bind events
    widgets.addWidgets = function (opts, node) {
        let malePathData =
            `M730 1285 l0 -215 -193 0 c-189 0 -194 -1 -215 -23 -22 -23 -22 -26
        -22 -448 l0 -426 23 -21 c23 -22 26 -22 443 -22 l421 0 21 23 c22 23 22 26 22
        448 l0 426 -23 21 c-22 21 -32 22 -215 22 l-192 0 0 215 0 215 -35 0 -35 0 0
        -215z m418 -307 c17 -17 17 -739 0 -756 -17 -17 -749 -17 -766 0 -17 17 -17
        739 0 756 17 17 749 17 766 0z`,
            femalePathData = `M690 1286 l0 -214 -32 -6 c-79 -16 -88 -19 -88 -27 0 -5 -6 -9 -14
        -9 -28 0 -112 -56 -163 -107 -51 -52 -100 -141 -122 -219 -24 -90 -10 -213 35
        -311 34 -72 115 -166 156 -179 10 -3 18 -10 18 -15 0 -5 7 -9 15 -9 8 0 15 -4
        15 -10 0 -5 9 -10 20 -10 11 0 20 -4 20 -9 0 -20 169 -42 238 -31 101 17 122
        22 122 31 0 5 7 9 16 9 21 0 101 55 146 102 44 44 88 111 88 133 0 8 3 15 8
        15 26 0 42 217 21 295 -33 126 -137 252 -250 303 -74 33 -128 52 -152 52 -15
        0 -17 20 -17 215 l0 215 -40 0 -40 0 0 -214z m172 -314 c7 -7 20 -12 30 -12
        10 0 18 -4 18 -10 0 -5 5 -10 10 -10 30 0 98 -62 141 -127 59 -91 78 -178 60
        -284 -14 -86 -43 -140 -111 -209 -55 -55 -69 -65 -145 -95 -57 -23 -209 -23
        -272 1 -90 33 -174 108 -220 197 -26 48 -28 61 -28 172 0 86 4 129 15 153 8
        17 18 32 22 32 5 0 8 5 8 11 0 31 119 149 151 149 5 0 9 5 9 10 0 6 8 10 18
        10 10 0 22 4 28 9 15 15 54 19 156 17 61 -1 102 -6 110 -14z`,
            unspecifiedPathData = `M770 1323 l0 -176 -260 -260 c-219 -219 -260 -264 -260 -288 0 -25
        41 -70 265 -294 221 -220 270 -265 294 -265 23 0 72 45 294 267 219 218 267
        271 267 293 0 23 -47 75 -260 287 l-260 260 0 177 0 176 -40 0 -40 0 0 -177z
        m274 -478 c136 -136 226 -233 226 -244 0 -27 -436 -461 -463 -461 -30 0 -457
        427 -457 456 0 15 49 70 151 170 83 82 161 160 173 173 11 13 32 34 45 45 13
        12 38 36 54 54 17 17 33 32 37 32 4 0 109 -101 234 -225`,
            abortionPathData = `M770 1295 l0 -204 -39 -55 c-21 -31 -44 -69 -51 -86 -7 -16 -16 -30
        -21 -30 -5 0 -9 -7 -9 -15 0 -8 -4 -15 -10 -15 -5 0 -10 -4 -10 -10 0 -5 -20
        -41 -45 -80 -25 -39 -45 -75 -45 -80 0 -6 -4 -10 -10 -10 -5 0 -10 -5 -10 -11
        0 -6 -20 -42 -45 -80 -25 -38 -45 -74 -45 -79 0 -6 -4 -10 -9 -10 -5 0 -13
        -10 -17 -22 -4 -12 -31 -60 -60 -106 -30 -45 -54 -87 -54 -92 0 -6 -4 -10 -10
        -10 -17 0 -11 -46 12 -89 l22 -41 497 0 497 0 21 45 c12 25 21 49 21 55 0 10
        -21 51 -30 60 -11 10 -130 212 -130 220 0 5 -3 10 -8 12 -9 4 -82 126 -82 139
        0 5 -4 9 -10 9 -5 0 -10 6 -10 14 0 8 -3 16 -8 18 -9 4 -82 126 -82 139 0 5
        -4 9 -8 9 -5 0 -30 39 -57 88 -27 48 -55 93 -62 100 -10 10 -13 62 -13 218 l0
        204 -40 0 -40 0 0 -205z m73 -330 c12 -22 25 -41 30 -43 4 -2 7 -8 7 -13 0 -6
        5 -15 10 -22 9 -11 49 -74 91 -147 8 -14 17 -27 20 -30 4 -3 16 -24 27 -46 12
        -23 27 -48 35 -55 7 -8 21 -32 31 -54 11 -22 22 -42 25 -45 3 -3 12 -16 20
        -30 33 -56 81 -136 88 -146 35 -46 41 -79 17 -88 -9 -3 -209 -6 -445 -6 -381
        0 -430 2 -436 16 -5 14 9 53 30 79 7 9 42 66 88 145 8 13 20 30 27 38 6 7 12
        18 12 23 0 6 18 37 40 69 22 32 40 63 40 69 0 5 6 16 13 23 6 8 18 25 26 38
        53 90 82 137 91 147 5 7 10 17 10 23 0 5 5 10 10 10 6 0 10 4 10 9 0 18 42 82
        52 79 5 -2 19 -21 31 -43z`,
            dztwinPathData = `M987 1503 c-4 -3 -7 -78 -7 -166 0 -152 -1 -160 -22 -178 -13 -10
        -29 -18 -35 -19 -7 0 -13 -3 -13 -8 0 -4 -36 -30 -80 -57 -44 -27 -80 -53 -80
        -57 0 -5 -5 -8 -10 -8 -12 0 -94 -52 -98 -62 -2 -5 -10 -8 -18 -8 -8 0 -14 -4
        -14 -8 0 -5 -12 -15 -27 -23 -16 -8 -49 -29 -74 -46 l-46 -33 -159 0 c-141 0
        -162 -3 -184 -20 l-25 -19 -3 -323 c-4 -373 -2 -400 34 -417 17 -7 131 -11
        363 -11 326 0 338 1 359 20 22 21 22 23 22 373 0 194 -4 357 -8 363 -17 26
        -56 34 -161 34 -67 0 -111 4 -111 10 0 6 7 10 15 10 8 0 15 4 15 8 0 5 18 17
        40 27 22 10 40 22 40 27 0 4 5 8 10 8 6 0 19 8 30 18 10 9 36 26 57 37 35 18
        56 33 87 60 6 6 28 19 49 30 21 11 47 28 57 38 11 9 22 17 25 17 3 0 59 -35
        123 -77 64 -43 121 -80 127 -82 5 -2 18 -12 29 -23 11 -10 24 -18 28 -18 5 0
        18 -8 29 -19 11 -10 37 -27 59 -37 22 -10 40 -22 40 -26 0 -5 -52 -8 -116 -8
        -101 0 -120 -3 -145 -21 l-29 -20 0 -350 c0 -344 0 -349 22 -374 l22 -25 345
        0 c293 1 349 3 366 16 19 14 20 28 23 369 l3 355 -27 25 c-26 24 -31 25 -181
        25 -131 0 -159 3 -181 18 -46 29 -66 42 -82 49 -8 4 -24 15 -34 25 -11 10 -25
        18 -32 18 -7 0 -14 4 -16 8 -1 5 -48 37 -103 72 -55 36 -102 67 -105 70 -13
        14 -70 50 -80 50 -5 0 -10 4 -10 9 0 5 -9 13 -20 16 -19 6 -20 15 -20 176 l0
        169 -28 0 c-16 0 -32 -3 -35 -7z m-187 -1062 c0 -282 -2 -320 -16 -325 -20 -8
        -588 -8 -608 0 -14 5 -16 43 -16 318 0 172 3 316 7 319 3 4 147 7 320 7 l313
        0 0 -319z m1068 307 c9 -9 12 -93 12 -315 0 -289 -1 -303 -19 -313 -21 -11
        -587 -15 -615 -4 -14 5 -16 43 -16 318 0 172 3 316 7 319 3 4 144 7 313 7 225
        0 309 -3 318 -12z`,
            mztwinPathData = `M1027 1503 c-4 -3 -7 -78 -7 -166 0 -152 -1 -160 -22 -178 -13 -10
        -29 -18 -35 -19 -7 0 -13 -3 -13 -8 0 -4 -36 -30 -80 -57 -44 -27 -80 -53 -80
        -57 0 -5 -5 -8 -10 -8 -12 0 -94 -52 -98 -62 -2 -5 -10 -8 -18 -8 -8 0 -14 -4
        -14 -8 0 -5 -12 -15 -27 -23 -16 -8 -49 -29 -74 -46 l-46 -33 -159 0 c-141 0
        -162 -3 -184 -20 l-25 -19 -3 -323 c-4 -373 -2 -400 34 -417 17 -7 131 -11
        363 -11 326 0 338 1 359 20 22 21 22 23 22 373 0 194 -4 357 -8 363 -17 26
        -56 34 -161 34 -67 0 -111 4 -111 10 0 6 7 10 15 10 8 0 15 4 15 8 0 5 18 17
        40 27 22 10 40 22 40 27 0 4 7 8 15 8 8 0 15 4 15 8 0 5 15 17 33 26 28 15 60
        17 267 14 228 -3 236 -4 260 -25 13 -13 28 -23 32 -23 5 0 18 -8 29 -19 11
        -10 37 -27 59 -37 22 -10 40 -22 40 -26 0 -5 -52 -8 -116 -8 -101 0 -120 -3
        -145 -21 l-29 -20 0 -350 0 -350 25 -24 24 -25 343 0 c290 1 346 3 363 16 19
        14 20 28 23 369 l3 355 -27 25 c-26 24 -31 25 -181 25 -131 0 -159 3 -181 18
        -46 29 -66 42 -82 49 -8 4 -24 15 -34 25 -11 10 -25 18 -32 18 -7 0 -14 4 -16
        8 -1 5 -48 37 -103 72 -55 36 -102 67 -105 70 -13 14 -70 50 -80 50 -5 0 -10
        4 -10 9 0 5 -9 13 -20 16 -19 6 -20 15 -20 176 l0 169 -28 0 c-16 0 -32 -3
        -35 -7z m92 -420 c34 -21 61 -41 61 -45 0 -5 -57 -8 -126 -8 -139 0 -140 1
        -46 55 17 11 32 23 32 27 0 15 19 8 79 -29z m-279 -642 c0 -282 -2 -320 -16
        -325 -20 -8 -588 -8 -608 0 -14 5 -16 43 -16 318 0 172 3 316 7 319 3 4 147 7
        320 7 l313 0 0 -319z m1068 307 c9 -9 12 -93 12 -315 0 -289 -1 -303 -19 -313
        -21 -11 -587 -15 -615 -4 -14 5 -16 43 -16 318 0 172 3 316 7 319 3 4 144 7
        313 7 225 0 309 -3 318 -12z`;

        // popup gender selection box
        var font_size = parseInt($("body").css('font-size'));
        var popup_selection = d3.select('.diagram');
        popup_selection.append("rect").attr("class", "popup_selection")
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("transform", "translate(-1000,-100)")
            .style("opacity", 0)
            .attr("width", 186)
            .attr("height", 36.4)
            .style("stroke", "darkgrey")
            .attr("fill", "white");

        /*male section*/
        var square = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        square.append('rect')
            .attr('x', 6)
            .attr('y', 2)
            .attr('width', 18)
            .attr('height', 25)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'persontype fa-square');
        square.append('g')
            .attr('transform', 'translate(30.200000,32.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', malePathData);
        var square_title = square.append("svg:title").text("add male");

        /*female section*/
        var circle = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        circle.append('rect')
            .attr('x', 28)
            .attr('y', 2)
            .attr('width', 18)
            .attr('height', 25)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'persontype fa-circle');
        circle.append('g')
            .attr('transform', 'translate(52.800000,32.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', femalePathData);
        var circle_title = circle.append("svg:title").text("add female");

        /*unspecified section*/
        var unspecified = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        unspecified.append('rect')
            .attr('x', 50)
            .attr('y', 2)
            .attr('width', 18)
            .attr('height', 28)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'persontype fa-unspecified');
        unspecified.append('g')
            .attr('transform', 'translate(76.800000,32.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', unspecifiedPathData);
        var unspecified_title = unspecified.append("svg:title").text("add unspecified");

        /*abortion section*/
        var abortion = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        abortion.append('rect')
            .attr('x', 73)
            .attr('y', 2)
            .attr('width', 22)
            .attr('height', 28)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'persontype fa-abortion');
        abortion.append('g')
            .attr('transform', 'translate(98.800000,32.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', abortionPathData);
        var abortion_title = abortion.append("svg:title").text("add abortion");

        /*dztwin section*/
        var dztwin = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        dztwin.append('rect')
            .attr('x', 96)
            .attr('y', 2)
            .attr('width', 40)
            .attr('height', 28)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'persontype fa-angle-up dztwin');
        dztwin.append('g')
            .attr('transform', 'translate(134.800000,30.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', dztwinPathData);
        var dztwin_title = dztwin.append("svg:title").text("add dizygotic/fraternal twins");

        var mztwin = popup_selection.append("g")
            .style("opacity", 0)
            .attr("class", "popup_selection");
        mztwin.append('rect')
            .attr('x', 140)
            .attr('y', 2)
            .attr('width', 40)
            .attr('height', 28)
            .attr('stroke-width', 2)
            .attr('fill', 'transparent')
            .attr('class', 'fa-caret-up persontype mztwin');
        mztwin.append('g')
            .attr('transform', 'translate(179.800000,30.200000) scale(0.0200000,0.0200000)')
            .style('fill', 'black')
            .style('stroke', 'none')
            .append('g')
            .attr('transform', 'rotate(180)')
            .append('path')
            .attr('d', mztwinPathData);
        var mztwin_title = mztwin.append("svg:title").text("add monozygotic/identical twins");

        var add_person = {};
        // click the person type selection
        d3.selectAll(".persontype")
            .on("click", function () {
                var newdataset = ptree.copy_dataset(opts.dataset);
                var mztwin = d3.select(this).classed("mztwin");
                var dztwin = d3.select(this).classed("dztwin");
                var abortion = d3.select(this).classed("fa-abortion");
                var twin_type;
                var sex;
                if (mztwin || dztwin) {
                    sex = add_person.node.datum().data.sex;
                    twin_type = (mztwin ? "mztwin" : "dztwin");
                } else {
                    sex = d3.select(this).classed("fa-square") ? 'M' : (d3.select(this).classed("fa-circle") ? 'F' : 'U');
                }

                if (add_person.type === 'addsibling')
                    ptree.addsibling(newdataset, add_person.node.datum().data, sex, false, twin_type, abortion);
                else if (add_person.type === 'addchild')
                    ptree.addchild(newdataset, add_person.node.datum().data, (twin_type ? 'U' : sex), (twin_type ? 2 : 1), twin_type, abortion);
                else
                    return;
                opts.dataset = newdataset;
                ptree.rebuild(opts);
                d3.selectAll('.popup_selection').style("opacity", 0);
                add_person = {};
            })
            .on("mouseover", function () {
                if (add_person.node)
                    add_person.node.select('rect').style("opacity", 0.2);
                d3.selectAll('.popup_selection').style("opacity", 1);
                // add tooltips to font awesome widgets
                if (add_person.type === 'addsibling') {
                    if (d3.select(this).classed("fa-square"))
                        square_title.text("add brother");
                    else
                        circle_title.text("add sister");
                } else if (add_person.type === 'addchild') {
                    if (d3.select(this).classed("fa-square"))
                        square_title.text("add son");
                    else
                        circle_title.text("add daughter");
                }
            });

        // handle mouse out of popup selection
        d3.selectAll(".popup_selection").on("mouseout", function () {
            // hide rect and popup selection
            if (add_person.node !== undefined && highlight.indexOf(add_person.node.datum()) == -1)
                add_person.node.select('rect').style("opacity", 0);
            d3.selectAll('.popup_selection').style("opacity", 0);
        });


        // drag line between nodes to create partners
        drag_handle(opts);

        // rectangle used to highlight on mouse over
        node.append("rect")
            .filter(function (d) {
                return d.data.hidden && !opts.DEBUG ? false : true;
            })
            .attr("class", 'indi_rect')
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("x", function (d) {
                return -0.75 * opts.symbol_size;
            })
            .attr("y", function (d) {
                return -opts.symbol_size;
            })
            .attr("width", (1.5 * opts.symbol_size) + 'px')
            .attr("height", (2 * opts.symbol_size) + 'px')
            .style("stroke", "black")
            .style("stroke-width", 0.7)
            .style("opacity", 0)
            .attr("fill", "lightgrey");

        // widgets
        var fx = function (d) {
            return off - 0.75 * opts.symbol_size;
        };
        var fy = opts.symbol_size - 2;
        var off = 0;
        var widgets = {
            'addchild': {'text': '\uf063', 'title': 'add child', 'fx': fx, 'fy': fy},
            'addsibling': {'text': '\uf234', 'title': 'add sibling', 'fx': fx, 'fy': fy},
            'addpartner': {'text': '\uf0c1', 'title': 'add partner', 'fx': fx, 'fy': fy},
            'addparents': {
                'text': '\uf062', 'title': 'add parents',
                'fx': -0.75 * opts.symbol_size,
                'fy': -opts.symbol_size + 11
            },
            'delete': {
                'text': 'X', 'title': 'delete',
                'fx': opts.symbol_size / 2 - 1,
                'fy': -opts.symbol_size + 12,
                'styles': {"font-weight": "bold", "fill": "darkred", "font-family": "monospace"}
            }
        };

        for (var key in widgets) {
            var widget = node.append("text")
                .filter(function (d) {
                    return (d.data.hidden && !opts.DEBUG ? false : true) &&
                        !((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
                        !(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
                        !(d.data.parent_node === undefined && key === 'addchild') &&
                        !((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
                })
                .attr("class", key)
                .style("opacity", 0)
                .attr('font-family', 'FontAwesome')
                .attr("xx", function (d) {
                    return d.x;
                })
                .attr("yy", function (d) {
                    return d.y;
                })
                .attr("x", widgets[key].fx)
                .attr("y", widgets[key].fy)
                .attr('font-size', '0.9em')
                .text(widgets[key].text);

            if ('styles' in widgets[key])
                for (var style in widgets[key].styles) {
                    widget.attr(style, widgets[key].styles[style]);
                }

            widget.append("svg:title").text(widgets[key].title);
            off += 17;
        }

        // add sibling or child
        d3.selectAll(".addsibling, .addchild")
            .on("mouseover", function () {
                var type = d3.select(this).attr('class');
                d3.selectAll('.popup_selection').style("opacity", 1);
                add_person = {'node': d3.select(this.parentNode), 'type': type};

                //var translate = getTranslation(d3.select('.diagram').attr("transform"));
                var x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x"));
                var y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y"));
                d3.selectAll('.popup_selection').attr("transform", "translate(" + x + "," + (y + 4) + ")");
                d3.selectAll('.popup_selection_rotate45')
                    .attr("transform", "translate(" + (x + 3 * font_size) + "," + (y + (font_size * 1.2)) + ") rotate(45)");
            });

        // handle widget clicks
        d3.selectAll(".addchild, .addpartner, .addparents, .delete, .settings")
            .on("click", function () {
                d3.event.stopPropagation();
                var opt = d3.select(this).attr('class');
                var d = d3.select(this.parentNode).datum();
                if (opts.DEBUG) {
                    console.log(opt);
                }

                var newdataset;
                if (opt === 'settings') {
                    if (typeof opts.edit === 'function') {
                        opts.edit(opts, d);
                    }
                } else if (opt === 'delete') {
                    newdataset = ptree.copy_dataset(opts.dataset);

                    function onDone(opts, dataset) {
                        // assign new dataset and rebuild pedigree
                        opts.dataset = dataset;
                        ptree.rebuild(opts);
                    }

                    ptree.delete_node_dataset(newdataset, d.data, opts, onDone);
                } else if (opt === 'addparents') {
                    newdataset = ptree.copy_dataset(opts.dataset);
                    opts.dataset = newdataset;
                    ptree.addparents(opts, newdataset, d.data.name);
                    ptree.rebuild(opts);
                } else if (opt === 'addpartner') {
                    newdataset = ptree.copy_dataset(opts.dataset);
                    ptree.addpartner(opts, newdataset, d.data.name);
                    opts.dataset = newdataset;
                    ptree.rebuild(opts);
                }
                // trigger fhChange event
                $(document).trigger('fhChange', [opts]);
            });

        // other mouse events
        var highlight = [];

        node.filter(function (d) {
            return !d.data.hidden;
        })
            .on("click", function (d) {
                if (d3.event.ctrlKey) {
                    if (highlight.indexOf(d) == -1)
                        highlight.push(d);
                    else
                        highlight.splice(highlight.indexOf(d), 1);
                } else
                    highlight = [d];

                if ('nodeclick' in opts) {
                    opts.nodeclick(d.data);
                    d3.selectAll(".indi_rect").style("opacity", 0);
                    d3.selectAll('.indi_rect').filter(function (d) {
                        return highlight.indexOf(d) != -1;
                    }).style("opacity", 0.5);
                }
                let e = d3.event;
                openTabbedDialog(opts, d, e);
            })
            .on("mouseover", function (d) {
                d3.event.stopPropagation();
                last_mouseover = d;
                if (dragging) {
                    if (dragging.data.name !== last_mouseover.data.name &&
                        dragging.data.sex !== last_mouseover.data.sex) {
                        d3.select(this).select('rect').style("opacity", 0.2);
                    }
                    return;
                }
                d3.select(this).select('rect').style("opacity", 0.2);
                d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 1);
                d3.select(this).selectAll('.indi_details').style("opacity", 0);
                setLineDragPosition(opts.symbol_size - 10, 0, opts.symbol_size - 2, 0, d.x + "," + (d.y + 2));
            })
            .on("mouseout", function (d) {
                if (dragging)
                    return;

                d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
                if (highlight.indexOf(d) == -1)
                    d3.select(this).select('rect').style("opacity", 0);
                d3.select(this).selectAll('.indi_details').style("opacity", 1);
                // hide popup if it looks like the mouse is moving north
                if (d3.mouse(this)[1] < 0.8 * opts.symbol_size)
                    d3.selectAll('.popup_selection').style("opacity", 0);
                if (!dragging) {
                    // hide popup if it looks like the mouse is moving north, south or west
                    if (Math.abs(d3.mouse(this)[1]) > 0.25 * opts.symbol_size ||
                        Math.abs(d3.mouse(this)[1]) < -0.25 * opts.symbol_size ||
                        d3.mouse(this)[0] < 0.2 * opts.symbol_size) {
                        setLineDragPosition(0, 0, 0, 0);
                    }
                }
            });
    };

    // drag line between nodes to create partners
    function drag_handle(opts) {
        var line_drag_selection = d3.select('.diagram');
        line_drag_selection.append("line").attr("class", 'line_drag_selection')
            .attr("stroke-width", 6)
            .style("stroke-dasharray", ("2, 1"))
            .attr("stroke", "black")
            .call(d3.drag()
                .on("start", dragstart)
                .on("drag", drag)
                .on("end", dragstop));
        setLineDragPosition(0, 0, 0, 0);

        function dragstart(d) {
            d3.event.sourceEvent.stopPropagation();
            dragging = last_mouseover;
            d3.selectAll('.line_drag_selection')
                .attr("stroke", "darkred");
        }

        function dragstop(d) {
            if (last_mouseover &&
                dragging.data.name !== last_mouseover.data.name &&
                dragging.data.sex !== last_mouseover.data.sex) {
                // make partners
                var child = {
                    "name": ptree.makeid(4), "sex": 'U',
                    "mother": (dragging.data.sex === 'F' ? dragging.data.name : last_mouseover.data.name),
                    "father": (dragging.data.sex === 'F' ? last_mouseover.data.name : dragging.data.name)
                };
                newdataset = ptree.copy_dataset(opts.dataset);
                opts.dataset = newdataset;

                var idx = pedigree_util.getIdxByName(opts.dataset, dragging.data.name) + 1;
                opts.dataset.splice(idx, 0, child);
                ptree.rebuild(opts);
            }
            setLineDragPosition(0, 0, 0, 0);
            d3.selectAll('.line_drag_selection')
                .attr("stroke", "black");
            dragging = undefined;
            return;
        }

        function drag(d) {
            d3.event.sourceEvent.stopPropagation();
            var dx = d3.event.dx;
            var xnew = parseFloat(d3.select(this).attr('x2')) + dx;
            setLineDragPosition(opts.symbol_size - 10, 0, xnew, 0);
        }
    }

    function setLineDragPosition(x1, y1, x2, y2, translate) {
        if (translate)
            d3.selectAll('.line_drag_selection').attr("transform", "translate(" + translate + ")");
        d3.selectAll('.line_drag_selection')
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2);
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // if opt.edit is set true (rather than given a function) this is called to edit node attributes
    widgets.openNodeLinkDialog = function (opts, d, e) {
        let currentNode_tabs = $('#node_link');
        if (currentNode_tabs.length > 0) {
            currentNode_tabs.remove();
        }
        let $targetDiv = $('#' + opts.targetDiv);
        $targetDiv.append('<div id="node_link"></div>');
        let $node_link = $('#node_link');
        let dialogWidth = ($(window).width() > 400 ? 450 : $(window).width() - 30)
        ;
        $node_link.dialog({
            autoOpen: false,
            appendTo: '#pedigrees',
            width: dialogWidth
        });
        let motherName = d.source.data.mother.name;
        let fatherName = d.source.data.father.name;
        let consanguity = d.source.data.mother.consanguity;
        let divorced = d.source.data.mother.divorced && d.source.data.mother.divorced === d.source.data.father.name;
        let table = `<table class="table">
        <tr><td colspan="3"><strong>Consanguinity of this Relationship?</strong></td></tr>
             <tr>
             <td colspan="1">
           <label class="radio-inline"><input type="radio" name="consanguity" value="auto" ${(!consanguity || consanguity === 'auto') ? 'checked' : ''}>Automatic</label><br /><br />
           <label class="checkbox-inline" style="margin-left: 8px"><input type="checkbox" name="separated" ${divorced ? 'checked' : ''} value="separated">Separated</label>
        </td>
         <td colspan="1">
         <label class="radio-inline"><input type="radio" name="consanguity" value="yes" ${consanguity && consanguity === 'yes' ? 'checked' : ''} >Yes</label>
         </td>
         <td colspan="1">
         <label class="radio-inline"><input type="radio" name="consanguity" value="no" ${consanguity && consanguity === 'no' ? 'checked' : ''} >No</label>
         </td>
        </tr>
             </table>`;
        let x = e.pageX + 30;
        let y = e.pageY - 20;
        if (x + dialogWidth > $targetDiv.width()) {
            panZoom.translateX(opts, -(x + dialogWidth - $targetDiv.width()))
            x = x - (x + dialogWidth - $targetDiv.width());
        }
        $node_link.html(table);
        $node_link.dialog('option', 'position', {my: "left top", at: "left+" + x + " top+" + y + "", of: window});
        $node_link.dialog('open');
        opts.dataset = ptree.copy_dataset(pedcache.current(opts));
        $("#node_link input:radio").on('change', function () {
            let consanguity = $('input[name=consanguity]:checked').val();
            if (consanguity === 'yes') {
                $.each(opts.dataset, function (index, value) {
                    if (value.name === motherName) {
                        opts.dataset[index].consanguity = 'yes';
                    }
                    if (value.name === fatherName) {
                        opts.dataset[index].consanguity = 'yes';
                    }
                });
            } else if (consanguity === 'no') {
                $.each(opts.dataset, function (index, value) {
                    if (value.name === motherName) {
                        opts.dataset[index].consanguity = 'no';
                    }
                    if (value.name === fatherName) {
                        opts.dataset[index].consanguity = 'no';
                    }
                });
            } else {
                $.each(opts.dataset, function (index, value) {
                    if (value.name === motherName) {
                        delete opts.dataset[index].consanguity;
                    }
                    if (value.name === fatherName) {
                        delete opts.dataset[index].consanguity;
                    }
                });
            }
            ptree.rebuild(opts);

        });

        $("#node_link input:checkbox").change(function () {
            if ($(this).is(':checked')) {
                $.each(opts.dataset, function (index, value) {
                    if (value.name === motherName) {
                        opts.dataset[index].divorced = fatherName
                    }
                    if (value.name === fatherName) {
                        opts.dataset[index].divorced = motherName
                    }
                });
            } else {
                $.each(opts.dataset, function (index, value) {
                    if (value.name === motherName) {
                        delete opts.dataset[index].divorced;
                    }
                    if (value.name === fatherName) {
                        delete opts.dataset[index].divorced;
                    }
                });
            }
            ptree.rebuild(opts);

        });
    };

    // remove any dialog currently sh0wing
    widgets.removeDialogs = function () {
        dialog = $('#node_tabs');
        if (dialog.length > 0) {
            dialog.remove();
        }
    };

    // if opt.edit is set true (rather than given a function) this is called to edit node attributes
    function openTabbedDialog(opts, d, e) {
        let currentNode_tabs = $('#node_tabs');
        if (currentNode_tabs.length > 0) {
            currentNode_tabs.remove();
        }
        let $targetDiv = $('#' + opts.targetDiv);
        $targetDiv.append('<div id="node_tabs"></div>');
        let $node_tabs = $('#node_tabs');
        let dialogWidth = ($(window).width() > 400 ? 450 : $(window).width() - 30);
        $node_tabs.dialog({
            autoOpen: false,
            appendTo: '#pedigrees',
            width: dialogWidth
        });
        //add tabs
        let name = d.data.full_name ? d.data.full_name : "";
        let isChildNode = pedigree_util.isChildNode(opts, d.data.name)
        let tabHeader = `
        <div id="nodeTabs" style="border: 0; max-height:calc(100vh - 50px); overflow-y: auto;">
            <ol>
                <li><a href="#personal"><span>Personal</span></a></li>
                <li><a href="#clinical" id="clinicalTab"><span>Clinical</span></a></li>
                <li><a href="#riskFactors"><span>Risk Factors</span></a></li>
                <li class="ui-tabs-close-button" style="float: right; margin-top: 20px;">
                    <button id="closeBtn" type="button"
                            class="ui-button ui-corner-all ui-widget ui-button-icon-only ui-dialog-titlebar-close"
                            title="Close"><span class="ui-button-icon ui-icon ui-icon-closethick"></span><span
                            class="ui-button-icon-space"> </span>Close
                    </button>
                </li>
            </ol>
        
            <div id="personal">
                <input type='hidden' id='id_name' name='name'/>
        
                <div><strong>Link to an existing patient record</strong></div>
                <table class="table">
                    <tr>
                        <td colspan="3">
                            <input class="form-control" type="text" placeholder="Type patient name or identifier"
                                   style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                        </td>
                        <td colspan="3">
                            <span style=" text-align: center; margin-right: 8px">Or</span>
                            <button class="ui-button" style="border-radius: 4px">Create New</button>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="1" style="text-align: left;"><strong>Gender:</strong></td>
                        <td colspan="2"><label class="radio-inline"><input type="radio" name="sex" value="M" ${d.data.sex === 'M' ? "checked" : "" } ${!isChildNode? "disabled" :"" }>Male</label></td>
                        <td colspan="2"><label class="radio-inline"><input type="radio" name="sex" value="F" ${d.data.sex === 'F' ? "checked" : "" } ${!isChildNode? "disabled" : "" }>Female</label></td>
                        <td colspan="2"><label class="radio-inline"><input type="radio" name="sex" value="U" ${d.data.sex === 'U' ? "checked" : "" } ${!isChildNode? "disabled" : "" }>Unknown</label></td>
                    </tr>
                    <tr>
                        <td colspan="3"><strong>Name</strong>
                            <input class="form-control" id="id__name" type="text" style=" font-size: 12px; padding: 4px; border-radius: 4px" value="${name}"/>
                        </td>
                        <td colspan="3"><strong>Identifier</strong><input id="id_uniqueId" class="form-control" type="text" value="${d.data.uniqueId ? d.data.uniqueId : ""}"
                                                                          style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="1" style="text-align: left;"><strong>Status:</strong></td>
                        <td colspan="2"><label class="radio-inline" style="padding-left: 15px;"><input type="radio" value="0"
                        ${d.data.status === 0 ? "checked" : "" }
                                                                                                       name="status">Alive</label>
                        </td>
                        <td colspan="2"><label class="radio-inline" style="padding-left: 15px;"><input type="radio" value="1"
                         ${d.data.status === 1 ? "checked" : "" }
                                                                                                       name="status">Deceased</label>
                        </td>
                        <td colspan="2"><label class="radio-inline" style="padding-left: 15px;"><input  type="radio" value="2"
                         ${d.data.status === 2 ? "checked" : "" }
                                                                                                       name="status">A&W</label>
                        </td>
                    </tr>
                    <tr>
                    <td colspan="7" style="border-top: 0px">
                    <div class="checkbox">
                                <label class="radio-inline"><input type="radio" name="status" value="3" ${d.data.status === 3 ? "checked" : "" } >Unborn</label>
                                <label class="radio-inline"><input type="radio" name="status" value="4" ${d.data.status === 4 ? "checked" : "" } >Miscarriage</label>
                                <label class="radio-inline"><input type="radio" name="status" value="5" ${d.data.status === 5 ? "checked" : "" }>Stillbirth</label> <br />
                                <label class="radio-inline"><input type="radio" name="status" value="6" ${d.data.status === 6 ? "checked" : "" }>Termination</label>
                                <label id="gestation_container"  class="radio-inline"><span>Gestation age: </span><input id="gestation" value="${d.data.gestation ? d.data.gestation: ''}" class="form-control" type="number" style=" display: inline-block;width:70px;"  /><span></span>  weeks</label>
                         </div>
</td>
                        </tr>
        
                    <tr>
                        <td colspan="3">
                            <strong>Age</strong> <br/>
                            <input id="id__age" class="form-control" type="text" style=" font-size: 12px; padding: 4px; border-radius: 4px" value='${d.data.age ? d.data.age : ""}'/>
                            <br/>
                            <strong>Died at age</strong> <br/>
                            <input id="id__dage" class="form-control" type="text" style=" font-size: 12px; padding: 4px; border-radius: 4px"  value='${d.data.dage ? d.data.dage : ""}'/>
                        </td>
                        <td colspan="3">
                            <strong>Date of birth</strong> <br/>
                            <input id="dob" class="form-control" type="text" style=" font-size: 12px; padding: 4px; border-radius: 4px" value='${d.data.dob ? d.data.dob : ""}'/>
                            <br/>
                            <strong>Cause of death</strong> <br/>
                            <input id="cause_of_death" class="form-control" type="text" style=" font-size: 12px; padding: 4px; border-radius: 4px" value='${d.data.cause_of_death ? d.data.cause_of_death : ""}'/>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <strong>Ethnicity</strong> <br/>
                            <input class="form-control magicsearch" id="ethnicity"/>
                        </td>
                        <td colspan="3">
                            <strong>Country of origin</strong> <br/>
                            <input id="country_of_origin" class="form-control magicsearch"  value='${d.data.country_of_origin ? d.data.country_of_origin : ""}'/>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="7" style="text-align: left;">
                            <strong>Reproduction details</strong>
                            <div class="checkbox">
                                <label><input type="checkbox" value="" ${d.data['adopted_in'] ? "checked" : ""} id="id_adopted_in">Adopted in</label>
                                <label><input type="checkbox" value="" ${d.data['adopted_out'] ? "checked" : ""} id="id_adopted_out">Adopted out</label>
                            </div>
                            <div class="checkbox">
                                <label class="radio-inline"><input type="radio" name="individual_role"  value="IVF" ${d.data['individual_role'] === 'IVF' ? "checked" : ""} id="IVF"> Conceived by IVF</label>
                                <label class="radio-inline"><input type="radio" name="individual_role" value="ICSI" ${d.data['individual_role'] === 'ICSI'? "checked" : ""} id="id_ivf_icsi"> IVF + ICSI </label>
                            </div>
                            <div class="checkbox">
                                <label><input type="checkbox" value="" ${d.data['consanguineous_parents'] ? "checked" : ""} id="id_consanguineous_parents">Consanguineous parents</label>
                            </div>
                             <div class="checkbox">
                             <span>Conceived by Donor:</span>
                                <label><input type="checkbox" value="egg" ${d.data['conceived_by_donor_egg'] ? "checked" : ""} id="id_conceived_by_donor_egg">Egg</label>
                                <label><input type="checkbox" value="sperm" ${d.data['conceived_by_donor_sperm'] ? "checked" : ""} id="id_conceived_by_donor_sperm">Sperm </label>
                            </div>
                            <div class="checkbox">
                                <span>Individual is:</span>
                                <label><input  name="individual_role" ${d.data['individual_role']==='Donor' ? "checked" : ""}  type="radio" value="Donor"> Donor</label>
                                <label><input name="individual_role" ${d.data['individual_role']==='SRG' ? "checked" : ""}  type="radio" value="SRG"> Surrogate</label>
                                <label><input name="individual_role" ${d.data['individual_role']==='none'|| !d.data['individual_role'] ? "checked" : ""} type="radio" value="none"> None</label>
                            </div>
                        </td>
        
                    </tr>
                    <tr>
                        <td colspan="7"><strong>Heredity option </strong></td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <select id="heredity" class="form-control" style=" font-size: 12px; padding: 4px; border-radius: 4px">
                                <option ${d.data.heredity === 'None' ? 'selected=selected' : ""} >None</option>
                                <option ${d.data.heredity === 'Childless' ? 'selected=selected' : ""} >Childless</option>
                                <option ${d.data.heredity === 'Infertile' ? 'selected=selected' : ""} >Infertile</option>
                            </select>
                        </td>
                        <td colspan="4">
                            <input class="form-control" type="text" placeholder="Reason"
                                   style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="7" style="text-align: left;"><span><strong>Market by:</strong><input id="reason" type="text"
                                                                class="form-control" value="${d.data.market_by_text? d.data.market_by_text:''}"
                                                                                                          placeholder="Reason"
                                                                                                          style=" font-size: 12px; padding: 4px; border-radius: 4px"/></span>
                            <div class="checkbox">
                                <label><input ${d.data.market_by_tick === 'market_na'?"checked":""} id="market_na" type="checkbox" value="NA">N/A</label>
                                <label><input  ${d.data.market_by_tick === 'market_p'?"checked":""} id="market_p" type="checkbox" value="+">+</label>
                                <label><input  ${d.data.market_by_tick === 'market_m'?"checked":""} id="market_m" type="checkbox" value="-">-</label>
                                <label><input  ${d.data.market_by_tick === 'market_s'?"checked":""} id="market_s" type="checkbox" value="*">*</label>
                                <label><input  ${d.data.market_by_tick === 'market_st'?"checked":""} id="market_st" type="checkbox" value="sample_taken">Sample taken</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="7" style="text-align: left;">
                            <div class="checkbox">
                                <label><input type="checkbox" value="" ${d.data['proband'] ? "checked" : ""} id="id_proband"/>Proband</label>
                            </div>
                        </td>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="7"><strong>Comments </strong><br/>
                            <textarea class="form-control" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                        </td>
                    </tr>
        
                </table>
            </div>
        
            <div id="clinical">
                <table class="table">
                    <tr>
                        <td colspan="3">
                            <strong style="float: left;">Carrier status</strong><br/>
                            <div class="radio">
                                <label style="float: left;"><input value="na" type="radio" ${d.data.carrier_status === 'na'? 'checked': ''} name="carrier_status">Not affected</label>
                            </div></br>
                            <div class="radio">
                                <label style="float: left;"><input value="carrier" type="radio" ${d.data.carrier_status === 'carrier'? 'checked': ''} name="carrier_status">Carrier</label>
                            </div></br>
                            <div class="radio">
                                <label style="float: left;"><input value="uncertain" type="radio" ${d.data.carrier_status === 'uncertain'? 'checked': ''} name="carrier_status">Uncertain</label>
                            </div>
                        </td>
                        <td colspan="3">
                            <strong></strong><br/>
                            <div class="radio">
                                <label style="float: left;"><input value="affected" type="radio" ${d.data.carrier_status === 'affected'? 'checked': ''} name="carrier_status">Affected</label>
                            </div></br>
                            <div class="radio">
                                <label style="float: left;"><input value="asymptomatic" type="radio" ${d.data.carrier_status === 'asymptomatic'? 'checked': ''} name="carrier_status">Asymptomatic</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="6">
                            <div class="form-group" id="conditions-clinical-tab">
                                <label for="conditions" style="float: left;">Conditions</label>
                                <input type="text" class="form-control" placeholder="Search for condition" id="conditions" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="6">
                            <div class="form-group">
                                <label for="phenotypes" style="float: left;">Phenotypes, clinical symptoms</label>
                                <input type="text" class="form-control" placeholder="Search or type in" id="phenotypes" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                                <div id="phenotypeGapDiv" class="gapDiv"></div>
                                <ul id="phenotypeTypedText" tabindex="0" class="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front typedText" style="position: unset; width: 100%; display: none;"><li class="ui-menu-item">
                                <span id="phenotype-non-standard-text" style="width: 380px;" tabindex="-1" class="ui-menu-item-wrapper non-standard-text"></span><br/><strong>(your text, not a standard term)</strong></li></ul>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="6">
                            <div class="form-group">
                                <label for="candidateGenes" style="float: left;">Genotype: candidate genes</label>
                                <input type="text" class="form-control" placeholder="Search or type in" id="candidateGenes" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                                <div id="candidateGapDiv" class="gapDiv"></div>
                                <ul id="candidateTypedText" tabindex="0" class="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front typedText" style="position: unset; width: 100%; display: none;"><li class="ui-menu-item">
                                <span id="candidate-non-standard-text" style="width: 380px;" tabindex="-1" class="ui-menu-item-wrapper non-standard-text"></span><br/><strong>(your text, not a standard term)</strong></li></ul>
                            </div>
                            <div class="form-group">
                                <label for="causalGenes" style="float: left;">Genotype: confirmed causal genes</label>
                                <input type="text" class="form-control" placeholder="Search or type in" id="causalGenes" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                                <div id="causalGapDiv" class="gapDiv"></div>
                                <ul id="causalTypedText" tabindex="0" class="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front typedText" style="position: unset; width: 100%; display: none;"><li class="ui-menu-item">
                                <span id="causal-non-standard-text" style="width: 380px;" tabindex="-1" class="ui-menu-item-wrapper non-standard-text"></span><br/><strong>(your text, not a standard term)</strong></li></ul>
                            </div>
                            <div class="form-group">
                                <label for="carrierGenes" style="float: left;">Genotype: carrier genes</label>
                                <input type="text" class="form-control" placeholder="Search or type in" id="carrierGenes" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                                <div id="carrierGapDiv" class="gapDiv"></div>
                                <ul tabindex="0" id="carrierTypedText" class="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front typedText" style="position: unset; width: 100%; display: none;"><li class="ui-menu-item">
                                <span id="carrier-non-standard-text" style="width: 380px;" tabindex="-1" class="ui-menu-item-wrapper non-standard-text"></span><br/><strong>(your text, not a standard term)</strong></li></ul>
                            </div>
                            <div class="form-group">
                              <label for="commentClinical" style="float: left;">Comments</label>
                              <textarea class="form-control" rows="5" id="commentClinical">${d.data.clinical_comments?d.data.clinical_comments:''}</textarea>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div id="riskFactors" style="float:left; width: 100%;">
                <table class="table">
                    <tr>
                        <td colspan="7" style="text-align: left;" id="commonCancers">
                            <strong>Common Cancers</strong>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.breast_cancer?"checked":""} value="breast_cancer">Breast&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.breast_cancer_age?d.data.breast_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.ovarian_cancer?"checked":""} value="ovarian_cancer">Ovarian&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.ovarian_cancer_age?d.data.ovarian_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.colon_cancer?"checked":""} value="colon_cancer">Colon&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.colon_cancer_age?d.data.colon_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.prostate_cancer?"checked":""} value="prostate_cancer">Prostate&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.prostate_cancer_age?d.data.prostate_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.pancreatic_cancer?"checked":""} value="pancreatic_cancer">Pancreatic&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.pancreatic_cancer_age?d.data.pancreatic_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.melanoma_cancer?"checked":""} value="melanoma_cancer">Melanoma&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.melanoma_cancer_age?d.data.melanoma_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.kidney_cancer?"checked":""} value="kidney_cancer">Kidney&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.kidney_cancer_age?d.data.kidney_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.gastric_cancer?"checked":""} value="gastric_cancer">Gastric&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.gastric_cancer_age?d.data.gastric_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.lung_cancer?"checked":""} value="lung_cancer">Lung&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.lung_cancer_age?d.data.lung_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.brain_cancer?"checked":""} value="brain_cancer">Brain&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.brain_cancer_age?d.data.brain_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.oesophagus_cancer?"checked":""} value="oesophagus_cancer">Oesophagus&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.oesophagus_cancer_age?d.data.oesophagus_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.thyroid_cancer?"checked":""} value="thyroid_cancer">Thyroid&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.thyroid_cancer_age?d.data.thyroid_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.liver_cancer?"checked":""} value="liver_cancer">Liver&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.liver_cancer_age?d.data.liver_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.cervix_cancer?"checked":""} value="cervix_cancer">Cervix&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.cervix_cancer_age?d.data.cervix_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.myeloma_cancer?"checked":""} value="myeloma_cancer">Myeloma&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.myeloma_cancer_age?d.data.myeloma_cancer_age:""}" />
                            </div>
                            <div class="checkbox">
                              <label><input type="checkbox" class="cancer-checkbox" ${d.data.leukemia_cancer?"checked":""} value="leukemia_cancer">Leukemia&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>
                              &emsp;<input style="display: none;" type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value="${d.data.leukemia_cancer_age?d.data.leukemia_cancer_age:""}" />
                            </div>
                            <div class="form-group">
                                <input type="text" class="form-control" id="searchForCancers" placeholder="Search for cancers" style=" font-size: 12px; padding: 4px; border-radius: 4px"/>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="7" style="text-align: left;">
                            <div class="form-group">
                              <label for="commentRiskFactors">Comments</label>
                              <textarea class="form-control" rows="5" id="commentRiskFactors"></textarea>
                            </div>
                        </td>
                    </tr>
                 </table>
            </div>
        </div>
        `;

        setTimeout(()=>{
            let gestationContainer = $('#gestation_container');
            if(d.data.status > 2){
                gestationContainer.show();
            }else{
                gestationContainer.hide();
            }
        }, 50);

        let x = e.pageX + 50;
        y = 10;
        if (x + dialogWidth > $targetDiv.width()) {
            x+=170;
            panZoom.translateX(opts, -(x + dialogWidth - $targetDiv.width()))
            x = x - (x + dialogWidth - $targetDiv.width())-170;
        }

        $node_tabs.html(tabHeader);
        $('#nodeTabs').tabs({
            create: function (e, ui) {
                $('#closeBtn').click(function () {
                    $node_tabs.dialog('close');
                });
            }
        });
        $node_tabs.dialog('option', 'position', {my: "left top", at: "left+" + x + " top+" + y + "", of: window});
        $node_tabs.dialog('open');
        $node_tabs.css('padding', '0');
        $('.ui-dialog-titlebar').remove();
        $('#dob').datepicker();
        $('#dod-date-picker').datepicker();
        pedigree_form.update(opts);
        var dataSource = [
            {id: 1, data_value: 'Tim Cook'},
            {id: 2, data_value: 'Eric Baker'},
            {id: 3, data_value: 'Victor Brown'},
            {id: 4, data_value: 'Lisa White'},
            {id: 5, data_value: 'Oliver Bull'},
            {id: 6, data_value: 'Zade Stock'},
            {id: 7, data_value: 'David Reed'},
            {id: 8, data_value: 'George Hand'},
            {id: 9, data_value: 'Tony Well'},
            {id: 10, data_value: 'Bruce Wayne'},
        ];

        let ethnicity = $('#ethnicity');
        ethnicity.magicsearch({
            dataSource: dataSource,
            fields: ['data_value'],
            id: 'id',
            format: '%data_value%',
            multiple: true,
            multiField: 'data_value',
            multiStyle: {
                space: 5,
                width: 80
            },
            success:function($input, data){
                pedigree_form.saveTabbedForm(opts, d.data.name,
                    {
                        ethnicity:{
                            action:'save',
                            data: data,
                            id:'ethnicity'
                        }
                    });
            },
            afterDelete:function ($input, data) {
                pedigree_form.saveTabbedForm(opts, d.data.name,
                    {
                        ethnicity:{
                            action:'delete',
                            data: data,
                            id:'ethnicity'
                        }
                    });
            }
        });
        if(d.data.ethnicity && d.data.ethnicity.length>0) {
            let ethnicityIds= d.data.ethnicity.map((e)=>e.id).join();
            ethnicity.trigger('set', {id: ethnicityIds});
        }

         dataSource = [
            {id: 1, data_value: 'Nigeria'},
            {id: 2, data_value: 'United State'},
            {id: 3, data_value: 'Germany'},
            {id: 4, data_value: 'Canada'},
            {id: 5, data_value: 'Japan'},
        ];

        let countryOfOrigin = $('#country_of_origin');
        countryOfOrigin.magicsearch({
            dataSource: dataSource,
            fields: ['data_value'],
            id: 'id',
            format: '%data_value%',
            isClear: true,
            multiple: true,
            multiField: 'data_value',
            multiStyle: {
                space: 5,
                width: 80
            },
            success:function($input, data){
                pedigree_form.saveTabbedForm(opts, d.data.name,
                    {
                        countryOfOrigin:{
                            action:'save',
                            data: data,
                            id:'country_of_origin'
                        }
                    });
            },
            afterDelete:function ($input, data) {
                pedigree_form.saveTabbedForm(opts, d.data.name,
                    {
                        countryOfOrigin:{
                            action:'delete',
                            data: data,
                            id:'country_of_origin'
                        }
                    });
            }
        });
        if(d.data.country_of_origin && d.data.country_of_origin.length>0) {
            let countryOfOriginIds= d.data.country_of_origin.map((e)=>e.id).join();
           countryOfOrigin.trigger('set', {id: countryOfOriginIds});
        }

        var availableTags = [
            "ActionScript",
            "AppleScript",
            "Asp",
            "BASIC",
            "C",
            "C++",
            "Clojure",
            "COBOL",
            "ColdFusion",
            "Erlang",
            "Fortran",
            "Groovy",
            "Haskell",
            "Java",
            "JavaScript",
            "Lisp",
            "Perl",
            "PHP",
            "Python",
            "Ruby",
            "Scala",
            "Scheme"];

        var phenotypes = [];
        Object.keys(opts.phenotypes).forEach(function(key) {
            phenotypes.push(opts.phenotypes[key].name);
        });

        var candidate_genotypes = [];
        Object.keys(opts.candidate_genotype).forEach(function (key) {
            candidate_genotypes.push(opts.candidate_genotype[key].name);
        });

        var causal_genotypes = [];
        Object.keys(opts.causal_genotype).forEach(function (key) {
            causal_genotypes.push(opts.causal_genotype[key].name);
        });

        var carrier_genotypes = [];
        Object.keys(opts.carrier_genotype).forEach(function (key) {
            carrier_genotypes.push(opts.carrier_genotype[key].name);
        });

        var cancers = [];
        Object.keys(opts.cancers).forEach(function (key) {
            cancers.push(opts.cancers[key].name);
        });

        function genesAppender(geneId, geneName, geneType) {
            var close_cls = geneType+'-close';
            var gene_inp = geneId+'_key';
            return '<span id='+geneId+' style="float:left; width:100%;">' + geneName + '&emsp;' +
                '<i class="glyphicon glyphicon-info-sign"></i>' +
                '<a href="#" onclick="return false" style="float: right; padding: 2px; color: red;" class='+close_cls+' >' +
                '<i class="glyphicon glyphicon-remove"></i></a><input id='+gene_inp+' style="display:none;" value=' + geneId + ' /></span>';
        }

        $("#phenotypes").autocomplete({
            source: phenotypes,
            response: function (e, ui) {
                var gap = (28.666 * ui.content.length) + (ui.content.length > 0 ? 4 : 0) + 'px';
                $(this).closest('div').find('.gapDiv').css('height', gap);
            },
            select: function (event, ui) {
                $('#phenotypeTypedText').hide();
                $('#phenotypeGapDiv').hide();
                $('#phenotypeGapDiv').css('height', 0);
                var phenotypeId = getGenesId(ui.item.value, opts.phenotypes);
                if (phenotypeId === null) {
                    var phenoName = ui.item.value;
                    var phenoType = ui.item.value.trim().toLowerCase().replace(/ /g, '_') + '_phenotype';
                    opts.phenotypes.push({type: phenoType, name: phenoName});
                    phenotypeId = phenoType;
                }
                var phenotypeElement = genesAppender(phenotypeId, ui.item.value, 'phenotype');
                var phenotypeAlreadyThere = false;
                $(this).closest('td').find('input').each(function () {
                    if ($(this).val() === phenotypeId) {
                        phenotypeAlreadyThere = true;
                        return false;
                    }
                });

                if (!phenotypeAlreadyThere) {
                    $(this).closest('td').append(phenotypeElement);
                    if (d.data.name in opts.selected_phenotypes) {
                        opts.selected_phenotypes[d.data.name].push(phenotypeId);
                    } else {
                        opts.selected_phenotypes[d.data.name] = [];
                        opts.selected_phenotypes[d.data.name].push(phenotypeId);
                    }
                    pedigree_form.saveTabbedForm(opts, d.data.name);
                }
                $(this).val('');
                return false;
            }
        }).off('blur').on('blur', function() {
            if(document.hasFocus()) {
                //$('ul.ui-autocomplete').hide();
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">' + item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $("#candidateGenes").autocomplete({
            source: candidate_genotypes,
            response: function (e, ui) {
                var gap = (28.666 * ui.content.length) + (ui.content.length > 0 ? 4 : 0) + 'px';
                $(this).closest('div').find('.gapDiv').css('height', gap);
            },
            select: function (event, ui) {
                $('#candidateTypedText').hide();
                $('#candidateGapDiv').hide();
                $('#candidateGapDiv').css('height', 0);
                var candidateId = getGenesId(ui.item.value, opts.candidate_genotype);
                if (candidateId === null) {
                    var candidateName = ui.item.value;
                    var candidateType = ui.item.value.trim().toLowerCase().replace(/ /g, '_') + '_candidate';
                    opts.candidate_genotype.push({type: candidateType, name: candidateName});
                    candidateId = candidateType;
                }
                var candidateElement = genesAppender(candidateId, ui.item.value, 'candidate');
                var candidateAlreadyThere = false;
                $(this).closest('div').find('input').each(function () {
                    if ($(this).val() === candidateId) {
                        candidateAlreadyThere = true;
                        return false;
                    }
                });

                if (!candidateAlreadyThere) {
                    $(this).closest('div').append(candidateElement);
                    if (d.data.name in opts.selected_candidate_genotype) {
                        opts.selected_candidate_genotype[d.data.name].push(candidateId);
                    } else {
                        opts.selected_candidate_genotype[d.data.name] = [];
                        opts.selected_candidate_genotype[d.data.name].push(candidateId);
                    }
                    pedigree_form.saveTabbedForm(opts, d.data.name);
                }
                $(this).val('');
                return false;
            }
        }).off('blur').on('blur', function() {
            if(document.hasFocus()) {
                //$('ul.ui-autocomplete').hide();
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">' + item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $("#causalGenes").autocomplete({
            source: causal_genotypes,
            response: function (e, ui) {
                var gap = (28.666 * ui.content.length) + (ui.content.length > 0 ? 4 : 0) + 'px';
                $(this).closest('div').find('.gapDiv').css('height', gap);
            },
            select: function (event, ui) {
                $('#causalTypedText').hide();
                $('#causalGapDiv').hide();
                $('#causalGapDiv').css('height', 0);
                var casualId = getGenesId(ui.item.value, opts.causal_genotype);
                if (casualId === null) {
                    var casualName = ui.item.value;
                    var casualType = ui.item.value.trim().toLowerCase().replace(/ /g, '_') + '_causal';
                    opts.causal_genotype.push({type: casualType, name: casualName});
                    casualId = casualType;
                }
                var casualElement = genesAppender(casualId, ui.item.value, 'causal');
                var casualAlreadyThere = false;
                $(this).closest('div').find('input').each(function () {
                    if ($(this).val() === casualId) {
                        casualAlreadyThere = true;
                        return false;
                    }
                });

                if (!casualAlreadyThere) {
                    $(this).closest('div').append(casualElement);
                    if (d.data.name in opts.selected_causal_genotype) {
                        opts.selected_causal_genotype[d.data.name].push(casualId);
                    } else {
                        opts.selected_causal_genotype[d.data.name] = [];
                        opts.selected_causal_genotype[d.data.name].push(casualId);
                    }
                    pedigree_form.saveTabbedForm(opts, d.data.name);
                }
                $(this).val('');
                return false;
            }
        }).off('blur').on('blur', function() {
            if(document.hasFocus()) {
                //$('ul.ui-autocomplete').hide();
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">'+item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $("#carrierGenes").autocomplete({
            source: carrier_genotypes,
            response: function (e, ui) {
                var gap = (28.666 * ui.content.length) + (ui.content.length > 0 ? 4 : 0) + 'px';
                $(this).closest('div').find('.gapDiv').css('height', gap);
            },
            select: function (event, ui) {
                $('#carrierTypedText').hide();
                $('#carrierGapDiv').hide();
                $('#carrierGapDiv').css('height', 0);
                var carrierId = getGenesId(ui.item.value, opts.carrier_genotype);
                if (carrierId === null) {
                    var carrierName = ui.item.value;
                    var carrierType = ui.item.value.trim().toLowerCase().replace(/ /g, '_') + '_carrier';
                    opts.carrier_genotype.push({type: carrierType, name: carrierName});
                    carrierId = carrierType;
                }
                var carrierElement = genesAppender(carrierId, ui.item.value, 'carrier');
                var carrierAlreadyThere = false;
                $(this).closest('div').find('input').each(function () {
                    if ($(this).val() === carrierId) {
                        carrierAlreadyThere = true;
                        return false;
                    }
                });

                if (!carrierAlreadyThere) {
                    $(this).closest('div').append(carrierElement);
                    if (d.data.name in opts.selected_carrier_genotype) {
                        opts.selected_carrier_genotype[d.data.name].push(carrierId);
                    } else {
                        opts.selected_carrier_genotype[d.data.name] = [];
                        opts.selected_carrier_genotype[d.data.name].push(carrierId);
                    }
                    pedigree_form.saveTabbedForm(opts, d.data.name);
                }
                $(this).val('');
                return false;
            }
        }).off('blur').on('blur', function() {
            if(document.hasFocus()) {
                //$('ul.ui-autocomplete').hide();
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">'+item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $('#nodeTabs').on('input', '#phenotypes', function () {
            if ($(this).val().trim().length == 0) {
                $('#phenotypeTypedText').hide();
                $('#phenotypeGapDiv').hide();
                $('#phenotypeGapDiv').css('height', 0);
            } else {
                $('#phenotypeTypedText').show();
                $('#phenotypeGapDiv').show();
            }
            $('#phenotype-non-standard-text').text($(this).val());
        });

        $('#phenotype-non-standard-text').on('click', function () {
            $('#phenotypes').data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: {value: $('#phenotypes').val()}});
            $('#phenotypeGapDiv').css('height', 0);
            $('#phenotypeTypedText').hide();
        });

        $('#nodeTabs').on('click', function () {
            $('.gapDiv').css('height', 0);
            $('.non-standard-text').closest('ul').hide();
        });

        $('#nodeTabs').on('input', '#candidateGenes', function () {
            if ($(this).val().trim().length == 0) {
                $('#candidateTypedText').hide();
                $('#candidateGapDiv').hide();
                $('#candidateGapDiv').css('height', 0);
            } else {
                $('#candidateTypedText').show();
                $('#candidateGapDiv').show();
            }
            $('#candidate-non-standard-text').text($(this).val());
        });

        $('#candidate-non-standard-text').on('click', function () {
            $('#candidateGenes').data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: {value: $('#candidateGenes').val()}});
            $('#candidateGapDiv').css('height', 0);
            $('#candidateTypedText').hide();
        });

        $('#nodeTabs').on('input', '#causalGenes', function () {
            if ($(this).val().trim().length == 0) {
                $('#causalTypedText').hide();
                $('#causalGapDiv').hide();
                $('#causalGapDiv').css('height', 0);
            } else {
                $('#causalTypedText').show();
                $('#causalGapDiv').show();
            }
            $('#causal-non-standard-text').text($(this).val());
        });

        $('#causal-non-standard-text').on('click', function () {
            $('#causalGenes').data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: {value: $('#causalGenes').val()}});
            $('#causalGapDiv').css('height', 0);
            $('#causalTypedText').hide();
        });

        $('#nodeTabs').on('input', '#carrierGenes', function () {
            if ($(this).val().trim().length == 0) {
                $('#carrierTypedText').hide();
                $('#carrierGapDiv').hide();
                $('#carrierGapDiv').css('height', 0);
            } else {
                $('#carrierTypedText').show();
                $('#carrierGapDiv').show();
            }
            $('#carrier-non-standard-text').text($(this).val());
        });

        $('#carrier-non-standard-text').on('click', function () {
            $('#carrierGenes').data('ui-autocomplete')._trigger('select', 'autocompleteselect', {item: {value: $('#carrierGenes').val()}});
            $('#carrierGapDiv').css('height', 0);
            $('#carrierTypedText').hide();
        });

        function conditionForm(conditionKey) {
            return '<span class="diagnosisTypes"><label style="float: left;"><input type="checkbox" id="' + conditionKey + '_check" value="" checked>'+opts.conditions[conditionKey].name+'&emsp;<i class="glyphicon glyphicon-info-sign"></i>' +
                '</label><br/><div class="panel panel-default"><a id="'+ conditionKey+'" href="#" onclick="return false" style="float: right; padding: 2px; color: red;" class="diagnosis-close"><i class="glyphicon glyphicon-remove"></i></a>' +
                '<div class="panel-body"><div class="form-group"><strong style="float: left;">Status:</strong>&emsp;' +
                '<label class="radio-inline" style="padding-left: 15px;"><input type="radio" value="Affected" name="' + conditionKey + '_status">Affected</label>' +
                '<label class="radio-inline" style="padding-left: 15px;"><input type="radio" value="Carrier" name="' + conditionKey + '_status">Carrier</label>' +
                '<label class="radio-inline" style="padding-left: 15px;"><input type="radio" value="Uncertain" name="' + conditionKey + '_status">Uncertain</label></div>' +
                '<label style="float: left;">Age onset:</label>' +
                '<input type="text" id="' + conditionKey + '_ageOnset" class="form-control" style="width: 190px; height: 27px; padding: 4px; border-radius: 4px; float:right;"/>' +
                '<label style="float: left;">Diagnosed:</label>' +
                '<input type="text" id="' + conditionKey +'_diagnosed" class="form-control" style="width: 190px; height: 27px; padding: 4px; border-radius: 4px; float:right;"/>' +
                '<label style="float: left;">Diagnosis type:</label>' +
                '<select id="' + conditionKey +'_diagnosisType" class="form-control" style="width: 190px; height: 27px; padding: 4px; border-radius: 4px; float:right;">' +
                '<option value=""></option>'+
                '<option value="Clinical">Clinical</option>'+
                '<option value="Confirmed Moleculary">Confirmed Moleculary</option>'+
                '<option value="Confirmed Cytogenetically">Confirmed Cytogenetically</option>'+
                '<option value="Confirmed Biochemically">Confirmed Biochemically</option>'+
                '</select>'+
                '<label style="float: left;">Notes:</label><textarea class="form-control" rows="3" id="' + conditionKey +'_notes"></textarea></div></div></span>';
        }

        function conditionWindow(conditionKey) {
            return '<span><label style="float: left;"><input type="checkbox" id="' + conditionKey + '_check_stat" value="" checked="checked" onclick="return false;">&emsp;'+opts.conditions[conditionKey].name+'&emsp;<i class="glyphicon glyphicon-info-sign"></i></label><br/>'+
                '<div class="panel panel-default"><a id="'+ conditionKey + '" href="#" onclick="return false" style="float: right; padding: 2px; color: red;" class="diagnosis-close"><i class="glyphicon glyphicon-remove"></i></a>' +
                '<a href="#" onclick="return false" style="float: right; padding: 2px; color: green;" class="diagnosis-edit"><i class="glyphicon glyphicon-pencil"></i></a>'+
                '<div class="panel-body"><div class="form-group"><span style="float:left; padding-left:3px;"><strong>Status:</strong>&nbsp;<span id="' + conditionKey + '_status_stat"></span></span>' +
                '<span style="float:left; padding-left:3px;"><strong>Onset:</strong>&nbsp;<span id="' + conditionKey + '_ageOnset_stat"></span></span>' +
                '<span style="float:left; padding-left:3px;"><strong>Dx:</strong>&nbsp;<span id="' + conditionKey + '_diagnosed_stat"></span></span><br/>' +
                '<span style="float:left; padding-left:3px;"><strong>Dx type:</strong>&nbsp;<span id="' + conditionKey + '_diagnosisType_stat"></span></span>' +
                '<span style="float:left; padding-left:3px;"><strong>Notes:</strong>&nbsp;<span id="' + conditionKey + '_notes_stat"></span></span></div></div></div></span>';
        }

        function cancersView(cancer_id, cancer_name, type, ageValue) {
            var cancer_close = type + '-close';
            return '<div class="checkbox"><label><input type="checkbox" class="cancer-checkbox" value='+cancer_id+' checked>'+cancer_name+'&emsp;<i class="glyphicon glyphicon-info-sign"></i></label>' +
                '&emsp;<input type="number" min="0" class="cancer-age" placeholder="Enter age of diagnosis" value='+ageValue+' ><a href="#" onclick="return false" style="float: right; padding: 2px; color: red;" class='+cancer_close+'><i class="glyphicon glyphicon-remove"></i></a></div>';
        }

        var dataset = pedcache.current(opts);
        var selectedName = d.data.name;
        var node_name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
        var newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, node_name);

        var availableConditions = [];
        Object.keys(opts.conditions).forEach(function(key) {
            availableConditions.push(opts.conditions[key].name);
        });

        $("#conditions").autocomplete({
            source: availableConditions,
            select: function (event, ui) {
                let conditionId = getConditionId(ui.item.value);
                let condition = conditionForm(conditionId);
                if ($(this).closest('td').find('input').is('#' + conditionId + '_check_stat')) {
                    $('#' + conditionId + '_check_stat').closest('span').show();
                    $(this).val('');
                    return false;
                } else if ($(this).closest('td').find('input').is('#' + conditionId + '_check')) {
                    $('#' + conditionId + '_check').closest('span').show();
                    $(this).val('');
                    return false;
                }
                $(this).closest('td').append(condition);
                pedigree_form.saveTabbedForm(opts, d.data.name);
                $(this).val('');
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">' + item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $("#searchForCancers").autocomplete({
            source: cancers,
            select: function (event, ui) {
                var cancerId = getGenesId(ui.item.value, opts.cancers);
                var cancerElement = cancersView(cancerId, ui.item.value, 'cancer', '');
                var cancerAlreadyThere = false;
                $(this).closest('div').find('input').each(function () {
                    if ($(this).val() === cancerId) {
                        cancerAlreadyThere = true;
                        return false;
                    }
                });

                if (!cancerAlreadyThere) {
                    $(this).closest('div').append(cancerElement);
                    if (d.data.name in opts.selected_cancers) {
                        opts.selected_cancers[d.data.name].push(cancerId);
                    } else {
                        opts.selected_cancers[d.data.name] = [];
                        opts.selected_cancers[d.data.name].push(cancerId);
                    }
                    pedigree_form.save_common_cancers($(this).closest('div').find('input[type=checkbox]').val(), $(this).closest('div').find('input[type=number]').val(), opts, d.data.name, false);
                }
                $(this).val('');
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append('<span style="width: 380px;">' + item.label + '&emsp;<i class="glyphicon glyphicon-info-sign"></i></span>')
                .appendTo(ul);
        };

        $(document).on('click', 'a.diagnosis-close', function () {
            if ($(this).closest('span').find('input[type=checkbox]').is(':checked')) {
                $(this).closest('span').hide();
            } else {
                $(this).closest('span').remove();
            }
        });

        $('#nodeTabs').on('click', 'a.cancer-close', function () {
            $(this).closest('div').remove();
        });

        $('#nodeTabs').on('click', 'a.phenotype-close', function () {
            $(this).closest('span').remove();
            pedigree_form.remove_phenotypes(opts, d.data.name, $(this).closest('span').find('input').val());
        });

        $('#nodeTabs').on('click', 'a.candidate-close', function () {
            $(this).closest('span').remove();
            pedigree_form.remove_candidate(opts, d.data.name, $(this).closest('span').find('input').val());
        });

        $('#nodeTabs').on('click', 'a.causal-close', function () {
            $(this).closest('span').remove();
            pedigree_form.remove_causal(opts, d.data.name, $(this).closest('span').find('input').val());
        });

        $('#nodeTabs').on('click', 'a.carrier-close', function () {
            $(this).closest('span').remove();
            pedigree_form.remove_carrier(opts, d.data.name, $(this).closest('span').find('input').val());
        });

        person.conditions = person.conditions || [];
        person.conditions.forEach((condition) => {
            const k = getConditionId(condition.name);
            let conditionAge = 'age';
            let conditionStatus = 'status';
            let conditionDiagnosed = 'diagnosed';
            let conditionType = 'type';
            let conditionNotes = 'notes';
            let condition_window = conditionWindow(k);
            let condition_form = conditionForm(k);
            $("#conditions").closest('td').append(condition_window);
            $("#conditions").closest('td').append(condition_form);
            $('#' + k + '_ageOnset_stat').text(condition[conditionAge]);
            $('#' + k + '_status_stat').text(condition[conditionStatus]);
            $('#' + k + '_diagnosed_stat').text(condition[conditionDiagnosed]);
            $('#' + k + '_diagnosisType_stat').text(condition[conditionType]);
            $('#' + k + '_notes_stat').text(condition[conditionNotes]);

            $('#' + k + '_ageOnset').val(condition[conditionAge]);
            $("input[name='" + k + "_status']").val([condition[conditionStatus]]);
            $('#' + k + '_diagnosed').val(condition[conditionDiagnosed]);
            $('#' + k + '_diagnosisType').val(condition[conditionType]);
            $('#' + k + '_notes').val(condition[conditionNotes]);

            $('#' + k + '_check').closest('span').hide();
        });

        $('#nodeTabs').on('click', 'a.diagnosis-close', function () {
           let conditionToDelete = $(this).attr('id')
             pedigree_form.saveTabbedForm(opts, d.data.name, {conditionToDelete});
        });


        for (var ph_count=0; ph_count<opts.phenotypes.length; ph_count++) {
            if(person.hasOwnProperty(opts.phenotypes[ph_count].type)) {
                opts.selected_phenotypes[d.data.name] = [opts.phenotypes[ph_count].type];
                $("#phenotypes").closest('td').append(genesAppender(opts.phenotypes[ph_count].type, opts.phenotypes[ph_count].name, 'phenotype'));
            }
        }

        for (var gn_count = 0; gn_count < opts.candidate_genotype.length; gn_count++) {
            if (person.hasOwnProperty(opts.candidate_genotype[gn_count].type)) {
                opts.selected_candidate_genotype[d.data.name] = [opts.candidate_genotype[gn_count].type];
                $("#candidateGenes").closest('div').append(genesAppender(opts.candidate_genotype[gn_count].type, opts.candidate_genotype[gn_count].name, 'candidate'));
            }
        }

        for (var gn_count = 0; gn_count < opts.causal_genotype.length; gn_count++) {
            if (person.hasOwnProperty(opts.causal_genotype[gn_count].type)) {
                opts.selected_causal_genotype[d.data.name] = [opts.causal_genotype[gn_count].type];
                $("#causalGenes").closest('div').append(genesAppender(opts.causal_genotype[gn_count].type, opts.causal_genotype[gn_count].name, 'causal'));
            }
        }

        for (var gn_count = 0; gn_count < opts.carrier_genotype.length; gn_count++) {
            if (person.hasOwnProperty(opts.carrier_genotype[gn_count].type)) {
                opts.selected_carrier_genotype[d.data.name] = [opts.carrier_genotype[gn_count].type];
                $("#carrierGenes").closest('div').append(genesAppender(opts.carrier_genotype[gn_count].type, opts.carrier_genotype[gn_count].name, 'carrier'));
            }
        }

        for (var ca_count = 0; ca_count < opts.cancers.length; ca_count++) {
            if (person.hasOwnProperty(opts.cancers[ca_count].type)) {
                opts.selected_cancers[d.data.name] = [opts.cancers[ca_count].type];
                if (person.hasOwnProperty(opts.cancers[ca_count].type + '_age')) {
                    $("#searchForCancers").closest('div').append(cancersView(opts.cancers[ca_count].type, opts.cancers[ca_count].name, 'cancer', person[opts.cancers[ca_count].type + '_age']));
                } else {
                    $("#searchForCancers").closest('div').append(cancersView(opts.cancers[ca_count].type, opts.cancers[ca_count].name, 'cancer', ''));
                }
            }
        }

        $('#reason').on('keyup blur', function (e) {
            if (e.keyCode === 13) {
                pedigree_form.saveTabbedForm(opts, d.data.name);
            }
        });

        $('.diagnosis-edit').on('click', function () {
            let conditionName = $(this).closest('span').find('label').text();
            let conditionId = getConditionId(conditionName.trim(), opts.conditions);
            $('#' + conditionId + '_check').closest('span').show();
            $(this).closest('span').remove();
        });

        $('#nodeTabs').on('change', 'input[type=text], input[type=radio], input[type=checkbox],#nodeTabs' +
            ' input[type=number], select, textarea, #heredity,#ethnicity,  #country_of_origin', function (e) {
            if($(e.target).attr('id') !== 'conditions'){
                pedigree_form.saveTabbedForm(opts, d.data.name, null);
            }
        });

        $('.cancer-checkbox').each(function () {
            if ($(this).is(':checked')) {
                $(this).closest('div').find('input[type=number]').show();
            }
        });

        $('#nodeTabs').on('change', '.cancer-checkbox', function () {
            if ($(this).is(':checked')) {
                $(this).closest('div').find('input[type=number]').show();
                pedigree_form.save_common_cancers($(this).val(), $(this).closest('div').find('input[type=number]').val(), opts, d.data.name, false);
            } else {
                $(this).closest('div').find('input[type=number]').hide();
                pedigree_form.remove_cancers($(this).val(), $(this).closest('div').find('input[type=number]').val(), opts, d.data.name, false);
                if (opts.hasOwnProperty('cancer_legend')) {
                    for (var i = 0; i < opts.cancer_legend.length; i++) {
                        if ($(this).val() === opts.cancer_legend[i].type) {
                            var cancerCount = opts.cancer_legend[i].count;
                            opts.cancer_legend[i].count = cancerCount - 1;
                            break;
                        }
                    }
                }
            }
            legend.showCancerLegends(opts);
        });

        $('#nodeTabs').on('change', '.cancer-age', function () {
            if ($(this).closest('div').find('input[type=checkbox]').is(':checked')) {
                if ($(this).val()) {
                    pedigree_form.save_common_cancers($(this).closest('div').find('input[type=checkbox]').val(), $(this).val(), opts, d.data.name, true);
                } else {
                    pedigree_form.remove_cancers($(this).closest('div').find('input[type=checkbox]').val(), $(this).val(), opts, d.data.name, true);
                }
            }
        });
    }

    function getConditionId(conditionName) {
        const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi');
        return conditionName.replace(specialRegex, '-') + '_condition';
    }

    function getGenesId(genesName, genes) {
        for (var i = 0; i < genes.length; i++) {
            if (genes[i].name === genesName) {
                return genes[i].type;
            }
        }
        return null;
    }

}(window.widgets = window.widgets || {}, jQuery));
