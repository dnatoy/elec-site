// Alpine.js component for calculator-wire_sizing.html.
// Depends on window.NEC_DATA (js/nec-data.js), loaded earlier in <head>.
document.addEventListener('alpine:init', function () {
  Alpine.data('wireSizingCalculator', function () {
    var D = window.NEC_DATA;

    var racewayTablePages = {
      EMT: '../tables/tableC1-EMT.html',
      FMC: '../tables/tableC3-FMC.html',
      PVC_SCH40: '../tables/tableC11-PVC.html'
    };

    // MDP schedule-notation raceway codes -- a drawing convention, not NEC data,
    // so it stays local to this calculator rather than in js/nec-data.js.
    var RACEWAY_SCHEDULE_CODES = {
      EMT: 'C',
      FMC: 'FMC',
      PVC_SCH40: 'PVC40'
    };

    // Compact schedule-notation size format (distinct from D.formatSize, which is
    // for on-page display, e.g. "500 kcmil"): reuses D.isKcmil for the AWG/kcmil
    // classification, no space before "kcmil", " AL" suffix for aluminum only.
    function formatScheduleSize(size, mat) {
      var core = D.isKcmil(size) ? size + 'kcmil' : size;
      return core + (mat === 'aluminum' ? ' AL' : '');
    }

    return {
      material: 'copper',
      tempRating: '75',
      ambientC: '30',
      // Standard 240.6(A) OCPD rating -- the sole driver of conductor ampacity sizing
      // (conductors are sized to the OCPD directly). Also drives the 250.122 EGC lookup
      // and the schedule notation. Never feeds raceway fill (numberOfConductors still
      // drives that, independently).
      ocpd: '',
      scheduleCopied: false,

      // Icon-triggered info tooltips (presentation only -- no effect on any calculation).
      // openInfo holds the id of the single currently-open tooltip, or null.
      openInfo: null,
      infoCloseTimer: null,
      // A mousedown right before focus means the focus is a side effect of a
      // click (which toggleInfo already handles) -- not a keyboard Tab. Set by
      // @mousedown on each info-icon-btn, always consumed by the click that
      // follows (whether or not a focus event happened in between).
      skipNextFocus: false,
      // A real mouse click is always preceded by mouseenter (the cursor has to
      // arrive before it can click). Without this, that mouseenter's hover-open
      // would already be "open" by the time the click's toggle runs, so the
      // click would immediately close what the user just saw appear. Consumed
      // by the very next click on the same icon; a genuine second click (mouse
      // resting, no new mouseenter) falls through to a normal toggle-close.
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

      // Flip the tooltip above its field when there isn't enough room below it
      // in the viewport. Horizontal containment is handled purely in CSS
      // (max-width: 100% of the field's own positioning wrapper).
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
      // Raceway fill input. Physical conductors only (line + neutral if present, EXCLUDES
      // the EGC -- that's added separately via includeGround below). This is the only
      // input to fillCount; nothing else on this page writes to it or reads it for
      // anything other than fillCount.
      numberOfConductors: '4',
      includeGround: true,
      racewayType: 'EMT',
      maxSizeCap: '500',

      // Once the user picks a value directly, stop overriding it from ocpd.
      materialTouched: false,
      tempRatingTouched: false,

      // Ampacity-adjustment inputs (Table 310.15(C)(1)). These, together with
      // numberOfConductors, derive currentCarryingConductors in get result() below --
      // a computed value, not directly user-editable, that feeds ONLY the adjustment-factor
      // lookup. It never feeds fillCount, and numberOfConductors never feeds it back.
      hasNeutral: 'yes',
      wyeMajorityNonlinear: false,

      wireSizes: D.WIRE_SIZES,
      racewayOptions: Object.keys(D.CONDUCTOR_FILL).map(function (key) {
        return { key: key, label: D.CONDUCTOR_FILL[key].label };
      }),
      ocpdOptions: D.STANDARD_OCPD_240_6A,

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

      // Suggest aluminum at >=100A OCPD (common practice for larger feeders/services) and
      // the 60°C column at <=60A OCPD (typical equipment listing per NEC 110.14(C)) --
      // only while the user hasn't chosen a value themselves.
      init: function () {
        var self = this;
        this.$watch('ocpd', function (value) {
          var ocpd = parseFloat(value);
          if (isNaN(ocpd)) return;
          if (!self.materialTouched) {
            self.material = ocpd >= 100 ? 'aluminum' : 'copper';
          }
          if (!self.tempRatingTouched) {
            self.tempRating = ocpd <= 60 ? '60' : '75';
          }
        });
        // The nonlinear checkbox only means anything when there's a neutral to count;
        // reset it whenever the neutral toggle flips to "No" so it can't be left checked
        // (and hidden) while still being stale-true for a circuit that has no neutral.
        this.$watch('hasNeutral', function (value) {
          if (value === 'no') {
            self.wyeMajorityNonlinear = false;
          }
        });

        // Click anywhere outside the open tooltip's own field closes it.
        // (Not Alpine's built-in @click.outside -- it wasn't reliably detecting
        // containment here, so this does the same check directly against the DOM.)
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

      get result() {
        var ocpd = parseFloat(this.ocpd);
        if (!this.ocpd || isNaN(ocpd) || ocpd <= 0) {
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
              ambientC + '°C ambient (the table covers up to 85°C, and the highest ambient bands only apply to higher temperature ratings).'
          };
        }

        var numberOfConductors = parseInt(this.numberOfConductors, 10);
        if (!numberOfConductors || numberOfConductors < 1) {
          return { state: 'error', message: 'Enter at least 1 conductor.' };
        }

        // currentCarryingConductors is derived, not user-editable -- it feeds ONLY the
        // Table 310.15(C)(1) adjustment-factor lookup below, never fillCount.
        var hasNeutral = this.hasNeutral === 'yes';
        var currentCarryingConductors;
        if (!hasNeutral || this.wyeMajorityNonlinear) {
          currentCarryingConductors = numberOfConductors;
        } else {
          currentCarryingConductors = numberOfConductors - 1;
        }
        if (currentCarryingConductors < 1) {
          return { state: 'error', message: 'With a neutral conductor, Number of Conductors must be at least 2.' };
        }

        var adjFactor = D.getAdjustmentFactor(currentCarryingConductors);

        var usable = D.AMPACITY_310_16.filter(function (row) {
          return D.compareSizes(row.size, this.maxSizeCap) <= 0;
        }, this);

        var picked = null;
        for (var i = 0; i < usable.length; i++) {
          var row = usable[i];
          var tableAmp = this.material === 'aluminum' ? row.al[this.tempRating] : row.cu[this.tempRating];
          if (tableAmp == null) continue;
          var corrected = tableAmp * tempFactor * adjFactor;
          if (corrected >= ocpd) {
            picked = { size: row.size, tableAmp: tableAmp, corrected: corrected };
            break;
          }
        }

        var sets = 1;

        if (!picked) {
          var capRow = D.AMPACITY_310_16.filter(function (r) { return r.size === this.maxSizeCap; }, this)[0];
          var capAmp = capRow ? (this.material === 'aluminum' ? capRow.al[this.tempRating] : capRow.cu[this.tempRating]) : null;
          if (!capAmp) {
            return {
              state: 'error',
              message: D.formatSize(this.maxSizeCap) + ' has no tabulated ' + this.tempRating +
                '°C ampacity for ' + this.material + '. Pick a larger maximum conductor size or a different temperature rating.'
            };
          }
          var capCorrected = capAmp * tempFactor * adjFactor;
          // The cap size, being the largest allowed, gives the fewest possible sets --
          // this is the minimum sets achievable at all. Now find the SMALLEST size
          // (within cap) that also works at that same set count, rather than just
          // forcing every parallel run up to the cap size regardless of need.
          sets = Math.ceil(ocpd / capCorrected);
          for (var j = 0; j < usable.length; j++) {
            var prow = usable[j];
            var pAmp = this.material === 'aluminum' ? prow.al[this.tempRating] : prow.cu[this.tempRating];
            if (pAmp == null) continue;
            var pCorrected = pAmp * tempFactor * adjFactor;
            if (pCorrected * sets >= ocpd) {
              picked = { size: prow.size, tableAmp: pAmp, corrected: pCorrected };
              break;
            }
          }
        }

        var parallelNotAllowed = sets > 1 && D.compareSizes(picked.size, '1/0') < 0;

        var fillCount = numberOfConductors + (this.includeGround ? 1 : 0);
        var minTrade = D.getMinTradeSize(this.racewayType, picked.size, fillCount);

        // Schedule notation ("A-B & 1-C GND, D", or "E [A-B & 1-C GND, D]" when E > 1;
        // the "& 1-C GND" segment is omitted entirely when the equipment grounding
        // conductor isn't included in raceway fill). EGC (C) always uses the FULL OCPD
        // rating per 250.122(F), regardless of how many parallel sets exist -- ocpd/
        // egcSize are never divided by `sets`.
        var scheduleNotation = null;
        if (minTrade != null) {
          // EGC required but not tabulated (OCPD > 6000A) blocks the whole notation;
          // not needing an EGC at all (includeGround false) just omits this part.
          var egcOk = true;
          var groundPart = '';
          if (this.includeGround) {
            var egcSize = D.getEGCSize(ocpd, this.material);
            egcOk = egcSize != null;
            if (egcOk) {
              groundPart = ' & 1-' + formatScheduleSize(egcSize, this.material) + ' GND';
            }
          }
          if (egcOk) {
            var bPart = formatScheduleSize(picked.size, this.material);
            var dPart = minTrade + '"' + (RACEWAY_SCHEDULE_CODES[this.racewayType] || '');
            var core = numberOfConductors + '-' + bPart + groundPart + ', ' + dPart;
            scheduleNotation = sets > 1 ? sets + ' [' + core + ']' : core;
          }
        }

        return {
          state: 'ok',
          tempFactor: tempFactor,
          currentCarryingConductors: currentCarryingConductors,
          adjFactor: adjFactor,
          size: picked.size,
          sizeLabel: D.formatSize(picked.size),
          tableAmp: picked.tableAmp,
          correctedAmpacity: picked.corrected,
          sets: sets,
          scheduleNotation: scheduleNotation,
          parallelNotAllowed: parallelNotAllowed,
          fillCount: fillCount,
          minTrade: minTrade,
          minTradeLabel: minTrade == null ? null : minTrade + '"',
          fillOutOfRange: minTrade == null,
          racewayLabel: D.CONDUCTOR_FILL[this.racewayType].label,
          necRef: D.CONDUCTOR_FILL[this.racewayType].necRef
        };
      }
    };
  });
});
