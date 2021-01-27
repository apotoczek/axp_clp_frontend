import PropTypes from 'prop-types';
import ExtraPropTypes from 'utils/extra-prop-types';

export const companyType = PropTypes.shape({
    uid: ExtraPropTypes.uuid.isRequired,
    name: PropTypes.string.isRequired,
});

export const cashflowType = PropTypes.shape({
    uid: ExtraPropTypes.uuid.isRequired,
    fund_name: PropTypes.string.isRequired,
    company_name: PropTypes.string,
    date: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    note: PropTypes.string,
});

export const fundType = PropTypes.shape({
    uid: ExtraPropTypes.uuid.isRequired,
    name: PropTypes.string.isRequired,
});

export const dealType = PropTypes.shape({
    uid: ExtraPropTypes.uuid.isRequired,
    fund: fundType.isRequired,
    company: companyType.isRequired,
    default_currency: PropTypes.string,
    acquisition_date: PropTypes.number,
    exit_date: PropTypes.number,
    investment_amount: PropTypes.number,
    deal_team_leader: PropTypes.string,
    deal_team_second: PropTypes.string,
    country: PropTypes.string,
});
