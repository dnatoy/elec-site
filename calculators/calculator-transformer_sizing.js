// Alpine.js component for calculator-transformer_sizing.html.
// Depends on window.NEC_DATA (js/nec-data.js), loaded earlier in <head>.
document.addEventListener('alpine:init', function () {
  Alpine.data('transformerSizingCalculator', function () {
    var D = window.NEC_DATA;

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

    // Shared single-conductor ampacity walk (temp- and adjustment-corrected), used
    // by pickConductorParallel below for both the primary and secondary feeder legs.
    // Returns null if nothing up to maxSizeCap meets minAmpacity alone.
    function pickConductor(minAmpacity, material, tempRating, tempFactor, adjFactor, maxSizeCap) {
      var usable = D.AMPACITY_310_16.filter(function (row) {
        return D.compareSizes(row.size, maxSizeCap) <= 0;
      });
      for (var i = 0; i < usable.length; i++) {
        var row = usable[i];
        var tableAmp = material === 'aluminum' ? row.al[tempRating] : row.cu[tempRating];
        if (tableAmp == null) continue;
        var corrected = tableAmp * tempFactor * adjFactor;
        if (corrected >= minAmpacity) {
          return { size: row.size, tableAmp: tableAmp, corrected: corrected };
        }
      }
      return null;
    }

    // Sane field ceiling on parallel sets this tool will search for -- more than
    // this is unusual even on large services, and without a cap the search has no
    // natural stopping point. Not user-adjustable in v1.
    var MAX_PARALLEL_SETS = 10;

    // Ampacity walk with native parallel-set support, used for both the primary and
    // secondary feeder legs (whose material/temp/ambient/count/cap inputs are
    // otherwise entirely independent of each other). Tries a single conductor first;
    // if nothing up to maxSizeCap clears minAmpacity alone, searches upward from the
    // minimum sets achievable at the cap size (NEC 310.10(H)(1): parallel conductors
    // must be 1/0 AWG or larger, so anything smaller is excluded from consideration
    // once sets > 1 -- never just flagged after the fact). Returns
    // { size, tableAmp, corrected, sets } or null if nothing within maxSizeCap and
    // MAX_PARALLEL_SETS clears minAmpacity.
    function pickConductorParallel(minAmpacity, material, tempRating, tempFactor, adjFactor, maxSizeCap) {
      var single = pickConductor(minAmpacity, material, tempRating, tempFactor, adjFactor, maxSizeCap);
      if (single) return { size: single.size, tableAmp: single.tableAmp, corrected: single.corrected, sets: 1 };

      // Paralleling can't help if the cap itself is below the 1/0 parallel minimum.
      if (D.compareSizes(maxSizeCap, '1/0') < 0) return null;

      var capRow = D.AMPACITY_310_16.filter(function (r) { return r.size === maxSizeCap; })[0];
      var capAmp = capRow ? (material === 'aluminum' ? capRow.al[tempRating] : capRow.cu[tempRating]) : null;
      if (capAmp == null) return null;
      var capCorrected = capAmp * tempFactor * adjFactor;
      if (capCorrected <= 0) return null;

      // The cap size, being the largest allowed, gives the fewest possible sets --
      // this is the minimum sets achievable at all (mirrors the parallel search in
      // calculator-wire_sizing.js). Now find the smallest 1/0-or-larger size (within
      // cap) that also works at that same set count, rather than forcing every
      // parallel run up to the cap size regardless of need.
      var sets = Math.ceil(minAmpacity / capCorrected);
      if (sets < 2) sets = 2;
      if (sets > MAX_PARALLEL_SETS) return null;

      var usableParallel = D.AMPACITY_310_16.filter(function (row) {
        return D.compareSizes(row.size, maxSizeCap) <= 0 && D.compareSizes(row.size, '1/0') >= 0;
      });
      for (var i = 0; i < usableParallel.length; i++) {
        var row = usableParallel[i];
        var tableAmp = material === 'aluminum' ? row.al[tempRating] : row.cu[tempRating];
        if (tableAmp == null) continue;
        var corrected = tableAmp * tempFactor * adjFactor;
        if (corrected * sets >= minAmpacity) {
          return { size: row.size, tableAmp: tableAmp, corrected: corrected, sets: sets };
        }
      }
      return null;
    }

    return {
      // Transformer rating / load basics.
      phase: 'three',
      transformerType: 'dry',
      // Standard catalog kVA, picked directly from the STANDARD_TRANSFORMER_KVA list
      // for the current transformerType/phase (see kvaOptions below) -- no more
      // "entered load rounds up to catalog size" step.
      standardKVA: '',
      primaryVoltage: '480',
      secondaryVoltage: '208Y/120',
      // Table 450.3(B) protection method. Primary-and-secondary is the default here
      // as the more common field practice (it also keeps secondary conductors
      // protected at a rating close to their own ampacity rather than riding all
      // the way up on the primary device) -- but this is a judgment call, same as
      // RECOMMENDED_OCPD_PERCENT below. Confirm it matches what actually gets
      // specified on drawings before relying on it.
      protectionMethod: 'primaryAndSecondary',

      // Optional override: use a different standard primary OCPD rating than
      // Recommended -- lower (e.g. to match existing equipment, or to hold a
      // downstream panelboard rating down) or higher (extra coordination headroom,
      // up to the Table 450.3(B) Maximum ceiling). Unchecked by default; Recommended
      // alone feeds every downstream calc until this is checked AND a valid rating
      // from result.primaryOcpdOverrideOptions is selected (see get result() below).
      // Mirrors calculator-motor_ocpd.js's exceptionOverride checkbox pattern.
      primaryOcpdUseOverride: false,
      primaryOcpdOverrideRating: '',

      // Optional override: use a smaller standard secondary OCPD rating than the
      // computed Table 450.3(B) Maximum (primary-and-secondary method only -- no
      // separate secondary device exists to override under primary-only). Unlike
      // the primary override, there's no "go higher" side here -- the computed
      // rating already IS the ceiling. Unchecked by default; Maximum alone feeds
      // every downstream calc until this is checked AND a valid rating from
      // result.secondaryOcpdOverrideOptions is selected (see get result() below).
      secondaryOcpdUseOverride: false,
      secondaryOcpdOverrideRating: '',

      // Primary feeder conductors (Table 250.122 EGC) & raceway fill. Sized off the
      // Recommended primary OCPD rating (see getRecommended below), not the bare
      // Table 450.3(B) maximum -- mirrors egcBasisRating in calculator-motor_ocpd.js.
      // No neutral/nonlinear toggle here: a primary feed is typically a 3-wire delta
      // run with no neutral (flag it if that's wrong for a given job).
      primaryTempRating: '75',
      primaryTempRatingTouched: false,
      primaryAmbientC: '30',
      primaryMaterial: 'copper',
      primaryMaterialTouched: false,
      primaryNumberOfConductors: '3',
      primaryNumberOfConductorsTouched: false,
      primaryIncludeGround: true,
      primaryRacewayType: 'EMT',
      primaryMaxSizeCap: '500',
      primaryScheduleCopied: false,

      // Secondary feeder conductors (240.4/215.2) & raceway fill -- sized off the OCPD
      // rating that actually protects the secondary conductors, not 125% of FLC (that's
      // a 430.22 motor rule and doesn't apply here). Grounding is a supply-side bonding
      // jumper per 250.102(C)(1), not an EGC -- this is a separately derived system's
      // supply-side connection, not an ordinary branch/feeder circuit.
      secondaryTempRating: '75',
      secondaryTempRatingTouched: false,
      secondaryAmbientC: '30',
      secondaryMaterial: 'copper',
      secondaryMaterialTouched: false,
      // 3 line conductors (three-phase default) + 1 neutral -- every transformer
      // secondary feeder is assumed to carry one, so this is unconditional (no
      // neutral-present toggle). Kept in sync with phase by
      // syncSecondaryConductorCount() below until the user edits it directly.
      secondaryNumberOfConductors: '4',
      secondaryNumberOfConductorsTouched: false,
      secondaryIncludeGround: true,
      secondaryRacewayType: 'EMT',
      secondaryMaxSizeCap: '500',
      secondaryScheduleCopied: false,
      // Nonlinear-load flag, secondary leg only (a transformer secondary commonly
      // feeds panels with nonlinear loads -- computer rooms, VFDs, LED/electronic
      // ballasts -- so the neutral can end up current-carrying per 310.15(E)(3)).
      // Feeds ONLY the Table 310.15(C)(1) adjustment factor via
      // secondaryCurrentCarryingConductors below -- never raceway fill count.
      // Mirrors calculator-wire_sizing.js's wyeMajorityNonlinear flag.
      secondaryWyeMajorityNonlinear: false,

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

      formatSize: function (size) {
        return D.formatSize(size);
      },

      copyPrimaryScheduleNotation: function () {
        var self = this;
        var text = this.result.primaryScheduleNotation;
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          self.primaryScheduleCopied = true;
          setTimeout(function () { self.primaryScheduleCopied = false; }, 1500);
        });
      },

      copySecondaryScheduleNotation: function () {
        var self = this;
        var text = this.result.secondaryScheduleNotation;
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          self.secondaryScheduleCopied = true;
          setTimeout(function () { self.secondaryScheduleCopied = false; }, 1500);
        });
      },

      // Suggest aluminum once the basis rating that actually drives each leg's
      // ampacity calc (Recommended primary OCPD for the primary leg; secondary OCPD,
      // or primary OCPD when primary-only, for the secondary leg -- same basis each
      // leg already uses) reaches 100A -- common practice for larger feeders -- but
      // only while the user hasn't chosen a material themselves. Reads this.result
      // fresh rather than being the $watch'd expression itself, since result also
      // reads material (for ampacity lookups) and watching it directly here would
      // make this suggestion a dependency of the very value it writes to (mirrors
      // calculator-motor_ocpd.js's suggestMaterial).
      suggestPrimaryMaterial: function () {
        if (this.primaryMaterialTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.primaryConductorBasisRating == null) return;
        this.primaryMaterial = r.primaryConductorBasisRating >= 100 ? 'aluminum' : 'copper';
      },

      suggestSecondaryMaterial: function () {
        if (this.secondaryMaterialTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.secondaryConductorBasisRating == null) return;
        this.secondaryMaterial = r.secondaryConductorBasisRating >= 100 ? 'aluminum' : 'copper';
      },

      // Suggest the 60°C column once the same basis rating drops to <=60A --
      // typical equipment listing per NEC 110.14(C) -- but only while the user
      // hasn't chosen a termination rating themselves. Mirrors
      // calculator-wire_sizing.js's ocpd $watch (60°C at <=60A, 75°C otherwise).
      suggestPrimaryTempRating: function () {
        if (this.primaryTempRatingTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.primaryConductorBasisRating == null) return;
        this.primaryTempRating = r.primaryConductorBasisRating <= 60 ? '60' : '75';
      },

      suggestSecondaryTempRating: function () {
        if (this.secondaryTempRatingTouched) return;
        var r = this.result;
        if (r.state !== 'ok' || r.secondaryConductorBasisRating == null) return;
        this.secondaryTempRating = r.secondaryConductorBasisRating <= 60 ? '60' : '75';
      },

      init: function () {
        var self = this;

        // Standard kVA list differs by transformerType/phase -- reset the selection
        // whenever it's no longer in the current list (mirrors hpOptions reacting to
        // phase in calculator-motor_ocpd.js).
        this.$watch('transformerType', function () { self.syncStandardKVA(); });
        this.$watch('phase', function () {
          self.syncStandardKVA();
          if (!self.primaryNumberOfConductorsTouched) {
            self.primaryNumberOfConductors = self.phase === 'single' ? '2' : '3';
          }
          if (!self.secondaryNumberOfConductorsTouched) {
            self.syncSecondaryConductorCount();
          }
          self.suggestPrimaryMaterial();
          self.suggestSecondaryMaterial();
          self.suggestPrimaryTempRating();
          self.suggestSecondaryTempRating();
          self.syncPrimaryOcpdOverride();
          self.syncSecondaryOcpdOverride();
        });

        // Anything else that can move primaryConductorBasisRating / secondaryConductorBasisRating
        // (and so the aluminum/60°C suggestions above), or *OcpdOverrideRatings (so
        // the override selections) -- including the override ratings themselves,
        // since picking a different override rating moves the effective basis just
        // as much as any of the other inputs here.
        this.$watch('standardKVA', function () {
          self.suggestPrimaryMaterial();
          self.suggestSecondaryMaterial();
          self.suggestPrimaryTempRating();
          self.suggestSecondaryTempRating();
          self.syncPrimaryOcpdOverride();
          self.syncSecondaryOcpdOverride();
        });
        this.$watch('primaryVoltage', function () {
          self.suggestPrimaryMaterial();
          self.suggestSecondaryMaterial();
          self.suggestPrimaryTempRating();
          self.suggestSecondaryTempRating();
          self.syncPrimaryOcpdOverride();
        });
        this.$watch('secondaryVoltage', function () {
          self.suggestSecondaryMaterial();
          self.suggestSecondaryTempRating();
          self.syncSecondaryOcpdOverride();
        });
        this.$watch('protectionMethod', function () {
          self.suggestSecondaryMaterial();
          self.suggestSecondaryTempRating();
          self.syncSecondaryOcpdOverride();
        });
        this.$watch('primaryOcpdOverrideRating', function () {
          self.suggestPrimaryMaterial();
          self.suggestPrimaryTempRating();
        });
        this.$watch('secondaryOcpdOverrideRating', function () {
          self.suggestSecondaryMaterial();
          self.suggestSecondaryTempRating();
        });

        // Checking the box should immediately surface a usable default rather than
        // an empty dropdown -- default to Recommended itself (already the middle of
        // the range), letting the user adjust up or down from there. Unchecking
        // leaves the stored selection in place (harmless -- it's ignored while
        // unchecked, and reappears pre-selected if the user re-checks the box).
        this.$watch('primaryOcpdUseOverride', function (value) {
          if (value) {
            self.syncPrimaryOcpdOverride();
            if (!self.primaryOcpdOverrideRating && self.result.primaryOcpdRecommendedRating != null) {
              self.primaryOcpdOverrideRating = String(self.result.primaryOcpdRecommendedRating);
            }
          }
          // Toggling (either direction) moves the effective basis rating between
          // Recommended and the override, so the material/temp-rating suggestions
          // need to reconsider it either way -- not just on checking.
          self.suggestPrimaryMaterial();
          self.suggestPrimaryTempRating();
        });

        // Same pattern, defaulting to Maximum (the secondary override's only
        // reference figure -- there's no separate Recommended bracket here).
        this.$watch('secondaryOcpdUseOverride', function (value) {
          if (value) {
            self.syncSecondaryOcpdOverride();
            if (!self.secondaryOcpdOverrideRating && self.result.secondaryOcpdRating != null) {
              self.secondaryOcpdOverrideRating = String(self.result.secondaryOcpdRating);
            }
          }
          self.suggestSecondaryMaterial();
          self.suggestSecondaryTempRating();
        });

        document.addEventListener('click', function (e) {
          if (self.openInfo == null) return;
          var openTip = self.$refs['tip-' + self.openInfo];
          var wrapper = openTip && openTip.closest('.position-relative');
          if (wrapper && !wrapper.contains(e.target)) {
            self.closeInfo();
          }
        });
      },

      // Resets the selection whenever it's no longer among the current
      // primaryOcpdOverrideRatings (standardKVA/primaryVoltage/phase all move that
      // list) -- mirrors syncStandardKVA's reset-if-invalid approach.
      syncPrimaryOcpdOverride: function () {
        var ratings = this.result.primaryOcpdOverrideRatings || [];
        if (ratings.indexOf(parseFloat(this.primaryOcpdOverrideRating)) === -1) {
          this.primaryOcpdOverrideRating = '';
        }
      },

      // Resets the selection whenever it's no longer among the current
      // secondaryOcpdOverrideRatings (standardKVA/secondaryVoltage/phase/
      // protectionMethod all move that list) -- mirrors syncPrimaryOcpdOverride.
      syncSecondaryOcpdOverride: function () {
        var ratings = this.result.secondaryOcpdOverrideRatings || [];
        if (ratings.indexOf(parseFloat(this.secondaryOcpdOverrideRating)) === -1) {
          this.secondaryOcpdOverrideRating = '';
        }
      },

      syncStandardKVA: function () {
        var list = this.kvaOptions;
        if (list.indexOf(parseFloat(this.standardKVA)) === -1) {
          this.standardKVA = '';
        }
      },

      // Physical secondary conductor count: phase-based line count, plus 1 for the
      // neutral every transformer secondary feeder is assumed to carry.
      syncSecondaryConductorCount: function () {
        var lineCount = this.phase === 'single' ? 2 : 3;
        this.secondaryNumberOfConductors = String(lineCount + 1);
      },

      get kvaOptions() {
        return (D.STANDARD_TRANSFORMER_KVA[this.transformerType] &&
          D.STANDARD_TRANSFORMER_KVA[this.transformerType][this.phase]) || [];
      },

      get primaryRacewayTablePage() {
        return racewayTablePages[this.primaryRacewayType];
      },

      get secondaryRacewayTablePage() {
        return racewayTablePages[this.secondaryRacewayType];
      },

      get installClearanceRef() {
        return this.transformerType === 'liquid' ? '450.23 / 450.26' : '450.21';
      },

      get result() {
        if (!this.kvaOptions.length) {
          return {
            state: 'error',
            message: 'No standard catalog kVA sizes are tabulated for ' +
              (this.phase === 'single' ? 'single-phase' : 'three-phase') + ' ' +
              (this.transformerType === 'liquid' ? 'liquid-filled' : 'dry-type') +
              ' transformers in this tool. Size manually from a manufacturer catalog.'
          };
        }
        var standardKVA = parseFloat(this.standardKVA);
        var primaryVoltage = parseFloat(this.primaryVoltage);
        var secondaryVoltage = parseFloat(this.secondaryVoltage);
        if (isNaN(standardKVA) || standardKVA <= 0 || isNaN(primaryVoltage) || primaryVoltage <= 0 ||
          isNaN(secondaryVoltage) || secondaryVoltage <= 0) {
          return { state: 'empty' };
        }

        // --- Primary & secondary full-load current ---
        var voltageDivisor = this.phase === 'three' ? Math.sqrt(3) : 1;
        var primaryFLC = (standardKVA * 1000) / (primaryVoltage * voltageDivisor);
        var secondaryFLC = (standardKVA * 1000) / (secondaryVoltage * voltageDivisor);

        // --- Table 450.3(B): primary overcurrent protection, Maximum -- whichever
        // percentage the selected Protection Method allows. ---
        var primaryOcpdMaxPercent = D.getTransformerPrimaryOCPDPercent(this.protectionMethod, primaryFLC);
        var primaryOcpdMaxCurrent = primaryFLC * primaryOcpdMaxPercent / 100;
        var primaryOcpdMaxRating = D.getStandardOCPD(primaryOcpdMaxCurrent);

        // --- Table 450.3(B): primary overcurrent protection, Recommended -- always the
        // primary-only bracket percentage, independent of the selected Protection Method.
        // Even when primary-and-secondary protection allows up to 250%, tighter
        // coordination at roughly the primary-only percentage is what's typically
        // actually installed (same logic as calculator-motor_ocpd.js's 175%
        // "Recommended" being lower than the 430.52 maximum). When Protection Method is
        // primary-only, Recommended and Maximum coincide -- expected, not a bug. ---
        var primaryOcpdRecommendedPercent = D.getTransformerPrimaryOCPDPercent('primaryOnly', primaryFLC);
        var primaryOcpdRecommendedCurrent = primaryFLC * primaryOcpdRecommendedPercent / 100;
        var primaryOcpdRecommendedRating = D.getStandardOCPD(primaryOcpdRecommendedCurrent);

        // --- Optional override: a different standard primary OCPD rating than
        // Recommended -- lower (e.g. to match existing equipment, or hold a
        // downstream panelboard rating down) or higher (extra coordination
        // headroom, still code-compliant per Table 450.3(B)). Lower bound: nearest
        // up-to-3 standard ratings strictly below Recommended, down to a hard
        // floor -- the smallest standard rating >= the RAW (100%, not derated)
        // primary FLC, since the device still has to carry the transformer's own
        // load without nuisance tripping. Upper bound: every standard rating from
        // Recommended up through the Table 450.3(B) Maximum ceiling, inclusive --
        // not trimmed to a nearest-few, since Maximum is itself the limit.
        // Recommended and Maximum are still always displayed/computed above,
        // unaffected by any of this -- only which rating feeds the downstream
        // calcs below changes. ---
        var primaryOcpdFloorRating = D.getStandardOCPD(primaryFLC);
        var primaryOcpdOverrideRatings = [];
        if (primaryOcpdRecommendedRating != null) {
          var primaryOcpdLowerRatings = [];
          if (primaryOcpdFloorRating != null) {
            primaryOcpdLowerRatings = D.STANDARD_OCPD_240_6A.filter(function (r) {
              return r < primaryOcpdRecommendedRating && r >= primaryOcpdFloorRating;
            });
            if (primaryOcpdLowerRatings.length > 3) {
              primaryOcpdLowerRatings = primaryOcpdLowerRatings.slice(primaryOcpdLowerRatings.length - 3);
            }
          }
          var primaryOcpdUpperRatings = primaryOcpdMaxRating != null
            ? D.STANDARD_OCPD_240_6A.filter(function (r) {
              return r >= primaryOcpdRecommendedRating && r <= primaryOcpdMaxRating;
            })
            : [primaryOcpdRecommendedRating];
          primaryOcpdOverrideRatings = primaryOcpdLowerRatings.concat(primaryOcpdUpperRatings);
        }
        // Labeled for the dropdown -- flags whichever entry is Recommended or
        // Maximum so the two reference figures above stay identifiable in the list.
        var primaryOcpdOverrideOptions = primaryOcpdOverrideRatings.map(function (r) {
          var suffix = '';
          if (r === primaryOcpdRecommendedRating) suffix = ' (Recommended)';
          else if (primaryOcpdMaxRating != null && r === primaryOcpdMaxRating) suffix = ' (Maximum)';
          return { value: r, label: r + ' A' + suffix };
        });
        var primaryOcpdOverrideSelected = null;
        if (this.primaryOcpdUseOverride) {
          var primaryOcpdOverrideParsed = parseFloat(this.primaryOcpdOverrideRating);
          if (!isNaN(primaryOcpdOverrideParsed) && primaryOcpdOverrideRatings.indexOf(primaryOcpdOverrideParsed) !== -1) {
            primaryOcpdOverrideSelected = primaryOcpdOverrideParsed;
          }
        }
        // Not "active" when the selection just reproduces Recommended (picking
        // that entry from the list is a no-op, not really an override) -- keeps
        // the "override active" note below from firing on a redundant selection.
        var primaryOcpdOverrideActive = primaryOcpdOverrideSelected != null &&
          primaryOcpdOverrideSelected !== primaryOcpdRecommendedRating;

        // --- Table 450.3(B): secondary overcurrent protection (primary-and-secondary only) ---
        var secondaryOcpdPercent = null;
        var secondaryOcpdBaseCurrent = null;
        var secondaryOcpdRating = null;
        if (this.protectionMethod === 'primaryAndSecondary') {
          secondaryOcpdPercent = D.getTransformerSecondaryOCPDPercent(secondaryFLC);
          secondaryOcpdBaseCurrent = secondaryFLC * secondaryOcpdPercent / 100;
          secondaryOcpdRating = D.getStandardOCPD(secondaryOcpdBaseCurrent);
        }

        // --- Optional override: a smaller standard secondary OCPD rating than the
        // Table 450.3(B) Maximum computed above (primary-and-secondary method only --
        // primary-only has no separate secondary device to override). Unlike the
        // primary override, there's no "go higher" case here -- the computed rating
        // already IS the 450.3(B) ceiling for the secondary (no separate Recommended
        // bracket the way primary has one), so this only ever goes down. No floor is
        // enforced -- picking something well below the raw secondary FLC (risking
        // nuisance tripping under normal load) is left to the user's judgment, same
        // as any other manual OCPD choice. Options are the nearest up-to-5 standard
        // ratings <= Maximum (Maximum itself included, so the reference figure stays
        // selectable/identifiable). ---
        var secondaryOcpdFloorRating = D.getStandardOCPD(secondaryFLC);
        var secondaryOcpdOverrideRatings = [];
        var secondaryOcpdOverrideOptions = [];
        if (this.protectionMethod === 'primaryAndSecondary' && secondaryOcpdRating != null) {
          secondaryOcpdOverrideRatings = D.STANDARD_OCPD_240_6A.filter(function (r) {
            return r <= secondaryOcpdRating;
          });
          if (secondaryOcpdOverrideRatings.length > 5) {
            secondaryOcpdOverrideRatings = secondaryOcpdOverrideRatings.slice(secondaryOcpdOverrideRatings.length - 5);
          }
          secondaryOcpdOverrideOptions = secondaryOcpdOverrideRatings.map(function (r) {
            return { value: r, label: r + ' A' + (r === secondaryOcpdRating ? ' (Maximum)' : '') };
          });
        }
        var secondaryOcpdOverrideSelected = null;
        if (this.secondaryOcpdUseOverride) {
          var secondaryOcpdOverrideParsed = parseFloat(this.secondaryOcpdOverrideRating);
          if (!isNaN(secondaryOcpdOverrideParsed) && secondaryOcpdOverrideRatings.indexOf(secondaryOcpdOverrideParsed) !== -1) {
            secondaryOcpdOverrideSelected = secondaryOcpdOverrideParsed;
          }
        }
        // Not "active" when the selection just reproduces Maximum (a no-op pick).
        var secondaryOcpdOverrideActive = secondaryOcpdOverrideSelected != null &&
          secondaryOcpdOverrideSelected !== secondaryOcpdRating;
        var secondaryOcpdEffectiveRating = secondaryOcpdOverrideSelected != null
          ? secondaryOcpdOverrideSelected
          : secondaryOcpdRating;

        // --- Secondary feeder conductors (240.4/215.2): min ampacity = the OCPD rating
        // that actually protects them -- the (possibly overridden) secondary OCPD when
        // separately protected, else the Recommended primary OCPD rating (Recommended
        // === Maximum in that branch anyway; primary-only has no separate secondary
        // device, so the secondary override above never applies there -- it's already
        // hidden/inert in that mode). Deliberately NOT primaryOcpdEffectiveRating, so
        // the primary override only ever affects the primary leg, never this
        // secondary-leg fallback. ---
        var secondaryConductorBasisRating = this.protectionMethod === 'primaryAndSecondary'
          ? secondaryOcpdEffectiveRating
          : primaryOcpdRecommendedRating;
        var secondaryConductorBasisLabel = this.protectionMethod === 'primaryAndSecondary'
          ? (secondaryOcpdOverrideActive ? 'selected secondary OCPD' : 'secondary OCPD')
          : 'primary OCPD (no separate secondary protection)';

        // --- Primary feeder conductors (240.4/215.2): min ampacity = whichever
        // rating is actually going to be installed -- Recommended by default, or the
        // override once checked and a valid rating is selected. Feeds primary
        // conductor ampacity, primary EGC, the aluminum-at->=100A suggestion, the
        // primary-leg parallel-conductor search, and the primary schedule notation. ---
        var primaryOcpdEffectiveRating = primaryOcpdOverrideSelected != null
          ? primaryOcpdOverrideSelected
          : primaryOcpdRecommendedRating;
        var primaryConductorBasisRating = primaryOcpdEffectiveRating;
        var primaryConductorBasisLabel = primaryOcpdOverrideActive ? 'selected primary OCPD' : 'Recommended primary OCPD';

        // --- Primary leg: ambient/temp/count validation, then ampacity walk ---
        var primaryAmbientC = parseFloat(this.primaryAmbientC);
        if (isNaN(primaryAmbientC)) {
          return { state: 'error', message: 'Enter a primary ambient temperature in °C.' };
        }
        var primaryTempFactor = D.getTempCorrectionFactor(primaryAmbientC, this.primaryTempRating);
        if (primaryTempFactor == null) {
          return {
            state: 'error',
            message: 'Table 310.15(B)(1) has no ' + this.primaryTempRating + '°C correction factor tabulated for ' +
              primaryAmbientC + '°C primary ambient.'
          };
        }
        var primaryNumberOfConductors = parseInt(this.primaryNumberOfConductors, 10);
        if (!primaryNumberOfConductors || primaryNumberOfConductors < 1) {
          return { state: 'error', message: 'Enter at least 1 primary conductor.' };
        }
        var primaryAdjFactor = D.getAdjustmentFactor(primaryNumberOfConductors);

        var primaryPicked = primaryConductorBasisRating != null
          ? pickConductorParallel(primaryConductorBasisRating, this.primaryMaterial, this.primaryTempRating,
            primaryTempFactor, primaryAdjFactor, this.primaryMaxSizeCap)
          : null;

        var primaryEgcSize = primaryConductorBasisRating != null
          ? D.getEGCSize(primaryConductorBasisRating, this.primaryMaterial)
          : null;

        var primaryFillCount = primaryNumberOfConductors + (this.primaryIncludeGround ? 1 : 0);
        var primaryMinTrade = primaryPicked
          ? D.getMinTradeSize(this.primaryRacewayType, primaryPicked.size, primaryFillCount)
          : null;

        // Schedule notation ("A-B & 1-C GND, D", or "E [A-B & 1-C GND, D]" when
        // E > 1; the "& 1-C GND" segment is omitted entirely when the equipment
        // grounding conductor isn't included in raceway fill). EGC (C) always uses
        // the FULL basis rating per 250.122(F), regardless of how many parallel sets
        // exist -- primaryEgcSize is never divided by primaryPicked.sets.
        var primaryScheduleNotation = null;
        if (primaryPicked && primaryMinTrade != null) {
          var primaryEgcOk = !this.primaryIncludeGround || primaryEgcSize != null;
          if (primaryEgcOk) {
            var pB = formatScheduleSize(primaryPicked.size, this.primaryMaterial);
            var pGround = this.primaryIncludeGround
              ? ' & 1-' + formatScheduleSize(primaryEgcSize, this.primaryMaterial) + ' GND'
              : '';
            var pD = primaryMinTrade + '"' + (RACEWAY_SCHEDULE_CODES[this.primaryRacewayType] || '');
            var primaryCore = primaryNumberOfConductors + '-' + pB + pGround + ', ' + pD;
            primaryScheduleNotation = primaryPicked.sets > 1 ? primaryPicked.sets + ' [' + primaryCore + ']' : primaryCore;
          }
        }

        // --- Secondary leg: ambient/temp/count validation ---
        var secondaryAmbientC = parseFloat(this.secondaryAmbientC);
        if (isNaN(secondaryAmbientC)) {
          return { state: 'error', message: 'Enter a secondary ambient temperature in °C.' };
        }
        var secondaryTempFactor = D.getTempCorrectionFactor(secondaryAmbientC, this.secondaryTempRating);
        if (secondaryTempFactor == null) {
          return {
            state: 'error',
            message: 'Table 310.15(B)(1) has no ' + this.secondaryTempRating + '°C correction factor tabulated for ' +
              secondaryAmbientC + '°C secondary ambient.'
          };
        }
        var secondaryNumberOfConductors = parseInt(this.secondaryNumberOfConductors, 10);
        if (!secondaryNumberOfConductors || secondaryNumberOfConductors < 1) {
          return { state: 'error', message: 'Enter at least 1 secondary conductor.' };
        }

        // secondaryCurrentCarryingConductors is derived, not user-editable -- it feeds
        // ONLY the Table 310.15(C)(1) adjustment-factor lookup below, never fillCount.
        // A transformer secondary feeder always carries a neutral, so it's excluded
        // from the current-carrying count unless the nonlinear-load flag says
        // otherwise (310.15(E)(3)).
        var secondaryCurrentCarryingConductors = this.secondaryWyeMajorityNonlinear
          ? secondaryNumberOfConductors
          : secondaryNumberOfConductors - 1;
        if (secondaryCurrentCarryingConductors < 1) {
          return { state: 'error', message: 'Secondary Number of Conductors must be at least 2 (line conductors plus the neutral).' };
        }
        var secondaryAdjFactor = D.getAdjustmentFactor(secondaryCurrentCarryingConductors);

        var secondaryPicked = secondaryConductorBasisRating != null
          ? pickConductorParallel(secondaryConductorBasisRating, this.secondaryMaterial, this.secondaryTempRating,
            secondaryTempFactor, secondaryAdjFactor, this.secondaryMaxSizeCap)
          : null;

        // --- 250.102(C)(1): supply-side bonding jumper -- not off the OCPD rating
        // (this is a separately derived system's supply-side connection, not an
        // ordinary branch/feeder circuit, so it doesn't take a 250.122 EGC). EACH
        // raceway gets its own full-size bonding jumper (never divided down), and
        // -- because this tool always runs separate conductors and a separate EGC
        // per raceway rather than one common jumper bonding all raceways together
        // at a single point -- the SIZE that jumper is picked at uses Table
        // 250.102(C)(1)'s "each raceway or cable" per-raceway basis: keyed off the
        // ungrounded conductor size actually installed in a single raceway, never
        // the combined equivalent area of all parallel sets together. The
        // "Equivalent Area for Parallel Conductors" basis is for a single common
        // jumper bonding multiple raceways at once, which this tool doesn't model.
        // With a single conductor (sets === 1) this is just that conductor's own
        // size, same as always.
        var secondaryBondingJumperBasisSize = secondaryPicked ? secondaryPicked.size : null;
        var secondaryBondingJumperTableSize = secondaryBondingJumperBasisSize
          ? D.getSupplyBondingJumperSize(secondaryBondingJumperBasisSize, this.secondaryMaterial)
          : null;
        // Note 1 applies whenever the basis size falls above Table 250.102(C)(1)'s
        // largest tabulated breakpoint (1100 kcmil Cu / 1750 kcmil Al) -- computed
        // automatically here (12.5% of the per-raceway conductor's own area,
        // capped at that same conductor's size, per Note 1's own second sentence)
        // rather than punting to "verify manually". Always resolves to a real size
        // when secondaryPicked exists.
        var secondaryBondingJumperNote1 = !!secondaryPicked && secondaryBondingJumperTableSize == null;
        var secondaryBondingJumperSize = secondaryBondingJumperTableSize != null
          ? secondaryBondingJumperTableSize
          : (secondaryBondingJumperNote1 ? D.getNote1BondingJumperSize(secondaryPicked.size, 1) : null);

        var secondaryFillCount = secondaryNumberOfConductors + (this.secondaryIncludeGround ? 1 : 0);
        var secondaryMinTrade = secondaryPicked
          ? D.getMinTradeSize(this.secondaryRacewayType, secondaryPicked.size, secondaryFillCount)
          : null;

        // Schedule notation ("A-B & 1-C GND, D", or "E [A-B & 1-C GND, D]" when
        // E > 1; the "& 1-C GND" segment is omitted entirely when the bonding jumper
        // isn't included in raceway fill). C reuses secondaryBondingJumperSize
        // above (whether from the table directly or the computed Note 1 fallback),
        // so it can never drift from the size shown elsewhere in this result. The
        // "E [...]" bracket means every raceway is identical, INCLUDING its own
        // bonding jumper -- E raceways means E full-size bonding jumpers total (each
        // sized per the equivalent-area basis above when E > 1), not one shared
        // jumper split across them.
        var secondaryScheduleNotation = null;
        if (secondaryPicked && secondaryMinTrade != null) {
          var secondaryGroundOk = !this.secondaryIncludeGround || secondaryBondingJumperSize != null;
          if (secondaryGroundOk) {
            var sB = formatScheduleSize(secondaryPicked.size, this.secondaryMaterial);
            var sGround = this.secondaryIncludeGround
              ? ' & 1-' + formatScheduleSize(secondaryBondingJumperSize, this.secondaryMaterial) + ' GND'
              : '';
            var sD = secondaryMinTrade + '"' + (RACEWAY_SCHEDULE_CODES[this.secondaryRacewayType] || '');
            var secondaryCore = secondaryNumberOfConductors + '-' + sB + sGround + ', ' + sD;
            secondaryScheduleNotation = secondaryPicked.sets > 1 ? secondaryPicked.sets + ' [' + secondaryCore + ']' : secondaryCore;
          }
        }

        return {
          state: 'ok',
          standardKVA: standardKVA,

          primaryFLC: primaryFLC,
          secondaryFLC: secondaryFLC,

          primaryOcpdMaxPercent: primaryOcpdMaxPercent,
          primaryOcpdMaxCurrent: primaryOcpdMaxCurrent,
          primaryOcpdMaxRating: primaryOcpdMaxRating,
          primaryOcpdRecommendedPercent: primaryOcpdRecommendedPercent,
          primaryOcpdRecommendedCurrent: primaryOcpdRecommendedCurrent,
          primaryOcpdRecommendedRating: primaryOcpdRecommendedRating,

          primaryOcpdFloorRating: primaryOcpdFloorRating,
          primaryOcpdOverrideRatings: primaryOcpdOverrideRatings,
          primaryOcpdOverrideOptions: primaryOcpdOverrideOptions,
          primaryOcpdOverrideActive: primaryOcpdOverrideActive,
          primaryOcpdEffectiveRating: primaryOcpdEffectiveRating,

          secondaryOcpdPercent: secondaryOcpdPercent,
          secondaryOcpdBaseCurrent: secondaryOcpdBaseCurrent,
          secondaryOcpdRating: secondaryOcpdRating,

          secondaryOcpdFloorRating: secondaryOcpdFloorRating,
          secondaryOcpdOverrideRatings: secondaryOcpdOverrideRatings,
          secondaryOcpdOverrideOptions: secondaryOcpdOverrideOptions,
          secondaryOcpdOverrideActive: secondaryOcpdOverrideActive,
          secondaryOcpdEffectiveRating: secondaryOcpdEffectiveRating,

          // Primary feeder conductors
          primaryConductorBasisRating: primaryConductorBasisRating,
          primaryConductorBasisLabel: primaryConductorBasisLabel,
          primaryTempFactor: primaryTempFactor,
          primaryAdjFactor: primaryAdjFactor,
          primaryConductorSize: primaryPicked ? primaryPicked.size : null,
          primaryConductorSizeLabel: primaryPicked ? D.formatSize(primaryPicked.size) : null,
          primaryConductorTableAmp: primaryPicked ? primaryPicked.tableAmp : null,
          primaryConductorCorrectedAmpacity: primaryPicked ? primaryPicked.corrected : null,
          primaryConductorSets: primaryPicked ? primaryPicked.sets : null,
          primaryTotalCircuitAmpacity: primaryPicked ? primaryPicked.corrected * primaryPicked.sets : null,
          primaryConductorOutOfRange: primaryConductorBasisRating != null && !primaryPicked,
          primaryEgcSize: primaryEgcSize,
          primaryEgcSizeLabel: primaryEgcSize ? D.formatSize(primaryEgcSize) : null,
          primaryFillCount: primaryFillCount,
          primaryMinTrade: primaryMinTrade,
          primaryMinTradeLabel: primaryMinTrade == null ? null : primaryMinTrade + '"',
          primaryFillOutOfRange: !!primaryPicked && primaryMinTrade == null,
          primaryRacewayLabel: D.CONDUCTOR_FILL[this.primaryRacewayType].label,
          primaryNecRef: D.CONDUCTOR_FILL[this.primaryRacewayType].necRef,
          primaryScheduleNotation: primaryScheduleNotation,

          // Secondary feeder conductors
          secondaryConductorBasisRating: secondaryConductorBasisRating,
          secondaryConductorBasisLabel: secondaryConductorBasisLabel,
          secondaryTempFactor: secondaryTempFactor,
          secondaryCurrentCarryingConductors: secondaryCurrentCarryingConductors,
          secondaryAdjFactor: secondaryAdjFactor,
          secondaryConductorSize: secondaryPicked ? secondaryPicked.size : null,
          secondaryConductorSizeLabel: secondaryPicked ? D.formatSize(secondaryPicked.size) : null,
          secondaryConductorTableAmp: secondaryPicked ? secondaryPicked.tableAmp : null,
          secondaryConductorCorrectedAmpacity: secondaryPicked ? secondaryPicked.corrected : null,
          secondaryConductorSets: secondaryPicked ? secondaryPicked.sets : null,
          secondaryTotalCircuitAmpacity: secondaryPicked ? secondaryPicked.corrected * secondaryPicked.sets : null,
          secondaryConductorOutOfRange: secondaryConductorBasisRating != null && !secondaryPicked,
          secondaryBondingJumperSize: secondaryBondingJumperSize,
          secondaryBondingJumperSizeLabel: secondaryBondingJumperSize ? D.formatSize(secondaryBondingJumperSize) : null,
          secondaryBondingJumperNote1: secondaryBondingJumperNote1,
          secondaryFillCount: secondaryFillCount,
          secondaryMinTrade: secondaryMinTrade,
          secondaryMinTradeLabel: secondaryMinTrade == null ? null : secondaryMinTrade + '"',
          secondaryFillOutOfRange: !!secondaryPicked && secondaryMinTrade == null,
          secondaryRacewayLabel: D.CONDUCTOR_FILL[this.secondaryRacewayType].label,
          secondaryNecRef: D.CONDUCTOR_FILL[this.secondaryRacewayType].necRef,
          secondaryScheduleNotation: secondaryScheduleNotation
        };
      }
    };
  });
});
