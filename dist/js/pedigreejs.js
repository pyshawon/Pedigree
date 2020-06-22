

// pedigree utils
(function(utils, $, undefined) {

	/**
	 * Show message or confirmation dialog.
	 * @param title     - dialog window title
	 * @param msg       - message to diasplay
	 * @param onConfirm - function to call in a confirmation dialog
	 * @param opts      - pedigreejs options
	 * @param dataset    - pedigree dataset
	 */ 
	utils.messages = function(title, msg, onConfirm, opts, dataset) {
		if(onConfirm) {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
			        modal: true,
			        title: title,
			        width: 350,
			        buttons: {
			        	"Yes": function () {
			                $(this).dialog('close');
			                onConfirm(opts, dataset);
			            },
			            "No": function () {
			                $(this).dialog('close');
			            }
			        }
			    });
		} else {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
	    		title: title,
	    		width: 350,
	    		buttons: [{
	    			text: "OK",
	    			click: function() { $( this ).dialog( "close" );}
	    		}]
			});
		}
	}
	
	/**
	 * Validate age and yob is consistent with current year. The sum of age and
	 * yob should not be greater than or equal to current year. If alive the
	 * absolute difference between the sum of age and year of birth and the
	 * current year should be <= 1.
	 * @param age    - age in years.
	 * @param yob    - year of birth.
	 * @param status - 0 = alive, 1 = dead.
	 * @return true if age and yob are consistent with current year otherwise false.
	 */
	utils.validate_age_yob = function(age, yob, status) {
		var year = new Date().getFullYear();
		var sum = parseInt(age) + parseInt(yob);
		if(status == 1) {   // deceased
			return year >= sum;
		}
		return Math.abs(year - sum) <= 1 && year >= sum;
	}
}(window.utils = window.utils || {}, jQuery));


// pedigree I/O 
(function(io, $, undefined) {

	// cancers, genetic & pathology tests
	io.cancers = {
			'breast_cancer': 'breast_cancer_diagnosis_age',
			'breast_cancer2': 'breast_cancer2_diagnosis_age',
			'ovarian_cancer': 'ovarian_cancer_diagnosis_age',
			'prostate_cancer': 'prostate_cancer_diagnosis_age',
			'pancreatic_cancer': 'pancreatic_cancer_diagnosis_age'
		};
	io.genetic_test = ['brca1', 'brca2', 'palb2', 'atm', 'chek2'];
	io.pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56'];
	
	
	io.add = function(opts) {
		$('#load').change(function(e) {
			io.load(e, opts);
		});

		$('#save').click(function(e) {
			io.save(opts);
		});

		$('#print').click(function(e) {
			io.print(io.get_printable_svg(opts));
		});

		$('#svg_download').click(function(e) {
			io.svg_download(io.get_printable_svg(opts));
		});

		$('#png_download').click(function(e) {
			var wrapper = $(io.get_printable_svg(opts)).appendTo('body')[0];
			var svg = wrapper.querySelector("svg");
			var svgData;
		    if (typeof window.XMLSerializer != "undefined") {
		        svgData = (new XMLSerializer()).serializeToString(svg);
		    } else if (typeof svg.xml != "undefined") {
		        svgData = svg.xml;
		    }

		    var canvas = document.createElement("canvas");
		    var svgSize = svg.getBoundingClientRect();
		    canvas.width = svgSize.width;
		    canvas.height = svgSize.height;
		    var ctx = canvas.getContext("2d");

		    var img = document.createElement("img");
		    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))) );
		    img.onload = function() {
		        ctx.drawImage(img, 0, 0);
		        var imgsrc = canvas.toDataURL("image/png");
				var a      = document.createElement('a');
				a.href     = imgsrc;
				a.download = 'plot.png';
				a.target   = '_blank';
				document.body.appendChild(a); a.click(); document.body.removeChild(a);
		        setTimeout(function() {
		        	wrapper.remove();
		        }, 200);
		    };
		});
	};

	// return a copy of svg html with unique url references (e.g. for clippath)
	io.copy_svg_html = function(opts) {
    	var svg_html = io.get_printable_svg(opts).html();
    	// find all url's to make unique
    	var myRegexp = /url\(\#(.*?)\)/g;
		var match = myRegexp.exec(svg_html);
		while (match !== null) {
			var val = match[1];  // replace all url id's with new unique id's
			svg_html = svg_html.replace(new RegExp(val, 'g'), val+ptree.makeid(2));
			match = myRegexp.exec(svg_html);
		}
		return svg_html;
	};

	// get printable svg div, adjust size to tree dimensions and scale to fit
	io.get_printable_svg = function(opts) {
		var local_dataset = pedcache.current(opts); // get current dataset
		if (local_dataset !== undefined && local_dataset !== null) {
			opts.dataset = local_dataset;
		}

		var tree_dimensions = ptree.get_tree_dimensions(opts);
		var svg_div = $('#'+opts.targetDiv).find('svg').parent();
		if(opts.width < tree_dimensions.width || opts.height < tree_dimensions.height ||
		   tree_dimensions.width > 595 || tree_dimensions.height > 842) {
			var wid = tree_dimensions.width;
		    var hgt = tree_dimensions.height + 100;
		    var scale = 1.0;

		    if(tree_dimensions.width > 595 || tree_dimensions.height > 842) {   // scale to fit A4
		    	if(tree_dimensions.width > 595)  wid = 595;
		    	if(tree_dimensions.height > 842) hgt = 842;
		    	var xscale = wid/tree_dimensions.width;
		    	var yscale = hgt/tree_dimensions.height;
		    	scale = (xscale < yscale ? xscale : yscale);
		    }
			svg_div = $('<div></div>');// create a new div
			let parentClone = $('svg').parent().clone();
			let selectionsToBeRemoved = ['.view-controls', '.view-controls-zoom .field-no-user-select', '.all-legend-container', '#dataButton', '#dataShower'];
			selectionsToBeRemoved.map((selection)=>parentClone.find(selection).remove());
			svg_div.append(parentClone.html());	// copy svg html to new div
		    var svg = svg_div.find( "svg" );
		    svg.attr('width', wid);		// adjust dimensions
		    svg.attr('height', hgt);

		    var ytransform = (-opts.symbol_size*1.5*scale);
		    svg.find(".diagram").attr("transform", "translate(0, "+ytransform+") scale("+scale+")");
		}
		return svg_div;
	};
	// download the SVG to a file
	io.svg_download = function(svg){
		var a      = document.createElement('a');
		a.href     = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svg.html() ) ) );
		a.download = 'plot.svg';
		a.target   = '_blank';
		document.body.appendChild(a); a.click(); document.body.removeChild(a);
	};

	// open print window for a given element
	io.print = function(el){
        if(el.constructor !== Array)
        	el = [el];

        var width = $(window).width()*2/3;
        var height = $(window).height()-40;
        var cssFiles = [
        	'/static/css/output.css',
        	'https://use.fontawesome.com/releases/v5.7.2/css/all.css',
        	'https://use.fontawesome.com/releases/v5.7.2/css/v4-shims.css'
        ];
        var printWindow = window.open('', 'PrintMap', 'width=' + width + ',height=' + height);
        var headContent = '';
        for(var i=0; i<cssFiles.length; i++)
        	headContent += '<link href="'+cssFiles[i]+'" rel="stylesheet" type="text/css" media="all">';
        headContent += "<style>body {font-size: " + $("body").css('font-size') + ";}</style>";

            /*var headContent2 = '';
            var links = document.getElementsByTagName('link');
            for(var i=0;i<links.length; i++) {
            	var html = links[i].outerHTML;
            	if(html.indexOf('href="http') !== -1)
            		headContent2 += html;
            }
            headContent2 += html;          
            var scripts = document.getElementsByTagName('script');
            for(var i=0;i<scripts.length; i++) {
            	var html = scripts[i].outerHTML;
            	if(html.indexOf('src="http') !== -1)
            		headContent += html;
            }*/

        html = "";
        for(i=0; i<el.length; i++) {
        	html += $(el[i]).html();
        	if(i < el.length-1)
        		html += '<div style="page-break-before:always"> </div>';
        }

        printWindow.document.write(headContent);
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.focus();
        setTimeout(function() {
            printWindow.print();
            printWindow.close();
        }, 100);
	};

	io.save = function(opts){
		var content = JSON.stringify(pedcache.current(opts));
		if(opts.DEBUG)
			console.log(content);
		var uriContent = "data:application/csv;charset=utf-8," + encodeURIComponent(content);
		window.open(uriContent, 'boadicea_pedigree');
	};

	io.load = function(e, opts) {
	    var f = e.target.files[0];
		if(f) {
			var reader = new FileReader();
			reader.onload = function(e) {
				if(opts.DEBUG)
					console.log(e.target.result);
				try {
					if(e.target.result.startsWith("BOADICEA import pedigree file format 4.0"))
						opts.dataset = io.readBoadiceaV4(e.target.result);
					else {
						try {
							opts.dataset = JSON.parse(e.target.result);
						} catch(err) {
							opts.dataset = io.readLinkage(e.target.result);
					    }
					}
					ptree.validate_pedigree(opts);
				} catch(err1) {
					console.error(err1);
					utils.messages("File Error", ( err1.message ? err1.message : err1));
					return;
				}
				console.log(opts.dataset);
				try{
					ptree.rebuild(opts);
				} catch(err2) {
					utils.messages("File Error", ( err2.message ? err2.message : err2));
				}
			};
			reader.onerror = function(event) {
			    utils.messages("File Error", "File could not be read! Code " + event.target.error.code);
			};
			reader.readAsText(f);
		} else {
			console.error("File could not be read!");
		}
		$("#load")[0].value = ''; // reset value
	};

	// 
	// https://www.cog-genomics.org/plink/1.9/formats#ped
	// https://www.cog-genomics.org/plink/1.9/formats#fam
	//	1. Family ID ('FID')
	//	2. Within-family ID ('IID'; cannot be '0')
	//	3. Within-family ID of father ('0' if father isn't in dataset)
	//	4. Within-family ID of mother ('0' if mother isn't in dataset)
	//	5. Sex code ('1' = male, '2' = female, '0' = unknown)
	//	6. Phenotype value ('1' = control, '2' = case, '-9'/'0'/non-numeric = missing data if case/control)
	//  7. Genotypes (column 7 onwards);
	//     columns 7 & 8 are allele calls for first variant ('0' = no call); colummns 9 & 10 are calls for second variant etc.
	io.readLinkage = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		var famid;
		for(var i = 0;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
		   if(attr.length < 5)
			   throw('unknown format');
		   var sex = (attr[4] == '1' ? 'M' : (attr[4] == '2' ? 'F' : 'U'));
		   var indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[1],
				'sex': sex 
			};
			if(attr[2] !== "0") indi.father = attr[2];
			if(attr[3] !== "0") indi.mother = attr[3];
			
			if (typeof famid != 'undefined' && famid !== indi.famid) {
				console.error('multiple family IDs found only using famid = '+famid);
				break;
			}
			if(attr[5] == "2") indi.affected = 2;
			// add genotype columns
			if(attr.length > 6) {
				indi.alleles = "";
				for(var j=6; j<attr.length; j+=2) {
					indi.alleles += attr[j] + "/" + attr[j+1] + ";";
				}
			}
			
			ped.unshift(indi);
			famid = attr[0];
		}
		return process_ped(ped);
	};

	// read boadicea format v4
	io.readBoadiceaV4 = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		// assumes two line header
		for(var i = 2;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
			if(attr.length > 1) {
				var indi = {
					'famid': attr[0],
					'display_name': attr[1],
					'name':	attr[3],
					'sex': attr[6],
					'status': attr[8]
				};
				if(attr[2] == 1) indi.proband = true;
				if(attr[4] !== "0") indi.father = attr[4];
				if(attr[5] !== "0") indi.mother = attr[5];
				if(attr[7] !== "0") indi.mztwin = attr[7];
				if(attr[9] !== "0") indi.age = attr[9];
				if(attr[10] !== "0") indi.yob = attr[10];

				var idx = 11;
				$.each(io.cancers, function(cancer, diagnosis_age) {
					// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
					if(attr[idx] !== "0") {
						indi[diagnosis_age] = attr[idx];
					}
					idx++;
				});

				if(attr[idx++] !== "0") indi.ashkenazi = 1;
				// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
				// genetic test type, 0 = untested, S = mutation search, T = direct gene test
				// genetic test result, 0 = untested, P = positive, N = negative
				for(var j=0; j<io.genetic_test.length; j++) {
					idx+=2;
					if(attr[idx-2] !== '0') {
						if((attr[idx-2] === 'S' || attr[idx-2] === 'T') && (attr[idx-1] === 'P' || attr[idx-1] === 'N'))
							indi[io.genetic_test[j] + '_gene_test'] = {'type': attr[idx-2], 'result': attr[idx-1]};
						else
							console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + attr[idx-2] + " " + attr[idx-1]);
					}
				}
				// status, 0 = unspecified, N = negative, P = positive
				for(j=0; j<io.pathology_tests.length; j++) {
					if(attr[idx] !== '0') {
						if(attr[idx] === 'N' || attr[idx] === 'P')
							indi[io.pathology_tests[j] + '_bc_pathology'] = attr[idx];
						else
							console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +io.pathology_tests[j] + " " +attr[idx]);
					}
					idx++;
				}
				ped.unshift(indi);
			}
		}

		try {
			return process_ped(ped);
		} catch(e) {
			console.error(e);
			return ped;
		}
	};

	function process_ped(ped) {
		// find the level of individuals in the pedigree
		for(var i=0;i<ped.length;i++) {
			getLevel(ped, ped[i].name);
		}

		// find the max level (i.e. top_level)
		var max_level = 0;
		for(i=0;i<ped.length;i++) {
			if(ped[i].level && ped[i].level > max_level)
				max_level = ped[i].level;
		}

		// identify top_level and other nodes without parents
		for(i=0;i<ped.length;i++) {
			if(pedigree_util.getDepth(ped, ped[i].name) == 1) {
				if(ped[i].level && ped[i].level == max_level) {
					ped[i].top_level = true;
				} else {
					ped[i].noparents = true;

					// 1. look for partners parents
					var pidx = getPartnerIdx(ped, ped[i]);
					if(pidx > -1) {
						if(ped[pidx].mother) {
							ped[i].mother = ped[pidx].mother;
							ped[i].father = ped[pidx].father;
						}
					}

					// 2. or adopt parents from level above
					if(!ped[i].mother){
						for(var j=0; j<ped.length; j++) {
							if(ped[i].level == (ped[j].level-1)) {
								pidx = getPartnerIdx(ped, ped[j]);
								if(pidx > -1) {
									ped[i].mother = (ped[j].sex === 'F' ? ped[j].name : ped[pidx].name);
									ped[i].father = (ped[j].sex === 'M' ? ped[j].name : ped[pidx].name);
								}
							}
						}
					}
				}
			} else {
				delete ped[i].top_level;
			}
		}
		return ped;
	}

	// get the partners for a given node
	function getPartnerIdx(dataset, anode) {
		var ptrs = [];
		for(var i=0; i<dataset.length; i++) {
			var bnode = dataset[i];
			if(anode.name === bnode.mother)
				return pedigree_util.getIdxByName(dataset, bnode.father);
			else if(anode.name === bnode.father)
				return pedigree_util.getIdxByName(dataset, bnode.mother);
		}
		return -1;
	}
	
	// for a given individual assign levels to a parents ancestors
	function getLevel(dataset, name) {
		var idx = pedigree_util.getIdxByName(dataset, name);
		var level = (dataset[idx].level ? dataset[idx].level : 0);
		update_parents_level(idx, level, dataset);
	}

	// recursively update parents levels 
	function update_parents_level(idx, level, dataset) {
		var parents = ['mother', 'father'];
		level++;
		for(var i=0; i<parents.length; i++) {
			var pidx = pedigree_util.getIdxByName(dataset, dataset[idx][parents[i]]);
			if(pidx >= 0) {
				if(!dataset[pidx].level || dataset[pidx].level < level) {
					dataset[pedigree_util.getIdxByName(dataset, dataset[idx].mother)].level = level;
					dataset[pedigree_util.getIdxByName(dataset, dataset[idx].father)].level = level;
				}
				update_parents_level(pidx, level, dataset);
			}
		}
	}

}(window.io = window.io || {}, jQuery));

'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*!
 * MagicSearch - An input plugin based on jquery
 *
 * Copyright (c) 2016 dingyi1993
 *
 * Version: 1.0.2
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/MIT
 *
 * project link:
 *   https://github.com/dingyi1993/jquery-magicsearch
 *
 * home page link:
 *   https://www.dingyi1993.com/blog/magicsearch
 */

