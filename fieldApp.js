/*--------------------------------------------------------------------------*/
/*           Copyright (c) 2015 by DiamondB Software, llc.                  */
/*                           All Rights Reserved.                           */
/*           THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF DiamondB.       */
/*           The copyright notice above does not evidence any               */
/*           actual or intended publication of such source code.            */
/*--------------------------------------------------------------------------*/
(function () {
	"use strict";

	var fieldData = {
		title: "Haylage Report",
		desc: (new Date().getFullYear()) + " 1st",
		hayLbs: 2000,
		dm: 0.88,

		hayTypes:[
		{
			title: "Premium Dairy Hay",
			protMin: 0.23,
			protMax: 0.24,
			deliver: 240.0
		},
		{
			title: "Avg Dairy Hay",
			protMin: 0.21,
			protMax: 0.23,
			deliver: 230.0
		},
		{
			title: "Dry Cow/Feeder Hay",
			protMin: 0.19,
			protMax: 0.21,
			deliver: 220.0
		}],
		lab: {
			lbs: 2000,
			dm:0.3,
			prot:0.2088
		},
		swathTons: 1053.5,
		swathAcre: 113,
		swatchCost: 20.0,
		chop: 17.00,
		mileage: 0.0,
		innoculant: 0.85,
		adfTest: 0.00,

		sharePct: 0.2
	};

	if (window.localStorage) {
		var str = localStorage.getItem("fieldData");
		if (str) {
			var data = JSON.parse(str);
			_.assign(fieldData,data);
		}
	}


	var app = angular.module('fieldApp', ['ngRoute']);

	app.config(function($routeProvider){
		$routeProvider
			.when('/', {
				controller:"editCtrl as field",
				templateUrl:"editView.html"
			})
			.when("/print", {
				controller:"printCtrl as field",
				templateUrl:"printView.html"
			})
			.otherwise({redirectTo:'/'});
	});

	app.controller('editCtrl', function(fieldService){
		var fieldVm = this;
		fieldVm.data = fieldData;
		fieldVm.calculate = function(){
			calculate(fieldData);
			// probably not the correct place for this
			localStorage.setItem("fieldData", JSON.stringify(fieldData));
		};

		calculate(fieldData);

		return fieldVm;
	});

	app.controller('printCtrl', function(fieldService){
		var fieldVm = this;
		fieldVm.data = fieldData;

		calculate(fieldData);

		var hay = findHayForLabProt(fieldData);
		fieldData.selectedHayType = [hay];

		return fieldVm;
	});

	app.service('fieldService', function($q){
		return function(){
			var deferrred = $q.defer();

			// currently data is static
			deferrred.resolve(fieldData);

			return deferrred.promise;
		}
	});

	app.filter('percentage', ['$filter', function ($filter) {
		return function (input, decimals) {
			return $filter('number')(input * 100, decimals) + '%';
		};
	}]);

	function calculate(fieldData){
		console.log("calculating values");
		calcHayTypes(fieldData);
		calcLab(fieldData);
		calcProcessing(fieldData);
		return fieldData;

		function calcHayTypes(fieldData){
			_.each(fieldData.hayTypes, function(h){
				var pmin = new BigNumber(h.protMin);
				var pmax = new BigNumber(h.protMax);
				var avgProt = pmin.add(pmax).dividedBy(2); // (h.protMin + h.protMax) / 2;
				console.log("" + pmin + ": avgProt="+ avgProt);

				var lbs = 2000; // fieldData.hayLbs
				var dm = 0.88; // fieldData.dm
				h.lbsPerProt = new BigNumber(lbs).times(dm).times(avgProt).toString();
				h.basePrice = new BigNumber(h.deliver).dividedBy(h.lbsPerProt).toString();

			});
		}

		function calcLab(fieldData){
			var lab = fieldData.lab;
			lab.protPerTon = new BigNumber(lab.lbs).times(lab.dm).times(lab.prot).toString();
		}

		function calcProcessing(fieldData){
			var d = fieldData;
			var hayType = getHayTypeForProtein(d.prot);

			d.hayTypeName = hayType.title;
			var basePrice = hayType.basePrice;

			d.tonPerAcre = new BigNumber(d.swathTons).dividedBy(d.swathAcre).toString();
			d.costPerAcre = new BigNumber(d.swatchCost).dividedBy(d.tonPerAcre).toString();
			console.log('cost per acre '+ d.costPerAcre);

			d.costPerTon = new BigNumber(d.costPerAcre).plus(d.chop).plus(d.mileage).plus(d.innoculant).plus(d.adfTest).toString();
			d.costPerProt = new BigNumber(d.costPerTon).dividedBy(d.lab.protPerTon).toString();
			d.costLbProt = new BigNumber(basePrice).minus(d.costPerProt).toString();

			d.costHayPerTon = new BigNumber(d.costLbProt).times(d.lab.protPerTon).toString();

			d.totalCost = new BigNumber(d.costHayPerTon).times(d.swathTons).toString();

			d.shareCost = new BigNumber(d.totalCost).times(d.sharePct).toString();
		}

		function getHayTypeForProtein(labProt){
			var hay = findHayForLabProt(fieldData);
			if (!hay){
				hay = _.first(fieldData.hayTypes);
			}
			return hay;
		}
	}

	function findHayForLabProt(fieldData){
		var labProt = fieldData.lab.prot;
		var hay = _.find(fieldData.hayTypes, function(h){
			return h.protMin <= labProt && h.protMax > labProt;
		});
		return hay;

	}


}());