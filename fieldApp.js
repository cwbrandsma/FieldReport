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
			title: "Dy Cow/Feedher Hay",
			protMin: 0.21,
			protMax: 0.19,
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

	var app = angular.module('fieldApp', []);

	app.controller('fieldCtrl', function(fieldService){
		var fieldVm = this;
		fieldVm.data = fieldData;
		fieldVm.calculate = calculate;

		calculate();

		return fieldVm;

		function calculate(){
			console.log("calculating values");
			calcHayTypes();
			calcLab();
			calcProcessing();
		}

		function calcHayTypes(){
			_.each(fieldData.hayTypes, function(h){
				var pmin = new BigNumber(h.protMin);
				var pmax = new BigNumber(h.protMax);
				var avgProt = pmin.add(pmax).dividedBy(2); // (h.protMin + h.protMax) / 2;


				h.lbsPerProt = fieldData.hayLbs * fieldData.dm * avgProt;
				h.basePrice = h.deliver / h.lbsPerProt;
			});
		}

		function calcLab(){
			var lab = fieldData.lab;
			lab.protPerTon = lab.lbs * lab.dm * lab.prot;
		}

		function calcProcessing(){
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
			var hay = _.find(fieldData.hayTypes, function(h){
				return h.pmin >= labProt && h.pmax < labProt;
			});
			if (!hay){
				hay = _.first(fieldData.hayTypes);
			}
			return hay.basePrice;
		}

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

	angular.formatter('percent', {
		parse: function(value) {
			var m = value.match(/^(\d+)\/(\d+)/);
			if (m != null)
				return angular.filter.number(parseInt(m[1])/parseInt(m[2]), 2);
			return angular.filter.number(parseFloat(value)/100, 2);
		},
		format: function(value) {
			return angular.filter.number(parseFloat(value)*100, 0);
		},
	});

}());