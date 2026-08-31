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
      FMC: 'C',
      PVC_SCH40: 'PVC40'
    };

    // Compact schedule-notation size format (distinct from D.formatSize, which is
    // for on-page display, e.g. "500 kcmil"): reuses D.isKcmil for the AWG/kcmil
    // classification, no space before "kcmil", " AL" suffix for aluminum only.
    function formatScheduleSize(size, mat) {
      var core = D.isKcmil(size) ? size + 'kcmil' : size;
      return core + (mat === 'aluminum' ? ' AL' : '');
    }

    // MDP design standard: 14 AWG is not used on power circuits, so no conductor
    // in the schedule notation drops below 12 AWG -- neither the phase conductor
    // (even when a smaller size would carry the OCPD) nor the equipment grounding
    // conductor (even when Table 250.122 would allow a 14 AWG copper EGC at a 15 A
    // OCPD). Upsizing from the NEC minimum is always code-compliant. Mirrors the
    // same floor in calculator-motor_ocpd.js.
    var MIN_CONDUCTOR_SIZE = '12';

    // Every user-facing input on the form, with its starting value. Held as one
    // object so the "Reset" button can restore all of them in a single
    // Object.assign (see reset()) without a hand-maintained second copy.
    var INPUT_DEFAULTS = {
      material: 'copper',
      tempRating: '75',
      ambientC: '30',
      // Standard 240.6(A) OCPD rating -- the sole driver of conductor ampacity sizing
      // (conductors are sized to the OCPD directly). Also drives the 250.122 EGC lookup
      // and the schedule notation. Never feeds raceway fill (numberOfConductors still
      // drives that, independently).
      ocpd: '',
      scheduleCopied: false,

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
      wyeMajorityNonlinear: false
    };

    return {
      // Spread of the plain-data defaults above; the getters/methods below stay
      // live (Object.assign would have flattened them to one-time values).
      ...INPUT_DEFAULTS,

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

      // "Max Single Conductor" choices -- 14 AWG is excluded so the cap can't be
      // set below the MIN_CONDUCTOR_SIZE floor (see the result getter).
      wireSizes: D.WIRE_SIZES.filter(function (size) {
        return D.compareSizes(size, MIN_CONDUCTOR_SIZE) >= 0;
      }),
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

      // Restore every form input to its starting value. The $watch on `ocpd` and
      // `hasNeutral` (see init) may re-fire here, but only re-derives values that
      // are already back at their INPUT_DEFAULTS state. Transient UI state (open
      // tooltips) is intentionally left alone.
      reset: function () {
        Object.assign(this, INPUT_DEFAULTS);
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

        // Two-step sizing (NEC 310.14(A)(1) + 110.14(C)):
        //   Step 1 -- ampacity correction (ambient) and adjustment (conductor count)
        //            are applied to the 90 °C column, because MDP installs 90 °C-rated
        //            wire (THWN-2 / XHHW-2) and 310.14(A)(1) permits a conductor rated
        //            above the termination temperature to be used for correction,
        //            adjustment, or both. The ambient correction factor is therefore
        //            taken from the 90 °C column too -- this.tempRating never enters it.
        //   Step 2 -- the result is then limited to the ampacity of the lowest-rated
        //            termination (this.tempRating), taken straight from the table with
        //            no factors applied (110.14(C)).
        // Final ampacity per set = min(Step 1, Step 2).
        var DERATING_BASIS = '90';
        var tempFactor = D.getTempCorrectionFactor(ambientC, DERATING_BASIS);
        if (tempFactor == null) {
          return {
            state: 'error',
            message: 'Table 310.15(B)(1) has no correction factor for ' + ambientC +
              '°C ambient (the table covers ambients up to 85°C).'
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
          return D.compareSizes(row.size, this.maxSizeCap) <= 0 &&
            D.compareSizes(row.size, MIN_CONDUCTOR_SIZE) >= 0;
        }, this);

        var self = this;
        // Per-set ampacity picture for one table row: the 90 °C basis, the Step 1
        // adjusted/corrected value, the Step 2 termination limit, and the governing
        // (lower) of the two. Returns null when either column is untabulated for the
        // material (e.g. aluminum below 12 AWG).
        function ampInfoFor(row) {
          var amp90 = self.material === 'aluminum' ? row.al[DERATING_BASIS] : row.cu[DERATING_BASIS];
          var termAmp = self.material === 'aluminum' ? row.al[self.tempRating] : row.cu[self.tempRating];
          if (amp90 == null || termAmp == null) return null;
          var adjusted = amp90 * tempFactor * adjFactor;
          return {
            amp90: amp90,
            termAmp: termAmp,
            adjusted: adjusted,
            governing: Math.min(adjusted, termAmp),
            // NEC 240.4(D): hard ceiling on the OCPD for 12/10 AWG, independent of
            // ampacity. Infinity for 8 AWG and larger (no small-conductor cap).
            smallCondCap: D.getSmallConductorOCPDCap(row.size, self.material)
          };
        }

        function pick(row, info) {
          return {
            size: row.size,
            amp90: info.amp90,
            termAmp: info.termAmp,
            adjusted: info.adjusted,
            governing: info.governing,
            smallCondCap: info.smallCondCap
          };
        }

        // Set when a size that carries enough ampacity is rejected solely because
        // the OCPD exceeds its NEC 240.4(D) small-conductor limit -- i.e. 240.4(D)
        // is what forced the upsize. Records the first such size and its cap.
        var smallCondLimit = null;

        var picked = null;
        for (var i = 0; i < usable.length; i++) {
          var info = ampInfoFor(usable[i]);
          if (!info) continue;
          if (info.governing >= ocpd) {
            if (ocpd > info.smallCondCap) {
              if (!smallCondLimit) {
                smallCondLimit = { size: usable[i].size, cap: info.smallCondCap };
              }
              continue;
            }
            picked = pick(usable[i], info);
            break;
          }
        }

        var sets = 1;

        if (!picked) {
          var capRow = D.AMPACITY_310_16.filter(function (r) { return r.size === this.maxSizeCap; }, this)[0];
          var capInfo = capRow ? ampInfoFor(capRow) : null;
          if (!capInfo) {
            return {
              state: 'error',
              message: D.formatSize(this.maxSizeCap) + ' has no tabulated 90°C or ' + this.tempRating +
                '°C ampacity for ' + this.material + '. Pick a larger maximum conductor size or a different temperature rating.'
            };
          }
          // The cap size, being the largest allowed, gives the fewest possible sets --
          // this is the minimum sets achievable at all. Now find the SMALLEST size
          // (within cap) that also works at that same set count, rather than just
          // forcing every parallel run up to the cap size regardless of need. Each
          // set has its own terminations, so both Step 1 and Step 2 scale with `sets`
          // and the governing per-set ampacity can be multiplied directly.
          sets = Math.ceil(ocpd / capInfo.governing);
          for (var j = 0; j < usable.length; j++) {
            var pInfo = ampInfoFor(usable[j]);
            if (!pInfo) continue;
            if (pInfo.governing * sets >= ocpd) {
              picked = pick(usable[j], pInfo);
              break;
            }
          }
        }

        var parallelNotAllowed = sets > 1 && D.compareSizes(picked.size, '1/0') < 0;

        var fillCount = numberOfConductors + (this.includeGround ? 1 : 0);
        var minTrade = D.getMinTradeSize(this.racewayType, picked.size, fillCount);

        // Schedule notation ("A-B & 1-C GND, D", or "E [A-B & 1-C GND, D]" when E > 1;
        // the "& 1-C GND" segment is omitted entirely when the equipment grounding
        // conductor isn't included in raceway fill). The EGC (C) lookup always uses
        // the FULL OCPD rating -- it is never divided by `sets` (250.122 sizes the
        // per-raceway EGC off the feeder/branch OCPD, not a per-set share) -- but it
        // is then capped at the ungrounded conductor size per 250.122(A): the EGC is
        // not required to be larger than the circuit conductors supplying the
        // equipment. With parallel sets the 2026 NEC parallel-conductor provision
        // states the same cap per raceway (EGC in each raceway need not exceed the
        // largest ungrounded conductor in that raceway); either way the cap is
        // picked.size.
        var scheduleNotation = null;
        var egcCappedToPhase = false;
        if (minTrade != null) {
          // EGC required but not tabulated (OCPD > 6000A) blocks the whole notation;
          // not needing an EGC at all (includeGround false) just omits this part.
          var egcOk = true;
          var groundPart = '';
          if (this.includeGround) {
            var egcSize = D.getEGCSize(ocpd, this.material);
            // Apply the same 12 AWG design floor to the EGC (Table 250.122 gives a
            // 14 AWG copper EGC at a 15 A OCPD, which MDP doesn't install).
            if (egcSize != null && D.compareSizes(egcSize, MIN_CONDUCTOR_SIZE) < 0) {
              egcSize = MIN_CONDUCTOR_SIZE;
            }
            // 250.122(A) cap: the EGC need not be larger than the ungrounded
            // conductors it runs with. In the parallel case (sets > 1) this is the
            // per-raceway "largest ungrounded conductor in the raceway" rule from
            // the 2026 NEC parallel-conductor provision. picked.size is always
            // >= MIN_CONDUCTOR_SIZE, so this can't undo the floor above.
            if (egcSize != null && D.compareSizes(egcSize, picked.size) > 0) {
              egcSize = picked.size;
              egcCappedToPhase = true;
            }
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
          // Step 1: 90 °C table ampacity and its corrected/adjusted value (per set).
          amp90: picked.amp90,
          adjustedAmpacity: picked.adjusted,
          // Step 2: the lowest-rated termination and its bare table ampacity (per set).
          terminationRating: this.tempRating,
          terminationAmp: picked.termAmp,
          // Governing per-set ampacity = min(Step 1, Step 2). `terminationLimited`
          // is true when 110.14(C) is what holds the size back (Step 2 < Step 1);
          // `deratingApplied` says whether any correction/adjustment was in play at
          // all, so the Result pane can word the explanation appropriately.
          governingAmpacity: picked.governing,
          terminationLimited: picked.termAmp < picked.adjusted,
          deratingApplied: tempFactor !== 1 || adjFactor !== 1,
          // NEC 240.4(D): `smallConductorCap` is the OCPD ceiling on the CHOSEN size
          // when it's a 12/10 AWG size (null otherwise). `smallConductorForced` is
          // true when a size with enough ampacity was skipped because the OCPD
          // exceeded its 240.4(D) limit -- i.e. 240.4(D), not ampacity, set the size.
          smallConductorCap: isFinite(picked.smallCondCap) ? picked.smallCondCap : null,
          smallConductorForced: !!smallCondLimit,
          smallConductorForcedFrom: smallCondLimit,
          // NEC 310.10(H)(1): total circuit ampacity is the sum of each parallel
          // set's governing ampacity -- reuses governingAmpacity and sets directly
          // (rather than recomputing) so it can never drift from the values above.
          totalCircuitAmpacity: picked.governing * sets,
          ocpdCheckPass: picked.governing * sets >= ocpd,
          sets: sets,
          scheduleNotation: scheduleNotation,
          egcCappedToPhase: egcCappedToPhase,
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
