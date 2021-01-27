/* Automatically transformed from AMD to ES6. Beware of code smell. */

export default Highcharts => {
    let each = Highcharts.each,
        merge = Highcharts.merge,
        pick = Highcharts.pick,
        defaultPlotOptions = Highcharts.getOptions().plotOptions,
        seriesTypes = Highcharts.seriesTypes,
        extendClass = Highcharts.extendClass,
        math = Math,
        mathRound = math.round,
        mathFloor = math.floor;

    // Set default options
    defaultPlotOptions.vendela = merge(defaultPlotOptions.boxplot, {
        fillColor: '#FFFFFF',
        lineWidth: 0,
        states: {
            hover: {
                brightness: -0.3,
            },
        },
        threshold: null,
        tooltip: {
            pointFormat:
                'Upper Fence: {point.high}<br/>' +
                'Q1: {point.q3}<br/>' +
                'Q2: {point.median}<br/>' +
                'Q3: {point.q1}<br/>' +
                'Lower Fence: {point.low}<br/>',
        },
    });

    // Create the series object
    seriesTypes.vendela = extendClass(seriesTypes.boxplot, {
        type: 'vendela',

        // Draw the data points
        drawPoints: function() {
            let series = this, // state = series.state,
                points = series.points,
                options = series.options,
                chart = series.chart,
                renderer = chart.renderer,
                q1Plot,
                q3Plot,
                highPlot,
                lowPlot,
                medianPlot,
                crispCorr,
                graphic,
                selectPath,
                firstPath,
                firstAttr,
                secondPath,
                secondAttr,
                thirdPath,
                thirdAttr,
                fourthPath,
                fourthAttr,
                width,
                left,
                right,
                shapeArgs,
                color;

            each(points, point => {
                graphic = point.graphic;
                shapeArgs = point.shapeArgs; // the box

                firstAttr = {};
                secondAttr = {};
                thirdAttr = {};
                fourthAttr = {};

                color = point.color || series.color;

                if (point.plotY !== undefined) {
                    // crisp vector coordinates
                    if (options.maxPointWidth) {
                        width = Math.min(shapeArgs.width, options.maxPointWidth);
                    } else {
                        width = shapeArgs.width;
                    }
                    left = mathFloor(shapeArgs.x);
                    right = left + width;

                    q1Plot = mathFloor(point.q1Plot); // + crispCorr;
                    q3Plot = mathFloor(point.q3Plot); // + crispCorr;
                    highPlot = mathFloor(point.highPlot); // + crispCorr;
                    lowPlot = mathFloor(point.lowPlot); // + crispCorr;

                    // Bar attributes
                    firstAttr.fill = point.firstColor || options.firstColor || color;
                    firstAttr['stroke-width'] = pick(
                        point.firstWidth,
                        options.firstWidth,
                        options.lineWidth,
                    );
                    firstAttr.dashstyle = point.firstDashStyle || options.firstDashStyle;
                    firstAttr.stroke = point.strokeColor || options.strokeColor || color;

                    secondAttr.fill = point.secondColor || options.secondColor || color;
                    secondAttr['stroke-width'] = pick(
                        point.secondWidth,
                        options.secondWidth,
                        options.lineWidth,
                    );
                    secondAttr.dashstyle = point.secondDashStyle || options.secondDashStyle;
                    secondAttr.stroke = point.strokeColor || options.strokeColor || color;

                    thirdAttr.fill = point.thirdColor || options.thirdColor || color;
                    thirdAttr['stroke-width'] = pick(
                        point.thirdWidth,
                        options.thirdWidth,
                        options.lineWidth,
                    );
                    thirdAttr.dashstyle = point.thirdDashStyle || options.thirdDashStyle;
                    thirdAttr.stroke = point.strokeColor || options.strokeColor || color;

                    fourthAttr.fill = point.fourthColor || options.fourthColor || color;
                    fourthAttr['stroke-width'] = pick(
                        point.fourthWidth,
                        options.fourthWidth,
                        options.lineWidth,
                    );
                    fourthAttr.dashstyle = point.fourthDashStyle || options.fourthDashStyle;
                    fourthAttr.stroke = point.strokeColor || options.strokeColor || color;

                    crispCorr = (firstAttr['stroke-width'] % 2) / 2;
                    q1Plot = mathFloor(q1Plot) + crispCorr;
                    q3Plot = mathFloor(q3Plot) + crispCorr;
                    medianPlot = mathRound(point.medianPlot) + crispCorr;

                    left += crispCorr;
                    right += crispCorr;

                    selectPath = [
                        'M',
                        left,
                        highPlot,
                        'L',
                        left,
                        lowPlot,
                        'L',
                        right,
                        lowPlot,
                        'L',
                        right,
                        highPlot,
                        'L',
                        left,
                        highPlot,
                        'z',
                    ];

                    firstPath = [
                        'M',
                        left,
                        highPlot,
                        'L',
                        left,
                        q3Plot,
                        'L',
                        right,
                        q3Plot,
                        'L',
                        right,
                        highPlot,
                        'L',
                        left,
                        highPlot,
                        'z',
                    ];

                    secondPath = [
                        'M',
                        left,
                        q3Plot,
                        'L',
                        left,
                        medianPlot,
                        'L',
                        right,
                        medianPlot,
                        'L',
                        right,
                        q3Plot,
                        'L',
                        left,
                        q3Plot,
                        'z',
                    ];

                    thirdPath = [
                        'M',
                        left,
                        medianPlot,
                        'L',
                        left,
                        q1Plot,
                        'L',
                        right,
                        q1Plot,
                        'L',
                        right,
                        medianPlot,
                        'L',
                        left,
                        medianPlot,
                        'z',
                    ];

                    fourthPath = [
                        'M',
                        left,
                        q1Plot,
                        'L',
                        left,
                        lowPlot,
                        'L',
                        right,
                        lowPlot,
                        'L',
                        right,
                        q1Plot,
                        'L',
                        left,
                        q1Plot,
                        'z',
                    ];

                    // Create or update the graphics
                    if (graphic) {
                        // update
                        point.bg.animate({d: selectPath});
                        point.first.animate({d: firstPath});
                        point.second.animate({d: secondPath});
                        point.third.animate({d: thirdPath});
                        point.fourth.animate({d: fourthPath});
                    } else {
                        // create new
                        point.graphic = graphic = renderer.g().add(series.group);

                        point.bg = renderer.path(selectPath).add(graphic);

                        point.first = renderer
                            .path(firstPath)
                            .attr(firstAttr)
                            .add(graphic);

                        point.second = renderer
                            .path(secondPath)
                            .attr(secondAttr)
                            .add(graphic);

                        point.third = renderer
                            .path(thirdPath)
                            .attr(thirdAttr)
                            .add(graphic);

                        point.fourth = renderer
                            .path(fourthPath)
                            .attr(fourthAttr)
                            .add(graphic);
                    }
                }
            });
        },
    });
};
