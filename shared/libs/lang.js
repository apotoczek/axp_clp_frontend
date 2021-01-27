/* Automatically transformed from AMD to ES6. Beware of code smell. */
export default {
    aliases: {
        'Fund TVPI': 'TVPI',
        'Index TVPI': 'TVPI',
        'Fund IRR': 'IRR',
        'Fund Net IRR': 'IRR',
        'Portfolio IRR': 'IRR',
        'Portfolio Net IRR': 'IRR',
        'Index Net IRR': 'IRR',
        'Index IRR': 'IRR',
        'Benchmark Geography': 'Geography',
        'Benchmark Style': 'Style',
        'Style/Focus': 'Style',
        'Benchmark Focus': 'Focus',
        'Net IRR': 'IRR',
        'Gross IRR': 'IRR',
        Vintage: 'Vintage Year',
        Q1: 'First Quartile',
        Q2: 'Second Quartile',
        Q3: 'Third Quartile',
        'Benchmark Vintage': 'Vintage Year',
        Invested: 'Paid In',
        'Invested Capital': 'Paid In',
        'Capital Call': 'Paid In',
        Distribution: 'Distributed',
        NAV: 'Remaining (NAV)',
        'Unrealized Value': 'Remaining (NAV)',
        'Unrealized Value (NAV)': 'Remaining (NAV)',
        'Realized Value': 'Distributed',
        '% Invested': '% Paid In',
        '% Unrealized Value': '% Remaining (NAV)',
        '% NAV': '% Remaining (NAV)',
        '% Realized Value': '% Distributed',
        'Compounded TWROR': 'Compounded Time-Weighted Rate of Return',
        Industry: 'Sector',
        Age: 'Holding Period',
    },
    irr_fallback: {
        no_title: true,
        definition:
            'No IRR reported for this investor, using fund average calculated from publicly available sources.',
    },
    multiple_fallback: {
        no_title: true,
        definition:
            'No TVPI reported for this investor, using fund average calculated from publicly available sources.',
    },
    rvpi_fallback: {
        no_title: true,
        definition:
            'No RVPI reported for this investor, using fund average calculated from publicly available sources.',
    },
    dpi_fallback: {
        no_title: true,
        definition:
            'No DPI reported for this investor, using fund average calculated from publicly available sources.',
    },
    picc_fallback: {
        no_title: true,
        definition:
            'No Paid In % reported for this investor, using fund average calculated from publicly available sources.',
    },
    vintage_year_fallback: {
        no_title: true,
        definition:
            'No vintage reported for this investor, using fund vintage derived from publicly available sources.',
    },
    // Valuation Bridge
    EBITDA: {
        definition:
            'Annual EBITDA (<u>E</u>arnings <u>B</u>efore <u>I</u>nterest, <u>T</u>axes, <u>D</u>epreciation and <u>A</u>mortization) figure. Can use year-end of last 12 months. EBITDA is essentially net income with interest, taxes, depreciation, and amortization added back to it. Can be used to analyze and compare profitability between companies and industries because it eliminates the effects of financing and accounting decisions.',
    },
    'EV/EBITDA': {
        definition:
            'Enterprise Value divided by EBITDA is a ratio that measures how much a GP has paid to own a company.',
    },
    'Net Debt/EBITDA': {
        definition:
            'Net Debt divided by EBITDA is a ratio that measures the amount of debt held by the company. A higher ratio signifies a higher level of operational risk.',
    },
    'Net Debt': {
        definition: 'Net Debt = Total Debt - Cash.',
    },
    Revenue: {
        definition: 'Annual revenue figure. Can use year-end or last 12 months.',
    },
    'Enterprise Value': {
        definition:
            'The total value of the company.<br />Enterprise Value = Equity Value + Debt - Cash.',
    },
    'Equity Value': {
        definition: 'The equity value of the company at a point in time.',
    },
    'Valuation Bridge': {
        definition:
            "The valuation bridge allows users to identify how a manager generates returns. Using each portfolio company's financial metrics, the valuation bridge can determine whether the total value of the fund is the result of revenue growth, margin improvement, multiple expansion, or paying down debt.",
    },
    'Equity Growth': {
        definition:
            'The amount of value created by either a company or a fund.<br />Equity Growth = Total Value - Invested Capital.',
    },
    'Revenue Growth': {
        definition:
            'Revenue growth is the proportion of equity growth that can be attributed solely to revenue from the time of investment to the most recent/exit date. A positive number means the company has been able to execute on its growth strategy.',
    },
    'Margin Improvement': {
        definition:
            'Margin Improvement is the proportion of equity growth that can be attributed to the change in EBITDA margins from the time of investment to the most recent/exit date. A positive number means the company has been able to improve its operational efficiency and earn more of its revenue as EBITDA.',
    },
    'Multiple Expansion': {
        definition:
            'Multiple Expansion is the proportion of equity growth that can be attributed to the change in the EV/EBITDA multiple from the time of investment to the most recent/exit date. A positive number essentially means the Firm was able to &quot;buy low and sell high&quot;. This may be due to the operational improvements at the company or due to favorable market timing.',
    },
    'Debt Paydown': {
        definition:
            'Debt Paydown is the proportion of equity growth that can be attributed to the change in net debt (total debt minus cash). A positive number means a company has reduced their net debt, which may be due to paying down debt or an increase in cash.',
    },
    'Other Growth': {
        definition:
            'Frequently referred to as the &quot;combination effect&quot;. It is a correction factor that identifies the combined effects of EBITDA Growth (Revenue Growth and Margin Improvement) and Multiple Expansion.',
    },

    // Misc
    'Cash Flow Type': {
        definition:
            'Cash Flow Type classifies your entities as <em>Net</em> or <em>Gross</em>. <em>Net Cash Flows</em> are analyzed in Performance Calculator, while <em>Gross Cash Flows</em> are analyzed in Deal Calculator.',
    },
    'Entity Type': {
        definition:
            "Entity Type classifies your entities based on whether it is a <em>single fund</em>, a <em>portfolio of funds</em>, a <em>Bison Fund</em> (Based on quarterly investments from Market Insights), a <em>presentation prepared by a GP</em>, or a fund or portfolio that is part of a presentation's diligence package.",
    },
    Permissions: {
        definition:
            "Permissions details the level of access you have for an entity. With <em>Read</em> you have &quot;read only&quot; access and can't edit the underlying data. With <em>Read and Write</em> you have the ability to edit cash flows and characteristics. With <em>Read, Write and Share</em> you can also share the entity with other users.",
    },
    'Shared By': {
        definition: 'Identifies the user(s) who shared the entity with you.',
    },
    'Source Investor': {
        definition:
            'The limited partner from whom we have sourced the quarterly cash flows for Bison Funds',
    },
    '# Vehicles': {
        definition:
            'Number of vehicles in this aggregated vehicle (Portfolios / Gross Funds only).',
    },
    '# Deals': {
        definition: 'Number of companies/deals.',
    },
    '# Funds': {
        definition: 'Number of funds.',
    },
    '# Deals Above Avg': {
        definition: 'Number of companies/deals that have better than average performance.',
    },
    '# Funds Above Avg': {
        definition: 'Number of funds that have better than average performance.',
    },
    Portfolio: {
        definition: 'A group of funds.',
    },
    Score: {
        definition:
            'The Bison Performance Score is the percentile placement of a fund&apos;s net multiple and net IRR against its vintage year. These two scores are then averaged to create the fund&apos;s performance score.',
    },
    Fundraising: {
        definition: 'A fund that is seeking to raise capital.',
    },
    'Performance Score': {
        definition:
            'The Bison Performance Score is the percentile placement of a fund&apos;s net multiple and net IRR against its vintage year. These two scores are then averaged to create the fund&apos;s performance score.',
    },
    'Amt Closed': {
        definition:
            'This is the amount a fund has raised to date. For funds that are fundraising, this is the interim amount they have raised from investors.',
    },
    Status: {
        definition: "This refers to a fund's fundraising status.",
    },
    'Paid in %': {
        definition: 'The % of the fund size that has been invested.',
    },

    // Enums
    'Deal Source': {
        definition:
            'Deal Source identifies whether a GP sourced an investment proprietarily or via an auction process.',
    },
    'Seller Type': {
        definition:
            'Seller Type identifies whether a GP purchased a company for a financial seller (ex. a private equity firm) or a non-financial (ex. founders, corporate spin-off).',
    },
    'Deal Role': {
        definition:
            'Deal Role identifies whether a GP was the lead investor, co-lead the deal, or was a minority investor.',
    },
    'Deal Type': {
        definition:
            'Deal Type identifies whether a GP&apos;s investment was a leveraged buyout, a recap, a growth equity round of investment, or a venture capital investment.',
    },
    Country: {
        definition: 'The country where the company is domiciled or primarily operates.',
    },
    Sector: {
        definition: 'Sector and Industry classifications as defined by Morningstar.',
    },
    Geography: {
        definition:
            'Region where fund&apos;s investment are primarily located. Regions include: Asia - Developed, Asia - Emerging, Emerging Markets, Europe - CEE & CIS, Europe - Western, Global, Latin America, MENA, North America, and Sub-Saharan Africa.',
    },
    Style: {
        definition:
            'The fund&apos;s primary investment strategy. These include: buyout, co-investment, credit, fund of funds, growth equity, infrastructure, real estate, secondaries, and venture capital.',
    },
    'Style / Focus': {
        definition:
            "Style is a fund's primary investment strategy. Focus is a subset of style that identifies funds by their specific investment strategy.",
    },
    Focus: {
        definition:
            'A subset of the investment style. For example, a buyout fund can be focused on large cap or mid cap companies.',
    },

    // Styles
    'Fund of Funds': {
        definition: 'An investment vehicle that invest in other funds.',
    },
    Buyout: {
        definition: 'An investment vehicle that invests in established businesses.',
    },

    // Geographies
    'Asia - Developed': {
        definition: 'Australia, Japan, New Zealand, Singapore, South Korea, Taiwan.',
    },
    'Asia - Emerging': {
        definition:
            'Bangladesh, Bhutan, Cambodia, China, Dem. Rep. Korea (North Korea), India, Indonesia, Lao PDR, Malaysia, Mongolia, Myanmar, Nepal, Papua New Guinea, Philippines, Sri Lanka, Vietnam',
    },
    'Emerging Markets': {
        definition:
            'Includes the geographics regions that are considered emerging, including Asia - Emerging, Europe - CEE & CIS, Latin America, MENA, and Sub-Saharan Africa',
    },
    'Europe - CEE & CIS': {
        definition:
            'Albania, Armenia, Azerbaijan, Belarus, Bosnia and Herz., Bulgaria, Croatia, Czech Rep., Estonia, Georgia, Greece, Hungary, Kazakhstan, Kosovo, Kyrgyzstan, Latvia, Lithuania, Macedonia, Moldova, Montenegro, Poland, Romania, Russia, Serbia, Slovakia, Slovenia, Tajikistan, Turkey, Turkmenistan, Ukraine, Uzbekistan',
    },
    'Europe - Western': {
        definition:
            'Austria, Belgium, Finland, France, Germany, Iceland, Ireland, Italy, Netherlands, Norway, Portugal, Spain, Sweden, Switzerland, United Kingdom',
    },
    Global: {
        definition: 'Includes all geographic regions.',
    },
    'Latin America': {
        definition: 'Mexico, Central America, and South America',
    },
    MENA: {
        definition:
            'Afghanistan, Algeria, Egypt, Iran, Iraq, Israel, Jordan, Kuwait, Lebanon, Libya, Oman, Pakistan, Saudi Arabia, Syria, Thailand, Tunisia, United Arab Emirates, Yemen',
    },
    'North America': {
        definition: 'United States and Canada',
    },
    'Sub-Saharan Africa': {
        definition:
            "Angola, Benin, Botswana, Burkina Faso, Burundi, CÃ´te d'Ivoire, Cameroon, Central African Rep., Chad, Congo, Dem. Rep. Congo, Djibouti, Eritrea, Ethiopia, Gabon, Ghana, Guinea, Kenya, Lesotho, Liberia, Madagascar, Malawi, Mali, Mauritania, Morocco, Mozambique, Namibia, Niger, Nigeria, Rwanda, S. Sudan, Senegal, Sierra Leone, Somalia, Somaliland, South Africa, Sudan, Swaziland, Tanzania, Togo, Uganda, W. Sahara, Zambia, Zimbabwe",
    },

    // Gross
    'Loss Ratio': {
        definition: 'The proportion of invested capital that has a TVPI multiple below 1.0x.',
    },
    'Holding Period': {
        title: 'Holding Period / Age',
        definition:
            'The time period passed from the date of investment to the current valuation date or the date of realization.',
    },

    // Benchmark
    Benchmark: {
        definition: "A point of reference against which the fund's performance is compared.",
        src: 'http://www.gipsstandards.org/',
    },
    'First Quartile': {
        definition: 'The Q1 number is the lower boundary for the first quartile.',
    },
    'Second Quartile': {
        definition: 'The Q2 number is the lower boundary for the second quartile.',
    },
    'Third Quartile': {
        definition: 'The Q3 number is the lower boundary for the third quartile.',
    },
    'Data Points': {
        definition: 'Number of funds in benchmark.',
    },
    Max: {
        definition: 'This is the highest reported data point for a given vintage year.',
    },
    'Upper Fence': {
        definition:
            'Q1 lower boundary plus 1.5 * the interquartile range. This data point helps identify outliers.',
    },
    'Lower Fence': {
        definition:
            'Q3 lower boundary minus  1.5* the interquartile range. This data point helps identify outliers.',
    },
    Min: {
        definition: 'This is the lowest reported data point for a given vintage year.',
    },

    // Point in time
    'Time Period': {
        definition: 'The period of time selected for the calculation.',
    },
    Duration: {
        definition: 'Number of years between beginning and end of time period.',
    },
    'Start Value': {
        definition: 'Total Value at beginning of period.',
    },
    'End Value': {
        definition: 'Total Value at end of period.',
    },
    'Compounded Time-Weighted Rate of Return': {
        definition:
            'A method of calculating period-by-period returns that negates the effects of external cash flows.',
        src: 'http://www.gipsstandards.org/',
    },

    // Metrics
    IRR: {
        definition:
            'The internal rate of return (IRR) is the implied discount rate or effective compounded rate of return that equates the present value of cash outflows (distributions + remaining value) with the present value of cash inflows (contributions) since inception.  The displayed IRR is annualized unless otherwise noted.',
        src: 'http://www.gipsstandards.org/',
    },
    'Time Zero IRR': {
        definition:
            "Time Zero IRR calculates a fund or portfolio's IRR as if the initial investment in each portfolio company occurred on the same day. This decreases the impact that an early investment may have on the entire portfolio's IRR.",
    },
    DPI: {
        definition:
            'Since inception distributions divided by since inception paid-in capital. DPI is a metric used to measure what proportion of a fund has been realized.',
        src: 'http://www.gipsstandards.org/',
    },
    RVPI: {
        definition:
            'Residual value divided by since inception paid-in capital. RVPI is a metric used to measure what portion of a fund is unrealized.',
        src: 'http://www.gipsstandards.org/',
    },
    TVPI: {
        definition:
            'Total value divided by since inception paid-in capital. TVPI, also referred to as net investment multiple, is a metric used to measure the total value created by the fund.',
        src: 'http://www.gipsstandards.org/',
    },
    Momentum: {
        definition:
            'TVPI momentum measures the velocity of a fund’s net multiple over the past three years',
        src: 'http://www.gipsstandards.org/',
    },
    Commitment: {
        definition:
            'Amount of capital committed to a fund by an investor. The capital is not drawn down at once but on an as needed basis.',
        src: 'http://www.gipsstandards.org/',
    },
    '% Commitment': {
        definition:
            'Represents how much of the total commitment has been committed to each sub vehicle.',
    },
    Unfunded: {
        definition: 'Amount of committed capital that has not been drawn down by the fund.',
        src: 'http://www.gipsstandards.org/',
    },
    '% Unfunded': {
        definition: 'Represents how much of the total unfunded is in the sub vehicle.',
    },
    'Paid In': {
        title: 'Paid In / Invested / Capital Called',
        definition: 'Amount of committed capital that has been drawn down by the fund.',
        src: 'http://www.gipsstandards.org/',
    },
    '% Paid In': {
        title: '% Paid In / % Invested',
        definition: 'Represents how much of the total paid in has been paid in to the sub vehicle.',
    },
    'Paid In %': {
        definition: 'The % of the fund size that has been invested.',
    },
    Distributed: {
        title: 'Distributed / Realized Value',
        definition:
            'Cash or stock distributed to the Limited Partners from a fund. Distributions can be recallable or non-recallable.',
        src: 'http://www.gipsstandards.org/',
    },
    '% Distributed': {
        title: '% Distributed / % Realized Value',
        definition:
            'Represents how much of the total distributed has been distributed in the sub vehicle.',
    },
    'Remaining (NAV)': {
        title: 'Remaining / Unrealized Value / NAV',
        definition: 'The equity value remaining in the fund at the end of the reporting period.',
        src: 'http://www.gipsstandards.org/',
    },
    '% Remaining (NAV)': {
        title: '% Remaining / % Unrealized Value / % NAV',
        definition: 'Represents how much of the total remaining is in the sub vehicle.',
    },
    'Total Value': {
        definition: 'Distributed plus remaining value.',
    },
    '% Total Value': {
        definition: 'Represents how much of the total value is in the sub vehicle.',
    },
    'Fund Size': {
        definition: 'The total amount of capital committed by investors to a fund.',
    },

    // Date-related
    'Vintage Year': {
        definition:
            'We define vintage year in one of two ways. (1) The year of the first close, as disclosed in SEC Form D filings, or (2) the most commonly cited vintage year as disclosed by underlying investors.',
    },
    'As of Date': {
        definition:
            'The period end date for the fund. The amounts the fund has invested, distributed and remaining are presented through this date.',
    },
    'First Close': {
        definition: 'Date of first Capital Call / Contribution.',
    },

    // PME
    'Kaplan Schoar': {
        definition:
            'Kaplan Schoar looks at the future value of the fund&apos;s contributions and distributions against a selected market index. <br/><br/>Each cash flow discounts the private equity fund&apos;s cash flows against the market&apos;s change during the time period from when each cash flow occurred to the period end date. <br><br> If the future value of distributions + NAV is greater than the FV of contributions (Kaplan Schoar > 1), the fund has outperformed the index.<br><br>You can calculate the public market multiple by dividing the fund&apos;s multiple by the Kaplan Schoar ratio.<br><br>',
    },

    'Cobalt PME': {
        definition: `Creates a set of actual market cash flows, while replicating the timing and size of the fund&apos;s cash flows<br><br>Establishes a realization ratio based on PV of distributions as a proportion of the sum of PV of distributions.<br><br>By multiplying the realization ratio by the sum of PV of contributions, we get the amount distributed from the market at each of the fund&apos;s distribution dates.<br><br>Alternatively, you can generate the market’s distributions by dividing the fund’s distribution by the Kaplan Schoar ratio.<br><br><img src="${require('src/img/bison_pme_formula.png')}" width="280px" /><br><br>`,
    },

    'PME Alpha': {
        definition:
            "This is the difference between the fund's IRR and the Cobalt PME IRR using the MSCI ACWI IMI index.",
    },

    'Roll Forward NAVs': {
        definition:
            'For a vehicle whose last NAV date occurs prior to the selected as of date, the NAV date will be rolled forward to the selected as of date.',
    },

    // PME
    'Fund Fallback': {
        definition:
            'Fall back to aggregate fund values for investments that are missing Vintage Year, IRR, DPI or TVPI. Whenever IRR, DPI or TVPI values fall back, As of Date will fall back as well. <br />Aggregate values are indicated by an asterix (*).',
    },
};