;(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory(typeof jQuery != 'undefined' ? jQuery : window.Zepto);
    }
})(function ($) {
    'use strict';

    var
    //separator of format
    SEPARATOR = '%',


    //default multi style,unit px
    DEFAULT_ITEM_WIDTH = 57,
        DEFAULT_ITEM_SPACE = 3,


    //default max width when multiple,unit px
    DEFAULT_INPUT_MAX_WIDTH = 500,


    //max loaded item at a time when show all(min:dropdownMaxItem + 1)
    ALL_DROPDOWN_NUM = 100,


    //default search box animate duration,unit ms
    BOX_ANIMATE_TIME = 200,


    //default search delay,unit ms
    SEARCH_DELAY = 200,


    //default dropdown button width,unit px
    DROPDOWN_WIDTH = 24,


    //key code
    KEY = {
        BACKSPACE: 8,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    },


    //cache doms string
    doms = {
        wrapper: 'magicsearch-wrapper',
        box: 'magicsearch-box',
        arrow: 'magicsearch-arrow',
        loading: 'magicsearch-loading',
        hidden: 'magicsearch-hidden',
        items: 'multi-items',
        item: 'multi-item',
        close: 'multi-item-close'
    },
        isString = function isString(value) {
        return $.type(value) === 'string';
    },


    //transform string which like this : %username%
    formatParse = function formatParse(format, data) {
        var fields = format.match(new RegExp('\\' + SEPARATOR + '[^\\' + SEPARATOR + ']+\\' + SEPARATOR, 'g'));
        if (!fields) {
            return format;
        }
        for (var i = 0; i < fields.length; i++) {
            fields[i] = fields[i].replace(new RegExp('\\' + SEPARATOR, 'g'), '');
        }
        for (var _i = 0; _i < fields.length; _i++) {
            format = format.replace(SEPARATOR + fields[_i] + SEPARATOR, data[fields[_i]] ? data[fields[_i]] : 'error');
        }
        return format;
    },

    //delete px at ending
    deletePx = function deletePx(value) {
        var index = value.lastIndexOf('px');
        return index < 0 ? Number(value) : Number(value.substring(0, index));
    },

    //transform to positive num
    transform2PositiveNum = function transform2PositiveNum(value, key) {
        if (!$.isNumeric(value)) {
            value = MagicSearch.defaults[key];
        } else {
            value = Math.ceil(Number(value));
            if (value <= 0) {
                value = MagicSearch.defaults[key];
            }
        }
        return value;
    },

    //constructor
    MagicSearch = function MagicSearch(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
    };

    MagicSearch.defaults = {
        dataSource: [], //array or string or function
        type: '', //string
        ajaxOptions: {}, //object
        id: '', //string
        hidden: false, //boolean
        fields: '', //string or array
        format: '', //string(function?)
        inputFormat: '', //string
        maxShow: 5, //int
        isClear: true, //boolean
        showSelected: true, //boolean
        dropdownBtn: false, //boolean
        dropdownMaxItem: 8, //int
        multiple: false, //boolean
        maxItem: true, //boolean or int
        showMultiSkin: true, //boolean
        multiStyle: {}, //object
        multiField: '', //string
        focusShow: false, //boolean
        noResult: '', //string
        skin: '', //string
        disableRule: function disableRule(data) {
            return false;
        },
        success: function success($input, data) {
            return true;
        },
        afterDelete: function afterDelete($input, data) {
            return true;
        }
    };

    MagicSearch.prototype = {
        init: function init() {
            var _this = this;

            //to ensure unique,plus one at init everytime
            window.MagicSearch.index += 1;

            //you must do those things before ajax
            var $input = this.$element;
            this.options = $.extend({}, MagicSearch.defaults, this.options);

            this.props = {
                isFirstGetDataSource: true,
                style: $.extend({}, this.element.style),
                objDataSource: {},
                multiStyle: {
                    space: DEFAULT_ITEM_SPACE,
                    width: DEFAULT_ITEM_WIDTH
                }
            };

            //can bind on input text only
            if (!this.$element.is('input:text')) {
                console.error('magicsearch: Can not bind magicsearch to other elements except input which type is text.');
                return false;
            }

            if (!isString(this.options.id) || this.options.id === '') {
                console.error('magicsearch: The option id must be a string which is not empty.');
                return false;
            }

            if (this.options.multiple) {
                this.options.isClear = true;
            } else if (!this.options.isClear) {
                this.options.hidden = false;
            }

            this.props.styles = {
                borderTopWidth: deletePx($input.css('border-top-width')),
                borderRightWidth: deletePx($input.css('border-right-width')),
                borderBottomWidth: deletePx($input.css('border-bottom-width')),
                borderLeftWidth: deletePx($input.css('border-left-width')),
                paddingTop: deletePx($input.css('padding-top')),
                paddingRight: deletePx($input.css('padding-right')),
                paddingBottom: deletePx($input.css('padding-bottom')),
                paddingLeft: deletePx($input.css('padding-left')),
                maxWidth: deletePx($input.css('max-width')) || DEFAULT_INPUT_MAX_WIDTH
            };
            this.props.styles.height = $input.height() + this.props.styles.borderTopWidth + this.props.styles.borderBottomWidth + this.props.styles.paddingTop + this.props.styles.paddingBottom;
            this.props.styles.sightHeight = this.props.styles.height - this.props.styles.borderTopWidth - this.props.styles.borderBottomWidth;
            this.props.styles.width = $input.width() + this.props.styles.borderLeftWidth + this.props.styles.borderRightWidth + this.props.styles.paddingLeft + this.props.styles.paddingRight;

            var styles = this.props.styles;
            var ids = $input.attr('data-id');
            if ($input.parent().attr('data-belong') !== 'magicsearch') {
                var $wrapper = $('<div class="' + (doms.wrapper + (this.options.skin ? ' ' + this.options.skin : '')) + '" data-belong="magicsearch"></div>');
                $wrapper.css('width', styles.width);
                $input.wrap($wrapper);
            }
            var $magicsearch_wrapper = $input.parent();
            var inputDisplay = $input.css('display');
            //init magicsearch wrapper
            $magicsearch_wrapper.css({
                // if input's display is inline,regard as inline-block
                'display': inputDisplay === 'inline' ? 'inline-block' : inputDisplay,
                'float': $input.css('float'),
                'margin': $input.css('margin')
            });
            $magicsearch_wrapper.attr('data-index', window.MagicSearch.index);

            //init input
            $input.css({
                'margin': 0,
                'box-sizing': 'border-box',
                'width': styles.width,
                'height': styles.height
            });
            if ($input.attr('placeholder')) {
                $input.attr('data-placeholder', $input.attr('placeholder'));
            }
            $input.removeAttr('disabled');
            if (this.options.isClear) {
                $input.val('');
            }
            if (ids === undefined) {
                $input.attr('data-id', '');
                ids = '';
            }

            //init magicsearch box
            if ($magicsearch_wrapper.find('.' + doms.box).length === 0) {
                $magicsearch_wrapper.append('<div class="' + doms.box + '"></div>');
            }
            $magicsearch_wrapper.find('.' + doms.box).css({
                'top': styles.height
            });

            //init hidden
            if (this.options.hidden) {
                var name = $input.attr('name');
                var $hidden = $('<input class="' + doms.hidden + '" type="hidden" value="' + ids + '">');
                if (name) {
                    $hidden.attr('name', name);
                    $input.removeAttr('name');
                }
                $magicsearch_wrapper.append($hidden);
            }

            //init magicsearch arrow
            if (this.options.dropdownBtn) {
                var $arrow = $('<div class="' + doms.arrow + '"><i></i></div>');
                $input.addClass('dropdown');
                $input.css('padding-right', styles.paddingRight + DROPDOWN_WIDTH);
                $arrow.css({
                    'top': styles.borderTopWidth,
                    'bottom': styles.borderBottomWidth,
                    'right': styles.borderRightWidth
                });
                $magicsearch_wrapper.append($arrow);
            }

            if (this.options.type == 'ajax') {
                var $loading = $('<div class="' + doms.loading + '"><div></div></div>');
                $magicsearch_wrapper.append($loading);

                var loadingTimeout = setTimeout(function () {
                    $magicsearch_wrapper.find('.' + doms.loading).find('div').show();
                }, 500);

                var ajaxOptions = {
                    type: 'GET',
                    url: this.options.dataSource,
                    dataType: 'json',
                    error: function error() {
                        console.error('magicsearch: Error with xhr.Index: ' + window.MagicSearch.index);
                    },
                    success: function success(data) {}
                };
                ajaxOptions = $.extend({}, ajaxOptions, this.options.ajaxOptions);
                var success = ajaxOptions.success;
                ajaxOptions.success = function (data) {
                    clearTimeout(loadingTimeout);
                    _this.options.dataSource = data;
                    $magicsearch_wrapper.find('.' + doms.loading).remove();
                    _this.initAfterAjax();
                    success(data);
                };

                $.ajax(ajaxOptions);
            } else {
                this.initAfterAjax();
            }
            return this;
        },
        initAfterAjax: function initAfterAjax() {
            var $input = this.$element;
            var $magicsearch_wrapper = $input.parent();
            var styles = this.props.styles;
            var ids = $input.attr('data-id');
            if ($.isFunction(this.options.dataSource)) {
                this.options.dataSource = this.options.dataSource(this.$element);
            }
            if (!this.options.dataSource) {
                this.options.dataSource = [];
            } else if (isString(this.options.dataSource)) {
                if (this.options.dataSource.toLowerCase() == 'null') {
                    this.options.dataSource = [];
                } else {
                    try {
                        this.options.dataSource = $.parseJSON(this.options.dataSource);
                        if (!$.isArray(this.options.dataSource)) {
                            var dataSource = [];
                            for (var id in this.options.dataSource) {
                                dataSource.push(this.options.dataSource[id]);
                            }
                            this.options.dataSource = dataSource;
                        }
                    } catch (err) {
                        this.options.dataSource = [];
                        console.error('magicsearch: A problem is occured during parsing dataSource,please check.Index: ' + window.MagicSearch.index);
                        return false;
                    }
                }
            } else if (!$.isArray(this.options.dataSource)) {
                var _dataSource = [];
                for (var _id in this.options.dataSource) {
                    _dataSource.push(this.options.dataSource[_id]);
                }
                this.options.dataSource = _dataSource;
            }
            if (isString(this.options.fields)) {
                this.options.fields = [this.options.fields === '' ? this.options.id : this.options.fields];
            } else if (!$.isArray(this.options.fields)) {
                this.options.fields = [this.options.id];
            }
            if (!isString(this.options.format) || this.options.format === '') {
                this.options.format = SEPARATOR + this.options.id + SEPARATOR;
            }
            this.options.maxShow = transform2PositiveNum(this.options.maxShow, 'maxShow');
            if (this.options.dropdownBtn) {
                this.options.dropdownMaxItem = transform2PositiveNum(this.options.dropdownMaxItem, 'dropdownMaxItem');
            }
            if (this.options.multiple) {
                if (this.options.maxItem !== true) {
                    this.options.maxItem = transform2PositiveNum(this.options.maxItem, 'maxItem');
                }
                if (this.options.showMultiSkin) {
                    if (!isString(this.options.multiField) || this.options.multiField === '') {
                        this.options.multiField = this.options.id;
                    }
                }
                if (this.options.multiStyle) {
                    this.props.multiStyle.space = this.options.multiStyle.space ? this.options.multiStyle.space : DEFAULT_ITEM_SPACE;
                    this.props.multiStyle.width = this.options.multiStyle.width ? this.options.multiStyle.width : DEFAULT_ITEM_WIDTH;
                }
            }
            if (!$.isFunction(this.options.success)) {
                this.options.success = function ($input, data) {
                    return true;
                };
            }
            if (!$.isFunction(this.options.disableRule)) {
                this.options.disableRule = function (data) {
                    return false;
                };
            }
            if (ids !== '') {
                this.getDataSource();
            }
            //init multi items
            if (this.options.multiple) {
                $input.addClass('multi');
                if (this.options.showMultiSkin && $magicsearch_wrapper.find('.' + doms.items).length === 0) {
                    var $items = $('<div class="' + doms.items + '"></div>');
                    $items.css({
                        'top': this.props.multiStyle.space + styles.borderTopWidth,
                        'left': this.props.multiStyle.space + styles.borderLeftWidth,
                        'bottom': this.props.multiStyle.space + styles.borderBottomWidth,
                        'right': this.props.multiStyle.space + styles.borderRightWidth + (this.options.dropdownBtn ? DROPDOWN_WIDTH : 0)
                    });
                    $magicsearch_wrapper.append($items);
                }
            }

            if (this.options.multiple) {
                var idArr = ids ? ids.split(',') : [];

                if (this.options.maxItem !== true && idArr.length >= this.options.maxItem) {
                    $input.attr('disabled', 'disabled');
                    $magicsearch_wrapper.addClass('disabled');
                }

                //init default style
                if (this.options.showMultiSkin) {
                    var hasSetId = [];
                    for (var i = 0; i < idArr.length; i++) {
                        hasSetId.push(idArr[i]);
                        $input.attr('data-id', hasSetId.join(','));
                        if (this.options.hidden) {
                            $magicsearch_wrapper.find('.' + doms.hidden).val(hasSetId.join(','));
                        }
                        this.appendHtml(this.props.objDataSource[idArr[i]]);
                    }
                }
            } else {
                if (ids !== '') {
                    var data = this.props.objDataSource[ids];
                    var format = this.options.inputFormat ? this.options.inputFormat : this.options.format;
                    $input.val(formatParse(format, data));
                }
            }
        },
        destroy: function destroy() {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent();
            if ($magicsearch_wrapper.attr('data-belong') === 'magicsearch') {
                this.element.style = this.props.style;
                $input.css({
                    'margin': $magicsearch_wrapper.css('margin'),
                    'padding-top': this.props.styles.paddingTop,
                    'padding-right': this.props.styles.paddingRight,
                    'padding-bottom': this.props.styles.paddingBottom,
                    //'padding-left': this.props.styles.paddingLeft,
                    'height': this.props.styles.height,
                    'width': this.props.styles.width
                });
                var placeholder = $input.attr('data-placeholder');
                if (placeholder !== undefined) {
                    $input.attr('placeholder', placeholder);
                    $input.removeAttr('data-placeholder');
                }
                $input.removeClass('dropdown multi').removeAttr('disabled data-id');
                $input.siblings().remove();
                $input.unwrap();
                $input.off();
                $input.val('');
            }
        },
        getDataSource: function getDataSource() {
            var dataSource = this.options.dataSource;
            if (this.props.isFirstGetDataSource) {
                var objDataSource = {};
                for (var i = 0; i < dataSource.length; i++) {
                    for (var key in dataSource[i]) {
                        this.options.dataSource[i][key] = String(dataSource[i][key]);
                    }
                }
                this.props.isFirstGetDataSource = false;
                for (var _i2 = 0; _i2 < dataSource.length; _i2++) {
                    objDataSource[dataSource[_i2][this.options.id]] = dataSource[_i2];
                }
                this.props.objDataSource = objDataSource;
            }
            return this.options.dataSource;
        },
        setData: function setData() {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow),
                $ishover = $magicsearch_box.find('li.ishover');
            var options = this.options,
                ids = $input.attr('data-id'),
                data = this.props.objDataSource[$ishover.attr('data-id')];
            if (options.multiple) {
                if ($magicsearch_box.is(':hidden')) {
                    return;
                }
                $input.val('');

                var idArr = ids ? ids.split(',') : [];
                if (options.maxItem !== true && idArr.length >= options.maxItem) {
                    return this;
                }
                idArr.push($ishover.attr('data-id'));
                if (options.maxItem !== true && idArr.length == options.maxItem) {
                    $input.attr('disabled', 'disabled');
                    $magicsearch_wrapper.addClass('disabled');
                }
                $input.attr('data-id', idArr.join(','));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val(idArr.join(','));
                }
                if (options.showMultiSkin) {
                    this.appendHtml(data);
                }
            } else {
                $input.val(options.inputFormat ? formatParse(options.inputFormat, data) : $ishover.text());
                $input.attr('data-id', $ishover.attr('data-id'));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val($ishover.attr('data-id'));
                }
            }
            options.success($input, data);
            return this;
        },
        deleteData: function deleteData(id) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
            var that = this,
                delIdArr = id ? id.split(',') : [],
                ids = $input.attr('data-id'),
                idArr = ids ? ids.split(',') : [],
                options = this.options,
                styles = this.props.styles;

            if (!options.multiple) {
                id = $input.attr('data-id');
                $input.val('').attr('data-id', '');
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val('');
                }
                options.afterDelete($input, that.props.objDataSource[id]);
                return this;
            }

            var delCallBack = function delCallBack() {
                $(this).remove();
            };

            for (var i = 0; i < delIdArr.length; i++) {
                $magicsearch_wrapper.find('.' + doms.item + '[data-id="' + delIdArr[i] + '"]').fadeOut(400, delCallBack);
                idArr.splice(idArr.indexOf(delIdArr[i]), 1);
            }
            setTimeout(function () {
                var maxLineItem = parseInt((styles.maxWidth - (options.dropdownBtn ? DROPDOWN_WIDTH : 0) - styles.borderLeftWidth - styles.borderRightWidth - that.props.multiStyle.space) / (that.props.multiStyle.width + that.props.multiStyle.space));
                var lineNum = parseInt(idArr.length / maxLineItem);
                $input.attr('data-id', idArr.join(','));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val(idArr.join(','));
                }
                $magicsearch_wrapper.removeClass('disabled');
                $input.removeAttr('disabled');
                if (options.showMultiSkin) {
                    if (idArr.length === 0 && $input.attr('data-placeholder')) {
                        $input.attr('placeholder', $input.attr('data-placeholder'));
                    }
                    //$input.css('padding-left', idArr.length % maxLineItem * (that.props.multiStyle.width + that.props.multiStyle.space) + styles.paddingLeft);
                    $input.css('height', styles.height + lineNum * styles.sightHeight);
                    $input.css('padding-top', lineNum * styles.sightHeight + styles.paddingTop);
                    $magicsearch_box.css('top', styles.height + lineNum * styles.sightHeight);
                    if (lineNum === 0) {
                        var minWidth = (idArr.length % maxLineItem + 1) * (that.props.multiStyle.width + that.props.multiStyle.space) + that.props.multiStyle.space * 2 + styles.borderLeftWidth + styles.borderRightWidth + (options.dropdownBtn ? DROPDOWN_WIDTH : 0);
                        //$input.css('min-width', minWidth);
                        //$magicsearch_wrapper.css('min-width', minWidth);
                    }
                }
                if (delIdArr.length == 1) {
                    options.afterDelete($input, that.props.objDataSource[delIdArr[0]]);
                }
            }, 400);
            return this;
        },
        searchData: function searchData(isAll, isScroll) {
            var $input = this.$element,
                $magicsearch_box = $input.parent().find('.' + doms.box);

            var options = this.options,
                dataJson = this.getDataSource(),
                ids = $input.attr('data-id'),
                idArr = ids ? ids.split(',') : [],
                inputVal = $.trim($input.val()),
                htmlStr = '',
                data = [],
                isAppendHtml = true;

            //if is not scroll,clean all items first
            if (isScroll !== true) {
                $magicsearch_box.html('');
            }
            if (inputVal === '' && !isAll) {
                return this;
            }
            //get the match data
            if (isAll) {
                var page = $input.data('page') || 1;
                data = dataJson.slice(0);
                //skip selected data
                if (!options.showSelected) {
                    for (var i = 0, num = 0; i < data.length; i++) {
                        var index = idArr.indexOf(data[i][options.id]);
                        if (index > -1) {
                            data.splice(i, 1);
                            num++;
                            i--;
                            if (num == idArr.length) {
                                break;
                            }
                        }
                    }
                }
                //if page less than total page,page plus one
                if (page <= Math.ceil(data.length / ALL_DROPDOWN_NUM)) {
                    $input.data('page', page + 1);
                }
                data = data.slice((page - 1) * ALL_DROPDOWN_NUM, page * ALL_DROPDOWN_NUM);
                //will not appending html if data's length is zero when scrolling
                if (page != 1 && data.length === 0) {
                    isAppendHtml = false;
                }
            } else {
                var inputVals = [].concat(_toConsumableArray(new Set(inputVal.toLowerCase().split(' '))));
                var inputData = [];
                for (var _i3 = 0; _i3 < inputVals.length; _i3++) {
                    if (inputVals[_i3] === '') {
                        continue;
                    }
                    inputData.push({ value: inputVals[_i3], flag: false });
                }
                //search match data
                for (var _i4 = 0; _i4 < dataJson.length; _i4++) {
                    //skip selected
                    if (!options.showSelected) {
                        if (idArr.includes(dataJson[_i4][options.id])) {
                            continue;
                        }
                    }
                    inputData = inputData.map(function (item) {
                        item.flag = false;
                        return item;
                    });
                    for (var j = 0; j < options.fields.length; j++) {
                        for (var k = 0; k < inputData.length; k++) {
                            if (dataJson[_i4][options.fields[j]] !== null && dataJson[_i4][options.fields[j]].toLowerCase().includes(inputData[k].value)) {
                                inputData[k].flag = true;
                            }
                        }
                        var isMatch = inputData.every(function (item) {
                            return item.flag;
                        });
                        if (isMatch) {
                            data.push(dataJson[_i4]);
                            break;
                        }
                    }
                    if (data.length >= options.maxShow) {
                        break;
                    }
                }
            }

            //generate html string
            if (data.length === 0) {
                var noResult = options.noResult ? options.noResult : '&#x672a;&#x641c;&#x7d22;&#x5230;&#x7ed3;&#x679c;';
                htmlStr = '<span class="no-result">' + noResult + '</span>';
            } else {
                //delete empty input
                var _inputVals = [].concat(_toConsumableArray(new Set(inputVal.split(' ')))).filter(function (item) {
                    return item !== '';
                });
                var tempArr = [];
                for (var _i5 = 0; _i5 < _inputVals.length - 1; _i5++) {
                    for (var _j = _i5 + 1; _j < _inputVals.length; _j++) {
                        tempArr.push(_inputVals[_i5] + ' ' + _inputVals[_j]);
                    }
                }
                _inputVals = _inputVals.concat(tempArr);
                //locate highlight chars
                var dataHighlight = void 0;
                if (!isAll) {
                    dataHighlight = $.extend(true, [], data);
                    data.forEach(function (item, index) {
                        options.fields.forEach(function (field) {
                            var posArr = [];
                            if (item[field] !== null) {
                                for (var _i6 = 0; _i6 < item[field].length; _i6++) {
                                    posArr[_i6] = 0;
                                }
                                _inputVals.forEach(function (value) {
                                    var position = item[field].toLowerCase().indexOf(value.toLowerCase());
                                    if (position > -1) {
                                        for (var _i7 = position; _i7 < value.length + position; _i7++) {
                                            posArr[_i7] = 1;
                                        }
                                    }
                                });
                            }
                            var tmpPosArr = [];
                            var hasStarted = false,
                                start = -1,
                                length = 0;
                            for (var _i8 = posArr.length - 1; _i8 >= 0; _i8--) {
                                if (posArr[_i8] == 1) {
                                    if (!hasStarted) {
                                        hasStarted = true;
                                        start = _i8;
                                    } else {
                                        start--;
                                    }
                                    length++;
                                    if (_i8 === 0) {
                                        tmpPosArr.push({ start: start, length: length });
                                    }
                                } else {
                                    if (hasStarted) {
                                        hasStarted = false;
                                        tmpPosArr.push({ start: start, length: length });
                                        length = 0;
                                    }
                                }
                            }
                            if (dataHighlight[index][field] !== undefined) {
                                dataHighlight[index][field] = tmpPosArr;
                            }
                        });
                    });
                }

                htmlStr += '<ul>';
                data.forEach(function (item, index) {
                    var tmpItem = $.extend({}, item);
                    htmlStr += '<li class="';
                    htmlStr += options.disableRule(item) ? 'disabled' : 'enabled';
                    if (options.showSelected) {
                        htmlStr += idArr.includes(item[options.id]) ? ' selected' : '';
                    }
                    htmlStr += '" data-id="' + (item[options.id] === undefined ? '' : item[options.id]) + '"';
                    if (!isAll) {
                        options.fields.forEach(function (field) {
                            if (item[field] !== null) {
                                dataHighlight[index][field].forEach(function (value) {
                                    var matchStr = tmpItem[field].substr(value.start, value.length);
                                    tmpItem[field] = tmpItem[field].replace(new RegExp(matchStr, 'i'), '<span class="keyword">' + matchStr + '</span>');
                                });
                            }
                        });
                    }
                    htmlStr += ' title="' + formatParse(options.format, item) + '">' + formatParse(options.format, tmpItem) + '</li>';
                });
                htmlStr += '</ul>';
            }

            //create dom
            if (isAll) {
                if (isAppendHtml) {
                    $magicsearch_box.html($magicsearch_box.html() + htmlStr);
                }
                $magicsearch_box.addClass('all');
            } else {
                $magicsearch_box.html(htmlStr);
                $magicsearch_box.removeClass('all').css('max-height', 'none');
            }
            return this;
        },
        showSearchBox: function showSearchBox(callback) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            if ($magicsearch_box.is(':visible')) {
                return false;
            }
            //rotate the dropdown button 180deg
            if (this.options.dropdownBtn) {
                var $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
                $magicsearch_arrow.removeClass('arrow-rotate-360');
                $magicsearch_arrow.addClass('arrow-rotate-180');
            }
            $magicsearch_box.slideDown(BOX_ANIMATE_TIME, callback);
            return this;
        },
        hideSearchBox: function hideSearchBox(isClear) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            if (!$magicsearch_box.is(':visible')) {
                return false;
            }
            if (isClear === undefined) {
                if (this.options.isClear && (this.options.multiple || $input.attr('data-id') === '')) {
                    $input.val('');
                }
            } else {
                if (isClear) {
                    $input.val('');
                }
            }
            //rotate the dropdown button 360deg
            if (this.options.dropdownBtn) {
                var $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
                $magicsearch_arrow.removeClass('arrow-rotate-180');
                $magicsearch_arrow.addClass('arrow-rotate-360');
            }
            setTimeout(function () {
                $magicsearch_box.scrollTop(0);
            }, BOX_ANIMATE_TIME - 1);
            $magicsearch_box.slideUp(BOX_ANIMATE_TIME, function () {
                $magicsearch_box.html('');
            });
            return this;
        },
        appendHtml: function appendHtml(data) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow),
                $ishover = $magicsearch_box.find('li.ishover');
            var options = this.options,
                styles = this.props.styles,
                that = this;

            var idArr = $input.attr('data-id').split(',');
            if ($input.attr('placeholder')) {
                $input.removeAttr('placeholder');
            }
            var maxLineItem = parseInt((styles.maxWidth - (options.dropdownBtn ? DROPDOWN_WIDTH : 0) - styles.borderLeftWidth - styles.borderRightWidth - that.props.multiStyle.space) / (that.props.multiStyle.width + that.props.multiStyle.space));

            //create item and insert into items
            var $item = $('<div class="' + doms.item + '" data-id="' + data[options.id] + '" title="' + formatParse(options.format, data) + '"><span>' + formatParse(SEPARATOR + options.multiField + SEPARATOR, data) + '</span><a class="' + doms.close + '" data-id="' + data[options.id] + '" href="javascript:;"></a></div>');
            $item.css({
                'height': styles.sightHeight - that.props.multiStyle.space * 2,
                'width': that.props.multiStyle.width,
                'margin-bottom': that.props.multiStyle.space * 2,
                'margin-right': that.props.multiStyle.space,
                'line-height': styles.sightHeight - that.props.multiStyle.space * 2 - 2 + 'px'
            });
            $item.find('.' + doms.close).css({
                'top': parseInt((styles.sightHeight - that.props.multiStyle.space * 2 - 2 - 12) / 2)
            });

            var lineNum = parseInt(idArr.length / maxLineItem);
            //$input.css('padding-left', styles.paddingLeft + idArr.length % maxLineItem * (that.props.multiStyle.width + that.props.multiStyle.space));
            if (idArr.length % maxLineItem === 0) {
                $input.css('height', styles.height + lineNum * styles.sightHeight);
                $input.css('padding-top', lineNum * styles.sightHeight);
                $magicsearch_box.css('top', styles.height + lineNum * styles.sightHeight);
            } else {
                if (lineNum === 0) {
                    var minWidth = (idArr.length % maxLineItem + 1) * (that.props.multiStyle.width + that.props.multiStyle.space) + that.props.multiStyle.space * 2 + styles.borderLeftWidth + styles.borderRightWidth + (options.dropdownBtn ? DROPDOWN_WIDTH : 0);
                    //$input.css('min-width', minWidth);
                    //$magicsearch_wrapper.css('min-width', minWidth);
                }
            }

            //bind click event on delete button
            $item.find('.' + doms.close).click(function () {
                that.deleteData($(this).attr('data-id')).hideSearchBox();
            });
            $magicsearch_wrapper.find('.' + doms.items).append($item);
        }
    };

    $.fn.magicsearch = function (options) {
        var hasDropdownBtn = false;
        var searchTimeout = null;
        var preInput = '';
        var jqo = this.each(function () {
            var $this = $(this);
            var magicSearch = $.data(this, 'magicsearch');
            if (magicSearch) {
                magicSearch.destroy();
            }
            magicSearch = new MagicSearch(this, options);
            if (magicSearch.init() === false) {
                return;
            }
            $.data(this, 'magicsearch', magicSearch);
            var selfOptions = magicSearch.options;
            var $magicsearch_wrapper = $this.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            var dropdown = function dropdown() {
                if ($magicsearch_wrapper.hasClass('disabled')) {
                    return false;
                }
                if ($magicsearch_box.is(':visible')) {
                    magicSearch.hideSearchBox();
                } else {
                    $magicsearch_box.css({
                        'max-height': selfOptions.dropdownMaxItem * 30 + 8
                    });
                    $magicsearch_box.unbind('scroll');
                    $this.data('page', 1);
                    magicSearch.searchData(true).showSearchBox(function () {
                        $magicsearch_box.on('scroll', function (e) {
                            if (this.scrollHeight - $(this).scrollTop() < 300) {
                                magicSearch.searchData(true, true);
                            }
                        });
                    });
                }
            };
            $this.off().on('keyup', function (e) {
                var $_this = $(this);
                if (e.which == KEY.ESC) {
                    $_this.val('').focus();
                    magicSearch.hideSearchBox();
                } else if (e.which == KEY.DOWN) {
                    var $li = $magicsearch_box.find('li');
                    var $ishover = $magicsearch_box.find('li.ishover');
                    if ($li.length > 0) {
                        if ($ishover.length > 0) {
                            $ishover.toggleClass('ishover');
                            if ($ishover.next().length > 0) {
                                $ishover.next().toggleClass('ishover');
                            } else {
                                $magicsearch_box.find('li:first').toggleClass('ishover');
                            }
                        } else {
                            $magicsearch_box.find('li:first').toggleClass('ishover');
                        }
                    }
                    return false;
                } else if (e.which == KEY.UP) {
                    var _$li = $magicsearch_box.find('li');
                    var _$ishover = $magicsearch_box.find('li.ishover');
                    if (_$li.length > 0) {
                        if (_$ishover.length > 0) {
                            _$ishover.toggleClass('ishover');
                            if (_$ishover.prev().length > 0) {
                                _$ishover.prev().toggleClass('ishover');
                            } else {
                                $magicsearch_box.find('li:last').toggleClass('ishover');
                            }
                        } else {
                            $magicsearch_box.find('li:last').toggleClass('ishover');
                        }
                    }
                    return false;
                } else if (e.which == KEY.ENTER) {
                    var _$ishover2 = $magicsearch_box.find('li.ishover');
                    if (_$ishover2.length > 0) {
                        _$ishover2.trigger('click');
                    }
                } else if (e.which == KEY.LEFT || e.which == KEY.RIGHT) {
                    return true;
                } else {
                    var currentInput = $_this.val();
                    if ($.trim(preInput) == $.trim(currentInput)) {
                        return true;
                    }
                    if (currentInput !== '') {
                        if ($.trim(currentInput) === '') {
                            magicSearch.hideSearchBox(e.which == KEY.BACKSPACE || e.which == KEY.SPACE ? false : undefined);
                            return false;
                        }
                        //hide search box when key up
                        if (!selfOptions.multiple && $_this.attr('data-id') !== '') {
                            magicSearch.hideSearchBox();
                            return;
                        }
                        clearTimeout(searchTimeout);
                        searchTimeout = setTimeout(function () {
                            magicSearch.searchData().showSearchBox();
                        }, SEARCH_DELAY);
                    } else {
                        magicSearch.hideSearchBox();
                    }
                }
            }).on('keydown', function (e) {
                var $_this = $(this);
                if (e.which == KEY.ESC) {} else if (e.which == KEY.UP) {
                    return false;
                } else if (e.which == KEY.DOWN) {
                    return false;
                } else if (e.which == KEY.ENTER) {
                    return !$magicsearch_box.is(':visible');
                } else if (e.which == KEY.BACKSPACE) {
                    preInput = $_this.val();
                    if (selfOptions.multiple) {
                        var $last_multi_item = $magicsearch_wrapper.find('.' + doms.items + ' .' + doms.item + ':last');
                        if (selfOptions.showMultiSkin && $_this.val() === '') {
                            magicSearch.deleteData($last_multi_item.attr('data-id')).hideSearchBox();
                        }
                    } else {
                        if ($(this).attr('data-id') !== '') {
                            magicSearch.deleteData();
                            magicSearch.hideSearchBox();
                        }
                    }
                } else if (e.which == KEY.LEFT || e.which == KEY.RIGHT) {
                    return true;
                } else {
                    preInput = $_this.val();
                    if (preInput !== '') {
                        //set empty value when key down
                        if (!selfOptions.multiple && $_this.attr('data-id') !== '') {
                            magicSearch.deleteData();
                            return;
                        }
                    }
                }
            }).on('focus', function () {
                $magicsearch_wrapper.addClass('focus');
                if (!selfOptions.isClear && $this.val() !== '' && $this.attr('data-id') === '') {
                    magicSearch.searchData().showSearchBox();
                } else if (selfOptions.focusShow) {
                    dropdown();
                }
            }).on('blur', function () {
                $magicsearch_wrapper.removeClass('focus');
                magicSearch.hideSearchBox();
            });

            $magicsearch_box.off().on('mousedown', 'ul', function () {
                return false;
            }).on('mouseenter', 'li', function () {
                $(this).parent().find('li.ishover').removeClass('ishover');
                $(this).addClass('ishover');
            }).on('mouseleave', 'li', function () {
                $(this).removeClass('ishover');
            }).on('click', 'li', function () {
                var $li = $(this);
                if ($li.hasClass('selected') && selfOptions.multiple) {
                    magicSearch.deleteData($li.attr('data-id')).hideSearchBox();
                } else {
                    magicSearch.setData().hideSearchBox();
                }
            });

            //When the option of dropdownBtn is true,bind the related event
            if (selfOptions.dropdownBtn) {
                hasDropdownBtn = true;
                $magicsearch_wrapper.on('click', '.' + doms.arrow, function () {
                    return dropdown();
                });
            }
            $this.on('clear', function () {
                $this.val('');
                if (selfOptions.multiple) {
                    if (selfOptions.showMultiSkin) {
                        magicSearch.deleteData($this.attr('data-id'));
                    } else {
                        $this.attr('data-id', '');
                        if (selfOptions.hidden) {
                            $magicsearch_wrapper.find('.' + doms.hidden).val('');
                        }
                    }
                } else {
                    $this.attr('data-id', '');
                    if (selfOptions.hidden) {
                        $magicsearch_wrapper.find('.' + doms.hidden).val('');
                    }
                }
            }).on('update', function (e, options) {
                //update dataSource
                if (options.dataSource !== undefined) {
                    var tmpDataSource = options.dataSource;
                    if (isString(tmpDataSource)) {
                        if (options.dataSource.toLowerCase() == 'null') {
                            tmpDataSource = [];
                        } else {
                            try {
                                tmpDataSource = $.parseJSON(options.dataSource);
                                if (!$.isArray(tmpDataSource)) {
                                    var dataSource = [];
                                    for (var id in tmpDataSource) {
                                        dataSource.push(tmpDataSource[id]);
                                    }
                                    tmpDataSource = dataSource;
                                }
                            } catch (err) {
                                tmpDataSource = [];
                                console.error('magicsearch: The dataSource you updated is wrong,please check.');
                            }
                        }
                    }
                    magicSearch.props.isFirstGetDataSource = true;
                    magicSearch.options.dataSource = tmpDataSource;
                }
            }).on('set', function (e, options) {
                var originId = magicSearch.$element.attr('data-id');
                var multi = magicSearch.options.multiple;
                magicSearch.destroy();
                magicSearch.$element.attr('data-id', options.override || !multi ? options.id : [].concat(_toConsumableArray(new Set((originId ? originId.split(',') : []).concat(options.id.split(','))))));
                magicSearch.$element.magicsearch(magicSearch.options);
            }).on('destroy', function () {
                magicSearch.destroy();
            });
            $magicsearch_wrapper.on('click', '.' + doms.items, function (e) {
                if ($(e.target).is('.' + doms.items)) {
                    $this.focus();
                }
            }).on('mousedown', '.' + doms.items, function () {
                return false;
            });
        });

        if (hasDropdownBtn && !window.MagicSearch.hasBindBody) {
            $('body').on('mousedown', function (e) {
                var $target = $(e.target),
                    $magicsearch_wrapper = $(this).find('.' + doms.wrapper + ' .' + doms.box + ':visible').first().parent(),
                    $input = $magicsearch_wrapper.find('input:text');
                var index = $magicsearch_wrapper.attr('data-index');
                if (index !== undefined && !$target.is('.' + doms.wrapper + '[data-index="' + index + '"] *')) {
                    $.data($input.get(0), 'magicsearch').hideSearchBox();
                }
            });
            window.MagicSearch.hasBindBody = true;
        }
        return jqo;
    };

    window.MagicSearch = {
        v: '1.0.2',
        index: 0,
        hasBindBody: false
    };
});
(function (legend, $) {
    legend.add = function (opts) {
        let lengendContent = `
        <div class="all-legend-container" id="all-legend-container">
    <div class="patient-assign-legend generic-legend field-no-user-select pedigree_family_record_ui" id="legend-assign" style="
    min-width:150px;width: 175px; margin-top: 8px; clear: both">
       <div class="legend-box-controls-closed">
       <span id="legend-horizontal-expand" style="float: left;" class="fa fa-angle-double-left" title="expand"></span>
       <span id="legend-vertical-expand" class="fa legend-box-button-right legend-action-restore fa-angle-double-up" title="restore" style="float: right;"></span>
       <span class="glyphicon glyphicon-cog" title="settings" style="float: right; padding-right: 10px;" id="settings"></span>
       <div class="legend-minimized-title field-no-user-select" style="">
       &emsp;Legend </div></div>
       <div id="legend-content"  class="legend-box"  style="display: block">
            <input id="dragged-legend-name" style="display:none;"/>
            <h2 class="legend-title field-no-user-select">Conditions <input id="legend-condition-checkbox" type="checkbox" class="legend-hide-show-checkbox" checked></h2>
            <ul class="candidategene-list abnormality-list" id="legend-condition-list">
            </ul>
            <h2 class="legend-title field-no-user-select">Phenotypes</h2>
            <ul class="candidategene-list abnormality-list" id="legend-phenotype-list"></ul>
            <h2 class="legend-title field-no-user-select">Candidate Genes</h2>
            <ul class="candidategene-list abnormality-list" id="legend-candidate-list">
            <li><div></div></li></ul>
            <h2 class="legend-title field-no-user-select">Confirmed Causal Genes</h2>
            <ul class="candidategene-list abnormality-list" id="legend-causal-list">
            <li><div></div></li></ul>
            <h2 class="legend-title field-no-user-select">Carrier Genes</h2>
            <ul class="candidategene-list abnormality-list" id="legend-carrier-list">
            <li><div></div></li></ul>
            <h2 class="legend-title field-no-user-select">Cancers<input type="checkbox" id="legend-cancer-checkbox" class="legend-hide-show-checkbox" checked></h2>
            <ul class="candidategene-list abnormality-list" id="legend-cancer-list"></ul>
        </div>
    </div>
    <div class="patient-assign-legend generic-legend field-no-user-select pedigree_family_record_ui" id="samples-assign" style="
    width: 175px; min-width: 150px; margin-top: 8px; clear: both">
       <div class="legend-box-controls-closed" id="samples-legend-box-controls"><div class="legend-minimized-title field-no-user-select" style="">
       Samples </div><span class="fa legend-box-button-right legend-action-restore fa-angle-double-down" title="restore"></span></div>
       <div id="sample-content">
</div>
    </div>
</div>`;

        if ($('.all-legend-container').length < 1) {
            $('#' + opts.targetDiv).append(lengendContent);
        }

        //set click listeners
        $('#legend-vertical-expand').click(function () {
            $(this).toggleClass('fa-angle-double-up fa-angle-double-down legend-action-minimize legend-action-restore');
            $('#legend-content').toggle();
        });

        $('#legend-horizontal-expand').click(function () {
            if ($(this).hasClass('fa-angle-double-left')) {
                $('#legend-assign').css('width', '245px');
            } else {
                $('#legend-assign').css('width', '175px');
            }
            $(this).toggleClass('fa fa-angle-double-left fa fa-angle-double-right');
        });

        $('#samples-legend-box-controls').click(function () {
            $(this).toggleClass('legend-box-controls-open legend-box-controls-close');
            let arrowButton = $(this).find('.legend-box-button-right');
            arrowButton.toggleClass('fa-angle-double-up fa-angle-double-down legend-action-minimize legend-action-restore');
            if (arrowButton.hasClass('fa-angle-double-up')) {
                $('#sample-content').css({'height': '50px'});
                $('#samples-assign').css({'min-width':'245px'});
            } else {
                $('#sample-content').css('height', '0');
                $('#samples-assign').css({ 'min-width':'150px'});
            }
        });

        window.drag = function (event) {
            event.target.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text', 'sample');
            });
            $('#dragged-legend-name').val('');
            $('#dragged-legend-name').val($(event.target).find('input').val());
        };

        $.each(opts.conditions, function (k, v) {
            var list_id = k + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + ' class="condition-legend">' +
                '<div><span class="dot" style="background-color:' + v.color + '"></span>&nbsp;<span class="condition-name">'
                + v.name + '</span>&nbsp;<span class="case"></span><input style="display: none;" value=' + k + ' /></div></li>');
            $('#legend-condition-list').append($legend_elem);
            $legend_elem.hide();
        });

        $.each(opts.phenotypes, function (index) {
            var list_id = opts.phenotypes[index].type + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + '><div>' + opts.phenotypes[index].name + '<input style="display: none;" value='+opts.phenotypes[index].type+' ></div></li>');
            $('#legend-phenotype-list').append($legend_elem);
            $legend_elem.hide();
            for (var i = 0; i < opts.dataset.length; i++) {
                if (opts.dataset[i].hasOwnProperty(opts.phenotypes[index].type)) {
                    legend.addPhenotypesToLegend(opts.phenotypes[index].type);
                }
            }
        });

        $.each(opts.candidate_genotype, function (index) {
            var list_id = opts.candidate_genotype[index].type + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + '><div>' + opts.candidate_genotype[index].name + '<input style="display: none;" value='+opts.candidate_genotype[index].type+' ></div></li>');
            $('#legend-candidate-list').append($legend_elem);
            $legend_elem.hide();
            for (var i = 0; i < opts.dataset.length; i++) {
                if (opts.dataset[i].hasOwnProperty(opts.candidate_genotype[index].type)) {
                    legend.addCandidateToLegend(opts.candidate_genotype[index].type);
                }
            }
        });

        $.each(opts.causal_genotype, function (index) {
            var list_id = opts.causal_genotype[index].type + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + '><div>' + opts.causal_genotype[index].name + '<input style="display: none;" value='+opts.causal_genotype[index].type+' ></div></li>');
            $('#legend-causal-list').append($legend_elem);
            $legend_elem.hide();
            for (var i = 0; i < opts.dataset.length; i++) {
                if (opts.dataset[i].hasOwnProperty(opts.causal_genotype[index].type)) {
                    legend.addCausalsToLegend(opts.causal_genotype[index].type);
                }
            }
        });

        $.each(opts.carrier_genotype, function (index) {
            var list_id = opts.carrier_genotype[index].type + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + '><div>' + opts.carrier_genotype[index].name + '<input style="display: none;" value='+opts.carrier_genotype[index].type+'></div></li>');
            $('#legend-carrier-list').append($legend_elem);
            $legend_elem.hide();
            for (var i = 0; i < opts.dataset.length; i++) {
                if (opts.dataset[i].hasOwnProperty(opts.carrier_genotype[index].type)) {
                    legend.addCarriersToLegend(opts.carrier_genotype[index].type);
                }
            }
        });

        $.each(opts.conditions, function (k, v) {
            for (var i = 0; i < opts.dataset.length; i++) {
                if (opts.dataset[i].hasOwnProperty(k)) {
                    legend.addConditionLegendToOpts(opts, k, v);
                }
            }
        });

        let all_cancers = opts.cancers.concat(opts.common_cancers);
        $.each(all_cancers, function (index) {
            var list_id = all_cancers[index].type + '_legend';
            var $legend_elem = $('<li draggable="true" ondragstart="drag(event)" id=' + list_id + ' class="cancer-legend">' +
                '<div><span class="dot" style="background-color:' + all_cancers[index].colour + '"></span>&nbsp;<span class="cancer-name">'
                + all_cancers[index].name + '</span>&nbsp;<span class="case"></span><input style="display: none;" value=' + all_cancers[index].type + ' /></div></li>');
            $('#legend-cancer-list').append($legend_elem);
            $legend_elem.hide();
        });

        legend.showCancerLegends(opts);

        if (opts.hasOwnProperty('show_cancer_colors') && !opts['show_cancer_colors']) {
            $("#legend-cancer-checkbox").prop('checked', false);
        }

        $('#legend-cancer-checkbox').change(function () {
            legend.showHideCancerColors(opts);
        });

        if (opts.hasOwnProperty('show_condition_colors') && !opts['show_condition_colors']) {
            $("#legend-condition-checkbox").prop('checked', false);
        }

        $('#legend-condition-checkbox').change(function () {
            legend.showHideConditionColors(opts);
        });

        $(document).on('click', '#settings', function() {
            legend.openEditDialog(opts);
        });
    };

    legend.addConditionLegendToOpts = function (opts, k, v) {
        if (opts.hasOwnProperty('condition_legend')) {
            var alreadyAdded = false;
            opts.condition_legend.forEach(function (array_values) {
                if (k === array_values['condition_id']) {
                    alreadyAdded = true;
                    return;
                }
            });
            if (!alreadyAdded) {
                opts['condition_legend'].push({'condition_id': k, 'color': v.color});
            }
        } else {
            opts['condition_legend'] = [{'condition_id': k, 'color': v.color}];
        }
        var condition_legend_id = k + '_legend';
        var caseCount = legend.getCaseCount(opts, k);
        var caseText = '';
        if (caseCount > 1) {
            caseText = '(' + caseCount + ' cases)';
        } else {
            caseText = '(' + caseCount + ' case)';
        }
        $('#' + condition_legend_id).find('.case').text('');
        $('#' + condition_legend_id).find('.case').text(caseText);
        $('#' + condition_legend_id).show();
    };

    legend.addPhenotypesToLegend = function (k) {
        if (opts.hasOwnProperty('phenotype_legend')) {
            var alreadyAdded = false;
            for (var i = 0; i < opts.phenotype_legend.length; i++) {
                if (k === opts.phenotype_legend[i]) {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded) {
                opts['phenotype_legend'].push(k);
            }
        } else {
            opts['phenotype_legend'] = [k];
        }
        var condition_legend_id = k + '_legend';
        $('#' + condition_legend_id).show();
    };

    legend.addCandidateToLegend = function (k) {
        if (opts.hasOwnProperty('candidate_legend')) {
            var alreadyAdded = false;
            for (var i = 0; i < opts.candidate_legend.length; i++) {
                if (k === opts.candidate_legend[i]) {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded) {
                opts['candidate_legend'].push(k);
            }
        } else {
            opts['candidate_legend'] = [k];
        }
        var candidate_legend_id = k + '_legend';
        $('#' + candidate_legend_id).show();
    };

    legend.addCausalsToLegend = function (k) {
        if (opts.hasOwnProperty('causal_legend')) {
            var alreadyAdded = false;
            for (var i = 0; i < opts.causal_legend.length; i++) {
                if (k === opts.causal_legend[i]) {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded) {
                opts['causal_legend'].push(k);
            }
        } else {
            opts['causal_legend'] = [k];
        }
        var causal_legend_id = k + '_legend';
        $('#' + causal_legend_id).show();
    };

    legend.addCarriersToLegend = function (k) {
        if (opts.hasOwnProperty('carrier_legend')) {
            var alreadyAdded = false;
            for (var i = 0; i < opts.carrier_legend.length; i++) {
                if (k === opts.carrier_legend[i]) {
                    alreadyAdded = true;
                    break;
                }
            }

            if (!alreadyAdded) {
                opts['carrier_legend'].push(k);
            }
        } else {
            opts['carrier_legend'] = [k];
        }
        var carrier_legend_id = k + '_legend';
        $('#' + carrier_legend_id).show();
    };

    legend.addCancersToLegend = function (k) {
        if (opts.hasOwnProperty('cancer_legend')) {
            var newType = true;
            for (var i = 0; i < opts.cancer_legend.length; i++) {
                if (k === opts.cancer_legend[i].type) {
                    var cancerCount = opts.cancer_legend[i].count;
                    opts.cancer_legend[i].count = cancerCount + 1;
                    newType = false;
                    break;
                }
            }
            if (newType) {
                opts.cancer_legend.push({'type': k, 'count': 1});
            }
        } else {
            opts['cancer_legend'] = [{'type': k, 'count': 1}];
        }
    };

    legend.deleteConditionsFromOpts = function (opts, person, k, legend_type, target_div) {
        if (opts.hasOwnProperty(legend_type)) {
            var otherPersonHasCondition = false;
            for (var i = 0; i < opts[legend_type].length; i++) {
                if ((opts[legend_type][i]['condition_id'] === k)) {
                    otherPersonHasCondition = true;
                    var caseCount = legend.getCaseCount(opts, k) - 1;
                    var caseText = '';
                    if (caseCount > 1) {
                        caseText = '(' + caseCount + ' cases)';
                    } else {
                        caseText = '(' + caseCount + ' case)';
                    }
                    $('#' + k + '_legend').find('.case').text('');
                    $('#' + k + '_legend').find('.case').text(caseText);
                    break;
                }
            }
            if (!otherPersonHasCondition) {
                for (var j = 0; j < opts[legend_type].length; j++) {
                    if (opts[legend_type][j]['condition_id'] === k) {
                        opts[legend_type].slice(j, 1);
                        break;
                    }
                }
                $('#' + k + '_legend').hide();
            }
        }
    };

    legend.getCaseCount = function(opts, k) {
        let case_count = 0;
        opts.dataset.forEach(function (person) {
            if (person.hasOwnProperty(k)) {
                case_count++;
            }
        });
        return case_count;
    };

    legend.showCancerLegends = function (opts) {
        $.each(opts.cancer_legend, function (index) {
            var cancer_legend_id = opts.cancer_legend[index].type + '_legend';
            if (opts.cancer_legend[index].count > 0) {
                var caseCount = opts.cancer_legend[index].count;
                var caseText = '';
                if (caseCount > 1) {
                    caseText = '(' + caseCount + ' cases)';
                } else {
                    caseText = '(' + caseCount + ' case)';
                }
                $('#' + cancer_legend_id).find('.case').text('');
                $('#' + cancer_legend_id).find('.case').text(caseText);
                $('#' + cancer_legend_id).show();
            } else {
                $('#' + cancer_legend_id).hide();
            }
        });
    };

    legend.showHideCancerColors = function (opts) {
        if ($('#legend-cancer-checkbox').is(':checked')) {
            if (opts.hasOwnProperty('show_cancer_colors')) {
                opts['show_cancer_colors'] = true;
            }
        } else {
            opts['show_cancer_colors'] = false;
        }
        opts.dataset = ptree.copy_dataset(pedcache.current(opts));
        ptree.rebuild(opts);
    };

    legend.showHideConditionColors = function (opts) {
        if ($('#legend-condition-checkbox').is(':checked')) {
            if (opts.hasOwnProperty('show_condition_colors')) {
                opts['show_condition_colors'] = true;
            }
        } else {
            opts['show_condition_colors'] = false;
        }
        opts.dataset = ptree.copy_dataset(pedcache.current(opts));
        ptree.rebuild(opts);
    };

    //open settings dialog
    legend.openEditDialog = function (opts) {
        let $nodeProperties = $('#node_properties');
        if ($nodeProperties.length > 0) {
            $nodeProperties.remove();
        }
        let $targetDiv = $('#' + opts.targetDiv);
        $targetDiv.append('<div id="node_properties"></div>');
        let $node_properties = $('#node_properties');
        let dialogWidth = ($(window).width() > 400 ? 450 : $(window).width() - 30);
        $node_properties.dialog({
            autoOpen: false,
            appendTo: '#pedigrees',
            width: dialogWidth,
            dialogClass: 'node-properties-dialog'
        });

        let selectedSetting = pedcache.get_hierarchy_settings(opts, String(1)); //Used default depth value 1
        function isChecked(id) {
            if (selectedSetting.includes(id) || selectedSetting.includes('all'))
                return 'checked';
            return '';
        }

        var table = "<table id='person_details' class='table'>" +
            "<tr><td><div class='form-group' style='text-align: left;'>Select the legends to display under the nodes of this generation line</div>" +
            "<div class='checkbox'><label style='width: 100%; text-align: left;'><input id='s_name' type='checkbox' value='' " + isChecked('name') + ">Node ID</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_full_name' type='checkbox' value='' " + isChecked('full_name') + ">Name</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_id' type='checkbox' value='' " + isChecked('id') + ">Identifier</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_age_dob' type='checkbox' value='' " + isChecked('age_dob') + ">Age and date of birth</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_dod_cod' type='checkbox' value='' " + isChecked('dod_cod') + ">Date and cause of death</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_ethnicity_country' type='checkbox' value='' " + isChecked('ethnicity_country') + ">Ethnicity and Country of origin</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_phenotypes_symptoms' type='checkbox' value='' " + isChecked('phenotypes_symptoms') + ">Phenotypes, clinical symptoms</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_conditions' type='checkbox' value='' " + isChecked('conditions') + ">Conditions</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_genotypes_can_genes' type='checkbox' value='' " + isChecked('genotypes_can_genes') + ">Genotype: candidate genes</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_genotypes_con_genes' type='checkbox' value='' " + isChecked('genotypes_con_genes') + ">Genotype: confirmed causal genes</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_genotypes_car_genes' type='checkbox' value='' " + isChecked('genotypes_car_genes') + ">Genotype: carrier genes</label>" +
            "<label style='width: 100%; text-align: left;'><input id='s_risk_factors_cancers' type='checkbox' value='' " + isChecked('risk_factors_cancers') + ">Risk factors: cancers</label></div></td></tr>"
            + "</table>";
        $node_properties.html(table);
        $('.node-properties-dialog').css('float', 'left');
        $node_properties.dialog('open');
        var changeOccurred = false;
        $('#node_properties input[type=radio], #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties input[type=number]').change(function () {
            var prevDepth = -1;
            d3.selectAll('g').each(function (d1) {
                if (d1 && d1.depth) {
                    changeOccurred = true;
                    if (prevDepth !== d1.depth) {
                        legend.save_hierarchy_settings(opts, String(d1.depth));
                    }
                    prevDepth = d1.depth;
                }
            });
            if (changeOccurred) {
                ptree.rebuild(opts);
            }
        });
        pedigree_form.update(opts);
    };

    //save each hierarchy level settings
    legend.save_hierarchy_settings = function (opts, hierarchy) {
        var switches = ['name', 'full_name', 'id', 'age_dob', 'dod_cod', 'ethnicity_country', 'phenotypes_symptoms', 'conditions',
            'genotypes_can_genes', 'genotypes_con_genes', 'genotypes_car_genes', 'risk_factors_cancers'];
        let values = [];
        switches.map((id) => {
            let s = $('#s_' + id);
            if (s.is(":checked")) {
                values.push(id)
            }
        });
        $("#" + opts.targetDiv).empty();
        opts.dataset = ptree.copy_dataset(pedcache.current(opts));

        function markAsCheked(ids) {
            ids.map((id) => {
                d3.select('#s_' + id).property('checked', true)
            })
        }

        if (values.includes('all')) {
            values = switches;
            markAsCheked(switches)
        } else {
            markAsCheked(values)
        }

        pedcache.save_hierarchy_settings(opts, hierarchy, JSON.stringify(values));

    };

})(window.legend = window.legend || {}, jQuery);
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
// Pedigree Tree Utils
(function (pedigree_util, $, undefined) {

    pedigree_util.buildTree = function (opts, person, root, partnerLinks, id) {
        if (typeof person.children === typeof undefined)
            person.children = pedigree_util.getChildren(opts.dataset, person);

        if (typeof partnerLinks === typeof undefined) {
            partnerLinks = [];
            id = 1;
        }

        var nodes = pedigree_util.flatten(root);
        //console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);
        var partners = [];
        $.each(person.children, function (i, child) {
            $.each(opts.dataset, function (j, p) {
                if (((child.name === p.mother) || (child.name === p.father)) && child.id === undefined) {
                    var m = pedigree_util.getNodeByName(nodes, p.mother);
                    var f = pedigree_util.getNodeByName(nodes, p.father);
                    m = (m !== undefined ? m : pedigree_util.getNodeByName(opts.dataset, p.mother));
                    f = (f !== undefined ? f : pedigree_util.getNodeByName(opts.dataset, p.father));
                    if (!contains_parent(partners, m, f))
                        partners.push({'mother': m, 'father': f});
                }
            });
        });
        $.merge(partnerLinks, partners);

        $.each(partners, function (i, ptr) {
            var mother = ptr.mother;
            var father = ptr.father;
            mother.children = [];
            var parent = {
                name: ptree.makeid(4),
                hidden: true,
                parent: null,
                father: father,
                mother: mother,
                children: pedigree_util.getChildren(opts.dataset, mother, father)
            };

            var midx = pedigree_util.getIdxByName(opts.dataset, mother.name);
            var fidx = pedigree_util.getIdxByName(opts.dataset, father.name);
            if (!('id' in father) && !('id' in mother))
                id = setChildrenId(person.children, id);

            // look at grandparents index
            var gp = pedigree_util.get_grandparents_idx(opts.dataset, midx, fidx);
            if (gp.fidx < gp.midx) {
                father.id = id++;
                parent.id = id++;
                mother.id = id++;
            } else {
                mother.id = id++;
                parent.id = id++;
                father.id = id++;
            }
            id = updateParent(mother, parent, id, nodes, opts);
            id = updateParent(father, parent, id, nodes, opts);
            person.children.push(parent);
        });
        id = setChildrenId(person.children, id);

        $.each(person.children, function (i, p) {
            id = pedigree_util.buildTree(opts, p, root, partnerLinks, id)[1];
        });
        return [partnerLinks, id];
    };

    // update parent node and sort twins
    function updateParent(p, parent, id, nodes, opts) {
        // add to parent node
        if ('parent_node' in p)
            p.parent_node.push(parent);
        else
            p.parent_node = [parent];

        // check twins lie next to each other
        if (p.mztwin || p.dztwins) {
            var twins = pedigree_util.getTwins(opts.dataset, p);
            for (var i = 0; i < twins.length; i++) {
                var twin = pedigree_util.getNodeByName(nodes, twins[i].name);
                if (twin)
                    twin.id = id++;
            }
        }
        return id;
    }

    function setChildrenId(children, id) {
        // sort twins to lie next to each other
        children.sort(function (a, b) {
            if (a.mztwin && b.mztwin && a.mztwin == b.mztwin)
                return 0;
            else if (a.dztwin && b.dztwin && a.dztwin == b.dztwin)
                return 0;
            else if (a.mztwin || b.mztwin || a.dztwin || b.dztwin)
                return 1;
            return 0;
        });

        $.each(children, function (i, p) {
            if (p.id === undefined) p.id = id++;
        });
        return id;
    }

    pedigree_util.isProband = function (obj) {
        return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
    };

    pedigree_util.setProband = function (dataset, name, is_proband) {
        $.each(dataset, function (i, p) {
            if (name === p.name)
                p.proband = is_proband;
            else
                delete p.proband;
        });
    };

    pedigree_util.getProbandIndex = function (dataset) {
        var proband;
        $.each(dataset, function (i, val) {
            if (pedigree_util.isProband(val)) {
                proband = i;
                return proband;
            }
        });
        return proband;
    };

    pedigree_util.getChildren = function (dataset, mother, father) {
        var children = [];
        if (mother.sex === 'F')
            $.each(dataset, function (i, p) {
                if (mother.name === p.mother)
                    if (!father || father.name == p.father)
                        children.push(p);
            });
        return children;
    };

    function contains_parent(arr, m, f) {
        for (var i = 0; i < arr.length; i++)
            if (arr[i].mother === m && arr[i].father === f)
                return true;
        return false;
    }

    // get the siblings of a given individual - sex is an optional parameter
    // for only returning brothers or sisters
    pedigree_util.getSiblings = function (dataset, person, sex) {
        if (!person.mother || person.noparents)
            return [];

        return $.map(dataset, function (p, i) {
            return p.name !== person.name && !('noparents' in p) && p.mother &&
            (p.mother === person.mother && p.father === person.father) &&
            (!sex || p.sex == sex) ? p : null;
        });
    };

    // get the siblings + adopted siblings
    pedigree_util.getAllSiblings = function (dataset, person, sex) {
        return $.map(dataset, function (p, i) {
            return p.name !== person.name && !('noparents' in p) && p.mother &&
            (p.mother === person.mother && p.father === person.father) &&
            (!sex || p.sex == sex) ? p : null;
        });
    };

    // get the mono/di-zygotic twin(s)
    pedigree_util.getTwins = function (dataset, person) {
        var sibs = pedigree_util.getSiblings(dataset, person);
        var twin_type = (person.mztwin ? "mztwin" : "dztwin");
        return $.map(sibs, function (p, i) {
            return p.name !== person.name && p[twin_type] == person[twin_type] ? p : null;
        });
    };

    // get the adopted siblings of a given individual
    pedigree_util.getAdoptedSiblings = function (dataset, person) {
        return $.map(dataset, function (p, i) {
            return p.name !== person.name && 'noparents' in p &&
            (p.mother === person.mother && p.father === person.father) ? p : null;
        });
    };

    pedigree_util.getAllChildren = function (dataset, person, sex) {
        return $.map(dataset, function (p, i) {
            return !('noparents' in p) &&
            (p.mother === person.name || p.father === person.name) &&
            (!sex || p.sex === sex) ? p : null;
        });
    };

    // get the depth of the given person from the root
    pedigree_util.getDepth = function (dataset, name) {
        var idx = pedigree_util.getIdxByName(dataset, name);
        var depth = 1;

        while (idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)) {
            idx = pedigree_util.getIdxByName(dataset, dataset[idx].mother);
            depth++;
        }
        return depth;
    };

    // given an array of people get an index for a given person
    pedigree_util.getIdxByName = function (arr, name) {
        var idx = -1;
        $.each(arr, function (i, p) {
            if (name === p.name) {
                idx = i;
                return idx;
            }
        });
        return idx;
    };

    // get the nodes at a given depth sorted by their x position
    pedigree_util.getNodesAtDepth = function (fnodes, depth, exclude_names) {
        return $.map(fnodes, function (p, i) {
            return p.depth == depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) == -1 ? p : null;
        }).sort(function (a, b) {
            return a.x - b.x;
        });
    };

    // convert the partner names into corresponding tree nodes
    pedigree_util.linkNodes = function (flattenNodes, partners) {
        var links = [];
        for (var i = 0; i < partners.length; i++)
            links.push({
                'mother': pedigree_util.getNodeByName(flattenNodes, partners[i].mother.name),
                'father': pedigree_util.getNodeByName(flattenNodes, partners[i].father.name)
            });
        return links;
    };

    // get ancestors of a node
    pedigree_util.ancestors = function (dataset, node) {
        var ancestors = [];

        function recurse(node) {
            if (node.data) node = node.data;
            if ('mother' in node && 'father' in node && !('noparents' in node)) {
                recurse(pedigree_util.getNodeByName(dataset, node.mother));
                recurse(pedigree_util.getNodeByName(dataset, node.father));
            }
            ancestors.push(node);
        }

        recurse(node);
        return ancestors;
    }

    // test if two nodes are consanguinous partners
    pedigree_util.consanguity = function (node1, node2, opts) {
        var ancestors1 = pedigree_util.ancestors(opts.dataset, node1);
        var ancestors2 = pedigree_util.ancestors(opts.dataset, node2);
        var names1 = $.map(ancestors1, function (ancestor, i) {
            return ancestor.name;
        });
        var names2 = $.map(ancestors2, function (ancestor, i) {
            return ancestor.name;
        });
        // Detect common ancestor and also allow a flag on a child to turn on consang. parents too. This allows this to be
        // expressed in a partial pedigree i.e. where there are not enough generations shown to model consanguity normally.
        return names1.some(function (name) {
                return names2.indexOf(name) !== -1;
            }) ||
            pedigree_util.getChildren(opts.dataset, node1.data, node2.data).some(function (it) {
                return it.consanguineous_parents;
            });
    }

    // return a flattened representation of the tree
    pedigree_util.flatten = function (root) {
        var flat = [];

        function recurse(node) {
            if (node.children)
                node.children.forEach(recurse);
            flat.push(node);
        }

        recurse(root);
        return flat;
    };

    // Adjust D3 layout positioning.
    // Position hidden parent node centring them between father and mother nodes. Remove kinks
    // from links - e.g. where there is a single child plus a hidden child
    pedigree_util.adjust_coords = function (opts, root, flattenNodes) {
        function recurse(node) {
            if (node.children) {
                node.children.forEach(recurse);

                if (node.data.father !== undefined) { 	// hidden nodes
                    var father = pedigree_util.getNodeByName(flattenNodes, node.data.father.name);
                    var mother = pedigree_util.getNodeByName(flattenNodes, node.data.mother.name);
                    var xmid = (father.x + mother.x) / 2;
                    if (!pedigree_util.overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
                        node.x = xmid;   // centralise parent nodes
                        var diff = node.x - xmid;
                        if (node.children.length == 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
                            if (!(node.children[0].data.hidden && node.children[1].data.hidden)) {
                                var child1 = (node.children[0].data.hidden ? node.children[1] : node.children[0]);
                                var child2 = (node.children[0].data.hidden ? node.children[0] : node.children[1]);
                                if (((child1.x < child2.x && xmid < child2.x) || (child1.x > child2.x && xmid > child2.x)) &&
                                    !pedigree_util.overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])) {
                                    child1.x = xmid;
                                }
                            }
                        } else if (node.children.length == 1 && !node.children[0].data.hidden) {
                            if (!pedigree_util.overlap(opts, root.descendants(), xmid, node.children[0].depth, [node.children[0].data.name]))
                                node.children[0].x = xmid;
                        } else {
                            if (diff !== 0 && !nodesOverlap(opts, node, diff, root)) {
                                if (node.children.length == 1) {
                                    node.children[0].x = xmid;
                                } else {
                                    var descendants = node.descendants();
                                    if (opts.DEBUG)
                                        console.log('ADJUSTING ' + node.data.name + ' NO. DESCENDANTS ' + descendants.length + ' diff=' + diff);
                                    for (var i = 0; i < descendants.length; i++) {
                                        if (node.data.name !== descendants[i].data.name)
                                            descendants[i].x -= diff;
                                    }
                                }
                            }
                        }
                    } else if ((node.x < father.x && node.x < mother.x) || (node.x > father.x && node.x > mother.x)) {
                        node.x = xmid;   // centralise parent nodes if it doesn't lie between mother and father
                    }
                }
            }
        }

        recurse(root);
        recurse(root);
    };

    // test if moving siblings by diff overlaps with other nodes
    function nodesOverlap(opts, node, diff, root) {
        var descendants = node.descendants();
        var descendantsNames = $.map(descendants, function (descendant, i) {
            return descendant.data.name;
        });
        var nodes = root.descendants();
        for (var i = 0; i < descendants.length; i++) {
            var descendant = descendants[i];
            if (node.data.name !== descendant.data.name) {
                var xnew = descendant.x - diff;
                if (pedigree_util.overlap(opts, nodes, xnew, descendant.depth, descendantsNames))
                    return true;
            }
        }
        return false;
    }

    // test if x position overlaps a node at the same depth
    pedigree_util.overlap = function (opts, nodes, xnew, depth, exclude_names) {
        for (var n = 0; n < nodes.length; n++) {
            if (depth == nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) == -1) {
                if (Math.abs(xnew - nodes[n].x) < (opts.symbol_size * 1.15))
                    return true;
            }
        }
        return false;
    };

    // given a persons name return the corresponding d3 tree node
    pedigree_util.getNodeByName = function (nodes, name) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].data && name === nodes[i].data.name)
                return nodes[i];
            else if (name === nodes[i].name)
                return nodes[i];
        }
    };

    // given the name of a url param get the value
    pedigree_util.urlParam = function (name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results === null)
            return null;
        else
            return results[1] || 0;
    };

    // get grandparents index
    pedigree_util.get_grandparents_idx = function (dataset, midx, fidx) {
        var gmidx = midx;
        var gfidx = fidx;
        while ('mother' in dataset[gmidx] && 'mother' in dataset[gfidx] &&
        !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])) {
            gmidx = pedigree_util.getIdxByName(dataset, dataset[gmidx].mother);
            gfidx = pedigree_util.getIdxByName(dataset, dataset[gfidx].mother);
        }
        return {'midx': gmidx, 'fidx': gfidx};
    };

    // Set or remove proband attributes.
    // If a value is not provided the attribute is removed from the proband.
    pedigree_util.proband_attr = function (opts, key, value) {
        var newdataset = ptree.copy_dataset(pedcache.current(opts));
        var proband = newdataset[pedigree_util.getProbandIndex(newdataset)];
        if (!proband) {
            console.warn("No proband defined");
            return;
        }
        if (value) {
            if (key in proband) {
                if (proband[key] === value)
                    return;
                try {
                    if (JSON.stringify(proband[key]) === JSON.stringify(value))
                        return;
                } catch (e) {
                }
            }
            proband[key] = value;
        } else {
            if (key in proband)
                delete proband[key];
            else
                return;
        }
        ptree.syncTwins(newdataset, proband);
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    }

    // add a child to the proband; giveb sex, age, yob and breastfeeding months (optional)
    pedigree_util.proband_add_child = function (opts, sex, age, yob, breastfeeding) {
        var newdataset = ptree.copy_dataset(pedcache.current(opts));
        var proband = newdataset[pedigree_util.getProbandIndex(newdataset)];
        if (!proband) {
            console.warn("No proband defined");
            return;
        }
        var newchild = ptree.addchild(newdataset, proband, sex, 1)[0];
        newchild.age = age;
        newchild.yob = yob;
        if (breastfeeding !== undefined)
            newchild.breastfeeding = breastfeeding;
        opts.dataset = newdataset;
        ptree.rebuild(opts);
        return newchild.name;
    }

    // check by name if the individual exists
    pedigree_util.exists = function (opts, name) {
        return pedigree_util.getNodeByName(pedcache.current(opts), name) !== undefined;
    };

    //check if a node is a childNode
    pedigree_util.isChildNode = function(opts, name){
        let newdataset = ptree.copy_dataset(pedcache.current(opts));
        let result =[];
        newdataset.map((d)=>{
            if(d.father===name||d.mother===name){
                result.push(d)
            }
        });
        return result.length===0
    };

    // print options and dataset
    pedigree_util.print_opts = function (opts) {
        $("#pedigree_data").remove();
        $("body").append("<div id='pedigree_data'></div>");
        var key;
        for (var i = 0; i < opts.dataset.length; i++) {
            var person = "<div class='row'><strong class='col-md-1 text-right'>" + opts.dataset[i].name + "</strong><div class='col-md-11'>";
            for (key in opts.dataset[i]) {
                if (key === 'name') continue;
                if (key === 'parent')
                    person += "<span>" + key + ":" + opts.dataset[i][key].name + "; </span>";
                else if (key === 'children') {
                    if (opts.dataset[i][key][0] !== undefined)
                        person += "<span>" + key + ":" + opts.dataset[i][key][0].name + "; </span>";
                } else
                    person += "<span>" + key + ":" + opts.dataset[i][key] + "; </span>";
            }
            $("#pedigree_data").append(person + "</div></div>");

        }
        $("#pedigree_data").append("<br /><br />");
        for (key in opts) {
            if (key === 'dataset') continue;
            $("#pedigree_data").append("<span>" + key + ":" + opts[key] + "; </span>");
        }
    };
}(window.pedigree_util = window.pedigree_util || {}, jQuery));


