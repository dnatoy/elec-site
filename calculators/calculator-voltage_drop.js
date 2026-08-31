// Alpine.js component for calculator-voltage_drop.html.
// Depends on window.NEC_DATA (js/nec-data.js), loaded earlier in <head>.
document.addEventListener('alpine:init', function () {
  Alpine.data('voltageDropCalculator', function () {
    var D = window.NEC_DATA;

    // Common nominal system voltages offered in the datalist (line-to-line for
    // three-phase, circuit voltage across the load for single-phase). Free entry
    // is still allowed -- this is only a convenience list.
    var VOLTAGE_OPTIONS = [120, 208, 240, 277, 347, 480, 600];

    // Ampacity column used for the load-current size suggestion. 75 C is the
    // usual feeder/branch termination rating above 100 A; the suggestion is only
    // a starting point (voltage drop, not ampacity, is this tool's job) and the
    // user can override it.
    var SUGGEST_TEMP_RATING = '75';

    // NEC 310.10(H)(1): conductors may be run in parallel only in sizes 1/0 AWG
    // and larger, so the "max single conductor" cap can't be set below 1/0.
    var MIN_PARALLEL_SIZE = '1/0';

    // How many parallel sets of the cap size the "meets target" search will try
    // before giving up.
    var MAX_SETS_SEARCH = 8;

    // Every user-facing input on the form, with its starting value. Held as one
    // object so the "Reset" button can restore all of them in a single
    // Object.assign (see reset()).
    var INPUT_DEFAULTS = {
      phase: 'three',
      voltage: '',
      current: '',
      powerFactor: '0.9',
      pfType: 'lagging',
      lengthFt: '',
      size: '',
      // Once the user picks a value directly, stop overriding it from the load
      // current (mirrors the *Touched flags in calculator-wire_sizing.js).
      sizeTouched: false,
      materialTouched: false,
      material: 'copper',
      // Table 9 column selector: 'pvc' (PVC or other nonmetallic raceway),
      // 'aluminum' (aluminum conduit), 'steel' (steel conduit). PVC and aluminum
      // share the reactance column; all three have their own a.c. resistance.
      // Steel is the default -- EMT/IMC/RMC is the common MDP raceway.
      conduitClass: 'steel',
      // Largest size used for one conductor per phase. When `size` is larger
      // than this, the run is split into equal parallel sets of this size.
      maxSingleConductor: '500',
      targetPct: '3'
    };

    return {
      ...INPUT_DEFAULTS,

      // ---- Icon-triggered info tooltips (presentation only) -------------------
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

      // ---- Static option lists ---------------------------------------------
      voltageOptions: VOLTAGE_OPTIONS,
      sizeOptions: D.AC_IMPEDANCE_CH9_T9.map(function (row) { return row.size; }),
      // "Max single conductor" choices -- 1/0 AWG and up only (310.10(H)(1)).
      maxSizeOptions: D.AC_IMPEDANCE_CH9_T9
        .map(function (row) { return row.size; })
        .filter(function (s) { return D.compareSizes(s, MIN_PARALLEL_SIZE) >= 0; }),

      formatSize: function (size) {
        return D.formatSize(size);
      },

      conduitLabel: function (key) {
        if (key === 'pvc') return 'PVC / nonmetallic';
        if (key === 'aluminum') return 'aluminum conduit';
        return 'steel conduit';
      },

      // Smallest Table 9 size whose Table 310.16 ampacity at SUGGEST_TEMP_RATING
      // carries the load current, for the current material. null when the load
      // current is blank/invalid or exceeds a single 1000 kcmil conductor.
      get suggestedSize() {
        var current = parseFloat(this.current);
        if (isNaN(current) || current <= 0) return null;
        for (var i = 0; i < this.sizeOptions.length; i++) {
          var amp = D.getAmpacity(this.sizeOptions[i], this.material, SUGGEST_TEMP_RATING);
          if (amp != null && amp >= current) return this.sizeOptions[i];
        }
        return null;
      },

      applySuggestion: function () {
        var s = this.suggestedSize;
        if (!s) return;
        this.size = s;
        this.sizeTouched = false;
      },

      reset: function () {
        Object.assign(this, INPUT_DEFAULTS);
      },

      init: function () {
        var self = this;

        // Suggest aluminum once the load current reaches 100 A (common practice
        // for larger feeders/services), copper below that -- only while the user
        // hasn't chosen a material themselves. Mirrors calculator-wire_sizing.js.
        function autofillMaterial() {
          if (self.materialTouched) return;
          var current = parseFloat(self.current);
          if (isNaN(current)) return;
          self.material = current >= 100 ? 'aluminum' : 'copper';
        }

        // Auto-fill the conductor size from the load current until the user
        // picks one. Re-runs when the current or the material changes.
        function autofillSize() {
          if (self.sizeTouched) {
            // Keep a stale 14 AWG selection valid for aluminum (not in Table 9).
            if (self.material === 'aluminum' && self.size === '14') self.size = '12';
            return;
          }
          var s = self.suggestedSize;
          if (s) self.size = s;
        }
        this.$watch('current', function () {
          autofillMaterial();
          autofillSize();
        });
        this.$watch('material', autofillSize);

        document.addEventListener('click', function (e) {
          if (self.openInfo == null) return;
          var openTip = self.$refs['tip-' + self.openInfo];
          var wrapper = openTip && openTip.closest('.position-relative');
          if (wrapper && !wrapper.contains(e.target)) {
            self.closeInfo();
          }
        });
      },

      // Given the intended conductor size and the max-single-conductor cap,
      // decide the size actually run and how many equal parallel sets. When the
      // intended size is within the cap it's a single set; otherwise the run is
      // split into ceil(area ratio) sets of the cap size.
      parallelPlan: function (intendedSize, cap) {
        if (D.compareSizes(intendedSize, cap) <= 0) {
          return { runSize: intendedSize, sets: 1, paralleled: false };
        }
        var needArea = D.getAreaCmil(intendedSize);
        var perArea = D.getAreaCmil(cap);
        var sets = Math.max(2, Math.ceil(needArea / perArea));
        return { runSize: cap, sets: sets, paralleled: true };
      },

      // Voltage drop for one Table 9 size at the current material / conduit /
      // parallel-set count / load. Returns null when that size/material isn't
      // tabulated. `ctx` carries the already-parsed and validated inputs.
      dropForSize: function (size, ctx) {
        var z = D.getTable9Impedance(size, this.material, this.conduitClass);
        if (!z) return null;
        var rPerK = z.r / ctx.sets;
        var xPerK = z.x / ctx.sets;
        var xSign = ctx.pfType === 'leading' ? -1 : 1;
        var ze = rPerK * ctx.pf + xSign * xPerK * ctx.sinTheta;
        var vdVolts = ctx.k * ctx.current * ze * (ctx.lengthFt / 1000);
        return {
          r: z.r,
          x: z.x,
          rPerK: rPerK,
          xPerK: xPerK,
          ze: ze,
          vdVolts: vdVolts,
          vdPct: (vdVolts / ctx.voltage) * 100
        };
      },

      get result() {
        var voltage = parseFloat(this.voltage);
        var current = parseFloat(this.current);
        var pf = parseFloat(this.powerFactor);
        var lengthFt = parseFloat(this.lengthFt);
        var target = parseFloat(this.targetPct);

        // Not enough entered yet -- stay quiet.
        if (!this.voltage || !this.current || !this.powerFactor || !this.lengthFt || !this.size) {
          return { state: 'empty' };
        }

        if (isNaN(voltage) || voltage <= 0) {
          return { state: 'error', message: 'Enter a system voltage greater than 0.' };
        }
        if (isNaN(current) || current <= 0) {
          return { state: 'error', message: 'Enter a load current greater than 0 A.' };
        }
        if (isNaN(pf) || pf <= 0 || pf > 1) {
          return { state: 'error', message: 'Power factor must be greater than 0 and no more than 1.' };
        }
        if (isNaN(lengthFt) || lengthFt <= 0) {
          return { state: 'error', message: 'Enter a one-way circuit length greater than 0 ft.' };
        }
        if (isNaN(target) || target <= 0) {
          return { state: 'error', message: 'Enter a target voltage drop greater than 0%.' };
        }

        var plan = this.parallelPlan(this.size, this.maxSingleConductor);

        var impedance = D.getTable9Impedance(plan.runSize, this.material, this.conduitClass);
        if (!impedance) {
          return {
            state: 'error',
            message: 'NEC Chapter 9 Table 9 does not tabulate ' + D.formatSize(plan.runSize) + ' ' +
              (this.material === 'aluminum' ? 'aluminum' : 'copper') +
              '. Table 9 stops at 1000 kcmil and has no 14 AWG aluminum row.'
          };
        }

        var theta = Math.acos(pf);
        var ctx = {
          voltage: voltage,
          current: current,
          pf: pf,
          pfType: this.pfType,
          sinTheta: Math.sin(theta),
          lengthFt: lengthFt,
          sets: plan.sets,
          k: this.phase === 'single' ? 2 : Math.sqrt(3)
        };

        var picked = this.dropForSize(plan.runSize, ctx);
        var vLoad = voltage - picked.vdVolts;

        // Smallest option that lands at or under the target: first walk single
        // sizes up to the cap, then try 2..MAX_SETS_SEARCH parallel sets of the
        // cap size.
        var recCtx = Object.assign({}, ctx);
        var recommended = null;
        for (var i = 0; i < this.sizeOptions.length; i++) {
          var s = this.sizeOptions[i];
          if (D.compareSizes(s, this.maxSingleConductor) > 0) break;
          recCtx.sets = 1;
          var c1 = this.dropForSize(s, recCtx);
          if (c1 && c1.vdPct <= target) {
            recommended = { size: s, sets: 1, vdPct: c1.vdPct };
            break;
          }
        }
        if (!recommended) {
          for (var n = 2; n <= MAX_SETS_SEARCH; n++) {
            recCtx.sets = n;
            var cn = this.dropForSize(this.maxSingleConductor, recCtx);
            if (cn && cn.vdPct <= target) {
              recommended = { size: this.maxSingleConductor, sets: n, vdPct: cn.vdPct };
              break;
            }
          }
        }

        return {
          state: 'ok',
          phaseLabel: this.phase === 'single' ? 'Single-phase (2-wire)' : 'Three-phase',
          kLabel: this.phase === 'single' ? '2' : '√3',
          intendedSizeLabel: D.formatSize(this.size),
          runSizeLabel: D.formatSize(plan.runSize),
          capLabel: D.formatSize(this.maxSingleConductor),
          paralleled: plan.paralleled,
          sets: plan.sets,
          materialLabel: this.material === 'aluminum' ? 'Aluminum' : 'Copper',
          conduitLabel: this.conduitLabel(this.conduitClass),
          pfType: this.pfType,
          thetaDeg: theta * 180 / Math.PI,
          cosTheta: pf,
          sinTheta: ctx.sinTheta,
          r: impedance.r,
          x: impedance.x,
          rPerK: picked.rPerK,
          xPerK: picked.xPerK,
          ze: picked.ze,
          vdVolts: picked.vdVolts,
          vdPct: picked.vdPct,
          vLoad: vLoad,
          target: target,
          pass: picked.vdPct <= target,
          maxSetsSearch: MAX_SETS_SEARCH,
          recommended: recommended
        };
      }
    };
  });
});
