// Alpine.js component for calculator-elevator_branch_circuit.html.
// Depends on window.NEC_DATA (js/nec-data.js), loaded earlier in <head>.
//
// Unlike the motor calculators, this tool takes Running Current and
// Accelerating Current directly from the elevator manufacturer's
// nameplate/submittal rather than looking up full-load current from an HP
// table -- so there is no FLC/LRC table lookup here, just the user-entered
// figures fed into the same NEC 310.16 ampacity/raceway-fill logic and
// Article 430 Part IV OCPD percentages already used elsewhere on the site.
// Scoped to a single elevator; no group/multi-elevator demand factor
// (NEC 620.14) yet.
document.addEventListener('alpine:init', function () {
  Alpine.data('elevatorBranchCircuitCalculator', function () {
    var D = window.NEC_DATA;

    var VOLTAGE_OPTIONS_SINGLE = ['115', '200', '208', '230'];
    var VOLTAGE_OPTIONS_THREE = ['200', '208', '230', '460', '480', '575'];

    var racewayTablePages = {
      EMT: '../tables/tableC1-EMT.html',
      FMC: '../tables/tableC3-FMC.html',
      PVC_SCH40: '../tables/tableC11-PVC.html'
    };

    // MDP schedule-notation raceway codes -- a drawing convention, not NEC data, so it
    // stays local to this calculator (mirrors calculator-motor_ocpd.js's own copy
    // rather than sharing one, since the calculators are otherwise independent).
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
    // the Table 430.52 maximum, it does NOT vary by device type. Matches the same
    // figure used in calculator-motor_ocpd.js for consistency across the site.
    var RECOMMENDED_OCPD_PERCENT = 175;

    // NEC 620.13(A): conductors for the driving-machine motor are sized as
    // continuous duty (430.22(A), 125%) here. Table 430.22(E) duty-cycle-service
    // percentages (85%-150%, depending on the motor's marked duty class) can
    // govern instead if the nameplate states one -- flagged in the UI rather than
    // computed, since duty class isn't part of the Running/Accelerating Current
    // inputs this tool collects.
    var CONDUCTOR_CONTINUOUS_DUTY_PERCENT = 125;

    return {
      // Elevator nameplate / submittal basics.
      phase: 'three',
      voltage: '480',
      runningCurrent: '',
      acceleratingCurrent: '',
      auxAmps: '0',

      // Branch-circuit short-circuit / ground-fault protection -- Article 430,
      // Part IV, applied to Running Current in place of table FLC (per 620.13,
      // elevator driving-machine conductors are already nameplate-current sized
      // rather than table-FLC sized).
      deviceType: 'instantaneous',
      exceptionOverride: false,

      // Branch-circuit conductors (620.13) & raceway fill -- mirrors the approach
      // in calculator-motor_ocpd.js, but sized off Running Current (+ auxiliary
      // equipment ampacity) rather than a table FLC, and with no neutral.
      tempRating: '75',
      ambientC: '30',
      material: 'copper',
      // Once the user picks a value directly, stop overriding it from the installed
      // OCPD rating (mirrors calculator-motor_ocpd.js's materialTouched flag).
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
      // user hasn't chosen a material themselves.
      suggestMaterial: function () {
        if (this.materialTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.egcBasisRating == null) return;
        this.material = r.egcBasisRating >= 100 ? 'aluminum' : 'copper';
      },

      init: function () {
        var self = this;

        // Single-phase elevators are rare and typically smaller; reset voltage to
        // a sensible default for each phase rather than leaving a three-phase-only
        // voltage selected. Conductor count follows the same 2/3 default used in
        // calculator-motor_ocpd.js.
        this.$watch('phase', function () {
          if (self.voltageOptions.indexOf(self.voltage) === -1) {
            self.voltage = self.phase === 'single' ? '230' : '480';
          }
          if (!self.numberOfConductorsTouched) {
            self.numberOfConductors = self.phase === 'single' ? '2' : '3';
          }
          self.suggestMaterial();
        });
        this.$watch('runningCurrent', function () { self.suggestMaterial(); });
        this.$watch('deviceType', function () { self.suggestMaterial(); });
        this.$watch('exceptionOverride', function () { self.suggestMaterial(); });

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

      get effectiveCategory() {
        return this.phase === 'single' ? 'singlePhase' : 'polyphaseOther';
      },

      get result() {
        var runningCurrent = parseFloat(this.runningCurrent);
        var acceleratingCurrent = parseFloat(this.acceleratingCurrent);
        if (isNaN(runningCurrent) || runningCurrent <= 0 || isNaN(acceleratingCurrent) || acceleratingCurrent <= 0) {
          return { state: 'empty' };
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

        var auxAmpsParsed = parseFloat(this.auxAmps);
        var auxAmps = (!isNaN(auxAmpsParsed) && auxAmpsParsed > 0) ? auxAmpsParsed : 0;

        // --- NEC 620.13(A)/(D): branch-circuit conductor minimum ampacity ---
        // Motor's own contribution at 125% (continuous duty, 430.22(A)) plus any
        // auxiliary equipment ampacity added at full value (620.13(D) sums
        // nameplate/connected-load current ratings without a further multiplier
        // on the auxiliary portion).
        var minConductorAmpacity = runningCurrent * CONDUCTOR_CONTINUOUS_DUTY_PERCENT / 100 + auxAmps;
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

        // --- Article 430, Part IV (via NEC 620): branch-circuit short-circuit/
        // ground-fault protection, applied to Running Current in place of table FLC ---
        var ocpdPercent = D.getOCPDPercent(this.effectiveCategory, this.deviceType);
        var ocpdBaseCurrent = runningCurrent * ocpdPercent / 100;
        var ocpdBaseRating = D.getStandardOCPD(ocpdBaseCurrent);

        var exceptionCapPercent = D.getExceptionCapPercent(this.deviceType, runningCurrent, ocpdBaseRating);
        var exceptionAvailable = exceptionCapPercent != null;
        var ocpdExceptionRating = null;
        if (exceptionAvailable) {
          var exceptionCurrentCap = runningCurrent * exceptionCapPercent / 100;
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
        var ocpdRecommendedCurrent = runningCurrent * RECOMMENDED_OCPD_PERCENT / 100;
        var ocpdRecommendedRating = D.getStandardOCPD(ocpdRecommendedCurrent);

        // Table 250.122 sizes the EGC off the OCPD that actually protects the circuit,
        // not the bare 430.52 ceiling -- so this uses the Recommended (typical-practice)
        // rating by default, since that's what actually gets installed. It only switches
        // to the Maximum/Exception No. 2 rating when the user has explicitly checked that
        // override, i.e. stated that the typical breaker won't start this elevator.
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

        return {
          state: 'ok',
          runningCurrent: runningCurrent,
          acceleratingCurrent: acceleratingCurrent,
          auxAmps: auxAmps,
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
          ocpdRecommendedRating: ocpdRecommendedRating
        };
      }
    };
  });
});
