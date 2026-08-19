// Alpine.js component for calculator-motor_ocpd.html.
// Depends on window.NEC_DATA (js/nec-data.js), loaded earlier in <head>.
document.addEventListener('alpine:init', function () {
  Alpine.data('motorOcpdCalculator', function () {
    var D = window.NEC_DATA;

    var VOLTAGE_OPTIONS_SINGLE = ['115', '200', '208', '230'];
    var VOLTAGE_OPTIONS_THREE = ['115', '200', '208', '230', '460', '575', '2300'];

    var racewayTablePages = {
      EMT: '../tables/tableC1-EMT.html',
      FMC: '../tables/tableC3-FMC.html',
      PVC_SCH40: '../tables/tableC11-PVC.html'
    };

    // MDP schedule-notation raceway codes -- a drawing convention, not NEC data, so it
    // stays local to this calculator (mirrors calculator-wire_sizing.js's own copy
    // rather than sharing one, since the two calculators are otherwise independent).
    var RACEWAY_SCHEDULE_CODES = {
      EMT: 'C',
      FMC: 'FMC',
      PVC_SCH40: 'PVC40'
    };

    // Compact schedule-notation size format (distinct from D.formatSize, which is for
    // on-page display, e.g. "500 kcmil"): no space before "kcmil", " AL" suffix for
    // aluminum only.
    function formatScheduleSize(size, mat) {
      var core = D.isKcmil(size) ? size + 'kcmil' : size;
      return core + (mat === 'aluminum' ? ' AL' : '');
    }

    // "Recommended" OCPD is common field/design practice, not an NEC value -- unlike
    // the Table 430.52 maximum, it does NOT vary by device type. 175% is the upper end
    // of the typical inverse-time-breaker range and reproduces real-world practice
    // (e.g. a 1/2 HP 115V motor: 9.8A FLC x 175% = 17.15A -> rounds up to a 20A breaker,
    // rather than the 430.52 800% instantaneous-trip max of 80A).
    var RECOMMENDED_OCPD_PERCENT = 175;

    return {
      // Motor nameplate / circuit basics.
      phase: 'three',
      hp: '',
      voltage: '',
      // motorCategory only matters for three-phase (Table 430.52 has a single
      // "Single-phase motors" row); effectiveCategory below forces 'singlePhase'
      // whenever phase === 'single'.
      motorCategory: 'polyphaseOther',
      nameplateFLA: '',
      // 430.32(A)(1): 125% if the nameplate confirms service factor >=1.15 or temp
      // rise <=40°C, otherwise 115%. Defaults to the conservative 115% branch since
      // the higher allowance requires a nameplate fact not assumed by default.
      overloadClass: 'standard',

      // Branch-circuit short-circuit / ground-fault protection (430.52).
      deviceType: 'instantaneous',
      exceptionOverride: false,

      // Branch-circuit conductors (430.22) & raceway fill -- mirrors the approach in
      // calculator-wire_sizing.js, but sized off 125% of motor FLC rather than a
      // user-entered OCPD rating, and with no neutral (motor circuits don't carry one).
      tempRating: '75',
      ambientC: '30',
      material: 'copper',
      // Once the user picks a value directly, stop overriding it from the installed
      // OCPD rating (mirrors calculator-wire_sizing.js's materialTouched flag).
      materialTouched: false,
      numberOfConductors: '3',
      numberOfConductorsTouched: false,
      includeGround: true,
      racewayType: 'EMT',
      maxSizeCap: '500',
      scheduleCopied: false,

      // Icon-triggered info tooltips (presentation only -- no effect on any calculation).
      openInfo: null,
      infoCloseTimer: null,
      skipNextFocus: false,
      justHoverOpened: null,

      showInfo: function (id) {
        clearTimeout(this.infoCloseTimer);
        this.openInfo = id;
        this.positionInfo(id);
      },

      openFromHover: function (id) {
        this.justHoverOpened = id;
        this.showInfo(id);
      },

      handleFocus: function (id) {
        if (this.skipNextFocus) {
          this.skipNextFocus = false;
          return;
        }
        this.showInfo(id);
      },

      toggleInfo: function (id) {
        clearTimeout(this.infoCloseTimer);
        this.skipNextFocus = false;
        if (this.justHoverOpened === id) {
          this.justHoverOpened = null;
          this.openInfo = id;
          this.positionInfo(id);
          return;
        }
        if (this.openInfo === id) {
          this.openInfo = null;
        } else {
          this.openInfo = id;
          this.positionInfo(id);
        }
      },

      scheduleHideInfo: function (id) {
        var self = this;
        clearTimeout(this.infoCloseTimer);
        if (this.justHoverOpened === id) this.justHoverOpened = null;
        this.infoCloseTimer = setTimeout(function () {
          if (self.openInfo === id) self.openInfo = null;
        }, 200);
      },

      cancelHideInfo: function () {
        clearTimeout(this.infoCloseTimer);
      },

      hideInfoIfOpen: function (id) {
        if (this.openInfo === id) this.openInfo = null;
      },

      closeInfo: function () {
        clearTimeout(this.infoCloseTimer);
        this.openInfo = null;
      },

      positionInfo: function (id) {
        var self = this;
        this.$nextTick(function () {
          var el = self.$refs['tip-' + id];
          if (!el) return;
          el.classList.remove('info-tooltip-above');
          var rect = el.getBoundingClientRect();
          if (rect.bottom > window.innerHeight) {
            el.classList.add('info-tooltip-above');
          }
        });
      },

      wireSizes: D.WIRE_SIZES,
      racewayOptions: Object.keys(D.CONDUCTOR_FILL).map(function (key) {
        return { key: key, label: D.CONDUCTOR_FILL[key].label };
      }),
      deviceTypes: D.OCPD_DEVICE_TYPES,
      categoryOptions: Object.keys(D.OCPD_PERCENT_430_52)
        .filter(function (key) { return key !== 'singlePhase'; })
        .map(function (key) { return { key: key, label: D.OCPD_PERCENT_430_52[key].label }; }),

      formatSize: function (size) {
        return D.formatSize(size);
      },

      copyScheduleNotation: function () {
        var self = this;
        var text = this.result.scheduleNotation;
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          self.scheduleCopied = true;
          setTimeout(function () { self.scheduleCopied = false; }, 1500);
        });
      },

      // Suggest aluminum once the OCPD actually protecting the circuit (same
      // egcBasisRating used for EGC sizing -- Recommended by default, or the
      // Exception No. 2 rating once that override is checked) reaches 100A --
      // common practice for larger feeders/branch circuits -- but only while the
      // user hasn't chosen a material themselves. Reads this.result fresh rather
      // than being the $watch'd expression itself, since result also reads
      // material (for ampacity lookups) and watching it directly here would make
      // this suggestion a dependency of the very value it writes to.
      suggestMaterial: function () {
        if (this.materialTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.egcBasisRating == null) return;
        this.material = r.egcBasisRating >= 100 ? 'aluminum' : 'copper';
      },

      init: function () {
        var self = this;

        // HP/voltage options differ by phase; a value valid for one phase's table
        // is almost never valid for the other's, so reset both on switch. Single-phase
        // defaults voltage to 115V (its most common rating); three-phase has no single
        // obvious default, so it resets back to the placeholder.
        this.$watch('phase', function () {
          self.hp = '';
          self.voltage = self.phase === 'single' ? '115' : '';
          if (!self.numberOfConductorsTouched) {
            self.numberOfConductors = self.phase === 'single' ? '2' : '3';
          }
          self.suggestMaterial();
        });
        // Anything else that can move egcBasisRating (and so the aluminum suggestion).
        this.$watch('hp', function () { self.suggestMaterial(); });
        this.$watch('voltage', function () { self.suggestMaterial(); });
        this.$watch('deviceType', function () { self.suggestMaterial(); });
        this.$watch('exceptionOverride', function () { self.suggestMaterial(); });
        this.$watch('motorCategory', function () { self.suggestMaterial(); });

        document.addEventListener('click', function (e) {
          if (self.openInfo == null) return;
          var openTip = self.$refs['tip-' + self.openInfo];
          var wrapper = openTip && openTip.closest('.position-relative');
          if (wrapper && !wrapper.contains(e.target)) {
            self.closeInfo();
          }
        });
      },

      get racewayTablePage() {
        return racewayTablePages[this.racewayType];
      },

      get voltageOptions() {
        return this.phase === 'single' ? VOLTAGE_OPTIONS_SINGLE : VOLTAGE_OPTIONS_THREE;
      },

      get hpOptions() {
        return (this.phase === 'single' ? D.FLC_430_248 : D.FLC_430_250).map(function (r) { return r.hp; });
      },

      get effectiveCategory() {
        return this.phase === 'single' ? 'singlePhase' : this.motorCategory;
      },

      get flc() {
        if (!this.hp || !this.voltage) return null;
        return D.getFLC(this.phase, this.hp, this.voltage);
      },

      get result() {
        if (!this.hp || !this.voltage) {
          return { state: 'empty' };
        }

        var flc = this.flc;
        if (flc == null) {
          return {
            state: 'error',
            message: 'Table ' + (this.phase === 'single' ? '430.248' : '430.250') +
              ' has no full-load current tabulated for ' + this.hp + ' HP at ' + this.voltage + 'V.'
          };
        }

        var ambientC = parseFloat(this.ambientC);
        if (isNaN(ambientC)) {
          return { state: 'error', message: 'Enter an ambient temperature in °C.' };
        }
        var tempFactor = D.getTempCorrectionFactor(ambientC, this.tempRating);
        if (tempFactor == null) {
          return {
            state: 'error',
            message: 'Table 310.15(B)(1) has no ' + this.tempRating + '°C correction factor tabulated for ' +
              ambientC + '°C ambient.'
          };
        }

        var numberOfConductors = parseInt(this.numberOfConductors, 10);
        if (!numberOfConductors || numberOfConductors < 1) {
          return { state: 'error', message: 'Enter at least 1 conductor.' };
        }
        var adjFactor = D.getAdjustmentFactor(numberOfConductors);

        // --- 430.22(A): branch-circuit conductor minimum ampacity ---
        var minConductorAmpacity = flc * 1.25;
        var usable = D.AMPACITY_310_16.filter(function (row) {
          return D.compareSizes(row.size, this.maxSizeCap) <= 0;
        }, this);
        var picked = null;
        for (var i = 0; i < usable.length; i++) {
          var row = usable[i];
          var tableAmp = this.material === 'aluminum' ? row.al[this.tempRating] : row.cu[this.tempRating];
          if (tableAmp == null) continue;
          var corrected = tableAmp * tempFactor * adjFactor;
          if (corrected >= minConductorAmpacity) {
            picked = { size: row.size, tableAmp: tableAmp, corrected: corrected };
            break;
          }
        }

        // --- 430.52: branch-circuit short-circuit/ground-fault protection ---
        var ocpdPercent = D.getOCPDPercent(this.effectiveCategory, this.deviceType);
        var ocpdBaseCurrent = flc * ocpdPercent / 100;
        var ocpdBaseRating = D.getStandardOCPD(ocpdBaseCurrent);

        var exceptionCapPercent = D.getExceptionCapPercent(this.deviceType, flc, ocpdBaseRating);
        var exceptionAvailable = exceptionCapPercent != null;
        var ocpdExceptionRating = null;
        if (exceptionAvailable) {
          var exceptionCurrentCap = flc * exceptionCapPercent / 100;
          ocpdExceptionRating = D.getStandardOCPDAtOrBelow(exceptionCurrentCap);
          if (ocpdExceptionRating != null && ocpdBaseRating != null && ocpdExceptionRating < ocpdBaseRating) {
            ocpdExceptionRating = ocpdBaseRating;
          }
        }
        var finalOcpdRating = (this.exceptionOverride && exceptionAvailable && ocpdExceptionRating != null)
          ? ocpdExceptionRating
          : ocpdBaseRating;

        // "Recommended" is independent of deviceType/exceptionOverride -- it's a fixed,
        // typical-practice figure shown alongside (never instead of) the 430.52 maximum.
        var ocpdRecommendedCurrent = flc * RECOMMENDED_OCPD_PERCENT / 100;
        var ocpdRecommendedRating = D.getStandardOCPD(ocpdRecommendedCurrent);

        // Table 250.122 sizes the EGC off the OCPD that actually protects the circuit,
        // not the bare 430.52 ceiling -- so this uses the Recommended (typical-practice)
        // rating by default, since that's what actually gets installed. It only switches
        // to the Maximum/Exception No. 2 rating when the user has explicitly checked that
        // override, i.e. stated that the typical breaker won't start this motor.
        var egcBasisIsException = this.exceptionOverride && exceptionAvailable && ocpdExceptionRating != null;
        var egcBasisRating = egcBasisIsException ? finalOcpdRating : ocpdRecommendedRating;
        var egcBasisLabel = egcBasisIsException ? 'Exception No. 2' : 'Recommended';
        var egcSize = egcBasisRating != null ? D.getEGCSize(egcBasisRating, this.material) : null;

        var fillCount = numberOfConductors + (this.includeGround ? 1 : 0);
        var minTrade = picked ? D.getMinTradeSize(this.racewayType, picked.size, fillCount) : null;

        // Schedule notation ("A-B & 1-C GND, D"; the "& 1-C GND" segment is omitted
        // entirely when the equipment grounding conductor isn't included in raceway
        // fill). EGC (C) reuses egcSize above, so it can never drift from the EGC
        // shown elsewhere in this result (both are already keyed off finalOcpdRating).
        var scheduleNotation = null;
        if (picked && minTrade != null) {
          var egcOk = !this.includeGround || egcSize != null;
          if (egcOk) {
            var bPart = formatScheduleSize(picked.size, this.material);
            var groundPart = this.includeGround
              ? ' & 1-' + formatScheduleSize(egcSize, this.material) + ' GND'
              : '';
            var dPart = minTrade + '"' + (RACEWAY_SCHEDULE_CODES[this.racewayType] || '');
            scheduleNotation = numberOfConductors + '-' + bPart + groundPart + ', ' + dPart;
          }
        }

        // --- 430.32: overload protection ---
        var nameplateFLA = parseFloat(this.nameplateFLA);
        var overloadFLABasis = (!isNaN(nameplateFLA) && nameplateFLA > 0) ? nameplateFLA : flc;
        var overloadUsedNameplate = !isNaN(nameplateFLA) && nameplateFLA > 0;
        var overloadPercent = this.overloadClass === 'highSF' ? 125 : 115;
        var overloadMaxRating = overloadFLABasis * overloadPercent / 100;

        // --- 430.110(A): disconnecting means minimum ampere rating ---
        var disconnectMinRating = flc * 1.15;

        // --- Table 430.251(B): locked-rotor current reference (polyphase only) ---
        var lockedRotorCurrent = this.phase === 'three' ? D.getLockedRotorCurrent(this.hp, this.voltage) : null;

        return {
          state: 'ok',
          flc: flc,
          tempFactor: tempFactor,
          adjFactor: adjFactor,
          minConductorAmpacity: minConductorAmpacity,
          conductorSize: picked ? picked.size : null,
          conductorSizeLabel: picked ? D.formatSize(picked.size) : null,
          conductorTableAmp: picked ? picked.tableAmp : null,
          conductorCorrectedAmpacity: picked ? picked.corrected : null,
          conductorOutOfRange: !picked,
          egcSize: egcSize,
          egcSizeLabel: egcSize ? D.formatSize(egcSize) : null,
          egcBasisRating: egcBasisRating,
          egcBasisLabel: egcBasisLabel,
          fillCount: fillCount,
          minTrade: minTrade,
          minTradeLabel: minTrade == null ? null : minTrade + '"',
          fillOutOfRange: !!picked && minTrade == null,
          racewayLabel: D.CONDUCTOR_FILL[this.racewayType].label,
          necRef: D.CONDUCTOR_FILL[this.racewayType].necRef,
          scheduleNotation: scheduleNotation,

          ocpdPercent: ocpdPercent,
          ocpdBaseCurrent: ocpdBaseCurrent,
          ocpdBaseRating: ocpdBaseRating,
          exceptionAvailable: exceptionAvailable,
          exceptionCapPercent: exceptionCapPercent,
          ocpdExceptionRating: ocpdExceptionRating,
          finalOcpdRating: finalOcpdRating,
          exceptionApplied: this.exceptionOverride && exceptionAvailable && ocpdExceptionRating != null && ocpdExceptionRating !== ocpdBaseRating,
          recommendedOcpdPercent: RECOMMENDED_OCPD_PERCENT,
          ocpdRecommendedRating: ocpdRecommendedRating,

          overloadFLABasis: overloadFLABasis,
          overloadUsedNameplate: overloadUsedNameplate,
          overloadPercent: overloadPercent,
          overloadMaxRating: overloadMaxRating,

          disconnectMinRating: disconnectMinRating,
          lockedRotorCurrent: lockedRotorCurrent
        };
      }
    };
  });
});
