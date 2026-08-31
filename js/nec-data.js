// Shared NEC reference data for table pages and calculators.
// Figures mirror tables/table310-16.html, tables/table310-15.html,
// tables/table310-15C1.html, tables/tableC1-EMT.html, tables/tableC3-FMC.html,
// tables/tableC11-PVC.html, tables/table250-102.html, tables/table250-122.html,
// tables/table430-248.html, tables/table430-250.html, tables/table430-251B.html,
// tables/table430-52.html, and tables/table450-3B.html -- keep those pages and
// this file in sync.
(function (global) {
  'use strict';

  // Canonical AWG/kcmil ordering used throughout NEC ampacity tables.
  var WIRE_SIZES = [
    '14', '12', '10', '8', '6', '4', '3', '2', '1',
    '1/0', '2/0', '3/0', '4/0',
    '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000',
    '1250', '1500', '1750', '2000'
  ];

  // Table 310.16 - Ampacities of Insulated Conductors (30°C ambient, <=3 current-carrying conductors)
  var AMPACITY_310_16 = [
    { size: '14', areaCmil: 4110, cu: { 60: 15, 75: 20, 90: 25 }, al: { 60: null, 75: null, 90: null } },
    { size: '12', areaCmil: 6530, cu: { 60: 20, 75: 25, 90: 30 }, al: { 60: 15, 75: 20, 90: 25 } },
    { size: '10', areaCmil: 10380, cu: { 60: 30, 75: 35, 90: 40 }, al: { 60: 25, 75: 30, 90: 35 } },
    { size: '8', areaCmil: 16510, cu: { 60: 40, 75: 50, 90: 55 }, al: { 60: 35, 75: 40, 90: 45 } },
    { size: '6', areaCmil: 26240, cu: { 60: 55, 75: 65, 90: 75 }, al: { 60: 40, 75: 50, 90: 55 } },
    { size: '4', areaCmil: 41740, cu: { 60: 70, 75: 85, 90: 95 }, al: { 60: 55, 75: 65, 90: 75 } },
    { size: '3', areaCmil: 52620, cu: { 60: 85, 75: 100, 90: 115 }, al: { 60: 65, 75: 75, 90: 85 } },
    { size: '2', areaCmil: 66360, cu: { 60: 95, 75: 115, 90: 130 }, al: { 60: 75, 75: 90, 90: 100 } },
    { size: '1', areaCmil: 83690, cu: { 60: 110, 75: 130, 90: 145 }, al: { 60: 85, 75: 100, 90: 115 } },
    { size: '1/0', areaCmil: 105600, cu: { 60: 125, 75: 150, 90: 170 }, al: { 60: 100, 75: 120, 90: 135 } },
    { size: '2/0', areaCmil: 133100, cu: { 60: 145, 75: 175, 90: 195 }, al: { 60: 115, 75: 135, 90: 150 } },
    { size: '3/0', areaCmil: 167800, cu: { 60: 165, 75: 200, 90: 225 }, al: { 60: 130, 75: 155, 90: 175 } },
    { size: '4/0', areaCmil: 211600, cu: { 60: 195, 75: 230, 90: 260 }, al: { 60: 150, 75: 180, 90: 205 } },
    { size: '250', areaCmil: null, cu: { 60: 215, 75: 255, 90: 290 }, al: { 60: 170, 75: 205, 90: 230 } },
    { size: '300', areaCmil: null, cu: { 60: 240, 75: 285, 90: 320 }, al: { 60: 195, 75: 230, 90: 260 } },
    { size: '350', areaCmil: null, cu: { 60: 260, 75: 310, 90: 350 }, al: { 60: 210, 75: 250, 90: 280 } },
    { size: '400', areaCmil: null, cu: { 60: 280, 75: 335, 90: 380 }, al: { 60: 225, 75: 270, 90: 305 } },
    { size: '500', areaCmil: null, cu: { 60: 320, 75: 380, 90: 430 }, al: { 60: 260, 75: 310, 90: 350 } },
    { size: '600', areaCmil: null, cu: { 60: 350, 75: 420, 90: 475 }, al: { 60: 285, 75: 340, 90: 385 } },
    { size: '700', areaCmil: null, cu: { 60: 385, 75: 460, 90: 520 }, al: { 60: 315, 75: 375, 90: 425 } },
    { size: '750', areaCmil: null, cu: { 60: 400, 75: 475, 90: 535 }, al: { 60: 320, 75: 385, 90: 435 } },
    { size: '800', areaCmil: null, cu: { 60: 410, 75: 490, 90: 555 }, al: { 60: 330, 75: 395, 90: 445 } },
    { size: '900', areaCmil: null, cu: { 60: 435, 75: 520, 90: 585 }, al: { 60: 355, 75: 425, 90: 480 } },
    { size: '1000', areaCmil: null, cu: { 60: 455, 75: 545, 90: 615 }, al: { 60: 375, 75: 445, 90: 500 } },
    { size: '1250', areaCmil: null, cu: { 60: 495, 75: 590, 90: 665 }, al: { 60: 405, 75: 485, 90: 545 } },
    { size: '1500', areaCmil: null, cu: { 60: 525, 75: 625, 90: 705 }, al: { 60: 435, 75: 520, 90: 585 } },
    { size: '1750', areaCmil: null, cu: { 60: 545, 75: 650, 90: 735 }, al: { 60: 455, 75: 545, 90: 615 } },
    { size: '2000', areaCmil: null, cu: { 60: 555, 75: 665, 90: 750 }, al: { 60: 470, 75: 560, 90: 630 } }
  ];

  // Table 310.15(B)(1) - Ambient Temperature Correction Factors (base 30°C/86°F)
  var TEMP_CORRECTION_310_15B = [
    { minC: null, maxC: 10, minF: null, maxF: 50, factor: { 60: 1.29, 75: 1.20, 90: 1.15 } },
    { minC: 11, maxC: 15, minF: 51, maxF: 59, factor: { 60: 1.22, 75: 1.15, 90: 1.12 } },
    { minC: 16, maxC: 20, minF: 60, maxF: 68, factor: { 60: 1.15, 75: 1.11, 90: 1.08 } },
    { minC: 21, maxC: 25, minF: 69, maxF: 77, factor: { 60: 1.08, 75: 1.05, 90: 1.04 } },
    { minC: 26, maxC: 30, minF: 78, maxF: 86, factor: { 60: 1.00, 75: 1.00, 90: 1.00 } },
    { minC: 31, maxC: 35, minF: 87, maxF: 95, factor: { 60: 0.91, 75: 0.94, 90: 0.96 } },
    { minC: 36, maxC: 40, minF: 96, maxF: 104, factor: { 60: 0.82, 75: 0.88, 90: 0.91 } },
    { minC: 41, maxC: 45, minF: 105, maxF: 113, factor: { 60: 0.71, 75: 0.82, 90: 0.87 } },
    { minC: 46, maxC: 50, minF: 114, maxF: 122, factor: { 60: 0.58, 75: 0.75, 90: 0.82 } },
    { minC: 51, maxC: 55, minF: 123, maxF: 131, factor: { 60: 0.41, 75: 0.67, 90: 0.76 } },
    { minC: 56, maxC: 60, minF: 132, maxF: 140, factor: { 60: null, 75: 0.58, 90: 0.71 } },
    { minC: 61, maxC: 65, minF: 141, maxF: 149, factor: { 60: null, 75: 0.47, 90: 0.65 } },
    { minC: 66, maxC: 70, minF: 150, maxF: 158, factor: { 60: null, 75: 0.33, 90: 0.58 } },
    { minC: 71, maxC: 75, minF: 159, maxF: 167, factor: { 60: null, 75: null, 90: 0.50 } },
    { minC: 76, maxC: 80, minF: 168, maxF: 176, factor: { 60: null, 75: null, 90: 0.41 } },
    { minC: 81, maxC: 85, minF: 177, maxF: 185, factor: { 60: null, 75: null, 90: 0.29 } }
  ];

  // Table 310.15(C)(1) - Adjustment Factors for More Than Three Current-Carrying Conductors
  // (1-3 conductors is not a code table row; included here as the implicit 100% baseline.)
  var ADJUSTMENT_310_15C1 = [
    { min: 1, max: 3, percent: 100 },
    { min: 4, max: 6, percent: 80 },
    { min: 7, max: 9, percent: 70 },
    { min: 10, max: 20, percent: 50 },
    { min: 21, max: 30, percent: 45 },
    { min: 31, max: 40, percent: 40 },
    { min: 41, max: Infinity, percent: 35 }
  ];

  // Tables C.1 / C.3 / C.11 - Maximum Number of THHN/THWN/THWN-2 Conductors by Trade Size
  var CONDUCTOR_FILL = {
    EMT: {
      label: 'Electrical Metallic Tubing (EMT)',
      necRef: 'C.1',
      conductorTypes: ['THHN', 'THWN', 'THWN-2'],
      tradeSizes: ['1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2', '3', '3 1/2', '4'],
      bySize: {
        '14': [12, 22, 35, 61, 84, 138, 241, 364, 476, 608],
        '12': [9, 16, 26, 45, 61, 101, 176, 266, 347, 443],
        '10': [5, 10, 16, 28, 38, 63, 111, 167, 219, 279],
        '8': [3, 6, 9, 16, 22, 36, 64, 96, 126, 161],
        '6': [2, 4, 7, 12, 16, 26, 46, 69, 91, 116],
        '4': [1, 2, 4, 7, 10, 16, 28, 43, 56, 71],
        '3': [1, 1, 3, 6, 8, 13, 24, 36, 47, 60],
        '2': [1, 1, 3, 5, 7, 11, 20, 30, 40, 51],
        '1': [1, 1, 1, 4, 5, 8, 15, 22, 29, 37],
        '1/0': [1, 1, 1, 3, 4, 7, 12, 19, 25, 32],
        '2/0': [0, 1, 1, 2, 3, 6, 10, 16, 20, 26],
        '3/0': [0, 1, 1, 1, 3, 5, 8, 13, 17, 22],
        '4/0': [0, 1, 1, 1, 2, 4, 7, 11, 14, 18],
        '250': [0, 0, 1, 1, 1, 3, 6, 9, 11, 15],
        '300': [0, 0, 1, 1, 1, 3, 5, 7, 10, 13],
        '350': [0, 0, 1, 1, 1, 2, 4, 6, 9, 11],
        '400': [0, 0, 0, 1, 1, 1, 4, 6, 8, 10],
        '500': [0, 0, 0, 1, 1, 1, 3, 5, 6, 8],
        '600': [0, 0, 0, 1, 1, 1, 2, 4, 5, 7],
        '700': [0, 0, 0, 1, 1, 1, 2, 3, 4, 6],
        '750': [0, 0, 0, 0, 1, 1, 1, 3, 4, 5],
        '800': [0, 0, 0, 0, 1, 1, 1, 3, 4, 5],
        '900': [0, 0, 0, 0, 1, 1, 1, 3, 3, 4],
        '1000': [0, 0, 0, 0, 1, 1, 1, 2, 3, 4]
      }
    },
    FMC: {
      label: 'Flexible Metal Conduit (FMC)',
      necRef: 'C.3',
      conductorTypes: ['THHN', 'THWN', 'THWN-2'],
      tradeSizes: ['3/8', '1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2', '3', '3 1/2', '4'],
      bySize: {
        '14': [4, 13, 22, 33, 52, 76, 135, 202, 291, 396, 518],
        '12': [3, 9, 16, 24, 38, 56, 98, 147, 212, 289, 378],
        '10': [1, 6, 10, 15, 24, 35, 62, 93, 134, 182, 238],
        '8': [1, 3, 6, 9, 14, 20, 35, 53, 77, 105, 137],
        '6': [1, 2, 4, 6, 10, 14, 25, 38, 55, 76, 99],
        '4': [0, 1, 2, 4, 6, 9, 16, 24, 34, 46, 61],
        '3': [0, 1, 1, 3, 5, 7, 13, 20, 29, 39, 51],
        '2': [0, 1, 1, 3, 4, 6, 11, 17, 24, 33, 43],
        '1': [0, 1, 1, 1, 3, 4, 8, 12, 18, 24, 32],
        '1/0': [0, 1, 1, 1, 2, 4, 7, 10, 15, 20, 27],
        '2/0': [0, 0, 1, 1, 1, 3, 6, 9, 12, 17, 22],
        '3/0': [0, 0, 1, 1, 1, 2, 5, 7, 10, 14, 18],
        '4/0': [0, 0, 1, 1, 1, 1, 4, 6, 8, 12, 15],
        '250': [0, 0, 0, 1, 1, 1, 3, 5, 7, 9, 12],
        '300': [0, 0, 0, 1, 1, 1, 3, 4, 6, 8, 11],
        '350': [0, 0, 0, 1, 1, 1, 2, 3, 5, 7, 9],
        '400': [0, 0, 0, 0, 1, 1, 1, 3, 5, 6, 8],
        '500': [0, 0, 0, 0, 1, 1, 1, 2, 4, 5, 7],
        '600': [0, 0, 0, 0, 0, 1, 1, 1, 3, 4, 5],
        '700': [0, 0, 0, 0, 0, 1, 1, 1, 3, 4, 5],
        '750': [0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
        '800': [0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
        '900': [0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 4],
        '1000': [0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 3]
      }
    },
    PVC_SCH40: {
      label: 'Rigid PVC Conduit, Schedule 40 / HDPE',
      necRef: 'C.11',
      conductorTypes: ['THHN', 'THWN', 'THWN-2'],
      tradeSizes: ['1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2', '3', '3 1/2', '4'],
      bySize: {
        '14': [11, 21, 34, 60, 82, 135, 193, 299, 401, 517],
        '12': [8, 15, 25, 43, 59, 99, 141, 218, 293, 377],
        '10': [5, 9, 15, 27, 37, 62, 89, 137, 184, 238],
        '8': [3, 5, 9, 16, 21, 36, 51, 79, 106, 137],
        '6': [1, 4, 6, 11, 15, 26, 37, 57, 77, 99],
        '4': [1, 2, 4, 7, 9, 16, 22, 35, 47, 61],
        '3': [1, 1, 3, 6, 8, 13, 19, 30, 40, 51],
        '2': [1, 1, 3, 5, 7, 11, 16, 25, 33, 43],
        '1': [1, 1, 1, 3, 5, 8, 12, 18, 25, 32],
        '1/0': [1, 1, 1, 3, 4, 7, 10, 15, 21, 27],
        '2/0': [0, 1, 1, 2, 3, 6, 8, 13, 17, 22],
        '3/0': [0, 1, 1, 1, 3, 5, 7, 11, 14, 18],
        '4/0': [0, 1, 1, 1, 2, 4, 6, 9, 12, 15],
        '250': [0, 0, 1, 1, 1, 3, 4, 7, 10, 12],
        '300': [0, 0, 1, 1, 1, 3, 4, 6, 8, 11],
        '350': [0, 0, 1, 1, 1, 2, 3, 5, 7, 9],
        '400': [0, 0, 0, 1, 1, 1, 3, 5, 6, 8],
        '500': [0, 0, 0, 1, 1, 1, 2, 4, 5, 7],
        '600': [0, 0, 0, 1, 1, 1, 1, 3, 4, 5],
        '700': [0, 0, 0, 0, 1, 1, 1, 3, 4, 5],
        '750': [0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
        '800': [0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
        '900': [0, 0, 0, 0, 1, 1, 1, 2, 3, 4],
        '1000': [0, 0, 0, 0, 0, 1, 1, 1, 3, 3]
      }
    }
  };

  // Table 250.122 - Minimum Size Equipment Grounding Conductors for Grounding
  // Raceway and Equipment. maxOCPD is the "Not Exceeding (Amperes)" row key.
  var EGC_250_122 = [
    { maxOCPD: 15, cu: '14', al: '12' },
    { maxOCPD: 20, cu: '12', al: '10' },
    { maxOCPD: 60, cu: '10', al: '8' },
    { maxOCPD: 100, cu: '8', al: '6' },
    { maxOCPD: 200, cu: '6', al: '4' },
    { maxOCPD: 300, cu: '4', al: '2' },
    { maxOCPD: 400, cu: '3', al: '1' },
    { maxOCPD: 500, cu: '2', al: '1/0' },
    { maxOCPD: 600, cu: '1', al: '2/0' },
    { maxOCPD: 800, cu: '1/0', al: '3/0' },
    { maxOCPD: 1000, cu: '2/0', al: '4/0' },
    { maxOCPD: 1200, cu: '3/0', al: '250' },
    { maxOCPD: 1600, cu: '4/0', al: '350' },
    { maxOCPD: 2000, cu: '250', al: '400' },
    { maxOCPD: 2500, cu: '350', al: '600' },
    { maxOCPD: 3000, cu: '400', al: '600' },
    { maxOCPD: 4000, cu: '500', al: '750' },
    { maxOCPD: 5000, cu: '700', al: '1250' },
    { maxOCPD: 6000, cu: '800', al: '1250' }
  ];

  // Table 250.102(C)(1) - Supply-Side Bonding Jumper sizing for AC systems, keyed by
  // the largest ungrounded (phase) conductor size actually installed. Cu and Al ranges
  // don't align 1:1 (see tables/table250-102.html), so each row carries its own Cu and
  // Al upper-bound breakpoint alongside the same-material bonding jumper size.
  var SUPPLY_BONDING_JUMPER_250_102C1 = [
    { cuMax: '2', alMax: '1/0', cu: '8', al: '6' },
    { cuMax: '1/0', alMax: '3/0', cu: '6', al: '4' },
    { cuMax: '3/0', alMax: '250', cu: '4', al: '2' },
    { cuMax: '350', alMax: '500', cu: '2', al: '1/0' },
    { cuMax: '600', alMax: '900', cu: '1/0', al: '3/0' },
    { cuMax: '1100', alMax: '1750', cu: '2/0', al: '4/0' }
  ];

  // Table 240.6(A) - Standard Ampere Ratings for Fuses and Inverse Time Circuit Breakers
  var STANDARD_OCPD_240_6A = [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250,
    300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000
  ];

  // NEC 240.4(D) - Small Conductors. Maximum overcurrent protection for these sizes,
  // applied AFTER ambient/conductor-count correction, regardless of the size's actual
  // ampacity (unless 240.4(E) or (G) specifically permits otherwise). The list stops
  // at 10 AWG -- 8 AWG and larger have no fixed small-conductor cap. Sizes below 12 AWG
  // (16/18 AWG, and their extra conditions) are omitted: no calculator here offers them.
  var SMALL_CONDUCTOR_OCPD_240_4D = {
    '14': { copper: 15, aluminum: null },
    '12': { copper: 20, aluminum: 15 },
    '10': { copper: 30, aluminum: 25 }
  };

  // Table 430.248 - Full-Load Currents in Amperes, Single-Phase AC Motors.
  // Valid for system voltage ranges 110-120 and 220-240V; columns keyed by rated motor voltage.
  var FLC_430_248 = [
    { hp: '1/6', 115: 4.4, 200: 2.5, 208: 2.4, 230: 2.2 },
    { hp: '1/4', 115: 5.8, 200: 3.3, 208: 3.2, 230: 2.9 },
    { hp: '1/3', 115: 7.2, 200: 4.1, 208: 4, 230: 3.6 },
    { hp: '1/2', 115: 9.8, 200: 5.6, 208: 5.4, 230: 4.9 },
    { hp: '3/4', 115: 13.8, 200: 7.9, 208: 7.6, 230: 6.9 },
    { hp: '1', 115: 16, 200: 9.2, 208: 8.8, 230: 8 },
    { hp: '1 1/2', 115: 20, 200: 11.5, 208: 11, 230: 10 },
    { hp: '2', 115: 24, 200: 13.8, 208: 13.2, 230: 12 },
    { hp: '3', 115: 34, 200: 19.6, 208: 18.7, 230: 17 },
    { hp: '5', 115: 56, 200: 32.2, 208: 30.8, 230: 28 },
    { hp: '7 1/2', 115: 80, 200: 46, 208: 44, 230: 40 },
    { hp: '10', 115: 100, 200: 57.5, 208: 55, 230: 50 }
  ];

  // Table 430.250 - Full-Load Current, Three-Phase AC Motors (induction-type squirrel
  // cage and wound rotor). Valid for system voltage ranges 110-120, 220-240, 440-480,
  // and 550-600V; null = not tabulated ("-" in the NEC table) at that HP/voltage.
  var FLC_430_250 = [
    { hp: '1/2', 115: 4.4, 200: 2.5, 208: 2.4, 230: 2.2, 460: 1.1, 575: 0.9, 2300: null },
    { hp: '3/4', 115: 6.4, 200: 3.7, 208: 3.5, 230: 3.2, 460: 1.6, 575: 1.3, 2300: null },
    { hp: '1', 115: 8.4, 200: 4.8, 208: 4.6, 230: 4.2, 460: 2.1, 575: 1.7, 2300: null },
    { hp: '1 1/2', 115: 12, 200: 6.9, 208: 6.6, 230: 6, 460: 3, 575: 2.4, 2300: null },
    { hp: '2', 115: 13.6, 200: 7.8, 208: 7.5, 230: 6.8, 460: 3.4, 575: 2.7, 2300: null },
    { hp: '3', 115: null, 200: 11, 208: 10.6, 230: 9.6, 460: 4.8, 575: 3.9, 2300: null },
    { hp: '5', 115: null, 200: 17.5, 208: 16.7, 230: 15.2, 460: 7.6, 575: 6.1, 2300: null },
    { hp: '7 1/2', 115: null, 200: 25.3, 208: 24.2, 230: 22, 460: 11, 575: 9, 2300: null },
    { hp: '10', 115: null, 200: 32.2, 208: 30.8, 230: 28, 460: 14, 575: 11, 2300: null },
    { hp: '15', 115: null, 200: 48.3, 208: 46.2, 230: 42, 460: 21, 575: 17, 2300: null },
    { hp: '20', 115: null, 200: 62.1, 208: 59.4, 230: 54, 460: 27, 575: 22, 2300: null },
    { hp: '25', 115: null, 200: 78.2, 208: 74.8, 230: 68, 460: 34, 575: 27, 2300: null },
    { hp: '30', 115: null, 200: 92, 208: 88, 230: 80, 460: 40, 575: 32, 2300: null },
    { hp: '40', 115: null, 200: 120, 208: 114, 230: 104, 460: 52, 575: 41, 2300: null },
    { hp: '50', 115: null, 200: 150, 208: 143, 230: 130, 460: 65, 575: 52, 2300: null },
    { hp: '60', 115: null, 200: 177, 208: 169, 230: 154, 460: 77, 575: 62, 2300: 16 },
    { hp: '75', 115: null, 200: 221, 208: 211, 230: 192, 460: 96, 575: 77, 2300: 20 },
    { hp: '100', 115: null, 200: 285, 208: 273, 230: 248, 460: 124, 575: 99, 2300: 26 },
    { hp: '125', 115: null, 200: 359, 208: 343, 230: 312, 460: 156, 575: 125, 2300: 31 },
    { hp: '150', 115: null, 200: 414, 208: 396, 230: 360, 460: 180, 575: 144, 2300: 37 },
    { hp: '200', 115: null, 200: 552, 208: 528, 230: 480, 460: 240, 575: 192, 2300: 49 },
    { hp: '250', 115: null, 200: null, 208: null, 230: null, 460: 302, 575: 242, 2300: 60 },
    { hp: '300', 115: null, 200: null, 208: null, 230: null, 460: 361, 575: 289, 2300: 72 },
    { hp: '350', 115: null, 200: null, 208: null, 230: null, 460: 414, 575: 336, 2300: 83 },
    { hp: '400', 115: null, 200: null, 208: null, 230: null, 460: 477, 575: 382, 2300: 95 },
    { hp: '450', 115: null, 200: null, 208: null, 230: null, 460: 515, 575: 412, 2300: 103 },
    { hp: '500', 115: null, 200: null, 208: null, 230: null, 460: 590, 575: 472, 2300: 118 }
  ];

  // Table 430.251(B) - Max locked-rotor current, polyphase Design B/C/D motors
  // (NEC tabulates one combined value per HP/voltage for Design B, C, and D).
  // For selection of disconnecting means/controllers per 430.110, 440.12, 440.41, 455.8(C).
  // No 2300V column in the source table; null = not tabulated ("-").
  var LRC_430_251B = [
    { hp: '1/2', 115: 40, 200: 23, 208: 22.1, 230: 20, 460: 10, 575: 8 },
    { hp: '3/4', 115: 50, 200: 28.8, 208: 27.6, 230: 25, 460: 12.5, 575: 10 },
    { hp: '1', 115: 60, 200: 34.5, 208: 33, 230: 30, 460: 15, 575: 12 },
    { hp: '1 1/2', 115: 80, 200: 46, 208: 44, 230: 40, 460: 20, 575: 16 },
    { hp: '2', 115: 100, 200: 57.5, 208: 55, 230: 50, 460: 25, 575: 20 },
    { hp: '3', 115: null, 200: 73.6, 208: 71, 230: 64, 460: 32, 575: 25.6 },
    { hp: '5', 115: null, 200: 105.8, 208: 102, 230: 92, 460: 46, 575: 36.8 },
    { hp: '7 1/2', 115: null, 200: 146, 208: 140, 230: 127, 460: 63.5, 575: 50.8 },
    { hp: '10', 115: null, 200: 186.3, 208: 179, 230: 162, 460: 81, 575: 64.8 },
    { hp: '15', 115: null, 200: 267, 208: 257, 230: 232, 460: 116, 575: 93 },
    { hp: '20', 115: null, 200: 334, 208: 321, 230: 290, 460: 145, 575: 116 },
    { hp: '25', 115: null, 200: 420, 208: 404, 230: 365, 460: 183, 575: 146 },
    { hp: '30', 115: null, 200: 500, 208: 481, 230: 435, 460: 218, 575: 174 },
    { hp: '40', 115: null, 200: 667, 208: 641, 230: 580, 460: 290, 575: 232 },
    { hp: '50', 115: null, 200: 834, 208: 802, 230: 725, 460: 363, 575: 290 },
    { hp: '60', 115: null, 200: 1001, 208: 962, 230: 870, 460: 435, 575: 348 },
    { hp: '75', 115: null, 200: 1248, 208: 1200, 230: 1085, 460: 543, 575: 434 },
    { hp: '100', 115: null, 200: 1668, 208: 1603, 230: 1450, 460: 725, 575: 580 },
    { hp: '125', 115: null, 200: 2087, 208: 2007, 230: 1815, 460: 908, 575: 726 },
    { hp: '150', 115: null, 200: 2496, 208: 2400, 230: 2170, 460: 1085, 575: 868 },
    { hp: '200', 115: null, 200: 3335, 208: 3207, 230: 2900, 460: 1450, 575: 1160 },
    { hp: '250', 115: null, 200: null, 208: null, 230: null, 460: 1825, 575: 1460 },
    { hp: '300', 115: null, 200: null, 208: null, 230: null, 460: 2200, 575: 1760 },
    { hp: '350', 115: null, 200: null, 208: null, 230: null, 460: 2550, 575: 2040 },
    { hp: '400', 115: null, 200: null, 208: null, 230: null, 460: 2900, 575: 2320 },
    { hp: '450', 115: null, 200: null, 208: null, 230: null, 460: 3250, 575: 2600 },
    { hp: '500', 115: null, 200: null, 208: null, 230: null, 460: 3625, 575: 2900 }
  ];

  // Table 430.52 - Maximum Rating/Setting of Motor Branch-Circuit Short-Circuit and
  // Ground-Fault Protective Devices, as a percentage of full-load current. Device keys:
  // nontime (nontime-delay fuse), dual (dual-element/time-delay fuse), instantaneous
  // (instantaneous-trip breaker / MCP), inverse (inverse-time breaker). "dc" omitted --
  // no DC full-load-current table is carried in this data file.
  var OCPD_PERCENT_430_52 = {
    singlePhase: { label: 'Single-phase motors', nontime: 300, dual: 175, instantaneous: 800, inverse: 250 },
    polyphaseOther: { label: 'AC polyphase motors other than wound-rotor', nontime: 300, dual: 175, instantaneous: 800, inverse: 250 },
    squirrelCage: { label: 'Squirrel cage — other than Design B energy-efficient', nontime: 300, dual: 175, instantaneous: 800, inverse: 250 },
    designB: { label: 'Design B energy-efficient', nontime: 300, dual: 175, instantaneous: 1100, inverse: 250 },
    synchronous: { label: 'Synchronous', nontime: 300, dual: 175, instantaneous: 800, inverse: 250 },
    woundRotor: { label: 'Wound-rotor', nontime: 150, dual: 150, instantaneous: 800, inverse: 150 }
  };

  // Human-readable labels for the OCPD_PERCENT_430_52 device keys, in Table 430.52's
  // column order.
  var OCPD_DEVICE_TYPES = [
    { key: 'nontime', label: 'Nontime-Delay Fuse' },
    { key: 'dual', label: 'Dual-Element (Time-Delay) Fuse' },
    { key: 'instantaneous', label: 'Instantaneous-Trip Breaker (MCP)' },
    { key: 'inverse', label: 'Inverse-Time Breaker' }
  ];

  // Table 450.3(B) - Maximum Rating or Setting of Overcurrent Protection for
  // Transformers 1000V and Less, as a percentage of transformer rated current.
  // Only the primary-only and primary-and-secondary methods are modeled (Table
  // 450.3(A), for transformers over 1000V, isn't in this data set). The 9A/2A
  // breakpoints select which primary-only percentage applies; the primary-and-
  // secondary method's primary percentage is flat 250% regardless of current
  // (Note 3's coordinated-thermal-overload alternative, 6x/4x by impedance,
  // isn't modeled here either).
  var TRANSFORMER_OCPD_450_3B = {
    primaryOnly: {
      primary: { ge9: 125, lt9: 167, lt2: 300 } // Note 1: round up to next standard rating
    },
    primaryAndSecondary: {
      primary: 250, // Note 3
      secondary: { ge9: 125, lt9: 167 } // Note 1 on the ge9 bracket
    }
  };

  // Typical commercial/industrial catalog kVA sizes -- field/catalog data, not an
  // NEC table (cf. RECOMMENDED_OCPD_PERCENT in calculator-motor_ocpd.js). Sanity-
  // check this list against actual supplier catalogs before relying on it. No
  // liquid-filled single-phase list is carried -- liquid-filled units are
  // typically specified three-phase for MDP's scope.
  var STANDARD_TRANSFORMER_KVA = {
    dry: {
      three: [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500],
      single: [5, 7.5, 10, 15, 25, 37.5, 50, 75, 100, 167, 250, 333, 500]
    },
    liquid: {
      three: [75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500, 3750, 5000],
      single: null
    }
  };

  function sizeIndex(size) {
    return WIRE_SIZES.indexOf(String(size));
  }

  function compareSizes(a, b) {
    return sizeIndex(a) - sizeIndex(b);
  }

  function isKcmil(size) {
    return sizeIndex(size) >= sizeIndex('250');
  }

  function formatSize(size) {
    return size + (isKcmil(size) ? ' kcmil' : ' AWG');
  }

  // Circular-mil area for any AWG/kcmil size. AMPACITY_310_16's areaCmil column
  // only covers 14 AWG through 4/0 -- kcmil sizes ARE their own area in thousands
  // of circular mils by definition, so this fills in the rest without a table
  // lookup. Returns null only if the size isn't recognized at all.
  function getAreaCmil(size) {
    var row = AMPACITY_310_16.filter(function (r) { return r.size === String(size); })[0];
    if (row && row.areaCmil != null) return row.areaCmil;
    return isKcmil(size) ? parseFloat(size) * 1000 : null;
  }

  // Smallest single WIRE_SIZES entry whose area is >= the combined area of `sets`
  // parallel conductors of `size` -- the "equivalent area for parallel conductors"
  // basis Table 250.102(C)(1) uses for sizing a single bonding jumper that spans
  // multiple paralleled raceways together (as opposed to sizing one full bonding
  // jumper per raceway off each raceway's own conductor). Returns null if no
  // tabulated size is large enough (largest is 2000 kcmil).
  function getEquivalentSingleSize(size, sets) {
    var perConductorArea = getAreaCmil(size);
    if (perConductorArea == null) return null;
    var totalArea = perConductorArea * sets;
    var match = WIRE_SIZES.filter(function (s) {
      var a = getAreaCmil(s);
      return a != null && a >= totalArea;
    })[0];
    return match === undefined ? null : match;
  }

  // Table 250.102(C)(1) Note 1: once the ungrounded conductor (or equivalent area
  // for parallel conductors) exceeds the table's largest tabulated breakpoint
  // (1100 kcmil Cu / 1750 kcmil Al), the bonding jumper/grounded conductor must
  // have an area >= 12.5% of the ungrounded conductor's (or equivalent parallel)
  // area -- but per Note 1's own second sentence, is never required to be larger
  // than the ungrounded conductor actually installed in that raceway (`size`),
  // regardless of how many sets it's paralleled with. `sets` defaults to 1 for a
  // single (non-paralleled) oversized conductor. Returns `size` itself if even the
  // 12.5% figure can't be met by any tabulated size (falls back to the cap).
  function getNote1BondingJumperSize(size, sets) {
    var perConductorArea = getAreaCmil(size);
    if (perConductorArea == null) return null;
    var totalArea = perConductorArea * (sets || 1);
    var requiredArea = totalArea * 0.125;
    var computed = WIRE_SIZES.filter(function (s) {
      var a = getAreaCmil(s);
      return a != null && a >= requiredArea;
    })[0];
    if (computed === undefined) return size;
    return compareSizes(computed, size) > 0 ? size : computed;
  }

  function getAmpacity(size, material, tempRating) {
    var row = AMPACITY_310_16.filter(function (r) { return r.size === String(size); })[0];
    if (!row) return null;
    var col = material === 'aluminum' ? row.al : row.cu;
    return col[tempRating] != null ? col[tempRating] : null;
  }

  function getTempCorrectionFactor(ambientC, tempRating) {
    var row = TEMP_CORRECTION_310_15B.filter(function (r) {
      return (r.minC === null || ambientC >= r.minC) && ambientC <= r.maxC;
    })[0];
    if (!row) return null;
    return row.factor[tempRating] != null ? row.factor[tempRating] : null;
  }

  function getAdjustmentFactor(conductorCount) {
    var row = ADJUSTMENT_310_15C1.filter(function (r) {
      return conductorCount >= r.min && conductorCount <= r.max;
    })[0];
    return row ? row.percent / 100 : 1;
  }

  // Smallest trade size (from racewayType's tradeSizes list) that fits
  // conductorCount conductors of the given size. Returns null if none fit
  // within the table's largest listed trade size.
  function getMinTradeSize(racewayType, size, conductorCount) {
    var raceway = CONDUCTOR_FILL[racewayType];
    if (!raceway) return null;
    var counts = raceway.bySize[String(size)];
    if (!counts) return null;
    for (var i = 0; i < counts.length; i++) {
      if (counts[i] >= conductorCount) return raceway.tradeSizes[i];
    }
    return null;
  }

  // Smallest EGC_250_122 row whose maxOCPD is >= ocpd (250.122(B): round up to
  // the next table rating). Returns null above the table's largest row (6000A).
  function getEGCSize(ocpd, material) {
    var row = EGC_250_122.filter(function (r) { return ocpd <= r.maxOCPD; })[0];
    if (!row) return null;
    return material === 'aluminum' ? row.al : row.cu;
  }

  // Table 250.102(C)(1) supply-side bonding jumper size for the given ungrounded
  // (phase) conductor size actually installed. Returns null above the largest
  // tabulated breakpoint (1100 kcmil Cu / 1750 kcmil Al) -- Note 1 there requires
  // 12.5% of the ungrounded conductor's circular-mil area instead of a fixed size,
  // which this function doesn't compute; callers must handle that case explicitly.
  function getSupplyBondingJumperSize(conductorSize, material) {
    var maxKey = material === 'aluminum' ? 'alMax' : 'cuMax';
    var row = SUPPLY_BONDING_JUMPER_250_102C1.filter(function (r) {
      return compareSizes(conductorSize, r[maxKey]) <= 0;
    })[0];
    if (!row) return null;
    return material === 'aluminum' ? row.al : row.cu;
  }

  // NEC 240.4(D) maximum OCPD for a small conductor (12 or 10 AWG here), in amperes.
  // Returns Infinity when 240.4(D) imposes no cap: 8 AWG and larger, or a size/material
  // pair the table doesn't list (e.g. 14 AWG aluminum, which has no ampacity anyway).
  // The value is a hard ceiling on the OCPD after correction/adjustment -- it is NOT a
  // "round up to the next standard size" allowance.
  function getSmallConductorOCPDCap(size, material) {
    var row = SMALL_CONDUCTOR_OCPD_240_4D[String(size)];
    if (!row) return Infinity;
    var cap = row[material];
    return cap == null ? Infinity : cap;
  }

  // Smallest STANDARD_OCPD_240_6A rating >= current. Returns null above the
  // largest standard rating (6000A).
  function getStandardOCPD(current) {
    var match = STANDARD_OCPD_240_6A.filter(function (r) { return current <= r; })[0];
    return match === undefined ? null : match;
  }

  // Largest STANDARD_OCPD_240_6A rating <= current. Used for 430.52(C)(1) Exception No. 2,
  // where the increased rating is a hard ceiling (not a "round up to next standard size"
  // allowance like the base Table 430.52 rule). Returns null below the smallest rating (15A).
  function getStandardOCPDAtOrBelow(current) {
    var matches = STANDARD_OCPD_240_6A.filter(function (r) { return r <= current; });
    return matches.length ? matches[matches.length - 1] : null;
  }

  // Table 430.248 (single-phase) full-load current for hp/voltage. Returns null if
  // that HP/voltage combination isn't tabulated.
  function getFLC_1ph(hp, voltage) {
    var row = FLC_430_248.filter(function (r) { return r.hp === String(hp); })[0];
    if (!row) return null;
    var v = row[voltage];
    return v == null ? null : v;
  }

  // Table 430.250 (three-phase) full-load current for hp/voltage. Returns null if
  // that HP/voltage combination isn't tabulated.
  function getFLC_3ph(hp, voltage) {
    var row = FLC_430_250.filter(function (r) { return r.hp === String(hp); })[0];
    if (!row) return null;
    var v = row[voltage];
    return v == null ? null : v;
  }

  // Full-load current lookup for either phase configuration.
  function getFLC(phase, hp, voltage) {
    return phase === 'single' ? getFLC_1ph(hp, voltage) : getFLC_3ph(hp, voltage);
  }

  // Table 430.251(B) locked-rotor current (polyphase Design B/C/D only). Returns null
  // if not tabulated for that hp/voltage (includes all single-phase and 2300V lookups,
  // since neither is a column in the source table).
  function getLockedRotorCurrent(hp, voltage) {
    var row = LRC_430_251B.filter(function (r) { return r.hp === String(hp); })[0];
    if (!row) return null;
    var v = row[voltage];
    return v == null ? null : v;
  }

  // Table 430.52 percentage for a motor category + device type. Returns null if the
  // category key isn't recognized.
  function getOCPDPercent(category, deviceType) {
    var row = OCPD_PERCENT_430_52[category];
    if (!row) return null;
    return row[deviceType] != null ? row[deviceType] : null;
  }

  // 430.52(C)(1) Exception No. 2 hard ceiling, as a percentage of FLC. baseRating is the
  // standard-size rating already selected under the base Table 430.52 rule (needed because
  // the nontime-delay-fuse breakpoint is stated in the NEC text as a fuse rating, not FLC).
  // Returns null for device types with no Exception No. 2 allowance (instantaneous-trip
  // breakers/MCPs must instead use the 430.52(C)(3) trial-setting procedure).
  function getExceptionCapPercent(deviceType, flc, baseRating) {
    if (deviceType === 'nontime') {
      return baseRating != null && baseRating <= 600 ? 400 : 300;
    }
    if (deviceType === 'dual') {
      return 225;
    }
    if (deviceType === 'inverse') {
      return flc <= 100 ? 400 : 300;
    }
    return null;
  }

  // Smallest STANDARD_TRANSFORMER_KVA entry >= loadKVA for the given type/phase.
  // Returns null if that type/phase combination has no catalog list (see the
  // liquid-filled single-phase note above), or if loadKVA exceeds the largest
  // tabulated size.
  function getStandardTransformerKVA(transformerType, phase, loadKVA) {
    var list = STANDARD_TRANSFORMER_KVA[transformerType] && STANDARD_TRANSFORMER_KVA[transformerType][phase];
    if (!list) return null;
    var match = list.filter(function (k) { return loadKVA <= k; })[0];
    return match === undefined ? null : match;
  }

  // Table 450.3(B) primary-side percentage. The primary-and-secondary method is a
  // flat 250% regardless of current; the primary-only method depends on which
  // current bracket primaryFLC falls in.
  function getTransformerPrimaryOCPDPercent(protectionMethod, primaryFLC) {
    if (protectionMethod === 'primaryAndSecondary') {
      return TRANSFORMER_OCPD_450_3B.primaryAndSecondary.primary;
    }
    var b = TRANSFORMER_OCPD_450_3B.primaryOnly.primary;
    if (primaryFLC < 2) return b.lt2;
    if (primaryFLC < 9) return b.lt9;
    return b.ge9;
  }

  // Table 450.3(B) secondary-side percentage (primary-and-secondary method only --
  // the primary-only method has "Not required" in the secondary columns).
  function getTransformerSecondaryOCPDPercent(secondaryFLC) {
    var b = TRANSFORMER_OCPD_450_3B.primaryAndSecondary.secondary;
    return secondaryFLC < 9 ? b.lt9 : b.ge9;
  }

  global.NEC_DATA = {
    WIRE_SIZES: WIRE_SIZES,
    AMPACITY_310_16: AMPACITY_310_16,
    TEMP_CORRECTION_310_15B: TEMP_CORRECTION_310_15B,
    ADJUSTMENT_310_15C1: ADJUSTMENT_310_15C1,
    CONDUCTOR_FILL: CONDUCTOR_FILL,
    EGC_250_122: EGC_250_122,
    SUPPLY_BONDING_JUMPER_250_102C1: SUPPLY_BONDING_JUMPER_250_102C1,
    STANDARD_OCPD_240_6A: STANDARD_OCPD_240_6A,
    SMALL_CONDUCTOR_OCPD_240_4D: SMALL_CONDUCTOR_OCPD_240_4D,
    FLC_430_248: FLC_430_248,
    FLC_430_250: FLC_430_250,
    LRC_430_251B: LRC_430_251B,
    OCPD_PERCENT_430_52: OCPD_PERCENT_430_52,
    OCPD_DEVICE_TYPES: OCPD_DEVICE_TYPES,
    TRANSFORMER_OCPD_450_3B: TRANSFORMER_OCPD_450_3B,
    STANDARD_TRANSFORMER_KVA: STANDARD_TRANSFORMER_KVA,
    compareSizes: compareSizes,
    isKcmil: isKcmil,
    formatSize: formatSize,
    getAreaCmil: getAreaCmil,
    getEquivalentSingleSize: getEquivalentSingleSize,
    getNote1BondingJumperSize: getNote1BondingJumperSize,
    getAmpacity: getAmpacity,
    getTempCorrectionFactor: getTempCorrectionFactor,
    getAdjustmentFactor: getAdjustmentFactor,
    getMinTradeSize: getMinTradeSize,
    getEGCSize: getEGCSize,
    getSupplyBondingJumperSize: getSupplyBondingJumperSize,
    getSmallConductorOCPDCap: getSmallConductorOCPDCap,
    getStandardOCPD: getStandardOCPD,
    getStandardOCPDAtOrBelow: getStandardOCPDAtOrBelow,
    getFLC: getFLC,
    getLockedRotorCurrent: getLockedRotorCurrent,
    getOCPDPercent: getOCPDPercent,
    getExceptionCapPercent: getExceptionCapPercent,
    getStandardTransformerKVA: getStandardTransformerKVA,
    getTransformerPrimaryOCPDPercent: getTransformerPrimaryOCPDPercent,
    getTransformerSecondaryOCPDPercent: getTransformerSecondaryOCPDPercent
  };
})(window);
