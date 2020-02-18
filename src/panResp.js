/*
  @prettier
*/
/* exported PanResp */
/* globals whenReadyFn */
/* jshint debug:true, camelcase:false, maxcomplexity:false */

class PanResp {
  constructor(fromVector, toVector, _debug) {
    if (fromVector) this.from = fromVector;
    if (toVector) this.to = toVector;
    this.debug = _debug;
    return this;
  }
  computePoly(x, y) {
    var order = 4;
    var xMatrix = [];
    var xTemp = [];
    var yMatrix = window.numeric.transpose([y]);

    for (var j = 0; j < x.length; j++) {
      xTemp = [];
      for (var i = 0; i <= order; i++) {
        xTemp.push(1 * x[j] ** i);
      }
      xMatrix.push(xTemp);
    }

    var xMatrixT = window.numeric.transpose(xMatrix);
    var dot1 = window.numeric.dot(xMatrixT, xMatrix);
    var dotInv = window.numeric.inv(dot1);
    var dot2 = window.numeric.dot(xMatrixT, yMatrix);
    var solution = window.numeric.dot(dotInv, dot2);
    // console.log('Coefficients a + bx^1 + cx^2...')
    // console.log(solution);
    return solution;
  }
  setupPoly() {
    if (!this.poly) {
      var x = this.from || [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.1, 0.05, 0.01];
      var y = this.to || [1, 0.91, 0.82, 0.73, 0.64, 0.55, 0.46, 0.37, 0.18, 0.059, 0.02];
      this.poly = this.computePoly(x, y);
    }
  }
  usePoly(x) {
    this.setupPoly();
    var poly = this.poly;
    var ret = poly[0] * 1 + poly[1] * x + poly[2] * x * x + poly[3] * x * x * x + poly[4] * x * x * x * x;
    return ret;
  }
  f2(f) {
    return Number.parseFloat(f).toFixed(2);
  }
  /**
   * update panel responsive settings for a given content panel of a parent, set on the dest
   * object which should be a webcomponent.
   *
   * @arg parent The parent, usually the current webcomponent.
   * @arg contnet The panel to be sized.
   * @arg dest Destination object that has Polymer's updateStyles method.
   * @arg maxWidth Usually 1200, the benchmark width that is 'full width at 100%'.
   * @arg thresh Threshold ratio of width, below which size is scaled.
   * @arg zoom Current zoom factor.
   */

  update(parent, calledFromResize, content, dest, _maxW, _thresh, _zoom, container) {
    this.updateScaleColumns(parent, calledFromResize, content, [container], [1], [_zoom], [], container);
  }
  updateOld(parent, content, dest, _maxW, _thresh, _zoom) {
    this.debugPanResp = true;
    var maxW = _maxW || 1200;
    var thresh = _thresh || 0.5;
    var zoom = _zoom || 1;
    var winW = window.innerWidth;
    var screenW = window.screen.width;
    var screenH = window.screen.height;
    var parentW = parent.clientWidth;
    var contentW = content.clientWidth;
    var f2 = this.f2;
    var screenWidth = screenW / 9 > screenH / 5 ? screenH / 5 * 9 : screenW;
    var ratio = 1;
    var width = winW;
    var fn = (cw, pw) => {
      if (cw < pw * thresh) {
        const tratio = cw / (pw * thresh);
        if (tratio < ratio) {
          ratio = tratio;
          width = pw;
        }
      }
    };

    fn(winW, screenWidth);
    fn(contentW, winW);
    fn(contentW, maxW);

    var winRatio = maxW / winW;
    var hratio = ratio * winRatio;
    var fontRatio = (ratio < 1 ? this.usePoly(ratio) : 1) * winRatio;
    var scale = hratio / (maxW / 100);
    var fontScale = fontRatio / (maxW / 100);
    dest.updateStyles({
      '--vw-scale': scale * zoom,
      '--font-scale': fontScale * zoom,
    });

    if (this.debug) {
      var hratiofull = winW / screenW;
      var result = scale * zoom * 12 * hratiofull * (screenW / maxW);
      var fontresult = fontScale * zoom * 12 * hratiofull * (screenW / maxW);
      if (ratio < 1) console.log(`ratio: ${f2(ratio)} usePoly: ${f2(this.usePoly(ratio))}`);
      console.log(
        `widths: ${maxW} ${parentW} ${width} ratio: ${f2(hratio)} scale: ${f2(scale)} fontScale: ${f2(fontScale)}`
      );
      console.log(`resulting scale: ${f2(result)} fontScale: ${f2(fontresult)}`);
    }
  }

