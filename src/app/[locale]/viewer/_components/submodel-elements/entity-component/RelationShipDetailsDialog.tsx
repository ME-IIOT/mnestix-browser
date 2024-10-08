import { Dialog, DialogContent, Typography } from '@mui/material';
import { Reference, RelationshipElement } from '@aas-core-works/aas-core3.0-typescript/types';
import { DataRow } from 'components/basics/DataRow';
import { FormattedMessage } from 'react-intl';
import { messages } from 'lib/i18n/localization';
import { useEffect, useState } from 'react';
import { showError } from 'lib/util/ErrorHandlerUtil';
import { useNotificationSpawner } from 'lib/hooks/UseNotificationSpawner';
import { useParams } from 'next/navigation';
import { useApis } from 'components/azureAuthentication/ApiProvider';

type RelationShipDetailsModalProps = {
    readonly relationship: RelationshipElement;
    readonly handleClose: () => void;
    readonly open: boolean;
};

export function RelationShipDetailsDialog(props: RelationShipDetailsModalProps) {
    const relationship = props.relationship;
    const searchParams = useParams<{ base64AasId: string }>();
    const base64AasId = searchParams.base64AasId;
    const notificationSpawner = useNotificationSpawner();

    const submodelId = relationship.second.keys[0]?.value;

    const [subIdShort, setSubIdShort] = useState<string>();
    const { repositoryClient, submodelClient } = useApis();

    useEffect(() => {
        async function _fetchSubmodels() {
            try {
                const submodelRefs = (await repositoryClient.getSubmodelReferencesFromShell(
                    base64AasId as string,
                )) as Reference[];
                const submodels = await Promise.all(
                    submodelRefs.map((ref) => submodelClient.getSubmodelById(ref.keys[0].value)),
                );
                const submodel = submodels.find((sm) => {
                    return sm.id === submodelId;
                });
                const submodelIdShort = submodel?.idShort;
                setSubIdShort(submodelIdShort as string);
            } catch (e) {
                showError(e, notificationSpawner);
            }
        }

        _fetchSubmodels();
    }, [base64AasId, submodelId]);

    return (
        <Dialog open={props.open} onClose={props.handleClose}>
            <DialogContent data-testid="bom-info-popup">
                <Typography variant="h3" sx={{ mb: 2 }}>
                    {relationship.idShort}
                </Typography>
                <DataRow title="Same entity submodel - idShort" hasDivider={false}>
                    {subIdShort || <FormattedMessage {...messages.mnestix.notAvailable} />}
                </DataRow>
                <DataRow title="Same Entity" hasDivider={false}>
                    {relationship.second.keys[relationship.second.keys.length - 1]?.value || (
                        <FormattedMessage {...messages.mnestix.notAvailable} />
                    )}
                </DataRow>
            </DialogContent>
        </Dialog>
    );
}
