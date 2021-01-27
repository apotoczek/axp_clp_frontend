import {useMemo} from 'react';
import {useBackendData} from 'utils/backendConnect';

export const BASE_PATH = '/reporting-relationships';
export const BASE_CRUMB = 'My Portals';

export function useContacts(companyUid) {
    const {data: contactData} = useBackendData(
        'company-contacts/list',
        {company_uid: companyUid},
        {requiredParams: ['company_uid']},
    );

    return useMemo(() => {
        const contacts = (contactData.contacts || []).map(c => ({
            ...c,
            name: `${c.first_name} ${c.last_name}`,
        }));

        contacts.unshift({
            name: 'New Contact',
            uid: null,
        });

        return contacts;
    }, [contactData]);
}
