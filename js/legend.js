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

        for (var i = 0; i < opts.dataset.length; i++) {
            opts.dataset[i].conditions = opts.dataset[i].conditions || [];
            opts.dataset[i].conditions.forEach((condition)=>{
                    legend.addConditionLegendToOpts(opts, getConditionId(condition.name), condition);
            });
        }

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

    function getConditionId(conditionName) {
        const specialRegex = new RegExp(`[ ~!@#$%^&*()|+-=?;:'",.]`, 'gi');
        return conditionName.replace(specialRegex, '-') + '_condition';
    }

    legend.getCaseCount = function(opts, k) {
        let case_count = 0;
        opts.dataset.forEach(function (person) {
            person.conditions = person.conditions || [];
            person.conditions.forEach((condition)=>{
                if (getConditionId(condition.name) === k){
                    case_count++;
                }
            });
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