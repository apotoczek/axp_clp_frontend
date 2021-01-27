/**
 * Endpoint Specifications
 * @module shared/libs/endpoints
 *
 * Endpoint spec, used to resolve what endpoint should be used from the
 * query and options for that endpoint.
 */

export default {
    get_classifications_for_user: {
        targets: ['user:cashflow_classifications'],
    },
    user_calculation_mappings: {
        targets: ['user:calculation_mappings'],
    },
    user_calculation_suites: {
        targets: ['user:calculation_suites'],
    },
    entity_calculation_mappings: {
        targets: ['entity:calculation_mappings'],
    },
    company_metric_pairs: {
        targets: ['company_metric_pairs'],
    },
    company_data: {
        targets: ['company_data'],
    },
    deal_data: {
        targets: ['deal_data'],
    },
    list_shares: {
        targets: ['list:shares'],
    },
    all_metrics_for_user: {
        targets: ['all_metrics_for_user'],
    },
    user_companies_metrics: {
        targets: ['user_companies_metrics'],
    },
    vehicle_metric_options: {
        targets: ['vehicle:metric_options', 'vehicle:gross:metric_options'],
    },
    vehicle_metric_analysis: {
        targets: ['vehicle:metric_analysis', 'vehicle:metric_analysis'],
    },
    metric_bases_for_client: {
        targets: ['metric_bases_for_client'],
    },
    metric_versions_for_client: {
        targets: ['metric_versions_for_client'],
    },
    metrics_for_market_data: {
        targets: ['metrics_for_market_data'],
    },
    metric_versions_for_entity: {
        targets: ['vehicle:metric_versions'],
    },
    commitments: {
        targets: ['user:commitments'],
    },
    commitment_plans_for_portfolio: {
        targets: ['commitment_plans_for_portfolio'],
    },
    metric_set: {
        targets: ['metric_set'],
    },
    csv_download_key: {
        targets: ['csv_download_key'],
    },
    editable_attribute: {
        targets: ['attribute:editable_data'],
    },
    account_client_activity: {
        targets: ['account:client_activity'],
    },
    list_remote_clients: {
        targets: ['user:list_remote_clients'],
    },
    index_shares: {
        targets: ['index:shares'],
    },
    index_data: {
        targets: ['index:data'],
    },
    user_indexes: {
        targets: ['user:indexes'],
    },
    vehicle_index_options: {
        targets: ['vehicle:index_options'],
    },
    user: {
        targets: ['user'],
    },
    client: {
        targets: ['client'],
    },
    companies: {
        targets: ['companies'],
    },
    deals: {
        targets: ['deals'],
    },
    vehicle_shares: {
        targets: ['vehicle:shares', 'vehicle:gross:shares'],
    },
    vehicle_vintage_years: {
        targets: ['vehicle:vintage_years', 'vehicle:gross:vintage_years'],
    },
    vehicle_deal_years: {
        targets: ['vehicle:deal_years', 'vehicle:gross:deal_years'],
    },
    vehicle_cashflows: {
        targets: ['vehicle:cashflows', 'vehicle:gross:cashflows'],
        backend_export: true,
    },
    editable_vehicle_cashflows: {
        targets: ['vehicle:editable_cashflows'],
        backend_export: true,
    },
    editable_vehicle_characteristics: {
        targets: ['vehicle:editable_characteristics'],
    },
    vehicle_as_of_dates: {
        targets: ['vehicle:as_of_dates', 'vehicle:gross:as_of_dates'],
    },
    'cashflow-revision-options': {
        targets: ['vehicle:revision_dates'],
    },
    vehicle_start_date_options: {
        targets: ['vehicle:start_date_options'],
    },
    user_fund_uids_in_portfolio: {
        targets: ['vehicle:uids_in_portfolio'],
    },
    filter_valuations: {
        targets: ['filter_valuations'],
    },
    derived_valuations: {
        targets: ['derived_valuations'],
    },
    addon_purchases: {
        targets: ['vehicle:addon_purchases'],
    },
    funds_with_characteristics: {
        targets: ['vehicle:funds_with_characteristics'],
    },
    vehicle_time_weighted_analysis: {
        targets: ['vehicle:time_weighted', 'vehicle:point_in_time'],
    },
    vehicle_analysis: {
        targets: ['vehicle', 'vehicle:gross'],
    },
    vehicle_overview: {
        targets: ['vehicle:overview'],
    },
    vehicle_breakdown: {
        targets: ['vehicle:breakdown'],
    },
    vehicle_pme_analysis: {
        targets: ['vehicle:pme'],
    },
    vehicle_valuation_bridge: {
        targets: ['vehicle:valuation_bridge', 'vehicle:gross:valuation_bridge'],
    },
    vehicle_breakdown_options: {
        targets: ['vehicle:breakdown_options', 'vehicle:gross:breakdown_options'],
    },
    user_vintage_years: {
        targets: ['user:vintage_years'],
    },
    user_as_of_dates: {
        targets: ['user:as_of_dates'],
    },
    user_custom_attributes: {
        targets: ['user:custom_attributes'],
    },
    user_shared_bys: {
        targets: ['user:shared_bys'],
    },
    custom_benchmark: {
        targets: ['custom_benchmark', 'benchmark'],
    },
    benchmarks: {
        targets: ['benchmarks'],
    },
    market_data: {
        targets: [
            'market_data:firms',
            'market_data:funds',
            'market_data:investors',
            'market_data:investments',
            'market_data:families',
        ],
        backend_export: true,
    },
    user_vehicles: {
        targets: ['user:vehicles'],
    },
    vehicles: {
        targets: ['vehicles'],
        backend_export: true,
    },
    sub_vehicle_options: {
        targets: ['sub_vehicle_options'],
    },
    attribute_filter_configs: {
        targets: ['filter_configs'],
    },
    cash_flow_attribute_filter_configs: {
        targets: ['cash_flow_attribute_filter_configs'],
    },
    enums: {
        targets: ['enums'],
    },
    enum_sectors: {
        targets: ['enum_sectors'],
    },
    enum_industries: {
        targets: ['enum_industries'],
    },
    static_enums: {
        targets: ['static_enums'],
    },
    classifications: {
        targets: ['classifications'],
    },
    market_data_vintage_years: {
        targets: ['vintage_years', 'market_data:vintage_years'],
    },
    pme_methodologies: {
        targets: ['pme:methodologies'],
    },
    portfolio_value_drivers: {
        targets: ['vehicle:portfolio_value_drivers'],
    },
    gross_dispersion_analysis: {
        targets: ['vehicle:gross_dispersion_analysis'],
    },
    currency_markets: {
        targets: ['currency:markets'],
    },
    vehicle_base_currency_id: {
        targets: ['vehicle:currency_id'],
    },
    vehicle_data_stats: {
        targets: ['vehicle:data_stats'],
    },
    gross_company_pme_alphas: {
        targets: ['vehicle:gross:company_pme_alphas'],
    },
    gross_growth_by_company: {
        targets: ['vehicle:gross:growth_by_company'],
    },
    gross_fund_ev_multiples: {
        targets: ['vehicle:gross:ev_multiples_by_company'],
    },
    gross_fund_dispersion_of_returns: {
        targets: ['vehicle:gross:fund_dispersion_of_returns'],
    },
    gross_fund_risk_curve: {
        targets: ['vehicle:gross:fund_risk_curve'],
    },
    smrrt_breakdown: {
        targets: ['smrrt_breakdown'],
    },
    vehicle_value_change: {
        targets: ['vehicle_value_change'],
    },
    vehicle_quartile_progression: {
        targets: ['vehicle:quartile_progression'],
    },
    vehicle_side_by_side_comparison: {
        targets: ['vehicle:side_by_side_comparison'],
    },
    vehicle_time_weighted_breakdown: {
        targets: ['vehicle:time_weighted_breakdown'],
    },
    vehicle_time_weighted_comparison: {
        targets: ['vehicle:time_weighted_comparison'],
    },
    vehicle_pme_progression: {
        targets: ['vehicle:pme_progression'],
    },
    risk_volatility_value_creator_metrics: {
        targets: ['vehicle:risk_volatility_value_creator_metrics'],
    },
    vehicle_pme_alpha_comparison: {
        targets: ['vehicle:pme_alpha_comparison'],
    },
    vehicle_volatility_comparison: {
        targets: ['vehicle:volatility_comparison'],
    },
    vehicle_peer_progression: {
        targets: ['vehicle:peer_progression'],
    },
    vehicle_metrics_progression: {
        targets: ['vehicle:metrics_progression'],
    },
    vehicle_company_metrics_progression: {
        targets: ['vehicle:company_metrics_progression'],
    },
    horizon_model_defaults: {
        targets: ['vehicle:horizon_model_defaults'],
    },
    current_exposure: {
        targets: ['vehicle:current_exposure'],
    },
    projected_vehicle_commitments: {
        targets: ['vehicle:projected_commitments'],
    },
    projected_vehicle_runoff: {
        targets: ['vehicle:projected_runoff'],
    },
    vehicle_meta_data: {
        targets: ['vehicle:meta_data', 'vehicle:gross:meta_data'],
    },
    vehicle_managers: {
        targets: ['vehicle:managers'],
    },
    pooled_analysis: {
        targets: ['pooled:analysis'],
    },
    user_currency_symbols: {
        targets: ['user:currency_symbols'],
    },
    peer_benchmark: {
        targets: ['peer_benchmark'],
    },
    deal_benchmarks: {
        targets: ['deal_benchmarks'],
    },
    benchmark_uid_for_as_of_date: {
        targets: ['benchmark:as_of_date', 'benchmark_uid_for_as_of_date'],
    },
    comp_fund_benchmark: {
        targets: ['market_data:comp_fund_benchmark'],
    },
    get_benchmark: {
        targets: ['market_data:benchmark'],
    },
    get_deal_benchmark: {
        targets: ['market_data:deal_benchmark'],
    },
    benchmark_name: {
        targets: ['market_data:benchmark_name'],
    },
    benchmark_providers: {
        targets: ['benchmark:providers'],
    },
    deal_benchmark_providers: {
        targets: ['benchmark:deal_providers'],
    },
    benchmark_presets: {
        targets: ['benchmark:presets'],
    },
    market_data_entity: {
        targets: [
            'market_data:firm',
            'market_data:fund',
            'market_data:investor',
            'market_data:investment',
            'market_data:family',
        ],
    },
    market_data_fund_timeseries: {
        targets: ['market_data:fund:timeseries'],
    },
    aggregated_investment_data: {
        targets: ['market_data:investments:aggregate'],
    },
    market_data_as_of_dates: {
        targets: ['as_of_dates', 'market_data:as_of_dates'],
    },
    research_as_of_dates: {
        targets: ['research:as_of_dates'],
    },
    research_horizon_dates: {
        targets: ['research:horizon_dates'],
    },
    research_date_bounds: {
        targets: ['research:date_bounds'],
    },
    get_saved_states: {
        targets: ['states:saved'],
    },
    events: {
        targets: ['events'],
    },
    breakdown_over_time: {
        targets: ['breakdown:over_time'],
    },
    performance_breakdown_over_time: {
        targets: ['performance_breakdown:over_time'],
    },
    market_data_funds_breakdown_options: {
        targets: ['market_data:funds:breakdown_options'],
    },
    market_data_funds_breakdown: {
        targets: ['market_data:funds:breakdown'],
    },
    investor_contacts: {
        targets: ['investor_contacts'],
    },
    investors_for_contacts: {
        targets: ['investors_for_contacts'],
    },
    get_investor_position_types: {
        targets: ['investor_position_types'],
    },
    lists: {
        targets: ['user:lists'],
    },
    list: {
        targets: ['list'],
    },
    list_entities: {
        targets: ['list:entities'],
    },
    attribute_table_columns: {
        targets: ['table_columns'],
    },
    cashflow_table_columns: {
        targets: ['cashflow_table_columns'],
    },
    editable_cashflow_table_columns: {
        targets: ['editable:cashflow_table_columns'],
    },
    company_table_columns: {
        targets: ['company_table_columns'],
    },
    attribute: {
        targets: ['attribute:data'],
    },
    custom_attributes_with_values: {
        targets: ['custom_attributes_with_values'],
    },
    editable_attributes_for_entity: {
        targets: ['entity:editable_attributes'],
    },
    editable_attribute_values_for_entity: {
        targets: ['entity:editable_attribute_values'],
    },
    attribute_values_for_entity: {
        targets: ['entity:attribute_values'],
    },
    prepare_attribute_spreadsheet: {
        targets: ['prepare_attribute_spreadsheet'],
    },
    prepare_child_attribute_spreadsheet: {
        targets: ['prepare_child_attribute_spreadsheet'],
    },
    attributes: {
        targets: ['attributes'],
    },
    visual_reports: {
        targets: ['get_visual_reports', 'visual_reports'],
    },
    visual_report: {
        targets: ['get_visual_report', 'visual_report'],
    },
    lp_scoring: {
        targets: ['lp_scoring'],
    },
    data_report_templates: {
        targets: ['data_report_templates'],
    },
    data_reports: {
        targets: ['get_data_reports', 'data_reports'],
    },
    data_report: {
        targets: ['get_data_report', 'data_report'],
    },
    investor_modeling: {
        targets: ['vehicle:investor_modeling'],
    },
    most_similar_funds_and_investors: {
        targets: ['most_similar_funds_and_investors'],
    },
    similar_funds_and_investors: {
        targets: ['similar_funds_and_investors'],
    },
    fund_modeler_reports: {
        targets: ['fund_modeler_reports'],
    },
    get_reports: {
        targets: ['get_reports'],
        backend_export: true,
    },
    get_client_users: {
        targets: ['account:users_for_client'],
    },
    client_vehicles: {
        targets: ['account:client_vehicles'],
    },
    share_history: {
        targets: ['account:share_history'],
    },
    client_admin_share: {
        targets: ['account:client_admin_share'],
    },
    most_modeled_gps_lps: {
        targets: ['most_modeled_gps_lps'],
    },
    peer_report: {
        targets: ['vehicle:peer_report'],
    },
    recent_modeler_reports_for_user: {
        targets: ['recent_modeler_reports_for_user'],
    },
    global_activity_feed: {
        targets: ['global_activity_feed'],
    },
    landing_notifications_for_user: {
        targets: ['landing_notifications_for_user'],
    },
    site_customizations: {
        targets: ['site_customizations'],
    },
    get_public_companies: {
        targets: ['get_public_companies'],
    },
    get_attached_public_companies: {
        targets: ['company:attached_public_companies'],
    },
    available_exchanges: {
        targets: ['available_exchanges'],
    },
    metric_sets: {
        targets: ['vehicle:metric_sets'],
    },
    metrics_for_user: {
        targets: ['user:metrics'],
    },
    company_metric_analysis: {
        targets: ['company_metric_analysis'],
    },
    metric_analysis_for_companies_in_entity: {
        targets: ['metric_analysis_for_companies_in_entity'],
    },
    deal_growth_vs_market: {
        targets: ['deal:growth_vs_market'],
    },
    diligence: {
        targets: ['diligence'],
    },
    diligence_entities: {
        targets: ['diligence:entities'],
    },
    diligence_list: {
        targets: ['diligence_list'],
    },
    'metric-value-trace': {
        targets: ['dataprovider/metric-value-trace'],
    },
    'client-managers': {
        targets: ['client:managers'],
    },
    'client-deal-years': {
        targets: ['client:deal_years'],
    },
    'companies-deal-data': {
        targets: ['companies:deal_data'],
    },
    fiscal_quarters: {
        targets: ['fiscal_quarters'],
    },
};