// Pedigree Tree Builder
(function (ptree, $, undefined) {
    ptree.roots = {};

    function appendDonorCircles(node, opts) {
        function circlePath(cx, cy, r) {
            return 'm ' + cx + ' ' + (-cy) + ' m -' + r + ', 0 a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0 a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';
        }
        function offset(d) {
            let offset=0;
           if(d.data.status === 4 || d.data.status === 6){
                offset = -0.36 * opts.symbol_size;
            }
            else if(d.data.sex ==='F'){
                offset = -0.08 * opts.symbol_size;
            }  else if(d.data.sex ==='U'){
                offset = -0.20 * opts.symbol_size;
            }
            return offset
        }
        const INSIDE_OFFSET = opts.symbol_size/2;
        const ICON_SIZE = opts.symbol_size * (2.5/3);
        let offsetY = 0.04*opts.symbol_size;
        node.append('text')
            .filter(function (d) {
                return !d.data.hidden && (d.data.conceived_by_donor_egg);
            })
            .attr('x', function () {
                return 1.5 * opts.symbol_size;
            })
            .style('text-anchor', 'middle')
            .attr('y', function (d) {
                return -(INSIDE_OFFSET + 0.5*opts.symbol_size+ ICON_SIZE/2-4) + offset(d)-offsetY
            }).text('D');
        node.append("path")
            .filter(function (d) {
                return !d.data.hidden && (d.data.conceived_by_donor_egg);
            }).attr("d", function (d) {
            return `M 0,${-INSIDE_OFFSET+offset(d)} 
            l ${1.5 * opts.symbol_size},${-0.5*opts.symbol_size} 
            ${circlePath(0, ICON_SIZE/2+offsetY,ICON_SIZE/2+offsetY)}`})
            .attr("shape-rendering", "geometricPrecision")
            .style("stroke", 'grey')
            .style("stroke-width", function (d) {
            return ".05em";})
            .style('fill', 'transparent');
        node.append('text')
            .filter(function (d) {
                return !d.data.hidden && (d.data.conceived_by_donor_sperm);
            })
            .attr('x', function () {
                return -1.5 * opts.symbol_size;
            })
            .attr('y', function (d) {
                return -(INSIDE_OFFSET + 0.5*opts.symbol_size+ ICON_SIZE/2-4) + offset(d)
            })
            .style('text-anchor', 'middle')
            .text('D');
        node.append("path")
            .filter(function (d) {
                return !d.data.hidden && (d.data.conceived_by_donor_sperm);
            }).attr("d", function (d) {
            return `M 0, ${-INSIDE_OFFSET+offset(d)} l ${-1.5 * opts.symbol_size},${-0.5*opts.symbol_size} 
            m ${-ICON_SIZE/2}  ${-ICON_SIZE} l ${ICON_SIZE} ,0 0,${ICON_SIZE}   ${-ICON_SIZE},0 z
            `
        }).style("stroke", 'grey').style("stroke-width", function (d) {
            return ".05em";
        }).style('fill', 'transparent');
    }

    ptree.build = function (options) {
        var opts = $.extend({ // defaults
            targetDiv: 'pedigree_edit',
            dataset: [{"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
                {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
                {"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}],
            width: 600,
            height: 400,
            symbol_size: 35,
            zoomIn: 1.0,
            zoomOut: 1.0,
            diseases: [{'type': 'breast_cancer', 'colour': '#F68F35'},
                {'type': 'ovarian_cancer', 'colour': '#4DAA4D'},
                {'type': 'pancreatic_cancer', 'colour': '#4289BA'},
                {'type': 'prostate_cancer', 'colour': '#D5494A'}],
            labels: ['stillbirth', 'age', 'yob', 'alleles'],
            font_size: '.75em',
            font_family: 'Helvetica',
            font_weight: 700,
            background: "#EEE",
            node_background: '#fdfdfd',
            validate: true,
            showPanZoomControl: false,
            DEBUG: false
        }, options);
        if ($("#fullscreen").length === 0) {
            // add undo, redo, fullscreen buttons and event listeners once
            pbuttons.add(opts);
            io.add(opts);
        }

        panZoom.add(opts);
        legend.add(opts)

        if (pedcache.nstore(opts) == -1)
            pedcache.add(opts);

        pbuttons.updateButtons(opts);

        // validate pedigree data
        ptree.validate_pedigree(opts);
        // group top level nodes by partners
        opts.dataset = group_top_level(opts.dataset);

        //pre-process opts : Include or remove data info
        (function () {
            const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi') ;
           //replace space in disease type with -
            opts.diseases.forEach((disease)=>{
                disease.type = disease.type.replace(specialRegex, '-')
            });
            Object.keys(opts.conditions).forEach(function(key) {
                if(specialRegex.test( key)){
                    let newKey =  key.replace(specialRegex, '-');
                    let value  = opts.conditions[key];
                    delete opts.conditions[key];
                    opts.conditions[newKey] = value;
                }
            });
        })();


        if (opts.DEBUG)
            pedigree_util.print_opts(opts);
        var svg_dimensions = get_svg_dimensions(opts);
        var svg = d3.select("#" + opts.targetDiv)
            .append("svg:svg")
            .attr("width", svg_dimensions.width)
            .attr("height", svg_dimensions.height);

        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("rx", 6)
            .attr("ry", 6)
            .style("stroke", "darkgrey")
            .style("fill", opts.background) // or none
            .style("stroke-width", 1);

        var xytransform = pedcache.getposition(opts);  // cached position
        var xtransform = xytransform[0];
        var ytransform = xytransform[1];
        let initialZoom  = 1;
        if (xytransform.length === 3) {
            initialZoom = xytransform[2];
        }

        if (xtransform === null) {
            xtransform = opts.symbol_size / 2;
            ytransform = (-opts.symbol_size * 2.5);
        }
        var ped = svg.append("g")
            .attr("class", "diagram")
            .attr("transform", "translate(" + xtransform + "," + ytransform + ") scale(" + initialZoom + ")");

        var top_level = $.map(opts.dataset, function (val, i) {
            return 'top_level' in val && val.top_level ? val : null;
        });
        var hidden_root = {
            name: 'hidden_root',
            id: 0,
            hidden: true,
            children: top_level
        };

        var partners = pedigree_util.buildTree(opts, hidden_root, hidden_root)[0];
        var root = d3.hierarchy(hidden_root);
        ptree.roots[opts.targetDiv] = root;

        /// get score at each depth used to adjust node separation
        var tree_dimensions = ptree.get_tree_dimensions(opts);
        if (opts.DEBUG)
            console.log('opts.width=' + svg_dimensions.width + ' width=' + tree_dimensions.width +
                ' opts.height=' + svg_dimensions.height + ' height=' + tree_dimensions.height);

        var treemap = d3.tree().separation(function (a, b) {
            return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
        }).size([tree_dimensions.width, tree_dimensions.height]);

        var nodes = treemap(root.sort(function (a, b) {
            return a.data.id - b.data.id;
        }));
        var flattenNodes = nodes.descendants();

        // check the number of visible nodes equals the size of the pedigree dataset
        var vis_nodes = $.map(opts.dataset, function (p, i) {
            return p.hidden ? null : p;
        });
        if (vis_nodes.length !== opts.dataset.length) {
            throw create_err('NUMBER OF VISIBLE NODES DIFFERENT TO NUMBER IN THE DATASET');
        }

        pedigree_util.adjust_coords(opts, nodes, flattenNodes);

        var ptrLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);
        check_ptr_links(opts, ptrLinkNodes);   // check for crossing of partner lines

        var node = ped.selectAll(".node")
            .data(nodes.descendants())
            .enter()
            .append("g")
            .attr("transform", function (d, i) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        // provide a border to the node
        node.append("path")
            .filter(function (d) {
                return !d.data.hidden;
            })
            .attr("shape-rendering", "geometricPrecision")
            .attr("transform", function (d) {
                return d.data.sex == "U"  && d.data.status !== 4 && d.data.status !== 6 ? "rotate(45)" : "";
            })
            .attr("d", d3.symbol().size(function (d) {
                return (opts.symbol_size * opts.symbol_size) + 2;
            })
                .type(function (d) {
                    if (d.data.status === 4 || d.data.status == 6)
                        return d3.symbolTriangle;
                    return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;
                }))
            .style("stroke", function (d) {
                return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
            })
            .style("stroke-width", function (d) {
                return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
            })
            .style("stroke-dasharray", function (d) {
                return !d.data.exclude ? null : ("3, 3");
            })
            .style("fill", "none");

        // set a clippath
        node.append("clipPath")
            .attr("id", function (d) {
                return d.data.name;
            }).append("path")
            .filter(function (d) {
                return !(d.data.hidden && !opts.DEBUG);
            })
            .attr("class", "node")
            .attr("transform", function (d) {
                return d.data.sex == "U"  && d.data.status !== 4 && d.data.status !== 6 ? "rotate(45)" : "";
            })
            .attr("d", d3.symbol().size(function (d) {
                if (d.data.hidden)
                    return opts.symbol_size * opts.symbol_size / 5;
                return opts.symbol_size * opts.symbol_size;
            })
                .type(function (d) {
                    if (d.data.status === 4 || d.data.status == 6)
                        return d3.symbolTriangle;
                    return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;
                }));

        //load hierarchy level settings
        let hierarchy_settings = {};

        // pie plots for disease colours
        var pienode = node.selectAll("pienode")
            .data(function (d) {     		// set the disease data for the pie plot
                hierarchy_settings[d.depth] = pedcache.get_hierarchy_settings(opts, String(d.depth)) || [];
                var ncancers = 0;
                var cancers = $.map(opts.diseases, function (val, i) {
                    if (prefixInObj(opts.diseases[i].type, d.data)) {
                        if (opts.diseases[i].type.replace('_', ' ').includes('cancer') && opts.hasOwnProperty('show_cancer_colors') && !opts['show_cancer_colors']) {
                            return 0;
                        }
                        if (opts.diseases[i].type.replace('_', ' ').includes('condition') && opts.hasOwnProperty('show_condition_colors') && !opts['show_condition_colors']) {
                            return 0;
                        }
                        ncancers++;
                        return 1;
                    } else return 0;
                });
                if (ncancers === 0) cancers = [1];
                return [$.map(cancers, function (val, i) {
                    return {
                        'cancer': val, 'ncancers': ncancers, 'id': d.data.name,
                        'sex': d.data.sex, 'proband': d.data.proband, 'hidden': d.data.hidden,
                        'affected': d.data.affected,
                        'exclude': d.data.exclude,
                        'carrier_status':d.data.carrier_status
                    };
                })];
            })
            .enter()
            .append("g");

        pienode.selectAll("path")
            .data(d3.pie().value(function (d) {
                return d.cancer;
            }))
            .enter().append("path")
            .attr("clip-path", function (d) {
                return "url(#" + d.data.id + ")";
            }) // clip the rectangle
            .attr("class", "pienode")
            .attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size))
            .style("fill", function (d, i) {
                if(d.data.carrier_status === 'affected') {
                    return '#7f7f7f';
                }
                if (d.data.exclude)
                    return 'lightgrey';
                if (d.data.ncancers === 0) {
                    if (d.data.affected)
                        return 'darkgrey';
                    return opts.node_background;
                }
                return opts.diseases[i].colour;
            });

        // adopted in/out brackets
        node.append("path")
            .filter(function (d) {
                return !d.data.hidden && (d.data.adopted_in === true || d.data.adopted_out === true);
            })
            .attr("d", function (d) {
                {
                    function get_bracket(dx, dy, indent) {
                        return "M" + (dx + indent) + "," + dy +
                            "L" + dx + " " + dy +
                            "L" + dx + " " + (dy + (opts.symbol_size * 1.28)) +
                            "L" + dx + " " + (dy + (opts.symbol_size * 1.28)) +
                            "L" + (dx + indent) + "," + (dy + (opts.symbol_size * 1.28))
                    }

                    var dx = -(opts.symbol_size * 0.66);
                    var dy = -(opts.symbol_size * 0.64);
                    var indent = opts.symbol_size / 4;
                    return get_bracket(dx, dy, indent) + get_bracket(-dx, dy, -indent);
                }
            })
            .style("stroke", function (d) {
                return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
            })
            .style("stroke-width", function (d) {
                return ".1em";
            })
            .style("stroke-dasharray", function (d) {
                return !d.data.exclude ? null : ("3, 3");
            })
            .style("fill", "none");

        //append donor circle;
        appendDonorCircles(node, opts);

        // alive status = 0; dead status = 1
        var status = node.append('line')
            .filter(function (d) {
                return d.data.status === 1 || d.data.status === 5 || d.data.status === 6;
            })
            .style("stroke", "black")
            .attr("x1", function (d, i) {
                return -0.6 * opts.symbol_size;
            })
            .attr("y1", function (d, i) {
                return 0.6 * opts.symbol_size;
            })
            .attr("x2", function (d, i) {
                return 0.6 * opts.symbol_size;
            })
            .attr("y2", function (d, i) {
                return -0.6 * opts.symbol_size;
            });

        // names of individuals
        addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), (d)=>{
                return  -(0.12 * opts.symbol_size);
            },
            function (d) {
                return   d.data.individual_role && d.data.individual_role !=='none' ? d.data.individual_role : '';
            });

       /* // names of individuals
        addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), (d)=>{
               if(d.data.display_name){
                   d.y_offset = -(0.1 * opts.symbol_size);
               }
                return d.y_offset;
            },
            function (d) {
                if (opts.DEBUG)
                    return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
                return 'display_name' in d.data ? d.data.display_name : '';
            });
*/
        var font_size = parseInt(getPx(opts.font_size)) + 4;


        /*		var warn = node.filter(function (d) {
                    return (!d.data.age || !d.data.yob) && !d.data.hidden;
                }).append("text")
                .attr('font-family', 'FontAwesome')
                .attr("x", ".25em")
                .attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size))
                .html("\uf071");
                warn.append("svg:title").text("incomplete");*/
        // display label defined in opts.labels e.g. alleles/genotype data
        for (var ilab = 0; ilab < opts.labels.length; ilab++) {
            var label = opts.labels[ilab];
            addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size),
                function (d) {
                    if (!hierarchy_settings[d.depth].includes(label) || !d.data[label]) {
                        if(label === 'name'){
                            d.y_offset = (font_size * 2.25) + 10;
                        }
                        return;
                    }
                    d.y_offset = ( !d.y_offset ? (font_size * 2.25) + 10 : d.y_offset + font_size);
                    return d.y_offset;
                },
                function (d) {
                    if(!hierarchy_settings[d.depth].includes(label)){
                        return '' ;
                    }
                    if (d.data[label]) {
                        if (label === 'alleles') {
                            var alleles = "";
                            var vars = d.data.alleles.split(';');
                            for (var ivar = 0; ivar < vars.length; ivar++) {
                                if (vars[ivar] !== "") alleles += vars[ivar] + ';';
                            }
                            return alleles;
                        } else if (label === 'age') {
                            return d.data[label] + 'y';
                        }
                        return d.data[label];
                    }
                }, 'indi_details');
        }
        //gestation
        addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size),
            function (d) {
                if (d.data.status < 2 || !d.data.gestation)
                    return;
                d.y_offset = (!d.y_offset ? (font_size * 2.25) + 10 : d.y_offset + font_size);
                return d.y_offset;
            },
            function (d) {
                return d.data.status > 2 && d.data.gestation ? "GA: " + d.data.gestation + ' weeks' : ''
            }, 'indi_details');

        addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size),
            function (d) {
                if (!d.data.uniqueId || !hierarchy_settings[d.depth].includes('id'))
                    return;
                d.y_offset = ( !d.y_offset ? (font_size * 2.25) + 10 : d.y_offset + font_size);
                return d.y_offset;
            },
            function (d) {
                return  d.data.uniqueId && hierarchy_settings[d.depth].includes('id') ? 'ID: ' + d.data.uniqueId : "";
            }, 'indi_details');

        // age and dob
        addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), (d)=> {
            if(!hierarchy_settings[d.depth].includes('age_dob')){
                return;
            }
            if(d.data.age || d.data.dob)
            d.y_offset = d.y_offset + font_size;
            return d.y_offset;
            },
            function (d) {
                let label = '';
                if(hierarchy_settings[d.depth].includes('age_dob')){
                    if(d.data.age){
                        label += d.data.age+'y'
                    }
                    if(d.data.dob){
                        label += ' b. '+d.data.dob;
                    }
                }

                return label;
            });

        // age of death and cause of death
        addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), (d)=> {
                if(!hierarchy_settings[d.depth].includes('dod_cod')){
                    return;
                }
                if(d.data.dage || d.data.cause_of_death)
                    d.y_offset = d.y_offset + font_size;
                return d.y_offset;
            },
            function (d) {
                let label = '';
                if(hierarchy_settings[d.depth].includes('dod_cod')) {
                    if (d.data.dage) {
                        label += 'd ' + d.data.dage + 'y'
                    }
                    if (d.data.cause_of_death) {
                        label += ' ' + d.data.cause_of_death;
                    }
                }
                return label;
            });

        // age of ethnicity and country_of_origin
        addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), (d)=> {
            if(!hierarchy_settings[d.depth].includes('ethnicity_country'))
                return;
                if((d.data.ethnicity && d.data.ethnicity.length>0) || (d.data.country_of_origin && d.data.country_of_origin.length>0))
                    d.y_offset = d.y_offset + font_size;
                return d.y_offset;
            },
            function (d) {
                let label = '';
                if(hierarchy_settings[d.depth].includes('ethnicity_country')) {
                    if (d.data.ethnicity && d.data.ethnicity.length > 0) {
                        label += d.data.ethnicity[0].data_value + ' '
                    }
                    if (d.data.country_of_origin && d.data.country_of_origin.length > 0) {
                        label += d.data.country_of_origin[0].data_value;
                    }
                }
                return label;
            });


        // individuals disease details
        const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi') ;
        for (var i = 0; i < opts.diseases.length; i++) {
            var disease = opts.diseases[i].type;
            addLabel(opts, node, ".25em", -(opts.symbol_size),
                function (d) {
                if(!hierarchy_settings[d.depth].includes('risk_factors_cancers')){
                    return
                }
                    var y_offset = (d.y_offset ? d.y_offset + font_size : font_size * 2.2);
                    for (var j = 0; j < opts.diseases.length; j++) {
                        if (disease === opts.diseases[j].type)
                            break;
                        if (prefixInObj(opts.diseases[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    return y_offset;
                },
                function (d) {
                    d.data.conditions = d.data.conditions ||  [];
                    if(!hierarchy_settings[d.depth].includes('risk_factors_cancers')){
                        return
                    }
                    var text = '';
                    if (disease.replace('_', ' ').includes('cancer')) {
                        var dis = disease.replace('_', ' ').replace('cancer', 'ca.');
                        var value = disease + '_age' in d.data ? d.data[disease + '_age'] : null;
                        if(disease in d.data) {
                            if (value === null) {
                                text = dis;
                            } else {
                                text = dis + ": " + value;
                            }
                        }
                    }
                    if (disease.replace('_', ' ').includes('condition')) {
                        const condition =  d.data.conditions.find((condition)=> condition.name.replace(specialRegex, '-') + '_condition' === disease);
                        if (condition) {
                            var dis = opts.conditions[disease].name.toLowerCase();
                            text = dis;
                            if (condition.age) {
                                text = dis + ': ' + condition.age;
                            }
                        }
                    }
                    return text;
                }, 'indi_details');
        }

        // individuals phenotype details
        for (var k = 0; k < opts.phenotypes.length; k++) {
            var phenotype = opts.phenotypes[k].type;
            addLabel(opts, node, ".25em", -(opts.symbol_size),
                function (d) {
                    var y_offset = (d.y_offset ? d.y_offset + font_size : font_size * 2.2);
                    for (var j = 0; j < opts.diseases.length; j++) {
                        if (prefixInObj(opts.diseases[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.phenotypes.length; j++) {
                        if (phenotype === opts.phenotypes[j].type)
                            break;
                        if (prefixInObj(opts.phenotypes[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    return y_offset;
                },
                function (d) {
                    var text = '';
                    if (phenotype in d.data) {
                        var dis = opts.phenotypes[k].name.toLowerCase()+' '+'ph.';
                        text = dis;
                    }
                    return text;
                }, 'indi_details');
        }

        // individuals candidate genes details
        for (var k = 0; k < opts.candidate_genotype.length; k++) {
            var candidate = opts.candidate_genotype[k].type;
            addLabel(opts, node, ".25em", -(opts.symbol_size),
                function (d) {
                    var y_offset = (d.y_offset ? d.y_offset + font_size : font_size * 2.2);
                    for (var j = 0; j < opts.diseases.length; j++) {
                        if (prefixInObj(opts.diseases[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.phenotypes.length; j++) {
                        if (prefixInObj(opts.phenotypes[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.candidate_genotype.length; j++) {
                        if (candidate === opts.candidate_genotype[j].type)
                            break;
                        if (prefixInObj(opts.candidate_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    return y_offset;
                },
                function (d) {
                    var text = '';
                    if (candidate in d.data) {
                        var dis = opts.candidate_genotype[k].name.toLowerCase()+' '+'ge. candidate genes';
                        text = dis;
                    }
                    return text;
                }, 'indi_details');
        }

        // individuals causal genes details
        for (var k = 0; k < opts.causal_genotype.length; k++) {
            var causal = opts.causal_genotype[k].type;
            addLabel(opts, node, ".25em", -(opts.symbol_size),
                function (d) {
                    var y_offset = (d.y_offset ? d.y_offset + font_size : font_size * 2.2);
                    for (var j = 0; j < opts.diseases.length; j++) {
                        if (prefixInObj(opts.diseases[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.phenotypes.length; j++) {
                        if (prefixInObj(opts.phenotypes[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.candidate_genotype.length; j++) {
                        if (prefixInObj(opts.candidate_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.causal_genotype.length; j++) {
                        if (causal === opts.causal_genotype[j].type)
                            break;
                        if (prefixInObj(opts.causal_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    return y_offset;
                },
                function (d) {
                    var text = '';
                    if (causal in d.data) {
                        var dis = opts.causal_genotype[k].name.toLowerCase()+' '+'ge. causal genes';
                        text = dis;
                    }
                    return text;
                }, 'indi_details');
        }

        // individuals carrier genes details
        for (var k = 0; k < opts.carrier_genotype.length; k++) {
            var carrier = opts.carrier_genotype[k].type;
            addLabel(opts, node, ".25em", -(opts.symbol_size),
                function (d) {
                    var y_offset = (d.y_offset ? d.y_offset + font_size : font_size * 2.2);
                    for (var j = 0; j < opts.diseases.length; j++) {
                        if (prefixInObj(opts.diseases[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.phenotypes.length; j++) {
                        if (prefixInObj(opts.phenotypes[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.candidate_genotype.length; j++) {
                        if (prefixInObj(opts.candidate_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.causal_genotype.length; j++) {
                        if (prefixInObj(opts.causal_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    for (var j = 0; j < opts.carrier_genotype.length; j++) {
                        if (carrier === opts.carrier_genotype[j].type)
                            break;
                        if (prefixInObj(opts.carrier_genotype[j].type, d.data))
                            y_offset += font_size - 1;
                    }
                    return y_offset;
                },
                function (d) {
                    var text = '';
                    if (carrier in d.data) {
                        var dis = opts.carrier_genotype[k].name.toLowerCase()+' '+'carrier genes';
                        text = dis;
                    }
                    return text;
                }, 'indi_details');
        }

        //show Alive and well
        addAliveAndWellLabelAndStillBirth(opts, node, ".25em", (0.36 * opts.symbol_size), 0.76 * opts.symbol_size,
            function (d) {
                    let label = '';
                    if(d.data.status === 2){
                        label = 'A & W';
                    }else if(d.data.status === 5){
                        label = 'SB';
                    }
                return label;
            }, 'indi_details');


        //draw the centre P for unknown status
        node.filter(function (d) {
            return !d.data.hidden && d.data.status === 3 ;
        }).append("text")
            .attr('x', 0)
            .attr('y', opts.symbol_size* 0.3)
            .style('font-size', opts.symbol_size*0.8)
            .attr('text-anchor', 'middle')
            .text('P');

        //marketBy
        addMarketBy(opts, node, ".25em", (0.7 * opts.symbol_size), -0.76 * opts.symbol_size,
            function (d) {
                return d.data.market_by_text? d.data.market_by_text.substring(0, Math.min(10, d.data.market_by_text.length)) : '';
            }, 'indi_details');

        //add heredity
        addHeredityDetails(opts, node, 0.04 * opts.symbol_size, 0.55 * opts.symbol_size)
        //

        //Clinical tab
        addCarrierStatus(opts, node)

        widgets.addWidgets(opts, node);

        // links between partners
        var clash_depth = {};
        partners = ped.selectAll(".partner")
            .data(ptrLinkNodes)
            .enter()
            .insert("path", "g")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("shape-rendering", "auto")
            .attr('d', function (d, i) {
                var node1 = pedigree_util.getNodeByName(flattenNodes, d.mother.data.name);
                var node2 = pedigree_util.getNodeByName(flattenNodes, d.father.data.name);
                var consanguity = pedigree_util.consanguity(node1, node2, opts) || (node1.data.consanguity && node1.data.consanguity === 'yes' && node2.data.consanguity === 'yes');
                var divorced = (d.mother.data.divorced && d.mother.data.divorced === d.father.data.name);

                var x1 = (d.mother.x < d.father.x ? d.mother.x : d.father.x);
                var x2 = (d.mother.x < d.father.x ? d.father.x : d.mother.x);
                var dy1 = d.mother.y;

                // identify clashes with other nodes at the same depth
                var clash = ptree.check_ptr_link_clashes(opts, d);
                var path = "";
                if (clash) {
                    if (d.mother.depth in clash_depth)
                        clash_depth[d.mother.depth] += 4;
                    else
                        clash_depth[d.mother.depth] = 4;

                    dy1 -= clash_depth[d.mother.depth];
                    var dx = clash_depth[d.mother.depth] + opts.symbol_size / 2 + 2;

                    var parent_nodes = d.mother.data.parent_node;
                    var parent_node_name = parent_nodes[0];
                    for (var ii = 0; ii < parent_nodes.length; ii++) {
                        if (parent_nodes[ii].father.name === d.father.data.name &&
                            parent_nodes[ii].mother.name === d.mother.data.name)
                            parent_node_name = parent_nodes[ii].name;
                    }
                    var parent_node = pedigree_util.getNodeByName(flattenNodes, parent_node_name);
                    parent_node.y = dy1; // adjust hgt of parent node
                    clash.sort(function (a, b) {
                        return a - b;
                    });

                    var dy2 = (dy1 - opts.symbol_size / 2 - 3);
                    // get path looping over node(s)
                    draw_path = function (clash, dx, dy1, dy2, parent_node, cshift) {
                        extend = function (i, l) {
                            if (i + 1 < l)   //  && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
                                return extend(++i);
                            return i;
                        };
                        var path = "";
                        for (var j = 0; j < clash.length; j++) {
                            var k = extend(j, clash.length);
                            var dx1 = clash[j] - dx - cshift;
                            var dx2 = clash[k] + dx + cshift;
                            if (parent_node.x > dx1 && parent_node.x < dx2)
                                parent_node.y = dy2;

                            path += "L" + dx1 + "," + (dy1 - cshift) +
                                "L" + dx1 + "," + (dy2 - cshift) +
                                "L" + dx2 + "," + (dy2 - cshift) +
                                "L" + dx2 + "," + (dy1 - cshift);
                            j = k;
                        }
                        return path;
                    }
                    path = draw_path(clash, dx, dy1, dy2, parent_node, 0);
                }

                var divorce_path = "";
                if (divorced && !clash)
                    divorce_path = "M" + (x1 + ((x2 - x1) * .66) + 6) + "," + (dy1 - 6) +
                        "L" + (x1 + ((x2 - x1) * .66) - 6) + "," + (dy1 + 6) +
                        "M" + (x1 + ((x2 - x1) * .66) + 10) + "," + (dy1 - 6) +
                        "L" + (x1 + ((x2 - x1) * .66) - 2) + "," + (dy1 + 6);
                if (consanguity) {  // consanguinous, draw double line between partners
                    var cshift = 3;
                    var path2 = (clash ? draw_path(clash, dx, dy1, dy2, parent_node, cshift) : "");
                    return "M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + "," +
                        "M" + x1 + "," + (dy1 - cshift) + path2 + "L" + x2 + "," + (dy1 - cshift) + divorce_path;
                }
                return "M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + divorce_path;
            });

        // links to children
        var links = ped.selectAll(".link")
            .data(root.links(nodes.descendants()))
            .enter()
            .filter(function (d) {
                // filter unless debug is set
                return (opts.DEBUG ||
                    (d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
            })
            .insert("path", "g")
            .attr("fill", "none")
            .attr("stroke-width", function (d, i) {
                if (d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
                    return 1;
                return (opts.DEBUG ? 2 : 1);
            })
            .attr("stroke", function (d, i) {
                if (d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
                    return 'pink';
                return "#000";
            })
            .attr("stroke-dasharray", function (d, i) {
                if (!d.target.data.adopted_in) return null;
                var dash_len = Math.abs(d.source.y - ((d.source.y + d.target.y) / 2));
                var dash_array = [dash_len, 0, Math.abs(d.source.x - d.target.x), 0];
                var twins = pedigree_util.getTwins(opts.dataset, d.target.data);
                if (twins.length >= 1) dash_len = dash_len * 3;
                for (var usedlen = 0; usedlen < dash_len; usedlen += 10)
                    $.merge(dash_array, [5, 5]);
                return dash_array;
            })
            .attr("shape-rendering", function (d, i) {
                if (d.target.data.mztwin || d.target.data.dztwin)
                    return "geometricPrecision";
                return "auto";
            })
            .attr("d", function (d, i) {
                if (d.target.data.mztwin || d.target.data.dztwin) {
                    // get twin position
                    var twins = pedigree_util.getTwins(opts.dataset, d.target.data);
                    if (twins.length >= 1) {
                        var twinx = 0;
                        var xmin = d.target.x;
                        var xmax = d.target.x;
                        for (var t = 0; t < twins.length; t++) {
                            var thisx = pedigree_util.getNodeByName(flattenNodes, twins[t].name).x;
                            if (xmin > thisx) xmin = thisx;
                            if (xmax < thisx) xmax = thisx;
                            twinx += thisx;
                        }

                        var xmid = ((d.target.x + twinx) / (twins.length + 1));
                        var ymid = ((d.source.y + d.target.y) / 2);

                        var xhbar = "";
                        if (xmin === d.target.x && d.target.data.mztwin) {
                            // horizontal bar for mztwins
                            var xx = (xmid + d.target.x) / 2;
                            var yy = (ymid + (d.target.y - opts.symbol_size / 2)) / 2;
                            xhbar = "M" + xx + "," + yy +
                                "L" + (xmid + (xmid - xx)) + " " + yy;
                        }

                        return "M" + (d.source.x) + "," + (d.source.y) +
                            "V" + ymid +
                            "H" + xmid +
                            "L" + (d.target.x) + " " + (d.target.y - opts.symbol_size / 2) +
                            xhbar;
                    }
                }

                //draw a circle at the point of connection
                return "M" + (d.source.x) + "," + (d.source.y) +
                    "V" + ((d.source.y + d.target.y) / 2) +
                    "H" + (d.target.x) +
                    "V" + (d.target.y);
            });

        //draw Circle at each connection point
        let circleNodes = root.links(nodes.descendants()).slice();
        //console.log(circleNodes)
        //circleNodes = circleNodes.slice(12);
        let linksCircles = ped.selectAll(".link-circles")
            .data(circleNodes)
            .enter()
            .append('circle')
            .attr('opacity', (d)=> d.source.parent === null ?  0 : 1)
            .attr('class','link-circles' )
            .attr('r', 5)
            .attr('cx', function (d) {
                return d.source.x
            })
            .attr('cy', function (d) {
                return d.source.y
            })
            .on('click', function (d) {
                let e = d3.event;
                widgets.openNodeLinkDialog(opts, d, e)
            })
            .style('fill', '#337ab7')
            .style('stroke-width', '2')
            .style('stroke', 'black');

        // draw proband arrow
        var probandIdx = pedigree_util.getProbandIndex(opts.dataset);
        if (probandIdx) {
            var probandNode = pedigree_util.getNodeByName(flattenNodes, opts.dataset[probandIdx].name);

            ped.append("svg:defs").append("svg:marker")    // arrow head
                .attr("id", "triangle")
                .attr("refX", 6)
                .attr("refY", 6)
                .attr("markerWidth", 20)
                .attr("markerHeight", 20)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M 0 0 12 6 0 12 3 6")
                .style("fill", "black");

            ped.append("line")
                .attr("x1", probandNode.x - opts.symbol_size)
                .attr("y1", probandNode.y + opts.symbol_size)
                .attr("x2", probandNode.x - opts.symbol_size / 2)
                .attr("y2", probandNode.y + opts.symbol_size / 2)
                .attr("stroke-width", 1)
                .attr("stroke", "black")
                .attr("marker-end", "url(#triangle)");
        }
        // drag and zoom
        let zoom = d3.zoom()
            .scaleExtent([opts.zoomIn, opts.zoomOut])
            .on('zoom', zoomFn);

        function zoomFn(zf) {
            var t = d3.event.transform;
            pos = [t.x , t.y ];
            console.log(opts.zoomIn, t)
            ped.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ') scale(' + t.k + ')');
            pedcache.setposition(opts, pos[0], pos[1], t.k);
            panZoom.updateXYTransform(opts, pos[0], pos[1], t.k)
        }

        $('svg').on('drop', 'rect', function (event) {
            var hasClass = $(this).hasClass('indi_rect');
            if (hasClass) {
                var selectedName = d3.select(event.target).data()[0].data.name;
                window.drop(event, hasClass, selectedName);
            }
        });

        $('svg').on('dragover', 'rect', function (event) {
            window.allowDrop(event);
        });

        window.allowDrop = function (event) {
            event.preventDefault();
            window.drop = function (event, hasClass, selectedName) {
                event.preventDefault();
                if (hasClass) {
                    var conditionName = $('#dragged-legend-name').val().trim();
                    let dataset = pedcache.current(opts);
                    let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
                    let newdataset = ptree.copy_dataset(dataset);
                    var person = pedigree_util.getNodeByName(newdataset, name);
                    if (selectedName === person.name) {
                        if (!person.hasOwnProperty(conditionName)) {
                            person[conditionName] = true;
                            if(conditionName.replace('_', ' ').includes('cancer')) {
                                legend.addCancersToLegend(conditionName);
                                legend.showCancerLegends(opts);
                            }
                        }
                    }
                    ptree.syncTwins(newdataset, person);
                    opts.dataset = newdataset;
                    ptree.rebuild(opts);
                    event.preventDefault();
                }
            }
        };
        panZoom.zoom = zoom;
        panZoom.svg = svg;
        svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(xtransform, ytransform).scale(initialZoom));
        return opts;
    };

    // validate pedigree data
    ptree.validate_pedigree = function (opts) {
        if (opts.validate) {
            if (typeof opts.validate == 'function') {
                if (opts.DEBUG)
                    console.log('CALLING CONFIGURED VALIDATION FUNCTION');
                return opts.validate.call(this, opts);
                ;
            }

            function create_err(err) {
                console.error(err);
                return new Error(err);
            }

            // check consistency of parents sex
            var uniquenames = [];
            for (var p = 0; p < opts.dataset.length; p++) {
                if (!p.hidden) {
                    if (opts.dataset[p].mother || opts.dataset[p].father) {
                        var display_name = opts.dataset[p].display_name;
                        if (!display_name)
                            display_name = 'unnamed';
                        display_name += ' (IndivID: ' + opts.dataset[p].name + ')';
                        var mother = opts.dataset[p].mother;
                        var father = opts.dataset[p].father;
                        if (!mother || !father) {
                            throw create_err('Missing parent for ' + display_name);
                        }

                        var midx = pedigree_util.getIdxByName(opts.dataset, mother);
                        var fidx = pedigree_util.getIdxByName(opts.dataset, father);
                        if (midx === -1)
                            throw create_err('The mother (IndivID: ' + mother + ') of family member ' +
                                display_name + ' is missing from the pedigree.');
                        if (fidx === -1)
                            throw create_err('The father (IndivID: ' + father + ') of family member ' +
                                display_name + ' is missing from the pedigree.');
                        if (opts.dataset[midx].sex !== "F")
                            throw create_err("The mother of family member " + display_name +
                                " is not specified as female. All mothers in the pedigree must have sex specified as 'F'.");
                        if (opts.dataset[fidx].sex !== "M")
                            throw create_err("The father of family member " + display_name +
                                " is not specified as male. All fathers in the pedigree must have sex specified as 'M'.");
                    }
                }
                if (!opts.dataset[p].name)
                    throw create_err(display_name + ' has no IndivID.');
                if ($.inArray(opts.dataset[p].name, uniquenames) > -1)
                    throw create_err('IndivID for family member ' + display_name + ' is not unique.');
                uniquenames.push(opts.dataset[p].name);
            }
            // warn if there is a break in the pedigree
            var unconnected = ptree.unconnected(opts.dataset);
            if (unconnected.length > 0)
                console.warn("individuals unconnected to pedigree ", unconnected);
        }
    }

    // check if the object contains a key with a given prefix
    function prefixInObj(prefix, obj) {
        var found = false;
        if (obj)
            $.each(obj, function (k, n) {
                if (k.indexOf(prefix + "_") === 0 || k === prefix) {
                    found = true;
                    return found;
                }
            });
        const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi') ;
        const prefixInCondition =  obj.conditions && obj.conditions.find((condition)=> condition.name.replace(specialRegex, '-') + '_condition' === prefix)
        return found || prefixInCondition;
    }

    // return a list of individuals that aren't connected to the target
    ptree.unconnected = function (dataset) {
        var target = dataset[pedigree_util.getProbandIndex(dataset)];
        if (!target) {
            console.warn("No target defined");
            if (dataset.length == 0) {
                throw "empty pedigree data set";
            }
            target = dataset[0];
        }
        var connected = [target.name];
        var change = true;
        var ii = 0;
        while (change && ii < 200) {
            ii++;
            var nconnect = connected.length;
            $.each(dataset, function (idx, p) {
                if ($.inArray(p.name, connected) != -1) {
                    // check if this person or a partner has a parent
                    var ptrs = get_partners(dataset, p);
                    var has_parent = (p.name === target.name || !p.noparents);
                    for (var i = 0; i < ptrs.length; i++) {
                        if (!pedigree_util.getNodeByName(dataset, ptrs[i]).noparents)
                            has_parent = true;
                    }

                    if (has_parent) {
                        if (p.mother && $.inArray(p.mother, connected) == -1)
                            connected.push(p.mother);
                        if (p.father && $.inArray(p.father, connected) == -1)
                            connected.push(p.father);
                    }
                } else if (!p.noparents &&
                    ((p.mother && $.inArray(p.mother, connected) != -1) ||
                        (p.father && $.inArray(p.father, connected) != -1))) {
                    connected.push(p.name);
                }
                // include any children
                include_children(connected, p, dataset);
            });
            change = (nconnect != connected.length);
        }
        var names = $.map(dataset, function (val, i) {
            return val.name;
        });
        return $.map(names, function (name, i) {
            return $.inArray(name, connected) == -1 ? name : null;
        });
    };

    function include_children(connected, p, dataset) {
        if ($.inArray(p.name, connected) == -1)
            return;
        combineArrays(connected, get_partners(dataset, p));
        var children = pedigree_util.getAllChildren(dataset, p);
        $.each(children, function (child_idx, child) {
            if ($.inArray(child.name, connected) == -1) {
                connected.push(child.name);
                combineArrays(connected, get_partners(dataset, child));
            }
        });
    }

    // combine arrays ignoring duplicates
    function combineArrays(arr1, arr2) {
        for (var i = 0; i < arr2.length; i++)
            if ($.inArray(arr2[i], arr1) == -1) arr1.push(arr2[i]);
    }

    // check for crossing of partner lines
    function check_ptr_links(opts, ptrLinkNodes) {
        for (var a = 0; a < ptrLinkNodes.length; a++) {
            var clash = ptree.check_ptr_link_clashes(opts, ptrLinkNodes[a]);
            if (clash)
                console.log("CLASH :: " + ptrLinkNodes[a].mother.data.name + " " + ptrLinkNodes[a].father.data.name, clash);
        }
    }

    ptree.check_ptr_link_clashes = function (opts, anode) {
        var root = ptree.roots[opts.targetDiv];
        var flattenNodes = pedigree_util.flatten(root);
        var mother, father;
        if ('name' in anode) {
            anode = pedigree_util.getNodeByName(flattenNodes, anode.name);
            if (!('mother' in anode.data))
                return null;
            mother = pedigree_util.getNodeByName(flattenNodes, anode.data.mother);
            father = pedigree_util.getNodeByName(flattenNodes, anode.data.father);
        } else {
            mother = anode.mother;
            father = anode.father;
        }

        var x1 = (mother.x < father.x ? mother.x : father.x);
        var x2 = (mother.x < father.x ? father.x : mother.x);
        var dy = mother.y;

        // identify clashes with other nodes at the same depth
        var clash = $.map(flattenNodes, function (bnode, i) {
            return !bnode.data.hidden &&
            bnode.data.name !== mother.data.name && bnode.data.name !== father.data.name &&
            bnode.y == dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
        });
        return clash.length > 0 ? clash : null;
    };

    function get_svg_dimensions(opts) {
        return {
            'width': (pbuttons.is_fullscreen() ? window.innerWidth : opts.width),
            'height': (pbuttons.is_fullscreen() ? window.innerHeight : opts.height)
        };
    }

    ptree.get_tree_dimensions = function (opts) {
        /// get score at each depth used to adjust node separation
        var svg_dimensions = get_svg_dimensions(opts);
        var maxscore = 0;
        var generation = {};
        for (var i = 0; i < opts.dataset.length; i++) {
            var depth = pedigree_util.getDepth(opts.dataset, opts.dataset[i].name);
            var children = pedigree_util.getAllChildren(opts.dataset, opts.dataset[i]);

            // score based on no. of children and if parent defined
            var score = 1 + (children.length > 0 ? 0.55 + (children.length * 0.25) : 0) + (opts.dataset[i].father ? 0.25 : 0);
            if (depth in generation)
                generation[depth] += score;
            else
                generation[depth] = score;

            if (generation[depth] > maxscore)
                maxscore = generation[depth];
        }

        var max_depth = Object.keys(generation).length * opts.symbol_size * 3.5;
        var tree_width = (svg_dimensions.width - opts.symbol_size > maxscore * opts.symbol_size * 1.65 ?
            svg_dimensions.width - opts.symbol_size : maxscore * opts.symbol_size * 1.65);
        var tree_height = (svg_dimensions.height - opts.symbol_size > max_depth ?
            svg_dimensions.height - opts.symbol_size : max_depth);
        return {'width': tree_width, 'height': tree_height};
    };

    // get the partners for a given node
    function get_partners(dataset, anode) {
        var ptrs = [];
        for (var i = 0; i < dataset.length; i++) {
            var bnode = dataset[i];
            if (anode.name === bnode.mother && $.inArray(bnode.father, ptrs) == -1)
                ptrs.push(bnode.father);
            else if (anode.name === bnode.father && $.inArray(bnode.mother, ptrs) == -1)
                ptrs.push(bnode.mother);
        }
        return ptrs;
    }

    // group top_level nodes by their partners
    function group_top_level(dataset) {
        // var top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
        // calculate top_level nodes
        for (var i = 0; i < dataset.length; i++) {
            if (pedigree_util.getDepth(dataset, dataset[i].name) == 2)
                dataset[i].top_level = true;
        }

        var top_level = [];
        var top_level_seen = [];
        for (i = 0; i < dataset.length; i++) {
            var node = dataset[i];
            if ('top_level' in node && $.inArray(node.name, top_level_seen) == -1) {
                top_level_seen.push(node.name);
                top_level.push(node);
                var ptrs = get_partners(dataset, node);
                for (var j = 0; j < ptrs.length; j++) {
                    if ($.inArray(ptrs[j], top_level_seen) == -1) {
                        top_level_seen.push(ptrs[j]);
                        top_level.push(pedigree_util.getNodeByName(dataset, ptrs[j]));
                    }
                }
            }
        }

        var newdataset = $.map(dataset, function (val, i) {
            return 'top_level' in val && val.top_level ? null : val;
        });
        for (i = top_level.length; i > 0; --i)
            newdataset.unshift(top_level[i - 1]);
        return newdataset;
    }

    // get height in pixels
    function getPx(emVal) {
        if (emVal === parseInt(emVal, 10)) // test if integer
            return emVal;

        if (emVal.indexOf("px") > -1)
            return emVal.replace('px', '');
        else if (emVal.indexOf("em") === -1)
            return emVal;
        var adiv = $('<div style="display: none; font-size: ' + emVal + '; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo('body');
        var hgt = adiv.height();
        adiv.remove();
        return hgt;
    };

    // Add label
    function addLabel(opts, node, size, fx, fy, ftext, class_label) {
        if (opts.labels.includes('full_name')) {
            fx = -50;
        }
        fx = fx + 25;
        node.filter(function (d) {
            return d.data.hidden && !opts.DEBUG ? false : true;
        }).append("text")
            .attr("class", class_label + ' ped_label' || "ped_label")
            .attr("x", fx)
            .attr("y", fy)
            //.attr("dy", size)
            .attr("font-family", opts.font_family)
            .attr("font-size", opts.font_size)
            .attr("font-weight", opts.font_weight)
            .text(ftext);
    }

    function addAliveAndWellLabelAndStillBirth(opts, node, size, fx, fy, ftext, class_label) {
        node.filter(function (d) {
            return d.data.hidden && !opts.DEBUG ? false : true;
        }).append("text")
            .attr("class", class_label + ' ped_label' || "ped_label")
            .attr("x", fx)
            .attr("y", fy)
            .attr("font-family", opts.font_family)
            .attr("font-size", opts.font_size)
            .attr("font-weight", opts.font_weight)
            .text(ftext);
    }
    
    function addMarketBy(opts, node, size, fx, fy, ftext, class_label) {
        node.filter(function (d) {
            return d.data.hidden && !opts.DEBUG ? false : true;
        }).append("text")
            .attr("class", class_label + ' ped_label' || "ped_label")
            .attr("x", fx)
            .attr("y", fy)
            .attr("font-family", opts.font_family)
            .attr("font-size", opts.font_size)
            .attr("font-weight", opts.font_weight)
            .text(ftext);

        //add Icon
        var warn = node.filter(function (d) {
            return   !d.data.hidden && d.data.market_by_tick;
        }).append("foreignObject")
            .attr('font-family', 'FontAwesome')
            .attr('width', 50)
            .attr('height', 50)
            .attr("x", fx-18)
            .attr("y", fy-14)
            .html((d)=>{
                switch (d.data.market_by_tick) {
                    case 'market_na':
                        return '';
                    case 'market_p':
                       return '\uf067';
                    case 'market_m':
                        return '\uf068';
                    case 'market_s':
                        return '\uf069';
                    case  'market_st':
                        return '<i class="fas fa-vial"></i>';
                    default:
                        return '';
                }
            });
        warn.append("svg:title").text("incomplete");
    }

    function addHeredityDetails(opts, node, fx, fy) {
        let x1, y1, x2, y2;
        x1 = y1 = 0;
        x2 = 0;
        y2 = 8
        let g = node.filter(function (d) {
            return d.data.hidden && !opts.DEBUG ? false : true;
        }).append('g')
            .attr('opacity', function (d) {
               return (d.data.heredity === 'Childless' ||  d.data.heredity === 'Infertile')?1: 0;
            })
            .attr('class', 'heredity')
            .attr('transform', function (d) {
                return `translate(${fx},${fy})`
            });
        g.append("line")
            .attr('x1', x1)
            .attr('x2', x2)
            .attr('y1', y1)
            .attr('y2', y2)
        g.append("line")
            .attr('x1', x1-4)
            .attr('x2', x1+4)
            .attr('y1', y2)
            .attr('y2', y2)
        y2 += 2;
        g.append("line")
            .attr('opacity', function (d) {
                return  d.data.heredity === 'Infertile'?1: 0;
            })
            .attr('x1', x1-4)
            .attr('x2', x1+4)
            .attr('y1', y2)
            .attr('y2', y2)

    }

    function addCarrierStatus(opts, node){
        let fontSize = opts.font_size * 4.5;
       node.filter(function (d) {
            return !(d.data.hidden && !opts.DEBUG) && (d.data.carrier_status==='carrier'|| d.data.carrier_status==='uncertain');
        }).append("text")
            .attr('font-family', 'FontAwesome')
            .attr("x", -6)
            .attr("y", 4)
            .html((d)=>{
                switch (d.data.carrier_status) {
                    case 'carrier':
                        return '\uf111';
                    case 'uncertain':
                        return '\uf128';
                    default:
                        return '';
                }
            });

      node.filter(function (d) {
            return !(d.data.hidden && !opts.DEBUG) && (d.data.carrier_status==='asymptomatic');
        }).append("line")
          .attr('class', 'asymptomatic')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', -opts.symbol_size/2)
            .attr('y2', opts.symbol_size/2)
    }

    ptree.rebuild = function (opts) {
        $("#" + opts.targetDiv).empty();
        pedcache.add(opts);
        try {
            ptree.build(opts);
        } catch (e) {
            console.error(e);
            throw e;
        }

        try {
            templates.update(opts);
        } catch (e) {
            // templates not declared
        }
        $(document).trigger('ptree.rebuild', [opts]);
    };

    ptree.copy_dataset = function (dataset) {
        if (dataset[0].id) { // sort by id
            dataset.sort(function (a, b) {
                return (!a.id || !b.id ? 0 : (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
            });
        }

        var disallowed = ["id", "parent_node"];
        var newdataset = [];
        for (var i = 0; i < dataset.length; i++) {
            var obj = {};
            for (var key in dataset[i]) {
                if (disallowed.indexOf(key) == -1)
                    obj[key] = dataset[i][key];
            }
            newdataset.push(obj);
        }
        return newdataset;
    };

    // add children to a given node
    ptree.addchild = function (dataset, node, sex, nchild, twin_type, abortion) {
        if (twin_type && $.inArray(twin_type, ["mztwin", "dztwin"]) === -1)
            return new Error("INVALID TWIN TYPE SET: " + twin_type);

        if (typeof nchild === typeof undefined)
            nchild = 1;
        var children = pedigree_util.getAllChildren(dataset, node);
        var ptr_name, idx;
        if (children.length === 0) {
            var partner = ptree.addsibling(dataset, node, node.sex === 'F' ? 'M' : 'F');
            partner.noparents = true;
            ptr_name = partner.name;
            idx = pedigree_util.getIdxByName(dataset, node.name) + 1;
        } else {
            var c = children[0];
            ptr_name = (c.father === node.name ? c.mother : c.father);
            idx = pedigree_util.getIdxByName(dataset, c.name);
        }

        if (twin_type)
            var twin_id = getUniqueTwinID(dataset, twin_type);
        var newchildren = [];
        for (var i = 0; i < nchild; i++) {
            var child = {
                "name": ptree.makeid(4), "sex": sex,
                "mother": (node.sex === 'F' ? node.name : ptr_name),
                "father": (node.sex === 'F' ? ptr_name : node.name)
            };
            if(abortion)
                child.status = 6;
            dataset.splice(idx, 0, child);

            if (twin_type)
                child[twin_type] = twin_id;
            newchildren.push(child);
        }
        return newchildren;
    };

    //
    ptree.addsibling = function (dataset, node, sex, add_lhs, twin_type, abortion) {
        if (twin_type && $.inArray(twin_type, ["mztwin", "dztwin"]) === -1)
            return new Error("INVALID TWIN TYPE SET: " + twin_type);

        var newbie = {"name": ptree.makeid(4), "sex": sex};
        if(abortion)
            newbie.status = 6;
        if (node.top_level) {
            newbie.top_level = true;
        } else {
            newbie.mother = node.mother;
            newbie.father = node.father;
        }
        var idx = pedigree_util.getIdxByName(dataset, node.name);

        if (twin_type) {
            setMzTwin(dataset, dataset[idx], newbie, twin_type);
        }

        if (add_lhs) { // add to LHS
            if (idx > 0) idx--;
        } else
            idx++;
        dataset.splice(idx, 0, newbie);
        return newbie;
    };

    // set two siblings as twins
    function setMzTwin(dataset, d1, d2, twin_type) {
        if (!d1[twin_type]) {
            d1[twin_type] = getUniqueTwinID(dataset, twin_type);
            if (!d1[twin_type])
                return false;
        }
        d2[twin_type] = d1[twin_type];
        if (d1.yob)
            d2.yob = d1.yob;
        if (d1.age && (d1.status == 0 || !d1.status))
            d2.age = d1.age;
        return true;
    }

    // get a new unique twins ID, max of 10 twins in a pedigree
    function getUniqueTwinID(dataset, twin_type) {
        var mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];
        for (var i = 0; i < dataset.length; i++) {
            if (dataset[i][twin_type]) {
                var idx = mz.indexOf(dataset[i][twin_type]);
                if (idx > -1)
                    mz.splice(idx, 1);
            }
        }
        if (mz.length > 0)
            return mz[0];
        return undefined;
    }

    // sync attributes of twins
    ptree.syncTwins = function (dataset, d1) {
        if (!d1.mztwin && !d1.dztwin)
            return;
        var twin_type = (d1.mztwin ? "mztwin" : "dztwin");
        for (var i = 0; i < dataset.length; i++) {
            var d2 = dataset[i];
            if (d2[twin_type] && d1[twin_type] == d2[twin_type] && d2.name !== d1.name) {
                if (twin_type === "mztwin")
                    d2.sex = d1.sex;
                if (d1.yob)
                    d2.yob = d1.yob;
                if (d1.age && (d1.status == 0 || !d1.status))
                    d2.age = d1.age;
            }
        }
    };

    // check integrity twin settings
    function checkTwins(dataset) {
        var twin_types = ["mztwin", "dztwin"];
        for (var i = 0; i < dataset.length; i++) {
            for (var j = 0; j < twin_types.length; j++) {
                var twin_type = twin_types[j];
                if (dataset[i][twin_type]) {
                    var count = 0;
                    for (var j = 0; j < dataset.length; j++) {
                        if (dataset[j][twin_type] == dataset[i][twin_type])
                            count++;
                    }
                    if (count < 2)
                        delete dataset[i][[twin_type]];
                }
            }
        }
    }

    // add parents to the 'node'
    ptree.addparents = function (opts, dataset, name) {
        var mother, father;
        var root = ptree.roots[opts.targetDiv];
        var flat_tree = pedigree_util.flatten(root);
        var tree_node = pedigree_util.getNodeByName(flat_tree, name);
        var node = tree_node.data;
        var depth = tree_node.depth;   // depth of the node in relation to the root (depth = 1 is a top_level node)

        var pid = -101;
        var ptr_name;
        var children = pedigree_util.getAllChildren(dataset, node);
        if (children.length > 0) {
            ptr_name = children[0].mother == node.name ? children[0].father : children[0].mother;
            pid = pedigree_util.getNodeByName(flat_tree, ptr_name).data.id;
        }

        var i;
        if (depth == 1) {
            mother = {"name": ptree.makeid(4), "sex": "F", "top_level": true};
            father = {"name": ptree.makeid(4), "sex": "M", "top_level": true};
            dataset.splice(0, 0, father);
            dataset.splice(0, 0, mother);

            for (i = 0; i < dataset.length; i++) {
                if (dataset[i].top_level && dataset[i].name !== mother.name && dataset[i].name !== father.name) {
                    delete dataset[i].top_level;
                    dataset[i].noparents = true;
                    dataset[i].mother = mother.name;
                    dataset[i].father = father.name;
                }
            }
        } else {
            var node_mother = pedigree_util.getNodeByName(flat_tree, tree_node.data.mother);
            var node_father = pedigree_util.getNodeByName(flat_tree, tree_node.data.father);
            var node_sibs = pedigree_util.getAllSiblings(dataset, node);

            // lhs & rhs id's for siblings of this node
            var rid = 10000;
            var lid = tree_node.data.id;
            for (i = 0; i < node_sibs.length; i++) {
                var sid = pedigree_util.getNodeByName(flat_tree, node_sibs[i].name).data.id;
                if (sid < rid && sid > tree_node.data.id)
                    rid = sid;
                if (sid < lid)
                    lid = sid;
            }
            var add_lhs = (lid >= tree_node.data.id || (pid == lid && rid < 10000));
            if (opts.DEBUG)
                console.log('lid=' + lid + ' rid=' + rid + ' nid=' + tree_node.data.id + ' ADD_LHS=' + add_lhs);
            var midx;
            if ((!add_lhs && node_father.data.id > node_mother.data.id) ||
                (add_lhs && node_father.data.id < node_mother.data.id))
                midx = pedigree_util.getIdxByName(dataset, node.father);
            else
                midx = pedigree_util.getIdxByName(dataset, node.mother);

            var parent = dataset[midx];
            mother = ptree.addsibling(dataset, parent, 'F', add_lhs);
            father = ptree.addsibling(dataset, parent, 'M', add_lhs);

            var orphans = pedigree_util.getAdoptedSiblings(dataset, node);
            var nid = tree_node.data.id;
            for (i = 0; i < orphans.length; i++) {
                var oid = pedigree_util.getNodeByName(flat_tree, orphans[i].name).data.id;
                if (opts.DEBUG)
                    console.log('ORPHAN=' + i + ' ' + orphans[i].name + ' ' + (nid < oid && oid < rid) + ' nid=' + nid + ' oid=' + oid + ' rid=' + rid);
                if ((add_lhs || nid < oid) && oid < rid) {
                    var oidx = pedigree_util.getIdxByName(dataset, orphans[i].name);
                    dataset[oidx].mother = mother.name;
                    dataset[oidx].father = father.name;
                }
            }
        }

        if (depth == 2) {
            mother.top_level = true;
            father.top_level = true;
        } else if (depth > 2) {
            mother.noparents = true;
            father.noparents = true;
        }
        var idx = pedigree_util.getIdxByName(dataset, node.name);
        dataset[idx].mother = mother.name;
        dataset[idx].father = father.name;
        delete dataset[idx].noparents;

        if ('parent_node' in node) {
            var ptr_node = dataset[pedigree_util.getIdxByName(dataset, ptr_name)];
            if ('noparents' in ptr_node) {
                ptr_node.mother = mother.name;
                ptr_node.father = father.name;
            }
        }
    };

    // add partner
    ptree.addpartner = function (opts, dataset, name) {
        var root = ptree.roots[opts.targetDiv];
        var flat_tree = pedigree_util.flatten(root);
        var tree_node = pedigree_util.getNodeByName(flat_tree, name);

        var partner = ptree.addsibling(dataset, tree_node.data, tree_node.data.sex === 'F' ? 'M' : 'F');
        partner.noparents = true;

        var child = {"name": ptree.makeid(4), "sex": "M"};
        child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
        child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);

        var idx = pedigree_util.getIdxByName(dataset, tree_node.data.name) + 2;
        dataset.splice(idx, 0, child);
    };

    // get adjacent nodes at the same depth
    function adjacent_nodes(root, node, excludes) {
        var dnodes = pedigree_util.getNodesAtDepth(pedigree_util.flatten(root), node.depth, excludes);
        var lhs_node, rhs_node;
        for (var i = 0; i < dnodes.length; i++) {
            if (dnodes[i].x < node.x)
                lhs_node = dnodes[i];
            if (!rhs_node && dnodes[i].x > node.x)
                rhs_node = dnodes[i];
        }
        return [lhs_node, rhs_node];
    }

    // delete a node and descendants
    ptree.delete_node_dataset = function (dataset, node, opts, onDone) {
        var root = ptree.roots[opts.targetDiv];
        var fnodes = pedigree_util.flatten(root);
        var deletes = [];
        var i, j;

        // get d3 data node
        if (node.id === undefined) {
            var d3node = pedigree_util.getNodeByName(fnodes, node.name);
            if (d3node !== undefined)
                node = d3node.data;
        }

        if (node.parent_node) {
            for (i = 0; i < node.parent_node.length; i++) {
                var parent = node.parent_node[i];
                var ps = [pedigree_util.getNodeByName(dataset, parent.mother.name),
                    pedigree_util.getNodeByName(dataset, parent.father.name)];
                // delete parents
                for (j = 0; j < ps.length; j++) {
                    if (ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
                        dataset.splice(pedigree_util.getIdxByName(dataset, ps[j].name), 1);
                        deletes.push(ps[j]);
                    }
                }

                var children = parent.children;
                var children_names = $.map(children, function (p, i) {
                    return p.name;
                });
                for (j = 0; j < children.length; j++) {
                    var child = pedigree_util.getNodeByName(dataset, children[j].name);
                    if (child) {
                        child.noparents = true;
                        var ptrs = get_partners(dataset, child);
                        var ptr;
                        if (ptrs.length > 0)
                            ptr = pedigree_util.getNodeByName(dataset, ptrs[0]);
                        if (ptr && ptr.mother !== child.mother) {
                            child.mother = ptr.mother;
                            child.father = ptr.father;
                        } else if (ptr) {
                            var child_node = pedigree_util.getNodeByName(fnodes, child.name);
                            var adj = adjacent_nodes(root, child_node, children_names);
                            child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
                            child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
                        } else {
                            dataset.splice(pedigree_util.getIdxByName(dataset, child.name), 1);
                        }
                    }
                }
            }
        } else {
            dataset.splice(pedigree_util.getIdxByName(dataset, node.name), 1);
        }

        // delete ancestors
        console.log(deletes);
        for (i = 0; i < deletes.length; i++) {
            var del = deletes[i];
            var sibs = pedigree_util.getAllSiblings(dataset, del);
            console.log('DEL', del.name, sibs);
            if (sibs.length < 1) {
                console.log('del sibs', del.name, sibs);
                var data_node = pedigree_util.getNodeByName(fnodes, del.name);
                var ancestors = data_node.ancestors();
                for (j = 0; j < ancestors.length; j++) {
                    console.log(ancestors[i]);
                    if (ancestors[j].data.mother) {
                        console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
                        dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.mother.name), 1);
                        dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.father.name), 1);
                    }
                }
            }
        }
        // check integrity of mztwins settings
        checkTwins(dataset);

        try {
            // validate new pedigree dataset
            var newopts = $.extend({}, opts);
            newopts.dataset = ptree.copy_dataset(dataset);
            ptree.validate_pedigree(newopts);
            // check if pedigree is split
            var unconnected = ptree.unconnected(dataset);
        } catch (err) {
            utils.messages('Warning', 'Deletion of this pedigree member is disallowed.')
            throw err;
        }
        if (unconnected.length > 0) {
            // check & warn only if this is a new split
            if (ptree.unconnected(opts.dataset).length === 0) {
                console.error("individuals unconnected to pedigree ", unconnected);
                utils.messages("Warning", "Deleting this will split the pedigree. Continue?", onDone, opts, dataset);
                return;
            }
        }

        if (onDone) {
            onDone(opts, dataset);
        }
        return dataset;
    };

    ptree.makeid = function (len) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

}(window.ptree = window.ptree || {}, jQuery));


// pedigree form
(function(pedigree_form, $, undefined) {

	pedigree_form.update = function(opts) {
		$('.node_save').click(function() {
			pedigree_form.save(opts);
		});

		$('#id_proband, #id_exclude').click(function(e) {
			var dataset = pedcache.current(opts);
			opts.dataset = ptree.copy_dataset(dataset);

			var name = $('#id_name').val();
			if($(this).attr("id") === 'id_proband') {
				pedigree_util.setProband(opts.dataset, name, $(this).is(':checked'));
			} else {
				var idx = pedigree_util.getIdxByName(opts.dataset, name);
				if($(this).is(':checked'))
					opts.dataset[idx].exclude = true;
				else
					delete opts.dataset[idx].exclude;
			}
			pedcache.add(opts);
			$("#"+opts.targetDiv).empty();
			ptree.build(opts);
		});

		// advanced options - model parameters
		$("input[id$='_mut_sensitivity'], input[id$='_mut_frequency']").prop('disabled', true);
		$('#id_use_custom_mutation_sensitivities').change(function() {
			$("input[id$='_mut_sensitivity']").prop('disabled', !$(this).is(":checked"));
		});

		$('#id_mutation_frequencies').change(function() {
			$("input[id$='_mut_frequency']").prop('disabled', (this.value !== 'Custom'));
			// note pedigree_form.mutation_frequencies is set in the view see pedigree_section_js.html
			if(pedigree_form.mutation_frequencies && this.value !== 'Custom') {
				var mfreq = pedigree_form.mutation_frequencies[this.value];
				for (var gene in mfreq)
					$('#id_'+gene.toLowerCase()+'_mut_frequency').val(mfreq[gene]);
			}
		});
	};

	// handle family history change events (undo/redo/delete)
	$(document).on('fhChange', function(e, opts){
		try {
			var id = $('#id_name').val();  // get name from hidden field
			var node = pedigree_util.getNodeByName(pedcache.current(opts), id)
			if(node === undefined)
				$('form > fieldset').prop("disabled", true);
			else
				$('form > fieldset').prop('disabled', false);
		} catch(err) {
			console.warn(err);
		}
    })

	pedigree_form.nodeclick = function(node) {
		$('form > fieldset').prop('disabled', false);
		// clear values
		$('#person_details').find("input[type=text], input[type=number]").val("");
		$('#person_details select').val('').prop('selected', true);

		// assign values to input fields in form
		if(node.sex === 'M' || node.sex === 'F')
			$('input[name=sex][value="'+node.sex+'"]').prop('checked', true);
		else
			$('input[name=sex]').prop('checked', false);
		update_cancer_by_sex(node);

		if(!('status' in node))
			node.status = 0;
		$('input[name=status][value="'+node.status+'"]').prop('checked', true);

		if('proband' in node) {
			$('#id_proband').prop('checked', node.proband);
		} else {
			$('#id_proband').prop('checked', false);
		}

		if('exclude' in node) {
			$('#id_exclude').prop('checked', node.exclude);
		} else {
			$('#id_exclude').prop('checked', false);
		}

/*		if('ashkenazi' in node) {
			$('#id_ashkenazi').prop('checked', (node.proband == 1 ? true: false));
		} else {
			$('#id_ashkenazi').prop('checked', false);
		}*/

		// year of both
		if('yob' in node) {
			$('#id_yob_0').val(node.yob);
		} else {
			$('#id_yob_0').val('-');
		}

		// clear pathology
		$('select[name$="_bc_pathology"]').val('-');
		// clear gene tests
		$('select[name*="_gene_test"]').val('-');

		// disable sex radio buttons if the person has a partner
		$("input[id^='id_sex_']").prop("disabled", (node.parent_node && node.sex !== 'U' ? true : false));

		// disable pathology for male relatives (as not used by model)
		$("select[id$='_bc_pathology']").prop("disabled", (node.sex === 'M' ? true : false));

		// approximate diagnosis age
		$('#id_approx').prop('checked', (node.approx_diagnosis_age ? true: false));
		pedigree_form.update_diagnosis_age_widget();

		for(var key in node ) {
			if(key !== 'proband' && key !== 'sex') {
				if($('#id_'+key).length) {	// input value
					if(key.indexOf('_gene_test')  !== -1 && node[key] !== null && typeof node[key] === 'object') {
						$('#id_'+key).val(node[key].type);
						$('#id_'+key+'_result').val(node[key].result);
					} else {
						$('#id_'+key).val(node[key]);
					}
				} else if(key.indexOf('_diagnosis_age') !== -1) {
					if($("#id_approx").is(':checked')) {
						$('#id_'+key+'_1').val(round5(node[key])).prop('selected', true);
					} else {
						$('#id_'+key+'_0').val(node[key]);
					}
				}
			}
		}

		try {
			$('#person_details').find('form').valid();
		} catch(err) {
			console.warn('valid() not found');
		}
	};

	pedigree_form.saveTabbedForm =  function(opts, selectedName, formOptions){
		let dataset = pedcache.current(opts);
        let name = typeof (selectedName) === 'string' && selectedName.length>0? selectedName:$('#id_name').val();
        let newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, name);
        if(!person) {
            console.warn('TABBED DIALOG: ','person not found when saving details');
            return;
        }
		$("#"+opts.targetDiv).empty();
        let newName = $('#id__name').val();
        person.full_name = newName && newName.length>0?newName.substring(0,Math.min(15, newName.length)):'';
        person.uniqueId = $('#id_uniqueId').val();
        person.age = $('#id__age').val();
        person.dob = $('#dob').val();
        person.dage = $('#id__dage').val();
        person.cause_of_death = $('#cause_of_death').val();
        person.country_of_origin = $('#country_of_origin').val();
        person.individual_role = $("input[name='individual_role']:checked").val();
        person.conceived_by_donor_egg = $("#id_conceived_by_donor_egg").is(":checked");
        person.conceived_by_donor_sperm = $("#id_conceived_by_donor_sperm").is(":checked");
        //ethicity and country of origin magic search
		if(formOptions){
			if(formOptions.ethnicity){
				let ethnicity = formOptions.ethnicity;
				if(ethnicity.action === 'save'){
					if(person.ethnicity && !person.ethnicity.includes(ethnicity.data)){
						person.ethnicity = person.ethnicity.filter((e)=>e.id!==ethnicity.data.id)
						person.ethnicity.push(ethnicity.data)
					}else{
						person.ethnicity = [ethnicity.data]
					}
				}else if(ethnicity.action === 'delete'){
					if(person.ethnicity && person.ethnicity.length>0){
						person.ethnicity = person.ethnicity.filter((e)=>e.id!==ethnicity.data.id)
					}
				}
				if(person.ethnicity && person.ethnicity.length>0) {
					let ethnicityIds= person.ethnicity.map((e)=>e.id).join();
					$('#'+ethnicity.id).trigger('set', {id: ethnicityIds});
				}

			}
			if(formOptions.countryOfOrigin){
				let countryOfOrigin = formOptions.countryOfOrigin;
				if(countryOfOrigin.action === 'save'){
					if(person.country_of_origin && person.country_of_origin.length>0){
						person.country_of_origin = person.country_of_origin.filter((e)=>e.id!==countryOfOrigin.data.id)
						person.country_of_origin.push(countryOfOrigin.data)
					}else{
						person.country_of_origin = [countryOfOrigin.data]
					}
				}else if(countryOfOrigin.action === 'delete'){
					if(person.country_of_origin && person.country_of_origin.length>0){
						person.country_of_origin = person.country_of_origin.filter((e)=>e.id!==countryOfOrigin.data.id)
					}
				}
				if(person.country_of_origin && person.country_of_origin.length>0) {
					let countryOfOriginIds= person.country_of_origin.map((e)=>e.id).join();
					$('#'+countryOfOrigin.id).trigger('set', {id: countryOfOriginIds});
				}

			}

		}
		//save gestation
		let gestation = $('#gestation').val();
		if(gestation && person.status && person.status >2){
			person.gestation = gestation;
		}


		var conditionAge = 'age';
		var conditionStatus =  'status';
		var conditionDiagnosed = 'diagnosed';
		var conditionType = 'type';
		var conditionNotes = 'notes';
		person.conditions = person.conditions ||  [];
		person.conditions =  [];
		const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi') ;
		d3.selectAll('.diagnosisTypes').each(function(){
			let k = d3.select(this).select('label').select('input').attr('id').split('_')[0] + '_condition';
			if ($('#' + k + '_check').is(":checked")) {
				var ageOnset = $('#' + k + '_ageOnset').val();
				var diagnosisStatus = $("input[name='" + k + "_status']:checked").val();
				var diagnosisDiagnosed = $('#' + k + '_diagnosed').val();
				var diagnosisType = $('#' + k + '_diagnosisType').val();
				var diagnosisNotes = $('#' + k + '_notes').val();
				let condition =  {name :  opts.conditions[k].name};

				if (ageOnset && ageOnset.length > 0) {
					condition[conditionAge] =  ageOnset
				}
				if (diagnosisStatus && diagnosisStatus.length > 0) {
					condition[conditionStatus] = diagnosisStatus;
				}
				if (diagnosisDiagnosed && diagnosisDiagnosed.length > 0) {
					condition[conditionDiagnosed] =  diagnosisDiagnosed;
				}
				if (diagnosisType && diagnosisType.length > 0) {
					condition[conditionType] = diagnosisType;
				}
				if (diagnosisNotes && diagnosisNotes.length > 0) {
					condition[conditionNotes] = diagnosisNotes;
				}
				person.conditions.push(condition);
				legend.addConditionLegendToOpts(opts, k, opts.conditions[k]);
			}
		});

		if(formOptions && formOptions.conditionToDelete){
			const k = formOptions.conditionToDelete;
			person.conditions =  person.conditions.filter((condition)=> condition.name.replace(specialRegex, '-') + '_condition' !== k);
			legend.deleteConditionsFromOpts(opts, person, k, 'condition_legend', 'legend-condition-list');
			$('#' + k + '_check').prop('checked', false)
		}

        if (opts.selected_phenotypes[person.name]) {
            $.each(opts.selected_phenotypes[person.name], function (phenotype_id) {
                person[opts.selected_phenotypes[person.name][phenotype_id]] = true;
            });
        }

        if (opts.selected_candidate_genotype[person.name]) {
            $.each(opts.selected_candidate_genotype[person.name], function (candidate_id) {
                person[opts.selected_candidate_genotype[person.name][candidate_id]] = true;
            });
        }

        if (opts.selected_causal_genotype[person.name]) {
            $.each(opts.selected_causal_genotype[person.name], function (causal_id) {
                person[opts.selected_causal_genotype[person.name][causal_id]] = true;
            });
        }

        if (opts.selected_carrier_genotype[person.name]) {
            $.each(opts.selected_carrier_genotype[person.name], function (carrier_id) {
                person[opts.selected_carrier_genotype[person.name][carrier_id]] = true;
            });
        }

        if ($('#commentClinical')) {
            person.clinical_comments = $('#commentClinical').val();
        }

// current status: 0 = alive, 1 = dead Alive&Well = 2
        let status = $("input[name='status']:checked").val();
        if(status){
            person.status = parseInt(status);
        }
        let gestationContainer = $('#gestation_container');
        if(person.status > 2){
        	gestationContainer.show();
		}else{
			gestationContainer.hide();
		}
        let sex = $("input[name='sex']:checked").val();
        if(sex){
            person.sex = sex;
        }

        let heredity = $('#heredity').val();
        if(heredity){
        	person.heredity = heredity;
		}

        //market by
        person.market_by_text = $('#reason').val();
        let marketSelectedId = ['market_na', 'market_p', 'market_m', 'market_s', 'market_st'];
        let currentSelected =  person.market_by_tick;
        delete person['market_by_tick'];
        $(marketSelectedId).each(function (index, id) {
			let s = $('#'+id);
			if(s.is(":checked")){
				if(currentSelected !== id) {
                    person.market_by_tick = id;
                }
			}
        });
        if(!person.market_by_tick)
        	person.market_by_tick = currentSelected;


        for(let i=0; i< marketSelectedId.length; i++){
        	if(marketSelectedId[i] !== person.market_by_tick)
				$('#'+marketSelectedId[i])[0].checked= false;
		}

        var switches = [ "adopted_in", "adopted_out", "conceived_by_donor_egg_or_sperm","conceived_by_icf",
			"ivf_icsi","termination", "consanguineous_parents", "proband"];
        for(var iswitch=0; iswitch<switches.length; iswitch++){
            var attr = switches[iswitch];
            var s = $('#id_'+attr);
            if(s.length > 0){
                if(s.is(":checked"))
                    person[attr] = true;
                else {
                    delete person[attr];
                }
            }
        }

        /*CLINICAL*/
		let carrier_status = $("input[name='carrier_status']:checked").val();
		if(carrier_status){
			person.carrier_status = carrier_status;
		}
        ptree.syncTwins(newdataset, person);
        opts.dataset = newdataset;
        ptree.rebuild(opts);

	};

    pedigree_form.save = function(opts, selectedName) {
		var dataset = pedcache.current(opts);
		var name = typeof (selectedName) === 'string' && selectedName.length>0? selectedName:$('#id_name').val();
		var newdataset = ptree.copy_dataset(dataset);
		var person = pedigree_util.getNodeByName(newdataset, name);
		if(!person) {
			console.warn('person not found when saving details');
			return;
		}
		$("#"+opts.targetDiv).empty();

		// individual's personal and clinical details
		var yob = $('#id_yob_0').val();
		if(yob && yob !== '') {
			person.yob = yob;
		} else {
			delete person.yob;
		}

		// current status: 0 = alive, 1 = dead
		var status = $('#id_status').find("input[type='radio']:checked");
		if(status.length > 0){
			person.status = status.val();
		}

		// booleans switches
		var switches = ["adopted_in", "adopted_out", "consanguineous_parents"];
		for(var iswitch=0; iswitch<switches.length; iswitch++){
			var attr = switches[iswitch];
			var s = $('#id_'+attr);
			if(s.length > 0){
				if(s.is(":checked"))
					person[attr] = true;
				else
					delete person[attr];
			}
		}

		// current sex
		var sex = $('#id_sex').find("input[type='radio']:checked");
		if(sex.length > 0){
			person.sex = sex.val();
			update_cancer_by_sex(person);
		}

		// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
/*		if($('#id_ashkenazi').is(':checked'))
			person.ashkenazi = 1;
		else
			delete person.ashkenazi;*/

		if($('#id_approx').is(':checked')) // approximate diagnosis age
			person.approx_diagnosis_age = true;
		else
			delete person.approx_diagnosis_age;

		$("#person_details select[name*='_diagnosis_age']:visible, #person_details input[type=text]:visible, #person_details input[type=number]:visible, #person_details input[type=checkbox][id$=_diagnosis_age_0]:visible").each(function() {
			var name = (this.name.indexOf("_diagnosis_age")>-1 ? this.name.substring(0, this.name.length-2): this.name);
      if ($(this).attr('type') === 'checkbox') {
        if ($(this).is(':checked')) {
          person[name] = -1;
        } else {
          delete person[name];
        }
      } else {
			if($(this).val()) {
				var val = $(this).val();
				if(name.indexOf("_diagnosis_age") > -1 && $("#id_approx").is(':checked'))
					val = round5(val);
				person[name] = val;
			} else {
				delete person[name];
			}
        }});

		// cancer checkboxes
		$('#person_details input[type="checkbox"][name$="cancer"],input[type="checkbox"][name$="cancer2"]').each(function() {
			if(this.checked)
				person[$(this).attr('name')] = true;
			else
				delete person[$(this).attr('name')];
		});

		// pathology tests
		$('#person_details select[name$="_bc_pathology"]').each(function() {
			if($(this).val() !== '-') {
				person[$(this).attr('name')] = $(this).val();
			} else {
				delete person[$(this).attr('name')];
			}
		});

		// genetic tests
		$('#person_details select[name$="_gene_test"]').each(function() {
			if($(this).val() !== '-') {
				var tres = $('select[name="'+$(this).attr('name')+'_result"]');
				person[$(this).attr('name')] = {'type': $(this).val(), 'result': $(tres).val()};
			} else {
				delete person[$(this).attr('name')];
			}
		});

		try {
			$('#person_details').find('form').valid();
		} catch(err) {
			console.warn('valid() not found');
		}


		ptree.syncTwins(newdataset, person);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
    };

    pedigree_form.update_diagnosis_age_widget = function() {
		if($("#id_approx").is(':checked')) {
			$("[id$='_diagnosis_age_0']").each(function( index ) {
				if($(this).val() !== '') {
					var name = this.name.substring(0, this.name.length-2);
					$("#id_"+name+"_1").val(round5($(this).val())).prop('selected', true);
				}
			});

			$("[id$='_diagnosis_age_0']").hide();
			$("[id$='_diagnosis_age_1']").show();
		} else {
			$("[id$='_diagnosis_age_1']").each(function( index ) {
				if($(this).val() !== '') {
					var name = this.name.substring(0, this.name.length-2);
					$("#id_"+name+"_0").val($(this).val());
				}
			});

			$("[id$='_diagnosis_age_0']").show();
			$("[id$='_diagnosis_age_1']").hide();
		}
    };

	pedigree_form.save_common_cancers = function (cancerValue, ageOfDiagnosis, opts, selectedName, is_age_change) {
		let dataset = pedcache.current(opts);
		let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
		let newdataset = ptree.copy_dataset(dataset);
		var person = pedigree_util.getNodeByName(newdataset, name);

		if (cancerValue) {
			person[cancerValue] = true;
			if(!is_age_change) {
				legend.addCancersToLegend(cancerValue);
			}
		}
		if (ageOfDiagnosis) {
			var cancerAge = cancerValue + '_age';
			person[cancerAge] = ageOfDiagnosis;
		}
		ptree.syncTwins(newdataset, person);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
	};

	pedigree_form.remove_cancers = function (cancerValue, ageOfDiagnosis, opts, selectedName, ageChange) {
		let dataset = pedcache.current(opts);
		let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
		let newdataset = ptree.copy_dataset(dataset);
		var person = pedigree_util.getNodeByName(newdataset, name);

		if (!ageChange && cancerValue && (cancerValue in person)) {
			delete person[cancerValue];
		}
		var cancerAge = cancerValue + '_age';
		if (cancerAge in person) {
			delete person[cancerAge];
		}
		ptree.syncTwins(newdataset, person);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
	};

    pedigree_form.remove_phenotypes = function (opts, selectedName, phenotype_id) {
        let dataset = pedcache.current(opts);
        let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
        let newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, name);

        if (phenotype_id in person) {
            delete person[phenotype_id];
        }

		if (opts.selected_phenotypes[person.name]) {
			$.each(opts.selected_phenotypes[person.name], function (index) {
				opts.selected_phenotypes[person.name].splice(index, 1);
			});
		}

        ptree.syncTwins(newdataset, person);
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    };

    pedigree_form.remove_candidate = function (opts, selectedName, candidate_id) {
        let dataset = pedcache.current(opts);
        let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
        let newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, name);

        if (candidate_id in person) {
            delete person[candidate_id];
        }

		if (opts.selected_candidate_genotype[person.name]) {
			$.each(opts.selected_candidate_genotype[person.name], function (index) {
				opts.selected_candidate_genotype[person.name].splice(index, 1);
			});
		}

        ptree.syncTwins(newdataset, person);
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    };

    pedigree_form.remove_causal = function (opts, selectedName, causal_id) {
        let dataset = pedcache.current(opts);
        let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
        let newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, name);

        if (causal_id in person) {
            delete person[causal_id];
        }

		if (opts.selected_causal_genotype[person.name]) {
			$.each(opts.selected_causal_genotype[person.name], function (index) {
				opts.selected_causal_genotype[person.name].splice(index, 1);
			});
		}

        ptree.syncTwins(newdataset, person);
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    };

    pedigree_form.remove_carrier = function (opts, selectedName, carrier_id) {
        let dataset = pedcache.current(opts);
        let name = typeof (selectedName) === 'string' && selectedName.length > 0 ? selectedName : $('#id_name').val();
        let newdataset = ptree.copy_dataset(dataset);
        var person = pedigree_util.getNodeByName(newdataset, name);

        if (carrier_id in person) {
            delete person[carrier_id];
        }

		if (opts.selected_carrier_genotype[person.name]) {
			$.each(opts.selected_carrier_genotype[person.name], function (index) {
				opts.selected_carrier_genotype[person.name].splice(index, 1);
			});
		}

        ptree.syncTwins(newdataset, person);
        opts.dataset = newdataset;
        ptree.rebuild(opts);
    };

    // males should not have ovarian cancer and females should not have prostate cancer
    function update_cancer_by_sex(node) {
		$('#cancer .row').show();
		if(node.sex === 'M') {
			delete node.ovarian_cancer_diagnosis_age;
			$("[id^='id_ovarian_cancer_diagnosis_age']").closest('.row').hide();
		} else if(node.sex === 'F') {
			delete node.prostate_cancer_diagnosis_age;
			$("[id^='id_prostate_cancer_diagnosis_age']").closest('.row').hide();
		}
    }

    // round to 5, 15, 25, 35 ....
    function round5(x1) {
    	var x2 = (Math.round((x1-1) / 10) * 10);
    	return (x1 < x2 ? x2 - 5 : x2 + 5);
    }

}(window.pedigree_form = window.pedigree_form || {}, jQuery));

//
// undo, redo, reset buttons
(function(pbuttons, $, undefined) {

    pbuttons.add = function(options) {
        var opts = $.extend({
            // defaults
            btn_target: 'pedigree_history'
        }, options );
        $( "#"+options.btn_target ).empty()

        var btns = [{"fa": "fa-undo", "title": "undo"},
            {"fa": "fa-repeat", "title": "redo"},
            {"fa": "fa-refresh", "title": "reset"}];
        let $btn_target = $( "#"+opts.btn_target );
        var lis = `<div style="margin-bottom: 5px">`;
        lis += `<li class="inline-block">
        <label class="btn btn-default btn-file">
						<input id="load" type="file" style="display: none;">Load
				</label>	
				</li>
				<li class="inline-block">	
				<label class="btn btn-default btn-file">
						<input id="save" type="button" style="display: none;">Save
				</label>		
                </li>
                <li class="inline-block">
                <label class="btn btn-default btn-file">
                                        <input id="print" type="button" style="display: none;">Print
                                </label>
                </li>
                <li class="inline-block">
                <label class="btn btn-default btn-file">
                                        <input id="svg_download" type="button" style="display: none;">SVG
                                </label>
                </li>
                <li class="inline-block">
                <label class="btn btn-default btn-file">
                                        <input id="png_download" type="button" style="display: none;">PNG
                                </label>
                </li>
               </div
        `;
        for(var i=0; i<btns.length; i++) {
            lis += '<li">';
            lis += '&nbsp;<i class="fa fa-lg ' + btns[i].fa + '" ' +
                (btns[i].fa == "fa-arrows-alt" ? 'id="fullscreen" ' : '') +
                ' aria-hidden="true" title="'+ btns[i].title +'"></i>';
            lis += '</li>';
        }
        $btn_target.append(lis);
        click(opts);
    };

    pbuttons.is_fullscreen = function(){
        return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement);
    };

    function click(opts) {
        // fullscreen
        $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function(e)  {
            var local_dataset = pedcache.current(opts);
            if (local_dataset !== undefined && local_dataset !== null) {
                opts.dataset = local_dataset;
            }
            ptree.rebuild(opts);
            panZoom.config.isFullScreenMode = !panZoom.config.isFullScreenMode;
            panZoom.add(opts);
            if(panZoom.config.isFullScreenMode) {
                legend.add(opts);
            }
            widgets.removeDialogs();
        });

        $('#fullscreen').on('click', function(e) {
            if (!document.mozFullScreen && !document.webkitFullScreen) {
                var target = $("#"+opts.targetDiv)[0];
                if(target.mozRequestFullScreen)
                    target.mozRequestFullScreen();
                else
                    target.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            } else {
                if(document.mozCancelFullScreen)
                    document.mozCancelFullScreen();
                else
                    document.webkitCancelFullScreen();
            }
        });

        // undo/redo/reset
        $( "#"+opts.btn_target ).on( "click", function(e) {
            e.stopPropagation();
            if($(e.target).hasClass("disabled"))
                return false;

            if($(e.target).hasClass('fa-undo')) {
                opts.dataset = pedcache.previous(opts);
                $("#"+opts.targetDiv).empty();
                ptree.build(opts);
            } else if ($(e.target).hasClass('fa-repeat')) {
                opts.dataset = pedcache.next(opts);
                $("#"+opts.targetDiv).empty();
                ptree.build(opts);
            } else if ($(e.target).hasClass('fa-refresh')) {
                pbuttons.reset(opts);
            }
            // trigger fhChange event
            $(document).trigger('fhChange', [opts]);
        });
    }

    // reset pedigree and clear the history
    pbuttons.reset = function(opts) {
        pedcache.clear(opts);
        delete opts.dataset;

        var selected = $("input[name='default_fam']:checked");
        if(selected.length > 0 && selected.val() == 'extended2') {    // secondary relatives
            opts.dataset = [
                {"name":"wZA","sex":"M","top_level":true,"status":"0","display_name":"paternal grandfather"},
                {"name":"MAk","sex":"F","top_level":true,"status":"0","display_name":"paternal grandmother"},
                {"name":"zwB","sex":"M","top_level":true,"status":"0","display_name":"maternal grandfather"},
                {"name":"dOH","sex":"F","top_level":true,"status":"0","display_name":"maternal grandmother"},
                {"name":"MKg","sex":"F","mother":"MAk","father":"wZA","status":"0","display_name":"paternal aunt"},
                {"name":"xsm","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"paternal uncle"},
                {"name":"m21","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"father"},
                {"name":"f21","sex":"F","mother":"dOH","father":"zwB","status":"0","display_name":"mother"},
                {"name":"aOH","sex":"F","mother":"f21","father":"m21","status":"0","display_name":"sister"},
                {"name":"Vha","sex":"M","mother":"f21","father":"m21","status":"0","display_name":"brother"},
                {"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
                {"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
                {"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
                {"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"},
                {"name":"uuc","display_name":"maternal aunt","sex":"F","mother":"dOH","father":"zwB","status":"0"},
                {"name":"xIw","display_name":"maternal uncle","sex":"M","mother":"dOH","father":"zwB","status":"0"}];
        } else if(selected.length > 0 && selected.val() == 'extended1') {    // primary relatives
            opts.dataset = [
                {"name":"m21","sex":"M","mother":null,"father":null,"status":"0","display_name":"father","noparents":true},
                {"name":"f21","sex":"F","mother":null,"father":null,"status":"0","display_name":"mother","noparents":true},
                {"name":"aOH","sex":"F","mother":"f21","father":"m21","status":"0","display_name":"sister"},
                {"name":"Vha","sex":"M","mother":"f21","father":"m21","status":"0","display_name":"brother"},
                {"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
                {"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
                {"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
                {"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"}];
        } else {
            opts.dataset = [
                {"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
                {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
                {"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}];
        }
        ptree.rebuild(opts);
    }

    pbuttons.updateButtons = function(opts) {
        var current = pedcache.get_count(opts);
        var nstore = pedcache.nstore(opts);
        var id = "#"+opts.btn_target;
        if(nstore <= current)
            $(id+" .fa-repeat").addClass('disabled');
        else
            $(id+" .fa-repeat").removeClass('disabled');

        if(current > 1)
            $(id+" .fa-undo").removeClass('disabled');
        else
            $(id+" .fa-undo").addClass('disabled');
    };
}(window.pbuttons = window.pbuttons || {}, jQuery));

//
//store a history of pedigree
(function(pedcache, $, undefined) {
    var count = 0;
    var max_limit = 25;
    var dict_cache = {};

    // test if browser storage is supported
    function has_browser_storage(opts) {
        try {
            if(opts.store_type === 'array')
                return false;

            if(opts.store_type !== 'local' && opts.store_type !== 'session' && opts.store_type !== undefined)
                return false;

            var mod = 'test';
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    }

    function get_prefix(opts) {
        return "PEDIGREE_"+opts.btn_target+"_";
    }

    // use dict_cache to store cache as an array
    function get_arr(opts) {
        return dict_cache[get_prefix(opts)];
    }

    function get_browser_store(opts, item) {
        if(opts.store_type === 'local')
            return localStorage.getItem(item);
        else
            return sessionStorage.getItem(item);
    }

    function set_browser_store(opts, name, item) {
        if(opts.store_type === 'local')
            return localStorage.setItem(name, item);
        else
            return sessionStorage.setItem(name, item);
    }

    function clear_browser_store(opts) {
        if(opts.store_type === 'local')
            return localStorage.clear();
        else
            return sessionStorage.clear();
    }

    pedcache.save_hierarchy_settings = function(opts, hierarchy, value){
        set_browser_store(opts,get_prefix(opts) + 'hierarchy_' + hierarchy,value)
    };

    pedcache.get_hierarchy_settings = function(opts, hierarchy){
        let value = get_browser_store(opts, get_prefix(opts) + 'hierarchy_' + hierarchy);
        return value === null ? ['name', 'full_name', 'id', 'age_dob', 'dod_cod', 'ethnicity_country', 'phenotypes_symptoms', 'conditions',
            'genotypes_can_genes', 'genotypes_con_genes', 'genotypes_car_genes', 'risk_factors_cancers'] : JSON.parse(value)
    };

    pedcache.get_count = function(opts) {
        var count;
        if (has_browser_storage(opts))
            count = get_browser_store(opts, get_prefix(opts)+'COUNT');
        else
            count = dict_cache[get_prefix(opts)+'COUNT'];
        if(count !== null && count !== undefined)
            return count;
        return 0;
    };

    function set_count(opts, count) {
        if (has_browser_storage(opts))
            set_browser_store(opts, get_prefix(opts)+'COUNT', count);
        else
            dict_cache[get_prefix(opts)+'COUNT'] = count;
    }

    pedcache.add = function(opts) {
        if(!opts.dataset)
            return;
        var count = pedcache.get_count(opts);
        if (has_browser_storage(opts)) {   // local storage
            //make a clone of the dataset to avoid circular
            set_browser_store(opts, get_prefix(opts)+count, JSON.stringify(opts.dataset));
        } else {   // TODO :: array cache
            console.warn('Local storage not found/supported for this browser!', opts.store_type);
            max_limit = 500;
            if(get_arr(opts) === undefined)
                dict_cache[get_prefix(opts)] = [];
            get_arr(opts).push(JSON.stringify(opts.dataset));
        }
        if(count < max_limit)
            count++;
        else
            count = 0;
        set_count(opts, count);
    };

    pedcache.nstore = function(opts) {
        if(has_browser_storage(opts)) {
            for(var i=max_limit; i>0; i--) {
                if(get_browser_store(opts, get_prefix(opts)+(i-1)) !== null)
                    return i;
            }
        } else {
            return (get_arr(opts) && get_arr(opts).length > 0 ? get_arr(opts).length : -1);
        }
        return -1;
    };

    pedcache.current = function(opts) {
        var current = pedcache.get_count(opts)-1;
        if(current == -1)
            current = max_limit-1;
        if(has_browser_storage(opts))
            return JSON.parse(get_browser_store(opts, get_prefix(opts)+current));
        else if(get_arr(opts))
            return JSON.parse(get_arr(opts)[current]);
    };

    pedcache.last = function(opts) {
        if(has_browser_storage(opts)) {
            for(var i=max_limit; i>0; i--) {
                var it = get_browser_store(opts, get_prefix(opts)+(i-1));
                if(it !== null) {
                    set_count(opts, i);
                    return JSON.parse(it);
                }
            }
        } else {
            var arr = get_arr(opts);
            if(arr)
                return JSON.parse(arr(arr.length-1));
        }
        return undefined;
    };

    pedcache.previous = function(opts, previous) {
        if(previous === undefined)
            previous = pedcache.get_count(opts) - 2;

        if(previous < 0) {
            var nstore = pedcache.nstore(opts);
            if(nstore < max_limit)
                previous = nstore - 1;
            else
                previous = max_limit - 1;
        }
        set_count(opts, previous + 1);
        if(has_browser_storage(opts))
            return JSON.parse(get_browser_store(opts, get_prefix(opts)+previous));
        else
            return JSON.parse(get_arr(opts)[previous]);
    };

    pedcache.next = function(opts, next) {
        if(next === undefined)
            next = pedcache.get_count(opts);
        if(next >= max_limit)
            next = 0;

        set_count(opts, parseInt(next) + 1);
        if(has_browser_storage(opts))
            return JSON.parse(get_browser_store(opts, get_prefix(opts)+next));
        else
            return JSON.parse(get_arr(opts)[next]);
    };

    pedcache.clear = function(opts) {
        if(has_browser_storage(opts))
            clear_browser_store(opts);
        dict_cache = {};
    };

    // zoom - store translation coords
    pedcache.setposition = function(opts, x, y, zoom) {
        if(has_browser_storage(opts)) {
            set_browser_store(opts, get_prefix(opts)+'_X', x);
            set_browser_store(opts, get_prefix(opts)+'_Y', y);
            if(zoom)
                set_browser_store(opts, get_prefix(opts)+'_ZOOM', zoom);
        } else {
            //TODO
        }
    };

    pedcache.getposition = function(opts) {
        if(!has_browser_storage(opts) ||
            (localStorage.getItem(get_prefix(opts)+'_X') === null &&
                sessionStorage.getItem(get_prefix(opts)+'_X') === null))
            return [null, null];
        var pos = [parseInt(get_browser_store(opts, get_prefix(opts)+'_X')),
            parseInt(get_browser_store(opts, get_prefix(opts)+'_Y'))];
        if(get_browser_store(opts,get_prefix(opts)+'_ZOOM') !== null)
            pos.push(parseFloat(get_browser_store(opts, get_prefix(opts)+'_ZOOM')));
        return pos;
    };

}(window.pedcache = window.pedcache || {}, jQuery));

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
        let isChildNode =  pedigree_util.isChildNode(opts, d.data.name)
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
                let conditionId = getConditionId(ui.item.value, opts.conditions);
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

        person.conditions = person.conditions ||  [];
        const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi') ;
        $.each(opts.conditions, function (k, v) {
            let conditionAge = 'age';
            let conditionStatus = 'status';
            let conditionDiagnosed =  'diagnosed';
            let conditionType =  'type';
            let conditionNotes =  'notes';
            const condition =  person.conditions.find((condition)=> condition.name.replace(specialRegex, '-') + '_condition' === k);
            if (condition) {
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
            }
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
            ' input[type=number], select, textarea, #heredity,#ethnicity,  #country_of_origin', function() {
            pedigree_form.saveTabbedForm(opts, d.data.name, null);
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

    function getConditionId(conditionName, conditions) {
        let conditionKey = null;
        Object.keys(conditions).forEach(function(key) {
            if(conditions[key].name === conditionName) {
                conditionKey = key;
            }
        });
        return conditionKey;
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

//# sourceMappingURL=pedigreejs.js.map