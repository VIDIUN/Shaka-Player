/**
 * @license
 * Copyright 2015 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.require('shaka.dash.MpdUtils');

describe('MpdUtils', function() {
  // A number that cannot be represented as a Javascript number.
  var HUGE_NUMBER_STRING = new Array(500).join('7');

  var MpdUtils;

  beforeAll(function() {
    MpdUtils = shaka.dash.MpdUtils;
  });

  describe('fillUriTemplate', function() {
    it('handles a single RepresentationID identifier', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$RepresentationID$.mp4',
              100, null, null, null).toString()).toBe('/example/100.mp4');

      // RepresentationID cannot use a width specifier.
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$RepresentationID%01d$.mp4',
              100, null, null, null).toString()).toBe('/example/100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$RepresentationID$.mp4',
              null, null, null, null).toString())
                  .toBe('/example/$RepresentationID$.mp4');
    });

    it('handles a single Number identifier', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Number$.mp4',
              null, 100, null, null).toString()).toBe('/example/100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Number%05d$.mp4',
              null, 100, null, null).toString()).toBe('/example/00100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Number$.mp4',
              null, null, null, null).toString())
                  .toBe('/example/$Number$.mp4');
    });

    it('handles a single Bandwidth identifier', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Bandwidth$.mp4',
              null, null, 100, null).toString()).toBe('/example/100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Bandwidth%05d$.mp4',
              null, null, 100, null).toString()).toBe('/example/00100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Bandwidth$.mp4',
              null, null, null, null).toString())
                  .toBe('/example/$Bandwidth$.mp4');
    });

    it('handles a single Time identifier', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Time$.mp4',
              null, null, null, 100).toString()).toBe('/example/100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Time%05d$.mp4',
              null, null, null, 100).toString()).toBe('/example/00100.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Time$.mp4',
              null, null, null, null).toString())
                  .toBe('/example/$Time$.mp4');
    });

    it('handles multiple identifiers', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$RepresentationID$_$Number$_$Bandwidth$_$Time$.mp4',
              1, 2, 3, 4).toString()).toBe('/example/1_2_3_4.mp4');

      // No spaces.
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$RepresentationID$$Number$$Bandwidth$$Time$.mp4',
              1, 2, 3, 4).toString()).toBe('/example/1234.mp4');

      // Different order.
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Bandwidth$_$Time$_$RepresentationID$_$Number$.mp4',
              1, 2, 3, 4).toString()).toBe('/example/3_4_1_2.mp4');

      // Single width.
      expect(
          MpdUtils.fillUriTemplate(
              '$RepresentationID$_$Number%01d$_$Bandwidth%01d$_$Time%01d$',
              1, 2, 3, 400).toString()).toBe('1_2_3_400');

      // Different widths.
      expect(
          MpdUtils.fillUriTemplate(
              '$RepresentationID$_$Number%02d$_$Bandwidth%02d$_$Time%02d$',
              1, 2, 3, 4).toString()).toBe('1_02_03_04');

      // Double $$.
      expect(
          MpdUtils.fillUriTemplate(
              '$$/$RepresentationID$$$$Number$$$$Bandwidth$$$$Time$$$.$$',
              1, 2, 3, 4).toString()).toBe('$/1$2$3$4$.$');
    });

    it('handles invalid identifiers', function() {
      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Garbage$.mp4',
              1, 2, 3, 4).toString()).toBe('/example/$Garbage$.mp4');

      expect(
          MpdUtils.fillUriTemplate(
              '/example/$Time.mp4',
              1, 2, 3, 4).toString()).toBe('/example/$Time.mp4');
    });
  });

  describe('createTimeline', function() {
    it('works in normal case', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, 0),
        createTimePoint(20, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles null start time', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(null, 10, 0),
        createTimePoint(null, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles gaps', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(15, 10, 0)
      ];
      var result = [
        { start: 0, end: 15 },
        { start: 15, end: 25 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles overlap', function() {
      var timePoints = [
        createTimePoint(0, 15, 0),
        createTimePoint(10, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles repetitions', function() {
      var timePoints = [
        createTimePoint(0, 10, 5),
        createTimePoint(60, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 },
        { start: 30, end: 40 },
        { start: 40, end: 50 },
        { start: 50, end: 60 },
        { start: 60, end: 70 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles null repeat', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, null),
        createTimePoint(20, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles repetitions with gap', function() {
      var timePoints = [
        createTimePoint(0, 10, 2),
        createTimePoint(35, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 35 },
        { start: 35, end: 45 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, -1),
        createTimePoint(40, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 },
        { start: 30, end: 40 },
        { start: 40, end: 50 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions with uneven border', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, -1),
        createTimePoint(45, 5, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 },
        { start: 30, end: 40 },
        { start: 40, end: 45 },
        { start: 45, end: 50 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions w/ bad next start time', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, -1),
        createTimePoint(5, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions w/ null next start time', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, -1),
        createTimePoint(null, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions at end', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 5, -1)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 15 },
        { start: 15, end: 20 },
        { start: 20, end: 25 }
      ];
      checkTimePoints(timePoints, result, 1, 25);
    });

    it('handles negative repetitions at end w/o Period length', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 5, -1)
      ];
      var result = [
        { start: 0, end: 10 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    it('handles negative repetitions at end w/ bad Period length', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, 0),
        createTimePoint(25, 5, -1)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 }
      ];
      checkTimePoints(timePoints, result, 1, 20);
    });

    it('ignores elements after null duration', function() {
      var timePoints = [
        createTimePoint(0, 10, 0),
        createTimePoint(10, 10, 0),
        createTimePoint(20, null, 0),
        createTimePoint(30, 10, 0),
        createTimePoint(40, 10, 0)
      ];
      var result = [
        { start: 0, end: 10 },
        { start: 10, end: 20 }
      ];
      checkTimePoints(timePoints, result, 1, Number.POSITIVE_INFINITY);
    });

    /**
     * Creates a new TimePoint.
     *
     * @param {?number} t
     * @param {?number} d
     * @param {?number} r
     * @return {{t: ?number, d: ?number, r: ?number}}
     */
    function createTimePoint(t, d, r) {
      return { t: t, d: d, r: r };
    }

    /**
     * Checks that the createTimeline works with the given timePoints and the
     * given expected results.
     *
     * @param {!Array.<{t: ?number, d: ?number, r: ?number}>} points
     * @param {!Array.<{start: number, end: number}} expected
     * @param {number} timescale
     * @param {number} periodDuration
     */
    function checkTimePoints(points, expected, timescale, periodDuration) {
      // Construct a SegmentTimeline Node object.
      var xmlLines = ['<?xml version="1.0"?>', '<SegmentTimeline>'];
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        xmlLines.push('<S' +
                      (p.t != null ? ' t="' + p.t + '"' : '') +
                      (p.d != null ? ' d="' + p.d + '"' : '') +
                      (p.r != null ? ' r="' + p.r + '"' : '') +
                      ' />');
      }
      xmlLines.push('</SegmentTimeline>');
      var parser = new DOMParser();
      var xml = parser.parseFromString(xmlLines.join('\n'), 'application/xml');
      var segmentTimeline = MpdUtils.findChild(xml, 'SegmentTimeline');
      console.assert(segmentTimeline);

      var timeline = MpdUtils.createTimeline(
          segmentTimeline, timescale, periodDuration);

      expect(timeline).toBeTruthy();
      expect(timeline.length).toBe(expected.length);
      for (var i = 0; i < expected.length; i++) {
        expect(timeline[i].start).toBe(expected[i].start);
        expect(timeline[i].end).toBe(expected[i].end);
      }
    }
  });

  describe('findChild', function() {
    it('finds a child node', function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root>',
        '  <Child></Child>',
        '</Root>'
      ].join('\n');
      var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

      var root = MpdUtils.findChild(xml, 'Root');
      expect(root).toBeTruthy();

      expect(MpdUtils.findChild(root, 'Child')).toBeTruthy();
      expect(MpdUtils.findChild(root, 'DoesNotExist')).toBeNull();
    });

    it('handles duplicate child nodes', function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root>',
        '  <Child></Child>',
        '  <Child></Child>',
        '</Root>'
      ].join('\n');
      var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

      var root = MpdUtils.findChild(xml, 'Root');
      expect(root).toBeTruthy();

      expect(MpdUtils.findChild(root, 'Child')).toBeNull();
    });
  });

  it('findChildren', function() {
    var xmlString = [
      '<?xml version="1.0"?>',
      '<Root>',
      '  <Child></Child>',
      '  <Child></Child>',
      '</Root>'
    ].join('\n');
    var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

    var roots = MpdUtils.findChildren(xml, 'Root');
    expect(roots).toBeTruthy();
    expect(roots.length).toBe(1);

    var children = MpdUtils.findChildren(roots[0], 'Child');
    expect(children.length).toBe(2);

    children = MpdUtils.findChildren(roots[0], 'DoesNotExist');
    expect(children.length).toBe(0);
  });

  describe('getContents', function() {
    it('returns node contents', function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root>',
        '  foo bar',
        '</Root>'
      ].join('\n');
      var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

      var root = MpdUtils.findChild(xml, 'Root');
      expect(MpdUtils.getContents(root)).toBe('foo bar');
    });

    it('handles empty node contents', function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root>',
        '</Root>'
      ].join('\n');
      var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

      var root = MpdUtils.findChild(xml, 'Root');
      expect(MpdUtils.getContents(root)).toBe('');
    });

    it('handles null node contents', function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root>',
        '</Root>'
      ].join('\n');
      var xml = new DOMParser().parseFromString(xmlString, 'application/xml');

      expect(MpdUtils.getContents(xml)).toBeNull();
    });
  });

  describe('parseAttr', function() {
    var xml;

    beforeEach(function() {
      var xmlString = [
        '<?xml version="1.0"?>',
        '<Root a="2-7" b="-5" c="">',
        '</Root>'
      ].join('\n');
      xml = new DOMParser().parseFromString(xmlString, 'application/xml');
    });

    it('delegates to parser function', function() {
      var root = MpdUtils.findChild(xml, 'Root');
      expect(MpdUtils.parseAttr(root, 'a', MpdUtils.parseRange)).toEqual(
          {start: 2, end: 7});
      expect(MpdUtils.parseAttr(root, 'b', MpdUtils.parseInt)).toBe(-5);
      expect(MpdUtils.parseAttr(root, 'c', MpdUtils.parseInt)).toBe(0);
      expect(MpdUtils.parseAttr(root, 'd', MpdUtils.parseInt)).toBeNull();
    });

    it('supports default values', function() {
      var root = MpdUtils.findChild(xml, 'Root');
      expect(MpdUtils.parseAttr(root, 'd', MpdUtils.parseInt, 9)).toBe(9);
    });
  });

  it('parseDate', function() {
    var parseDate = shaka.dash.MpdUtils.parseDate;

    expect(parseDate('November 30, 2015')).toBeTruthy();
    expect(parseDate('Apple')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  it('parseDuration', function() {
    var parseDuration = shaka.dash.MpdUtils.parseDuration;

    // No time.
    expect(parseDuration('P')).toBe(0);
    expect(parseDuration('PT')).toBe(0);

    // Years only. 1 year has 365 or 366 days.
    expect(parseDuration('P3Y')).toBeLessThan(3 * (60 * 60 * 24 * 366) + 1);
    expect(parseDuration('P3Y')).toBeGreaterThan(3 * (60 * 60 * 24 * 365) - 1);

    // Months only. 1 month has 28 to 31 days.
    expect(parseDuration('P2M')).toBeLessThan(2 * (60 * 60 * 24 * 31) + 1);
    expect(parseDuration('P2M')).toBeGreaterThan(2 * (60 * 60 * 24 * 28) - 1);

    // Days only.
    expect(parseDuration('P7D')).toBe(604800);

    // Hours only.
    expect(parseDuration('PT1H')).toBe(3600);

    // Minutes only.
    expect(parseDuration('PT1M')).toBe(60);

    // Seconds only (with no fractional part).
    expect(parseDuration('PT1S')).toBe(1);

    // Seconds only (with no whole part).
    expect(parseDuration('PT0.1S')).toBe(0.1);
    expect(parseDuration('PT.1S')).toBe(0.1);

    // Seconds only (with whole part and fractional part).
    expect(parseDuration('PT1.1S')).toBe(1.1);

    // Hours, and minutes.
    expect(parseDuration('PT1H2M')).toBe(3720);

    // Hours, and seconds.
    expect(parseDuration('PT1H2S')).toBe(3602);
    expect(parseDuration('PT1H2.2S')).toBe(3602.2);

    // Minutes, and seconds.
    expect(parseDuration('PT1M2S')).toBe(62);
    expect(parseDuration('PT1M2.2S')).toBe(62.2);

    // Hours, minutes, and seconds.
    expect(parseDuration('PT1H2M3S')).toBe(3723);
    expect(parseDuration('PT1H2M3.3S')).toBe(3723.3);

    // Days, hours, minutes, and seconds.
    expect(parseDuration('P1DT1H2M3S')).toBe(90123);
    expect(parseDuration('P1DT1H2M3.3S')).toBe(90123.3);

    // Months, hours, minutes, and seconds.
    expect(parseDuration('P1M1DT1H2M3S')).toBeLessThan(
        (60 * 60 * 24 * 31) + 90123 + 1);
    expect(parseDuration('P1M1DT1H2M3S')).toBeGreaterThan(
        (60 * 60 * 24 * 28) + 90123 - 1);

    // Years, Months, hours, minutes, and seconds.
    expect(parseDuration('P1Y1M1DT1H2M3S')).toBeLessThan(
        (60 * 60 * 24 * 366) + (60 * 60 * 24 * 31) + 90123 + 1);
    expect(parseDuration('P1Y1M1DT1H2M3S')).toBeGreaterThan(
        (60 * 60 * 24 * 365) + (60 * 60 * 24 * 28) + 90123 - 1);

    expect(parseDuration('PT')).toBe(0);
    expect(parseDuration('P')).toBe(0);

    // Error cases.
    expect(parseDuration('-PT3S')).toBeNull();
    expect(parseDuration('PT-3S')).toBeNull();
    expect(parseDuration('P1Sasdf')).toBeNull();
    expect(parseDuration('1H2M3S')).toBeNull();
    expect(parseDuration('123')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('')).toBeNull();

    expect(parseDuration('P' + HUGE_NUMBER_STRING + 'Y')).toBeNull();
    expect(parseDuration('P' + HUGE_NUMBER_STRING + 'M')).toBeNull();
    expect(parseDuration('P' + HUGE_NUMBER_STRING + 'D')).toBeNull();
    expect(parseDuration('PT' + HUGE_NUMBER_STRING + 'H')).toBeNull();
    expect(parseDuration('PT' + HUGE_NUMBER_STRING + 'M')).toBeNull();
    expect(parseDuration('PT' + HUGE_NUMBER_STRING + 'S')).toBeNull();
  });

  it('parseRange', function() {
    var parseRange = shaka.dash.MpdUtils.parseRange;

    expect(parseRange('0-0')).toEqual({start: 0, end: 0});
    expect(parseRange('1-1')).toEqual({start: 1, end: 1});
    expect(parseRange('1-50')).toEqual({start: 1, end: 50});
    expect(parseRange('50-1')).toEqual({start: 50, end: 1});

    expect(parseRange('-1')).toBeNull();
    expect(parseRange('1-')).toBeNull();
    expect(parseRange('1')).toBeNull();
    expect(parseRange('-')).toBeNull();
    expect(parseRange('')).toBeNull();

    expect(parseRange('abc')).toBeNull();
    expect(parseRange('a-')).toBeNull();
    expect(parseRange('-b')).toBeNull();
    expect(parseRange('a-b')).toBeNull();

    expect(parseRange(HUGE_NUMBER_STRING + '-1')).toBeNull();
    expect(parseRange('1-' + HUGE_NUMBER_STRING)).toBeNull();
  });

  it('parseInt', function() {
    var parseInt = shaka.dash.MpdUtils.parseInt;

    expect(parseInt('0')).toBe(0);
    expect(parseInt('1')).toBe(1);
    expect(parseInt('191')).toBe(191);

    expect(parseInt('-0')).toBe(0);
    expect(parseInt('-1')).toBe(-1);
    expect(parseInt('-191')).toBe(-191);

    expect(parseInt('abc')).toBeNull();
    expect(parseInt('1abc')).toBeNull();
    expect(parseInt('abc1')).toBeNull();

    expect(parseInt('0.0')).toBe(0);
    expect(parseInt('-0.0')).toBe(0);

    expect(parseInt('0.1')).toBeNull();
    expect(parseInt('1.1')).toBeNull();

    expect(parseInt(HUGE_NUMBER_STRING)).toBeNull();
    expect(parseInt('-' + HUGE_NUMBER_STRING)).toBeNull();
  });

  it('parsePositiveInt', function() {
    var parsePositiveInt = shaka.dash.MpdUtils.parsePositiveInt;

    expect(parsePositiveInt('0')).toBeNull();
    expect(parsePositiveInt('1')).toBe(1);
    expect(parsePositiveInt('191')).toBe(191);

    expect(parsePositiveInt('-0')).toBeNull();
    expect(parsePositiveInt('-1')).toBeNull();
    expect(parsePositiveInt('-191')).toBeNull();

    expect(parsePositiveInt('abc')).toBeNull();
    expect(parsePositiveInt('1abc')).toBeNull();
    expect(parsePositiveInt('abc1')).toBeNull();

    expect(parsePositiveInt('0.0')).toBeNull();
    expect(parsePositiveInt('-0.0')).toBeNull();

    expect(parsePositiveInt('0.1')).toBeNull();
    expect(parsePositiveInt('1.1')).toBeNull();

    expect(parsePositiveInt(HUGE_NUMBER_STRING)).toBeNull();
    expect(parsePositiveInt('-' + HUGE_NUMBER_STRING)).toBeNull();
  });

  it('parseNonNegativeInt', function() {
    var parseNonNegativeInt = shaka.dash.MpdUtils.parseNonNegativeInt;

    expect(parseNonNegativeInt('0')).toBe(0);
    expect(parseNonNegativeInt('1')).toBe(1);
    expect(parseNonNegativeInt('191')).toBe(191);

    expect(parseNonNegativeInt('-0')).toBe(0);
    expect(parseNonNegativeInt('-1')).toBeNull();
    expect(parseNonNegativeInt('-191')).toBeNull();

    expect(parseNonNegativeInt('abc')).toBeNull();
    expect(parseNonNegativeInt('1abc')).toBeNull();
    expect(parseNonNegativeInt('abc1')).toBeNull();

    expect(parseNonNegativeInt('0.0')).toBe(0);
    expect(parseNonNegativeInt('-0.0')).toBe(0);

    expect(parseNonNegativeInt('0.1')).toBeNull();
    expect(parseNonNegativeInt('1.1')).toBeNull();

    expect(parseNonNegativeInt(HUGE_NUMBER_STRING)).toBeNull();
    expect(parseNonNegativeInt('-' + HUGE_NUMBER_STRING)).toBeNull();
  });

  it('parseFloat', function() {
    var parseFloat = shaka.dash.MpdUtils.parseFloat;

    expect(parseFloat('0')).toBe(0);
    expect(parseFloat('1')).toBe(1);
    expect(parseFloat('191')).toBe(191);

    expect(parseFloat('-0')).toBe(0);
    expect(parseFloat('-1')).toBe(-1);
    expect(parseFloat('-191')).toBe(-191);

    expect(parseFloat('abc')).toBeNull();
    expect(parseFloat('1abc')).toBeNull();
    expect(parseFloat('abc1')).toBeNull();

    expect(parseFloat('0.0')).toBe(0);
    expect(parseFloat('-0.0')).toBe(0);

    expect(parseFloat('0.1')).toBeCloseTo(0.1);
    expect(parseFloat('1.1')).toBeCloseTo(1.1);

    expect(parseFloat('19.1134')).toBeCloseTo(19.1134);
    expect(parseFloat('4e2')).toBeCloseTo(4e2);
    expect(parseFloat('4e-2')).toBeCloseTo(4e-2);

    expect(parseFloat(HUGE_NUMBER_STRING)).toBe(Number.POSITIVE_INFINITY);
    expect(parseFloat('-' + HUGE_NUMBER_STRING)).toBe(Number.NEGATIVE_INFINITY);
  });
});
