// Shared NEC reference data for table pages and calculators.
// Figures mirror tables/table310-16.html, tables/table310-15.html,
// tables/table310-15C1.html, tables/tableC1-EMT.html, tables/tableC3-FMC.html,
// tables/tableC11-PVC.html, and tables/table250-122.html -- keep those pages
// and this file in sync.
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

  // Table 240.6(A) - Standard Ampere Ratings for Fuses and Inverse Time Circuit Breakers
  var STANDARD_OCPD_240_6A = [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250,
    300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000
  ];

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

  // Smallest STANDARD_OCPD_240_6A rating >= current. Returns null above the
  // largest standard rating (6000A).
  function getStandardOCPD(current) {
    var match = STANDARD_OCPD_240_6A.filter(function (r) { return current <= r; })[0];
    return match === undefined ? null : match;
  }

  global.NEC_DATA = {
    WIRE_SIZES: WIRE_SIZES,
    AMPACITY_310_16: AMPACITY_310_16,
    TEMP_CORRECTION_310_15B: TEMP_CORRECTION_310_15B,
    ADJUSTMENT_310_15C1: ADJUSTMENT_310_15C1,
    CONDUCTOR_FILL: CONDUCTOR_FILL,
    EGC_250_122: EGC_250_122,
    STANDARD_OCPD_240_6A: STANDARD_OCPD_240_6A,
    compareSizes: compareSizes,
    isKcmil: isKcmil,
    formatSize: formatSize,
    getAmpacity: getAmpacity,
    getTempCorrectionFactor: getTempCorrectionFactor,
    getAdjustmentFactor: getAdjustmentFactor,
    getMinTradeSize: getMinTradeSize,
    getEGCSize: getEGCSize,
    getStandardOCPD: getStandardOCPD
  };
})(window);
