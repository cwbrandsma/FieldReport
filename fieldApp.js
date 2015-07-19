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


				h.lbsPerProt = fieldData.hayLbs * fieldData.dm * avgProt;
				h.basePrice = h.deliver / h.lbsPerProt;
			});
		}

		function calcLab(fieldData){
			var lab = fieldData.lab;
			lab.protPerTon = lab.lbs * lab.dm * lab.prot;
		}

		function calcProcessing(fieldData){
			var d = fieldData;
			var basePrice = getHayBasePrice(d.prot);

			d.tonPerAcre = d.swathTons / d.swathAcre;
			d.costPerAcre = d.swatchCost / d.tonPerAcre;
			d.costPerTon = d.costPerAcre + d.chop + d. mileage + d.innoculant + d.adfTest;
			d.costPerProt = d.costPerTon / d.lab.protPerTon;
			d.costLbProt = basePrice - d.costPerProt;

			d.costHayPerTon = d.costLbProt * d.lab.protPerTon;

			d.totalCost = d.costHayPerTon * d.swathTons;

			d.shareCost = d.totalCost * d.sharePct;
		}

		function getHayBasePrice(labProt){
			var hay = findHayForLabProt(fieldData);
			if (!hay){
				hay = _.first(fieldData.hayTypes);
			}
			return hay.basePrice;
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