  // Called as qs(path) or qs(self, path)
  qs(selfp, path) {
    var self = this;
    if (path) self = selfp;
    else path = selfp;
    if (typeof path === 'string') return self.shadowRoot.querySelector(path);
    return selfp;
  }

  // Updates scales for children columns
  // cols = ['#one', '#two', '#three'], colratio = [.25, .5, .25]
  // zoom = [0, 0, 0] where zoom is 1 + zoom / 10.
  // splitters = ['splitter1', 'splitter2'], active = "active"
  updateScaleColumns(wc, calledFromResize, containerName, cols, colratios, zooms, splitters, active) {
    var self = wc;
    var ok = wcs => {
      var ret = true;
      if (wcs)
        wcs.forEach(w => {
          if (!this.qs(self, w)) ret = false;
        });
      return ret;
    };
    var okcw = wcs => {
      var container = this.qs(wc, containerName);
      var ret = container && container.clientWidth !== 0;
      if (wcs && ret)
        wcs.forEach(w => {
          const content = this.qs(wc, w);
          if (!content) ret = false;
        });
      return ret;
    };
    whenReadyFn(
      () => (okcw(cols) && ok(splitters)) || (active === null || !self[active] ? 'quiet' : false),
      () => {
        var container = this.qs(wc, containerName);
        // Ratio of window to screen
        // Default scale in CSS: 0.0833 = (1/1200)*100
        // Maps 1/1200 css pixels into actual monitor pixels.
        // Fix extra-wide screens.  Should do the same for extra tall.
        var sWidth =
          window.screen.width / 9 > window.screen.height / 5 ? window.screen.height / 5 * 9 : window.screen.width;
        var resScaler = 1200 / window.screen.width;
        var wratio = Math.min(container.clientWidth, sWidth) / sWidth;
        var widthScalerFixed = 1 / wratio;
        var fixed = 1 / 1200 * 100 * resScaler * widthScalerFixed;
        if (self.style) self.style.setProperty('--vw-fixed-scale', fixed);
        if (cols)
          cols.forEach(contentq => {
            var content = this.qs(wc, contentq);
            if (!content.clientWidth) return;
            const idx = cols.indexOf(contentq);
            const ratio = colratios[idx];
            // Ratio of window to screen
            var wdiff = Math.max(sWidth, container.clientWidth) - container.clientWidth;
            // Holds to desired pixel sizes from 100%-50% of window width of monitor, scaling down thereafter.
            var widthScaler = wratio > 0.5 ? 1 / wratio : 1 / (wratio * (wdiff / (sWidth / 2)));
            // console.log(`widthScaler: ${widthScaler}`);
            var base = 1 / 1200 * 100 * resScaler * widthScaler;
            const zoom = 1 + zooms[idx] / 10;
            var setScales = (scale, fixedp, fontScale, zoomi) => {
              // console.log(`scale: ${scale} fontScale: ${fontScale}`);
              content.style.setProperty('--vw-scale', scale * zoomi);
              content.style.setProperty('--vw-fixed-scale', fixedp * zoomi);
              content.style.setProperty('--font-scale', fontScale * zoomi);
            };
            if (ratio === 0) {
              setScales(base, fixed, base, zoom);
              return;
            }
            // ratio of panel to container
            var hratio = content.clientWidth / container.clientWidth;
            var vratio = content.clientHeight / container.clientHeight;
            if (vratio < hratio) {
              hratio = vratio;
            }
            if (hratio > 0.01 && content) {
              // Don't act before sizes are set.
              // var baselineExtra = 1;
              // var appZoom = 1 + self.app.zoom / 10;
              var scale, fontScale;
              if (hratio > ratio) {
                scale = fontScale = base;
              } else {
                var netratio = Math.max(0.01, hratio / ratio);
                scale = netratio * base;
                fontScale = this.usePoly(netratio) * base;
                // scale = baselineFactor * (hratio / (hsWidth / 100));
                // fontScale = baselineFactor * (fontBoost / (hsWidth / 100));
              }
              setScales(scale, fixed, fontScale, zoom);
            } else {
              if (content && content.notifyResize) {
                self.async(content.notifyResize());
              }
              if (!calledFromResize) {
                if (content && content.notifyResize) {
                  content.notifyResize();
                }
                self.notifyResize();
              }
            }
          });
      }, 10
    );
  }

  getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
  }

  // Compute and set a variable used to calculate font-size.
  // maxSize is in characters, limiting font-size to what would fit that many.
  // wrapAt is the point at which wrapping will start.
  // Adjustment counters something that causes the first line to be longer than second.
  // .title {  width: 100%;  text-align: center;  --title-num-chars: 30;
  // font-size: calc(110vw / (var(--title-num-chars) )); }

  setTwoLineStyle(self, title, text, font, maxSize, wrapAt, adjustment) {
    var textLen = text.length;
    var width;
    var ww;
    var tw;
    var tw2;
    if (textLen > wrapAt) {
      width = textLen / 2;
      while (width < textLen && text.charAt(width) !== ' ') width++;
      const w = 'W'.repeat(width);
      ww = this.getTextWidth(w, font);
      tw = this.getTextWidth(text.slice(0, width), font);
      tw2 = this.getTextWidth(text.slice(width), font);
      if (tw2 > tw) tw = tw2;
    } else {
      width = textLen;
      const w = 'W'.repeat(textLen);
      ww = this.getTextWidth(w, font);
      tw = this.getTextWidth(text, font);
    }
    var ewidth;
    if (width < maxSize) {
      ewidth = width = maxSize;
    } else {
      var ratio = ww / tw;
      // ratio = 1;
      ewidth = width / ratio * (adjustment || 1);
    }
    if (ewidth < maxSize) ewidth = maxSize;
    // console.log(`2line text size:${textLen} line length:${width} effective length:${ewidth}`);
    title.style.setProperty('--title-num-chars', ewidth);
  }
  setTwoLineStyleWR(self, path, textProp, font, maxSize, wrapAt, adjustment) {
    var lqs = this.qs || self.qs;
    try {
      var title, text;
      whenReadyFn(
        () => (title = lqs(self, path)) && (text = self[textProp]),
        () => {
          this.setTwoLineStyle(self, title, text, font, maxSize, wrapAt, adjustment);
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  // The various situations where we should scale below 100%:

  // Fix extra-wide screens.  Should do the same for extra tall.
  // var cwidth = Math.min(screenWidth, maxW);
  // var cbwidth = cwidth * thresh;
  // var hratioraw = contentW < cbwidth ? contentW / cbwidth : 1;

  // var maxH = 1024;
  // var winH = window.innerHeight;
  // var parentH = parent.clientHeight;
  // In case we're computing size of child panel relative to parent.
  // var contentH = content.clientHeight;
  // var screenHeight = screenH / 9 > screenW / 5 ? screenW / 5 * 9 : screenH;
  // var cheight = Math.min(screenHeight, maxH);
  // var cbheight = screenH * thresh;
  // var vratioraw = contentH < cbheight ? contentH / cbheight : 1;

  // PanResp for full width:
  // If width > max width, scale down so to 1:1
  // If width > half max width, scale to 1:1
  // If < half max width, scale 0-100% of half max width ratio
  // Apply zoom...

  // Don't scale > 100% of the benchmark width.
  // PanResp for panel less than full width:
  // Determine threshold and scale relative to natural panel width,
  // but compute factors on full window width.
  // If window < maxW, size up to get to 100%.

  // To use this, would have to know that minimum vertical space was being violated.
  // var vratio = vratioraw * (maxH / parentH);
  // if (false && vratioraw < hratioraw) {
  // hratio = vratio;
  // csize = cheight;
  // cbsize = cbheight;
  // }
}
