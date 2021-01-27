export const sector = '757d3c0d-d6bf-47f3-a0b2-40417cdbc95a';
export const style = '113f2720-1cad-42ad-9a49-ba017cd3e5cc';
export const geography = 'd35a4b0d-b7c7-4ebd-a665-cb54c2077b82';

export const AccessLevel = {
    Zero: 0,
    Read: 1,
    Write: 2,
    Share: 3,
};

export const Format = {
    Money: 1,
    Percent: 2,
    Multiple: 3,
    Integer: 4,
    Float: 5,
};

export const Calculation = {
    IRR: 1,
    PAID_IN: 2,
    DISTRIBUTED: 3,
    ROLL_UP: 4,
    NAV: 5,
};

export const EntityMetaScope = {
    Fund: 1,
    Portfolio: 2,
    Company: 4,
    CashFlow: 8,
    Deal: 16,
};

export const Frequency = {
    Monthly: 1,
    Quarterly: 2,
    Yearly: 3,
};

export const PageFormat = {
    LETTER: 'letter',
    A4: 'a4',
    DASHBOARD: 'dashboard',
    LETTER_LANDSCAPE: 'letter_landscape',
    A4_LANDSCAPE: 'a4_landscape',
};

export const TimeFrame = {
    PointInTime: 0,
    Month: 1,
    Quarter: 2,
    TTM: 3,
};

export const MetricVersionType = {
    Backward: 1,
    Forward: 2,
};

export const SystemMetricType = {
    EnterpriseValue: 1,
    EquityValue: 2,
    TotalDebt: 3,
    Cash: 4,
    NetDebt: 5,
    Revenue: 6,
    Ebitda: 7,
    NumberOfEmployees: 8,
    NumberOfCustomers: 9,
    MarketValue: 10,
    NetOperatingIncome: 11,
    IncomeYield: 12,
    NumberOfUnits: 13,
    SquareFootage: 14,
    OccupancyRate: 15,
    CapitalExpenditures: 16,
    Expenses: 17,
    Cac: 18,
    Churn: 19,
    Mrr: 20,
    Arpc: 21,
    SeniorDebt: 22,
    InterestPayment: 23,
    DiscountToPar: 24,
    BreakevenPrice: 25,
};

export const CalculatedMetric = {
    EvMultiple: 'ev_multiple',
    RevenueMultiple: 'revenue_multiple',
    DebtMultiple: 'debt_multiple',
    EbitdaMargin: 'ebitda_margin',
};

export const DateParamType = {
    STATIC: 1,
    RELATIVE: 2,
    RELATIVE_GLOBAL: 3,
};

export const DateOffsetType = {
    Yearly: 4,
    Quarterly: 1,
    Monthly: 2,
    OnDate: 3,
};

export const ParamType = {
    SINGLE_SELECTION: 'singleSelection',
    DATE_SELECTION: 'dateSelection',
    TOGGLE: 'toggle',
};

export const EntityType = {
    Portfolio: 'portfolio',
    UserFund: 'userFund',
    Company: 'company',
    Deal: 'deal',
};

export const ClientType = {
    GeneralPartner: 1,
    LimitedPartner: 2,
    PortfolioCompany: 3,
    FundOfFunds: 4,
    Other: 5,
};

export const TextDataSpecType = {
    FreeText: 1,
    Attribute: 2,
};

export const FrontendDataType = {
    DateValue: 1,
};

export const CellMode = {
    ManualValue: 0,
    CalculatedValue: 1,
    DataValue: 2,
    NoValue: 3,
    DateValue: 4,
};

export const NotificationType = {
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Success: 'success',
};

export const ValueType = {
    PointInTime: 0,
    Period: 1,
};

export const PluginType = {
    Excel: 0,
};
