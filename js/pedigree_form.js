
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
    });

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
				opts.dataset = newdataset;
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
